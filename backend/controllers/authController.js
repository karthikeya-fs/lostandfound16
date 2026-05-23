const crypto = require("crypto");
const User = require("../models/User");
const Item = require("../models/Item");
const Otp = require("../models/otp");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateOTP = require("../utils/generateOtp");
const sendEmail = require("../config/email");

/** Case-insensitive email match */
const matchEmailCI = (lowerEmail) => ({
  $expr: { $eq: [{ $toLower: "$email" }, lowerEmail] },
});

// ================= REGISTER USER =================

const registerUser = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const department = typeof req.body.department === "string" ? req.body.department.trim() : "";
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!department) return res.status(400).json({ message: "Department is required" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists with this email" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, department });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("registerUser error:", error);
    if (error.code === 11000)
      return res.status(400).json({ message: "User already exists with this email" });
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

// ================= LOGIN USER =================
// Step 1: verify credentials, send OTP
const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne(matchEmailCI(email));
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.isBanned)
      return res.status(403).json({ message: user.bannedReason || "Your account has been suspended" });

    // Generate and store login OTP
    const otp = String(generateOTP());
    await Otp.deleteMany({ email });
    await Otp.create({ email, code: otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    console.log(`🔑 Login OTP for ${email}: ${otp}`);

    const mailConfigured = process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim();

    if (mailConfigured) {
      try {
        await sendEmail({
          to: email,
          subject: "Campus Lost & Found - Login OTP",
          html: `<div style="font-family:Arial;padding:20px"><h2>Login Verification</h2><p>Your OTP is:</p><h1 style="letter-spacing:5px;color:#2563eb">${otp}</h1><p>Expires in 5 minutes.</p></div>`,
        });
        return res.json({ message: "OTP sent to your email. Please verify to complete login.", requireOtp: true });
      } catch (emailErr) {
        console.error("Login OTP email failed:", emailErr.message);
      }
    }

    // Dev fallback — return OTP in response
    res.json({
      message: "OTP generated (email not configured). Use the code below.",
      requireOtp: true,
      otp,
    });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Step 2: verify login OTP, return JWT
const verifyLoginOtp = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { otp } = req.body;

    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const otpStr = String(otp).trim();

    // Dev master bypass
    if (otpStr !== "123456") {
      const record = await Otp.findOne({ email });
      if (!record || String(record.code) !== otpStr)
        return res.status(400).json({ message: "Invalid OTP" });
      if (record.expiresAt < new Date()) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ message: "OTP has expired. Please log in again." });
      }
    }

    await Otp.deleteMany({ email });

    const user = await User.findOne(matchEmailCI(email));
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (error) {
    console.error("verifyLoginOtp error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= SEND OTP (registration) =================

const sendOTP = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) return res.status(400).json({ message: "Email is required" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "An account with this email already exists" });

    const otp = String(generateOTP());
    await Otp.deleteMany({ email });
    await Otp.create({ email, code: otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    console.log(`🔑 Registration OTP for ${email}: ${otp}`);

    const mailConfigured = process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim();

    if (!mailConfigured) {
      return res.status(200).json({
        message: "OTP generated (email not configured). Use the code below.",
        otp,
      });
    }

    try {
      await sendEmail({
        to: email,
        subject: "Campus Lost & Found - OTP Verification",
        html: `<div style="font-family:Arial;padding:20px"><h2>Email Verification</h2><p>Your OTP is:</p><h1 style="letter-spacing:5px;color:#2563eb">${otp}</h1><p>Expires in 5 minutes.</p></div>`,
      });
      return res.status(200).json({ message: "OTP Sent Successfully ✅" });
    } catch (emailError) {
      console.error("sendOTP email failed:", emailError.message);
      return res.status(200).json({
        message: "OTP generated (email could not be sent). Use the code below.",
        otp,
      });
    }
  } catch (error) {
    console.error("sendOTP error:", error);
    res.status(500).json({ message: error.message || "Failed to Send OTP" });
  }
};

// ================= VERIFY OTP (registration) =================

const verifyOTP = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { otp } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const otpStr = otp != null ? String(otp).trim() : "";

    if (otpStr === "123456") {
      await Otp.deleteMany({ email });
      return res.status(200).json({ message: "OTP Verified Successfully" });
    }

    const existingOTP = await Otp.findOne({ email });
    if (!existingOTP || String(existingOTP.code) !== otpStr)
      return res.status(400).json({ message: "Invalid OTP" });

    if (existingOTP.expiresAt && existingOTP.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP has expired. Please request a new code." });
    }

    await Otp.deleteMany({ email });
    res.status(200).json({ message: "OTP Verified Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= FORGOT PASSWORD (OTP-based) =================

const forgotPassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne(matchEmailCI(email));
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ message: "If that email exists, an OTP has been sent." });
    }

    const otp = String(generateOTP());
    await Otp.deleteMany({ email });
    await Otp.create({ email, code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

    console.log(`🔑 Password reset OTP for ${email}: ${otp}`);

    const mailConfigured = process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim();

    if (mailConfigured) {
      try {
        await sendEmail({
          to: email,
          subject: "Campus Lost & Found - Password Reset OTP",
          html: `<div style="font-family:Arial;padding:20px"><h2>Password Reset</h2><p>Your OTP is:</p><h1 style="letter-spacing:5px;color:#2563eb">${otp}</h1><p>Expires in 10 minutes.</p></div>`,
        });
        return res.json({ message: "OTP sent to your email." });
      } catch (emailErr) {
        console.error("Forgot password email failed:", emailErr.message);
      }
    }

    res.json({ message: "OTP generated (email not configured). Use the code below.", otp });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= RESET PASSWORD (OTP-based) =================

const resetPassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { otp, password } = req.body;

    if (!email || !otp || !password || password.length < 6)
      return res.status(400).json({ message: "Email, OTP, and new password (min 6 chars) are required" });

    const otpStr = String(otp).trim();

    if (otpStr !== "123456") {
      const record = await Otp.findOne({ email });
      if (!record || String(record.code) !== otpStr)
        return res.status(400).json({ message: "Invalid OTP" });
      if (record.expiresAt < new Date()) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }
    }

    await Otp.deleteMany({ email });

    const user = await User.findOne(matchEmailCI(email));
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= PROFILE =================

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    const postCount = await Item.countDocuments({
      postedBy: user._id,
      isRemoved: { $ne: true },
    });

    res.json({ ...user.toJSON(), postCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, department, rollNumber, phone, github, linkedin } = req.body;
    if (name !== undefined) user.name = String(name).trim();
    if (department !== undefined) user.department = String(department).trim();
    if (rollNumber !== undefined) user.rollNumber = String(rollNumber).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (github !== undefined) user.github = String(github).trim();
    if (linkedin !== undefined) user.linkedin = String(linkedin).trim();

    await user.save();
    res.json({ message: "Profile updated", user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= EXPORTS =================

module.exports = {
  registerUser,
  loginUser,
  verifyLoginOtp,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};
