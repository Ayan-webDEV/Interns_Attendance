# VELoop Rewards — Internship Attendance Portal

A responsive internship attendance portal with a React/Vite client and a Node/Express API backed by MongoDB Atlas. The frontend has been visually redesigned with an evergreen-and-citrus design system, a light editorial workspace, clear status hierarchy, responsive navigation, dedicated CSS Modules and simplified sign-in/onboarding presentation.

## Stack

- Frontend: React 18, Vite, React Router, Tailwind CSS v4, CSS Modules, Lucide icons
- Backend: Node.js 20+, Express.js, Mongoose
- Database: MongoDB Atlas
- Authentication: Google Identity Services for intern onboarding/login, intern ID/password, and separate authorized admin email/password login
- Deployment: Vercel frontend, Render backend

## Local development

### Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Configure at minimum `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `CLIENT_ORIGIN`, and the offer-generator verification settings in `server/.env`. Never commit the real `.env` file.

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Configure `VITE_API_URL` (for example `http://localhost:5000/api`), `VITE_GOOGLE_CLIENT_ID`, and `VITE_BRAND_NAME`. `VITE_` variables are public build-time configuration and must not contain private credentials. Brand name changes are controlled through `VITE_BRAND_NAME`.

## Frontend routes

### Public

- `/login`
- `/register`
- `/policies`

### Intern

- `/intern/dashboard`
- `/intern/attendance`
- `/intern/wallet`
- `/intern/promos`
- `/intern/notification`
- `/intern/account`

### Admin

- `/admin`
- `/admin/groups`
- `/admin/approvals`
- `/admin/interns`
- `/admin/attendance`
- `/admin/wallet`
- `/admin/promos`
- `/admin/notifications`
- `/admin/settings`

Legacy routes (`/dashboard`, `/attendance`, `/wallet`, `/promos`, `/notifications`, `/account`) redirect to their new intern-prefixed equivalents. Admin pages are role-gated in the client; the backend remains responsible for authorization enforcement.

## Offer-letter verification

The backend offer verification service calls the protected endpoint configured by `OFFER_GENERATOR_VERIFY_URL`, defaulting to `https://veloop-offer-generator.onrender.com/api/interns/verify`. Configure the protected endpoint and shared secret in the offer-letter generator before enabling new registrations. The generator should verify intern ID, name and email against its authoritative offer-letter records and return canonical intern details and the offer start date.

## Workflows represented in the API/client

- Google intern onboarding, invite-link group detection, offer-record verification, unique intern ID enforcement, password setup and intern ID/password login
- Separate admin and intern navigation shells
- Group creation/editing, invitation retrieval/reset, group start, transfer workflows, two-distinct-admin completion approvals and CSV archive export
- Attendance schedule settings, minimum session duration, Sunday blocking, session-two eligibility, pending approval queue, bulk approvals, attendance correction and date-range filters
- InternCash history/admin adjustments, group-specific promo codes, random reward ranges, redemption caps and manual expiry
- Group/all-intern notifications with optional links
- Attendance calendar, recent history, bar/line trend switch, loading/skeleton states, toast feedback and policy pages

## Deployment

### Render

Deploy `server/` as a Node web service. Use `npm install` as the build/install command if required and `npm start` as the start command. Configure backend environment variables in Render. Add the exact Vercel origin to `CLIENT_ORIGIN`.

### Vercel

Deploy `client/` as a Vite project. Build command: `npm run build`. Output directory: `dist`. Configure `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, and `VITE_BRAND_NAME`. The `vercel.json` SPA rewrite supports direct navigation to client routes.

## Operational notes

- Frontend restrictions are for usability and deterrence; attendance rules and authorization must be enforced server-side.
- A viewport-width rule is not proof of device identity and can be bypassed by a determined user.
- Download and verify the archive before deleting a completed group.
- Certification workflow remains a placeholder until the programme's issuance requirements are finalized.
- Group completion requires two distinct authorized administrator identities; use separate accounts and strong passwords.
