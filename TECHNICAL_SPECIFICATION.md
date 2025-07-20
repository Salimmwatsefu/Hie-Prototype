# HIE System Technical Specification

## 1. System Overview

### 1.1 Purpose
The Health Information Exchange (HIE) system is designed to facilitate secure, real-time sharing of patient data across healthcare institutions in Kenya while providing advanced fraud detection capabilities.

### 1.2 Scope
This document covers the technical architecture, implementation details, and specifications for all system components including backend APIs, frontend interfaces, fraud detection engine, and security infrastructure.

### 1.3 System Requirements

#### Functional Requirements
- **FR-001**: Real-time patient data sharing across hospitals
- **FR-002**: FHIR R4 compliant API endpoints
- **FR-003**: Role-based access control (Doctor, Nurse, Admin)
- **FR-004**: Fraud detection with ≥90% accuracy
- **FR-005**: Multi-factor authentication
- **FR-006**: Comprehensive audit logging
- **FR-007**: Patient record transfer between facilities
- **FR-008**: Offline synchronization capability

#### Non-Functional Requirements
- **NFR-001**: API response time ≤1.5 seconds
- **NFR-002**: System availability ≥99.5%
- **NFR-003**: Support for 1000+ concurrent users
- **NFR-004**: Data encryption at rest and in transit
- **NFR-005**: GDPR and Kenya Data Protection Act compliance
- **NFR-006**: Mobile-responsive design
- **NFR-007**: Cross-browser compatibility

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                Frontend Layer                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   React.js      │ │   PWA Service   │ │   Mobile App    ││
│  │   Dashboard     │ │   Worker        │ │   (Future)      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                API Gateway                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Rate Limiting │ │   Authentication│ │   Request       ││
│  │   & Throttling  │ │   & Authorization│ │   Validation    ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                Application Layer                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Node.js       │ │   Python        │ │   Background    ││
│  │   Backend       │ │   Fraud         │ │   Jobs          ││
│  │   (Express)     │ │   Detection     │ │   (Celery)      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                Data Layer                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   PostgreSQL    │ │   Redis Cache   │ │   File Storage  ││
│  │   Primary DB    │ │   Session Store │ │   (Documents)   ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### 2.2.1 Backend Services
```
backend/
├── server.js                 # Main application entry point
├── config/
│   ├── database.js          # Database configuration
│   ├── auth.js              # Authentication configuration
│   └── security.js          # Security settings
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── rbac.js              # Role-based access control
│   ├── encryption.js        # Data encryption/decryption
│   ├── audit.js             # Audit logging middleware
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── patients.js          # Patient management
│   ├── fhir.js              # FHIR-compliant endpoints
│   ├── audit.js             # Audit log endpoints
│   └── fraud.js             # Fraud detection integration
├── models/
│   ├── User.js              # User model
│   ├── Patient.js           # Patient model
│   ├── AuditLog.js          # Audit log model
│   └── FraudAlert.js        # Fraud alert model
├── services/
│   ├── fhirService.js       # FHIR data transformation
│   ├── encryptionService.js # Encryption utilities
│   ├── auditService.js      # Audit logging service
│   └── notificationService.js # Alert notifications
└── utils/
    ├── validators.js        # Data validation utilities
    ├── helpers.js           # Common helper functions
    └── constants.js         # Application constants
```

#### 2.2.2 Frontend Architecture
```
hie-frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── ui/              # shadcn/ui components
│   │   ├── forms/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── PatientForm.jsx
│   │   │   └── TransferForm.jsx
│   │   └── charts/
│   │       ├── FraudChart.jsx
│   │       └── AnalyticsChart.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DoctorDashboard.jsx
│   │   ├── NurseDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── PatientList.jsx
│   │   ├── PatientDetails.jsx
│   │   ├── FraudAlerts.jsx
│   │   ├── AuditLogs.jsx
│   │   └── TransferPatient.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── PatientContext.jsx
│   │   └── AlertContext.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── patientService.js
│   │   ├── fraudService.js
│   │   └── auditService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePatients.js
│   │   └── useFraudAlerts.js
│   └── utils/
│       ├── api.js
│       ├── constants.js
│       └── helpers.js
```

#### 2.2.3 Fraud Detection Engine
```
fraud-detection/
├── models/
│   ├── random_forest_model.py    # Supervised learning model
│   ├── autoencoder_model.py      # Unsupervised anomaly detection
│   ├── kmeans_model.py           # Clustering-based detection
│   └── ensemble_model.py         # Combined ensemble approach
├── data/
│   ├── synthetic_data_generator.py # Test data generation
│   ├── feature_engineering.py     # Feature extraction
│   └── data_preprocessing.py      # Data cleaning and preparation
├── api/
│   ├── fraud_detection_api.py     # Flask API service
│   └── model_endpoints.py         # ML model endpoints
├── utils/
│   ├── model_utils.py             # Model utilities
│   ├── evaluation_metrics.py     # Performance evaluation
│   └── visualization.py          # Data visualization
└── config/
    ├── model_config.py            # Model configuration
    └── api_config.py              # API configuration
```

## 3. Database Design

### 3.1 Entity Relationship Diagram

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'nurse', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    hospital_id UUID REFERENCES hospitals(id),
    nhif_id VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    license_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nhif_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical records table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    visit_date TIMESTAMP NOT NULL,
    diagnosis_code VARCHAR(20),
    diagnosis_description TEXT,
    procedure_code VARCHAR(20),
    procedure_description TEXT,
    treatment_notes TEXT,
    prescription TEXT,
    follow_up_date DATE,
    claim_amount DECIMAL(10,2),
    is_transferred BOOLEAN DEFAULT false,
    transferred_from UUID REFERENCES hospitals(id),
    transferred_to UUID REFERENCES hospitals(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Fraud alerts table
CREATE TABLE fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES medical_records(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    alert_type VARCHAR(50) NOT NULL,
    fraud_probability DECIMAL(5,4) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    claim_amount DECIMAL(10,2),
    expected_amount DECIMAL(10,2),
    anomaly_details JSONB,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_INVESTIGATION', 'RESOLVED', 'FALSE_POSITIVE')),
    investigated_by UUID REFERENCES users(id),
    investigation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for JWT management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Indexes and Performance Optimization

```sql
-- Performance indexes
CREATE INDEX idx_patients_nhif_id ON patients(nhif_id);
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_hospital_id ON medical_records(hospital_id);
CREATE INDEX idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk_level ON fraud_alerts(risk_level);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_medical_records_patient_hospital ON medical_records(patient_id, hospital_id);
CREATE INDEX idx_fraud_alerts_hospital_status ON fraud_alerts(hospital_id, status);
```

## 4. API Specifications

### 4.1 Authentication API

#### POST /auth/login
```json
Request:
{
  "email": "doctor@knh.co.ke",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "doctor@knh.co.ke",
      "role": "doctor",
      "firstName": "John",
      "lastName": "Doe",
      "hospitalId": "uuid",
      "nhifId": "NHI123456"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 3600
    },
    "mfaRequired": false
  }
}
```

#### POST /auth/mfa/verify
```json
Request:
{
  "userId": "uuid",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "MFA verification successful",
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### 4.2 FHIR API Endpoints

#### GET /fhir/Patient/{id}
```json
Response:
{
  "resourceType": "Patient",
  "id": "uuid",
  "identifier": [
    {
      "system": "http://nhif.go.ke/identifier",
      "value": "NHI123456"
    }
  ],
  "name": [
    {
      "family": "Doe",
      "given": ["John", "Smith"]
    }
  ],
  "gender": "male",
  "birthDate": "1985-06-15",
  "telecom": [
    {
      "system": "phone",
      "value": "+254712345678"
    }
  ],
  "address": [
    {
      "city": "Nairobi",
      "country": "Kenya"
    }
  ]
}
```

#### POST /fhir/Encounter
```json
Request:
{
  "resourceType": "Encounter",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB"
  },
  "subject": {
    "reference": "Patient/uuid"
  },
  "participant": [
    {
      "individual": {
        "reference": "Practitioner/uuid"
      }
    }
  ],
  "period": {
    "start": "2024-01-15T09:00:00Z",
    "end": "2024-01-15T10:30:00Z"
  },
  "diagnosis": [
    {
      "condition": {
        "reference": "Condition/uuid"
      }
    }
  ]
}
```

### 4.3 Fraud Detection API

#### POST /fraud/predict
```json
Request:
{
  "claims": [
    {
      "claim_id": "CLM_001",
      "patient_id": "PAT_001",
      "provider_id": "PROV_001",
      "claim_date": "2024-01-15T10:00:00Z",
      "diagnosis_code": "Z51.11",
      "procedure_code": "99213",
      "claim_amount": 250.00,
      "patient_location": "Nairobi",
      "provider_location": "Nairobi"
    }
  ],
  "model_type": "ensemble",
  "return_probabilities": true
}

Response:
{
  "predictions": [
    {
      "claim_id": "CLM_001",
      "is_fraud_predicted": 0,
      "fraud_probability": 0.23,
      "fraud_risk_percentage": "23.0%",
      "fraud_risk_level": "LOW"
    }
  ],
  "summary": {
    "total_claims": 1,
    "flagged_as_fraud": 0,
    "fraud_rate": "0.0%",
    "model_used": "ensemble",
    "average_fraud_probability": "23.0%"
  }
}
```

## 5. Security Specifications

### 5.1 Authentication & Authorization

#### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@hospital.co.ke",
    "role": "doctor",
    "hospitalId": "hospital-uuid",
    "permissions": ["read:patients", "write:patients"],
    "iat": 1640995200,
    "exp": 1640998800,
    "iss": "hie-system",
    "aud": "hie-frontend"
  }
}
```

#### Role-Based Permissions
```javascript
const permissions = {
  doctor: [
    'read:patients',
    'write:patients',
    'read:medical_records',
    'write:medical_records',
    'transfer:patients'
  ],
  nurse: [
    'read:patients',
    'read:medical_records'
  ],
  admin: [
    'read:*',
    'write:*',
    'delete:*',
    'read:audit_logs',
    'read:fraud_alerts',
    'manage:users'
  ]
};
```

### 5.2 Data Encryption

#### AES-256 Encryption Implementation
```javascript
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  encrypt(text, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData, key) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 5.3 Security Headers Configuration
```javascript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## 6. Fraud Detection Technical Details

### 6.1 Feature Engineering

#### Temporal Features
- `claim_hour`: Hour of claim submission (0-23)
- `claim_day_of_week`: Day of week (0-6)
- `is_weekend`: Boolean flag for weekend claims
- `is_night_claim`: Claims submitted between 10 PM - 6 AM
- `days_since_last_claim`: Time between patient claims

#### Financial Features
- `claim_amount_log`: Log-transformed claim amount
- `claim_amount_percentile`: Percentile rank of claim amount
- `amount_deviation_from_procedure_avg`: Deviation from procedure average
- `is_high_amount`: Claims above 95th percentile

#### Provider Behavior Features
- `provider_claim_count`: Total claims by provider
- `provider_avg_amount`: Average claim amount per provider
- `provider_amount_cv`: Coefficient of variation in claim amounts
- `provider_claims_per_patient`: Claims per unique patient
- `provider_unique_patients`: Number of unique patients

#### Patient Behavior Features
- `patient_claim_count`: Total claims by patient
- `patient_provider_diversity`: Number of different providers visited
- `patient_spending_consistency`: Consistency in claim amounts
- `patient_activity_level`: Percentile rank of patient activity

### 6.2 Model Performance Metrics

#### Random Forest Model
```python
# Target Performance Metrics
PERFORMANCE_TARGETS = {
    'accuracy': 0.90,      # ≥90%
    'precision': 0.85,     # ≥85%
    'recall': 0.70,        # ≥70%
    'f1_score': 0.80,      # ≥80%
    'roc_auc': 0.85        # ≥85%
}

# Feature Importance Threshold
FEATURE_IMPORTANCE_THRESHOLD = 0.01

# Model Hyperparameters
RF_HYPERPARAMETERS = {
    'n_estimators': 200,
    'max_depth': 20,
    'min_samples_split': 5,
    'min_samples_leaf': 2,
    'max_features': 'sqrt',
    'class_weight': 'balanced'
}
```

#### Autoencoder Architecture
```python
# Network Architecture
AUTOENCODER_CONFIG = {
    'input_dim': 50,           # Number of input features
    'encoding_dim': 12,        # Bottleneck layer size
    'hidden_layers': [32, 20], # Hidden layer sizes
    'activation': 'relu',      # Activation function
    'optimizer': 'adam',       # Optimizer
    'learning_rate': 0.001,    # Learning rate
    'batch_size': 32,          # Batch size
    'epochs': 100,             # Training epochs
    'validation_split': 0.2    # Validation split
}

# Anomaly Detection Threshold
ANOMALY_THRESHOLD_PERCENTILE = 95  # 95th percentile of reconstruction errors
```

#### K-Means Clustering
```python
# Clustering Configuration
KMEANS_CONFIG = {
    'n_clusters': 8,           # Number of clusters
    'init': 'k-means++',       # Initialization method
    'n_init': 20,              # Number of initializations
    'max_iter': 300,           # Maximum iterations
    'random_state': 42         # Random seed
}

# Fraud Cluster Identification
FRAUD_CLUSTER_THRESHOLD = 0.6  # Minimum fraud rate to classify as fraud cluster
```

### 6.3 Ensemble Model Configuration
```python
# Ensemble Weights (optimized through validation)
ENSEMBLE_WEIGHTS = {
    'random_forest': 0.5,      # 50% weight
    'autoencoder': 0.3,        # 30% weight
    'kmeans': 0.2              # 20% weight
}

# Voting Methods
VOTING_METHODS = {
    'weighted': 'Weighted average of probabilities',
    'majority': 'Majority voting (≥2 models agree)',
    'unanimous': 'All models must agree'
}

# Risk Level Thresholds
RISK_THRESHOLDS = {
    'CRITICAL': 0.8,   # ≥80% fraud probability
    'HIGH': 0.6,       # 60-79% fraud probability
    'MEDIUM': 0.4,     # 40-59% fraud probability
    'LOW': 0.0         # <40% fraud probability
}
```

## 7. Performance Optimization

### 7.1 Database Optimization

#### Connection Pooling
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if no connection
});
```

#### Query Optimization
```sql
-- Optimized patient search query
SELECT p.*, h.name as hospital_name
FROM patients p
LEFT JOIN medical_records mr ON p.id = mr.patient_id
LEFT JOIN hospitals h ON mr.hospital_id = h.id
WHERE p.nhif_id = $1
   OR (p.first_name ILIKE $2 AND p.last_name ILIKE $3)
ORDER BY mr.visit_date DESC
LIMIT 10;

-- Fraud alert summary query
SELECT 
    risk_level,
    COUNT(*) as alert_count,
    AVG(fraud_probability) as avg_probability,
    SUM(claim_amount) as total_amount
FROM fraud_alerts
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'PENDING'
GROUP BY risk_level
ORDER BY 
    CASE risk_level
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END;
```

### 7.2 Caching Strategy

#### Redis Configuration
```javascript
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache TTL settings
const CACHE_TTL = {
  user_session: 3600,        // 1 hour
  patient_data: 1800,        // 30 minutes
  fraud_model: 86400,        // 24 hours
  hospital_list: 3600        // 1 hour
};
```

### 7.3 API Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Fraud detection rate limiting
const fraudLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // Limit to 10 fraud detection requests per minute
  message: 'Fraud detection rate limit exceeded'
});
```

## 8. Monitoring and Logging

### 8.1 Application Monitoring

#### Health Check Endpoints
```javascript
// System health check
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'healthy',
      redis: 'healthy',
      fraud_detection: 'healthy'
    },
    version: process.env.APP_VERSION,
    uptime: process.uptime()
  };
  
  res.status(200).json(health);
});

// Detailed system metrics
app.get('/metrics', requireAuth, requireRole('admin'), (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    active_connections: pool.totalCount,
    idle_connections: pool.idleCount,
    cache_hit_rate: getCacheHitRate(),
    fraud_detection_accuracy: getFraudModelAccuracy()
  };
  
  res.json(metrics);
});
```

### 8.2 Audit Logging

#### Audit Log Structure
```javascript
const auditLog = {
  id: 'uuid',
  userId: 'user-uuid',
  action: 'READ_PATIENT',
  resourceType: 'Patient',
  resourceId: 'patient-uuid',
  oldValues: null,
  newValues: { /* patient data */ },
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  sessionId: 'session-uuid',
  timestamp: '2024-01-15T10:30:00Z',
  severity: 'info'
};
```

#### Security Event Logging
```javascript
const securityEvents = {
  FAILED_LOGIN: 'warning',
  MULTIPLE_FAILED_LOGINS: 'error',
  SUCCESSFUL_LOGIN: 'info',
  PRIVILEGE_ESCALATION_ATTEMPT: 'critical',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'error',
  DATA_EXPORT: 'warning',
  FRAUD_ALERT_TRIGGERED: 'warning',
  SYSTEM_CONFIGURATION_CHANGE: 'warning'
};
```

## 9. Deployment Specifications

### 9.1 Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 9.2 Docker Compose Configuration
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: hie_db
      POSTGRES_USER: hie_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://hie_user:${DB_PASSWORD}@postgres:5432/hie_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"

  frontend:
    build: ./hie-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  fraud-detection:
    build: ./fraud-detection
    environment:
      FLASK_ENV: production
      DATABASE_URL: postgresql://hie_user:${DB_PASSWORD}@postgres:5432/hie_db
    depends_on:
      - postgres
    ports:
      - "5001:5001"

volumes:
  postgres_data:
```

### 9.3 Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hie-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hie-backend
  template:
    metadata:
      labels:
        app: hie-backend
    spec:
      containers:
      - name: backend
        image: hie/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hie-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: hie-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 10. Testing Strategy

### 10.1 Unit Testing
```javascript
// Example unit test for authentication
describe('Authentication Service', () => {
  test('should generate valid JWT token', async () => {
    const user = {
      id: 'test-uuid',
      email: 'test@hospital.co.ke',
      role: 'doctor'
    };
    
    const token = authService.generateToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    expect(decoded.sub).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.role).toBe(user.role);
  });

  test('should validate password correctly', async () => {
    const password = 'testPassword123';
    const hash = await authService.hashPassword(password);
    
    const isValid = await authService.validatePassword(password, hash);
    expect(isValid).toBe(true);
  });
});
```

### 10.2 Integration Testing
```javascript
// Example integration test for patient API
describe('Patient API', () => {
  test('should create and retrieve patient', async () => {
    const patientData = {
      nhifId: 'NHI123456',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-06-15',
      gender: 'male'
    };
    
    // Create patient
    const createResponse = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(patientData)
      .expect(201);
    
    const patientId = createResponse.body.data.id;
    
    // Retrieve patient
    const getResponse = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);
    
    expect(getResponse.body.data.nhifId).toBe(patientData.nhifId);
  });
});
```

### 10.3 Performance Testing
```javascript
// Load testing configuration
const loadTestConfig = {
  target: 'http://localhost:3000',
  phases: [
    { duration: '2m', arrivalRate: 10 },  // Warm up
    { duration: '5m', arrivalRate: 50 },  // Ramp up
    { duration: '10m', arrivalRate: 100 }, // Sustained load
    { duration: '2m', arrivalRate: 200 }   // Peak load
  ]
};

// Performance benchmarks
const performanceBenchmarks = {
  apiResponseTime: 1500,      // ≤1.5 seconds
  databaseQueryTime: 500,     // ≤500ms
  fraudDetectionTime: 2000,   // ≤2 seconds
  concurrentUsers: 1000,      // Support 1000+ users
  throughput: 100             // 100 requests/second
};
```

## 11. Compliance and Standards

### 11.1 FHIR R4 Compliance
- Complete implementation of Patient, Practitioner, Organization resources
- Support for Encounter, Observation, Condition, Procedure resources
- RESTful API following FHIR conventions
- Proper use of FHIR data types and value sets
- Support for FHIR search parameters

### 11.2 Security Standards
- **OWASP Top 10** compliance
- **ISO 27001** security management principles
- **NIST Cybersecurity Framework** alignment
- **HIPAA** technical safeguards (where applicable)
- **Kenya Data Protection Act** compliance

### 11.3 Healthcare Standards
- **HL7 FHIR R4** for interoperability
- **ICD-10** for diagnosis coding
- **CPT** for procedure coding
- **SNOMED CT** for clinical terminology (future enhancement)

---

This technical specification provides comprehensive details for implementing, deploying, and maintaining the HIE system. All components are designed to work together seamlessly while maintaining high security, performance, and compliance standards.

