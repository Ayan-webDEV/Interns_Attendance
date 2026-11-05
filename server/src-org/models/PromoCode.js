import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipGroup', required: true, index: true },
  minReward: { type: Number, required: true, min: 1 },
  maxReward: { type: Number, required: true, min: 1 },
  maxRedemptions: { type: Number, required: true, min: 1 },
  redemptionCount: { type: Number, default: 0 },
  redeemedBy: [{ intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, amount: Number, redeemedAt: Date }],
  active: { type: Boolean, default: true },
  expiredAt: Date,
  expiredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: Date
}, { timestamps: true });
export default mongoose.model('PromoCode', schema);
