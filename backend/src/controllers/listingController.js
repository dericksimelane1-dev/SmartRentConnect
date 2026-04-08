// src/controllers/listingController.js
const pool = require("../controllers/db");

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