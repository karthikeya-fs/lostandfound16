const Item = require("../models/Item");
const Claim = require("../models/Claim");

function imagePathsFromFile(file) {
  if (!file) return [];
  return [`/uploads/${file.filename}`];
}

const createItem = async (req, res) => {
  try {
    const { title, description, type, category, location, date, blurImage } = req.body;

    const item = await Item.create({
      title,
      description,
      type: type === "lost" || type === "found" ? type : "found",
      category,
      location,
      date: new Date(date),
      images: imagePathsFromFile(req.file),
      postedBy: req.user,
      blurImage: blurImage === "true" || blurImage === true,
    });

    res.status(201).json({
      message: "Item posted successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const reportLostItem = async (req, res) => {
  try {
    const { title, description, category, location, date, reward, contact, blurImage } =
      req.body;

    const item = await Item.create({
      title,
      description,
      type: "lost",
      category,
      location,
      date: new Date(date),
      reward: reward || "",
      contact: contact || "",
      images: imagePathsFromFile(req.file),
      postedBy: req.user,
      blurImage: blurImage === "true" || blurImage === true,
    });

    res.status(201).json({
      message: "Lost item reported successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const activeItemFilter = { isRemoved: { $ne: true } };

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find(activeItemFilter).sort({ createdAt: -1 });
    const claims = await Claim.find({ status: "pending" });
    const pendingItemIds = new Set(claims.map((c) => String(c.itemId)));

    const itemsWithClaims = items.map((item) => {
      const itemObj = item.toObject();
      itemObj.hasPendingClaim = pendingItemIds.has(String(item._id));
      return itemObj;
    });

    res.json(itemsWithClaims);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getLostItems = async (req, res) => {
  try {
    const items = await Item.find({ ...activeItemFilter, type: "lost" }).sort({
      createdAt: -1,
    });
    const claims = await Claim.find({ status: "pending" });
    const pendingItemIds = new Set(claims.map((c) => String(c.itemId)));

    const itemsWithClaims = items.map((item) => {
      const itemObj = item.toObject();
      itemObj.hasPendingClaim = pendingItemIds.has(String(item._id));
      return itemObj;
    });

    res.json(itemsWithClaims);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSingleItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "postedBy",
      "name department"
    );
    if (!item || item.isRemoved) {
      return res.status(404).json({ message: "Item not found" });
    }

    const pendingClaimCount = await Claim.countDocuments({
      itemId: item._id,
      status: "pending",
    });

    const itemObj = item.toObject();
    itemObj.hasPendingClaim = pendingClaimCount > 0;

    res.json(itemObj);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createItem,
  reportLostItem,
  getAllItems,
  getLostItems,
  getSingleItem,
};
