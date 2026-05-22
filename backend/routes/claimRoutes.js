const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  initiateClaim,
  verifyClaimOtp,
  approveClaim,
  rejectClaim,
  getMyClaims,
  getItemClaims,
  sendMessage,
  getMessages,
  finalOtp,
  finalConfirm,
} = require("../controllers/claimController");

// CREATE CLAIM
router.post("/initiate", protect, initiateClaim);

// VERIFY CLAIMANT OTP
router.post("/verify-otp", protect, verifyClaimOtp);

// GET MY CLAIMS
router.get("/my", protect, getMyClaims);

// GET CLAIMS FOR AN ITEM (owner/admin)
router.get("/item/:itemId", protect, getItemClaims);

// APPROVE / REJECT
router.patch("/:id/approve", protect, approveClaim);
router.patch("/:id/reject", protect, rejectClaim);

// FINAL OTP (finder sends to themselves)
router.post("/:id/final-otp", protect, finalOtp);

// FINAL CONFIRM (finder enters OTP to complete handover)
router.post("/:id/final-confirm", protect, finalConfirm);

// SECURE CHAT (only after approved)
router.post("/message", protect, sendMessage);
router.get("/messages/:claimId", protect, getMessages);

module.exports = router;
