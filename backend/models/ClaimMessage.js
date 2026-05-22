const mongoose = require("mongoose");

const claimMessageSchema = new mongoose.Schema(
  {
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

claimMessageSchema.index({ claim: 1, createdAt: 1 });

module.exports = mongoose.model("ClaimMessage", claimMessageSchema);
