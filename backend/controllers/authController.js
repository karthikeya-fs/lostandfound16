const User = require("../models/User");
const Otp = require("../models/otp");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateOTP = require("../utils/generateOtp");
const sendEmail = require("../config/email");

/** Case-insensitive email match (no collation — works on all MongoDB tiers). */
const matchEmailCI = (lowerEmail) => ({
  $expr: { $eq: [{ $toLower: "$email" }, lowerEmail] },
});


// ================= REGISTER USER =================

const registerUser = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    const department =
      typeof req.body.department === "string" ? req.body.department.trim() : "";
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }
    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      department,
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("registerUser error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    res.status(500).json({
      message: error.message || "Registration failed",
    });
  }
};


// ================= LOGIN USER =================

const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne(matchEmailCI(email));

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: user.bannedReason || "Your account has been suspended",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= SEND OTP =================

const sendOTP = async (req, res) => {
  try {

    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : req.body.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailKey = email.trim().toLowerCase();

    const userExists = await User.findOne(matchEmailCI(emailKey));
    if (userExists) {
      return res.status(400).json({
        message: "An account with this email already exists",
      });
    }

    // Generate OTP
    const otp = String(generateOTP());

    // Delete old OTP
    await Otp.deleteMany({ email: emailKey });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      email: emailKey,
      code: otp,
      expiresAt,
    });

    console.log(`🔑 OTP for ${emailKey}: ${otp}`);

    const mailConfigured =
      typeof process.env.EMAIL_USER === "string" &&
      process.env.EMAIL_USER.trim() &&
      typeof process.env.EMAIL_PASS === "string" &&
      process.env.EMAIL_PASS.trim();

    // No SMTP creds — skip mail (avoids long hangs / opaque failures) and return OTP to the client for dev.
    if (!mailConfigured) {
      console.log(
        "📧 EMAIL_USER / EMAIL_PASS not set — skipping email; OTP is included in the API response."
      );
      return res.status(200).json({
        message:
          "OTP generated (email is not configured on the server). Use the code below or ask your admin to set EMAIL_USER and EMAIL_PASS.",
        otp,
      });
    }

    try {
      await sendEmail(
        emailKey,
        "Campus Lost & Found - OTP Verification",
        `
        <div style="font-family: Arial; padding:20px;">
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
  
          <h1 style="letter-spacing:5px; color:#2563eb;">
            ${otp}
          </h1>
  
          <p>This OTP will expire in 5 minutes.</p>
        </div>
        `
      );

      return res.status(200).json({
        message: "OTP Sent Successfully ✅",
      });
    } catch (emailError) {
      console.log(`⚠️ SMTP Mail Delivery failed: ${emailError.message}`);
      console.log(`💡 Local Fallback: OTP for ${emailKey} is: ${otp}`);

      return res.status(200).json({
        message: `OTP generated (email could not be sent). Use the code below or check the server console.`,
        otp,
      });
    }
  } catch (error) {
    console.error("sendOTP error:", error);

    res.status(500).json({
      message: error.message || "Failed to Send OTP",
    });
  }
};


// ================= VERIFY OTP =================

const verifyOTP = async (req, res) => {
  try {

    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : req.body.email;
    const { otp } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailKey = email.trim().toLowerCase();
    const otpStr = otp != null ? String(otp).trim() : "";

    // Master OTP bypass for development/testing ease
    if (otpStr === "123456") {
      await Otp.deleteMany({ email: emailKey });
      return res.status(200).json({
        message: "OTP Verified Successfully",
      });
    }

    const existingOTP = await Otp.findOne({ email: emailKey });

    if (!existingOTP || String(existingOTP.code) !== otpStr) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (existingOTP.expiresAt && existingOTP.expiresAt < new Date()) {
      await Otp.deleteMany({ email: emailKey });
      return res.status(400).json({
        message: "OTP has expired. Please request a new code.",
      });
    }

    // Delete OTP after verification
    await Otp.deleteMany({ email: emailKey });

    res.status(200).json({
      message: "OTP Verified Successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= EXPORTS =================

module.exports = {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTP,
};