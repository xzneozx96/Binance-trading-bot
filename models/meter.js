const mongoose = require("mongoose");

const MeterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    fieldId: {
      type: String,
      required: true,
    },
    latestValue: {
      type: Number,
      required: true,
      default: 0,
    },
    facility: {
      type: mongoose.Types.ObjectId,
      ref: "facility",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("meter", MeterSchema);
