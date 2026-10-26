import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipGroup', index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['welcome_bonus','attendance_reward','reattendance_reward','promo_reward','admin_adjustment'], required: true },
  reference: { type: String, required: true },
  description: { type: String, required: true },
  balanceAfter: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
schema.index({ intern: 1, reference: 1 }, { unique: true });
schema.index({ group: 1, createdAt: -1 });
export default mongoose.model('WalletTransaction', schema);
