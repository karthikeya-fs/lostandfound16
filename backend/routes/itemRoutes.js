const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");

const {
  createItem,
  reportLostItem,
  getItems,
  getAllItems,
  getLostItems,
  getItemById,
  getSingleItem,
  getMyItems,
  updateItem,
  markResolved,
  deleteItem,
  generateQuestionsForItem,
} = require("../controllers/itemController");

// CREATE ITEM
router.post(
  "/create",
  protect,
  upload.single("image"),
  createItem
);

// REPORT LOST ITEM
router.post(
  "/report-lost",
  protect,
  upload.single("image"),
  reportLostItem
);

// AI QUESTIONS
router.post(
  "/generate-questions",
  protect,
  generateQuestionsForItem
);

// GET ROUTES
router.get("/all", getAllItems);
router.get("/lost", getLostItems);
router.get("/my", protect, getMyItems);
router.get("/:id", getSingleItem);

// UPDATE ITEM
router.put(
  "/:id",
  protect,
  upload.single("image"),
  updateItem
);

// RESOLVE ITEM
router.patch(
  "/:id/resolve",
  protect,
  markResolved
);

// DELETE ITEM
router.delete(
  "/:id",
  protect,
  deleteItem
);

module.exports = router;