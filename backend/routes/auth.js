const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { 
  authLimiter, 
  authenticateToken, 
  auditLog,
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  generateMFASecret,
  logAuditEvent,
  requireMFA
} = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['doctor', 'nurse', 'admin']),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('nhifId').optional().trim(),
  body('hospitalId').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAuditEvent(req, 'REGISTER_VALIDATION_ERROR', 'USER', null, 'FAILED', { errors: errors.array() });
      return res.status(400).json({ 
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array() 
      });
    }

    const { email, password, role, firstName, lastName, nhifId, hospitalId } = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await logAuditEvent(req, 'REGISTER_USER_EXISTS', 'USER', null, 'FAILED', { email });
      return res.status(409).json({ 
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new user
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, nhif_id, hospital_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role, first_name, last_name, nhif_id, hospital_id, created_at
    `, [email, passwordHash, role, firstName, lastName, nhifId, hospitalId]);

    const user = result.rows[0];

    await logAuditEvent(req, 'USER_REGISTERED', 'USER', user.id, 'SUCCESS');

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        nhifId: user.nhif_id,
        hospitalId: user.hospital_id,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    await logAuditEvent(req, 'REGISTER_ERROR', 'USER', null, 'ERROR', { error: error.message });
    res.status(500).json({ 
      error: 'Registration failed',
      code: 'SERVER_ERROR'
    });
  }
});

// OAuth 2.0 Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('mfaCode').optional().isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAuditEvent(req, 'LOGIN_VALIDATION_ERROR', 'AUTH', null, 'FAILED', { errors: errors.array() });
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password, mfaCode } = req.body;

    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      await logAuditEvent(req, 'LOGIN_USER_NOT_FOUND', 'AUTH', null, 'FAILED', { email });
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await logAuditEvent(req, 'LOGIN_INVALID_PASSWORD', 'AUTH', user.id, 'FAILED');
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if MFA is enabled for user
    if (user.mfa_enabled) {
      if (!mfaCode) {
        await logAuditEvent(req, 'LOGIN_MFA_REQUIRED', 'AUTH', user.id, 'PENDING');
        return res.status(200).json({
          message: 'MFA code required',
          code: 'MFA_REQUIRED',
          requiresMFA: true,
          tempToken: jwt.sign(
            { userId: user.id, step: 'mfa_pending' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
          )
        });
      }

      // Verify MFA code (demo implementation)
      const validCodes = ['123456', '654321', '111111'];
      if (!validCodes.includes(mfaCode)) {
        await logAuditEvent(req, 'LOGIN_INVALID_MFA', 'AUTH', user.id, 'FAILED');
        return res.status(401).json({
          error: 'Invalid MFA code',
          code: 'INVALID_MFA'
        });
      }
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2',
      [refreshToken, user.id]
    );

    await logAuditEvent(req, 'LOGIN_SUCCESS', 'AUTH', user.id, 'SUCCESS');

    // Return user data and tokens
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        hospitalId: user.hospital_id,
        nhifId: user.nhif_id,
        mfaEnabled: user.mfa_enabled
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    await logAuditEvent(req, 'LOGIN_ERROR', 'AUTH', null, 'ERROR', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// MFA verification endpoint
router.post('/verify-mfa', [
  body('tempToken').notEmpty(),
  body('mfaCode').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { tempToken, mfaCode } = req.body;

    // Verify temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.step !== 'mfa_pending') {
      return res.status(401).json({
        error: 'Invalid temporary token',
        code: 'INVALID_TEMP_TOKEN'
      });
    }

    // Get user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Verify MFA code
    const validCodes = ['123456', '654321', '111111'];
    if (!validCodes.includes(mfaCode)) {
      await logAuditEvent(req, 'MFA_VERIFICATION_FAILED', 'AUTH', user.id, 'FAILED');
      return res.status(401).json({
        error: 'Invalid MFA code',
        code: 'INVALID_MFA'
      });
    }

    // Generate final tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await pool.query(
      'UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2',
      [refreshToken, user.id]
    );

    await logAuditEvent(req, 'MFA_LOGIN_SUCCESS', 'AUTH', user.id, 'SUCCESS');

    res.json({
      message: 'MFA verification successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        hospitalId: user.hospital_id,
        nhifId: user.nhif_id,
        mfaEnabled: user.mfa_enabled
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Token refresh endpoint
router.post('/refresh', [
  body('refreshToken').notEmpty()
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Get user and verify refresh token
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND refresh_token = $2 AND is_active = true',
      [decoded.userId, refreshToken]
    );

    if (userResult.rows.length === 0) {
      await logAuditEvent(req, 'REFRESH_TOKEN_INVALID', 'AUTH', decoded.userId, 'FAILED');
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.id]
    );

    await logAuditEvent(req, 'TOKEN_REFRESHED', 'AUTH', user.id, 'SUCCESS');

    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, hospital_id, nhif_id, mfa_enabled, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    await logAuditEvent(req, 'PROFILE_VIEWED', 'USER', user.id, 'SUCCESS');

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        hospitalId: user.hospital_id,
        nhifId: user.nhif_id,
        mfaEnabled: user.mfa_enabled,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('nhifId').optional().trim(),
  body('hospitalId').optional().notEmpty().trim()
], auditLog('UPDATE_PROFILE', 'USER'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array() 
      });
    }

    const { firstName, lastName, nhifId, hospitalId } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          nhif_id = COALESCE($3, nhif_id),
          hospital_id = COALESCE($4, hospital_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, email, role, first_name, last_name, nhif_id, hospital_id
    `, [firstName, lastName, nhifId, hospitalId, userId]);

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        nhifId: user.nhif_id,
        hospitalId: user.hospital_id
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      code: 'SERVER_ERROR'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current password hash
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      await logAuditEvent(req, 'PASSWORD_CHANGE_INVALID_CURRENT', 'USER', userId, 'FAILED');
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newPasswordHash, userId]);

    await logAuditEvent(req, 'PASSWORD_CHANGED', 'USER', userId, 'SUCCESS');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'SERVER_ERROR'
    });
  }
});

// Enable MFA
router.post('/enable-mfa', authenticateToken, async (req, res) => {
  try {
    const mfaSecret = generateMFASecret();

    await pool.query(
      'UPDATE users SET mfa_enabled = true, mfa_secret = $1 WHERE id = $2',
      [mfaSecret, req.user.id]
    );

    await logAuditEvent(req, 'MFA_ENABLED', 'USER', req.user.id, 'SUCCESS');

    res.json({
      message: 'MFA enabled successfully',
      secret: mfaSecret, // In production, this would be a QR code
      backupCodes: ['123456', '654321', '111111'] // Demo backup codes
    });

  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Disable MFA
router.post('/disable-mfa', authenticateToken, requireMFA, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
      [req.user.id]
    );

    await logAuditEvent(req, 'MFA_DISABLED', 'USER', req.user.id, 'SUCCESS');

    res.json({
      message: 'MFA disabled successfully'
    });

  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token from database
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.id]
    );

    await logAuditEvent(req, 'LOGOUT', 'AUTH', req.user.id, 'SUCCESS');

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;

