// backend/src/server.js

const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const path = require("path");
const listingRoutes = require("./routes/listingRoutes");

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
app.use('/api/tenant/verification', require('./routes/tenantVerificationRoutes'));
app.use("/api/admin", adminRoutes);
app.use("/api/listings", listingRoutes);
app.use("/uploads", express.static("backend/uploads"));



// Serve uploaded documents

app.use(
  "/backend/uploads",
  express.static(path.join(__dirname, "backend", "uploads"))
);



// ✅ SERVER
app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});