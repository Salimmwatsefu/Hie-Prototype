const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get fraud alerts (with pagination and filtering)
router.get('/alerts', requireRole(['doctor', 'admin']), auditLog('VIEW_FRAUD_ALERTS', 'FRAUD'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      riskLevel, 
      hospitalId, 
      reviewed, 
      startDate, 
      endDate 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT fl.*, p.nhif_id, p.first_name, p.last_name, 
             r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
      FROM fraud_logs fl
      JOIN patients p ON fl.patient_id = p.id
      LEFT JOIN users r ON fl.reviewer_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by risk level
    if (riskLevel) {
      paramCount++;
      query += ` AND fl.risk_level = $${paramCount}`;
      params.push(riskLevel);
    }

    // Filter by hospital
    if (hospitalId) {
      paramCount++;
      query += ` AND fl.hospital_id = $${paramCount}`;
      params.push(hospitalId);
    } else if (req.user.role !== 'admin' && req.user.hospital_id) {
      // Non-admin users can only see alerts from their hospital
      paramCount++;
      query += ` AND fl.hospital_id = $${paramCount}`;
      params.push(req.user.hospital_id);
    }

    // Filter by review status
    if (reviewed !== undefined) {
      paramCount++;
      query += ` AND fl.reviewed = $${paramCount}`;
      params.push(reviewed === 'true');
    }

    // Filter by date range
    if (startDate) {
      paramCount++;
      query += ` AND fl.detected_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND fl.detected_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY fl.fraud_score DESC, fl.detected_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM fraud_logs fl
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (riskLevel) {
      countParamCount++;
      countQuery += ` AND fl.risk_level = $${countParamCount}`;
      countParams.push(riskLevel);
    }

    if (hospitalId) {
      countParamCount++;
      countQuery += ` AND fl.hospital_id = $${countParamCount}`;
      countParams.push(hospitalId);
    } else if (req.user.role !== 'admin' && req.user.hospital_id) {
      countParamCount++;
      countQuery += ` AND fl.hospital_id = $${countParamCount}`;
      countParams.push(req.user.hospital_id);
    }

    if (reviewed !== undefined) {
      countParamCount++;
      countQuery += ` AND fl.reviewed = $${countParamCount}`;
      countParams.push(reviewed === 'true');
    }

    if (startDate) {
      countParamCount++;
      countQuery += ` AND fl.detected_at >= $${countParamCount}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countParamCount++;
      countQuery += ` AND fl.detected_at <= $${countParamCount}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    const fraudAlerts = result.rows.map(alert => ({
      id: alert.id,
      patientId: alert.patient_id,
      patientNhifId: alert.nhif_id,
      patientName: `${alert.first_name} ${alert.last_name}`,
      claimId: alert.claim_id,
      hospitalId: alert.hospital_id,
      fraudScore: parseFloat(alert.fraud_score),
      riskLevel: alert.risk_level,
      flags: alert.flags,
      modelVersion: alert.model_version,
      detectedAt: alert.detected_at,
      reviewed: alert.reviewed,
      reviewerId: alert.reviewer_id,
      reviewerName: alert.reviewer_first_name && alert.reviewer_last_name 
        ? `${alert.reviewer_first_name} ${alert.reviewer_last_name}` 
        : null,
      reviewNotes: alert.review_notes
    }));

    res.json({
      fraudAlerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
});

// Get fraud alert by ID
router.get('/alerts/:id', [
  param('id').isUUID()
], requireRole(['doctor', 'admin']), auditLog('VIEW_FRAUD_ALERT', 'FRAUD'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await pool.query(`
      SELECT fl.*, p.nhif_id, p.first_name, p.last_name, p.date_of_birth, p.gender,
             r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
      FROM fraud_logs fl
      JOIN patients p ON fl.patient_id = p.id
      LEFT JOIN users r ON fl.reviewer_id = r.id
      WHERE fl.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fraud alert not found' });
    }

    const alert = result.rows[0];

    // Check if user has access to this alert
    if (req.user.role !== 'admin' && req.user.hospital_id !== alert.hospital_id) {
      return res.status(403).json({ error: 'Access denied to this fraud alert' });
    }

    res.json({
      id: alert.id,
      patientId: alert.patient_id,
      patient: {
        nhifId: alert.nhif_id,
        name: `${alert.first_name} ${alert.last_name}`,
        dateOfBirth: alert.date_of_birth,
        gender: alert.gender
      },
      claimId: alert.claim_id,
      hospitalId: alert.hospital_id,
      fraudScore: parseFloat(alert.fraud_score),
      riskLevel: alert.risk_level,
      flags: alert.flags,
      modelVersion: alert.model_version,
      detectedAt: alert.detected_at,
      reviewed: alert.reviewed,
      reviewerId: alert.reviewer_id,
      reviewerName: alert.reviewer_first_name && alert.reviewer_last_name 
        ? `${alert.reviewer_first_name} ${alert.reviewer_last_name}` 
        : null,
      reviewNotes: alert.review_notes
    });
  } catch (error) {
    console.error('Get fraud alert error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud alert' });
  }
});

// Review fraud alert
router.put('/alerts/:id/review', [
  param('id').isUUID(),
  body('reviewNotes').optional().trim(),
  body('action').isIn(['approve', 'flag', 'investigate'])
], requireRole(['doctor', 'admin']), auditLog('REVIEW_FRAUD_ALERT', 'FRAUD'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reviewNotes, action } = req.body;
    const reviewerId = req.user.id;

    // Check if alert exists and user has access
    const alertResult = await pool.query(`
      SELECT hospital_id FROM fraud_logs WHERE id = $1
    `, [id]);

    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fraud alert not found' });
    }

    const alert = alertResult.rows[0];

    if (req.user.role !== 'admin' && req.user.hospital_id !== alert.hospital_id) {
      return res.status(403).json({ error: 'Access denied to this fraud alert' });
    }

    // Update the fraud alert
    const result = await pool.query(`
      UPDATE fraud_logs 
      SET reviewed = true, 
          reviewer_id = $1, 
          review_notes = $2
      WHERE id = $3
      RETURNING *
    `, [reviewerId, reviewNotes, id]);

    const updatedAlert = result.rows[0];

    res.json({
      message: 'Fraud alert reviewed successfully',
      alert: {
        id: updatedAlert.id,
        reviewed: updatedAlert.reviewed,
        reviewerId: updatedAlert.reviewer_id,
        reviewNotes: updatedAlert.review_notes,
        action: action
      }
    });
  } catch (error) {
    console.error('Review fraud alert error:', error);
    res.status(500).json({ error: 'Failed to review fraud alert' });
  }
});

// Create fraud alert (typically called by fraud detection service)
router.post('/alerts', [
  body('patientId').isUUID(),
  body('claimId').optional().trim(),
  body('hospitalId').notEmpty().trim(),
  body('fraudScore').isFloat({ min: 0, max: 1 }),
  body('riskLevel').isIn(['low', 'medium', 'high']),
  body('flags').isObject(),
  body('modelVersion').optional().trim()
], requireRole(['admin']), auditLog('CREATE_FRAUD_ALERT', 'FRAUD'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, claimId, hospitalId, fraudScore, riskLevel, flags, modelVersion } = req.body;

    // Check if patient exists
    const patientResult = await pool.query('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const result = await pool.query(`
      INSERT INTO fraud_logs (patient_id, claim_id, hospital_id, fraud_score, risk_level, flags, model_version)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [patientId, claimId, hospitalId, fraudScore, riskLevel, JSON.stringify(flags), modelVersion]);

    const fraudAlert = result.rows[0];

    res.status(201).json({
      message: 'Fraud alert created successfully',
      alert: {
        id: fraudAlert.id,
        patientId: fraudAlert.patient_id,
        claimId: fraudAlert.claim_id,
        hospitalId: fraudAlert.hospital_id,
        fraudScore: parseFloat(fraudAlert.fraud_score),
        riskLevel: fraudAlert.risk_level,
        flags: fraudAlert.flags,
        modelVersion: fraudAlert.model_version,
        detectedAt: fraudAlert.detected_at
      }
    });
  } catch (error) {
    console.error('Create fraud alert error:', error);
    res.status(500).json({ error: 'Failed to create fraud alert' });
  }
});

// Get fraud statistics
router.get('/stats/summary', requireRole(['admin']), auditLog('VIEW_FRAUD_STATS', 'FRAUD'), async (req, res) => {
  try {
    const { startDate, endDate, hospitalId } = req.query;

    let dateFilter = '';
    let hospitalFilter = '';
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      dateFilter += ` AND detected_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      dateFilter += ` AND detected_at <= $${paramCount}`;
      params.push(endDate);
    }

    if (hospitalId) {
      paramCount++;
      hospitalFilter += ` AND hospital_id = $${paramCount}`;
      params.push(hospitalId);
    }

    // Get total alerts count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM fraud_logs WHERE 1=1 ${dateFilter} ${hospitalFilter}
    `, params);

    // Get alerts by risk level
    const riskStatsResult = await pool.query(`
      SELECT risk_level, COUNT(*) as count
      FROM fraud_logs 
      WHERE 1=1 ${dateFilter} ${hospitalFilter}
      GROUP BY risk_level
      ORDER BY 
        CASE risk_level 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END
    `, params);

    // Get review status stats
    const reviewStatsResult = await pool.query(`
      SELECT reviewed, COUNT(*) as count
      FROM fraud_logs 
      WHERE 1=1 ${dateFilter} ${hospitalFilter}
      GROUP BY reviewed
    `, params);

    // Get average fraud score
    const avgScoreResult = await pool.query(`
      SELECT AVG(fraud_score) as avg_score
      FROM fraud_logs 
      WHERE 1=1 ${dateFilter} ${hospitalFilter}
    `, params);

    // Get daily fraud detection trend (last 30 days)
    const trendResult = await pool.query(`
      SELECT DATE(detected_at) as date, COUNT(*) as count, AVG(fraud_score) as avg_score
      FROM fraud_logs 
      WHERE detected_at >= CURRENT_DATE - INTERVAL '30 days' ${dateFilter} ${hospitalFilter}
      GROUP BY DATE(detected_at)
      ORDER BY date DESC
    `, params);

    // Get top hospitals with fraud alerts
    const hospitalStatsResult = await pool.query(`
      SELECT hospital_id, COUNT(*) as count, AVG(fraud_score) as avg_score
      FROM fraud_logs 
      WHERE 1=1 ${dateFilter} ${hospitalFilter}
      GROUP BY hospital_id
      ORDER BY count DESC
      LIMIT 10
    `, params);

    res.json({
      summary: {
        totalAlerts: parseInt(totalResult.rows[0].total),
        averageFraudScore: parseFloat(avgScoreResult.rows[0].avg_score || 0).toFixed(4),
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      },
      riskLevelStats: riskStatsResult.rows.map(row => ({
        riskLevel: row.risk_level,
        count: parseInt(row.count)
      })),
      reviewStats: reviewStatsResult.rows.map(row => ({
        reviewed: row.reviewed,
        count: parseInt(row.count)
      })),
      dailyTrend: trendResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
        averageScore: parseFloat(row.avg_score).toFixed(4)
      })),
      hospitalStats: hospitalStatsResult.rows.map(row => ({
        hospitalId: row.hospital_id,
        alertCount: parseInt(row.count),
        averageScore: parseFloat(row.avg_score).toFixed(4)
      }))
    });
  } catch (error) {
    console.error('Get fraud stats error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud statistics' });
  }
});

module.exports = router;

