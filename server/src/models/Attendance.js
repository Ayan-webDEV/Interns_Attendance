import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipGroup', required: true, index: true },
  dateKey: { type: String, required: true, index: true },
  sessionNumber: { type: Number, enum: [1, 2], required: true, default: 1 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'admin_corrected_present', 'admin_corrected_absent'], default: 'pending', index: true },
  sessionStartedAt: { type: Date, required: true },
  markedAt: { type: Date, required: true },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  approvalHistory: [{ action: { type: String, enum: ['submitted','approved','rejected','corrected'] }, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date, note: String }],
  rewardIssued: { type: Boolean, default: false },
  rewardAmount: { type: Number, default: 0 },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  correctionReason: String
}, { timestamps: true });
schema.index({ intern: 1, dateKey: 1, sessionNumber: 1 }, { unique: true, name: 'intern_date_session_unique' });
schema.index({ group: 1, dateKey: -1, status: 1 }, { name: 'group_date_status' });
export default mongoose.model('Attendance', schema);
