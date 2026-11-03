import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api.js";

/**
 * Small reusable authenticated resource hook for admin subpages.
 * Keep server mutations in page actions; this hook only owns read state.
 */
export function useAdminData(path, token, { enabled = true, initialData = [] } = {}) {
  const [data,setData] = useState(initialData);
  const [loading,setLoading] = useState(Boolean(enabled));
  const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!enabled || !token) return;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const result = await api(path,{token});
      setData(result);
      setError("");
      return result;
    } catch (err) {
      setError(err?.message || "Unable to load admin data.");
      throw err;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },[path,token,enabled]);

  useEffect(() => {
    if (!enabled || !token) { setLoading(false); return undefined; }
    refresh().catch(() => {});
    return undefined;
  },[refresh,enabled,token]);

  return { data,setData,loading,refreshing,error,refresh };
}
