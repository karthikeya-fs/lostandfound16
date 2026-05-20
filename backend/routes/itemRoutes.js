const express = require("express");
const router = express.Router();

const { upload } = require("../middleware/upload");
const {
  createItem,
  reportLostItem,
  getAllItems,
  getLostItems,
  getSingleItem,
} = require("../controllers/itemController");

router.post("/create", upload.single("image"), createItem);
router.post("/report-lost", upload.single("image"), reportLostItem);
router.get("/all", getAllItems);
router.get("/lost", getLostItems);
router.get("/:id", getSingleItem);

module.exports = router;
