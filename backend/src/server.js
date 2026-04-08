// backend/src/server.js

const express = require("express");
const cors = require("cors");

const app = express();

// ✅ ENABLE CORS (THIS FIXES YOUR ERROR)
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

// ✅ REQUIRED FOR req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ROUTES
app.use("/api/auth", require("./routes/auth"));

// ✅ SERVER
app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});