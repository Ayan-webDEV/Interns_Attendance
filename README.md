# VELoop Intern Attendance

A React + Vite + CSS Modules frontend and Node.js + Express + MongoDB backend for verified intern registration, group-based attendance, InternCash, group promo codes, admin reports, and dual-admin internship completion.

> **Integration status:** the app is prepared to call a protected offer-letter verification endpoint. That endpoint must be implemented in the existing offer-letter generator before registration can succeed. Verification intentionally fails closed when the service is not configured or unavailable.

## Folder structure

```text
veloop-intern-attendance/
├── README.md
├── DEPLOYMENT.md
├── GENERATOR-INTEGRATION.md
├── client/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── lib/api.js
│       └── styles/global.css
└── server/
    ├── .env.example
    ├── package.json
    └── src/
        ├── index.js
        ├── config/db.js
        ├── middleware/auth.js
        ├── models/
        │   ├── User.js
        │   ├── InternshipGroup.js
        │   ├── Attendance.js
        │   ├── AttendanceSession.js
        │   ├── WalletTransaction.js
        │   └── PromoCode.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── group.routes.js
        │   ├── attendance.routes.js
        │   ├── wallet.routes.js
        │   ├── promo.routes.js
        │   └── admin.routes.js
        ├── services/offerVerification.js
        └── utils/
            ├── asyncHandler.js
            └── httpError.js
```

## Features included

- Google sign-in; first-time onboarding through an invite link; intern ID + password login after registration.
- Offer-letter verification adapter and missing-leading-zero normalization for the `VLRINT2026` + five-digit suffix format.
- Unique intern ID, email and Google identity constraints.
- Admin group creation, WhatsApp group-code validation, revocable/regenerable invite links, start date and group lifecycle.
- Attendance sessions with a server-side minimum wait, Sunday holiday block, one attendance record per intern/day, and attendance reward ledger entry.
- Intern calendar, attendance history, cumulative line chart, wallet history, promo redemption, certification lock/unlock status.
- Admin overview, intern directory, attendance export, group-specific promo codes with reward ranges and redemption caps, wallet ledger.
- Group completion requires two different admin accounts and re-authentication with each admin's password.

## Local development

Requirements: Node.js 20+, npm, a MongoDB Atlas cluster, and a Google OAuth Web client ID.

1. Copy `server/.env.example` to `server/.env` and fill in the values.
2. Copy `client/.env.example` to `client/.env` and fill in the Google client ID and API URL.
3. In one terminal:
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. In another terminal:
   ```bash
   cd client
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173`.
6. Seed an admin using the steps in `DEPLOYMENT.md` before trying admin features.

## Business rules / notes

- InternCash is an in-app ledger only. Spending/redemption of InternCash is intentionally not implemented.
- The welcome bonus is 20 InternCash and attendance awards 1 InternCash per valid attendance day.
- The UI shows an indicative ₹0.50 per InternCash; this is not a withdrawal or cash-out feature.
- The 50-second wait is a minimum page-session wait, not proof of physical presence or work.
- Sundays are blocked according to India Standard Time.
- The stated 28-calendar-day period with four Sundays gives 24 working days, not 26. The current implementation calculates calendar dates and does not hard-code a 26-day cap; define the policy before launch.
- Certification is a status/locked section only; certificate creation is deliberately left for later.
- Ad integration is not included.

## Before production

Read `GENERATOR-INTEGRATION.md` and `DEPLOYMENT.md`. Then test registration, admin access, attendance duplicate handling, timezone behavior, concurrent promo redemption, dual-admin completion, and recovery scenarios using test accounts.


## MongoDB connection troubleshooting

If `npm run seed-admin` fails with an Atlas TLS or server-selection error, follow [MONGODB-ATLAS-FIX.md](./MONGODB-ATLAS-FIX.md). The error must be resolved at the Atlas/network/URI level before the seed can work.


## Admin login (CEO + Marketing)

The login screen has three modes: Google, Intern, and Admin. Admin email/password login calls `POST /api/auth/admin-login`; only accounts with `role: admin`, an active status, and an email included in `ADMIN_EMAILS` can authenticate. Admins can also use Google if the Google email matches the seeded account and is on the allowlist.

Configure two separate passwords in `server/.env`: `SEED_ADMIN_PASSWORD` for the CEO and `SEED_MARKETING_ADMIN_PASSWORD` for the marketing admin. Add both emails to `ADMIN_EMAILS`, then run `npm run seed-admin` once. The seed script configures both accounts and their separate bcrypt password hashes. Never use `pass` as an admin password; use two unique passwords of at least 12 characters. Remove seed passwords from production environment after seeding.

The client has been organized into `components/auth`, `components/ui`, `pages/admin`, `pages/intern`, and `lib`; Tailwind CSS v4 is wired through the Vite plugin and `@import "tailwindcss"`.


## Folder structure

- `client/src/App.jsx` — session and role-based app shell only
- `client/src/components/auth/LoginScreen.jsx` — Google, intern ID/password, admin email/password, and registration UI
- `client/src/components/ui/Primitives.jsx` — reusable brand, field, alert, toast, and statistic components
- `client/src/pages/admin/AdminApp.jsx` — admin dashboard sections
- `client/src/pages/admin/WalletAdmin.jsx` — wallet ledger view
- `client/src/pages/intern/InternApp.jsx` — intern attendance, calendar, wallet, promo redemption, account, certification status
- `client/src/lib/api.js` and `session.js` — API and session helpers
- `server/src/routes/` — API route modules
- `server/src/models/` — MongoDB/Mongoose schemas

## Expanded attendance workflow (October 2026)

- Groups now support editable name, WhatsApp group code, description, planned/actual start date and per-group duration (1–365 days; default 28).
- Invitation tokens are stored as a hash for validation and encrypted for authorized admins to retrieve the current link. Resetting an invitation invalidates the previous link. Set `INVITE_TOKEN_ENCRYPTION_KEY` once in the private server environment before creating new groups and keep it stable; existing pre-upgrade groups without an encrypted token receive a new invitation when an admin first retrieves the link.
- Attendance is requested in two IST windows: first session 09:30–12:30, re-attendance 13:00–15:30. Session 2 is unavailable until session 1 is approved. Requests are pending until an admin approves them. Approval awards +1 IC for session 1 and +3 IC for session 2.
- Admins can approve selected requests or all pending requests for a selected group/session, reject requests with a reason, and correct existing attendance records.
- Notifications can target all interns or one group, with an optional HTTP/HTTPS link.
- Promo codes can be expired immediately by an admin.
- Completed groups can be archived to a cumulative CSV before their live group records are deleted. CSV rows include a record type and a JSON payload so related database fields are preserved. Password hashes and Google identity subjects are intentionally excluded from exports.
- Footer policy panels include Terms & Conditions, Privacy Policy, Refund Policy and Certification Processing Charges. These are operational drafts and should be reviewed for legal compliance before public launch. The portal does not currently collect certification payments.
- Admin defaults to dark theme; interns default to light theme. Preferences are stored separately by role.

### One-time migration for existing attendance data

Before running the upgraded server against a database that already has attendance records, stop the API and run this once:

```bash
cd server
npm run migrate:attendance-sessions
```

This drops the legacy unique index on `(intern, dateKey)`, marks pre-existing attendance records as approved first-session records, and creates the new unique index on `(intern, dateKey, sessionNumber)`. Back up your database before running the migration. Do not run the updated server against the existing database before migration, because the old index prevents two sessions per day.

### Archive and deletion

Second admin completion approval triggers an archive CSV download and stores a cumulative archive snapshot. If browser downloads are blocked, use the group’s **Archive & download** action again. A group can only be deleted after it has an archive snapshot. The archive remains in the `grouparchives` collection after live group records are deleted. Keep database backups and restrict archive access because CSV snapshots contain personal data.
