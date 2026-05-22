const Item = require("../models/Item");


const publicFilter = { isRemoved: { $ne: true } };

function parseVerificationQuestions(body) {
  let raw = body.verificationQuestions || body.securityQuestions;
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return { question: entry.trim(), answer: "" };
      }
      if (entry?.question) {
        return {
          question: String(entry.question).trim(),
          answer: String(entry.answer || "").trim(),
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 2);
}

const createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      location,
      date,
      blurImage,
      color,
      brand,
      reward,
      contact,
    } = req.body;

    if (!title?.trim() || !description?.trim() || !type || !category || !location || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const verificationQuestions = parseVerificationQuestions(req.body).filter(
      (q) => q.question && q.answer
    );

    const images = req.file ? [`/uploads/${req.file.filename}`] : [];

    const item = await Item.create({
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      location,
      color: color || "",
      brand: brand || "",
      date: new Date(date),
      images,
      blurImage: blurImage === true || blurImage === "true",
      reward: reward || "",
      contact: contact || "",
      postedBy: req.user,
      verificationQuestions,
      securityQuestions: verificationQuestions.map((q) => q.question),
    });

    res.status(201).json({ message: "Item posted successfully", item });
  } catch (error) {
    console.error("createItem:", error);
    res.status(500).json({ message: error.message || "Failed to create item" });
  }
};

const reportLostItem = createItem;

const getItems = async (req, res) => {
  try {
    const items = await Item.find(publicFilter)
      .sort({ createdAt: -1 })
      .populate("postedBy", "name department");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllItems = getItems;

const getLostItems = async (req, res) => {
  try {
    const items = await Item.find({ ...publicFilter, type: "lost" })
      .sort({ createdAt: -1 })
      .populate("postedBy", "name department");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, ...publicFilter }).populate(
      "postedBy",
      "name department"
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const safe = item.toObject();
    if (safe.verificationQuestions?.length) {
      safe.verificationQuestions = safe.verificationQuestions.map((q) => ({
        question: q.question,
      }));
    }
    delete safe.securityQuestions;

    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSingleItem = getItemById;

const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ postedBy: req.user, isRemoved: { $ne: true } }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, postedBy: req.user });
    if (!item) {
      return res.status(404).json({ message: "Item not found or not yours" });
    }

    ["title", "description", "category", "location", "color", "brand", "date", "blurImage", "status"].forEach(
      (key) => {
        if (req.body[key] !== undefined) item[key] = req.body[key];
      }
    );

    if (req.file) {
      item.images = [`/uploads/${req.file.filename}`];
    }

    await item.save();
    res.json({ message: "Item updated", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markResolved = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, postedBy: req.user });
    if (!item) {
      return res.status(404).json({ message: "Item not found or not yours" });
    }
    item.status = "resolved";
    await item.save();
    res.json({ message: "Item marked as resolved", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, postedBy: req.user });
    if (!item) {
      return res.status(404).json({ message: "Item not found or not yours" });
    }
    item.isRemoved = true;
    item.removedAt = new Date();
    await item.save();
    res.json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateQuestionsForItem = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const lowerTitle = title.toLowerCase();
    const lowerDescription = description.toLowerCase();

    let questions = [];

    // PHONE
    if (
      lowerTitle.includes("iphone") ||
      lowerTitle.includes("phone") ||
      lowerTitle.includes("mobile")
    ) {
      questions = [
        {
          question: "What is the exact model of the phone?",
          answer: "",
        },
        {
          question: "What is the wallpaper, phone case, or lockscreen color?",
          answer: "",
        },
      ];
    }

    // WALLET
    else if (
      lowerTitle.includes("wallet") ||
      lowerTitle.includes("purse")
    ) {
      questions = [
        {
          question: "What items are inside the wallet?",
          answer: "",
        },
        {
          question: "What is the wallet color or brand?",
          answer: "",
        },
      ];
    }

    // LAPTOP
    else if (
      lowerTitle.includes("laptop") ||
      lowerTitle.includes("macbook")
    ) {
      questions = [
        {
          question: "What is the laptop model or brand?",
          answer: "",
        },
        {
          question: "Does the laptop have stickers or a cover?",
          answer: "",
        },
      ];
    }

    // DEFAULT
    else {
      questions = [
        {
          question: "What is a unique identifying feature of this item?",
          answer: "",
        },
        {
          question: "Where exactly did you lose this item?",
          answer: "",
        },
      ];
    }

    return res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.log("QUESTION GENERATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to auto-generate questions",
      error: error.message,
    });
  }
};

module.exports = {
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
};
