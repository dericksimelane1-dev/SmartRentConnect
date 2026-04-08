const auth = require("../middleware/authMiddleware");

router.get("/verifications", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const result = await db.query(
    "SELECT user_id, full_name, email, role, verification_status FROM users WHERE verification_status = 'submitted'"
  );

  res.json(result.rows);
});

router.post("/verify/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  await db.query(
    "UPDATE users SET verification_status = 'verified' WHERE user_id = $1",
    [req.params.id]
  );

  res.json({ message: "User verified" });
});