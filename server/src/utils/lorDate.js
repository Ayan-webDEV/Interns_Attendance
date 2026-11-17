const IST_TIME_ZONE = "Asia/Kolkata";

/**
 * Returns the current date in the Asia/Kolkata timezone.
 * Format: 17 November 2026
 */
export function getLORDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Returns a date key in YYYY-MM-DD format using IST.
 */
export function getLORDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
