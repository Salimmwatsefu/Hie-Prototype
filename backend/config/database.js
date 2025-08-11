import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hie_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN (
          'doctor', 'nurse', 'admin'
        )),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        nhif_id VARCHAR(50),
        hospital_id VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        refresh_token VARCHAR(500),
        last_login TIMESTAMP
      )
    `);

    // Patients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nhif_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(10) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        emergency_contact JSONB,
        medical_history JSONB,
        allergies TEXT[],
        current_medications JSONB,
        insurance_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medical records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES users(id),
        hospital_id VARCHAR(100) NOT NULL,
        visit_date TIMESTAMP NOT NULL,
        diagnosis TEXT NOT NULL,
        treatment TEXT,
        medications JSONB,
        lab_results JSONB,
        vital_signs JSONB,
        notes TEXT,
        fhir_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL
      )
    `);

    // Fraud detection logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fraud_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id),
        claim_id VARCHAR(100),
        hospital_id VARCHAR(100),
        fraud_score DECIMAL(5,4) NOT NULL,
        risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN (
          'low', 'medium', 'high'
        )),
        flags JSONB,
        model_version VARCHAR(50),
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed BOOLEAN DEFAULT false,
        reviewer_id UUID REFERENCES users(id),
        review_notes TEXT
      )
    `);

    // Enhanced Fraud alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enhanced_fraud_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id),
        fraud_type VARCHAR(100) NOT NULL,
        fraud_confidence DECIMAL(5,4) NOT NULL,
        total_amount DECIMAL(10,2),
        procedure_count INTEGER,
        hospital_count INTEGER,
        anomalies JSONB,
        procedures JSONB,
        detection_rules JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        outcome JSONB
      )
    `);

    // Hospital transfers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hospital_transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        from_hospital VARCHAR(100) NOT NULL,
        to_hospital VARCHAR(100) NOT NULL,
        transfer_reason TEXT,
        transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
          'pending', 'completed', 'cancelled'
        )),
        initiated_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        notes TEXT
      )
    `);

    // Create indexes for better performance
    await pool.query("CREATE INDEX IF NOT EXISTS idx_patients_nhif_id ON patients(nhif_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_fraud_logs_patient_id ON fraud_logs(patient_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_fraud_logs_fraud_score ON fraud_logs(fraud_score DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_alerts_patient_id ON enhanced_fraud_alerts(patient_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_alerts_fraud_confidence ON enhanced_fraud_alerts(fraud_confidence DESC)");

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export {
  pool,
  initializeDatabase
};


