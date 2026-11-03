export function formatAdminDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN",{
    day:"2-digit",month:"short",year:"numeric",...options,
  });
}

export function formatAdminDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN",{
    day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",
  });
}

export function formatAdminNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-IN") : "0";
}

export function formatAdminStatus(value) {
  return String(value || "unknown").replaceAll("_"," ");
}

export function toAdminInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0,10);
}
