import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== 'active') return res.status(401).json({ message: 'Account unavailable.' });
    req.user = user; req.authMethod = payload.authMethod || 'unknown'; next();
  } catch { return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}
export function requireRegisteredIntern(req, res, next) {
  if (req.user?.role !== 'intern' || !req.user.registrationComplete) return res.status(403).json({ message: 'Complete intern registration first.' });
  next();
}
