import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['intern','admin'], default: 'intern', required: true },
  internId: { type: String, uppercase: true, trim: true, sparse: true, unique: true, index: true },
  name: { type: String, trim: true, required: true },
  email: { type: String, lowercase: true, trim: true, required: true, unique: true, index: true },
  googleSub: { type: String, sparse: true, unique: true, index: true },
  whatsappNumber: { type: String, trim: true },
  whatsappGroupName: { type: String, trim: true },
  whatsappGroupCode: { type: String, trim: true },
  internshipStartDate: { type: Date },
  offerIssueDate: { type: Date },
  offerDuration: { type: mongoose.Schema.Types.Mixed },
  workMode: { type: String, trim: true },
  stipend: { type: mongoose.Schema.Types.Mixed },
  offerSent: { type: Boolean, default: false },
  offerSentStatus: { type: String, trim: true },
  offerSentAt: { type: Date },
  domain: { type: String, trim: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipGroup', default: null, index: true },
  passwordHash: { type: String, select: false },
  registrationComplete: { type: Boolean, default: false },
  internCashBalance: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active','suspended'], default: 'active' },
  lastLoginAt: Date
}, { timestamps: true });
userSchema.index({ group: 1, role: 1 });
export default mongoose.model('User', userSchema);
