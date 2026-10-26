import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipGroup', required: true },
  dateKey: { type: String, required: true },
  sessionNumber: { type: Number, enum: [1, 2], required: true, default: 1 },
  startedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  consumedAt: Date
}, { timestamps: true });
export default mongoose.model('AttendanceSession', schema);
