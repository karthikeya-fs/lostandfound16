const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const { upload } = require("../middleware/upload");
const {
  createItem,
  reportLostItem,
  getAllItems,
  getLostItems,
  getSingleItem,
} = require("../controllers/itemController");

router.post("/create", protect, upload.single("image"), createItem);
router.post("/report-lost", protect, upload.single("image"), reportLostItem);
router.get("/all", getAllItems);
router.get("/lost", getLostItems);
router.get("/:id", getSingleItem);

module.exports = router;
