const express = require("express");
const router = express.Router();
const pool = require("../configs/db");

const adminAuth = require("../middleware/adminAuth");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getPendingListings,
  approveListing
} = require("../controllers/listingController");

/* =========================
   TENANT VERIFICATIONS
========================= */
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

    const cleanPath = (p) => p.replace(/^backend[\\/]/, "");

    res.json(
      result.rows.map((u) => ({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        documents: [
          `http://localhost:5000/${cleanPath(u.user_id_document_url)}`,
          `http://localhost:5000/${cleanPath(u.proof_of_income_url)}`
        ]
      }))
    );
  } catch (err) {
    console.error("Admin verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   APPROVE TENANT
========================= */
router.post("/verify/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });

  const tenantId = Number(req.params.id);

  await pool.query(
    `
    UPDATE tenant_verification
    SET status = 'verified', updated_at = NOW()
    WHERE tenant_id = $1
    `,
    [tenantId]
  );

  await pool.query(
    `UPDATE users SET verification_status = 'verified' WHERE user_id = $1`,
    [tenantId]
  );

  res.json({ message: "Tenant verified successfully" });
});

/* =========================
   ✅ GET ALL PENDING PROPERTIES (FIXED)
========================= */
router.get("/property-verifications", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.property_id,
        p.landlord_id,
        p.title,
        p.description,
        p.address,
        p.city,
        p.latitude,
        p.longitude,
        p.property_type,
        p.price,
        p.features,
        p.nearby_places,
        p.images,
        p.status,
        p.created_at,
        u.full_name AS landlord_name,
        u.email AS landlord_email
      FROM properties p
      JOIN users u ON u.user_id = p.landlord_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Admin property verification error:", err);
    res.status(500).json({ message: "Failed to load properties" });
  }
});

/* =========================
   APPROVE / REJECT PROPERTY
========================= */
router.post("/approve-property/:id", adminAuth, async (req, res) => {
  await pool.query(
    "UPDATE properties SET status = 'verified' WHERE property_id = $1",
    [req.params.id]
  );
  res.json({ message: "Property approved" });
});

router.post("/reject-property/:id", adminAuth, async (req, res) => {
  await pool.query(
    "UPDATE properties SET status = 'rejected' WHERE property_id = $1",
    [req.params.id]
  );
  res.json({ message: "Property rejected" });
});

/* =========================
   CONTROLLER‑BASED ROUTES (KEPT)
========================= */
router.get("/pending-listings", authMiddleware, getPendingListings);
router.put("/approve-listing/:propertyId", authMiddleware, approveListing);

module.exports = router;