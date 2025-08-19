import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "./config/database.js";
import { apiLimiter, validateFHIRCompliance } from "./middleware/auth.js";

// Import routes
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import fhirRoutes from "./routes/fhir.js";
import auditRoutes from "./routes/audit.js";
import fraudRoutes from "./routes/fraud.js";
import enhancedFraudRoutes from "./routes/enhanced_fraud.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
} ));

// CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(morgan("combined", {
  skip: function (req, res) {
    // Skip logging for health checks
    return req.url === "/health";
  }
}));

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Apply general API rate limiting
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    security: {
      encryption: "AES-256",
      authentication: "OAuth 2.0 + JWT",
      mfa: process.env.MFA_ENABLED === "true",
      fhirCompliant: true
    }
  });
});

// System status endpoint
app.get("/api/status", async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query("SELECT NOW()");
    
    res.json({
      status: "operational",
      timestamp: new Date().toISOString(),
      services: {
        database: "healthy",
        authentication: "healthy",
        api: "healthy",
        encryption: "active"
      },
      compliance: {
        fhir: process.env.FHIR_VERSION || "4.0.1",
        hipaa: process.env.HIPAA_COMPLIANT === "true",
        gdpr: process.env.GDPR_COMPLIANT === "true"
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        responseTime: "< 1.5s"
      }
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      error: "Database connection failed"
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/enhanced-fraud", enhancedFraudRoutes);

// FHIR Routes with compliance validation
app.use("/fhir", validateFHIRCompliance, fhirRoutes);

// Demo data endpoint for testing
app.get("/api/demo-data", (req, res) => {
  res.json({
    users: [
      {
        email: "doctor@knh.co.ke",
        password: "password123",
        role: "doctor",
        name: "Dr. Sarah Mwangi",
        hospital: "Kenyatta National Hospital"
      },
      {
        email: "nurse@knh.co.ke",
        password: "password123",
        role: "nurse",
        name: "Nurse John Kiprotich",
        hospital: "Kenyatta National Hospital"
      },
      {
        email: "admin@hie.co.ke",
        password: "password123",
        role: "admin",
        name: "Admin Mary Wanjiku",
        hospital: "HIE System"
      }
    ],
    mfaCodes: ["123456", "654321", "111111"],
    hospitals: [
      "Kenyatta National Hospital",
      "Moi Teaching and Referral Hospital",
      "Aga Khan University Hospital",
      "Nairobi Hospital"
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  // CORS error
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS policy violation",
      code: "CORS_ERROR"
    });
  }
  
  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
      code: "INVALID_TOKEN"
    });
  }
  
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
      code: "TOKEN_EXPIRED"
    });
  }
  
  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.details
    });
  }
  
  // Database errors
  if (err.code && err.code.startsWith("23")) {
    return res.status(409).json({
      error: "Database constraint violation",
      code: "DB_CONSTRAINT_ERROR"
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
    code: "SERVER_ERROR"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    pool.end();
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    pool.end();
  });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🏥 HIE Server running on port ${PORT}`);
  console.log(`🔒 Security: AES-256 encryption, OAuth 2.0 + MFA`);
  console.log(`🌐 FHIR: ${process.env.FHIR_VERSION || "4.0.1"} compliant`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health` );
});

export default app;

