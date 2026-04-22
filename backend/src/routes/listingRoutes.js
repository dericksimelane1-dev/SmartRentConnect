const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireVerified = require("../middleware/requireVerified");
const listingController = require("../controllers/listingController");

// VERIFIED TENANT SEARCH
router.get(
  "/verified-search",
  auth,
  requireVerified,
  listingController.getVerifiedListings
);

router.post(
  "/apply/:propertyId",
  auth,
  requireVerified,
  listingController.applyForProperty
);
router.get("/landlord/:id", auth, listingController.getLandlordProfile);

module.exports = router;