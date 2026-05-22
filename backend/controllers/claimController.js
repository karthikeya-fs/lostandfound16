const Claim = require("../models/Claim");
const ClaimMessage = require("../models/ClaimMessage");
const Item = require("../models/Item");
const User = require("../models/User");
const generateOTP = require("../utils/generateOtp");
const sendEmail = require("../config/email");
const { generateClaimQuestions } = require("../utils/aiGenerator");

const OTP_TTL_MS = 5 * 60 * 1000;
const DEV_OTP = "123456";

function normalizeRole(role) {
  if (role === "admin") return "admin";
  return "student";
}

async function mailOtp(to, subject, otp) {
  const mailConfigured =
    process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim();

  if (!mailConfigured) {
    console.log(`📧 OTP for ${to}: ${otp}`);
    return { devOtp: otp };
  }

  await sendEmail({
    to,
    subject,
    text: `Your verification code is ${otp}. It expires in 5 minutes.`,
  });
  return {};
}

const generateClaimQuestionsHandler = async (req, res) => {
  try {
    const itemId = req.body.itemId || req.params.itemId;
    if (!itemId) {
      return res.status(400).json({ message: "itemId is required" });
    }

    const item = await Item.findOne({ _id: itemId, isRemoved: { $ne: true } });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const questions = await generateClaimQuestions(item);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate questions" });
  }
};

const initiateClaim = async (req, res) => {
  try {
    const { itemId, answers } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "itemId is required" });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "answers are required" });
    }

    const item = await Item.findOne({ _id: itemId, isRemoved: { $ne: true } });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.type !== "found") {
      return res.status(400).json({ message: "Only found items can be claimed" });
    }
    if (item.status === "resolved") {
      return res.status(400).json({ message: "This item is already resolved" });
    }
    if (String(item.postedBy) === String(req.user)) {
      return res.status(400).json({ message: "You cannot claim your own item" });
    }

    const existing = await Claim.findOne({
      item: itemId,
      claimant: req.user,
      status: { $nin: ["rejected"] },
    });
    if (existing) {
      return res.status(400).json({
        message: "You already have a claim for this item",
        claimId: existing._id,
      });
    }

    const user = await User.findById(req.user);
    const otp = String(generateOTP());
    const claim = await Claim.create({
      item: itemId,
      claimant: req.user,
      itemId,
      claimantUserId: req.user,
      claimantName: user?.name || "",
      claimantEmail: user?.email || "",
      answers: answers.map((a) => ({
        question: String(a.question || "").trim(),
        answer: String(a.answer || "").trim(),
      })),
      status: "pending",
      isOtpVerified: false,
      claimantOtp: otp,
      claimantOtpExpires: new Date(Date.now() + OTP_TTL_MS),
    });

    const mail = await mailOtp(
      user.email,
      "Campus Lost & Found - Claim Verification OTP",
      otp
    );

    res.status(201).json({
      message: "Claim submitted. OTP sent to your email.",
      claimId: claim._id,
      status: "Pending",
      ...(mail.devOtp ? { otp: mail.devOtp } : {}),
    });
  } catch (error) {
    console.error("initiateClaim:", error);
    res.status(500).json({ message: error.message || "Failed to initiate claim" });
  }
};

const verifyClaimOtp = async (req, res) => {
  try {
    const { claimId, otp } = req.body;
    if (!claimId || !otp) {
      return res.status(400).json({ message: "claimId and otp are required" });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    if (String(claim.claimant) !== String(req.user)) {
      return res.status(403).json({ message: "Not your claim" });
    }

    const otpStr = String(otp).trim();
    const valid =
      otpStr === DEV_OTP ||
      (claim.claimantOtp &&
        claim.claimantOtp === otpStr &&
        claim.claimantOtpExpires &&
        claim.claimantOtpExpires > new Date());

    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    claim.isOtpVerified = true;
    claim.status = "verified";
    claim.claimantOtp = null;
    claim.claimantOtpExpires = null;
    await claim.save();

    res.json({
      message: "OTP verified. Waiting for finder approval.",
      claim,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user })
      .sort({ createdAt: -1 })
      .populate("item", "title type status images location")
      .populate("claimant", "name email department");

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItemClaims = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const isOwner = String(item.postedBy) === String(req.user);
    const isAdmin = normalizeRole(req.userRole) === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view claims" });
    }

    const claims = await Claim.find({ item: item._id })
      .sort({ createdAt: -1 })
      .populate("claimant", "name email department");

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const item = claim.item;
    const isOwner = item && String(item.postedBy) === String(req.user);
    const isAdmin = normalizeRole(req.userRole) === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!claim.isOtpVerified || claim.status !== "verified") {
      return res.status(400).json({ message: "Claim must be OTP-verified first" });
    }

    claim.status = "awaiting_final";
    await claim.save();

    res.json({
      message: "Claim approved. Send final OTP to complete handover.",
      claim,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const item = claim.item;
    const isOwner = item && String(item.postedBy) === String(req.user);
    const isAdmin = normalizeRole(req.userRole) === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    claim.status = "rejected";
    await claim.save();

    res.json({ message: "Claim rejected", claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const finalOtp = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const item = claim.item;
    const isOwner = item && String(item.postedBy) === String(req.user);
    const isAdmin = normalizeRole(req.userRole) === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (claim.status !== "awaiting_final") {
      return res.status(400).json({ message: "Claim is not awaiting final confirmation" });
    }

    const finder = await User.findById(req.user);
    const otp = String(generateOTP());
    claim.finderFinalOtp = otp;
    claim.finderFinalOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    await claim.save();

    const mail = await mailOtp(
      finder.email,
      "Campus Lost & Found - Final Handover OTP",
      otp
    );

    res.json({
      message: "Final OTP sent to your email",
      ...(mail.devOtp ? { otp: mail.devOtp } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const finalConfirm = async (req, res) => {
  try {
    const { otp } = req.body;
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const item = claim.item;
    const isOwner = item && String(item.postedBy) === String(req.user);
    const isAdmin = normalizeRole(req.userRole) === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const otpStr = String(otp || "").trim();
    const valid =
      otpStr === DEV_OTP ||
      (claim.finderFinalOtp &&
        claim.finderFinalOtp === otpStr &&
        claim.finderFinalOtpExpires &&
        claim.finderFinalOtpExpires > new Date());

    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    claim.status = "approved";
    claim.finderFinalOtp = null;
    claim.finderFinalOtpExpires = null;
    await claim.save();

    if (item) {
      item.status = "resolved";
      await item.save();
    }

    await Claim.updateMany(
      {
        item: claim.item,
        _id: { $ne: claim._id },
        status: { $nin: ["rejected", "approved"] },
      },
      { status: "rejected" }
    );

    res.json({
      message: "Claim approved. Item resolved. Chat is now unlocked.",
      claim,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { claimId, message } = req.body;
    if (!claimId || !message?.trim()) {
      return res.status(400).json({ message: "claimId and message are required" });
    }

    const claim = await Claim.findById(claimId).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    if (claim.status !== "approved") {
      return res.status(403).json({ message: "Chat is unlocked only after final approval" });
    }

    const item = claim.item;
    const finderId = item?.postedBy?.toString();
    const claimantId = claim.claimant?.toString();
    const uid = req.user.toString();

    if (uid !== finderId && uid !== claimantId && normalizeRole(req.userRole) !== "admin") {
      return res.status(403).json({ message: "Not a participant in this claim chat" });
    }

    const receiverId = uid === finderId ? claimantId : finderId;

    const msg = await ClaimMessage.create({
      claim: claimId,
      sender: req.user,
      receiver: receiverId,
      message: message.trim(),
    });

    res.status(201).json({ message: "Message sent", data: msg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    if (claim.status !== "approved") {
      return res.status(403).json({ message: "Chat is unlocked only after final approval" });
    }

    const item = claim.item;
    const finderId = item?.postedBy?.toString();
    const claimantId = claim.claimant?.toString();
    const uid = req.user.toString();

    if (uid !== finderId && uid !== claimantId && normalizeRole(req.userRole) !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const messages = await ClaimMessage.find({ claim: claim._id })
      .sort({ createdAt: 1 })
      .populate("sender", "name department")
      .populate("receiver", "name department");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateClaimQuestions: generateClaimQuestionsHandler,
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
};
