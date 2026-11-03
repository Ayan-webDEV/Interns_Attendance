import { useMemo } from "react";
import { useAdminData } from "./useAdminData.js";

export function useAdminAttendance(token,{groupId="",from="",to="",status="",sessionNumber="",enabled=true}={}) {
  const params = new URLSearchParams();
  if(groupId) params.set("groupId",groupId);
  if(from) params.set("from",from);
  if(to) params.set("to",to);
  if(status) params.set("status",status);
  if(sessionNumber) params.set("sessionNumber",sessionNumber);
  const path = `/attendance/admin/report${params.toString()?`?${params.toString()}`:""}`;
  const resource = useAdminData(path,token,{enabled,initialData:{records:[]}});
  const records = useMemo(()=>resource.data?.records || [],[resource.data]);
  return {...resource,records};
}
