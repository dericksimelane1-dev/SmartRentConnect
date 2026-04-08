const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../controllers/db");

const router = express.Router();

/**
 * CREATE ACCOUNT
 */
router.post("/register", async (req, res) => {
  try {
    const {
      role,
      full_name,
      email,
      phone,
      password,
      id_number
    } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      `INSERT INTO users
        (role, full_name, email, phone, password_hash, id_number, verification_status, created_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
       RETURNING user_id, email, role`,
      [
        role,
        full_name,
        email,
        phone,
        password_hash,
        id_number
      ]
    );

    res.status(201).json({
      message: "Account created successfully",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;