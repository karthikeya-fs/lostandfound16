const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["lost", "found"], required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    color: { type: String, default: "" },
    brand: { type: String, default: "" },
    date: { type: Date, required: true },
    images: [String],
    reward: { type: String, default: "" },
    contact: { type: String, default: "" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["open", "claimed", "resolved"],
      default: "open",
    },
    blurImage: { type: Boolean, default: false },
    isRemoved: { type: Boolean, default: false },
    removedAt: { type: Date, default: null },
    removedReason: { type: String, default: "" },
    verificationQuestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    securityQuestions: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
