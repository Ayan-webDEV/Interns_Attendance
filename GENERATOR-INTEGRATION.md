# Existing offer-letter generator integration

Generator: https://veloop-offer-generator.onrender.com/

The attendance backend sends a server-to-server `POST` request to `OFFER_GENERATOR_VERIFY_URL`. It sends the intern ID, full name, and Google-verified email. The generator must look up the original record created by the offer-letter generator and return a minimal verified response.

## Current endpoint contract

`POST /api/interns/verify`

Headers:

```http
Content-Type: application/json
Authorization: Bearer <shared-random-secret>
X-Integration-Key: <same-shared-random-secret>
```

Request body:

```json
{
  "internId": "VLRINT202601234",
  "name": "Intern Name",
  "email": "intern@example.com"
}
```

Successful response (HTTP 200):

```json
{
  "verified": true,
  "internId": "VLRINT202601234",
  "name": "Intern Name",
  "email": "intern@example.com",
  "startDate": "2026-10-20",
  "domain": "Frontend Development"
}
```

For a missing record or mismatched ID/name/email, return HTTP 404 or 422 and do not disclose which field was found. For a missing/invalid integration secret, return HTTP 401. Never return the full intern list or sensitive fields.

## Current deployed contract (October 2026)

The generator endpoint has been added to the existing `server.cjs` and deployed. It accepts the two authentication headers above and requires `INTERN_VERIFICATION_API_KEY` in the generator environment. The attendance backend uses `OFFER_GENERATOR_API_KEY` with the same secret value.

A successful response may include the following fields, based on what exists in the original MongoDB record:

```json
{
  "verified": true,
  "internId": "VLRINT202601234",
  "name": "Intern Name",
  "email": "intern@example.com",
  "domain": "Frontend Development",
  "startDate": "2026-10-20",
  "issueDate": "2026-10-18",
  "duration": "28 days",
  "mode": "Remote",
  "stipend": "Unpaid",
  "offerSent": true,
  "offerStatus": "sent",
  "offerSentAt": "2026-10-18T12:00:00.000Z"
}
```

Optional values may be `null` when the source record does not contain them. The endpoint only returns success after matching the original intern ID, name and email and confirming that the offer was successfully sent. The attendance adapter stores the returned offer issue date, duration, mode, stipend, send status and send time on the intern profile, as well as the verified email, domain and start date.

The generator intentionally supports both its existing four-digit sequence IDs and the attendance portal's five-digit canonical form. Existing offer records are not renumbered by verification.

