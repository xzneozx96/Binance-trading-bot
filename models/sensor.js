const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema(
  {
    name: {
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
    average: {
      type: Number,
      required: true,
      default: 0,
    },
    lastEntryId: {
      type: Number,
      default: null,
    },
    meter: {
      type: mongoose.Types.ObjectId,
      ref: "meter",
      required: true,
    },
    measurements: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("sensor", SensorSchema);
