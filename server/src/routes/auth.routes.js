import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import User from '../models/User.js';
import InternshipGroup from '../models/InternshipGroup.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyOfferRecord, normalizeId } from '../services/offerVerification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
const router = Router();
const googleClient = new OAuth2Client();
const issue = (user, authMethod = 'google') => jwt.sign({ sub: user._id.toString(), role: user.role, authMethod }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, role: u.role, name: u.name, email: u.email, internId: u.internId, registrationComplete: u.registrationComplete, group: u.group, internCashBalance: u.internCashBalance, domain: u.domain, internshipStartDate: u.internshipStartDate, whatsappNumber: u.whatsappNumber, offerIssueDate: u.offerIssueDate, offerDuration: u.offerDuration, workMode: u.workMode, stipend: u.stipend, offerSent: u.offerSent, offerSentStatus: u.offerSentStatus, offerSentAt: u.offerSentAt });
router.post('/admin-login', asyncHandler(async (req, res) => {
  const { email, password } = z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(200),
  }).parse(req.body);
  const normalizedEmail = email.trim().toLowerCase();
  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',')
    .map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!allowedAdmins.includes(normalizedEmail)) {
    throw new HttpError(401, 'Invalid admin email or password.');
  }
  const admin = await User.findOne({
    email: normalizedEmail, role: 'admin', status: 'active', registrationComplete: true,
  }).select('+passwordHash');
  if (!admin || !admin.passwordHash || !(await bcrypt.compare(password, admin.passwordHash))) {
    throw new HttpError(401, 'Invalid admin email or password.');
  }
  admin.lastLoginAt = new Date();
  await admin.save();
  return res.json({ token: issue(admin, 'admin-password'), user: publicUser(admin) });
}));

router.post('/google', asyncHandler(async (req,res) => {
  const { credential } = z.object({ credential: z.string().min(20) }).parse(req.body);
  if (!process.env.GOOGLE_CLIENT_ID) throw new HttpError(503, 'Google authentication is not configured.');
  let ticket;
  try { ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID }); } catch { throw new HttpError(401, 'Google sign-in could not be verified.'); }
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified || !p.sub) throw new HttpError(401, 'Use a Google account with a verified email address.');
  const email = p.email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleSub: p.sub }, { email }] });
  if (user) {
    if (user.role === 'admin') {
      const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
      if (!allowedAdmins.includes(email)) throw new HttpError(403, 'This admin account is not authorized.');
    }
    if (user.googleSub && user.googleSub !== p.sub) throw new HttpError(409, 'This email is linked to a different Google identity. Contact support.');
    if (!user.googleSub) { user.googleSub = p.sub; await user.save(); }
    user.lastLoginAt = new Date(); await user.save();
    return res.json({ token: issue(user, 'google'), user: publicUser(user), onboardingRequired: user.role === 'intern' && !user.registrationComplete });
  }
  const onboardingTicket = jwt.sign({ purpose: 'intern-onboarding', googleSub: p.sub, email, name: p.name || email.split('@')[0] }, process.env.JWT_SECRET, { expiresIn: '10m' });
  return res.json({ onboardingRequired: true, onboardingTicket, googleProfile: { email, name: p.name || '' } });
}));
router.post('/register', asyncHandler(async (req,res) => {
  const schema = z.object({ onboardingTicket:z.string(), internId:z.string().min(10), name:z.string().min(2), email:z.string().email(), whatsappNumber:z.string().min(7), whatsappGroupName:z.string().min(2), whatsappGroupCode:z.string().min(1), internshipStartDate:z.string().min(8), domain:z.string().min(2), password:z.string().min(10), inviteToken:z.string().min(20) });
  const data = schema.parse(req.body);
  let onboarding;
  try { onboarding = jwt.verify(data.onboardingTicket, process.env.JWT_SECRET); } catch { throw new HttpError(401, 'Registration session expired. Continue with Google again.'); }
  if (onboarding.purpose !== 'intern-onboarding' || onboarding.email !== data.email.toLowerCase()) throw new HttpError(401, 'Google identity does not match the registration email.');
  const group = await InternshipGroup.findOne({ inviteTokenHash: await import('node:crypto').then(c => c.createHash('sha256').update(data.inviteToken).digest('hex')), inviteActive: true });
  if (!group || ['completed','completion_pending'].includes(group.status)) throw new HttpError(400, 'This group invitation is invalid or no longer accepting registrations.');
  if (group.whatsappGroupCode && group.whatsappGroupCode.trim().toLowerCase() !== data.whatsappGroupCode.trim().toLowerCase()) throw new HttpError(400, 'The WhatsApp group code does not match this invitation group.');
  const existing = await User.findOne({ $or: [{ email: onboarding.email }, { googleSub: onboarding.googleSub }, { internId: normalizeId(data.internId) }] });
  if (existing) throw new HttpError(409, 'This email, Google identity, or intern ID is already registered. Each intern ID can be claimed only once.');
  const verified = await verifyOfferRecord({ internId: data.internId, name: data.name, email: onboarding.email });
  if (verified.email !== onboarding.email) throw new HttpError(400, 'The Google email must match the email on the offer letter.');
  const offerDate = verified.startDate ? new Date(verified.startDate) : null;
  const enteredDate = new Date(data.internshipStartDate);
  if (Number.isNaN(enteredDate.getTime())) throw new HttpError(400, 'Enter a valid internship start date.');
  if (offerDate && offerDate.toISOString().slice(0,10) !== enteredDate.toISOString().slice(0,10)) throw new HttpError(400, 'The start date must match the offer letter.');
  const passwordHash = await bcrypt.hash(data.password, 12);
  let user;
  try {
    user = await User.create({ role:'intern', internId:verified.internId, name:verified.name, email:verified.email, googleSub:onboarding.googleSub, whatsappNumber:data.whatsappNumber, whatsappGroupName:data.whatsappGroupName, whatsappGroupCode:data.whatsappGroupCode, internshipStartDate:offerDate || enteredDate, offerIssueDate:verified.issueDate ? new Date(verified.issueDate) : undefined, offerDuration:verified.duration ?? undefined, workMode:verified.mode || undefined, stipend:verified.stipend ?? undefined, offerSent:verified.offerSent === true, offerSentStatus:verified.offerStatus || (verified.offerSent ? 'sent' : undefined), offerSentAt:verified.offerSentAt ? new Date(verified.offerSentAt) : undefined, domain:verified.domain || data.domain, group:group._id, passwordHash, registrationComplete:true, internCashBalance:20 });
    await WalletTransaction.create({ intern:user._id, group:group._id, amount:20, type:'welcome_bonus', reference:`welcome:${user._id}`, description:'Welcome bonus', balanceAfter:20 });
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, 'This intern ID or account has already been registered.');
    throw e;
  }
  res.status(201).json({ token:issue(user, 'google'), user:publicUser(user) });
}));
router.post('/intern-login', asyncHandler(async (req,res) => {
  const { internId, password } = z.object({ internId:z.string().min(5), password:z.string().min(1) }).parse(req.body);
  const user = await User.findOne({ internId:normalizeId(internId) }).select('+passwordHash');
  if (!user || user.role !== 'intern' || !user.passwordHash || !(await bcrypt.compare(password,user.passwordHash))) throw new HttpError(401, 'Invalid intern ID or password.');
  if (user.status !== 'active' || !user.registrationComplete) throw new HttpError(403, 'This account is not active.');
  user.lastLoginAt = new Date(); await user.save();
  res.json({ token:issue(user, 'password'), user:publicUser(user) });
}));
router.post('/set-password', requireAuth, asyncHandler(async (req,res) => {
  const { password } = z.object({ password:z.string().min(10) }).parse(req.body);
  if (req.user.role !== 'intern' || !req.user.registrationComplete) throw new HttpError(403, 'Only registered interns can set a password.');
  if (req.authMethod !== 'google') throw new HttpError(403, 'For password recovery, sign in with your verified Google account first.');
  req.user.passwordHash = await bcrypt.hash(password,12); await req.user.save();
  res.json({ message:'Password updated. You can now sign in with your intern ID and password.' });
}));
router.get('/me', requireAuth, asyncHandler(async (req,res) => res.json({ user:publicUser(req.user) })));
export default router;
