const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { generateClaimQuestions } = require("../controllers/claimController");

// POST /api/ai-claim/questions  { itemId }
router.post("/questions", protect, generateClaimQuestions);

module.exports = router;
