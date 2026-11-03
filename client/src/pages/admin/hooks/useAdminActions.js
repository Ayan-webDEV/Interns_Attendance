import { useCallback, useState } from "react";

/** Standard action state for admin mutations and their full-screen loader label. */
export function useAdminActions({ notify } = {}) {
  const [busyLabel,setBusyLabel] = useState("");
  const [error,setError] = useState("");

  const run = useCallback(async(label,action) => {
    setBusyLabel(label || "Updating admin workspace…");
    setError("");
    try {
      return await action();
    } catch (err) {
      const message = err?.message || "The action could not be completed.";
      setError(message);
      notify?.(message);
      throw err;
    } finally {
      setBusyLabel("");
    }
  },[notify]);

  return { busy: Boolean(busyLabel),busyLabel,error,run,setError };
}
