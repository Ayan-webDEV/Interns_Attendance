# VELoop Intern Attendance System — Expanded workflow release

## Included in this source package

- Persistent, encrypted group invitation links, admin retrieval, and link reset (old tokens are invalidated).
- Group editing for name, WhatsApp code, description, planned/actual start date and duration.
- Per-group duration (1–365 days; default 28) and a calculated end date using the configured date-difference convention. Example: 18 Oct + 28 days = 15 Nov.
- Intern group name and group status visible in the intern portal.
- Group-scoped calendar with Sundays locked, active date range, and a waiting state until the group is started.
- Two attendance sessions, enforced on the server in IST. Defaults: 09:30–12:30 and 13:00–15:30. The minimum wait is configurable.
- Session 2 requires session 1 to be approved. Requests remain pending until admin approval. Session 1 approval awards 1 IC; session 2 approval awards 3 IC.
- Admin queue supports selecting individual/multiple requests, approving selected requests, approving all pending requests for a selected group/session, rejecting with a reason, and correcting existing records with wallet adjustments where possible.
- Bar and line charts; intern and admin date-range reporting filters; automatic group filter refresh.
- Group member counts, group details, transfer intern to another group, and transfer audit entries.
- Promo codes can be expired immediately by an admin.
- Admin-to-intern notifications for all groups or a selected group, with an optional validated HTTP/HTTPS link.
- Admin dark theme and intern light theme by default, saved independently; responsive layouts, skeletons, action overlays, animated refresh controls and toast messages.
- Footer policy panels for Terms & Conditions, Privacy, Refunds and Certification Processing Charges. These are draft operational policies and should receive legal review. The portal does not currently process payments.
- Completed group archive: stores a cumulative snapshot and automatically downloads an updated CSV after second-admin completion approval. CSV rows include a record type and a JSON payload for lossless fields. Password hashes and Google subject identifiers are deliberately excluded. Live group data can only be deleted after an archive has been created; the archive snapshot remains stored.
- Offer-letter integration adapter now maps issue date, duration, work mode, stipend and offer-sent fields returned by the deployed generator API.

## Important migration step for an existing database

**Back up MongoDB first.** The old attendance schema allowed one attendance row per intern/day. The new schema allows two sessions per day. Stop the attendance API and run this one-time migration against the existing database before starting the updated server:

```bash
cd server
npm run migrate:attendance-sessions
```

The migration drops the old unique `(intern, dateKey)` index, normalizes legacy attendance rows as approved session 1 records, and creates the new unique `(intern, dateKey, sessionNumber)` index. Do not skip this step on an existing database.

## Local setup

1. Keep your existing private `server/.env` out of the ZIP/Git. Use `server/.env.example` as a reference.
2. Set a stable `INVITE_TOKEN_ENCRYPTION_KEY` in the private server environment before creating new groups. Keep this value unchanged so saved invitation links remain decryptable.
3. Keep `OFFER_GENERATOR_VERIFY_URL` pointing at the deployed `/api/interns/verify` endpoint and make `OFFER_GENERATOR_API_KEY` exactly match the generator's `INTERN_VERIFICATION_API_KEY`.
4. Install backend dependencies: `cd server && npm install`.
5. Run the migration once if using an existing database, then `npm run dev`.
6. In a separate terminal, `cd client && npm install && npm run dev`.
7. Configure the frontend's `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` as in `client/.env.example`.

## Validation performed for this package

- All backend JavaScript files passed `node --check`.
- All frontend JavaScript/JSX files passed a TypeScript parser syntax check.
- All relative source imports resolve to files in this package.
- A full Vite production build and live MongoDB end-to-end tests were not run here because npm dependencies could not be downloaded in the build environment. Run `npm run build` in `client` after installing dependencies, then test against a backed-up/staging database before production deployment.
