const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  createClaim,
  getItemClaims,
  updateClaimStatus,
} = require("../controllers/claimController");

router.post("/create", protect, createClaim);
router.get("/item/:itemId", protect, getItemClaims);
router.put("/:id", protect, updateClaimStatus);

module.exports = router;