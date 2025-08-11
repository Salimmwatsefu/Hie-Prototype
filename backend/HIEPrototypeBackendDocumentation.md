# HIE Prototype Backend Documentation

This document provides a comprehensive overview of the backend for the HIE (Health Information Exchange) prototype. It covers the project structure, API endpoints, database schema, and setup instructions.




## 1. Project Overview and Architecture

The HIE (Health Information Exchange) prototype backend is a Node.js application built with Express.js. It provides a RESTful API for managing user authentication, patient records, medical records, and audit logs. The application interacts with a PostgreSQL database to store and retrieve data. It also includes basic FHIR (Fast Healthcare Interoperability Resources) capabilities for patient and observation resources.

### 1.1. Technology Stack

*   **Backend Framework:** Express.js (Node.js)
*   **Database:** PostgreSQL
*   **Authentication:** JWT (JSON Web Tokens), bcrypt.js for password hashing, MFA (Multi-Factor Authentication)
*   **Validation:** express-validator
*   **Security:** helmet, express-rate-limit
*   **Logging:** morgan
*   **Environment Variables:** dotenv

### 1.2. Architecture Diagram

```mermaid
graph TD
    A[Client Applications (Frontend)] -- HTTP/HTTPS --> B(HIE Backend API)
    B -- Connects to --> C(PostgreSQL Database)
    B -- Interacts with --> D(External Services - e.g., FHIR, Fraud Detection)

    subgraph HIE Backend
        B1(Authentication & Authorization)
        B2(Patient Management)
        B3(Medical Record Management)
        B4(Audit Logging)
        B5(FHIR Endpoints)
        B6(Fraud Detection Integration)
    end

    B --- B1
    B --- B2
    B --- B3
    B --- B4
    B --- B5
    B --- B6

    C -- Stores --> C1(Users)
    C -- Stores --> C2(Patients)
    C -- Stores --> C3(Medical Records)
    C -- Stores --> C4(Audit Logs)
    C -- Stores --> C5(Fraud Logs)
    C -- Stores --> C6(Enhanced Fraud Alerts)
    C -- Stores --> C7(Hospital Transfers)

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px
    style D fill:#fcf,stroke:#333,stroke-width:2px
    style B1 fill:#fcf,stroke:#333,stroke-width:1px
    style B2 fill:#fcf,stroke:#333,stroke-width:1px
    style B3 fill:#fcf,stroke:#333,stroke-width:1px
    style B4 fill:#fcf,stroke:#333,stroke-width:1px
    style B5 fill:#fcf,stroke:#333,stroke-width:1px
    style B6 fill:#fcf,stroke:#333,stroke-width:1px
    style C1 fill:#fff,stroke:#333,stroke-width:1px
    style C2 fill:#fff,stroke:#333,stroke-width:1px
    style C3 fill:#fff,stroke:#333,stroke-width:1px
    style C4 fill:#fff,stroke:#333,stroke-width:1px
    style C5 fill:#fff,stroke:#333,stroke-width:1px
    style C6 fill:#fff,stroke:#333,stroke-width:1px
    style C7 fill:#fff,stroke:#333,stroke-width:1px
```

### 1.3. Key Features

*   **User Authentication and Authorization:** Secure user registration, login (with optional MFA), token refresh, and role-based access control.
*   **Patient Management:** CRUD operations for patient records, including search and retrieval by NHIF ID.
*   **Medical Record Management:** Association of medical records with patients, including diagnosis, treatment, medications, and vital signs.
*   **Audit Logging:** Comprehensive logging of user actions and system events for security and compliance.
*   **FHIR Compliance:** Implementation of FHIR R4 standards for Patient and Observation resources, enabling interoperability with other healthcare systems.
*   **Fraud Detection Integration:** (Currently skipped as per user request) Placeholder for integration with external fraud detection services.





## 2. Getting Started

This section provides instructions for setting up and running the HIE backend locally for development and testing purposes.

### 2.1. Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js:** (v18 or higher recommended)
*   **npm or pnpm:** (pnpm is recommended for this project)
*   **Git:** For cloning the repository.
*   **PostgreSQL:** A running instance of PostgreSQL.

### 2.2. Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Webrizzhq/hie-prototype.git
    cd hie-prototype/backend
    ```

2.  **Install dependencies:**

    It is recommended to use `pnpm` to install dependencies. If you don't have `pnpm` installed, you can install it globally using `npm`:

    ```bash
    npm install -g pnpm
    ```

    Then, install the project dependencies:

    ```bash
    pnpm install
    ```

3.  **Set up the database:**

    a.  Start your PostgreSQL service.

    b.  Connect to your PostgreSQL instance using `psql` or any other PostgreSQL client.

    c.  Create a new database and user for the application:

        ```sql
        CREATE DATABASE hie_db;
        CREATE USER hie_user WITH ENCRYPTED PASSWORD 'password';
        GRANT ALL PRIVILEGES ON DATABASE hie_db TO hie_user;
        ```

4.  **Configure environment variables:**

    a.  Create a `.env` file in the `backend` directory.

    b.  Copy the contents of `.env.example` (if available) or add the following configuration:

        ```
        # Server Configuration
        NODE_ENV=development
        PORT=3001

        # Database Configuration
        DB_HOST=localhost
        DB_PORT=5432
        DB_NAME=hie_db
        DB_USER=hie_user
        DB_PASSWORD=password

        # Security
        JWT_SECRET=your_jwt_secret
        JWT_REFRESH_SECRET=your_jwt_refresh_secret
        ENCRYPTION_KEY=your_encryption_key

        # ... (add other necessary environment variables)
        ```

        **Note:** Replace `your_jwt_secret`, `your_jwt_refresh_secret`, and `your_encryption_key` with strong, randomly generated secrets.

5.  **Initialize the database:**

    Run the following command to create the necessary tables and indexes in your database:

    ```bash
    npm run init-db
    ```

6.  **Start the server:**

    To start the backend server in development mode (with hot-reloading), run:

    ```bash
    npm run dev
    ```

    To start the server in production mode, run:

    ```bash
    npm start
    ```

    The server should now be running on `http://localhost:3001`.

### 2.3. Frontend Integration Issue

During testing, an issue was identified with the frontend-backend integration. The frontend application was unable to connect to the backend API due to an incorrect API base URL. To fix this, you need to create a `.env` file in the `hie-frontend` directory and add the following line:

```
VITE_API_BASE_URL=http://localhost:3001/api
```

After adding this environment variable, you need to rebuild and redeploy the frontend application for the changes to take effect.




## 3. API Endpoints

This section details the various API endpoints exposed by the HIE backend, including their functionality, request parameters, and response structures.

### 3.1. Authentication Routes (`/api/auth`)

These endpoints handle user registration, login, token management, and profile operations.

#### 3.1.1. `POST /api/auth/register`

Registers a new user in the system.

*   **Description:** Allows new users (doctors, nurses, or administrators) to create an account.
*   **Roles:** Public (no authentication required)
*   **Request Body:**
    *   `email` (string, required): User's email address (must be a valid email format).
    *   `password` (string, required): User's password (minimum 8 characters).
    *   `role` (string, required): User's role (must be one of `doctor`, `nurse`, `admin`).
    *   `firstName` (string, required): User's first name.
    *   `lastName` (string, required): User's last name.
    *   `nhifId` (string, optional): User's NHIF ID.
    *   `hospitalId` (string, required): The ID of the hospital the user is associated with.
*   **Success Response (201 Created):**
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": "<uuid>",
        "email": "<user-email>",
        "role": "<user-role>",
        "firstName": "<first-name>",
        "lastName": "<last-name>",
        "nhifId": "<nhif-id>",
        "hospitalId": "<hospital-id>",
        "createdAt": "<timestamp>"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., invalid email, weak password, missing required fields).
        ```json
        {
          "error": "Validation failed",
          "code": "VALIDATION_ERROR",
          "details": [
            { "msg": "Invalid value", "path": "email", "location": "body" }
          ]
        }
        ```
    *   `409 Conflict`: User with the provided email already exists.
        ```json
        {
          "error": "User already exists",
          "code": "USER_EXISTS"
        }
        ```
    *   `500 Internal Server Error`: General server error during registration.
        ```json
        {
          "error": "Registration failed",
          "code": "SERVER_ERROR"
        }
        ```

#### 3.1.2. `POST /api/auth/login`

Authenticates a user and provides access and refresh tokens.

*   **Description:** Users provide their credentials to obtain JWT tokens for accessing protected resources. Supports optional MFA.
*   **Roles:** Public (no authentication required)
*   **Request Body:**
    *   `email` (string, required): User's email address.
    *   `password` (string, required): User's password.
    *   `mfaCode` (string, optional): MFA code if MFA is enabled for the user (6 digits).
*   **Success Response (200 OK):**
    *   **Without MFA:**
        ```json
        {
          "message": "Login successful",
          "user": {
            "id": "<uuid>",
            "email": "<user-email>",
            "firstName": "<first-name>",
            "lastName": "<last-name>",
            "role": "<user-role>",
            "hospitalId": "<hospital-id>",
            "nhifId": "<nhif-id>",
            "mfaEnabled": false
          },
          "tokens": {
            "accessToken": "<jwt-access-token>",
            "refreshToken": "<jwt-refresh-token>",
            "expiresIn": "8h"
          }
        }
        ```
    *   **MFA Required (initial response):**
        ```json
        {
          "message": "MFA code required",
          "code": "MFA_REQUIRED",
          "requiresMFA": true,
          "tempToken": "<temporary-jwt-token>"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., invalid email format, missing password).
    *   `401 Unauthorized`: Invalid credentials (email/password mismatch) or invalid MFA code.
    *   `500 Internal Server Error`: General server error during login.

#### 3.1.3. `POST /api/auth/verify-mfa`

Verifies the MFA code for a user who has MFA enabled.

*   **Description:** Used after a `MFA_REQUIRED` response from the login endpoint to complete the authentication process.
*   **Roles:** Public (requires `tempToken` from previous login attempt)
*   **Request Body:**
    *   `tempToken` (string, required): Temporary JWT token received from the initial login response.
    *   `mfaCode` (string, required): The 6-digit MFA code.
*   **Success Response (200 OK):**
    ```json
    {
      "message": "MFA verification successful",
      "user": {
        "id": "<uuid>",
        "email": "<user-email>",
        "firstName": "<first-name>",
        "lastName": "<last-name>",
        "role": "<user-role>",
        "hospitalId": "<hospital-id>",
        "nhifId": "<nhif-id>",
        "mfaEnabled": true
      },
      "tokens": {
        "accessToken": "<jwt-access-token>",
        "refreshToken": "<jwt-refresh-token>",
        "expiresIn": "8h"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing `tempToken` or `mfaCode`).
    *   `401 Unauthorized`: Invalid `tempToken`, expired `tempToken`, or invalid MFA code.
    *   `404 Not Found`: User associated with the `tempToken` not found.
    *   `500 Internal Server Error`: General server error during MFA verification.

#### 3.1.4. `POST /api/auth/refresh`

Refreshes an expired access token using a refresh token.

*   **Description:** Allows clients to obtain a new access token without requiring the user to re-authenticate with their password.
*   **Roles:** Public (requires `refreshToken`)
*   **Request Body:**
    *   `refreshToken` (string, required): The refresh token obtained during login.
*   **Success Response (200 OK):**
    ```json
    {
      "tokens": {
        "accessToken": "<new-jwt-access-token>",
        "refreshToken": "<new-jwt-refresh-token>",
        "expiresIn": "8h"
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or expired refresh token.
    *   `500 Internal Server Error`: General server error during token refresh.

#### 3.1.5. `GET /api/auth/profile`

Retrieves the authenticated user's profile information.

*   **Description:** Provides details about the currently logged-in user.
*   **Roles:** Authenticated users (doctor, nurse, admin)
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Success Response (200 OK):**
    ```json
    {
      "user": {
        "id": "<uuid>",
        "email": "<user-email>",
        "firstName": "<first-name>",
        "lastName": "<last-name>",
        "role": "<user-role>",
        "hospitalId": "<hospital-id>",
        "nhifId": "<nhif-id>",
        "mfaEnabled": <boolean>,
        "createdAt": "<timestamp>",
        "lastLogin": "<timestamp>"
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `404 Not Found`: User profile not found.
    *   `500 Internal Server Error`: General server error.

#### 3.1.6. `PUT /api/auth/profile`

Updates the authenticated user's profile information.

*   **Description:** Allows users to update their first name, last name, NHIF ID, and hospital ID.
*   **Roles:** Authenticated users (doctor, nurse, admin)
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Request Body:** (All fields are optional, only provide fields to update)
    *   `firstName` (string): User's updated first name.
    *   `lastName` (string): User's updated last name.
    *   `nhifId` (string): User's updated NHIF ID.
    *   `hospitalId` (string): User's updated hospital ID.
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Profile updated successfully",
      "user": {
        "id": "<uuid>",
        "email": "<user-email>",
        "role": "<user-role>",
        "firstName": "<updated-first-name>",
        "lastName": "<updated-last-name>",
        "nhifId": "<updated-nhif-id>",
        "hospitalId": "<updated-hospital-id>"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `500 Internal Server Error`: General server error during profile update.

#### 3.1.7. `PUT /api/auth/change-password`

Changes the authenticated user's password.

*   **Description:** Requires the current password and a new password.
*   **Roles:** Authenticated users (doctor, nurse, admin)
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Request Body:**
    *   `currentPassword` (string, required): User's current password.
    *   `newPassword` (string, required): User's new password (minimum 8 characters).
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Password changed successfully"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Invalid current password or invalid/missing access token.
    *   `500 Internal Server Error`: General server error during password change.

#### 3.1.8. `POST /api/auth/enable-mfa`

Enables Multi-Factor Authentication (MFA) for the authenticated user.

*   **Description:** Generates an MFA secret and provides backup codes. In a production environment, the secret would be used to generate a QR code for authenticator apps.
*   **Roles:** Authenticated users (doctor, nurse, admin)
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "MFA enabled successfully",
      "secret": "<mfa-secret>",
      "backupCodes": [
        "<code1>",
        "<code2>",
        "<code3>"
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `500 Internal Server Error`: General server error during MFA enablement.

#### 3.1.9. `POST /api/auth/disable-mfa`

Disables Multi-Factor Authentication (MFA) for the authenticated user.

*   **Description:** Requires the user to provide a valid MFA code to disable MFA.
*   **Roles:** Authenticated users (doctor, nurse, admin) with MFA enabled.
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Request Body:**
    *   `mfaCode` (string, required): The 6-digit MFA code.
*   **Success Response (200 OK):**
    ```json
    {
      "message": "MFA disabled successfully"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing `mfaCode`).
    *   `401 Unauthorized`: Invalid MFA code or invalid/missing access token.
    *   `500 Internal Server Error`: General server error during MFA disablement.

#### 3.1.10. `POST /api/auth/logout`

Logs out the authenticated user by invalidating their refresh token.

*   **Description:** Clears the refresh token from the database, effectively logging the user out from all devices.
*   **Roles:** Authenticated users (doctor, nurse, admin)
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Logout successful"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `500 Internal Server Error`: General server error during logout.





### 3.2. Patient Routes (`/api/patients`)

These endpoints manage patient records, including creation, retrieval, update, and search operations.

#### 3.2.1. `GET /api/patients`

Retrieves a list of all patients with optional pagination and search filters.

*   **Description:** Provides a paginated list of patient records. Can be filtered by search terms (first name, last name, NHIF ID) and hospital ID.
*   **Roles:** `doctor`, `nurse`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Query Parameters:**
    *   `page` (integer, optional): Page number for pagination (default: 1).
    *   `limit` (integer, optional): Number of records per page (default: 10).
    *   `search` (string, optional): Search term for first name, last name, or NHIF ID.
    *   `hospital` (string, optional): Hospital ID to filter patients. (Admin users can filter by any hospital, non-admin users are restricted to their assigned hospital).
*   **Success Response (200 OK):**
    ```json
    {
      "patients": [
        {
          "id": "<uuid>",
          "nhifId": "<nhif-id>",
          "firstName": "<first-name>",
          "lastName": "<last-name>",
          "dateOfBirth": "<date-of-birth>",
          "gender": "<gender>",
          "phone": "<phone-number>",
          "email": "<email>",
          "address": "<address>",
          "createdAt": "<timestamp>"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "pages": 10
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `500 Internal Server Error`: General server error.

#### 3.2.2. `GET /api/patients/:id`

Retrieves a single patient record by ID, including their associated medical records.

*   **Description:** Fetches detailed information for a specific patient, along with a list of their medical records.
*   **Roles:** `doctor`, `nurse`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Path Parameters:**
    *   `id` (UUID, required): The unique identifier of the patient.
*   **Success Response (200 OK):**
    ```json
    {
      "id": "<uuid>",
      "nhifId": "<nhif-id>",
      "firstName": "<first-name>",
      "lastName": "<last-name>",
      "dateOfBirth": "<date-of-birth>",
      "gender": "<gender>",
      "phone": "<phone-number>",
      "email": "<email>",
      "address": "<address>",
      "emergencyContact": { ... },
      "medicalHistory": { ... },
      "allergies": ["<allergy1>", "<allergy2>"],
      "currentMedications": { ... },
      "insuranceInfo": { ... },
      "medicalRecords": [
        {
          "id": "<medical-record-uuid>",
          "hospitalId": "<hospital-id>",
          "visitDate": "<timestamp>",
          "diagnosis": "<diagnosis>",
          "treatment": "<treatment>",
          "medications": { ... },
          "vitalSigns": { ... },
          "notes": "<notes>"
        }
      ],
      "createdAt": "<timestamp>",
      "updatedAt": "<timestamp>"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid patient ID format.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `404 Not Found`: Patient not found.
    *   `500 Internal Server Error`: General server error.

#### 3.2.3. `POST /api/patients`

Creates a new patient record.

*   **Description:** Adds a new patient to the system.
*   **Roles:** `doctor`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Request Body:**
    *   `nhifId` (string, required): Unique NHIF ID for the patient.
    *   `firstName` (string, required): Patient's first name.
    *   `lastName` (string, required): Patient's last name.
    *   `dateOfBirth` (date, required): Patient's date of birth (ISO 8601 format).
    *   `gender` (string, required): Patient's gender (`male`, `female`, `other`).
    *   `phone` (string, optional): Patient's phone number.
    *   `email` (string, optional): Patient's email address.
    *   `address` (string, optional): Patient's address.
    *   `emergencyContact` (object, optional): JSON object containing emergency contact details (e.g., `{ "name": "", "phone": "" }`).
    *   `medicalHistory` (object, optional): JSON object for medical history (e.g., `{ "conditions": [] }`).
    *   `allergies` (array of strings, optional): List of patient allergies.
    *   `currentMedications` (object, optional): JSON object for current medications.
    *   `insuranceInfo` (object, optional): JSON object for insurance information.
*   **Success Response (201 Created):**
    ```json
    {
      "message": "Patient created successfully",
      "patient": {
        "id": "<uuid>",
        "nhifId": "<nhif-id>",
        "firstName": "<first-name>",
        "lastName": "<last-name>",
        "dateOfBirth": "<date-of-birth>",
        "gender": "<gender>",
        "phone": "<phone-number>",
        "email": "<email>",
        "address": "<address>",
        "emergencyContact": { ... },
        "medicalHistory": { ... },
        "allergies": ["<allergy1>"],
        "currentMedications": { ... },
        "insuranceInfo": { ... },
        "createdAt": "<timestamp>"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `409 Conflict`: Patient with the provided NHIF ID already exists.
    *   `500 Internal Server Error`: General server error.

#### 3.2.4. `PUT /api/patients/:id`

Updates an existing patient record by ID.

*   **Description:** Modifies the details of an existing patient.
*   **Roles:** `doctor`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Path Parameters:**
    *   `id` (UUID, required): The unique identifier of the patient to update.
*   **Request Body:** (All fields are optional, only provide fields to update)
    *   `firstName` (string): Patient's updated first name.
    *   `lastName` (string): Patient's updated last name.
    *   `dateOfBirth` (date): Patient's updated date of birth (ISO 8601 format).
    *   `gender` (string): Patient's updated gender (`male`, `female`, `other`).
    *   `phone` (string): Patient's updated phone number.
    *   `email` (string): Patient's updated email address.
    *   `address` (string): Patient's updated address.
    *   `emergencyContact` (object): Updated JSON object for emergency contact.
    *   `medicalHistory` (object): Updated JSON object for medical history.
    *   `allergies` (array of strings): Updated list of patient allergies.
    *   `currentMedications` (object): Updated JSON object for current medications.
    *   `insuranceInfo` (object): Updated JSON object for insurance information.
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Patient updated successfully",
      "patient": {
        "id": "<uuid>",
        "nhifId": "<nhif-id>",
        "firstName": "<updated-first-name>",
        "lastName": "<updated-last-name>",
        "dateOfBirth": "<updated-date-of-birth>",
        "gender": "<updated-gender>",
        "phone": "<updated-phone-number>",
        "email": "<updated-email>",
        "address": "<updated-address>",
        "emergencyContact": { ... },
        "medicalHistory": { ... },
        "allergies": ["<updated-allergy1>"],
        "currentMedications": { ... },
        "insuranceInfo": { ... },
        "updatedAt": "<timestamp>"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `404 Not Found`: Patient not found.
    *   `500 Internal Server Error`: General server error.

#### 3.2.5. `GET /api/patients/search/nhif/:nhifId`

Searches for a patient by their NHIF ID.

*   **Description:** Provides a quick way to retrieve a patient record using their unique NHIF identifier.
*   **Roles:** `doctor`, `nurse`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Path Parameters:**
    *   `nhifId` (string, required): The NHIF ID of the patient.
*   **Success Response (200 OK):**
    ```json
    {
      "id": "<uuid>",
      "nhifId": "<nhif-id>",
      "firstName": "<first-name>",
      "lastName": "<last-name>",
      "dateOfBirth": "<date-of-birth>",
      "gender": "<gender>",
      "phone": "<phone-number>",
      "email": "<email>",
      "createdAt": "<timestamp>"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid NHIF ID format.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `404 Not Found`: Patient not found.
    *   `500 Internal Server Error`: General server error.





### 3.3. FHIR Routes (`/fhir`)

These endpoints provide FHIR R4 compliant access to patient and observation data.

#### 3.3.1. `GET /fhir/Patient/:id`

Retrieves a FHIR Patient resource by ID.

*   **Description:** Fetches a patient record in FHIR R4 Patient resource format.
*   **Roles:** `doctor`, `nurse`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Path Parameters:**
    *   `id` (UUID, required): The unique identifier of the patient.
*   **Success Response (200 OK):**
    ```json
    {
      "resourceType": "Patient",
      "id": "<uuid>",
      "meta": {
        "versionId": "1",
        "lastUpdated": "<timestamp>",
        "profile": [
          "http://hl7.org/fhir/StructureDefinition/Patient"
        ]
      },
      "identifier": [
        {
          "use": "official",
          "type": {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                "code": "MR",
                "display": "Medical record number"
              }
            ]
          },
          "system": "http://nhif.go.ke/identifier/nhif-id",
          "value": "<nhif-id>"
        }
      ],
      "active": true,
      "name": [
        {
          "use": "official",
          "family": "<last-name>",
          "given": [
            "<first-name>"
          ]
        }
      ],
      "telecom": [
        {
          "system": "phone",
          "value": "<phone-number>",
          "use": "mobile"
        },
        {
          "system": "email",
          "value": "<email>",
          "use": "home"
        }
      ],
      "gender": "<gender>",
      "birthDate": "<date-of-birth>",
      "address": [
        {
          "use": "home",
          "type": "physical",
          "text": "<address>"
        }
      ],
      "contact": [
        {
          "relationship": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
                  "code": "C",
                  "display": "Emergency Contact"
                }
              ]
            }
          ],
          "name": {
            "text": "<emergency-contact-name>"
          },
          "telecom": [
            {
              "system": "phone",
              "value": "<emergency-contact-phone>"
            }
          ]
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid patient ID format.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `404 Not Found`: Patient not found (FHIR OperationOutcome format).
    *   `500 Internal Server Error`: General server error (FHIR OperationOutcome format).

#### 3.3.2. `GET /fhir/Patient`

Searches for FHIR Patient resources.

*   **Description:** Allows searching for patient records using various FHIR search parameters.
*   **Roles:** `doctor`, `nurse`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Query Parameters:**
    *   `identifier` (string, optional): Search by NHIF ID (e.g., `identifier=123456789`).
    *   `name` (string, optional): Search by patient's first or last name (e.g., `name=John`).
    *   `birthdate` (date, optional): Search by patient's birth date (ISO 8601 format).
    *   `gender` (string, optional): Search by patient's gender (`male`, `female`, `other`).
    *   `_count` (integer, optional): Number of records to return (default: 10).
    *   `_offset` (integer, optional): Offset for pagination (default: 0).
*   **Success Response (200 OK):** (FHIR Bundle format)
    ```json
    {
      "resourceType": "Bundle",
      "id": "search-<timestamp>",
      "type": "searchset",
      "total": <number-of-results>,
      "entry": [
        {
          "fullUrl": "<fhir-base-url>/Patient/<patient-uuid>",
          "resource": { /* FHIR Patient Resource */ }
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `500 Internal Server Error`: General server error (FHIR OperationOutcome format).

#### 3.3.3. `GET /fhir/Observation`

Retrieves FHIR Observation resources for a patient.

*   **Description:** Fetches vital signs data for a specific patient in FHIR R4 Observation resource format.
*   **Roles:** `doctor`, `nurse`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Query Parameters:**
    *   `patient` (UUID, required): The unique identifier of the patient.
    *   `category` (string, optional): Filter by observation category (e.g., `vital-signs`).
    *   `code` (string, optional): Filter by observation code (e.g., LOINC code).
*   **Success Response (200 OK):** (FHIR Bundle format)
    ```json
    {
      "resourceType": "Bundle",
      "id": "observations-<timestamp>",
      "type": "searchset",
      "total": <number-of-results>,
      "entry": [
        {
          "fullUrl": "<fhir-base-url>/Observation/<observation-id>",
          "resource": { /* FHIR Observation Resource */ }
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `patient` parameter.
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `500 Internal Server Error`: General server error (FHIR OperationOutcome format).

#### 3.3.4. `PUT /fhir/Patient/:id`

Creates or updates a FHIR Patient resource.

*   **Description:** Allows creating a new patient or updating an existing one using a FHIR Patient resource payload.
*   **Roles:** `doctor`, `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Path Parameters:**
    *   `id` (UUID, required): The unique identifier of the patient to create or update.
*   **Request Body:** (FHIR Patient Resource)
    ```json
    {
      "resourceType": "Patient",
      "id": "<uuid>",
      "identifier": [
        {
          "system": "http://nhif.go.ke/identifier/nhif-id",
          "value": "<nhif-id>"
        }
      ],
      "name": [
        {
          "given": [
            "<first-name>"
          ],
          "family": "<last-name>"
        }
      ],
      "gender": "<gender>",
      "telecom": [
        {
          "system": "phone",
          "value": "<phone-number>"
        },
        {
          "system": "email",
          "value": "<email>"
        }
      ],
      "address": [
        {
          "text": "<address>"
        }
      ]
    }
    ```
*   **Success Response (200 OK):** (Updated FHIR Patient Resource)
    ```json
    { /* Updated FHIR Patient Resource */ }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid FHIR resource format, missing required fields (FHIR OperationOutcome format).
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role.
    *   `404 Not Found`: Patient not found (FHIR OperationOutcome format).
    *   `500 Internal Server Error`: General server error (FHIR OperationOutcome format).

#### 3.3.5. `GET /fhir/metadata`

Retrieves the FHIR Capability Statement.

*   **Description:** Provides information about the FHIR capabilities supported by the server.
*   **Roles:** Public (no authentication required)
*   **Success Response (200 OK):** (FHIR CapabilityStatement Resource)
    ```json
    {
      "resourceType": "CapabilityStatement",
      "id": "hie-capability",
      "url": "<fhir-base-url>/metadata",
      "version": "1.0.0",
      "name": "HIE_FHIR_Server",
      "title": "Health Information Exchange FHIR Server",
      "status": "active",
      "date": "<timestamp>",
      "publisher": "HIE System",
      "description": "FHIR R4 server for Health Information Exchange",
      "fhirVersion": "4.0.1",
      "format": [
        "json"
      ],
      "rest": [
        {
          "mode": "server",
          "resource": [
            {
              "type": "Patient",
              "interaction": [
                { "code": "read" },
                { "code": "search-type" },
                { "code": "update" }
              ],
              "searchParam": [
                { "name": "identifier", "type": "token" },
                { "name": "name", "type": "string" },
                { "name": "birthdate", "type": "date" },
                { "name": "gender", "type": "token" }
              ]
            },
            {
              "type": "Observation",
              "interaction": [
                { "code": "search-type" }
              ],
              "searchParam": [
                { "name": "patient", "type": "reference" },
                { "name": "category", "type": "token" },
                { "name": "code", "type": "token" }
              ]
            }
          ]
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `500 Internal Server Error`: General server error.





### 3.4. Audit Routes (`/api/audit`)

These endpoints provide access to system audit logs.

#### 3.4.1. `GET /api/audit`

Retrieves a list of all audit logs with optional pagination and filters.

*   **Description:** Provides a paginated list of audit logs, recording various system events and user actions. Can be filtered by user ID, action type, resource type, and status.
*   **Roles:** `admin`
*   **Request Headers:**
    *   `Authorization`: `Bearer <access-token>`
*   **Query Parameters:**
    *   `page` (integer, optional): Page number for pagination (default: 1).
    *   `limit` (integer, optional): Number of records per page (default: 10).
    *   `userId` (UUID, optional): Filter logs by a specific user ID.
    *   `action` (string, optional): Filter logs by action type (e.g., `LOGIN_SUCCESS`, `CREATE_PATIENT`).
    *   `resourceType` (string, optional): Filter logs by resource type (e.g., `USER`, `PATIENT`).
    *   `status` (string, optional): Filter logs by status (`SUCCESS`, `FAILURE`).
*   **Success Response (200 OK):**
    ```json
    {
      "auditLogs": [
        {
          "id": "<uuid>",
          "userId": "<user-uuid>",
          "action": "<action-type>",
          "resourceType": "<resource-type>",
          "resourceId": "<resource-uuid>",
          "status": "<status>",
          "ipAddress": "<ip-address>",
          "userAgent": "<user-agent>",
          "details": { /* JSON object with additional details */ },
          "timestamp": "<timestamp>"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "pages": 10
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing access token.
    *   `403 Forbidden`: User does not have the required role (only `admin` can access).
    *   `500 Internal Server Error`: General server error.





## 4. Database Schema

The HIE backend uses a PostgreSQL database. Below is a simplified representation of the key tables and their relationships.

### 4.1. `users` Table

Stores information about registered users (doctors, nurses, administrators).

| Column Name    | Data Type | Constraints           | Description                                    |
| :------------- | :-------- | :-------------------- | :--------------------------------------------- |
| `id`           | UUID      | PRIMARY KEY, NOT NULL | Unique identifier for the user.                |
| `email`        | TEXT      | NOT NULL, UNIQUE      | User's email address (login credential).       |
| `password`     | TEXT      | NOT NULL              | Hashed password of the user.                   |
| `role`         | TEXT      | NOT NULL              | User's role (`doctor`, `nurse`, `admin`).      |
| `first_name`   | TEXT      | NOT NULL              | User's first name.                             |
| `last_name`    | TEXT      | NOT NULL              | User's last name.                              |
| `nhif_id`      | TEXT      | UNIQUE                | User's NHIF ID (optional).                     |
| `hospital_id`  | TEXT      | NOT NULL              | ID of the hospital the user is associated with.|
| `mfa_secret`   | TEXT      |                       | Secret for Multi-Factor Authentication.        |
| `mfa_enabled`  | BOOLEAN   | DEFAULT FALSE         | Indicates if MFA is enabled for the user.      |
| `created_at`   | TIMESTAMP | DEFAULT NOW()         | Timestamp when the user record was created.    |
| `updated_at`   | TIMESTAMP | DEFAULT NOW()         | Timestamp when the user record was last updated.|
| `last_login`   | TIMESTAMP |                       | Timestamp of the user's last successful login. |

### 4.2. `patients` Table

Stores demographic and general medical information about patients.

| Column Name        | Data Type | Constraints           | Description                                    |
| :----------------- | :-------- | :-------------------- | :--------------------------------------------- |
| `id`               | UUID      | PRIMARY KEY, NOT NULL | Unique identifier for the patient.             |
| `nhif_id`          | TEXT      | NOT NULL, UNIQUE      | Unique NHIF ID for the patient.                |
| `first_name`       | TEXT      | NOT NULL              | Patient's first name.                          |
| `last_name`        | TEXT      | NOT NULL              | Patient's last name.                           |
| `date_of_birth`    | DATE      | NOT NULL              | Patient's date of birth.                       |
| `gender`           | TEXT      | NOT NULL              | Patient's gender (`male`, `female`, `other`).  |
| `phone`            | TEXT      |                       | Patient's phone number.                        |
| `email`            | TEXT      |                       | Patient's email address.                       |
| `address`          | TEXT      |                       | Patient's physical address.                    |
| `emergency_contact`| JSONB     |                       | JSON object for emergency contact details.     |
| `medical_history`  | JSONB     |                       | JSON object for general medical history.       |
| `allergies`        | JSONB     |                       | JSON array of patient allergies.               |
| `current_medications`| JSONB     |                       | JSON object for current medications.           |
| `insurance_info`   | JSONB     |                       | JSON object for insurance information.         |
| `created_at`       | TIMESTAMP | DEFAULT NOW()         | Timestamp when the patient record was created. |
| `updated_at`       | TIMESTAMP | DEFAULT NOW()         | Timestamp when the patient record was last updated.|

### 4.3. `medical_records` Table

Stores detailed medical visit information for patients.

| Column Name    | Data Type | Constraints                               | Description                                    |
| :------------- | :-------- | :---------------------------------------- | :--------------------------------------------- |
| `id`           | UUID      | PRIMARY KEY, NOT NULL                     | Unique identifier for the medical record.      |
| `patient_id`   | UUID      | NOT NULL, FOREIGN KEY REFERENCES `patients`(`id`) | ID of the patient this record belongs to.      |
| `hospital_id`  | TEXT      | NOT NULL                                  | ID of the hospital where the visit occurred.   |
| `visit_date`   | TIMESTAMP | NOT NULL                                  | Date and time of the medical visit.            |
| `diagnosis`    | TEXT      |                                           | Diagnosis for the visit.                       |
| `treatment`    | TEXT      |                                           | Treatment provided during the visit.           |
| `medications`  | JSONB     |                                           | JSON object for medications prescribed.        |
| `vital_signs`  | JSONB     |                                           | JSON object for vital signs recorded.          |
| `notes`        | TEXT      |                                           | Additional notes for the medical record.       |
| `created_at`   | TIMESTAMP | DEFAULT NOW()                             | Timestamp when the record was created.         |
| `updated_at`   | TIMESTAMP | DEFAULT NOW()                             | Timestamp when the record was last updated.    |

### 4.4. `audit_logs` Table

Records all significant user actions and system events for auditing purposes.

| Column Name    | Data Type | Constraints           | Description                                    |
| :------------- | :-------- | :-------------------- | :--------------------------------------------- |
| `id`           | UUID      | PRIMARY KEY, NOT NULL | Unique identifier for the audit log entry.     |
| `user_id`      | UUID      |                       | ID of the user who performed the action (can be NULL for system actions).|
| `action`       | TEXT      | NOT NULL              | Type of action performed (e.g., `LOGIN_SUCCESS`, `CREATE_PATIENT`).|
| `resource_type`| TEXT      | NOT NULL              | Type of resource affected (e.g., `USER`, `PATIENT`).|
| `resource_id`  | UUID      |                       | ID of the resource affected (can be NULL).     |
| `status`       | TEXT      | NOT NULL              | Status of the action (`SUCCESS`, `FAILURE`).   |
| `ip_address`   | TEXT      |                       | IP address from which the action originated.   |
| `user_agent`   | TEXT      |                       | User agent string of the client.               |
| `details`      | JSONB     |                       | JSON object containing additional details about the action.|
| `timestamp`    | TIMESTAMP | DEFAULT NOW()         | Timestamp when the audit log entry was created.|





## 5. Security Considerations

The HIE backend is designed with several security measures to protect sensitive health information. This section outlines the key security features implemented.

### 5.1. Authentication and Authorization

*   **JWT (JSON Web Tokens):** Used for secure, stateless authentication. Access tokens are short-lived, and refresh tokens are used to obtain new access tokens without re-authentication.
*   **Bcrypt.js:** Passwords are hashed using bcrypt.js with a strong salt to prevent brute-force attacks and rainbow table attacks.
*   **Multi-Factor Authentication (MFA):** Supports optional MFA to add an extra layer of security for user logins.
*   **Role-Based Access Control (RBAC):** Access to API endpoints and data is restricted based on the user's assigned role (`doctor`, `nurse`, `admin`). This ensures that users can only perform actions and access data relevant to their responsibilities.

### 5.2. Data Encryption

*   **Encryption at Rest:** Sensitive data in the PostgreSQL database should be encrypted at rest. While the application itself does not directly manage disk encryption, it relies on the underlying database and infrastructure to provide this security measure.
*   **Encryption in Transit:** All communication between the frontend and backend, and between the backend and the database, should be secured using HTTPS/SSL/TLS to prevent eavesdropping and tampering.

### 5.3. Input Validation and Sanitization

*   **Express-validator:** Used to validate and sanitize all incoming request data. This helps prevent common web vulnerabilities such as SQL injection, cross-site scripting (XSS), and other injection attacks.
*   **Schema Validation:** Data submitted to the API is validated against predefined schemas to ensure data integrity and conformity.

### 5.4. Rate Limiting

*   **Express-rate-limit:** Implemented to protect against brute-force attacks and denial-of-service (DoS) attacks by limiting the number of requests a user or IP address can make within a specified time window.

### 5.5. Helmet.js

*   **HTTP Headers:** Helmet.js is used to set various HTTP headers that enhance the application's security. These include:
    *   `X-Content-Type-Options: nosniff`
    *   `X-Frame-Options: DENY`
    *   `Strict-Transport-Security: max-age=...`
    *   `X-XSS-Protection: 1; mode=block`
    *   `Content-Security-Policy`: Configured to allow resources only from trusted sources, mitigating XSS attacks.

### 5.6. Audit Logging

*   **Comprehensive Logging:** All significant user actions and system events are logged, including successful and failed login attempts, data access, and modifications. These logs are crucial for security monitoring, incident response, and compliance auditing.
*   **Immutable Logs:** Audit logs are designed to be immutable, ensuring their integrity and reliability for forensic analysis.

### 5.7. Error Handling

*   **Centralized Error Handling:** The application uses centralized error handling middleware to catch and process errors consistently. This prevents sensitive information from being exposed in error responses and provides meaningful error messages to clients.
*   **Specific Error Codes:** Custom error codes are used to categorize and identify different types of errors, making it easier for clients to handle them programmatically.





## 6. Testing

This section outlines the procedures for testing the HIE backend, including API endpoint testing and frontend-backend integration verification.

### 6.1. Backend API Testing

All backend routes can be tested using tools like `curl`, Postman, Insomnia, or automated testing frameworks. The following examples use `curl` for demonstration purposes.

#### 6.1.1. Authentication Endpoints

**Register a new user:**

```bash
curl -X POST -H "Content-Type: application/json" \
-d 
```

**Login a user:**

```bash
curl -X POST -H "Content-Type: application/json" \
-d 
```

**Get user profile:**

```bash
ACCESS_TOKEN="<your-access-token>" # Replace with actual token from login
curl -X GET -H "Authorization: Bearer $ACCESS_TOKEN" \
https://<your-backend-url>/api/auth/profile
```

#### 6.1.2. Patient Endpoints

**Create a new patient:**

```bash
ACCESS_TOKEN="<your-access-token>" # Replace with actual token from login
curl -X POST -H "Content-Type: application/json" \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-d 
```

**Get all patients:**

```bash
ACCESS_TOKEN="<your-access-token>" # Replace with actual token from login
curl -X GET -H "Authorization: Bearer $ACCESS_TOKEN" \
https://<your-backend-url>/api/patients
```

**Get patient by ID:**

```bash
ACCESS_TOKEN="<your-access-token>" # Replace with actual token from login
PATIENT_ID="<patient-uuid>" # Replace with actual patient ID
curl -X GET -H "Authorization: Bearer $ACCESS_TOKEN" \
https://<your-backend-url>/api/patients/$PATIENT_ID
```

**Search patient by NHIF ID:**

```bash
ACCESS_TOKEN="<your-access-token>" # Replace with actual token from login
NHIF_ID="<patient-nhif-id>" # Replace with actual NHIF ID
curl -X GET -H "Authorization: Bearer $ACCESS_TOKEN" \
https://<your-backend-url>/api/patients/search/nhif/$NHIF_ID
```

#### 6.1.3. Audit Endpoints

**Get all audit logs:**

```bash
ADMIN_ACCESS_TOKEN="<your-admin-access-token>" # Replace with actual admin token
curl -X GET -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
https://<your-backend-url>/api/audit
```

#### 6.1.4. FHIR Endpoints

**Get FHIR Patient by ID:**

```bash
ACCESS_TOKEN="<your-access-token>" # Replace with actual token from login
PATIENT_ID="<patient-uuid>" # Replace with actual patient ID
curl -X GET -H "Authorization: Bearer $ACCESS_TOKEN" \
https://<your-backend-url>/fhir/Patient/$PATIENT_ID
```

### 6.2. Frontend-Backend Integration Testing

To verify the integration between the frontend and backend, follow these steps:

1.  **Ensure Backend is Running:** Make sure your backend server is running and accessible (e.g., at `http://localhost:3001`).

2.  **Configure Frontend API URL:** As noted in the "Getting Started" section, ensure the frontend is configured to point to the correct backend API URL. Create or update the `.env` file in the `hie-frontend` directory:

    ```
    VITE_API_BASE_URL=http://localhost:3001/api
    ```

    If you are running the backend on a publicly exposed URL (e.g., through a service like Manus), update this variable accordingly:

    ```
    VITE_API_BASE_URL=https://<your-exposed-backend-url>/api
    ```

3.  **Rebuild and Redeploy Frontend:** After updating the `.env` file, rebuild and redeploy the frontend application:

    ```bash
    cd hie-prototype/hie-frontend
    npm run build
    # Then deploy the 'dist' folder to your preferred hosting or use a service like Manus
    ```

4.  **Access Frontend Application:** Open the deployed frontend application in your web browser.

5.  **Perform User Actions:** Test the following functionalities in the frontend to ensure they interact correctly with the backend:
    *   **User Registration:** Register a new user through the frontend registration form.
    *   **User Login:** Log in with the newly registered user or an existing user.
    *   **Patient Management:** If applicable, navigate to patient management sections and try to create, view, and update patient records.
    *   **Profile Management:** Update your user profile through the frontend.

    Monitor both the frontend console (for client-side errors) and the backend server logs (for server-side errors and API requests) during these interactions.





## 7. Conclusion and Future Work

This document provides a comprehensive overview of the HIE prototype backend, covering its architecture, API endpoints, database schema, and security considerations. The backend is designed to be a robust and secure foundation for a health information exchange system, with a focus on interoperability through FHIR compliance.

### 7.1. Key Takeaways

*   The backend successfully implements core functionalities for user authentication, patient management, and audit logging.
*   FHIR R4 compliance for Patient and Observation resources enables standardized data exchange.
*   Security measures such as JWT, bcrypt, MFA, input validation, and rate limiting are in place to protect sensitive health information.
*   The frontend-backend integration issue related to the `VITE_API_BASE_URL` has been identified and a solution provided.

### 7.2. Future Enhancements

Several areas can be further developed to enhance the HIE prototype:

*   **Comprehensive FHIR Implementation:** Extend FHIR support to include more resource types (e.g., Encounter, MedicationRequest, DiagnosticReport) and operations (e.g., create, delete, history).
*   **Advanced Fraud Detection:** Integrate and implement the fraud detection module as initially planned, leveraging machine learning or rule-based systems to identify suspicious activities.
*   **Scalability and Performance Optimization:** Implement caching mechanisms, optimize database queries, and explore microservices architecture for improved scalability and performance under heavy load.
*   **Robust Error Logging and Monitoring:** Implement a more sophisticated logging system (e.g., ELK stack) and integrate with monitoring tools to proactively identify and resolve issues.
*   **Internationalization (i18n):** Support multiple languages for a broader user base.
*   **Detailed Documentation for Frontend:** Create similar comprehensive documentation for the frontend application.
*   **Automated Testing:** Implement a comprehensive suite of automated tests (unit, integration, end-to-end) to ensure code quality and prevent regressions.
*   **Deployment Automation:** Automate the deployment process using CI/CD pipelines for faster and more reliable releases.
*   **Enhanced Security Features:** Explore advanced security features such as API Gateway, Web Application Firewall (WAF), and regular security audits.

This documentation serves as a foundational guide for further development and maintenance of the HIE prototype backend.



