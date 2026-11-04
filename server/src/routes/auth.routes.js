// import { Router } from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { OAuth2Client } from "google-auth-library";
// import { z } from "zod";

// import User from "../models/User.js";
// import { randomUUID } from "node:crypto";
// import OnboardingTicket from "../models/OnboardingTicket.js";
// import InternshipGroup from "../models/InternshipGroup.js";
// import WalletTransaction from "../models/WalletTransaction.js";

// import { requireAuth } from "../middleware/auth.js";

// import {
//   verifyOfferRecord,
//   normalizeId,
// } from "../services/offerVerification.js";

// import { asyncHandler } from "../utils/asyncHandler.js";
// import { HttpError } from "../utils/httpError.js";

// const router = Router();

// const googleClient = new OAuth2Client();

// /* -------------------------------------------------------------------------- */
// /* JWT                                                                        */
// /* -------------------------------------------------------------------------- */

// const issue = (user, authMethod = "google") =>
//   jwt.sign(
//     {
//       sub: user._id.toString(),
//       role: user.role,
//       authMethod,
//     },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: process.env.JWT_EXPIRES_IN || "7d",
//     },
//   );

// /* -------------------------------------------------------------------------- */
// /* Public user response                                                       */
// /* -------------------------------------------------------------------------- */

// /**
//  * Never expose passwordHash or the internal missed attendance document IDs.
//  *
//  * missedAttendanceCount is safe to expose to the authenticated intern
//  * and allows the frontend dashboard to display the missed-session total.
//  *
//  * The array length is a fallback for older records where the counter
//  * has not yet been initialized.
//  */
// const publicUser = (user) => ({
//   id: user._id,

//   role: user.role,
//   name: user.name,
//   email: user.email,
//   internId: user.internId,

//   registrationComplete: user.registrationComplete,

//   group: user.group,

//   internCashBalance: user.internCashBalance,

//   domain: user.domain,
//   internshipStartDate: user.internshipStartDate,

//   whatsappNumber: user.whatsappNumber,
//   gender: user.gender,

//   offerIssueDate: user.offerIssueDate,
//   offerDuration: user.offerDuration,
//   workMode: user.workMode,
//   stipend: user.stipend,
//   offerSent: user.offerSent,
//   offerSentStatus: user.offerSentStatus,
//   offerSentAt: user.offerSentAt,

//   // New missed-session information.
//   missedAttendanceCount: Math.max(
//     0,
//     Number(
//       user.missedAttendanceCount ?? user.missedAttendanceRecords?.length ?? 0,
//     ),
//   ),
// });

// /* -------------------------------------------------------------------------- */
// /* Admin login                                                                */
// /* -------------------------------------------------------------------------- */

// router.post(
//   "/admin-login",
//   asyncHandler(async (req, res) => {
//     const { email, password } = z
//       .object({
//         email: z.string().email().max(254),
//         password: z.string().min(1).max(200),
//       })
//       .parse(req.body);

//     const normalizedEmail = email.trim().toLowerCase();

//     const allowedAdmins = (process.env.ADMIN_EMAILS || "")
//       .split(",")
//       .map((value) => value.trim().toLowerCase())
//       .filter(Boolean);

//     if (!allowedAdmins.includes(normalizedEmail)) {
//       throw new HttpError(401, "Invalid admin email or password.");
//     }

//     const admin = await User.findOne({
//       email: normalizedEmail,
//       role: "admin",
//       status: "active",
//       registrationComplete: true,
//     }).select("+passwordHash");

//     if (
//       !admin ||
//       !admin.passwordHash ||
//       !(await bcrypt.compare(password, admin.passwordHash))
//     ) {
//       throw new HttpError(401, "Invalid admin email or password.");
//     }

//     admin.lastLoginAt = new Date();

//     await admin.save();

//     return res.json({
//       token: issue(admin, "admin-password"),
//       user: publicUser(admin),
//     });
//   }),
// );

// /* -------------------------------------------------------------------------- */
// /* Google authentication                                                      */
// /* -------------------------------------------------------------------------- */

// router.post(
//   "/google",
//   asyncHandler(async (req, res) => {
//     const { credential } = z
//       .object({
//         credential: z.string().min(20),
//       })
//       .parse(req.body);

//     if (!process.env.GOOGLE_CLIENT_ID) {
//       throw new HttpError(503, "Google authentication is not configured.");
//     }

//     let ticket;

//     try {
//       ticket = await googleClient.verifyIdToken({
//         idToken: credential,
//         audience: process.env.GOOGLE_CLIENT_ID,
//       });
//     } catch {
//       throw new HttpError(401, "Google sign-in could not be verified.");
//     }

//     const profile = ticket.getPayload();

//     if (!profile?.email || !profile.email_verified || !profile.sub) {
//       throw new HttpError(
//         401,
//         "Use a Google account with a verified email address.",
//       );
//     }

//     const email = profile.email.toLowerCase();

//     let user = await User.findOne({
//       $or: [{ googleSub: profile.sub }, { email }],
//     });

//     if (user) {
//       if (user.role === "admin") {
//         const allowedAdmins = (process.env.ADMIN_EMAILS || "")
//           .split(",")
//           .map((value) => value.trim().toLowerCase())
//           .filter(Boolean);

//         if (!allowedAdmins.includes(email)) {
//           throw new HttpError(403, "This admin account is not authorized.");
//         }
//       }

//       if (user.googleSub && user.googleSub !== profile.sub) {
//         throw new HttpError(
//           409,
//           "This email is linked to a different Google identity. Contact support.",
//         );
//       }

//       if (!user.googleSub) {
//         user.googleSub = profile.sub;
//         await user.save();
//       }

//       user.lastLoginAt = new Date();

//       await user.save();

//       return res.json({
//         token: issue(user, "google"),
//         user: publicUser(user),

//         onboardingRequired:
//           user.role === "intern" && !user.registrationComplete,
//       });
//     }

//     // const onboardingTicket = jwt.sign(
//     //   {
//     //     purpose: "intern-onboarding",
//     //     googleSub: profile.sub,
//     //     email,
//     //     name: profile.name || email.split("@")[0],
//     //   },
//     //   process.env.JWT_SECRET,
//     //   {
//     //     expiresIn: "10m",
//     //   },
//     // );
//     const jti = randomUUID();

//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     await OnboardingTicket.create({
//       jti,
//       googleSub: profile.sub,
//       email,
//       expiresAt,
//     });

//     const onboardingTicket = jwt.sign(
//       {
//         purpose: "intern-onboarding",
//         googleSub: profile.sub,
//         email,
//         name: profile.name || email.split("@")[0],
//         jti,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "10m",
//       },
//     );

//     return res.json({
//       onboardingRequired: true,
//       onboardingTicket,

//       googleProfile: {
//         email,
//         name: profile.name || "",
//       },
//     });
//   }),
// );

// /* -------------------------------------------------------------------------- */
// /* Intern registration                                                       */
// /* -------------------------------------------------------------------------- */

// router.post(
//   "/register",
//   asyncHandler(async (req, res) => {
//     const schema = z.object({
//       onboardingTicket: z.string(),

//       internId: z.string().min(10),
//       name: z.string().min(2),
//       email: z.string().email(),

//       whatsappNumber: z.string().min(7),
//       whatsappGroupName: z.string().min(2),
//       whatsappGroupCode: z.string().min(1),

//       internshipStartDate: z.string().min(8),

//       domain: z.string().min(2),
//       password: z.string().min(10),

//       inviteToken: z.string().min(20),
//     });

//     const data = schema.parse(req.body);

//     let onboarding;

//     try {
//       onboarding = jwt.verify(data.onboardingTicket, process.env.JWT_SECRET);
//     } catch {
//       throw new HttpError(
//         401,
//         "Registration session expired. Continue with Google again.",
//       );
//     }

//     if (
//       onboarding.purpose !== "intern-onboarding" ||
//       !onboarding.googleSub ||
//       !onboarding.jti ||
//       onboarding.email !== data.email.trim().toLowerCase()
//     ) {
//       throw new HttpError(
//         401,
//         "Google identity does not match the registration session.",
//       );
//     }

//     const validTicket = await OnboardingTicket.findOne({
//       jti: onboarding.jti,
//       googleSub: onboarding.googleSub,
//       email: onboarding.email,
//       consumedAt: null,
//       expiresAt: { $gt: new Date() },
//     });

//     if (!validTicket) {
//       throw new HttpError(
//         401,
//         "Your Google verification has expired or has already been used. Sign in with Google again.",
//       );
//     }

//     const group = await InternshipGroup.findOne({
//       inviteTokenHash: await import("node:crypto").then((crypto) =>
//         crypto.createHash("sha256").update(data.inviteToken).digest("hex"),
//       ),

//       inviteActive: true,
//     });

//     if (!group || ["completed", "completion_pending"].includes(group.status)) {
//       throw new HttpError(
//         400,
//         "This group invitation is invalid or no longer accepting registrations.",
//       );
//     }

//     if (
//       group.whatsappGroupCode &&
//       group.whatsappGroupCode.trim().toLowerCase() !==
//         data.whatsappGroupCode.trim().toLowerCase()
//     ) {
//       throw new HttpError(
//         400,
//         "The WhatsApp group code does not match this invitation group.",
//       );
//     }

//     const existing = await User.findOne({
//       $or: [
//         { email: onboarding.email },
//         { googleSub: onboarding.googleSub },
//         { internId: normalizeId(data.internId) },
//       ],
//     });

//     if (existing) {
//       throw new HttpError(
//         409,
//         "This email, Google identity, or intern ID is already registered. Each intern ID can be claimed only once.",
//       );
//     }

//     const verified = await verifyOfferRecord({
//       internId: data.internId,
//       name: data.name,
//       email: onboarding.email,
//     });

//     if (verified.email !== onboarding.email) {
//       throw new HttpError(
//         400,
//         "The Google email must match the email on the offer letter.",
//       );
//     }

//     const offerDate = verified.startDate ? new Date(verified.startDate) : null;

//     const enteredDate = new Date(data.internshipStartDate);

//     if (Number.isNaN(enteredDate.getTime())) {
//       throw new HttpError(400, "Enter a valid internship start date.");
//     }

//     if (
//       offerDate &&
//       offerDate.toISOString().slice(0, 10) !==
//         enteredDate.toISOString().slice(0, 10)
//     ) {
//       throw new HttpError(400, "The start date must match the offer letter.");
//     }

//     // const passwordHash = await bcrypt.hash(data.password, 12);

//     const passwordHash = await bcrypt.hash(data.password, 12);

//     // Atomically consume the Google onboarding ticket.
//     // Only one registration request can successfully consume it.
//     const consumedTicket = await OnboardingTicket.findOneAndUpdate(
//       {
//         jti: onboarding.jti,
//         googleSub: onboarding.googleSub,
//         email: onboarding.email,
//         consumedAt: null,
//         expiresAt: { $gt: new Date() },
//       },
//       {
//         $set: {
//           consumedAt: new Date(),
//         },
//       },
//       {
//         new: true,
//       },
//     );

//     if (!consumedTicket) {
//       throw new HttpError(
//         401,
//         "This Google verification session has expired or has already been used. Sign in again.",
//       );
//     }

//     let user;

//     try {
//       user = await User.create({
//         role: "intern",

//         internId: verified.internId,
//         name: verified.name,
//         email: verified.email,

//         googleSub: onboarding.googleSub,

//         whatsappNumber: data.whatsappNumber,
//         whatsappGroupName: data.whatsappGroupName,
//         whatsappGroupCode: data.whatsappGroupCode,

//         internshipStartDate: offerDate || enteredDate,

//         offerIssueDate: verified.issueDate
//           ? new Date(verified.issueDate)
//           : undefined,

//         offerDuration: verified.duration ?? undefined,
//         workMode: verified.mode || undefined,
//         stipend: verified.stipend ?? undefined,

//         offerSent: verified.offerSent === true,

//         offerSentStatus:
//           verified.offerStatus || (verified.offerSent ? "sent" : undefined),

//         offerSentAt: verified.offerSentAt
//           ? new Date(verified.offerSentAt)
//           : undefined,

//         domain: verified.domain || data.domain,

//         group: group._id,

//         passwordHash,

//         registrationComplete: true,

//         internCashBalance: 20,

//         // Missed attendance starts at zero for a new intern.
//         missedAttendanceRecords: [],
//         missedAttendanceCount: 0,
//       });

//       await WalletTransaction.create({
//         intern: user._id,
//         group: group._id,
//         amount: 20,
//         type: "welcome_bonus",
//         reference: `welcome:${user._id}`,
//         description: "Welcome bonus",
//         balanceAfter: 20,
//       });
//     } catch (error) {
//       if (error.code === 11000) {
//         throw new HttpError(
//           409,
//           "This intern ID or account has already been registered.",
//         );
//       }

//       throw error;
//     }

//     res.status(201).json({
//       token: issue(user, "google"),
//       user: publicUser(user),
//     });
//   }),
// );

// /* -------------------------------------------------------------------------- */
// /* Intern password login                                                      */
// /* -------------------------------------------------------------------------- */

// router.post(
//   "/intern-login",
//   asyncHandler(async (req, res) => {
//     const { internId, password } = z
//       .object({
//         internId: z.string().min(5),
//         password: z.string().min(1),
//       })
//       .parse(req.body);

//     const user = await User.findOne({
//       internId: normalizeId(internId),
//     }).select("+passwordHash");

//     if (
//       !user ||
//       user.role !== "intern" ||
//       !user.passwordHash ||
//       !(await bcrypt.compare(password, user.passwordHash))
//     ) {
//       throw new HttpError(401, "Invalid intern ID or password.");
//     }

//     if (user.status !== "active" || !user.registrationComplete) {
//       throw new HttpError(403, "This account is not active.");
//     }

//     // Existing user found

//     if (user.role === "admin" && !isAllowedAdmin(user.email)) {
//       throw new HttpError(403, "Admin access is not allowed.");
//     }

//     // Check Google identity mismatch here if your existing code has this check.

//     // Prevent incomplete intern accounts from receiving a normal login token
//     if (user.role === "intern" && !user.registrationComplete) {
//       throw new HttpError(
//         403,
//         "Your intern registration is incomplete. Please contact support.",
//       );
//     }

//     user.lastLoginAt = new Date();
//     await user.save();

//     return res.json({
//       token: issue(user, "google"),
//       user: publicUser(user),
//       onboardingRequired: false,
//     });

//     // user.lastLoginAt = new Date();

//     // await user.save();

//     // res.json({
//     //   token: issue(user, "password"),
//     //   user: publicUser(user),
//     // });
//   }),
// );

// /* -------------------------------------------------------------------------- */
// /* Set password                                                               */
// /* -------------------------------------------------------------------------- */

// router.post(
//   "/set-password",
//   requireAuth,
//   asyncHandler(async (req, res) => {
//     const { password } = z
//       .object({
//         password: z.string().min(10),
//       })
//       .parse(req.body);

//     if (req.user.role !== "intern" || !req.user.registrationComplete) {
//       throw new HttpError(403, "Only registered interns can set a password.");
//     }

//     if (req.authMethod !== "google") {
//       throw new HttpError(
//         403,
//         "For password recovery, sign in with your verified Google account first.",
//       );
//     }

//     req.user.passwordHash = await bcrypt.hash(password, 12);

//     await req.user.save();

//     res.json({
//       message:
//         "Password updated. You can now sign in with your intern ID and password.",
//     });
//   }),
// );

// /* -------------------------------------------------------------------------- */
// /* Profile update                                                             */
// /* -------------------------------------------------------------------------- */

// router.patch(
//   "/profile",
//   requireAuth,
//   asyncHandler(async (req, res) => {
//     if (req.user.role !== "intern" || !req.user.registrationComplete) {
//       throw new HttpError(
//         403,
//         "Only registered interns can update this profile.",
//       );
//     }

//     const gender = z
//       .enum(["Female", "Male", "Non-binary", "Prefer not to say"])
//       .parse(req.body.gender);

//     req.user.gender = gender;

//     await req.user.save();

//     res.json({
//       message: "Profile updated.",
//       user: publicUser(req.user),
//     });
//   }),
// );

// /* -------------------------------------------------------------------------- */
// /* Current authenticated user                                                 */
// /* -------------------------------------------------------------------------- */

// router.get(
//   "/me",
//   requireAuth,
//   asyncHandler(async (req, res) => {
//     res.json({
//       user: publicUser(req.user),
//     });
//   }),
// );

// export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";

import User from "../models/User.js";
import { randomUUID } from "node:crypto";
import OnboardingTicket from "../models/OnboardingTicket.js";
import InternshipGroup from "../models/InternshipGroup.js";
import WalletTransaction from "../models/WalletTransaction.js";

import { requireAuth } from "../middleware/auth.js";

import {
  verifyOfferRecord,
  lookupOfferRecord,
  normalizeId,
} from "../services/offerVerification.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

const googleClient = new OAuth2Client();

/* -------------------------------------------------------------------------- */
/* JWT                                                                        */
/* -------------------------------------------------------------------------- */

const issue = (user, authMethod = "google") =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      authMethod,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

/* -------------------------------------------------------------------------- */
/* Public user response                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Never expose passwordHash or the internal missed attendance document IDs.
 *
 * missedAttendanceCount is safe to expose to the authenticated intern
 * and allows the frontend dashboard to display the missed-session total.
 *
 * The array length is a fallback for older records where the counter
 * has not yet been initialized.
 */
const publicUser = (user) => ({
  id: user._id,

  role: user.role,
  name: user.name,
  email: user.email,
  internId: user.internId,

  registrationComplete: user.registrationComplete,

  group: user.group,

  internCashBalance: user.internCashBalance,

  domain: user.domain,
  internshipStartDate: user.internshipStartDate,

  whatsappNumber: user.whatsappNumber,
  gender: user.gender,

  offerIssueDate: user.offerIssueDate,
  offerDuration: user.offerDuration,
  workMode: user.workMode,
  stipend: user.stipend,
  offerSent: user.offerSent,
  offerSentStatus: user.offerSentStatus,
  offerSentAt: user.offerSentAt,

  // New missed-session information.
  missedAttendanceCount: Math.max(
    0,
    Number(
      user.missedAttendanceCount ?? user.missedAttendanceRecords?.length ?? 0,
    ),
  ),
});

/* -------------------------------------------------------------------------- */
/* Admin login                                                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/admin-login",
  asyncHandler(async (req, res) => {
    const { email, password } = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(1).max(200),
      })
      .parse(req.body);

    const normalizedEmail = email.trim().toLowerCase();

    const allowedAdmins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedAdmins.includes(normalizedEmail)) {
      throw new HttpError(401, "Invalid admin email or password.");
    }

    const admin = await User.findOne({
      email: normalizedEmail,
      role: "admin",
      status: "active",
      registrationComplete: true,
    }).select("+passwordHash");

    if (
      !admin ||
      !admin.passwordHash ||
      !(await bcrypt.compare(password, admin.passwordHash))
    ) {
      throw new HttpError(401, "Invalid admin email or password.");
    }

    admin.lastLoginAt = new Date();

    await admin.save();

    return res.json({
      token: issue(admin, "admin-password"),
      user: publicUser(admin),
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Google authentication                                                      */
/* -------------------------------------------------------------------------- */

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { credential } = z
      .object({
        credential: z.string().min(20),
      })
      .parse(req.body);

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new HttpError(503, "Google authentication is not configured.");
    }

    let ticket;

    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new HttpError(401, "Google sign-in could not be verified.");
    }

    const profile = ticket.getPayload();

    if (!profile?.email || !profile.email_verified || !profile.sub) {
      throw new HttpError(
        401,
        "Use a Google account with a verified email address.",
      );
    }

    const email = profile.email.toLowerCase();

    let user = await User.findOne({
      $or: [{ googleSub: profile.sub }, { email }],
    });

    if (user) {
      if (user.role === "admin") {
        const allowedAdmins = (process.env.ADMIN_EMAILS || "")
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);

        if (!allowedAdmins.includes(email)) {
          throw new HttpError(403, "This admin account is not authorized.");
        }
      }

      if (user.googleSub && user.googleSub !== profile.sub) {
        throw new HttpError(
          409,
          "This email is linked to a different Google identity. Contact support.",
        );
      }

      if (!user.googleSub) {
        user.googleSub = profile.sub;
        await user.save();
      }

      user.lastLoginAt = new Date();

      await user.save();

      return res.json({
        token: issue(user, "google"),
        user: publicUser(user),

        onboardingRequired:
          user.role === "intern" && !user.registrationComplete,
      });
    }

    // const onboardingTicket = jwt.sign(
    //   {
    //     purpose: "intern-onboarding",
    //     googleSub: profile.sub,
    //     email,
    //     name: profile.name || email.split("@")[0],
    //   },
    //   process.env.JWT_SECRET,
    //   {
    //     expiresIn: "10m",
    //   },
    // );
    const jti = randomUUID();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OnboardingTicket.create({
      jti,
      googleSub: profile.sub,
      email,
      expiresAt,
    });

    const onboardingTicket = jwt.sign(
      {
        purpose: "intern-onboarding",
        googleSub: profile.sub,
        email,
        name: profile.name || email.split("@")[0],
        jti,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      },
    );

    return res.json({
      onboardingRequired: true,
      onboardingTicket,

      googleProfile: {
        email,
        name: profile.name || "",
      },
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Offer-letter lookup for registration                                      */
/* -------------------------------------------------------------------------- */

router.post(
  "/offer-lookup",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        internId: z.string().min(9).max(15),
        onboardingTicket: z.string().min(20),
      })
      .parse(req.body);

    const internId = normalizeId(data.internId);

    if (!/^VLRINT\d{9}$/.test(internId)) {
      throw new HttpError(
        400,
        "Enter the 9 digits of your Intern ID after VLRINT.",
      );
    }

    let onboarding;

    try {
      onboarding = jwt.verify(data.onboardingTicket, process.env.JWT_SECRET);
    } catch {
      throw new HttpError(
        401,
        "Your Google verification session expired. Sign in with Google again.",
      );
    }

    if (
      onboarding.purpose !== "intern-onboarding" ||
      !onboarding.googleSub ||
      !onboarding.jti ||
      !onboarding.email
    ) {
      throw new HttpError(
        401,
        "A valid Google registration session is required.",
      );
    }

    const validTicket = await OnboardingTicket.findOne({
      jti: onboarding.jti,
      googleSub: onboarding.googleSub,
      email: onboarding.email,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("_id");

    if (!validTicket) {
      throw new HttpError(
        401,
        "Your Google verification has expired or has already been used. Sign in with Google again.",
      );
    }

    const existing = await User.findOne({
      $or: [
        { internId },
        { email: onboarding.email },
        { googleSub: onboarding.googleSub },
      ],
    }).select("_id");

    if (existing) {
      throw new HttpError(
        409,
        "This email or Intern ID is already registered. Contact the programme administrator if you need help.",
      );
    }

    const offer = await lookupOfferRecord({ internId });

    if (offer.email !== String(onboarding.email).trim().toLowerCase()) {
      throw new HttpError(
        400,
        "The Google account email must match the email on the official offer letter.",
      );
    }

    return res.json({
      verified: true,
      offer: {
        internId: offer.internId,
        name: offer.name,
        email: offer.email,
        startDate: offer.startDate,
        domain: offer.domain,
        issueDate: offer.issueDate,
        duration: offer.duration,
        mode: offer.mode,
        stipend: offer.stipend,
        offerSent: offer.offerSent,
        offerStatus: offer.offerStatus,
        offerSentAt: offer.offerSentAt,
      },
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Intern registration                                                       */
/* -------------------------------------------------------------------------- */

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      onboardingTicket: z.string(),

      internId: z.string().min(10),
      name: z.string().min(2),
      email: z.string().email(),

      whatsappNumber: z.string().min(7),
      whatsappGroupName: z.string().min(2),
      whatsappGroupCode: z.string().min(1),

      internshipStartDate: z.string().min(8),

      domain: z.string().min(2),
      password: z.string().min(10),

      inviteToken: z.string().min(20),
    });

    const data = schema.parse(req.body);

    let onboarding;

    try {
      onboarding = jwt.verify(data.onboardingTicket, process.env.JWT_SECRET);
    } catch {
      throw new HttpError(
        401,
        "Registration session expired. Continue with Google again.",
      );
    }

    if (
      onboarding.purpose !== "intern-onboarding" ||
      !onboarding.googleSub ||
      !onboarding.jti ||
      onboarding.email !== data.email.trim().toLowerCase()
    ) {
      throw new HttpError(
        401,
        "Google identity does not match the registration session.",
      );
    }

    const validTicket = await OnboardingTicket.findOne({
      jti: onboarding.jti,
      googleSub: onboarding.googleSub,
      email: onboarding.email,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!validTicket) {
      throw new HttpError(
        401,
        "Your Google verification has expired or has already been used. Sign in with Google again.",
      );
    }

    const group = await InternshipGroup.findOne({
      inviteTokenHash: await import("node:crypto").then((crypto) =>
        crypto.createHash("sha256").update(data.inviteToken).digest("hex"),
      ),

      inviteActive: true,
    });

    if (!group || ["completed", "completion_pending"].includes(group.status)) {
      throw new HttpError(
        400,
        "This group invitation is invalid or no longer accepting registrations.",
      );
    }

    if (
      group.whatsappGroupCode &&
      group.whatsappGroupCode.trim().toLowerCase() !==
        data.whatsappGroupCode.trim().toLowerCase()
    ) {
      throw new HttpError(
        400,
        "The WhatsApp group code does not match this invitation group.",
      );
    }

    const existing = await User.findOne({
      $or: [
        { email: onboarding.email },
        { googleSub: onboarding.googleSub },
        { internId: normalizeId(data.internId) },
      ],
    });

    if (existing) {
      throw new HttpError(
        409,
        "This email, Google identity, or intern ID is already registered. Each intern ID can be claimed only once.",
      );
    }

    const verified = await verifyOfferRecord({
      internId: data.internId,
      name: data.name,
      email: onboarding.email,
    });

    if (verified.email !== onboarding.email) {
      throw new HttpError(
        400,
        "The Google email must match the email on the offer letter.",
      );
    }

    const offerDate = verified.startDate ? new Date(verified.startDate) : null;

    const enteredDate = new Date(data.internshipStartDate);

    if (Number.isNaN(enteredDate.getTime())) {
      throw new HttpError(400, "Enter a valid internship start date.");
    }

    if (
      offerDate &&
      offerDate.toISOString().slice(0, 10) !==
        enteredDate.toISOString().slice(0, 10)
    ) {
      throw new HttpError(400, "The start date must match the offer letter.");
    }

    if (
      verified.domain &&
      String(data.domain).trim().toLowerCase() !==
        String(verified.domain).trim().toLowerCase()
    ) {
      throw new HttpError(
        400,
        "The internship domain must match the offer letter.",
      );
    }

    // const passwordHash = await bcrypt.hash(data.password, 12);

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Atomically consume the Google onboarding ticket.
    // Only one registration request can successfully consume it.
    const consumedTicket = await OnboardingTicket.findOneAndUpdate(
      {
        jti: onboarding.jti,
        googleSub: onboarding.googleSub,
        email: onboarding.email,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          consumedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!consumedTicket) {
      throw new HttpError(
        401,
        "This Google verification session has expired or has already been used. Sign in again.",
      );
    }

    let user;

    try {
      user = await User.create({
        role: "intern",

        internId: verified.internId,
        name: verified.name,
        email: verified.email,

        googleSub: onboarding.googleSub,

        whatsappNumber: data.whatsappNumber,
        whatsappGroupName: group.name,
        whatsappGroupCode: group.whatsappGroupCode || data.whatsappGroupCode,

        internshipStartDate: offerDate || enteredDate,

        offerIssueDate: verified.issueDate
          ? new Date(verified.issueDate)
          : undefined,

        offerDuration: verified.duration ?? undefined,
        workMode: verified.mode || undefined,
        stipend: verified.stipend ?? undefined,

        offerSent: verified.offerSent === true,

        offerSentStatus:
          verified.offerStatus || (verified.offerSent ? "sent" : undefined),

        offerSentAt: verified.offerSentAt
          ? new Date(verified.offerSentAt)
          : undefined,

        domain: verified.domain || data.domain,

        group: group._id,

        passwordHash,

        registrationComplete: true,

        internCashBalance: 20,

        // Missed attendance starts at zero for a new intern.
        missedAttendanceRecords: [],
        missedAttendanceCount: 0,
      });

      await WalletTransaction.create({
        intern: user._id,
        group: group._id,
        amount: 20,
        type: "welcome_bonus",
        reference: `welcome:${user._id}`,
        description: "Welcome bonus",
        balanceAfter: 20,
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpError(
          409,
          "This intern ID or account has already been registered.",
        );
      }

      throw error;
    }

    res.status(201).json({
      token: issue(user, "google"),
      user: publicUser(user),
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Intern password login                                                      */
/* -------------------------------------------------------------------------- */

router.post(
  "/intern-login",
  asyncHandler(async (req, res) => {
    const { internId, password } = z
      .object({
        internId: z.string().min(5),
        password: z.string().min(1),
      })
      .parse(req.body);

    const user = await User.findOne({
      internId: normalizeId(internId),
    }).select("+passwordHash");

    if (
      !user ||
      user.role !== "intern" ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new HttpError(401, "Invalid intern ID or password.");
    }

    if (user.status !== "active" || !user.registrationComplete) {
      throw new HttpError(403, "This account is not active.");
    }

    // Existing user found

    if (user.role === "admin" && !isAllowedAdmin(user.email)) {
      throw new HttpError(403, "Admin access is not allowed.");
    }

    // Check Google identity mismatch here if your existing code has this check.

    // Prevent incomplete intern accounts from receiving a normal login token
    if (user.role === "intern" && !user.registrationComplete) {
      throw new HttpError(
        403,
        "Your intern registration is incomplete. Please contact support.",
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({
      token: issue(user, "google"),
      user: publicUser(user),
      onboardingRequired: false,
    });

    // user.lastLoginAt = new Date();

    // await user.save();

    // res.json({
    //   token: issue(user, "password"),
    //   user: publicUser(user),
    // });
  }),
);

/* -------------------------------------------------------------------------- */
/* Set password                                                               */
/* -------------------------------------------------------------------------- */

router.post(
  "/set-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { password } = z
      .object({
        password: z.string().min(10),
      })
      .parse(req.body);

    if (req.user.role !== "intern" || !req.user.registrationComplete) {
      throw new HttpError(403, "Only registered interns can set a password.");
    }

    if (req.authMethod !== "google") {
      throw new HttpError(
        403,
        "For password recovery, sign in with your verified Google account first.",
      );
    }

    req.user.passwordHash = await bcrypt.hash(password, 12);

    await req.user.save();

    res.json({
      message:
        "Password updated. You can now sign in with your intern ID and password.",
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Profile update                                                             */
/* -------------------------------------------------------------------------- */

router.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "intern" || !req.user.registrationComplete) {
      throw new HttpError(
        403,
        "Only registered interns can update this profile.",
      );
    }

    const gender = z
      .enum(["Female", "Male", "Non-binary", "Prefer not to say"])
      .parse(req.body.gender);

    req.user.gender = gender;

    await req.user.save();

    res.json({
      message: "Profile updated.",
      user: publicUser(req.user),
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Current authenticated user                                                 */
/* -------------------------------------------------------------------------- */

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      user: publicUser(req.user),
    });
  }),
);

export default router;
