import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole, auditLog } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all patients (with pagination and search)
router.get('/', requireRole(['doctor', 'nurse', 'admin']), auditLog('VIEW_PATIENTS', 'PATIENT'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', hospital } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, COUNT(*) OVER() as total_count
      FROM patients p
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.nhif_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }


    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const patients = result.rows;
    const totalCount = patients.length > 0 ? parseInt(patients[0].total_count) : 0;

    res.json({
      patients: patients.map(p => ({
        id: p.id,
        nhifId: p.nhif_id,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.date_of_birth,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        createdAt: p.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', [
  param('id').isUUID()
], requireRole(['doctor', 'nurse', 'admin']), auditLog('VIEW_PATIENT', 'PATIENT'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'id', mr.id,
                 'hospitalId', mr.hospital_id,
                 'visitDate', mr.visit_date,
                 'diagnosis', mr.diagnosis,
                 'treatment', mr.treatment,
                 'medications', mr.medications,
                 'vitalSigns', mr.vital_signs,
                 'notes', mr.notes
               ) ORDER BY mr.visit_date DESC
             ) FILTER (WHERE mr.id IS NOT NULL) as medical_records
      FROM patients p
      LEFT JOIN medical_records mr ON p.id = mr.patient_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = result.rows[0];

    res.json({
      id: patient.id,
      nhifId: patient.nhif_id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergency_contact,
      medicalHistory: patient.medical_history,
      allergies: patient.allergies,
      currentMedications: patient.current_medications,
      insuranceInfo: patient.insurance_info,
      medicalRecords: patient.medical_records || [],
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/patient', [
  body('nhifId').notEmpty().trim(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().trim(),
  body('emergencyContact').optional().isObject(),
  body('medicalHistory').optional().isObject(),
  body('allergies').optional().isArray(),
  body('currentMedications').optional().isObject(),
  body('insuranceInfo').optional().isObject()
], requireRole(['doctor', 'admin']), auditLog('CREATE_PATIENT', 'PATIENT'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      nhifId, firstName, lastName, dateOfBirth, gender, phone, email, address,
      emergencyContact, medicalHistory, allergies, currentMedications, insuranceInfo
    } = req.body;

    // Check if patient with NHIF ID already exists
    const existingPatient = await pool.query('SELECT id FROM patients WHERE nhif_id = $1', [nhifId]);
    if (existingPatient.rows.length > 0) {
      return res.status(409).json({ error: 'Patient with this NHIF ID already exists' });
    }

    const result = await pool.query(`
      INSERT INTO patients (
        nhif_id, first_name, last_name, date_of_birth, gender, phone, email, address,
        emergency_contact, medical_history, allergies, current_medications, insurance_info
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      nhifId, firstName, lastName, dateOfBirth, gender, phone, email, address,
      JSON.stringify(emergencyContact), JSON.stringify(medicalHistory), 
      allergies, JSON.stringify(currentMedications), JSON.stringify(insuranceInfo)
    ]);

    const patient = result.rows[0];

    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: patient.id,
        nhifId: patient.nhif_id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        emergencyContact: patient.emergency_contact,
        medicalHistory: patient.medical_history,
        allergies: patient.allergies,
        currentMedications: patient.current_medications,
        insuranceInfo: patient.insurance_info,
        createdAt: patient.created_at
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/patient/:id', [
  param('id').isUUID(),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().trim(),
  body('emergencyContact').optional().isObject(),
  body('medicalHistory').optional().isObject(),
  body('allergies').optional().isArray(),
  body('currentMedications').optional().isObject(),
  body('insuranceInfo').optional().isObject()
], requireRole(['doctor', 'admin']), auditLog('UPDATE_PATIENT', 'PATIENT'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      firstName, lastName, dateOfBirth, gender, phone, email, address,
      emergencyContact, medicalHistory, allergies, currentMedications, insuranceInfo
    } = req.body;

    const result = await pool.query(`
      UPDATE patients 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          date_of_birth = COALESCE($3, date_of_birth),
          gender = COALESCE($4, gender),
          phone = COALESCE($5, phone),
          email = COALESCE($6, email),
          address = COALESCE($7, address),
          emergency_contact = COALESCE($8, emergency_contact),
          medical_history = COALESCE($9, medical_history),
          allergies = COALESCE($10, allergies),
          current_medications = COALESCE($11, current_medications),
          insurance_info = COALESCE($12, insurance_info),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      firstName, lastName, dateOfBirth, gender, phone, email, address,
      emergencyContact ? JSON.stringify(emergencyContact) : null,
      medicalHistory ? JSON.stringify(medicalHistory) : null,
      allergies,
      currentMedications ? JSON.stringify(currentMedications) : null,
      insuranceInfo ? JSON.stringify(insuranceInfo) : null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = result.rows[0];

    res.json({
      message: 'Patient updated successfully',
      patient: {
        id: patient.id,
        nhifId: patient.nhif_id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        emergencyContact: patient.emergency_contact,
        medicalHistory: patient.medical_history,
        allergies: patient.allergies,
        currentMedications: patient.current_medications,
        insuranceInfo: patient.insurance_info,
        updatedAt: patient.updated_at
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Search patients by NHIF ID
router.get('/search/nhif/:nhifId', [
  param('nhifId').notEmpty().trim()
], requireRole(['doctor', 'nurse', 'admin']), auditLog('SEARCH_PATIENT_NHIF', 'PATIENT'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nhifId } = req.params;

    const result = await pool.query(`
      SELECT id, nhif_id, first_name, last_name, date_of_birth, gender, phone, email, created_at
      FROM patients 
      WHERE nhif_id = $1
    `, [nhifId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = result.rows[0];

    res.json({
      id: patient.id,
      nhifId: patient.nhif_id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      createdAt: patient.created_at
    });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({ error: 'Failed to search patient' });
  }
});

export default router;


