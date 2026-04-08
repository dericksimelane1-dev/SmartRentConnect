// src/server.js
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes (ONLY ones that actually exist)
const authRoutes = require("./routes/auth"); // or authRoutes.js — pick ONE
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("SmartRent API running...");
});

// Start server (ONLY ONCE)
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});