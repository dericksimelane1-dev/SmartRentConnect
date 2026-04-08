// src/controllers/dashboardController.js
const pool = require("../controllers/db");

exports.getTenantDashboard = async (req, res) => {
  const userId = req.user.id;

  const saved = await pool.query("SELECT * FROM saved_listings WHERE user_id=$1", [userId]);
  const requests = await pool.query("SELECT * FROM rental_requests WHERE user_id=$1", [userId]);

  res.json({
    saved: saved.rows,
    requests: requests.rows
  });
};

exports.getLandlordDashboard = async (req, res) => {
  const userId = req.user.id;

  const listings = await pool.query("SELECT * FROM listings WHERE owner_id=$1", [userId]);

  res.json({ listings: listings.rows });
};
