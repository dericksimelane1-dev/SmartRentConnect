const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../controllers/db");
const jwt = require("jsonwebtoken");
const transporter = require("../configs/email");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      "SELECT user_id, email, role, password_hash, verification_status FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/verify
 * Upload ID document
 */
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    // ✅ Lazy-load multer (Node 22 safe)
    const { default: multer } = await import("multer");
    const upload = multer({ dest: "src/uploads/" });

    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "File upload failed" });
      }

      await db.query(
        "UPDATE users SET verification_status = 'submitted' WHERE user_id = $1",
        [req.user.user_id]
      );

      res.json({ message: "Verification submitted" });
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/register", async (req, res) => {
  try {
    const { role, full_name, email, phone, password, id_number } = req.body;

    // 1️⃣ Check if user already exists
    const existingUser = await db.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2️⃣ Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 3️⃣ Insert user (verification_status starts as 'pending')
    await db.query(
      `INSERT INTO users
       (role, full_name, email, phone, password_hash, id_number, verification_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
      [role, full_name, email, phone, password_hash, id_number]
    );

    // ✅ 4️⃣ CREATE EMAIL VERIFICATION TOKEN (HERE ✅)
    const emailToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const verifyLink = `http://localhost:3000/verify-email/${emailToken}`;

    // ✅ 5️⃣ SEND VERIFICATION EMAIL (HERE ✅)
    await transporter.sendMail({
      from: "SmartRent <no-reply@smartrent.com>",
      to: email,
      subject: "Verify your SmartRent account",
      html: `
        <h3>Verify your account</h3>
        <p>Click the link below:</p>
        <a href="${verifyLink}">Verify Email</a>
      `,
    });

    // ✅ 6️⃣ Final response
    res.status(201).json({
      message: "Account created. Please check your email to verify your account.",
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * GET /api/auth/verify-email/:token
 */
router.get("/verify-email/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    await db.query(
      "UPDATE users SET verification_status = 'verified' WHERE email = $1",
      [decoded.email]
    );

    res.redirect("http://localhost:3000/?verified=true");
  } catch (error) {
    res.status(400).send("Invalid or expired verification link");
  }
});
// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    user_id: req.user.user_id,
    role: req.user.role,
    verification_status: req.user.verification_status,
  });
});


module.exports = router;