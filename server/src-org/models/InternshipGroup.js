import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  whatsappGroupCode: { type: String, default: '' },
  inviteTokenHash: { type: String, required: true, unique: true, select: false },
  inviteTokenEncrypted: { type: String, select: false },
  inviteActive: { type: Boolean, default: true },
  status: { type: String, enum: ['registration','active','completion_pending','completed'], default: 'registration', index: true },
  durationDays: { type: Number, default: 28, min: 1, max: 365 },
  plannedStartDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,
  completedAt: Date,
  archivedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completionApprovals: [{ admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedAt: Date }]
}, { timestamps: true });
schema.index({ status: 1, createdAt: -1 });
export default mongoose.model('InternshipGroup', schema);
