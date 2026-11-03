import { useMemo } from "react";
import { useAdminData } from "./useAdminData.js";

export function useAdminInterns(token,{query="",groupId="",enabled=true}={}) {
  const params = new URLSearchParams();
  if(query.trim()) params.set("q",query.trim());
  if(groupId) params.set("groupId",groupId);
  const path = `/admin/interns${params.toString()?`?${params.toString()}`:""}`;
  const resource = useAdminData(path,token,{enabled,initialData:{interns:[]}});
  const interns = useMemo(()=>resource.data?.interns || [],[resource.data]);
  return {...resource,interns};
}
