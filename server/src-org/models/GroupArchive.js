import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  originalGroupId: { type: String, required: true, index: true },
  groupName: { type: String, required: true },
  archivedAt: { type: Date, required: true, default: Date.now },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
schema.index({ originalGroupId: 1 }, { unique: true });
export default mongoose.model('GroupArchive', schema);
