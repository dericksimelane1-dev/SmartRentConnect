const db = require("../configs/db");
const calculateTrustScore = require("../utils/trustScore");

/**
 * =========================
 * TRUST SCORE (UTILITY)
 * =========================
 * Runs when you explicitly call it
 */
async function updateLandlordTrustScore(landlordId) {
  const stats = await db.query(`
    SELECT 
      AVG(rating) AS avg,
      COUNT(*) AS total
    FROM reviews
    WHERE landlord_id = $1
  `, [landlordId]);

  const trustScore = calculateTrustScore(
    stats.rows[0]?.avg || 0,
    stats.rows[0]?.total || 0
  );

  await db.query(
    "UPDATE users SET trust_score = $1 WHERE user_id = $2",
    [trustScore, landlordId]   // ✅ MUST be two values
  );
}

/**
 * =========================
 * BASIC LISTINGS
 * =========================
 */

exports.getListings = async (req, res) => {
  const listings = await db.query(
    "SELECT * FROM listings ORDER BY created_at DESC"
  );
  res.json(listings.rows);
};

exports.getListing = async (req, res) => {
  const listing = await db.query(
    "SELECT * FROM listings WHERE id = $1",
    [req.params.user_id]
  );
  res.json(listing.rows[0]);
};

exports.createListing = async (req, res) => {
  const { title, price, description, amenities, location } = req.body;

  const newListing = await db.query(
    `INSERT INTO listings 
     (title, price, description, amenities, location) 
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [title, price, description, amenities, location]
  );

  res.json(newListing.rows[0]);
};

exports.createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      property_type,
      price,
      address,
      city,
      latitude,
      longitude,
      features,
      nearby_places
    } = req.body;

    // ✅ collect uploaded image paths
    const images = (req.files || []).map(file =>
      file.path.replace(/^backend[\\/]/, "")
    );

    const result = await db.query(
      `
      INSERT INTO properties (
        landlord_id,
        title,
        description,
        address,
        city,
        latitude,
        longitude,
        price,
        property_type,
        features,
        nearby_places,
        images,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending'
      )
      RETURNING *
      `,
      [
        req.user.user_id,
        title,
        description,
        address,
        city,
        latitude,
        longitude,
        price,
        property_type,
        JSON.parse(features),
        nearby_places,
        JSON.stringify(images)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create property error:", err);
    res.status(500).json({ message: "Failed to create property" });
  }
};


/**
 * =========================
 * VERIFIED LISTINGS (TENANTS)
 * =========================
 */
exports.getVerifiedListings = async (req, res) => {
  try {
    const { minPrice, maxPrice, type } = req.query;

    let sql = `
      SELECT 
        l.property_id,
        l.title,
        l.description,
        l.address,
        l.city,
        l.latitude,
        l.longitude,
        l.price,
        l.property_type,
        l.features,
        l.nearby_places,
        l.images
      FROM properties l
      JOIN users u ON l.landlord_id = u.user_id
      WHERE l.status = 'verified'
    `;

    const params = [];

    if (type) {
      params.push(type);
      sql += ` AND l.property_type = $${params.length}`;
    }

    if (minPrice) {
      params.push(minPrice);
      sql += ` AND l.price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(maxPrice);
      sql += ` AND l.price <= $${params.length}`;
    }

    const result = await db.query(sql, params);

    res.json(result.rows);

  } catch (err) {
    console.error("getVerifiedListings ERROR:", err);
    res.status(500).json({ message: "Could not load listings" });
  }
};


/**
 * =========================
 * ADMIN PROPERTY VERIFICATION
 * =========================
 */

exports.getPendingListings = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        p.*,
        u.full_name AS landlord_name,
        u.email AS landlord_email
      FROM properties p
      JOIN users u ON u.user_id = p.landlord_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending listings" });
  }
};

exports.approveListing = async (req, res) => {
  const { propertyId } = req.params;

  try {
    const property = await db.query(
      "SELECT landlord_id FROM properties WHERE property_id = $1",
      [propertyId]
    );

    await db.query(
      "UPDATE properties SET status = 'verified' WHERE property_id = $1",
      [propertyId]
    );

    // ✅ update trust score when approved
    if (property.rows[0]) {
      await updateLandlordTrustScore(property.rows[0].landlord_id);
    }

    res.json({ message: "Property approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approval failed" });
  }
};

/**
 * =========================
 * TENANT APPLICATION
 * =========================
 */

exports.applyForProperty = async (req, res) => {
  const tenantId = req.user.user_id;
  const propertyId = req.params.propertyId;

  await db.query(`
    INSERT INTO applications (tenant_id, property_id, status)
    VALUES ($1, $2, 'pending')
  `, [tenantId, propertyId]);

  res.json({ message: "Application submitted" });
};

/**
 * =========================
 * LANDLORD PROFILE
 * =========================
 */

exports.getLandlordProfile = async (req, res) => {
  const landlordId = req.params.id;

  const landlord = await db.query(`
    SELECT user_id, name, trust_score
    FROM users
    WHERE user_id = $1
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