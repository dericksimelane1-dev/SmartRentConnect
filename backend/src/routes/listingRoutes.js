const express = require("express");
const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Listing routes are working" });
});

module.exports = router;
