const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    department: { type: String, default: "", trim: true },
    rollNumber: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    github: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    role: {
      type: String,
      enum: ["student", "admin", "user"],
      default: "student",
    },
    isBanned: { type: Boolean, default: false },
    bannedAt: { type: Date, default: null },
    bannedReason: { type: String, default: "" },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
