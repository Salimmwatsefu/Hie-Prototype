import express from "express";
import { body, param, validationResult } from "express-validator";
import { pool } from "../config/database.js";
import { authenticateToken, requireRole, auditLog } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Enhanced fraud detection with anatomical constraints
class AnatomyFraudDetector {
  static ANATOMICAL_LIMITS = {
    leg_amputation: 2,
    arm_amputation: 2,
    heart_surgery: 1,
    brain_surgery: 1,
    kidney_transplant: 2,
    liver_transplant: 1,
  };

  static detectAnatomicalViolations(procedures) {
    const violations = [];
    const procedureCounts = {};

    // Count procedures by type
    procedures.forEach((proc) => {
      const procType = this.categorizeProcedure(proc.procedure_name || proc.procedure);
      if (procType) {
        procedureCounts[procType] = (procedureCounts[procType] || 0) + 1;
      }
    });

    // Check for violations
    Object.entries(procedureCounts).forEach(([procType, count]) => {
      const limit = this.ANATOMICAL_LIMITS[procType];
      if (limit && count > limit) {
        violations.push({
          type: "anatomical_violation",
          procedure_type: procType,
          count: count,
          limit: limit,
          severity: "CRITICAL",
          description: `${count} ${procType.replace("_", " ")} procedures exceed human anatomical limit of ${limit}`,
          rule: `max_${procType} <= ${limit}`,
        });
      }
    });

    return violations;
  }

  static categorizeProcedure(procedureName) {
    const name = procedureName.toLowerCase();

    if (name.includes("leg amputation")) return "leg_amputation";
    if (name.includes("arm amputation")) return "arm_amputation";
    if (name.includes("heart") && (name.includes("surgery") || name.includes("bypass"))) return "heart_surgery";
    if (name.includes("brain") && name.includes("surgery")) return "brain_surgery";
    if (name.includes("kidney transplant")) return "kidney_transplant";
    if (name.includes("liver transplant")) return "liver_transplant";

    return null;
  }

  static detectCrossProviderPatterns(procedures) {
    const violations = [];
    const hospitals = new Set();
    const insuranceProviders = new Set();
    const nameVariations = new Set();

    procedures.forEach((proc) => {
      if (proc.hospital) hospitals.add(proc.hospital);
      if (proc.insurance_provider) insuranceProviders.add(proc.insurance_provider);
      if (proc.patient_name) nameVariations.add(proc.patient_name.toLowerCase().trim());
    });

    if (hospitals.size > 2) {
      violations.push({
        type: "cross_provider_pattern",
        severity: "HIGH",
        description: `Claims submitted to ${hospitals.size} different hospitals`,
        hospitals: Array.from(hospitals),
        rule: "multiple_hospitals_same_patient",
      });
    }

    if (insuranceProviders.size > 1) {
      violations.push({
        type: "insurance_fraud",
        severity: "HIGH",
        description: `Claims submitted to ${insuranceProviders.size} different insurance providers`,
        providers: Array.from(insuranceProviders),
        rule: "multiple_insurance_providers",
      });
    }

    if (nameVariations.size > 1) {
      violations.push({
        type: "identity_reuse",
        severity: "HIGH",
        description: `Same patient ID with ${nameVariations.size} different name variations`,
        names: Array.from(nameVariations),
        rule: "name_variations_same_id",
      });
    }

    return violations;
  }

  static detectTemporalAnomalies(procedures) {
    const violations = [];
    const dates = procedures.map((p) => new Date(p.date)).sort();

    // Check for procedures too close together
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (daysDiff < 7) {
        violations.push({
          type: "temporal_anomaly",
          severity: "MEDIUM",
          description: `Major procedures only ${Math.round(daysDiff)} days apart`,
          rule: "min_days_between_procedures >= 7",
        });
      }
    }

    return violations;
  }

  static calculateFraudScore(violations) {
    let score = 0;

    violations.forEach((violation) => {
      switch (violation.severity) {
        case "CRITICAL":
          score += 0.4;
          break;
        case "HIGH":
          score += 0.25;
          break;
        case "MEDIUM":
          score += 0.15;
          break;
        case "LOW":
          score += 0.05;
          break;
      }
    });

    return Math.min(score, 1.0);
  }
}

// Analyze procedures for fraud patterns
router.post(
  "/analyze-procedures",
  [
    body("patient_id").notEmpty().trim(),
    body("procedures").isArray().isLength({ min: 1 }),
  ],
  
  auditLog("ANALYZE_FRAUD_PROCEDURES", "FRAUD"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patient_id, procedures } = req.body;

      // Detect various types of fraud
      const anatomicalViolations = AnatomyFraudDetector.detectAnatomicalViolations(procedures);
      const crossProviderViolations = AnatomyFraudDetector.detectCrossProviderPatterns(procedures);
      const temporalViolations = AnatomyFraudDetector.detectTemporalAnomalies(procedures);

      const allViolations = [...anatomicalViolations, ...crossProviderViolations, ...temporalViolations];
      const fraudScore = AnatomyFraudDetector.calculateFraudScore(allViolations);

      // Determine risk level
      let riskLevel = "LOW";
      if (fraudScore >= 0.8) riskLevel = "CRITICAL";
      else if (fraudScore >= 0.6) riskLevel = "HIGH";
      else if (fraudScore >= 0.3) riskLevel = "MEDIUM";

      // Calculate financial impact
      const totalAmount = procedures.reduce((sum, proc) => sum + (proc.amount || 0), 0);
      const hospitalCount = new Set(procedures.map((p) => p.hospital)).size;
      const procedureCount = procedures.length;

      const analysis = {
        patient_id,
        fraud_score: fraudScore,
        risk_level: riskLevel,
        total_amount: totalAmount,
        procedure_count: procedureCount,
        hospital_count: hospitalCount,
        violations: allViolations,
        procedures: procedures,
        analysis_timestamp: new Date().toISOString(),
        recommendations: generateRecommendations(allViolations, fraudScore),
      };

      // Store in database if fraud detected
      if (fraudScore > 0.3) {
        await pool.query(
          `
        INSERT INTO enhanced_fraud_alerts 
        (patient_id, fraud_type, fraud_confidence, total_amount, procedure_count, hospital_count, anomalies, procedures, detection_rules)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
          [
            patient_id,
            determineMainFraudType(allViolations),
            fraudScore,
            totalAmount,
            procedureCount,
            hospitalCount,
            JSON.stringify(allViolations),
            JSON.stringify(procedures),
            JSON.stringify(AnatomyFraudDetector.ANATOMICAL_LIMITS),
          ]
        );
      }

      res.json(analysis);
    } catch (error) {
      console.error("Fraud analysis error:", error);
      res.status(500).json({ error: "Failed to analyze procedures for fraud" });
    }
  }
);

// Get fraud case details with full analysis
router.get(
  "/cases/:id/details",
  [param("id").isUUID()],
  requireRole(["doctor", "admin"]),
  auditLog("VIEW_FRAUD_CASE_DETAILS", "FRAUD"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
      SELECT * FROM enhanced_fraud_alerts WHERE id = $1
    `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Fraud case not found" });
      }

      const fraudCase = result.rows[0];

      // Parse JSON fields
      const anomalies = JSON.parse(fraudCase.anomalies || "[]");
      const procedures = JSON.parse(fraudCase.procedures || "[]");
      const detectionRules = JSON.parse(fraudCase.detection_rules || "{}");

      // Generate detailed analysis
      const detailedAnalysis = {
        case_id: fraudCase.id,
        patient_id: fraudCase.patient_id,
        fraud_type: fraudCase.fraud_type,
        fraud_confidence: parseFloat(fraudCase.fraud_confidence),
        financial_impact: {
          total_amount: parseFloat(fraudCase.total_amount || 0),
          procedure_count: fraudCase.procedure_count,
          hospital_count: fraudCase.hospital_count,
          average_per_procedure: parseFloat(fraudCase.total_amount || 0) / (fraudCase.procedure_count || 1),
        },
        timeline: procedures
          .map((proc) => ({
            date: proc.date,
            procedure: proc.procedure,
            hospital: proc.hospital,
            amount: proc.amount,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)),
        anomalies: anomalies.map((anomaly) => ({
          ...anomaly,
          explanation: generateAnomalyExplanation(anomaly),
          evidence: generateEvidence(anomaly, procedures),
        })),
        procedures: procedures,
        detection_rules: detectionRules,
        created_at: fraudCase.created_at,
        status: fraudCase.status || "pending",
        outcome: fraudCase.outcome ? JSON.parse(fraudCase.outcome) : null,
        lessons_learned: generateLessonsLearned(anomalies),
      };

      res.json(detailedAnalysis);
    } catch (error) {
      console.error("Get fraud case details error:", error);
      res.status(500).json({ error: "Failed to fetch fraud case details" });
    }
  }
);

// Get fraud analytics data for charts
// Get fraud analytics data for charts
router.get(
  "/analytics/charts",
  auditLog("VIEW_FRAUD_ANALYTICS", "FRAUD"),
  async (req, res) => {
    try {
      const { startDate, endDate, hospitalId } = req.query;

      console.log("📊 Incoming fraud analytics request params:", { startDate, endDate, hospitalId });

      let dateFilter = "";
      let hospitalFilter = "";
      const params = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        dateFilter += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        dateFilter += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
      }

      if (hospitalId) {
        paramCount++;
        hospitalFilter += ` AND hospital_count = $${paramCount}`;
        params.push(hospitalId);
      }

      console.log("📊 Final SQL date filter:", dateFilter);
      console.log("📊 Final SQL hospital filter:", hospitalFilter);
      console.log("📊 Final query params array:", params);

      // Fraud detection rate over time
      const trendQuery = `
        SELECT DATE(created_at) as date, 
               COUNT(*) as fraud_count,
               AVG(fraud_confidence) as avg_confidence,
               SUM(total_amount) as total_amount
        FROM enhanced_fraud_alerts 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' ${dateFilter} ${hospitalFilter}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      console.log("📊 Trend query:\n", trendQuery);
      const trendResult = await pool.query(trendQuery, params);
      console.log("📊 Trend rows returned:", trendResult.rows.length);

      // Fraud types distribution
      const typeQuery = `
        SELECT fraud_type, COUNT(*) as count, SUM(total_amount) as total_amount
        FROM enhanced_fraud_alerts 
        WHERE 1=1 ${dateFilter} ${hospitalFilter}
        GROUP BY fraud_type
        ORDER BY count DESC
      `;
      console.log("📊 Type query:\n", typeQuery);
      const typeResult = await pool.query(typeQuery, params);
      console.log("📊 Type rows returned:", typeResult.rows.length);

      // Risk level distribution
      const riskQuery = `
        SELECT 
          CASE 
            WHEN fraud_confidence >= 0.8 THEN 'CRITICAL'
            WHEN fraud_confidence >= 0.6 THEN 'HIGH'
            WHEN fraud_confidence >= 0.3 THEN 'MEDIUM'
            ELSE 'LOW'
          END as risk_level,
          COUNT(*) as count,
          AVG(fraud_confidence) as avg_confidence
        FROM enhanced_fraud_alerts 
        WHERE 1=1 ${dateFilter} ${hospitalFilter}
        GROUP BY 
          CASE 
            WHEN fraud_confidence >= 0.8 THEN 'CRITICAL'
            WHEN fraud_confidence >= 0.6 THEN 'HIGH'
            WHEN fraud_confidence >= 0.3 THEN 'MEDIUM'
            ELSE 'LOW'
          END
        ORDER BY avg_confidence DESC
      `;
      console.log("📊 Risk query:\n", riskQuery);
      const riskResult = await pool.query(riskQuery, params);
      console.log("📊 Risk rows returned:", riskResult.rows.length);

      // Hospital fraud statistics
      const hospitalQuery = `
        SELECT 
          hospital_count,
          COUNT(*) as case_count,
          AVG(fraud_confidence) as avg_confidence,
          SUM(total_amount) as total_amount
        FROM enhanced_fraud_alerts 
        WHERE 1=1 ${dateFilter} ${hospitalFilter}
        GROUP BY hospital_count
        ORDER BY hospital_count
      `;
      console.log("📊 Hospital query:\n", hospitalQuery);
      const hospitalResult = await pool.query(hospitalQuery, params);
      console.log("📊 Hospital rows returned:", hospitalResult.rows.length);

      const analytics = {
        fraud_trend: trendResult.rows.map((row) => ({
          date: row.date,
          fraud_count: parseInt(row.fraud_count),
          avg_confidence: parseFloat(row.avg_confidence || 0),
          total_amount: parseFloat(row.total_amount || 0),
        })),
        fraud_types: typeResult.rows.map((row) => ({
          type: row.fraud_type,
          count: parseInt(row.count),
          total_amount: parseFloat(row.total_amount || 0),
        })),
        risk_levels: riskResult.rows.map((row) => ({
          level: row.risk_level,
          count: parseInt(row.count),
          avg_confidence: parseFloat(row.avg_confidence || 0),
        })),
        hospital_patterns: hospitalResult.rows.map((row) => ({
          hospital_count: parseInt(row.hospital_count),
          case_count: parseInt(row.case_count),
          avg_confidence: parseFloat(row.avg_confidence || 0),
          total_amount: parseFloat(row.total_amount || 0),
        })),
        generated_at: new Date().toISOString(),
      };

      console.log("📊 Final analytics response:", analytics);
      res.json(analytics);
    } catch (error) {
      console.error("❌ Get fraud analytics error:", error);
      res.status(500).json({ error: "Failed to fetch fraud analytics" });
    }
  }
);


// Load sample fraud cases (including leg amputation case)
router.post(
  "/load-sample-cases",
 
  auditLog("LOAD_SAMPLE_FRAUD_CASES", "FRAUD"),
  async (req, res) => {
    try {
      // Load the generated fraud cases
      const datasetPath = path.join(__dirname, "../fraud_cases_dataset.json");
      const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

      let insertedCount = 0;

      for (const fraudCase of dataset.cases) {
        try {
          await pool.query(
            `
          INSERT INTO enhanced_fraud_alerts 
          (id, patient_id, fraud_type, fraud_confidence, total_amount, procedure_count, hospital_count, anomalies, procedures, detection_rules, status, outcome)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `,
            [
              fraudCase.id,
              fraudCase.patient_id,
              fraudCase.fraud_type,
              fraudCase.fraud_confidence,
              fraudCase.total_amount,
              fraudCase.procedure_count,
              fraudCase.hospital_count,
              JSON.stringify(fraudCase.anomalies),
              JSON.stringify(fraudCase.procedures),
              JSON.stringify(fraudCase.detection_rules || {}),
              fraudCase.status || "confirmed_fraud",
              JSON.stringify(fraudCase.outcome || {}),
            ]
          );
          insertedCount++;
        } catch (insertError) {
          console.warn(`Failed to insert case ${fraudCase.id}:`, insertError.message);
        }
      }

      res.json({
        message: `Successfully loaded ${insertedCount} sample fraud cases`,
        total_cases: dataset.cases.length,
        inserted_count: insertedCount,
        leg_amputation_case_id: dataset.cases[0].id,
      });
    } catch (error) {
      console.error("Load sample cases error:", error);
      res.status(500).json({ error: "Failed to load sample fraud cases" });
    }
  }
);


router.get(
  "/cases",
  requireRole(["doctor", "admin"]),
  auditLog("LIST_FRAUD_CASES", "FRAUD"),
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    // optionally add offset, filters...
    const result = await pool.query(
      `SELECT * FROM enhanced_fraud_alerts ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ cases: result.rows });
  }
);


// Helper functions
function determineMainFraudType(violations) {
  if (violations.some((v) => v.type === "anatomical_violation")) {
    return "anatomical_impossibility";
  }
  if (violations.some((v) => v.type === "cross_provider_pattern")) {
    return "cross_provider_fraud";
  }
  if (violations.some((v) => v.type === "insurance_fraud")) {
    return "insurance_fraud";
  }
  return "suspicious_activity";
}

function generateRecommendations(violations, fraudScore) {
  const recommendations = [];

  if (fraudScore >= 0.8) {
    recommendations.push("IMMEDIATE ACTION: Flag patient and block all future claims");
    recommendations.push("Investigate all associated hospitals and providers");
    recommendations.push("Coordinate with law enforcement and regulatory bodies");
  } else if (fraudScore >= 0.6) {
    recommendations.push("HIGH PRIORITY: Review patient's full medical history and claims");
    recommendations.push("Conduct interviews with involved medical staff");
    recommendations.push("Implement enhanced monitoring for this patient and related entities");
  } else if (fraudScore >= 0.3) {
    recommendations.push("MEDIUM PRIORITY: Conduct a detailed review of flagged procedures");
    recommendations.push("Verify patient identity and insurance details");
    recommendations.push("Monitor for recurring suspicious patterns");
  } else {
    recommendations.push("LOW PRIORITY: Log for future reference and trend analysis");
  }

  violations.forEach((violation) => {
    switch (violation.type) {
      case "anatomical_violation":
        recommendations.push(`Specific recommendation: Investigate ${violation.procedure_type.replace("_", " ")} claims. Review medical necessity and documentation.`);
        break;
      case "cross_provider_pattern":
        recommendations.push(`Specific recommendation: Investigate cross-provider activity involving hospitals: ${violation.hospitals.join(", ")}.`);
        break;
      case "insurance_fraud":
        recommendations.push(`Specific recommendation: Investigate multiple insurance provider claims: ${violation.providers.join(", ")}.`);
        break;
      case "temporal_anomaly":
        recommendations.push(`Specific recommendation: Review closely spaced procedures (${Math.round(violation.daysDiff)} days apart).`);
        break;
      case "identity_reuse":
        recommendations.push(`Specific recommendation: Verify patient identity due to name variations: ${violation.names.join(", ")}.`);
        break;
    }
  });

  return recommendations;
}

function generateAnomalyExplanation(anomaly) {
  switch (anomaly.type) {
    case "anatomical_violation":
      return `This anomaly indicates that the patient has undergone an unusually high number of ${anomaly.procedure_type.replace("_", " ")} procedures (${anomaly.count} times), exceeding the human anatomical limit of ${anomaly.limit}. This is a strong indicator of potential fraud or data entry error.`;
    case "cross_provider_pattern":
      return `This anomaly suggests that the patient's claims are being submitted across multiple healthcare providers (${anomaly.hospitals.length} hospitals). While not always fraudulent, this pattern can indicate \"patient brokering\" or \"doctor shopping\" for illicit purposes.`;
    case "insurance_fraud":
      return `This anomaly highlights claims being submitted to multiple different insurance providers (${anomaly.providers.length} providers) for the same patient. This is a common tactic in insurance fraud to maximize payouts or avoid detection.`;
    case "temporal_anomaly":
      return `This anomaly indicates that major medical procedures were performed in an unusually short timeframe (${Math.round(anomaly.daysDiff)} days apart). This could suggest unnecessary procedures, upcoding, or a lack of proper recovery time, all of which are red flags for fraud.`;
    case "identity_reuse":
      return `This anomaly points to the same patient ID being associated with multiple variations of the patient's name. This could be an attempt to obscure identity, create \"ghost patients,\" or facilitate identity theft for fraudulent billing.`;
    default:
      return "No specific explanation available for this anomaly type.";
  }
}

function generateEvidence(anomaly, procedures) {
  const evidence = [];
  switch (anomaly.type) {
    case "anatomical_violation":
      evidence.push(`Procedures: ${procedures.filter(p => AnatomyFraudDetector.categorizeProcedure(p.procedure_name || p.procedure) === anomaly.procedure_type).map(p => `${p.procedure_name || p.procedure} on ${p.date}`).join("; ")}`);
      break;
    case "cross_provider_pattern":
      evidence.push(`Hospitals involved: ${anomaly.hospitals.join(", ")}`);
      evidence.push(`Procedures: ${procedures.map(p => `${p.procedure_name || p.procedure} at ${p.hospital} on ${p.date}`).join("; ")}`);
      break;
    case "insurance_fraud":
      evidence.push(`Insurance providers: ${anomaly.providers.join(", ")}`);
      evidence.push(`Procedures: ${procedures.map(p => `${p.procedure_name || p.procedure} with ${p.insurance_provider} on ${p.date}`).join("; ")}`);
      break;
    case "temporal_anomaly":
      evidence.push(`Procedures: ${procedures.map(p => `${p.procedure_name || p.procedure} on ${p.date}`).join("; ")}`);
      break;
    case "identity_reuse":
      evidence.push(`Name variations: ${anomaly.names.join(", ")}`);
      evidence.push(`Procedures: ${procedures.map(p => `${p.procedure_name || p.procedure} for ${p.patient_name} on ${p.date}`).join("; ")}`);
      break;
  }
  return evidence;
}

function generateLessonsLearned(anomalies) {
  const lessons = [];
  if (anomalies.some(a => a.type === "anatomical_violation")) {
    lessons.push("Implement stricter validation for procedure codes and quantities based on anatomical limits.");
  }
  if (anomalies.some(a => a.type === "cross_provider_pattern")) {
    lessons.push("Enhance cross-referencing of patient claims across different hospitals and providers.");
  }
  if (anomalies.some(a => a.type === "insurance_fraud")) {
    lessons.push("Improve verification processes for patient insurance details and historical claims across multiple insurers.");
  }
  if (anomalies.some(a => a.type === "temporal_anomaly")) {
    lessons.push("Develop algorithms to detect unusually short intervals between major medical procedures.");
  }
  if (anomalies.some(a => a.type === "identity_reuse")) {
    lessons.push("Strengthen patient identity verification, including biometric or advanced demographic matching.");
  }
  if (lessons.length === 0) {
    lessons.push("No specific lessons learned from this case, but continuous monitoring is recommended.");
  }
  return lessons;
}

export default router;


