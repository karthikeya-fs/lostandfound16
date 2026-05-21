const Claim = require("../models/Claim");
const User = require("../models/User");
const Item = require("../models/Item");

const createClaim = async (req, res) => {
  try {
    const { itemId, message } = req.body;
    if (!itemId || !message) {
      return res.status(400).json({ message: "itemId and message are required" });
    }

    const user = await User.findById(req.user).select("name email");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const claim = await Claim.create({
      itemId,
      claimantName: user.name,
      claimantEmail: user.email,
      message: String(message).trim().slice(0, 2000),
      claimantUserId: user._id,
    });

    res.status(201).json({
      message: "Claim submitted successfully",
      claim,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getItemClaims = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const claims = await Claim.find({ itemId }).populate("itemId");
    
    // Check if user is the item owner
    const isOwner = String(item.postedBy) === String(req.user);
    if (isOwner) {
      return res.json(claims);
    } else {
      // Just show claims created by this user
      const myClaims = claims.filter(c => String(c.claimantUserId) === String(req.user));
      return res.json(myClaims);
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("itemId");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const item = claim.itemId;
    const isOwner = String(item.postedBy) === String(req.user);
    const isAdmin = req.userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the item owner or an admin can update claim status" });
    }

    claim.status = req.body.status;
    await claim.save();

    if (req.body.status === "approved") {
      await Item.findByIdAndUpdate(item._id, { status: "claimed" });
    } else if (req.body.status === "rejected") {
      const pending = await Claim.countDocuments({
        itemId: item._id,
        status: "pending",
        _id: { $ne: claim._id },
      });
      if (pending === 0 && item.status === "claimed") {
        await Item.findByIdAndUpdate(item._id, { status: "open" });
      }
    }

    res.json(claim);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createClaim,
  getItemClaims,
  updateClaimStatus,
};
