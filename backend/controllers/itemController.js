const Item = require("../models/Item");

function imagePathsFromFile(file) {
  if (!file) return [];
  return [`/uploads/${file.filename}`];
}

const createItem = async (req, res) => {
  try {
    const { title, description, type, category, location, date } = req.body;

    const item = await Item.create({
      title,
      description,
      type: type === "lost" || type === "found" ? type : "found",
      category,
      location,
      date: new Date(date),
      images: imagePathsFromFile(req.file),
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
    const { title, description, category, location, date, reward, contact } =
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

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getLostItems = async (req, res) => {
  try {
    const items = await Item.find({ type: "lost" }).sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSingleItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    res.json(item);
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
