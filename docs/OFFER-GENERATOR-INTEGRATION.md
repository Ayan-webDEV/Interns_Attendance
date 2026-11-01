# Offer Letter Generator verification contract

The attendance backend already calls the configured offer-generator endpoint from `server/src/services/offerVerification.js`. Before intern registration can work in production, the offer-generator service must expose:

- **Method:** `POST`
- **Path:** `/api/interns/verify`
- **Request authentication:** `Authorization: Bearer <shared-key>` and `X-Integration-Key: <shared-key>`
- **Request JSON:**

```json
{
  "internId": "VLRINT202601234",
  "name": "Intern Name",
  "email": "verified-google-email@example.com"
}
```

The handler must search the generator's authoritative offer-letter records by canonical intern ID, name and email (case-insensitive email comparison), and only report `verified: true` when the record matches and the offer letter was successfully sent. It should return HTTP 404 or 422 for no matching record, and should never return secrets, password hashes, payment data, or unrelated intern records.

Successful response shape:

```json
{
  "verified": true,
  "internId": "VLRINT202601234",
  "name": "Intern Name",
  "email": "verified-google-email@example.com",
  "startDate": "2026-10-18",
  "domain": "Frontend Development",
  "issueDate": "2026-10-15",
  "duration": "1 month",
  "mode": "Remote",
  "stipend": null,
  "offerSent": true,
  "offerStatus": "sent",
  "offerSentAt": "2026-10-15T12:00:00.000Z"
}
```

Fields other than `verified`, `offerSent`, and the canonical identity values may be null/omitted when unavailable. The attendance backend requires `verified === true` and `offerSent === true`; the verified email must match the Google identity, and the entered start date must match `startDate` when present.

Configure the same long random secret in both services:

- Attendance backend: `OFFER_GENERATOR_API_KEY`
- Offer generator's private server environment: the key used by the verification route

Do not expose this secret in `VITE_` variables or frontend JavaScript. The URL in attendance backend should be `https://veloop-offer-generator.onrender.com/api/interns/verify`.

## Test checklist

1. Valid, sent offer: returns HTTP 200 with `verified: true` and `offerSent: true`.
2. Unknown intern ID: returns HTTP 404 (or 422), without disclosing whether another field matched.
3. Wrong name or email: returns HTTP 404 (or 422).
4. Offer exists but was not sent: returns a non-success response or `offerSent: false`.
5. Missing/wrong integration key: returns HTTP 401/403.
6. Normalize an ID such as `VLRINT2026_1234` to the canonical `VLRINT202601234` before lookup, where applicable.
