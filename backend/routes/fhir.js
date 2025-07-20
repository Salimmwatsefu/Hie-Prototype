const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// FHIR Patient Resource Converter
const convertToFHIRPatient = (patient) => {
  return {
    resourceType: "Patient",
    id: patient.id,
    meta: {
      versionId: "1",
      lastUpdated: patient.updated_at || patient.created_at,
      profile: ["http://hl7.org/fhir/StructureDefinition/Patient"]
    },
    identifier: [
      {
        use: "official",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number"
            }
          ]
        },
        system: "http://nhif.go.ke/identifier/nhif-id",
        value: patient.nhif_id
      }
    ],
    active: true,
    name: [
      {
        use: "official",
        family: patient.last_name,
        given: [patient.first_name]
      }
    ],
    telecom: [
      ...(patient.phone ? [{
        system: "phone",
        value: patient.phone,
        use: "mobile"
      }] : []),
      ...(patient.email ? [{
        system: "email",
        value: patient.email,
        use: "home"
      }] : [])
    ],
    gender: patient.gender,
    birthDate: patient.date_of_birth,
    address: patient.address ? [
      {
        use: "home",
        type: "physical",
        text: patient.address
      }
    ] : [],
    contact: patient.emergency_contact ? [
      {
        relationship: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                code: "C",
                display: "Emergency Contact"
              }
            ]
          }
        ],
        name: {
          text: patient.emergency_contact.name
        },
        telecom: [
          {
            system: "phone",
            value: patient.emergency_contact.phone
          }
        ]
      }
    ] : []
  };
};

// FHIR Observation Resource Converter (for vital signs)
const convertToFHIRObservation = (vitalSigns, patientId, recordId) => {
  const observations = [];
  
  if (vitalSigns.bloodPressure) {
    observations.push({
      resourceType: "Observation",
      id: `${recordId}-bp`,
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs"
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "85354-9",
            display: "Blood pressure panel with all children optional"
          }
        ]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      component: [
        {
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8480-6",
                display: "Systolic blood pressure"
              }
            ]
          },
          valueQuantity: {
            value: vitalSigns.bloodPressure.systolic,
            unit: "mmHg",
            system: "http://unitsofmeasure.org",
            code: "mm[Hg]"
          }
        },
        {
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8462-4",
                display: "Diastolic blood pressure"
              }
            ]
          },
          valueQuantity: {
            value: vitalSigns.bloodPressure.diastolic,
            unit: "mmHg",
            system: "http://unitsofmeasure.org",
            code: "mm[Hg]"
          }
        }
      ]
    });
  }

  if (vitalSigns.temperature) {
    observations.push({
      resourceType: "Observation",
      id: `${recordId}-temp`,
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs"
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "8310-5",
            display: "Body temperature"
          }
        ]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      valueQuantity: {
        value: vitalSigns.temperature,
        unit: "Cel",
        system: "http://unitsofmeasure.org",
        code: "Cel"
      }
    });
  }

  return observations;
};

// Get FHIR Patient by ID
router.get('/Patient/:id', [
  param('id').isUUID()
], requireRole(['doctor', 'nurse', 'admin']), auditLog('FHIR_GET_PATIENT', 'PATIENT'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "not-found",
            diagnostics: "Patient not found"
          }
        ]
      });
    }

    const patient = result.rows[0];
    const fhirPatient = convertToFHIRPatient(patient);

    res.json(fhirPatient);
  } catch (error) {
    console.error('FHIR get patient error:', error);
    res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "exception",
          diagnostics: "Internal server error"
        }
      ]
    });
  }
});

// Search FHIR Patients
router.get('/Patient', requireRole(['doctor', 'nurse', 'admin']), auditLog('FHIR_SEARCH_PATIENTS', 'PATIENT'), async (req, res) => {
  try {
    const { identifier, name, birthdate, gender, _count = 10, _offset = 0 } = req.query;

    let query = 'SELECT * FROM patients WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Search by NHIF identifier
    if (identifier) {
      paramCount++;
      query += ` AND nhif_id = $${paramCount}`;
      params.push(identifier);
    }

    // Search by name
    if (name) {
      paramCount++;
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${name}%`);
    }

    // Search by birth date
    if (birthdate) {
      paramCount++;
      query += ` AND date_of_birth = $${paramCount}`;
      params.push(birthdate);
    }

    // Search by gender
    if (gender) {
      paramCount++;
      query += ` AND gender = $${paramCount}`;
      params.push(gender);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(_count, _offset);

    const result = await pool.query(query, params);
    const patients = result.rows;

    const bundle = {
      resourceType: "Bundle",
      id: `search-${Date.now()}`,
      type: "searchset",
      total: patients.length,
      entry: patients.map(patient => ({
        fullUrl: `${process.env.FHIR_BASE_URL}/Patient/${patient.id}`,
        resource: convertToFHIRPatient(patient)
      }))
    };

    res.json(bundle);
  } catch (error) {
    console.error('FHIR search patients error:', error);
    res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "exception",
          diagnostics: "Internal server error"
        }
      ]
    });
  }
});

// Get FHIR Observations for a patient
router.get('/Observation', requireRole(['doctor', 'nurse', 'admin']), auditLog('FHIR_GET_OBSERVATIONS', 'OBSERVATION'), async (req, res) => {
  try {
    const { patient, category, code } = req.query;

    if (!patient) {
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "required",
            diagnostics: "Patient parameter is required"
          }
        ]
      });
    }

    const result = await pool.query(`
      SELECT mr.*, p.id as patient_id
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE p.id = $1 AND mr.vital_signs IS NOT NULL
      ORDER BY mr.visit_date DESC
    `, [patient]);

    const observations = [];
    
    result.rows.forEach(record => {
      if (record.vital_signs) {
        const vitalObservations = convertToFHIRObservation(record.vital_signs, record.patient_id, record.id);
        observations.push(...vitalObservations);
      }
    });

    const bundle = {
      resourceType: "Bundle",
      id: `observations-${Date.now()}`,
      type: "searchset",
      total: observations.length,
      entry: observations.map(obs => ({
        fullUrl: `${process.env.FHIR_BASE_URL}/Observation/${obs.id}`,
        resource: obs
      }))
    };

    res.json(bundle);
  } catch (error) {
    console.error('FHIR get observations error:', error);
    res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "exception",
          diagnostics: "Internal server error"
        }
      ]
    });
  }
});

// Create/Update FHIR Patient
router.put('/Patient/:id', [
  param('id').isUUID(),
  body('resourceType').equals('Patient'),
  body('identifier').isArray(),
  body('name').isArray(),
  body('gender').isIn(['male', 'female', 'other', 'unknown'])
], requireRole(['doctor', 'admin']), auditLog('FHIR_UPDATE_PATIENT', 'PATIENT'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: errors.array().map(error => ({
          severity: "error",
          code: "invalid",
          diagnostics: error.msg
        }))
      });
    }

    const { id } = req.params;
    const fhirPatient = req.body;

    // Extract data from FHIR resource
    const nhifId = fhirPatient.identifier?.find(id => id.system === "http://nhif.go.ke/identifier/nhif-id")?.value;
    const name = fhirPatient.name?.[0];
    const firstName = name?.given?.[0];
    const lastName = name?.family;
    const phone = fhirPatient.telecom?.find(t => t.system === "phone")?.value;
    const email = fhirPatient.telecom?.find(t => t.system === "email")?.value;
    const address = fhirPatient.address?.[0]?.text;

    if (!nhifId || !firstName || !lastName) {
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "required",
            diagnostics: "NHIF ID, first name, and last name are required"
          }
        ]
      });
    }

    const result = await pool.query(`
      UPDATE patients 
      SET nhif_id = $1, first_name = $2, last_name = $3, gender = $4, 
          phone = $5, email = $6, address = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [nhifId, firstName, lastName, fhirPatient.gender, phone, email, address, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "not-found",
            diagnostics: "Patient not found"
          }
        ]
      });
    }

    const updatedPatient = result.rows[0];
    const updatedFhirPatient = convertToFHIRPatient(updatedPatient);

    res.json(updatedFhirPatient);
  } catch (error) {
    console.error('FHIR update patient error:', error);
    res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "exception",
          diagnostics: "Internal server error"
        }
      ]
    });
  }
});

// FHIR Capability Statement
router.get('/metadata', (req, res) => {
  res.json({
    resourceType: "CapabilityStatement",
    id: "hie-capability",
    url: `${process.env.FHIR_BASE_URL}/metadata`,
    version: "1.0.0",
    name: "HIE_FHIR_Server",
    title: "Health Information Exchange FHIR Server",
    status: "active",
    date: new Date().toISOString(),
    publisher: "HIE System",
    description: "FHIR R4 server for Health Information Exchange",
    fhirVersion: "4.0.1",
    format: ["json"],
    rest: [
      {
        mode: "server",
        resource: [
          {
            type: "Patient",
            interaction: [
              { code: "read" },
              { code: "search-type" },
              { code: "update" }
            ],
            searchParam: [
              { name: "identifier", type: "token" },
              { name: "name", type: "string" },
              { name: "birthdate", type: "date" },
              { name: "gender", type: "token" }
            ]
          },
          {
            type: "Observation",
            interaction: [
              { code: "search-type" }
            ],
            searchParam: [
              { name: "patient", type: "reference" },
              { name: "category", type: "token" },
              { name: "code", type: "token" }
            ]
          }
        ]
      }
    ]
  });
});

module.exports = router;

