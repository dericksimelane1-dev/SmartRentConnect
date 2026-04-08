const auth = require("../middleware/authMiddleware");
const requireVerified = require("../middleware/requireVerified");

router.post("/apply", auth, requireVerified, async (req, res) => {
  // ✅ only verified tenants reach here
});