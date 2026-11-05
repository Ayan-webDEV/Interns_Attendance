// import { HttpError } from '../utils/httpError.js';
// const normalizeId = (value = '') => {
//   let id = String(value).trim().toUpperCase().replace(/[\s_-]+/g, '');
//   if (/^VLRINT2026\d{4}$/.test(id)) id = `VLRINT2026${id.slice(10).padStart(5, '0')}`;
//   return id;
// }
// export { normalizeId };
// export async function verifyOfferRecord({ internId, name, email }) {
//   const url = process.env.OFFER_GENERATOR_VERIFY_URL;
//   const key = process.env.OFFER_GENERATOR_API_KEY;
//   if (!url || !key) throw new HttpError(503, 'Offer-letter verification is not configured yet. Please contact the administrator.');
//   let response;
//   try {
//     response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'X-Integration-Key': key }, body: JSON.stringify({ internId: normalizeId(internId), name: name.trim(), email: email.trim().toLowerCase() }), signal: AbortSignal.timeout(20000) });
//   } catch { throw new HttpError(503, 'Offer-letter verification service is unavailable. Please try again later.'); }
//   if (!response.ok) {
//     if (response.status === 404 || response.status === 422) throw new HttpError(400, 'The intern details could not be verified against an offer-letter record.');
//     throw new HttpError(503, 'Offer-letter verification could not be completed. Please try again later.');
//   }
//   let result;try{result=await response.json()}catch{throw new HttpError(503,'Offer verification service returned an invalid response. Please try again later.')}
//   if (result.verified !== true) throw new HttpError(400, 'The intern ID, name, and email do not match an existing offer-letter record.');
//   if (result.offerSent !== true || (result.offerStatus && result.offerStatus !== 'sent')) throw new HttpError(400, 'A successfully sent offer letter is required before registration.');
//   return { internId: normalizeId(result.internId || internId), name: result.name || name.trim(), email: String(result.email || email).toLowerCase().trim(), startDate: result.startDate || null, domain: result.domain || null, issueDate: result.issueDate || null, duration: result.duration ?? null, mode: result.mode || null, stipend: result.stipend ?? null, offerSent: result.offerSent === true, offerStatus: result.offerStatus || null, offerSentAt: result.offerSentAt || null };
// }

import { HttpError } from "../utils/httpError.js";

/**
 * Canonical registration IDs use VLRINT + nine numeric digits.
 * Older IDs with an eight-digit numeric suffix are accepted and normalized
 * to the current five-digit sequence format for backward compatibility.
 */
export const normalizeId = (value = "") => {
  let id = String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");

  if (!id.startsWith("VLRINT")) {
    id = `VLRINT${id}`;
  }

  const suffix = id.slice("VLRINT".length);

  if (/^\d{8}$/.test(suffix)) {
    return `VLRINT${suffix.slice(0, 4)}${suffix.slice(4).padStart(5, "0")}`;
  }

  return id;
};

const getIntegrationConfig = (lookup = false) => {
  const url = lookup
    ? process.env.OFFER_GENERATOR_LOOKUP_URL ||
      process.env.OFFER_GENERATOR_VERIFY_URL
    : process.env.OFFER_GENERATOR_VERIFY_URL;
  const key = process.env.OFFER_GENERATOR_API_KEY;

  if (!url || !key) {
    throw new HttpError(
      503,
      "Offer-letter verification is not configured yet. Please contact the administrator.",
    );
  }

  return { url, key };
};

async function requestOfferGenerator({ payload, lookup = false }) {
  const { url, key } = getIntegrationConfig(lookup);
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Integration-Key": key,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new HttpError(
      503,
      "Offer-letter verification service is unavailable. Please try again later.",
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new HttpError(
        404,
        "No offer-letter record was found for this Intern ID.",
      );
    }

    if (response.status === 409) {
      throw new HttpError(
        409,
        "This offer-letter record is not eligible for registration.",
      );
    }

    if (response.status === 422) {
      throw new HttpError(
        400,
        "The intern ID, name, or email does not match the official offer-letter record.",
      );
    }

    throw new HttpError(
      503,
      "Offer-letter verification could not be completed. Please try again later.",
    );
  }

  try {
    return await response.json();
  } catch {
    throw new HttpError(
      503,
      "Offer verification service returned an invalid response. Please try again later.",
    );
  }
}

function normalizeOfferResult(result, fallbackInternId) {
  const record = result?.intern || result?.offer || result;

  if (result?.verified !== true) {
    throw new HttpError(
      400,
      "The Intern ID could not be verified against an existing offer-letter record.",
    );
  }

  if (
    record.offerSent !== true ||
    (record.offerStatus && record.offerStatus !== "sent")
  ) {
    throw new HttpError(
      400,
      "A successfully sent offer letter is required before registration.",
    );
  }

  return {
    internId: normalizeId(record.internId || fallbackInternId),
    name: String(record.name || "").trim(),
    email: String(record.email || "")
      .trim()
      .toLowerCase(),
    startDate: record.startDate || null,
    domain: record.domain || record.position || null,
    issueDate: record.issueDate || null,
    duration: record.duration ?? null,
    mode: record.mode || null,
    stipend: record.stipend ?? null,
    offerSent: record.offerSent === true,
    offerStatus: record.offerStatus || "sent",
    offerSentAt: record.offerSentAt || null,
  };
}

/**
 * ID-only lookup used while the intern fills out the registration form.
 * The generator endpoint must allow a protected request containing only
 * { internId } and return the matching offer record.
 */
export async function lookupOfferRecord({ internId }) {
  const normalizedInternId = normalizeId(internId);

  if (!/^VLRINT\d{9}$/.test(normalizedInternId)) {
    throw new HttpError(400, "Enter a valid 9-digit Intern ID after VLRINT.");
  }

  const result = await requestOfferGenerator({
    lookup: true,
    payload: { internId: normalizedInternId },
  });

  const offer = normalizeOfferResult(result, normalizedInternId);

  if (!offer.name || !offer.email || !offer.startDate || !offer.domain) {
    throw new HttpError(
      422,
      "The offer letter is missing the intern name, email, start date, or domain. Please contact the administrator.",
    );
  }

  return offer;
}

/**
 * Final server-side verification performed again during account creation.
 * Never rely only on the values returned by the registration lookup.
 */
export async function verifyOfferRecord({ internId, name, email }) {
  const normalizedInternId = normalizeId(internId);

  const result = await requestOfferGenerator({
    payload: {
      internId: normalizedInternId,
      name: String(name || "").trim(),
      email: String(email || "")
        .trim()
        .toLowerCase(),
    },
  });

  const verified = normalizeOfferResult(result, normalizedInternId);

  if (
    verified.email !==
    String(email || "")
      .trim()
      .toLowerCase()
  ) {
    throw new HttpError(
      400,
      "The Google email must match the email on the offer letter.",
    );
  }

  return verified;
}
