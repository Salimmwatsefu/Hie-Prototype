import express from "express";
import { param, query, validationResult } from "express-validator";
import { pool } from "../config/database.js";
import { authenticateToken, requireRole, auditLog } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get audit logs (admin only)
router.get("/", requireRole(["admin"]), auditLog("VIEW_AUDIT_LOGS", "AUDIT"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email, u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by user ID
    if (userId) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      params.push(userId);
    }

    // Filter by action
    if (action) {
      paramCount++;
      query += ` AND al.action ILIKE $${paramCount}`;
      params.push(`%${action}%`);
    }

    // Filter by resource type
    if (resourceType) {
      paramCount++;
      query += ` AND al.resource_type = $${paramCount}`;
      params.push(resourceType);
    }

    // Filter by date range
    if (startDate) {
      paramCount++;
      query += ` AND al.timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND al.timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (userId) {
      countParamCount++;
      countQuery += ` AND al.user_id = $${countParamCount}`;
      countParams.push(userId);
    }

    if (action) {
      countParamCount++;
      countQuery += ` AND al.action ILIKE $${countParamCount}`;
      countParams.push(`%${action}%`);
    }

    if (resourceType) {
      countParamCount++;
      countQuery += ` AND al.resource_type = $${countParamCount}`;
      countParams.push(resourceType);
    }

    if (startDate) {
      countParamCount++;
      countQuery += ` AND al.timestamp >= $${countParamCount}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countParamCount++;
      countQuery += ` AND al.timestamp <= $${countParamCount}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    const auditLogs = result.rows.map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : "Unknown User",
      userEmail: log.email,
      userRole: log.role,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      timestamp: log.timestamp
    }));

    res.json({
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Get audit log by ID
router.get("/:id", [
  param("id").isUUID()
], requireRole(["admin"]), auditLog("VIEW_AUDIT_LOG", "AUDIT"), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await pool.query(`
      SELECT al.*, u.first_name, u.last_name, u.email, u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Audit log not found" });
    }

    const log = result.rows[0];

    res.json({
      id: log.id,
      userId: log.user_id,
      userName: log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : "Unknown User",
      userEmail: log.email,
      userRole: log.role,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      timestamp: log.timestamp
    });
  } catch (error) {
    console.error("Get audit log error:", error);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// Get audit statistics
router.get("/stats/summary", requireRole(["admin"]), auditLog("VIEW_AUDIT_STATS", "AUDIT"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      dateFilter += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      dateFilter += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    // Get total actions count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM audit_logs WHERE 1=1 ${dateFilter}
    `, params);

    // Get actions by type
    const actionStatsResult = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs 
      WHERE 1=1 ${dateFilter}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // Get actions by user role
    const roleStatsResult = await pool.query(`
      SELECT u.role, COUNT(al.id) as count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.role
      ORDER BY count DESC
    `, params);

    // Get actions by resource type
    const resourceStatsResult = await pool.query(`
      SELECT resource_type, COUNT(*) as count
      FROM audit_logs 
      WHERE 1=1 ${dateFilter}
      GROUP BY resource_type
      ORDER BY count DESC
    `, params);

    // Get daily activity (last 7 days)
    const dailyActivityResult = await pool.query(`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM audit_logs 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days' ${dateFilter}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `, params);

    res.json({
      summary: {
        totalActions: parseInt(totalResult.rows[0].total),
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      },
      actionStats: actionStatsResult.rows.map(row => ({
        action: row.action,
        count: parseInt(row.count)
      })),
      roleStats: roleStatsResult.rows.map(row => ({
        role: row.role || "Unknown",
        count: parseInt(row.count)
      })),
      resourceStats: resourceStatsResult.rows.map(row => ({
        resourceType: row.resource_type,
        count: parseInt(row.count)
      })),
      dailyActivity: dailyActivityResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    console.error("Get audit stats error:", error);
    res.status(500).json({ error: "Failed to fetch audit statistics" });
  }
});

// Get user activity summary
router.get("/users/:userId/activity", [
  param("userId").isUUID()
], requireRole(["admin"]), auditLog("VIEW_USER_ACTIVITY", "AUDIT"), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    let dateFilter = "";
    const params = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      dateFilter += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      dateFilter += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    // Get user info
    const userResult = await pool.query(`
      SELECT first_name, last_name, email, role, hospital_id
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Get recent activities
    const activitiesResult = await pool.query(`
      SELECT action, resource_type, resource_id, details, ip_address, timestamp
      FROM audit_logs 
      WHERE user_id = $1 ${dateFilter}
      ORDER BY timestamp DESC
      LIMIT $${paramCount + 1}
    `, [...params, limit]);

    // Get activity summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT resource_type) as resource_types_accessed,
        COUNT(DISTINCT DATE(timestamp)) as active_days
      FROM audit_logs 
      WHERE user_id = $1 ${dateFilter}
    `, params);

    const summary = summaryResult.rows[0];

    res.json({
      user: {
        id: userId,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        hospitalId: user.hospital_id
      },
      summary: {
        totalActions: parseInt(summary.total_actions),
        resourceTypesAccessed: parseInt(summary.resource_types_accessed),
        activeDays: parseInt(summary.active_days)
      },
      recentActivities: activitiesResult.rows.map(activity => ({
        action: activity.action,
        resourceType: activity.resource_type,
        resourceId: activity.resource_id,
        details: activity.details,
        ipAddress: activity.ip_address,
        timestamp: activity.timestamp
      }))
    });
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

export default router;


