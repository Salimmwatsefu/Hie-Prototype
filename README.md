# HIE (Health Information Exchange) Prototype

## Overview

This is a comprehensive Health Information Exchange (HIE) prototype designed for the Kenyan healthcare context. The system enables secure, real-time sharing of patient data across hospitals while detecting fraud using advanced machine learning techniques.

## 🏥 System Features

### Core Functionality
- **Real-time Patient Data Sharing**: FHIR-compliant APIs for seamless data exchange
- **Fraud Detection**: AI-powered fraud detection using ensemble machine learning models
- **Security**: AES-256 encryption, OAuth 2.0, and Multi-Factor Authentication (MFA)
- **Interoperability**: Compatible with existing EHR systems
- **Role-Based Access Control**: Separate interfaces for doctors, nurses, and administrators

### Key Components
1. **Backend API** (Node.js + Express + PostgreSQL)
2. **Frontend Dashboard** (React.js with responsive design)
3. **Fraud Detection Engine** (Python with ML models)
4. **Security Layer** (OAuth 2.0, JWT, AES-256)
5. **Audit System** (Comprehensive logging and monitoring)

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- Python 3.11
- PostgreSQL 14+
- npm/pnpm

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd hie-prototype
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure database settings in .env
npm run init-db
npm start
```

3. **Frontend Setup**
```bash
cd ../hie-frontend
pnpm install
pnpm run dev
```

4. **Fraud Detection Service**
```bash
cd ../fraud-detection
pip3 install -r requirements.txt
python3 api/fraud_detection_api.py
```

### Demo Credentials
- **Doctor**: doctor@knh.co.ke / password123
- **Nurse**: nurse@knh.co.ke / password123  
- **Admin**: admin@hie.co.ke / password123

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Node.js       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│                 │    │   (Express)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Python        │              │
         └──────────────►│   Fraud         │◄─────────────┘
                        │   Detection     │
                        └─────────────────┘
```

### Technology Stack

**Backend:**
- Node.js 20.x with Express.js
- PostgreSQL for data storage
- JWT for session management
- bcrypt for password hashing
- CORS for cross-origin requests

**Frontend:**
- React.js 19.x with modern hooks
- Tailwind CSS for styling
- shadcn/ui component library
- Axios for API communication
- React Router for navigation

**Fraud Detection:**
- Python 3.11
- scikit-learn for machine learning
- TensorFlow/Keras for deep learning
- pandas/numpy for data processing
- Flask for API endpoints

**Security:**
- OAuth 2.0 authentication
- AES-256 encryption
- Multi-Factor Authentication (MFA)
- Rate limiting and security headers
- Comprehensive audit logging

## 📊 Fraud Detection System

### Machine Learning Models

The fraud detection system uses an ensemble approach combining three different models:

#### 1. Random Forest (Supervised Learning)
- **Purpose**: Classify known fraud patterns
- **Features**: 50+ engineered features including temporal, financial, and behavioral patterns
- **Performance Target**: ≥90% accuracy, ≥85% precision, ≥80% F1-score

#### 2. Autoencoder (Unsupervised Learning)
- **Purpose**: Detect anomalies in normal behavior patterns
- **Architecture**: Deep neural network with bottleneck layer
- **Method**: Reconstruction error threshold for anomaly detection

#### 3. K-Means Clustering (Unsupervised Learning)
- **Purpose**: Identify suspicious clusters and outliers
- **Method**: Cluster analysis with fraud rate profiling
- **Features**: Provider behavior, patient patterns, geographic analysis

#### 4. Ensemble Model
- **Combination**: Weighted voting of all three models
- **Optimization**: Automatic weight optimization based on validation performance
- **Output**: Fraud probability score and risk level classification

### Fraud Detection Features

**Real-time Analysis:**
- Claim amount inflation detection
- Duplicate billing identification
- Phantom billing detection
- Upcoding and unbundling detection
- Temporal pattern analysis

**Risk Indicators:**
- Provider behavior anomalies
- Patient activity patterns
- Geographic inconsistencies
- Unusual timing patterns
- Statistical outliers

**Alert System:**
- CRITICAL (≥80% fraud probability)
- HIGH (60-79% fraud probability)
- MEDIUM (40-59% fraud probability)
- LOW (<40% fraud probability)

## 🔐 Security Features

### Authentication & Authorization
- **OAuth 2.0**: Industry-standard authentication protocol
- **Multi-Factor Authentication**: SMS/Email verification
- **JWT Tokens**: Secure session management with refresh tokens
- **Role-Based Access Control**: Granular permissions for different user types

### Data Protection
- **AES-256 Encryption**: All sensitive data encrypted at rest and in transit
- **HTTPS/TLS**: Secure communication channels
- **Database Encryption**: Encrypted database fields for PII
- **Audit Logging**: Complete audit trail of all system access and modifications

### Security Headers & Policies
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options protection
- Rate limiting and DDoS protection
- Input validation and sanitization

## 🏥 Kenyan Healthcare Context

### NHIF Integration
- Support for NHIF (National Hospital Insurance Fund) IDs
- Kenyan hospital network integration
- Local healthcare provider database

### Featured Hospitals
- Kenyatta National Hospital
- Moi Teaching and Referral Hospital
- Aga Khan University Hospital
- Nairobi Hospital
- Gertrudes Children Hospital
- MP Shah Hospital
- Karen Hospital
- Coptic Hospital

### Geographic Coverage
- Nairobi, Mombasa, Kisumu, Nakuru
- Eldoret, Thika, Malindi, Kitale
- Garissa, Kakamega

## 📱 User Interfaces

### Doctor Dashboard
- **Access Level**: View and Update patient records
- **Features**: 
  - Patient search and medical history
  - Real-time patient data from other hospitals
  - Treatment notes and prescription management
  - Transfer patient records between facilities

### Nurse Dashboard  
- **Access Level**: View-only patient records
- **Features**:
  - Patient vital signs and basic information
  - Medication schedules and care plans
  - Limited access to sensitive information

### Admin Dashboard
- **Access Level**: Full system administration
- **Features**:
  - User management and role assignment
  - System audit logs and security monitoring
  - Fraud detection alerts and investigation tools
  - System performance and analytics

## 🔍 FHIR Compliance

### Supported FHIR Resources
- **Patient**: Demographics, identifiers, contact information
- **Practitioner**: Healthcare provider information
- **Organization**: Hospital and clinic data
- **Encounter**: Patient visits and admissions
- **Observation**: Vital signs, lab results, clinical observations
- **Condition**: Diagnoses and medical conditions
- **Procedure**: Medical procedures and treatments
- **MedicationRequest**: Prescriptions and medication orders

### API Endpoints
```
GET    /fhir/Patient/{id}           - Get patient by ID
POST   /fhir/Patient               - Create new patient
PUT    /fhir/Patient/{id}          - Update patient
GET    /fhir/Patient?identifier=   - Search patients
GET    /fhir/Observation?patient=  - Get patient observations
POST   /fhir/Encounter             - Create encounter
```

## 📈 Performance Metrics

### Target Performance
- **API Response Time**: ≤1.5 seconds
- **Access Request Time**: ≤30 seconds
- **FHIR Compliance**: 100%
- **Fraud Detection Accuracy**: ≥90%
- **False Positive Reduction**: ≥25%
- **Role-based Access Violations**: <1%
- **UI Usability (SUS Score)**: ≥85%

### System Monitoring
- Real-time performance dashboards
- Automated health checks
- Error tracking and alerting
- Usage analytics and reporting

## 🧪 Testing Summary

### Automated Testing
- Unit tests for all API endpoints
- Integration tests for FHIR compliance
- Security penetration testing
- Performance load testing
- Fraud detection model validation

### Manual Testing
- User acceptance testing with healthcare professionals
- Accessibility testing for rural clinic environments
- Cross-browser compatibility testing
- Mobile responsiveness testing

## 🚀 Deployment Options

### Cloud Deployment
- **AWS/Azure/GCP**: Scalable cloud infrastructure
- **Docker Containers**: Containerized deployment
- **Kubernetes**: Orchestrated container management
- **Load Balancing**: High availability setup

### Hybrid Cloud
- **Local Infrastructure**: On-premises servers for sensitive data
- **Cloud Services**: Scalable compute and storage
- **Data Residency**: Compliance with local data protection laws

### Offline Capability
- **Rural Connectivity**: Offline synchronization for poor connectivity areas
- **Data Caching**: Local data storage and sync when online
- **Progressive Web App**: Works offline with service workers

## 📋 API Documentation

### Authentication Endpoints
```
POST /auth/login          - User login
POST /auth/logout         - User logout  
POST /auth/refresh        - Refresh JWT token
POST /auth/mfa/verify     - Verify MFA code
```

### Patient Data Endpoints
```
GET    /api/patients           - List patients
GET    /api/patients/:id       - Get patient details
POST   /api/patients           - Create patient
PUT    /api/patients/:id       - Update patient
DELETE /api/patients/:id       - Delete patient
POST   /api/patients/transfer  - Transfer patient
```

### Fraud Detection Endpoints
```
POST /fraud/predict       - Predict fraud for claims
POST /fraud/analyze       - Batch fraud analysis
GET  /fraud/alerts        - Get fraud alerts
GET  /fraud/performance   - Model performance metrics
```

### Audit Endpoints
```
GET /audit/logs           - Get audit logs
GET /audit/user/:id       - Get user activity
GET /audit/security       - Security events
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/hie_db
DATABASE_SSL=true

# Security
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-aes-256-key

# OAuth
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret

# MFA
MFA_SECRET=your-mfa-secret
SMS_API_KEY=your-sms-api-key

# Fraud Detection
FRAUD_API_URL=http://localhost:5001
FRAUD_THRESHOLD=0.5
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
npm run reset-db
npm run init-db
```

**Frontend Build Issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Fraud Detection Service Issues:**
```bash
# Check Python dependencies
pip3 install -r requirements.txt

# Test fraud detection
python3 test_fraud_detection.py
```

## 📞 Support & Contact

### Development Team
- **Backend Development**: Node.js/Express specialists
- **Frontend Development**: React.js developers  
- **ML Engineering**: Python/scikit-learn experts
- **Security**: Cybersecurity professionals
- **Healthcare Domain**: Medical informatics specialists

### Documentation
- API Documentation: `/docs/api`
- User Guides: `/docs/users`
- Admin Manual: `/docs/admin`
- Developer Guide: `/docs/development`

## 📄 License

This HIE prototype is developed for demonstration and educational purposes. For production deployment, ensure compliance with:

- **HIPAA** (Health Insurance Portability and Accountability Act)
- **Kenya Data Protection Act**
- **FHIR R4** compliance standards
- **Medical device regulations** (if applicable)

## 🔄 Version History

- **v1.0.0** - Initial prototype with core HIE functionality
- **v1.1.0** - Added fraud detection system
- **v1.2.0** - Enhanced security and MFA implementation
- **v1.3.0** - FHIR compliance and interoperability features
- **v1.4.0** - Mobile responsiveness and accessibility improvements

---

**Built with ❤️ for Kenyan Healthcare**

*This system demonstrates the potential for digital transformation in healthcare, enabling better patient outcomes through secure, efficient data sharing and fraud prevention.*

