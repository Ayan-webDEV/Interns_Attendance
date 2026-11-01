const API_URL = (
  import.meta.env.API_URL || "https://interns-attendance.onrender.com/api"
).replace(/\/$/, "");
export const tokenStore = {
  get: () => localStorage.getItem("vlr_token"),
  set: (v) => localStorage.setItem("vlr_token", v),
  clear: () => localStorage.removeItem("vlr_token"),
};
export async function api(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(tokenStore.get()
      ? { Authorization: `Bearer ${tokenStore.get()}` }
      : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body &&
      !(options.body instanceof FormData) &&
      typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });
  const type = res.headers.get("content-type") || "";
  if (!res.ok) {
    const data = type.includes("json")
      ? await res.json().catch(() => ({}))
      : { message: await res.text() };
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  if (type.includes("text/csv")) return res.blob();
  return type.includes("json") ? res.json() : res.text();
}
export function saveBlob(blob, name = "VELOop-export.csv") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
