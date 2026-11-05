export class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code || undefined;
    // Messages explicitly created by the API are safe to return to clients,
    // including actionable 503 messages. Unexpected errors remain masked.
    this.expose = true;
  }
}
