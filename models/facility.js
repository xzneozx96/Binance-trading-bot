const mongoose = require("mongoose");

const FacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    status: {
      type: String, // working OR maintenance
      required: true,
    },
    installationDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    manufacture: {
      type: String,
    },
    serialNumber: {
      type: String,
    },
    model: {
      type: String,
    },
    warrantyDate: {
      type: Date,
    },

    // info for report only
    downtime: {
      type: Number, // unit: seconds
      default: 0,
    },
    mttr: {
      type: Number,
      default: 0,
    },
    mtbf: {
      type: Number,
      default: 0,
    },
    completedPlannedTask: {
      type: Number,
      default: 0,
    },
    completedUnplannedTask: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("facility", FacilitySchema);
