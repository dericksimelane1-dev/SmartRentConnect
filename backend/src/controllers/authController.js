const pool = require("../controllers/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Check if email exists
    const emailCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0)
      return res.status(400).json({ msg: "Email already registered" });

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, email, phone, role, verification_status`,
      [full_name, email, phone, password_hash, role]
    );

    res.json({
      msg: "Registration successful",
      user: newUser.rows[0],
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ msg: "User not found" });

    const user = result.rows[0];

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res.status(400).json({ msg: "Incorrect password" });

    // Sign token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        full_name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verification_status: user.verification_status
      }
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};