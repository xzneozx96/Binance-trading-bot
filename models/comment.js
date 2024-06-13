const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    task: {
      type: mongoose.Types.ObjectId,
      ref: "task",
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("comment", CommentSchema);
