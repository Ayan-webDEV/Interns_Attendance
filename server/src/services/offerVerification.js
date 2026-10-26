import { HttpError } from '../utils/httpError.js';
const normalizeId = (value = '') => {
  let id = String(value).trim().toUpperCase().replace(/[\s_-]+/g, '');
  if (/^VLRINT2026\d{4}$/.test(id)) id = `VLRINT2026${id.slice(10).padStart(5, '0')}`;
  return id;
}
export { normalizeId };
export async function verifyOfferRecord({ internId, name, email }) {
  const url = process.env.OFFER_GENERATOR_VERIFY_URL;
  const key = process.env.OFFER_GENERATOR_API_KEY;
  if (!url || !key) throw new HttpError(503, 'Offer-letter verification is not configured yet. Please contact the administrator.');
  let response;
  try {
    response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'X-Integration-Key': key }, body: JSON.stringify({ internId: normalizeId(internId), name: name.trim(), email: email.trim().toLowerCase() }), signal: AbortSignal.timeout(20000) });
  } catch { throw new HttpError(503, 'Offer-letter verification service is unavailable. Please try again later.'); }
  if (!response.ok) {
    if (response.status === 404 || response.status === 422) throw new HttpError(400, 'The intern details could not be verified against an offer-letter record.');
    throw new HttpError(503, 'Offer-letter verification could not be completed. Please try again later.');
  }
  let result;try{result=await response.json()}catch{throw new HttpError(503,'Offer verification service returned an invalid response. Please try again later.')}
  if (result.verified !== true) throw new HttpError(400, 'The intern ID, name, and email do not match an existing offer-letter record.');
  if (result.offerSent !== true || (result.offerStatus && result.offerStatus !== 'sent')) throw new HttpError(400, 'A successfully sent offer letter is required before registration.');
  return { internId: normalizeId(result.internId || internId), name: result.name || name.trim(), email: String(result.email || email).toLowerCase().trim(), startDate: result.startDate || null, domain: result.domain || null, issueDate: result.issueDate || null, duration: result.duration ?? null, mode: result.mode || null, stipend: result.stipend ?? null, offerSent: result.offerSent === true, offerStatus: result.offerStatus || null, offerSentAt: result.offerSentAt || null };
}
