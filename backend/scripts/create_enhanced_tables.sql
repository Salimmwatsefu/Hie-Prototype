-- Enhanced Fraud Detection Tables for HIE System

-- Enhanced fraud alerts table with detailed analysis
CREATE TABLE IF NOT EXISTS enhanced_fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(50) NOT NULL,
  fraud_type VARCHAR(100) NOT NULL,
  fraud_confidence DECIMAL(3,2) NOT NULL CHECK (fraud_confidence >= 0 AND fraud_confidence <= 1),
  total_amount DECIMAL(12,2) DEFAULT 0,
  procedure_count INTEGER DEFAULT 0,
  hospital_count INTEGER DEFAULT 0,
  insurance_provider_count INTEGER DEFAULT 0,
  anomalies JSONB NOT NULL DEFAULT '{}'::jsonb,
  procedures JSONB NOT NULL DEFAULT '[]'::jsonb,
  detection_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed BOOLEAN DEFAULT FALSE,
  reviewer_id UUID,
  review_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_investigation', 'confirmed_fraud', 'false_positive', 'resolved')),
  outcome JSONB DEFAULT '{}'::jsonb
  -- CONSTRAINT fk_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) -- Add after users table is confirmed
);


-- Procedure history tracking table
CREATE TABLE IF NOT EXISTS procedure_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(50) NOT NULL,
  procedure_code VARCHAR(20) NOT NULL,
  procedure_name VARCHAR(200) NOT NULL,
  hospital_id VARCHAR(50) NOT NULL,
  hospital_name VARCHAR(200),
  procedure_date DATE NOT NULL,
  claim_amount DECIMAL(12,2) NOT NULL,
  insurance_provider VARCHAR(100),
  patient_name VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fraud detection rules configuration table
CREATE TABLE IF NOT EXISTS fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('anatomical', 'temporal', 'financial', 'geographic', 'behavioral')),
  rule_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
  -- CONSTRAINT fk_rule_creator FOREIGN KEY (created_by) REFERENCES users(id) -- Add after users table is confirmed
);

-- Fraud investigation notes table
CREATE TABLE IF NOT EXISTS fraud_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fraud_alert_id UUID NOT NULL,
  investigator_id UUID NOT NULL,
  investigation_status VARCHAR(30) DEFAULT 'open' CHECK (investigation_status IN ('open', 'in_progress', 'closed', 'escalated')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  evidence JSONB DEFAULT '[]',
  actions_taken JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  CONSTRAINT fk_fraud_alert FOREIGN KEY (fraud_alert_id) REFERENCES enhanced_fraud_alerts(id)
  -- CONSTRAINT fk_investigator FOREIGN KEY (investigator_id) REFERENCES users(id) -- Add after users table is confirmed
);

-- Insert default fraud detection rules
INSERT INTO fraud_detection_rules (rule_name, rule_type, rule_config, severity) VALUES
('max_leg_amputations', 'anatomical', '{"procedure_type": "leg_amputation", "max_count": 2, "description": "Maximum 2 leg amputations per patient"}', 'CRITICAL'),
('max_arm_amputations', 'anatomical', '{"procedure_type": "arm_amputation", "max_count": 2, "description": "Maximum 2 arm amputations per patient"}', 'CRITICAL'),
('max_heart_surgeries', 'anatomical', '{"procedure_type": "heart_surgery", "max_count": 1, "description": "Maximum 1 heart surgery per patient"}', 'CRITICAL'),
('max_brain_surgeries', 'anatomical', '{"procedure_type": "brain_surgery", "max_count": 1, "description": "Maximum 1 brain surgery per patient"}', 'CRITICAL'),
('max_kidney_transplants', 'anatomical', '{"procedure_type": "kidney_transplant", "max_count": 2, "description": "Maximum 2 kidney transplants per patient"}', 'HIGH'),
('max_liver_transplants', 'anatomical', '{"procedure_type": "liver_transplant", "max_count": 1, "description": "Maximum 1 liver transplant per patient"}', 'CRITICAL'),
('min_days_between_major_surgeries', 'temporal', '{"min_days": 7, "description": "Minimum 7 days between major surgical procedures"}', 'HIGH'),
('max_hospitals_per_patient', 'geographic', '{"max_count": 2, "description": "Maximum 2 hospitals per patient for major procedures"}', 'HIGH'),
('max_insurance_providers', 'behavioral', '{"max_count": 1, "description": "Maximum 1 insurance provider per patient"}', 'HIGH'),
('high_cost_threshold', 'financial', '{"threshold_multiplier": 3, "description": "Procedure cost more than 3x market average"}', 'MEDIUM')
ON CONFLICT (rule_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_procedure_history_patient_procedures ON procedure_history (patient_id, procedure_date);
CREATE INDEX IF NOT EXISTS idx_procedure_history_procedure_type ON procedure_history (procedure_code, procedure_date);
CREATE INDEX IF NOT EXISTS idx_procedure_history_hospital_procedures ON procedure_history (hospital_id, procedure_date);
CREATE INDEX IF NOT EXISTS idx_procedure_history_insurance_claims ON procedure_history (insurance_provider, procedure_date);

CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_patient ON enhanced_fraud_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_confidence ON enhanced_fraud_alerts(fraud_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_type ON enhanced_fraud_alerts(fraud_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_status ON enhanced_fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_created ON enhanced_fraud_alerts(created_at DESC);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_anomalies ON enhanced_fraud_alerts USING GIN(anomalies);
CREATE INDEX IF NOT EXISTS idx_enhanced_fraud_procedures ON enhanced_fraud_alerts USING GIN(procedures);

-- Views for common fraud analytics queries
CREATE OR REPLACE VIEW fraud_summary_stats AS
SELECT 
  COUNT(*) as total_cases,
  COUNT(CASE WHEN fraud_confidence >= 0.8 THEN 1 END) as critical_cases,
  COUNT(CASE WHEN fraud_confidence >= 0.6 AND fraud_confidence < 0.8 THEN 1 END) as high_risk_cases,
  COUNT(CASE WHEN fraud_confidence >= 0.3 AND fraud_confidence < 0.6 THEN 1 END) as medium_risk_cases,
  COUNT(CASE WHEN fraud_confidence < 0.3 THEN 1 END) as low_risk_cases,
  AVG(fraud_confidence) as avg_fraud_confidence,
  SUM(total_amount) as total_fraudulent_amount,
  COUNT(CASE WHEN reviewed = true THEN 1 END) as reviewed_cases,
  COUNT(CASE WHEN status = 'confirmed_fraud' THEN 1 END) as confirmed_fraud_cases
FROM enhanced_fraud_alerts;

CREATE OR REPLACE VIEW fraud_trend_daily AS
SELECT 
  DATE(created_at) as fraud_date,
  COUNT(*) as case_count,
  AVG(fraud_confidence) as avg_confidence,
  SUM(total_amount) as daily_fraud_amount,
  COUNT(CASE WHEN fraud_confidence >= 0.8 THEN 1 END) as critical_count
FROM enhanced_fraud_alerts
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fraud_date DESC;

CREATE OR REPLACE VIEW fraud_by_type AS
SELECT 
  fraud_type,
  COUNT(*) as case_count,
  AVG(fraud_confidence) as avg_confidence,
  SUM(total_amount) as total_amount,
  AVG(procedure_count) as avg_procedures,
  AVG(hospital_count) as avg_hospitals
FROM enhanced_fraud_alerts
GROUP BY fraud_type
ORDER BY case_count DESC;

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE ON enhanced_fraud_alerts TO fraud_analysts;
-- GRANT SELECT, INSERT, UPDATE ON procedure_history TO medical_staff;
-- GRANT SELECT ON fraud_summary_stats, fraud_trend_daily, fraud_by_type TO fraud_analysts;
