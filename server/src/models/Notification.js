import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    link: { type: String, trim: true, default: "" },
    // null targetGroup means a general notice; targetUser enables a private notice.
    targetGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipGroup",
      default: null,
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    code: { type: String, trim: true, default: "", index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

schema.index({ targetGroup: 1, createdAt: -1 });
schema.index({ targetUser: 1, createdAt: -1 });
schema.index({ targetUser: 1, code: 1 });

export default mongoose.model("Notification", schema);
