import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  link: { type: String, trim: true, default: '' },
  targetGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipGroup', default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
schema.index({ targetGroup: 1, createdAt: -1 });
export default mongoose.model('Notification', schema);
