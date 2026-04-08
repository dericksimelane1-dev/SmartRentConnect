const jwt = require("jsonwebtoken");
const db = require("../controllers/db");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      "SELECT user_id, role, verification_status FROM users WHERE user_id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = result.rows[0]; // ✅ now available everywhere
    next();

  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};