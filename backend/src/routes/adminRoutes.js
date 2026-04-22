const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const pool = require("../configs/db");

/**
 * ✅ GET all pending tenant verifications
 */
router.get("/verifications", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        tv.id_document_url,
        tv.proof_of_income_url
      FROM users u
      JOIN tenant_verification tv
        ON tv.tenant_id = u.user_id
      WHERE tv.status = 'pending'
    `);

    // ✅ ADD THIS HELPER HERE
    const cleanPath = (p) => p.replace(/^backend\//, "");

    // ✅ MAP USERS + FIX PATHS HERE
    const users = result.rows.map(u => ({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      documents: [
        `http://localhost:5000/${cleanPath(u.id_document_url)}`,
        `http://localhost:5000/${cleanPath(u.proof_of_income_url)}`
      ]
    }));

    // ✅ RETURN CLEAN DATA
    res.json(users);

  } catch (err) {
    console.error("Admin verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ APPROVE tenant verification
 */
router.post("/verify/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const tenantId = Number(req.params.id);

    // ✅ Ensure verification record exists
    const verificationResult = await pool.query(
      "SELECT verification_id FROM tenant_verification WHERE tenant_id = $1",
      [tenantId]
    );

    if (verificationResult.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Tenant verification record not found" });
    }

    // ✅ IMPORTANT: use allowed status value
    await pool.query(
      `
      UPDATE tenant_verification
      SET status = 'verified',
          updated_at = NOW()
      WHERE tenant_id = $1
      `,
      [tenantId]
    );

    // ✅ Update user table consistently
    await pool.query(
      `
      UPDATE users
      SET verification_status = 'verified'
      WHERE user_id = $1
      `,
      [tenantId]
    );

    res.json({ message: "Tenant verified successfully" });

  } catch (error) {
    console.error("ADMIN VERIFY ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;