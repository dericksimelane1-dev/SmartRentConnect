// src/controllers/listingController.js
const pool = require("../controllers/db");
const db = require("../configs/db");
const calculateTrustScore = require("../utils/trustScore");


const stats = await db.query(`
  SELECT AVG(rating) as avg, COUNT(*) as total
  FROM reviews
  WHERE landlord_id = $1
`, [landlordId]);

const trustScore = calculateTrustScore(
  stats.rows[0].avg,
  stats.rows[0].total
);

await db.query(
  "UPDATE users SET trust_score=$1 WHERE id=$2",
  [trustScore, landlordId]
);


exports.getListings = async (req, res) => {
  const listings = await pool.query("SELECT * FROM listings ORDER BY created_at DESC");
  res.json(listings.rows);
};

exports.getListing = async (req, res) => {
  const listing = await pool.query("SELECT * FROM listings WHERE id=$1", [req.params.id]);
  res.json(listing.rows[0]);
};

exports.createListing = async (req, res) => {
  const { title, price, description, amenities, location } = req.body;

  const newListing = await pool.query(
    "INSERT INTO listings (title, price, description, amenities, location) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [title, price, description, amenities, location]
  );

  res.json(newListing.rows[0]);
};

exports.getVerifiedListings = async (req, res) => {
  try {
    const { minPrice, maxPrice, type } = req.query;

    let sql = `
      SELECT 
        l.id,
        l.title,
        l.price,
        l.property_type,
        l.location,
        l.image_url,
        u.trust_score
      FROM listings l
      JOIN users u ON l.landlord_id = u.id
      WHERE l.is_verified = true
    `;

    if (type) sql += ` AND l.property_type = $1`;
    if (minPrice) sql += ` AND l.price >= ${minPrice}`;
    if (maxPrice) sql += ` AND l.price <= ${maxPrice}`;

    const result = await db.query(sql);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load listings" });
  }
 
  try {
    const result = await db.query(`
      SELECT
        property_id,
        title,
        address,
        latitude,
        longitude,
        landlord_id,
        status
      FROM properties
      WHERE status = 'verified'
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load properties" });
  }
};
exports.applyForProperty = async (req, res) => {
  const tenantId = req.user.id;
  const propertyId = req.params.propertyId;

  await db.query(`
    INSERT INTO applications (tenant_id, property_id, status)
    VALUES ($1, $2, 'pending')
  `, [tenantId, propertyId]);

  res.json({ message: "Application submitted" });
};
exports.getLandlordProfile = async (req, res) => {
  const landlordId = req.params.id;

  const landlord = await db.query(`
    SELECT id, name, trust_score
    FROM users
    WHERE id = $1
  `, [landlordId]);

  const properties = await db.query(`
    SELECT property_id, title, address
    FROM properties
    WHERE landlord_id = $1
  `, [landlordId]);

  const reviews = await db.query(`
    SELECT rating, comment
    FROM reviews
    WHERE landlord_id = $1
  `, [landlordId]);

  res.json({
    landlord: landlord.rows[0],
    properties: properties.rows,
    reviews: reviews.rows
  });
};

