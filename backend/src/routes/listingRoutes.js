const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireVerified = require("../middleware/requireVerified");
const listingController = require("../controllers/listingController");
const upload = require("../middleware/upload");

// VERIFIED TENANT SEARCH
router.get(
  "/verified-search",
//  auth,
//  requireVerified,
  listingController.getVerifiedListings
);

router.post(
  "/apply/:propertyId",
  auth,
  requireVerified,
  listingController.applyForProperty
);

router.post(
  "/properties",
  auth,
  upload.array("images", 10), // matches frontend FormData
  listingController.createProperty
);

router.get("/landlord/:id", auth, listingController.getLandlordProfile);

router.get('/listings', listingController.getVerifiedListings);


module.exports = router;