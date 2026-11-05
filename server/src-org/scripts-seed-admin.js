import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDB } from './config/db.js';

const allowedAdmins = (process.env.ADMIN_EMAILS || '')
  .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);

const admins = [
  {
    email: process.env.SEED_ADMIN_EMAIL,
    name: process.env.SEED_ADMIN_NAME || 'VELoop CEO',
    password: process.env.SEED_ADMIN_PASSWORD,
  },
  {
    email: process.env.SEED_MARKETING_ADMIN_EMAIL,
    name: process.env.SEED_MARKETING_ADMIN_NAME || 'VELoop Marketing Admin',
    password: process.env.SEED_MARKETING_ADMIN_PASSWORD,
  },
].filter(admin => admin.email || admin.password);

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI in server/.env.');
  process.exit(1);
}
if (admins.length === 0) {
  console.error('Configure SEED_ADMIN_* and/or SEED_MARKETING_ADMIN_* variables in server/.env.');
  process.exit(1);
}
for (const admin of admins) {
  admin.email = admin.email?.trim().toLowerCase();
  if (!admin.email || !admin.password) {
    console.error('Each seeded admin requires an email and a password. Check both admin environment-variable sets.');
    process.exit(1);
  }
  if (admin.password.length < 12) {
    console.error(`Password for ${admin.email} is too short. Use at least 12 characters for admin accounts.`);
    process.exit(1);
  }
  if (!allowedAdmins.includes(admin.email)) {
    console.error(`${admin.email} must be included in ADMIN_EMAILS.`);
    process.exit(1);
  }
}

try {
  await connectDB();
  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 12);
    const user = await User.findOneAndUpdate(
      { email: admin.email },
      {
        $set: {
          role: 'admin', name: admin.name, email: admin.email,
          passwordHash, registrationComplete: true, status: 'active',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    console.log(`Admin credentials configured for ${user.email} (${user.name}).`);
  }
  console.log('Admin seeding complete. Remove both SEED_*_PASSWORD values from production environment after seeding.');
} catch (error) {
  console.error('Admin seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
