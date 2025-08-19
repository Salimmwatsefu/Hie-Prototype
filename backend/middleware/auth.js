import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto-js';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/database.js';

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000000, // allow 1000 requests per minute during dev
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


// Rate limiting for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests, please try again later',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
});

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log("🔍 Incoming Authorization header:", authHeader);
  console.log("🔍 Extracted token:", token);
  console.log("🔍 JWT_SECRET at VERIFY time:", process.env.JWT_SECRET);

  if (!token) {
    await logAuditEvent(req, 'TOKEN_MISSING', 'AUTH', null, 'FAILED');
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token successfully verified. Decoded payload:", decoded);
    
    
    // Get user details from database
    const userResult = await pool.query(
      'SELECT id, email, role, first_name, last_name, nhif_id, hospital_id, is_active, mfa_enabled FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      await logAuditEvent(req, 'USER_NOT_FOUND', 'AUTH', decoded.userId, 'FAILED');
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      await logAuditEvent(req, 'ACCOUNT_DEACTIVATED', 'AUTH', user.id, 'FAILED');
      return res.status(401).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    await logAuditEvent(req, 'TOKEN_VERIFIED', 'AUTH', user.id, 'SUCCESS');
    next();
  } catch (error) {
    await logAuditEvent(req, 'TOKEN_INVALID', 'AUTH', null, 'FAILED', { error: error.message });
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based access control
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      await logAuditEvent(req, 'AUTH_REQUIRED', 'ACCESS_CONTROL', null, 'FAILED');
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logAuditEvent(req, 'ACCESS_DENIED', 'ACCESS_CONTROL', req.user.id, 'FAILED', {
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        resource: req.originalUrl
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    await logAuditEvent(req, 'ACCESS_GRANTED', 'ACCESS_CONTROL', req.user.id, 'SUCCESS', {
      userRole: req.user.role,
      resource: req.originalUrl
    });
    
    next();
  };
};

// MFA verification middleware
const requireMFA = async (req, res, next) => {
  const { mfaCode } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    // Check if user has MFA enabled
    const userResult = await pool.query(
      'SELECT mfa_enabled, mfa_secret FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    
    if (!user.mfa_enabled) {
      // If MFA is not enabled, skip verification
      return next();
    }

    if (!mfaCode) {
      await logAuditEvent(req, 'MFA_CODE_MISSING', 'MFA', userId, 'FAILED');
      return res.status(401).json({
        error: 'MFA code required',
        code: 'MFA_REQUIRED'
      });
    }

    // For demo purposes, accept specific codes
    // In production, this would verify against TOTP/SMS codes
    const validCodes = ['123456', '654321', '111111'];
    
    if (!validCodes.includes(mfaCode)) {
      await logAuditEvent(req, 'MFA_INVALID', 'MFA', userId, 'FAILED');
      return res.status(401).json({
        error: 'Invalid MFA code',
        code: 'INVALID_MFA'
      });
    }

    await logAuditEvent(req, 'MFA_VERIFIED', 'MFA', userId, 'SUCCESS');
    next();
  } catch (error) {
    await logAuditEvent(req, 'MFA_ERROR', 'MFA', userId, 'ERROR', { error: error.message });
    console.error('MFA verification error:', error);
    return res.status(500).json({
      error: 'MFA verification failed',
      code: 'MFA_ERROR'
    });
  }
};

// Data encryption utilities
const encryptSensitiveData = (data) => {
  const key = process.env.ENCRYPTION_KEY || 'hie-default-key-change-in-production-256bit';
  return crypto.AES.encrypt(JSON.stringify(data), key).toString();
};

const decryptSensitiveData = (encryptedData) => {
  const key = process.env.ENCRYPTION_KEY || 'hie-default-key-change-in-production-256bit';
  const bytes = crypto.AES.decrypt(encryptedData, key);
  return JSON.parse(bytes.toString(crypto.enc.Utf8));
};

// Audit logging middleware
const auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log the action after response
        const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILED';
        logAuditEvent(req, action, resourceType, req.params.id || null, status);
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next();
    }
  };
};

// Enhanced audit logging function
const logAuditEvent = async (req, action, resourceType, resourceId, status, details = {}) => {
  try {
    const auditData = {
      user_id: req.user?.id || null,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      status: status,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      details: JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
        ...details
      })
    };

    // Store in database
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, status, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      auditData.user_id,
      auditData.action,
      auditData.resource_type,
      auditData.resource_id,
      auditData.status,
      auditData.details,
      auditData.ip_address,
      auditData.user_agent
    ]);

    // Also log to console for development
    console.log('AUDIT_LOG:', JSON.stringify(auditData));
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

// Password hashing utilities
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: `${user.first_name} ${user.last_name}`,
    hospitalId: user.hospital_id,
    nhifId: user.nhif_id
  };

  console.log("🛠 JWT_SECRET at SIGN time:", process.env.JWT_SECRET);
  console.log("🛠 Payload being signed:", payload);

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'hie-system',
    audience: 'hie-users'
  });
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'hie-system',
    audience: 'hie-users'
  });
};

// Generate MFA secret (for demo purposes)
const generateMFASecret = () => {
  return crypto.lib.WordArray.random(128/8).toString();
};

// Validate FHIR compliance
const validateFHIRCompliance = (req, res, next) => {
  // Add FHIR-compliant headers
  res.set({
    'Content-Type': 'application/fhir+json',
    'X-FHIR-Version': '4.0.1',
    'X-HIE-Compliance': 'FHIR-R4'
  });
  
  next();
};

export {
  authLimiter,
  apiLimiter,
  authenticateToken,
  requireRole,
  requireMFA,
  encryptSensitiveData,
  decryptSensitiveData,
  auditLog,
  logAuditEvent,
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  generateMFASecret,
  validateFHIRCompliance
};


