# Accounts, environment variables and deployment

## Accounts you need

1. **MongoDB Atlas** — create a project and cluster, create a database user, allow access from Render (prefer a restricted IP/network policy where feasible), and copy the application connection string. Database name can be `veloop_attendance`.
2. **Google Cloud Console** — create/select a project, configure the OAuth consent screen, create an OAuth Client ID of type Web application, add `http://localhost:5173` to authorized JavaScript origins for local development, and add your production Vercel domain. Copy the client ID to both frontend and backend environments. The backend verifies Google ID tokens; the client ID is not a secret.
3. **GitHub** — create a private repository for this source and push the project.
4. **Vercel** — import the repository and set the project Root Directory to `client`.
5. **Render** — create a Web Service from the same repository and set Root Directory to `server`.
6. **Existing offer-letter generator on Render** — add the protected verification endpoint described in `GENERATOR-INTEGRATION.md` before testing new intern registration.

## Server environment (`server/.env` locally; Render environment in production)

Copy `server/.env.example` and set:

- `NODE_ENV`: `development` locally, `production` on Render.
- `PORT`: `5000` locally; Render provides a port automatically.
- `CLIENT_ORIGIN`: exact frontend origin; production can be your Vercel domain. Multiple origins can be comma-separated.
- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: long random secret, at least 32 characters. Generate a unique one for this application.
- `JWT_EXPIRES_IN`: for example `7d`.
- `GOOGLE_CLIENT_ID`: Google OAuth Web client ID.
- `ADMIN_EMAILS`: comma-separated allow-list for admin seeding. Keep only CEO and authorized admin addresses.
- `OFFER_GENERATOR_VERIFY_URL`: final generator API URL, e.g. `https://veloop-offer-generator.onrender.com/api/interns/verify` after that endpoint exists.
- `OFFER_GENERATOR_API_KEY`: shared server-to-server secret; must match `ATTENDANCE_INTEGRATION_KEY` in the generator service.
- `ATTENDANCE_MIN_SECONDS`: `50`.
- `INTERN_CASH_TO_INR`: display-only conversion, currently `0.5`.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD`: use temporarily when running the seed script. Remove the seed password after use.

Never add server secrets to `client/.env`, GitHub, or Vercel frontend environment variables.

## Client environment (`client/.env` locally; Vercel Environment Variables in production)

- `VITE_API_URL`: local `http://localhost:5000/api`; production `https://YOUR-RENDER-SERVICE.onrender.com/api`.
- `VITE_GOOGLE_CLIENT_ID`: same Google OAuth Web client ID.

Anything prefixed `VITE_` is included in the public frontend bundle. Never put MongoDB credentials, JWT secrets, or generator API keys here.

## First local setup

Terminal 1:

```bash
cd server
cp .env.example .env
# Edit server/.env
npm install
npm run dev
```

Terminal 2:

```bash
cd client
cp .env.example .env
# Edit client/.env
npm install
npm run dev
```

Create the first admin by temporarily filling `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, and `SEED_ADMIN_PASSWORD` in `server/.env`, and making sure that email is in `ADMIN_EMAILS`. Then run:

```bash
cd server
npm run seed-admin
```

Remove the seed password from the environment after seeding. Repeat with the marketing admin's email/password to create the second admin. Use different accounts and passwords. Each admin should sign in with Google using the same email as their seeded admin account; then the Google identity is linked to that account. The password is used for re-authentication on the two-step group completion flow.

## Vercel

- Root Directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` to Production/Preview as appropriate.
- Add your Vercel domain to Google OAuth authorized JavaScript origins.

## Render

- Root Directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Add all server environment variables from above, excluding the `VITE_` variables.
- Add your Vercel frontend origin to `CLIENT_ORIGIN`.
- Add the Render API origin to the Google OAuth authorized JavaScript origins only if your OAuth setup requires it; the frontend domain is the key JavaScript origin.

## Suggested release order

1. Test backend health at `/api/health`.
2. Seed both admin accounts.
3. Test Google login for both admins.
4. Create a group and copy its invitation link.
5. Implement and test the offer-letter verification endpoint.
6. Test one intern's onboarding against a real test offer-letter record.
7. Test duplicate intern-ID rejection, group assignment, Sunday block, 50-second wait, attendance reward, promo redemption cap, and dual-admin completion.
8. Deploy production only after the above checks pass.


## Seed both admin accounts

Set these variables in `server/.env` before running the seed script locally:

- `ADMIN_EMAILS=ceo@ve.in,marketing@ve.in`
- `SEED_ADMIN_EMAIL=ceo@ve.in`
- `SEED_ADMIN_NAME=VELoop CEO`
- `SEED_ADMIN_PASSWORD=<unique CEO password, at least 12 chars>`
- `SEED_MARKETING_ADMIN_EMAIL=marketing@ve.in`
- `SEED_MARKETING_ADMIN_NAME=VELoop Marketing Admin`
- `SEED_MARKETING_ADMIN_PASSWORD=<different unique marketing password, at least 12 chars>`

Run `npm run seed-admin` from `server/`. This updates/creates both admin users and stores bcrypt hashes. Do not commit `.env`; remove seed password variables from production after seeding.

## Before deploying the two-session attendance upgrade

1. Back up the MongoDB database.
2. Stop the attendance API and run `cd server && npm run migrate:attendance-sessions` once. This migrates legacy attendance rows and replaces the old unique `(intern, dateKey)` index with `(intern, dateKey, sessionNumber)` so each intern can have two separate sessions per day.
3. Confirm the migration succeeds before starting the updated API. Do not start the updated API against the old unique index.
4. Ensure the offer-generator Render service has `INTERN_VERIFICATION_API_KEY` and the attendance service has `OFFER_GENERATOR_API_KEY` with exactly the same strong secret. Keep both server-only.
5. Set the attendance service's `OFFER_GENERATOR_VERIFY_URL` to the deployed `https://veloop-offer-generator.onrender.com/api/interns/verify` endpoint.
6. Set `CLIENT_ORIGIN` to the exact Vercel frontend origin(s), separated by commas if needed. Set `VITE_API_URL` in the Vercel build environment to the deployed attendance API base URL ending in `/api`.
7. Run the local UI/build checks before production rollout. The source package does not include private `.env` files or `node_modules`.
