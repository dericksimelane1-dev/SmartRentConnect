const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  submitTenantVerification,
} = require("../controllers/tenantVerificationController");

// ✅ DEBUG CONFIRMATION
console.log("✅ tenantVerificationRoutes loaded");

// ✅ TENANT VERIFICATION SUBMISSION ROUTE
router.post(
  "/submit",
  authMiddleware,
  upload.fields([
    { name: "id_document", maxCount: 1 },
    { name: "proof_of_income", maxCount: 1 },
  ]),
  submitTenantVerification
);

module.exports = router;