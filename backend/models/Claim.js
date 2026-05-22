const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "verified", "awaiting_final", "approved", "rejected"],
      default: "pending",
    },
    isOtpVerified: { type: Boolean, default: false },
    claimantOtp: { type: String, default: null },
    claimantOtpExpires: { type: Date, default: null },
    finderFinalOtp: { type: String, default: null },
    finderFinalOtpExpires: { type: Date, default: null },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    claimantUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    claimantName: { type: String, default: "" },
    claimantEmail: { type: String, default: "" },
    message: { type: String, default: "" },
    securityAnswers: [{ question: String, answer: String }],
  },
  { timestamps: true }
);

claimSchema.pre("save", function syncLegacy(next) {
  if (this.item && !this.itemId) this.itemId = this.item;
  if (this.claimant && !this.claimantUserId) this.claimantUserId = this.claimant;
  if (!this.securityAnswers?.length && this.answers?.length) {
    this.securityAnswers = this.answers;
  }
  next();
});

module.exports = mongoose.model("Claim", claimSchema);
