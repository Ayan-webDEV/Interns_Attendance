import { useMemo } from "react";
import { useAdminData } from "./useAdminData.js";

export function useAdminGroups(token, options = {}) {
  const resource = useAdminData("/groups",token,options);
  const groups = useMemo(()=>resource.data?.groups || [],[resource.data]);
  const activeGroups = useMemo(()=>groups.filter((group)=>group.status!=="completed"),[groups]);
  return {...resource,groups,activeGroups};
}
