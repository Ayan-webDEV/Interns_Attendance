// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import {
//   Plus,
//   Search,
//   RefreshCw,
//   Copy,
//   Play,
//   CheckCircle2,
//   Download,
//   Users,
//   CalendarDays,
//   Wallet,
//   TicketPercent,
//   Bell,
//   Settings,
//   Edit3,
//   Link as LinkIcon,
//   Power,
//   ArrowUpRight,
//   Filter,
//   Save,
//   Trash2,
//   ShieldCheck,
//   UserRound,
//   Clock3,
//   Check,
//   AlertTriangle,
// } from "lucide-react";
// import { api, saveBlob } from "../../api/client";
// import { useToast } from "../../components/Toast/Toast";
// import Loader from "../../components/Loader/Loader";
// import StatCard from "../../components/StatCard/StatCard";
// import styles from "./Manage.module.css";
// import Account from "../Account/Account";
// import Notifications from "../Notifications/Notifications";
// import Promos from "../Promos/Promos";
// import RewardsPage from "../RewardsPage/RewardsPage";
// import CertificatePage from "../Certificate/CertificatePage";

// const blankGroup = {
//   name: "",
//   description: "",
//   whatsappGroupCode: "",
//   plannedStartDate: "",
//   durationDays: 28,
// };
// export default function Manage({ user }) {
//   const loc = useLocation();
//   const toast = useToast();
//   const rawPath = loc.pathname;
//   const normalizedPath = rawPath.startsWith("/intern/")
//     ? rawPath.replace("/intern", "")
//     : rawPath;
//   const path =
//     normalizedPath === "/notification" ? "/notifications" : normalizedPath;
//   const [data, setData] = useState([]),
//     [groups, setGroups] = useState([]),
//     [loading, setLoading] = useState(true),
//     [busy, setBusy] = useState(false),
//     [search, setSearch] = useState(""),
//     [groupFilter, setGroupFilter] = useState(""),
//     [from, setFrom] = useState(""),
//     [to, setTo] = useState(""),
//     [sessionFilter, setSessionFilter] = useState(""),
//     [selected, setSelected] = useState([]),
//     [form, setForm] = useState(blankGroup),
//     [editing, setEditing] = useState(null),
//     [modal, setModal] = useState(""),
//     [target, setTarget] = useState(null),
//     [inviteUrl, setInviteUrl] = useState(""),
//     [groupInterns, setGroupInterns] = useState([]),
//     [extra, setExtra] = useState({}),
//     [settings, setSettings] = useState({
//       firstStart: "09:30",
//       firstEnd: "12:30",
//       secondStart: "13:00",
//       secondEnd: "15:30",
//       minimumSeconds: 50,
//       onlyDesktopAccess: true,
//     }),
//     [message, setMessage] = useState({
//       title: "",
//       message: "",
//       link: "",
//       targetGroupId: "all",
//     }),
//     [promo, setPromo] = useState({
//       groupId: "",
//       code: "",
//       minReward: 1,
//       maxReward: 10,
//       maxRedemptions: 30,
//       expiresAt: "",
//     }),
//     [adjust, setAdjust] = useState({ internId: "", amount: 1, reason: "" }),
//     [correction, setCorrection] = useState({
//       internId: "",
//       date: "",
//       status: "admin_corrected_present",
//       reason: "",
//       sessionNumber: 1,
//     });
//   const admin = path.startsWith("/admin");
//   const title = useMemo(
//     () =>
//       ({
//         groups: "Internship groups",
//         interns: "Intern directory",
//         approvals: "Attendance approvals",
//         attendance: "Attendance records",
//         wallet: "InternCash ledger",
//         promos: "Promo codes",
//         notifications: "Notifications",
//         settings: "Portal settings",
//         account: "My account",
//         policies: "Policies & help",
//       })[path.split("/").filter(Boolean).pop()] || "Workspace",
//     [path],
//   );
//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const gr = await api("/groups");
//       setGroups(gr.groups || []);
//       let endpoint = "";
//       if (path === "/admin/groups") endpoint = "/groups";
//       else if (path === "/admin/interns")
//         endpoint = `/admin/interns?q=${encodeURIComponent(search)}${groupFilter ? `&groupId=${groupFilter}` : ""}`;
//       else if (path === "/admin/approvals")
//         endpoint = `/attendance/admin/approvals${groupFilter ? `?groupId=${groupFilter}` : ""}`;
//       else if (path === "/admin/attendance")
//         endpoint = `/attendance/admin/report?${new URLSearchParams({ ...(groupFilter ? { groupId: groupFilter } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(sessionFilter ? { sessionNumber: sessionFilter } : {}) })}`;
//       else if (path === "/admin/wallet")
//         endpoint = `/wallet/admin/transactions${groupFilter ? `?groupId=${groupFilter}` : ""}`;
//       else if (path === "/admin/promos") endpoint = "/promo-codes";
//       else if (path === "/admin/notifications") endpoint = "/notifications";
//       else if (path === "/admin/settings") {
//         const [p, a] = await Promise.all([
//           api("/admin/settings/portal-access"),
//           api("/admin/settings/attendance"),
//         ]);
//         setSettings({ ...p.settings, ...a.settings });
//         setData([]);
//         return;
//       } else if (path === "/wallet") endpoint = "/wallet/mine";
//       else if (path === "/promos") endpoint = "/notifications/mine";
//       else if (path === "/notifications") endpoint = "/notifications/mine";
//       else if (path === "/account") endpoint = "/auth/me";
//       else endpoint = "/wallet/mine";
//       const res = await api(endpoint);
//       const arr =
//         res.groups ||
//         res.interns ||
//         res.records ||
//         res.transactions ||
//         res.codes ||
//         res.notifications ||
//         [];
//       setData(Array.isArray(arr) ? arr : []);
//       if (path === "/wallet") setExtra(res);
//       if (path === "/account") setExtra(res.user || {});
//       if (path === "/promos") setExtra(res);
//     } catch (e) {
//       toast(e.message, "error");
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [path, search, groupFilter, from, to, sessionFilter]);
//   useEffect(() => {
//     load();
//   }, [load]);
//   const run = async (fn, success) => {
//     setBusy(true);
//     try {
//       await fn();
//       toast(success || "Changes saved.");
//       setModal("");
//       await load();
//     } catch (e) {
//       toast(e.message, "error");
//     } finally {
//       setBusy(false);
//     }
//   };
//   const openGroup = (g = null) => {
//     setEditing(g ? g._id : null);
//     setForm(
//       g
//         ? {
//             name: g.name || "",
//             description: g.description || "",
//             whatsappGroupCode: g.whatsappGroupCode || "",
//             plannedStartDate: (g.plannedStartDate || "").slice(0, 10),
//             actualStartDate: (g.actualStartDate || "").slice(0, 10),
//             durationDays: g.durationDays || 28,
//           }
//         : blankGroup,
//     );
//     setModal("group");
//   };
//   const groupAction = async (action, g) => {
//     if (action === "invite") {
//       await run(async () => {
//         const x = await api(`/groups/${g._id}/invite`);
//         const url = `${location.origin}/login?invite=${encodeURIComponent(x.inviteToken)}`;
//         setInviteUrl(url);
//         setTarget(g);
//       }, "Invitation link ready.");
//       setModal("invite");
//       return;
//     }
//     if (action === "reset") {
//       if (
//         !confirm(
//           `Reset the invitation for ${g.name}? The previous link will stop working.`,
//         )
//       )
//         return;
//       await run(async () => {
//         const x = await api(`/groups/${g._id}/regenerate-invite`, {
//           method: "POST",
//           body: {},
//         });
//         setInviteUrl(
//           `${location.origin}/login?invite=${encodeURIComponent(x.inviteToken)}`,
//         );
//         setTarget(g);
//       }, "New invitation link generated.");
//       setModal("invite");
//       return;
//     }
//     if (action === "start") {
//       const date = prompt(
//         "Internship start date (YYYY-MM-DD)",
//         g.plannedStartDate?.slice(0, 10) ||
//           new Date().toISOString().slice(0, 10),
//       );
//       if (!date) return;
//       await run(
//         () =>
//           api(`/groups/${g._id}/start`, {
//             method: "POST",
//             body: { actualStartDate: date },
//           }),
//         "Internship started.",
//       );
//       return;
//     }
//     if (action === "complete") {
//       const password = prompt(
//         "Enter your admin password to record the first completion approval:",
//       );
//       if (password === null) return;
//       await run(
//         () =>
//           api(`/groups/${g._id}/request-completion`, {
//             method: "POST",
//             body: { password },
//           }),
//         "First approval recorded. A different admin must approve completion.",
//       );
//       return;
//     }
//     if (action === "approveComplete") {
//       const password = prompt(
//         "Enter your admin password to provide the second approval:",
//       );
//       if (password === null) return;
//       await run(async () => {
//         await api(`/groups/${g._id}/approve-completion`, {
//           method: "POST",
//           body: { password },
//         });
//         const blob = await api(`/groups/${g._id}/archive`, {
//           method: "POST",
//           body: {},
//         });
//         saveBlob(
//           blob,
//           `VELOop-Complete-Archive-Latest-${new Date().toISOString().slice(0, 10)}.csv`,
//         );
//       }, "Group completed and the cumulative CSV archive was downloaded.");
//       return;
//     }
//     if (action === "export") {
//       await run(async () => {
//         const blob = await api(`/groups/${g._id}/archive`, {
//           method: "POST",
//           body: {},
//         });
//         saveBlob(
//           blob,
//           `VELOop-Complete-Archive-Latest-${new Date().toISOString().slice(0, 10)}.csv`,
//         );
//       }, "Archive exported.");
//       return;
//     }
//     if (action === "delete") {
//       if (
//         !confirm(
//           "Permanently delete this completed group and its live records? Ensure the CSV archive has been downloaded first.",
//         )
//       )
//         return;
//       await run(
//         () => api(`/groups/${g._id}`, { method: "DELETE" }),
//         "Group deleted after archive verification.",
//       );
//     }
//   };
//   const submitGroup = (e) => {
//     e.preventDefault();
//     run(
//       async () => {
//         if (editing)
//           await api(`/groups/${editing}`, { method: "PATCH", body: form });
//         else await api("/groups", { method: "POST", body: form });
//       },
//       editing ? "Group details updated." : "Group created.",
//     );
//   };
//   const approve = async (all = false) =>
//     run(
//       () =>
//         api("/attendance/admin/approvals/approve", {
//           method: "POST",
//           body: all
//             ? {
//                 groupId: groupFilter,
//                 sessionNumber: sessionFilter || undefined,
//                 approveAll: true,
//               }
//             : { attendanceIds: selected },
//         }),
//       all ? "All pending requests approved." : "Selected requests approved.",
//     );
//   const submitPromo = (e) => {
//     e.preventDefault();
//     run(
//       () => api("/promo-codes", { method: "POST", body: promo }),
//       "Promo code created.",
//     );
//   };
//   const submitNotice = (e) => {
//     e.preventDefault();
//     run(
//       () => api("/notifications", { method: "POST", body: message }),
//       "Notification sent.",
//     );
//   };
//   const groupName = (x) =>
//     x?.group?.name || groups.find((g) => g._id === x?.group)?.name || "—";
//   const date = (v) =>
//     v
//       ? new Date(v).toLocaleDateString("en-IN", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })
//       : "—";
//   if (loading)
//     return (
//       <Loader label={`Loading ${title.toLowerCase()}…`} full={false}>
//         {" "}
//       </Loader>
//     );
//   if (path === "/admin/groups")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Create groups, manage invitation links, and control the internship lifecycle."
//           action={
//             <button className={styles.primary} onClick={() => openGroup()}>
//               <Plus size={16} /> Create group
//             </button>
//           }
//         />
//         <div className={styles.filters}>
//           <div className={styles.search}>
//             <Search size={16} />
//             <input
//               placeholder="Search groups"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <button className={styles.ghost} onClick={load}>
//             <RefreshCw size={15} /> Refresh
//           </button>
//         </div>
//         <div className={styles.groupGrid}>
//           {groups
//             .filter((g) => g.name?.toLowerCase().includes(search.toLowerCase()))
//             .map((g) => (
//               <article className={styles.groupCard} key={g._id}>
//                 <div className={styles.groupCardTop}>
//                   <div className={styles.glyph}>
//                     <Users size={19} />
//                   </div>
//                   <span
//                     className={`${styles.status} ${g.status === "active" ? styles.statusActive : ""}`}
//                   >
//                     {String(g.status || "registration").replace("_", " ")}
//                   </span>
//                 </div>
//                 <h3>{g.name}</h3>
//                 <p>{g.description || "No group description added yet."}</p>
//                 <div className={styles.groupMetrics}>
//                   <div>
//                     <small>Interns</small>
//                     <b>{g.internCount || 0}</b>
//                   </div>
//                   <div>
//                     <small>Duration</small>
//                     <b>{g.durationDays || 28} days</b>
//                   </div>
//                   <div>
//                     <small>Start date</small>
//                     <b>{date(g.actualStartDate || g.plannedStartDate)}</b>
//                   </div>
//                 </div>
//                 <div className={styles.cardActions}>
//                   <button
//                     onClick={async () => {
//                       setTarget(g);
//                       setGroupInterns([]);
//                       setModal("details");
//                       try {
//                         const r = await api(`/groups/${g._id}/interns`);
//                         setGroupInterns(r.interns || []);
//                       } catch (e) {
//                         toast(e.message, "error");
//                       }
//                     }}
//                   >
//                     <Users size={14} /> Details
//                   </button>
//                   <button onClick={() => groupAction("invite", g)}>
//                     <LinkIcon size={14} /> Get link
//                   </button>
//                   <button onClick={() => openGroup(g)}>
//                     <Edit3 size={14} /> Edit
//                   </button>
//                   <button onClick={() => groupAction("reset", g)}>
//                     <RefreshCw size={14} /> Reset link
//                   </button>
//                   {g.status === "registration" && (
//                     <button
//                       className={styles.greenBtn}
//                       onClick={() => groupAction("start", g)}
//                     >
//                       <Play size={14} /> Start internship
//                     </button>
//                   )}
//                   {g.status === "active" && (
//                     <button
//                       className={styles.amberBtn}
//                       onClick={() => groupAction("complete", g)}
//                     >
//                       <CheckCircle2 size={14} /> Complete group
//                     </button>
//                   )}
//                   {g.status === "completion_pending" && (
//                     <button
//                       className={styles.greenBtn}
//                       onClick={() => groupAction("approveComplete", g)}
//                     >
//                       <ShieldCheck size={14} /> Second approval
//                     </button>
//                   )}
//                   {g.status === "completed" && (
//                     <>
//                       <button onClick={() => groupAction("export", g)}>
//                         <Download size={14} /> Export full CSV
//                       </button>
//                       <button
//                         className={styles.dangerBtn}
//                         onClick={() => groupAction("delete", g)}
//                       >
//                         <Trash2 size={14} /> Delete group
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </article>
//             ))}
//         </div>
//         {groups.length === 0 && (
//           <Empty text="No groups yet. Create your first group to generate a secure registration link." />
//         )}
//         {modal === "group" && (
//           <Modal
//             title={editing ? "Edit group details" : "Create internship group"}
//             close={() => setModal("")}
//           >
//             <form className={styles.formGrid} onSubmit={submitGroup}>
//               <label>
//                 Group name
//                 <input
//                   value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                   required
//                   minLength={3}
//                   placeholder="VELoop Rewards Internship — Group 01"
//                 />
//               </label>
//               <label>
//                 WhatsApp group code
//                 <input
//                   value={form.whatsappGroupCode}
//                   onChange={(e) =>
//                     setForm({ ...form, whatsappGroupCode: e.target.value })
//                   }
//                   required
//                   placeholder="Code from group description"
//                 />
//               </label>
//               <label>
//                 {editing &&
//                 groups.find((g) => g._id === editing)?.status === "active"
//                   ? "Actual start date"
//                   : "Planned start date"}
//                 <input
//                   type="date"
//                   value={
//                     editing &&
//                     groups.find((g) => g._id === editing)?.status === "active"
//                       ? form.actualStartDate || ""
//                       : form.plannedStartDate
//                   }
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       [editing &&
//                       groups.find((g) => g._id === editing)?.status === "active"
//                         ? "actualStartDate"
//                         : "plannedStartDate"]: e.target.value,
//                     })
//                   }
//                 />
//               </label>
//               <label>
//                 Internship duration (days)
//                 <input
//                   type="number"
//                   min="1"
//                   max="365"
//                   value={form.durationDays}
//                   onChange={(e) =>
//                     setForm({ ...form, durationDays: Number(e.target.value) })
//                   }
//                   required
//                 />
//               </label>
//               <label className={styles.full}>
//                 Group description
//                 <textarea
//                   rows="3"
//                   value={form.description}
//                   onChange={(e) =>
//                     setForm({ ...form, description: e.target.value })
//                   }
//                   placeholder="Internal notes or group instructions"
//                 />
//               </label>
//               <div className={styles.modalActions}>
//                 <button
//                   type="button"
//                   className={styles.ghost}
//                   onClick={() => setModal("")}
//                 >
//                   Cancel
//                 </button>
//                 <button className={styles.primary} disabled={busy}>
//                   <Save size={15} />
//                   {busy ? "Saving…" : "Save group"}
//                 </button>
//               </div>
//             </form>
//           </Modal>
//         )}
//         {modal === "invite" && (
//           <Modal title="Group registration link" close={() => setModal("")}>
//             <p className={styles.modalSub}>
//               Share this unique link with interns in <b>{target?.name}</b>.
//               Resetting the link invalidates the previous invitation.
//             </p>
//             <div className={styles.copyField}>
//               <input readOnly value={inviteUrl} />
//               <button
//                 onClick={() => {
//                   navigator.clipboard.writeText(inviteUrl);
//                   toast("Invitation link copied.");
//                 }}
//               >
//                 <Copy size={15} /> Copy
//               </button>
//             </div>
//           </Modal>
//         )}
//         {modal === "details" && (
//           <Modal
//             title={target?.name || "Group details"}
//             close={() => setModal("")}
//           >
//             <div className={styles.detailsGrid}>
//               <div>
//                 <small>Current status</small>
//                 <b>{target?.status}</b>
//               </div>
//               <div>
//                 <small>Intern count</small>
//                 <b>{target?.internCount || 0}</b>
//               </div>
//               <div>
//                 <small>Duration</small>
//                 <b>{target?.durationDays || 28} days</b>
//               </div>
//               <div>
//                 <small>Start date</small>
//                 <b>
//                   {date(target?.actualStartDate || target?.plannedStartDate)}
//                 </b>
//               </div>
//             </div>
//             <h3 style={{ fontSize: 12, margin: "20px 0 8px" }}>
//               Interns in this group ({groupInterns.length})
//             </h3>
//             <div className={styles.tableWrap} style={{ marginBottom: 14 }}>
//               <table style={{ minWidth: 420 }}>
//                 <thead>
//                   <tr>
//                     <th>Intern</th>
//                     <th>Intern ID</th>
//                     <th>Domain</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {groupInterns.map((i) => (
//                     <tr key={i._id}>
//                       <td>
//                         <b>{i.name}</b>
//                         <small>{i.email}</small>
//                       </td>
//                       <td className={styles.code}>{i.internId}</td>
//                       <td>{i.domain || "—"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               {!groupInterns.length && (
//                 <div
//                   style={{ padding: 15, fontSize: 10, color: "var(--muted)" }}
//                 >
//                   Loading group interns or no interns have joined yet.
//                 </div>
//               )}
//             </div>
//             <button
//               className={styles.primary}
//               onClick={() => {
//                 setModal("");
//                 location.href = "/admin/interns?groupId=" + target?._id;
//               }}
//             >
//               View intern directory <ArrowUpRight size={15} />
//             </button>
//           </Modal>
//         )}
//       </div>
//     );
//   if (path === "/admin/approvals")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Review attendance requests before they count toward attendance and rewards."
//           action={
//             <button className={styles.ghost} onClick={load}>
//               <RefreshCw size={15} /> Refresh
//             </button>
//           }
//         />
//         <div className={styles.filters}>
//           <Select
//             label="Group"
//             value={groupFilter}
//             onChange={setGroupFilter}
//             options={groups.map((g) => ({ label: g.name, value: g._id }))}
//           />
//           <Select
//             label="Session"
//             value={sessionFilter}
//             onChange={setSessionFilter}
//             options={[
//               { label: "Session 1", value: "1" },
//               { label: "Session 2", value: "2" },
//             ]}
//           />
//           <span className={styles.count}>{data.length} pending requests</span>
//           <button
//             className={styles.primary}
//             disabled={!groupFilter || !data.length || busy}
//             onClick={() => approve(true)}
//           >
//             <CheckCircle2 size={15} /> Approve all in group
//           </button>
//         </div>
//         <DataTable
//           headers={[
//             "Select",
//             "Intern",
//             "Group",
//             "Date",
//             "Session",
//             "Requested",
//             "Status",
//           ]}
//           rows={data.map((r) => (
//             <tr key={r._id}>
//               <td>
//                 <input
//                   type="checkbox"
//                   checked={selected.includes(r._id)}
//                   onChange={(e) =>
//                     setSelected((p) =>
//                       e.target.checked
//                         ? [...p, r._id]
//                         : p.filter((x) => x !== r._id),
//                     )
//                   }
//                 />
//               </td>
//               <td>
//                 <b>{r.intern?.name || "Unknown intern"}</b>
//                 <small>
//                   {r.intern?.internId} · {r.intern?.email}
//                 </small>
//               </td>
//               <td>{r.group?.name || "—"}</td>
//               <td>{r.dateKey}</td>
//               <td>Session {r.sessionNumber}</td>
//               <td>{date(r.markedAt || r.createdAt)}</td>
//               <td>
//                 <span className={styles.statusPending}>Pending</span>
//               </td>
//             </tr>
//           ))}
//         />
//         {data.length > 0 && (
//           <div className={styles.bottomActions}>
//             <span>{selected.length} selected</span>
//             <button
//               className={styles.primary}
//               disabled={!selected.length || busy}
//               onClick={() => approve(false)}
//             >
//               <Check size={15} /> Approve selected
//             </button>
//           </div>
//         )}
//         {data.length === 0 && (
//           <Empty text="No attendance requests are waiting for approval with these filters." />
//         )}
//       </div>
//     );
//   if (path === "/admin/interns")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Search registered interns and review their group assignment and contact details."
//           action={
//             <button className={styles.ghost} onClick={load}>
//               <RefreshCw size={15} /> Refresh
//             </button>
//           }
//         />
//         <div className={styles.filters}>
//           <div className={styles.search}>
//             <Search size={16} />
//             <input
//               placeholder="Search name, email, intern ID, phone or domain"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <Select
//             label="All groups"
//             value={groupFilter}
//             onChange={setGroupFilter}
//             options={groups.map((g) => ({ label: g.name, value: g._id }))}
//           />
//         </div>
//         <DataTable
//           headers={[
//             "Intern",
//             "Intern ID",
//             "Contact",
//             "Domain",
//             "Group",
//             "Start date",
//             "InternCash",
//           ]}
//           rows={data.map((x) => (
//             <tr key={x._id}>
//               <td>
//                 <b>{x.name}</b>
//                 <small>{x.email}</small>
//               </td>
//               <td className={styles.code}>{x.internId}</td>
//               <td>{x.whatsappNumber || "—"}</td>
//               <td>{x.domain || "—"}</td>
//               <td>{x.group?.name || groupName(x)}</td>
//               <td>{date(x.internshipStartDate)}</td>
//               <td>
//                 <b>{x.internCashBalance ?? 0} IC</b>
//                 <button
//                   className={styles.iconButton}
//                   onClick={() => {
//                     setTarget(x);
//                     setExtra({
//                       ...extra,
//                       transferTarget:
//                         groups.find(
//                           (g) =>
//                             g._id !== (x.group?._id || x.group) &&
//                             g.status !== "completed",
//                         )?._id || "",
//                       transferReason: "",
//                     });
//                     setModal("transfer");
//                   }}
//                   title="Transfer intern to another group"
//                 >
//                   <ArrowUpRight size={14} />
//                 </button>
//               </td>
//             </tr>
//           ))}
//         />
//         {data.length === 0 && <Empty text="No interns match this search." />}
//         {modal === "transfer" && (
//           <Modal
//             title={`Transfer ${target?.name || "intern"} to another group`}
//             close={() => setModal("")}
//           >
//             <form
//               className={styles.formGrid}
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 const source =
//                   target?.group?._id ||
//                   target?.group ||
//                   groups.find((g) => g._id === extra.transferTarget)?._id;
//                 run(
//                   () =>
//                     api(`/groups/${source || groups[0]?._id}/transfer-intern`, {
//                       method: "POST",
//                       body: {
//                         internId: target?.internId || target?._id,
//                         targetGroupId: extra.transferTarget,
//                         reason: extra.transferReason || "Admin transfer",
//                       },
//                     }),
//                   "Intern transferred successfully.",
//                 );
//               }}
//             >
//               <label className={styles.full}>
//                 Destination group
//                 <select
//                   required
//                   value={extra.transferTarget || ""}
//                   onChange={(e) =>
//                     setExtra({ ...extra, transferTarget: e.target.value })
//                   }
//                 >
//                   <option value="">Choose a group</option>
//                   {groups
//                     .filter(
//                       (g) =>
//                         g.status !== "completed" &&
//                         g._id !== (target?.group?._id || target?.group),
//                     )
//                     .map((g) => (
//                       <option key={g._id} value={g._id}>
//                         {g.name}
//                       </option>
//                     ))}
//                 </select>
//               </label>
//               <label className={styles.full}>
//                 Transfer reason
//                 <input
//                   value={extra.transferReason || ""}
//                   onChange={(e) =>
//                     setExtra({ ...extra, transferReason: e.target.value })
//                   }
//                   placeholder="Optional reason for audit history"
//                 />
//               </label>
//               <div className={styles.modalActions}>
//                 <button
//                   type="button"
//                   className={styles.ghost}
//                   onClick={() => setModal("")}
//                 >
//                   Cancel
//                 </button>
//                 <button className={styles.primary} disabled={busy}>
//                   <ArrowUpRight size={15} /> Transfer intern
//                 </button>
//               </div>
//             </form>
//           </Modal>
//         )}
//       </div>
//     );
//   if (path === "/admin/attendance")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Filter attendance history by date range, group and session."
//           action={
//             <button className={styles.ghost} onClick={load}>
//               <RefreshCw size={15} /> Refresh
//             </button>
//           }
//         />
//         <div className={styles.filters}>
//           <Select
//             label="All groups"
//             value={groupFilter}
//             onChange={setGroupFilter}
//             options={groups.map((g) => ({ label: g.name, value: g._id }))}
//           />
//           <label className={styles.dateFilter}>
//             From
//             <input
//               type="date"
//               value={from}
//               onChange={(e) => setFrom(e.target.value)}
//             />
//           </label>
//           <label className={styles.dateFilter}>
//             To
//             <input
//               type="date"
//               value={to}
//               onChange={(e) => setTo(e.target.value)}
//             />
//           </label>
//           <Select
//             label="Session"
//             value={sessionFilter}
//             onChange={setSessionFilter}
//             options={[
//               { label: "Session 1", value: "1" },
//               { label: "Session 2", value: "2" },
//             ]}
//           />
//           <button className={styles.primary} onClick={load}>
//             <Filter size={14} /> Apply filters
//           </button>
//         </div>
//         <DataTable
//           headers={[
//             "Intern",
//             "Group",
//             "Date",
//             "Session",
//             "Status",
//             "Approved by",
//             "Correction",
//           ]}
//           rows={data.map((r) => (
//             <tr key={r._id}>
//               <td>
//                 <b>{r.intern?.name || "—"}</b>
//                 <small>{r.intern?.internId}</small>
//               </td>
//               <td>{r.intern?.group?.name || r.group?.name || "—"}</td>
//               <td>{r.dateKey}</td>
//               <td>Session {r.sessionNumber}</td>
//               <td>
//                 <span className={styles.status}>{r.status}</span>
//               </td>
//               <td>{r.approvedBy?.name || "—"}</td>
//               <td>
//                 <button
//                   className={styles.ghost}
//                   onClick={() => {
//                     setCorrection({
//                       internId: r.intern?.internId || r.intern?._id || "",
//                       date: r.dateKey,
//                       status: "admin_corrected_present",
//                       reason: "",
//                       sessionNumber: r.sessionNumber,
//                     });
//                     setModal("correction");
//                   }}
//                 >
//                   <Edit3 size={13} /> Correct
//                 </button>
//               </td>
//             </tr>
//           ))}
//         />
//         {data.length === 0 && (
//           <Empty text="No records found for the selected filters." />
//         )}
//         {modal === "correction" && (
//           <Modal title="Correct attendance record" close={() => setModal("")}>
//             <form
//               className={styles.formGrid}
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 run(
//                   () =>
//                     api("/attendance/admin/correct", {
//                       method: "POST",
//                       body: correction,
//                     }),
//                   "Attendance correction saved.",
//                 );
//               }}
//             >
//               <label>
//                 Intern ID
//                 <input
//                   value={correction.internId}
//                   onChange={(e) =>
//                     setCorrection({ ...correction, internId: e.target.value })
//                   }
//                   required
//                 />
//               </label>
//               <label>
//                 Date
//                 <input
//                   type="date"
//                   value={correction.date}
//                   onChange={(e) =>
//                     setCorrection({ ...correction, date: e.target.value })
//                   }
//                   required
//                 />
//               </label>
//               <label>
//                 Session
//                 <select
//                   value={correction.sessionNumber}
//                   onChange={(e) =>
//                     setCorrection({
//                       ...correction,
//                       sessionNumber: Number(e.target.value),
//                     })
//                   }
//                 >
//                   <option value={1}>Session 1</option>
//                   <option value={2}>Session 2</option>
//                 </select>
//               </label>
//               <label>
//                 Corrected status
//                 <select
//                   value={correction.status}
//                   onChange={(e) =>
//                     setCorrection({ ...correction, status: e.target.value })
//                   }
//                 >
//                   <option value="admin_corrected_present">Present</option>
//                   <option value="admin_corrected_absent">Absent</option>
//                   <option value="approved">Approved</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
//               </label>
//               <label className={styles.full}>
//                 Reason for correction
//                 <textarea
//                   rows="3"
//                   value={correction.reason}
//                   onChange={(e) =>
//                     setCorrection({ ...correction, reason: e.target.value })
//                   }
//                   required
//                   minLength={3}
//                   placeholder="Explain why this attendance record is being corrected"
//                 />
//               </label>
//               <div className={styles.modalActions}>
//                 <button
//                   type="button"
//                   className={styles.ghost}
//                   onClick={() => setModal("")}
//                 >
//                   Cancel
//                 </button>
//                 <button className={styles.primary} disabled={busy}>
//                   <Save size={15} /> Save correction
//                 </button>
//               </div>
//             </form>
//           </Modal>
//         )}
//       </div>
//     );

//   if (path === "/wallet") {
//     return <RewardsPage user={user} />;
//   }

//   if (path === "/certification") {
//     return <CertificatePage user={user} />;
//   }

//   if (path === "/admin/wallet" || path === "/wallet")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={path === "/wallet" ? "My InternCash wallet" : title}
//           sub={
//             path === "/wallet"
//               ? "Your current balance and every credit or debit in one place."
//               : "Review credit and debit logs for all interns."
//           }
//           action={
//             <div style={{ display: "flex", gap: 8 }}>
//               {admin && (
//                 <button
//                   className={styles.primary}
//                   onClick={() => setModal("adjust")}
//                 >
//                   <Plus size={15} /> Adjust balance
//                 </button>
//               )}
//               <button className={styles.ghost} onClick={load}>
//                 <RefreshCw size={15} /> Refresh
//               </button>
//             </div>
//           }
//         />

//         {/* {path === "/wallet" && (
//           // <div className={styles.balance}>
//           //   <small>Available balance</small>
//           //   <strong>
//           //     {extra.balance ?? user?.internCashBalance ?? 0} <span>IC</span>
//           //   </strong>
//           //   <p>
//           //     1 InternCash ≈ ₹{extra.conversion ?? 0.5}. Rewards are recorded
//           //     after approval.
//           //   </p>
//           // </div>
//           // <RewardsPage data={data} />
//         )} */}

//         {admin && (
//           <div className={styles.filters}>
//             <Select
//               label="All groups"
//               value={groupFilter}
//               onChange={setGroupFilter}
//               options={groups.map((g) => ({ label: g.name, value: g._id }))}
//             />
//             <span className={styles.count}>{data.length} transactions</span>
//           </div>
//         )}

//         {/*  */}
//         {/* {DataTable({
//           headers: admin
//             ? [
//                 "Intern",
//                 "Group",
//                 "Date",
//                 "Transaction",
//                 "Amount",
//                 "Balance after",
//               ]
//             : ["Date", "Transaction", "Reference", "Amount", "Balance after"],
//           rows: data.map((t) => (
//             <tr key={t._id}>
//               <td>
//                 {admin ? (
//                   <>
//                     <b>{t.intern?.name || "—"}</b>
//                     <small>{t.intern?.internId || ""}</small>
//                   </>
//                 ) : (
//                   date(t.createdAt)
//                 )}
//               </td>
//               {admin && <td>{t.group?.name || "—"}</td>}
//               <td>{admin ? date(t.createdAt) : t.description || t.type}</td>
//               <td>{admin ? t.description || t.type : t.reference || "—"}</td>
//               <td
//                 className={
//                   Number(t.amount) >= 0 ? styles.positive : styles.negative
//                 }
//               >
//                 {Number(t.amount) > 0 ? "+" : ""}
//                 {t.amount} IC
//               </td>
//               <td>{t.balanceAfter ?? "—"} IC</td>
//             </tr>
//           )),
//         })}
//         {data.length === 0 && <Empty text="No wallet transactions yet." />} */}

//         {/*  */}
//         {modal === "adjust" && (
//           <Modal title="Adjust intern balance" close={() => setModal("")}>
//             <form
//               className={styles.formGrid}
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 run(
//                   () =>
//                     api("/wallet/admin/adjust", {
//                       method: "POST",
//                       body: adjust,
//                     }),
//                   "Wallet balance adjusted and ledger entry recorded.",
//                 );
//               }}
//             >
//               <label className={styles.full}>
//                 Intern ID
//                 <input
//                   value={adjust.internId}
//                   onChange={(e) =>
//                     setAdjust({ ...adjust, internId: e.target.value })
//                   }
//                   required
//                   placeholder="VLRINT202601234"
//                 />
//               </label>
//               <label>
//                 Amount (IC)
//                 <input
//                   type="number"
//                   value={adjust.amount}
//                   onChange={(e) =>
//                     setAdjust({ ...adjust, amount: Number(e.target.value) })
//                   }
//                   required
//                   min="-100000"
//                   max="100000"
//                 />
//               </label>
//               <label className={styles.full}>
//                 Reason
//                 <textarea
//                   rows="3"
//                   value={adjust.reason}
//                   onChange={(e) =>
//                     setAdjust({ ...adjust, reason: e.target.value })
//                   }
//                   required
//                   placeholder="Reason for credit or debit adjustment"
//                 />
//               </label>
//               <div className={styles.modalActions}>
//                 <button
//                   type="button"
//                   className={styles.ghost}
//                   onClick={() => setModal("")}
//                 >
//                   Cancel
//                 </button>
//                 <button className={styles.primary} disabled={busy}>
//                   <Save size={15} /> Record adjustment
//                 </button>
//               </div>
//             </form>
//           </Modal>
//         )}
//       </div>
//     );
//   if (path === "/admin/promos")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Create group-specific codes with random rewards, redemption limits and optional expiry."
//           action={
//             <button
//               className={styles.primary}
//               onClick={() => setModal("promo")}
//             >
//               <Plus size={15} /> Create promo code
//             </button>
//           }
//         />
//         <DataTable
//           headers={[
//             "Code",
//             "Group",
//             "Reward range",
//             "Redemptions",
//             "Expires",
//             "Status",
//             "Action",
//           ]}
//           rows={data.map((c) => (
//             <tr key={c._id}>
//               <td className={styles.code}>
//                 <b>{c.code}</b>
//                 <button
//                   className={styles.iconButton}
//                   onClick={() => {
//                     navigator.clipboard.writeText(c.code);
//                     toast("Promo code copied.");
//                   }}
//                 >
//                   <Copy size={13} />
//                 </button>
//               </td>
//               <td>{c.group?.name || "—"}</td>
//               <td>
//                 {c.minReward}–{c.maxReward} IC
//               </td>
//               <td>
//                 {c.redemptionCount || 0} / {c.maxRedemptions}
//               </td>
//               <td>{date(c.expiresAt)}</td>
//               <td>
//                 <span
//                   className={
//                     c.active ? styles.statusActive : styles.statusExpired
//                   }
//                 >
//                   {c.active ? "Active" : "Expired"}
//                 </span>
//               </td>
//               <td>
//                 {c.active && (
//                   <button
//                     className={styles.dangerBtn}
//                     onClick={() =>
//                       run(
//                         () =>
//                           api(`/promo-codes/${c._id}/expire`, {
//                             method: "POST",
//                             body: {},
//                           }),
//                         "Promo code expired.",
//                       )
//                     }
//                   >
//                     Expire now
//                   </button>
//                 )}
//               </td>
//             </tr>
//           ))}
//         />
//         {modal === "promo" && (
//           <Modal title="Create group promo code" close={() => setModal("")}>
//             <form className={styles.formGrid} onSubmit={submitPromo}>
//               <label className={styles.full}>
//                 For which group?
//                 <select
//                   value={promo.groupId}
//                   onChange={(e) =>
//                     setPromo({ ...promo, groupId: e.target.value })
//                   }
//                   required
//                 >
//                   <option value="">Choose a group</option>
//                   {groups
//                     .filter((g) => g.status !== "completed")
//                     .map((g) => (
//                       <option key={g._id} value={g._id}>
//                         {g.name}
//                       </option>
//                     ))}
//                 </select>
//               </label>
//               <label>
//                 Minimum reward (IC)
//                 <input
//                   type="number"
//                   min="1"
//                   value={promo.minReward}
//                   onChange={(e) =>
//                     setPromo({ ...promo, minReward: Number(e.target.value) })
//                   }
//                   required
//                 />
//               </label>
//               <label>
//                 Maximum reward (IC)
//                 <input
//                   type="number"
//                   min={promo.minReward}
//                   value={promo.maxReward}
//                   onChange={(e) =>
//                     setPromo({ ...promo, maxReward: Number(e.target.value) })
//                   }
//                   required
//                 />
//               </label>
//               <label>
//                 Maximum redemptions
//                 <input
//                   type="number"
//                   min="1"
//                   value={promo.maxRedemptions}
//                   onChange={(e) =>
//                     setPromo({
//                       ...promo,
//                       maxRedemptions: Number(e.target.value),
//                     })
//                   }
//                   required
//                 />
//               </label>
//               <label>
//                 Expiry (optional)
//                 <input
//                   type="datetime-local"
//                   value={promo.expiresAt}
//                   onChange={(e) =>
//                     setPromo({ ...promo, expiresAt: e.target.value })
//                   }
//                 />
//               </label>
//               <label className={styles.full}>
//                 Custom code (optional)
//                 <input
//                   value={promo.code}
//                   onChange={(e) =>
//                     setPromo({ ...promo, code: e.target.value.toUpperCase() })
//                   }
//                   placeholder="Leave blank to generate automatically"
//                 />
//               </label>
//               <div className={styles.modalActions}>
//                 <button
//                   type="button"
//                   className={styles.ghost}
//                   onClick={() => setModal("")}
//                 >
//                   Cancel
//                 </button>
//                 <button className={styles.primary} disabled={busy}>
//                   <Plus size={15} /> Generate code
//                 </button>
//               </div>
//             </form>
//           </Modal>
//         )}
//       </div>
//     );
//   if (path === "/promos") return <Promos />;
//   if (path === "/admin/notifications")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Send announcements to every intern or target one specific group."
//           action={
//             <button
//               className={styles.primary}
//               onClick={() => setModal("notice")}
//             >
//               <Plus size={15} /> New notification
//             </button>
//           }
//         />
//         <DataTable
//           headers={["Notification", "Audience", "Sent", "Link", "Action"]}
//           rows={data.map((n) => (
//             <tr key={n._id}>
//               <td>
//                 <b>{n.title}</b>
//                 <small>{n.message}</small>
//               </td>
//               <td>{n.targetGroup?.name || "All groups"}</td>
//               <td>{date(n.createdAt)}</td>
//               <td>
//                 {n.link ? (
//                   <a href={n.link} target="_blank" rel="noreferrer">
//                     Open link
//                   </a>
//                 ) : (
//                   "—"
//                 )}
//               </td>
//               <td>
//                 <button
//                   className={styles.dangerBtn}
//                   onClick={() =>
//                     run(
//                       () =>
//                         api(`/notifications/${n._id}`, { method: "DELETE" }),
//                       "Notification deleted.",
//                     )
//                   }
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         />
//         {modal === "notice" && (
//           <Modal title="Send a notification" close={() => setModal("")}>
//             <form className={styles.formGrid} onSubmit={submitNotice}>
//               <label className={styles.full}>
//                 Title
//                 <input
//                   value={message.title}
//                   onChange={(e) =>
//                     setMessage({ ...message, title: e.target.value })
//                   }
//                   minLength={3}
//                   required
//                 />
//               </label>
//               <label className={styles.full}>
//                 Message
//                 <textarea
//                   rows="4"
//                   value={message.message}
//                   onChange={(e) =>
//                     setMessage({ ...message, message: e.target.value })
//                   }
//                   minLength={3}
//                   required
//                 />
//               </label>
//               <label className={styles.full}>
//                 Send to
//                 <select
//                   value={message.targetGroupId}
//                   onChange={(e) =>
//                     setMessage({ ...message, targetGroupId: e.target.value })
//                   }
//                 >
//                   <option value="all">All groups</option>
//                   {groups.map((g) => (
//                     <option key={g._id} value={g._id}>
//                       {g.name}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//               <label className={styles.full}>
//                 Optional link
//                 <input
//                   type="url"
//                   value={message.link}
//                   onChange={(e) =>
//                     setMessage({ ...message, link: e.target.value })
//                   }
//                   placeholder="https://…"
//                 />
//               </label>
//               <div className={styles.modalActions}>
//                 <button
//                   type="button"
//                   className={styles.ghost}
//                   onClick={() => setModal("")}
//                 >
//                   Cancel
//                 </button>
//                 <button className={styles.primary} disabled={busy}>
//                   <Bell size={15} /> Send notification
//                 </button>
//               </div>
//             </form>
//           </Modal>
//         )}
//       </div>
//     );
//   if (path === "/notifications" || path === "/promos") return <Notifications />;
//   if (path === "/admin/settings")
//     return (
//       <div className={styles.page}>
//         <Head
//           title={title}
//           sub="Control attendance windows and intern device access."
//         />
//         <form
//           className={styles.settingsForm}
//           onSubmit={(e) => {
//             e.preventDefault();
//             run(async () => {
//               await api("/admin/settings/attendance", {
//                 method: "PATCH",
//                 body: {
//                   firstStart: settings.firstStart,
//                   firstEnd: settings.firstEnd,
//                   secondStart: settings.secondStart,
//                   secondEnd: settings.secondEnd,
//                   minimumSeconds: Number(settings.minimumSeconds),
//                 },
//               });
//               await api("/admin/settings/portal-access", {
//                 method: "PATCH",
//                 body: { onlyDesktopAccess: !!settings.onlyDesktopAccess },
//               });
//             }, "Portal settings updated.");
//           }}
//         >
//           <section>
//             <div className={styles.settingsIcon}>
//               <Clock3 size={19} />
//             </div>
//             <h2>Attendance schedule</h2>
//             <p>
//               Times apply across all internship groups. Use India Standard Time
//               (IST).
//             </p>
//             <div className={styles.formGrid}>
//               <label>
//                 Session 1 starts
//                 <input
//                   type="time"
//                   value={settings.firstStart}
//                   onChange={(e) =>
//                     setSettings({ ...settings, firstStart: e.target.value })
//                   }
//                 />
//               </label>
//               <label>
//                 Session 1 ends
//                 <input
//                   type="time"
//                   value={settings.firstEnd}
//                   onChange={(e) =>
//                     setSettings({ ...settings, firstEnd: e.target.value })
//                   }
//                 />
//               </label>
//               <label>
//                 Session 2 starts
//                 <input
//                   type="time"
//                   value={settings.secondStart}
//                   onChange={(e) =>
//                     setSettings({ ...settings, secondStart: e.target.value })
//                   }
//                 />
//               </label>
//               <label>
//                 Session 2 ends
//                 <input
//                   type="time"
//                   value={settings.secondEnd}
//                   onChange={(e) =>
//                     setSettings({ ...settings, secondEnd: e.target.value })
//                   }
//                 />
//               </label>
//               <label>
//                 Minimum time on page (seconds)
//                 <input
//                   type="number"
//                   min="10"
//                   max="600"
//                   value={settings.minimumSeconds}
//                   onChange={(e) =>
//                     setSettings({ ...settings, minimumSeconds: e.target.value })
//                   }
//                 />
//               </label>
//             </div>
//           </section>
//           <section>
//             <div className={styles.settingsIcon}>
//               <LockKeyholeIcon />
//             </div>
//             <h2>Intern attendance device access</h2>
//             <p>
//               Interns can explore the rest of the portal on any device.
//               Attendance marking can be restricted to large screens.
//             </p>
//             <label className={styles.toggle}>
//               <span>
//                 <b>Require desktop for attendance</b>
//                 <small>
//                   Minimum viewport width: 1300px. Admin access is not
//                   restricted.
//                 </small>
//               </span>
//               <input
//                 type="checkbox"
//                 checked={!!settings.onlyDesktopAccess}
//                 onChange={(e) =>
//                   setSettings({
//                     ...settings,
//                     onlyDesktopAccess: e.target.checked,
//                   })
//                 }
//               />
//             </label>
//           </section>
//           <button className={styles.primary} disabled={busy}>
//             <Save size={15} /> Save settings
//           </button>
//         </form>
//       </div>
//     );
//   if (path === "/account") return <Account />;
//   return (
//     <div className={styles.page}>
//       <Head
//         title={title}
//         sub="Clear information about how the VELoop Rewards internship portal works."
//       />
//       <div className={styles.policyList}>
//         <section id="privacy">
//           <h2>Privacy policy</h2>
//           <p>
//             We collect the details needed to verify internship eligibility,
//             manage attendance, communicate group updates, and maintain reward
//             records: name, verified email, intern ID, WhatsApp contact, group,
//             domain, attendance sessions, and wallet transactions. Offer records
//             are checked against the official offer-letter generator. Access is
//             role-based and administrative actions should be limited to
//             authorized admins. Do not share passwords or invitation links
//             publicly.
//           </p>
//         </section>
//         <section id="terms">
//           <h2>Terms & conditions</h2>
//           <p>
//             The portal is provided to support the internship programme. Interns
//             must provide accurate information, use only their assigned account,
//             follow attendance time windows, remain on the attendance page for
//             the required verification period, and never attempt to falsify
//             attendance or rewards. Attendance requests remain pending until an
//             authorized admin approves them. The programme team may correct
//             records, suspend misuse, update schedules, or close a group through
//             the defined approval workflow.
//           </p>
//         </section>
//         <section id="refund">
//           <h2>Refund & certification processing charges</h2>
//           <p>
//             Joining the internship is separate from any optional certificate
//             processing or operational charge communicated by VELoop Rewards. Any
//             charge must be clearly disclosed before payment with its purpose and
//             coverage. Where a certificate-processing service has already been
//             initiated or a digital certificate has been issued, the processing
//             charge is non-refundable, except where applicable law requires
//             otherwise or the payment was collected in error. Contact the
//             official programme team for payment disputes or corrections. Do not
//             submit payment credentials in this portal.
//           </p>
//         </section>
//         <section id="charges">
//           <h2>Charges policy</h2>
//           <p>
//             Attendance, account creation and InternCash balances are recorded
//             according to the programme rules and are not a cash deposit. Any
//             certification processing charge is distinct from rewards and must be
//             communicated separately. The portal currently does not process
//             certification payments; certification workflow remains subject to
//             programme admin instructions.
//           </p>
//         </section>
//         <section id="cookies">
//           <h2>Cookies & session security</h2>
//           <p>
//             The portal stores an authentication token in browser local storage
//             to maintain your signed-in session. Sign out on shared devices, keep
//             your browser updated, and never share your account. Avoid using
//             public computers for sensitive account actions.
//           </p>
//         </section>
//         <section>
//           <h2>Contact & support</h2>
//           <p>
//             For account verification, attendance approval, group assignment, or
//             policy questions, contact your internship group admin through the
//             official WhatsApp group.
//           </p>
//         </section>
//       </div>
//     </div>
//   );
// }
// function Head({ title, sub, action }) {
//   return (
//     <div className={styles.head}>
//       <div>
//         <div className={styles.eyebrow}>VELOOP REWARDS / WORKSPACE</div>
//         <h1>{title}</h1>
//         <p>{sub}</p>
//       </div>
//       {action && <div className={styles.headAction}>{action}</div>}
//     </div>
//   );
// }
// function Empty({ text }) {
//   return (
//     <div className={styles.empty}>
//       <div>
//         <ShieldCheck size={20} />
//       </div>
//       <p>{text}</p>
//     </div>
//   );
// }
// function DataTable({ headers, rows }) {
//   return (
//     <div className={styles.tableWrap}>
//       <table>
//         <thead>
//           <tr>
//             {headers.map((h) => (
//               <th key={h}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>{rows}</tbody>
//       </table>
//     </div>
//   );
// }
// function Select({ label, value, onChange, options }) {
//   return (
//     <label className={styles.selectWrap}>
//       <span>{label}</span>
//       <select value={value} onChange={(e) => onChange(e.target.value)}>
//         <option value="">{label}</option>
//         {options.map((o) => (
//           <option value={o.value} key={o.value}>
//             {o.label}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }
// function Modal({ title, close, children }) {
//   return (
//     <div
//       className={styles.modalOverlay}
//       onMouseDown={(e) => e.target === e.currentTarget && close()}
//     >
//       <div className={styles.modal}>
//         <div className={styles.modalHead}>
//           <h2>{title}</h2>
//           <button onClick={close}>×</button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// }
// function LockKeyholeIcon() {
//   return <ShieldCheck size={19} />;
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Archive,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  Gift,
  Layers3,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  TicketPercent,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { api, saveBlob } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";

import Account from "../Account/Account";
import Notifications from "../Notifications/Notifications";
import Promos from "../Promos/Promos";
import RewardsPage from "../RewardsPage/RewardsPage";
import CertificatePage from "../Certificate/CertificatePage";
import AttendanceRecordTable from "./components/AttendanceRecordTable";
import AttendanceRiskPanel from "./components/AttendanceRiskPanel";
import InternAttendanceDetails from "./components/InternAttendanceDetails";
import styles from "./Manage.module.css";

/* =========================================================
   CONSTANTS AND UTILITIES
========================================================= */

const IST = "Asia/Kolkata";

const blankGroup = {
  name: "",
  description: "",
  whatsappGroupCode: "",
  plannedStartDate: "",
  durationDays: 28,
};

const blankPromo = {
  groupId: "",
  code: "",
  minReward: 1,
  maxReward: 10,
  maxRedemptions: 30,
  expiresAt: "",
};

const blankMessage = {
  title: "",
  message: "",
  link: "",
  targetGroupId: "all",
};

const blankAdjustment = {
  internId: "",
  amount: 1,
  reason: "",
};

const blankCorrection = {
  internId: "",
  date: "",
  status: "admin_corrected_present",
  reason: "",
  sessionNumber: 1,
};

const DEFAULT_SCHEDULE = {
  firstStart: "09:30",
  firstEnd: "12:30",
  secondStart: "13:00",
  secondEnd: "15:30",
  minimumSeconds: 50,
};

const pageTitles = {
  "/admin/groups": "Internship groups",
  "/admin/interns": "Intern directory",
  "/admin/approvals": "Attendance approvals",
  "/admin/attendance": "Attendance intelligence",
  "/admin/wallet": "InternCash control centre",
  "/admin/promos": "Promo campaigns",
  "/admin/notifications": "Broadcast centre",
  "/admin/settings": "Portal configuration",
  "/account": "My account",
  "/policies": "Policies & help",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const formatDate = (value, options = {}) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: IST,
    ...options,
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST,
  }).format(date);
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("en-IN")} IC`;

const addDays = (value, days) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + Number(days || 0));
  return date;
};

const getGroupEndDate = (group) =>
  group?.actualEndDate ||
  addDays(
    group?.actualStartDate || group?.plannedStartDate,
    group?.durationDays || 28,
  );

const getISTDateKey = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const result = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${result.year}-${result.month}-${result.day}`;
};

const getISTMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const result = Object.fromEntries(
    parts.map((part) => [part.type, Number(part.value)]),
  );

  return (result.hour || 0) * 60 + (result.minute || 0);
};

const toMinutes = (value) => {
  const [hours, minutes] = String(value || "00:00")
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

/**
 * Expected sessions are counted only after their configured session
 * end time. Sundays are excluded, matching the attendance tracker.
 *
 * There is no separate holiday calendar endpoint in the supplied API,
 * so this calculation does not silently exclude unspecified holidays.
 */
function getExpectedSessions(group, schedule = DEFAULT_SCHEDULE) {
  const startValue = group?.actualStartDate;

  if (!startValue || !group?.durationDays) return 0;

  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return 0;

  const end = group.actualEndDate
    ? new Date(group.actualEndDate)
    : addDays(start, group.durationDays);

  if (!end || Number.isNaN(end.getTime())) return 0;

  const todayKey = getISTDateKey();
  const todayMinutes = getISTMinutes();
  const endKey = getISTDateKey(end);

  const lastDate = endKey < todayKey ? endKey : todayKey;
  const cursor = new Date(`${getISTDateKey(start)}T12:00:00Z`);

  let total = 0;

  const sessionEnds = [
    toMinutes(schedule.firstEnd),
    toMinutes(schedule.secondEnd),
  ];

  while (getISTDateKey(cursor) <= lastDate) {
    const day = cursor.getUTCDay();
    const key = getISTDateKey(cursor);

    if (day !== 0) {
      if (key < todayKey) {
        total += 2;
      } else if (key === todayKey) {
        total += sessionEnds.filter(
          (endTime) => todayMinutes >= endTime,
        ).length;
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return total;
}

const getInternId = (intern) =>
  intern?.internId || intern?._id || intern?.id || "";

const getInternKey = (intern) =>
  String(intern?._id || intern?.id || intern?.internId || "");

const getStatusLabel = (status) =>
  String(status || "unknown").replaceAll("_", " ");

const getRecordInternKey = (record) =>
  String(record?.intern?._id || record?.intern?.id || record?.intern || "");

/* =========================================================
   REUSABLE VISUAL COMPONENTS
========================================================= */

function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className={styles.pageHeading}>
      <div className="min-w-0">
        <div className={styles.pageEyebrow}>
          <span />
          {eyebrow}
        </div>

        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {actions && <div className={styles.headingActions}>{actions}</div>}
    </div>
  );
}

function PageSkeleton({ rows = 5 }) {
  return (
    <div className={`${styles.page} animate-pulse`} aria-busy="true">
      <div className="h-24 rounded-3xl bg-slate-200" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-200" />
            <div className="mt-4 h-3 w-24 rounded-full bg-slate-200" />
            <div className="mt-3 h-6 w-16 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-5 w-44 rounded-lg bg-slate-200" />
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="mt-5 flex items-center gap-3 border-b border-slate-100 pb-4"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-200" />
            <div className="flex-1">
              <div className="h-3 w-1/2 rounded-full bg-slate-200" />
              <div className="mt-2 h-2.5 w-1/3 rounded-full bg-slate-100" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, note, Icon, tone }) {
  return (
    <article className={`${styles.metric} ${styles[`metric_${tone}`]}`}>
      <div className={styles.metricTop}>
        <span className={styles.metricIcon}>
          <Icon size={20} />
        </span>
        <span className={styles.metricSpark}>
          <Activity size={15} />
        </span>
      </div>

      <div className="mt-4">
        <p>{label}</p>
        <strong>{formatNumber(value)}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "unknown").toLowerCase();

  let tone = "neutral";

  if (
    ["active", "approved", "completed", "admin_corrected_present"].includes(
      status,
    )
  ) {
    tone = "success";
  } else if (
    ["pending", "registration", "completion_pending"].includes(status)
  ) {
    tone = "warning";
  } else if (
    ["missed", "rejected", "expired", "admin_corrected_absent"].includes(status)
  ) {
    tone = "danger";
  }

  return (
    <span className={`${styles.statusBadge} ${styles[`status_${tone}`]}`}>
      <i />
      {getStatusLabel(status)}
    </span>
  );
}

function EmptyState({ Icon = ShieldCheck, title, description, action }) {
  return (
    <div className={styles.emptyState}>
      <span>
        <Icon size={25} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function DataTable({ headers, rows, minWidth = 760 }) {
  return (
    <div className={styles.tableScroller}>
      <table style={{ minWidth }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className={styles.filterField}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchField({ value, onChange, placeholder }) {
  return (
    <label className={styles.searchField}>
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  tone = "secondary",
  disabled = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.actionButton} ${styles[`action_${tone}`]}`}
    >
      {children}
    </button>
  );
}

function FullscreenModal({ open, title, description, close, children }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className={styles.modalHeader}>
          <div>
            <span>VELOOP ADMINISTRATION</span>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>

          <button
            type="button"
            className={styles.modalClose}
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </header>

        <div className={styles.modalBody}>{children}</div>
      </section>
    </div>
  );
}

function FormField({ label, className = "", children }) {
  return (
    <label className={`${styles.formField} ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* =========================================================
   MAIN MANAGEMENT COMPONENT
========================================================= */

export default function Manage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const rawPath = location.pathname;

  const normalizedPath = rawPath.startsWith("/intern/")
    ? rawPath.replace("/intern", "")
    : rawPath;

  const path =
    normalizedPath === "/notification" ? "/notifications" : normalizedPath;

  const admin = path.startsWith("/admin");

  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [walletInterns, setWalletInterns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const [groupFilter, setGroupFilter] = useState(
    () => new URLSearchParams(window.location.search).get("groupId") || "",
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(blankGroup);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState("");
  const [target, setTarget] = useState(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [groupInterns, setGroupInterns] = useState([]);

  const [walletInternFilter, setWalletInternFilter] = useState("");
  const [selectedWalletIntern, setSelectedWalletIntern] = useState(null);

  const [extra, setExtra] = useState({});
  const [attendanceSchedule, setAttendanceSchedule] =
    useState(DEFAULT_SCHEDULE);

  const [settings, setSettings] = useState({
    ...DEFAULT_SCHEDULE,
    onlyDesktopAccess: true,
  });

  const [message, setMessage] = useState(blankMessage);
  const [promo, setPromo] = useState(blankPromo);
  const [adjust, setAdjust] = useState(blankAdjustment);
  const [correction, setCorrection] = useState(blankCorrection);

  const [lastUpdated, setLastUpdated] = useState(null);

  const title =
    pageTitles[path] ||
    pageTitles[path.split("/").filter(Boolean).pop()] ||
    "Workspace";

  /* ---------------------------------------------------------
     QUERY PARAMETER SYNC
  --------------------------------------------------------- */

  useEffect(() => {
    const requestedGroup = new URLSearchParams(location.search).get("groupId");

    if (requestedGroup) {
      setGroupFilter(requestedGroup);
    }
  }, [location.search]);

  /* ---------------------------------------------------------
     LOAD PAGE DATA
  --------------------------------------------------------- */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const groupResponse = await api("/groups");
      const nextGroups = groupResponse.groups || [];

      setGroups(nextGroups);

      let endpoint = "";
      let response = null;

      if (path === "/admin/groups") {
        setData(nextGroups);
      } else if (path === "/admin/interns") {
        const query = new URLSearchParams();

        if (search) query.set("q", search);
        if (groupFilter) query.set("groupId", groupFilter);

        const [internResponse, attendanceResponse, scheduleResponse] =
          await Promise.all([
            api(`/admin/interns${query.toString() ? `?${query}` : ""}`),
            api(
              `/attendance/admin/report${
                groupFilter ? `?groupId=${encodeURIComponent(groupFilter)}` : ""
              }`,
            ),
            api("/admin/settings/attendance"),
          ]);

        setData(internResponse.interns || []);
        setAttendanceRecords(attendanceResponse.records || []);
        setAttendanceSchedule({
          ...DEFAULT_SCHEDULE,
          ...(scheduleResponse.settings || {}),
        });
      } else if (path === "/admin/approvals") {
        const query = new URLSearchParams();

        if (groupFilter) query.set("groupId", groupFilter);
        if (sessionFilter) query.set("sessionNumber", sessionFilter);

        endpoint = `/attendance/admin/approvals${
          query.toString() ? `?${query}` : ""
        }`;
      } else if (path === "/admin/attendance") {
        const query = new URLSearchParams();

        if (groupFilter) query.set("groupId", groupFilter);
        if (from) query.set("from", from);
        if (to) query.set("to", to);
        if (sessionFilter) query.set("sessionNumber", sessionFilter);
        if (statusFilter) query.set("status", statusFilter);

        endpoint = `/attendance/admin/report${
          query.toString() ? `?${query}` : ""
        }`;
      } else if (path === "/admin/wallet") {
        const query = new URLSearchParams();

        if (groupFilter) query.set("groupId", groupFilter);

        const [transactionResponse, internResponse] = await Promise.all([
          api(
            `/wallet/admin/transactions${query.toString() ? `?${query}` : ""}`,
          ),
          api(
            `/admin/interns${
              groupFilter ? `?groupId=${encodeURIComponent(groupFilter)}` : ""
            }`,
          ),
        ]);

        setData(transactionResponse.transactions || []);
        setWalletInterns(internResponse.interns || []);
        setSelectedWalletIntern(null);
      } else if (path === "/admin/promos") {
        endpoint = "/promo-codes";
      } else if (path === "/admin/notifications") {
        endpoint = "/notifications";
      } else if (path === "/admin/settings") {
        const [portalResponse, scheduleResponse] = await Promise.all([
          api("/admin/settings/portal-access"),
          api("/admin/settings/attendance"),
        ]);

        const nextSettings = {
          ...DEFAULT_SCHEDULE,
          ...(portalResponse.settings || {}),
          ...(scheduleResponse.settings || {}),
        };

        setSettings(nextSettings);
        setAttendanceSchedule(nextSettings);
        setData([]);
      } else if (path === "/wallet") {
        endpoint = "/wallet/mine";
      } else if (path === "/promos" || path === "/notifications") {
        endpoint = "/notifications/mine";
      } else if (path === "/account") {
        endpoint = "/auth/me";
      } else {
        endpoint = "/wallet/mine";
      }

      if (endpoint) {
        response = await api(endpoint);

        const items =
          response.groups ||
          response.interns ||
          response.records ||
          response.transactions ||
          response.codes ||
          response.notifications ||
          [];

        setData(Array.isArray(items) ? items : []);

        if (path === "/wallet") setExtra(response);
        if (path === "/account") setExtra(response.user || {});
        if (path === "/promos") setExtra(response);
      }

      setLastUpdated(new Date());
    } catch (error) {
      toast(error.message || "Unable to load this section.", "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [path, search, groupFilter, from, to, sessionFilter, statusFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------------------------------------------------
     SHARED MUTATION HANDLER
  --------------------------------------------------------- */

  const run = async (fn, successMessage, closeModal = true) => {
    setBusy(true);

    try {
      await fn();

      toast(successMessage || "Changes saved.");

      if (closeModal) setModal("");

      await load();
    } catch (error) {
      toast(error.message || "The action could not be completed.", "error");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------
     GROUP HANDLERS
  --------------------------------------------------------- */

  const openGroup = (group = null) => {
    setEditing(group?._id || null);

    setForm(
      group
        ? {
            name: group.name || "",
            description: group.description || "",
            whatsappGroupCode: group.whatsappGroupCode || "",
            plannedStartDate: toDateInput(group.plannedStartDate),
            actualStartDate: toDateInput(group.actualStartDate),
            durationDays: group.durationDays || 28,
          }
        : blankGroup,
    );

    setModal("group");
  };

  const submitGroup = (event) => {
    event.preventDefault();

    run(
      () =>
        editing
          ? api(`/groups/${editing}`, { method: "PATCH", body: form })
          : api("/groups", { method: "POST", body: form }),
      editing ? "Group details updated." : "Internship group created.",
    );
  };

  const groupAction = async (action, group) => {
    if (action === "details") {
      setTarget(group);
      setGroupInterns([]);
      setModal("details");

      try {
        const response = await api(`/groups/${group._id}/interns`);
        setGroupInterns(response.interns || []);
      } catch (error) {
        toast(error.message, "error");
      }

      return;
    }

    if (action === "invite" || action === "reset") {
      await run(
        async () => {
          const response =
            action === "invite"
              ? await api(`/groups/${group._id}/invite`)
              : await api(`/groups/${group._id}/regenerate-invite`, {
                  method: "POST",
                  body: {},
                });

          setInviteUrl(
            `${window.location.origin}/login?invite=${encodeURIComponent(
              response.inviteToken,
            )}`,
          );

          setTarget(group);
        },
        action === "invite"
          ? "Invitation link ready."
          : "Invitation link regenerated.",
      );

      setModal("invite");
      return;
    }

    if (action === "start") {
      const defaultDate =
        toDateInput(group.plannedStartDate) || toDateInput(new Date());

      const selectedDate = window.prompt(
        "Internship start date (YYYY-MM-DD)",
        defaultDate,
      );

      if (!selectedDate) return;

      await run(
        () =>
          api(`/groups/${group._id}/start`, {
            method: "POST",
            body: { actualStartDate: selectedDate },
          }),
        "Internship started.",
      );

      return;
    }

    if (action === "complete") {
      const password = window.prompt(
        "Enter your admin password to record the first completion approval:",
      );

      if (password === null) return;

      await run(
        () =>
          api(`/groups/${group._id}/request-completion`, {
            method: "POST",
            body: { password },
          }),
        "First approval recorded. A different admin must approve completion.",
      );

      return;
    }

    if (action === "approveComplete") {
      const password = window.prompt(
        "Enter your admin password to provide the second approval:",
      );

      if (password === null) return;

      await run(async () => {
        await api(`/groups/${group._id}/approve-completion`, {
          method: "POST",
          body: { password },
        });

        const blob = await api(`/groups/${group._id}/archive`, {
          method: "POST",
          body: {},
        });

        saveBlob(
          blob,
          `VELOop-Complete-Archive-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`,
        );
      }, "Group completed and its cumulative archive was downloaded.");

      return;
    }

    if (action === "export") {
      await run(async () => {
        const blob = await api(`/groups/${group._id}/archive`, {
          method: "POST",
          body: {},
        });

        saveBlob(
          blob,
          `VELOop-Complete-Archive-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`,
        );
      }, "Group archive downloaded.");

      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(
        `Permanently delete ${group.name} and its live records? Ensure the latest CSV archive has been downloaded first.`,
      );

      if (!confirmed) return;

      await run(
        () => api(`/groups/${group._id}`, { method: "DELETE" }),
        "Archived group and its live data were deleted.",
      );
    }
  };

  /* ---------------------------------------------------------
     APPROVALS / PROMOS / BROADCASTS
  --------------------------------------------------------- */

  const approve = (all = false) =>
    run(
      () =>
        api("/attendance/admin/approvals/approve", {
          method: "POST",
          body: all
            ? {
                groupId: groupFilter,
                sessionNumber: sessionFilter || undefined,
                approveAll: true,
              }
            : { attendanceIds: selected },
        }),
      all ? "Pending group requests approved." : "Selected requests approved.",
    ).then(() => setSelected([]));

  const submitPromo = (event) => {
    event.preventDefault();

    run(
      () => api("/promo-codes", { method: "POST", body: promo }),
      "Promo code created.",
      false,
    ).then(() => setPromo(blankPromo));
  };

  const submitNotice = (event) => {
    event.preventDefault();

    run(
      () => api("/notifications", { method: "POST", body: message }),
      "Broadcast sent.",
      false,
    ).then(() => setMessage(blankMessage));
  };

  /* ---------------------------------------------------------
     ATTENDANCE CORRECTION
  --------------------------------------------------------- */

  const submitCorrection = (event) => {
    event.preventDefault();

    run(
      () =>
        api("/attendance/admin/correct", {
          method: "POST",
          body: correction,
        }),
      "Attendance correction saved.",
    );
  };

  /* ---------------------------------------------------------
     INTERN TRANSFER
  --------------------------------------------------------- */

  const submitTransfer = (event) => {
    event.preventDefault();

    const source =
      target?.group?._id ||
      target?.group ||
      groups.find((group) => group._id === extra.transferTarget)?._id;

    run(
      () =>
        api(`/groups/${source || groups[0]?._id}/transfer-intern`, {
          method: "POST",
          body: {
            internId: target?.internId || target?._id,
            targetGroupId: extra.transferTarget,
            reason: extra.transferReason || "Admin transfer",
          },
        }),
      "Intern transferred successfully.",
    );
  };

  /* ---------------------------------------------------------
     WALLET ADJUSTMENT
  --------------------------------------------------------- */

  const openAdjustment = (intern) => {
    setTarget(intern);

    setAdjust({
      internId: intern.internId || intern._id,
      amount: 1,
      reason: "",
    });

    setModal("adjust");
  };

  const submitAdjustment = (event) => {
    event.preventDefault();

    run(
      () =>
        api("/wallet/admin/adjust", {
          method: "POST",
          body: {
            internId: adjust.internId,
            amount: Number(adjust.amount),
            reason: adjust.reason,
          },
        }),
      "Wallet balance updated and ledger entry recorded.",
    );
  };

  /* ---------------------------------------------------------
     SETTINGS SAVE
  --------------------------------------------------------- */

  const saveSettings = (event) => {
    event.preventDefault();

    run(async () => {
      await api("/admin/settings/attendance", {
        method: "PATCH",
        body: {
          firstStart: settings.firstStart,
          firstEnd: settings.firstEnd,
          secondStart: settings.secondStart,
          secondEnd: settings.secondEnd,
          minimumSeconds: Number(settings.minimumSeconds),
        },
      });

      await api("/admin/settings/portal-access", {
        method: "PATCH",
        body: {
          onlyDesktopAccess: Boolean(settings.onlyDesktopAccess),
        },
      });
    }, "Portal settings updated.");
  };

  /* ---------------------------------------------------------
     DERIVED DATA
  --------------------------------------------------------- */

  const pendingCount = data.filter(
    (record) => record.status === "pending",
  ).length;

  const totalApproved = data.filter((record) =>
    ["approved", "admin_corrected_present"].includes(record.status),
  ).length;

  const totalMissed = data.filter((record) =>
    ["missed", "admin_corrected_absent"].includes(record.status),
  ).length;

  const totalRejected = data.filter(
    (record) => record.status === "rejected",
  ).length;

  const filteredGroups = groups.filter((group) =>
    String(group.name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const selectedWalletTransactions = selectedWalletIntern
    ? data.filter(
        (transaction) =>
          getRecordInternKey(transaction) ===
          getInternKey(selectedWalletIntern),
      )
    : data;

  const attendanceByIntern = useMemo(() => {
    const result = new Map();

    attendanceRecords.forEach((record) => {
      const key = getRecordInternKey(record);
      if (!key) return;

      if (!result.has(key)) result.set(key, []);
      result.get(key).push(record);
    });

    return result;
  }, [attendanceRecords]);

  const internSummary = (intern) => {
    const records = attendanceByIntern.get(getInternKey(intern)) || [];

    const approved = records.filter((record) =>
      ["approved", "admin_corrected_present"].includes(record.status),
    ).length;

    const missed = records.filter((record) =>
      ["missed", "admin_corrected_absent"].includes(record.status),
    ).length;

    const pending = records.filter(
      (record) => record.status === "pending",
    ).length;

    const rejected = records.filter(
      (record) => record.status === "rejected",
    ).length;

    const group =
      intern.group && typeof intern.group === "object"
        ? intern.group
        : groups.find((item) => item._id === intern.group);

    const expected = getExpectedSessions(group, attendanceSchedule);

    return {
      records,
      approved,
      missed,
      pending,
      rejected,
      expected,
      completion:
        expected > 0
          ? Math.min(100, Math.round((approved / expected) * 100))
          : 0,
      group,
      endDate: getGroupEndDate(group),
    };
  };

  const walletTransactionCount = (intern) =>
    data.filter(
      (transaction) => getRecordInternKey(transaction) === getInternKey(intern),
    ).length;

  const walletTotalBalance = walletInterns.reduce(
    (sum, intern) => sum + Number(intern.internCashBalance || 0),
    0,
  );

  const attendanceStats = {
    pending: pendingCount,
    approved: totalApproved,
    missed: totalMissed,
    rejected: totalRejected,
  };

  /* ---------------------------------------------------------
     LOADING STATE
  --------------------------------------------------------- */

  if (loading) {
    return <PageSkeleton rows={path === "/admin/groups" ? 4 : 6} />;
  }

  /* =========================================================
     INTERN-SIDE ROUTES — PRESERVE EXISTING FEATURES
  ========================================================== */

  if (path === "/wallet") return <RewardsPage user={user} />;

  if (path === "/certification") return <CertificatePage user={user} />;

  if (path === "/promos") return <Promos />;

  if (path === "/notifications") return <Notifications />;

  if (path === "/account") return <Account />;

  /* =========================================================
     ADMIN: INTERNSHIP GROUPS
  ========================================================== */

  if (path === "/admin/groups") {
    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="COHORT OPERATIONS / 01"
          title="Internship groups"
          description="Create cohorts, organise members, control invitation access and manage the complete internship lifecycle."
          actions={
            <>
              <ActionButton onClick={load}>
                <RefreshCw size={15} /> Refresh
              </ActionButton>
              <ActionButton tone="primary" onClick={() => openGroup()}>
                <Plus size={16} /> Create group
              </ActionButton>
            </>
          }
        />

        <section className={styles.groupIntro}>
          <div className={styles.groupIntroVisual}>
            <div className={styles.groupIntroOrb}>
              <Layers3 size={27} />
            </div>
            <span className={styles.orbitOne} />
            <span className={styles.orbitTwo} />
          </div>

          <div className="min-w-0 flex-1">
            <span>YOUR COHORT OVERVIEW</span>
            <h2>Every group, one clear view.</h2>
            <p>
              Manage registrations, track active programmes and safely archive
              completed cohorts.
            </p>
          </div>

          <div className={styles.groupCounters}>
            <div>
              <strong>{groups.length}</strong>
              <span>Total groups</span>
            </div>
            <div>
              <strong>
                {groups.filter((group) => group.status === "active").length}
              </strong>
              <span>Running now</span>
            </div>
            <div>
              <strong>
                {groups.reduce(
                  (sum, group) => sum + Number(group.internCount || 0),
                  0,
                )}
              </strong>
              <span>Interns assigned</span>
            </div>
          </div>
        </section>

        <div className={styles.toolbar}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search by group name..."
          />

          <span className={styles.resultCount}>
            Showing <b>{filteredGroups.length}</b> of {groups.length} groups
          </span>
        </div>

        <section className="space-y-3">
          <SectionHeading
            eyebrow="GROUP DIRECTORY"
            title="Cohort management"
            description="Each group is displayed as a two-row operations bar."
          />

          {filteredGroups.length ? (
            filteredGroups.map((group, index) => {
              const endDate = getGroupEndDate(group);
              const active =
                group.status === "active" ||
                group.status === "completion_pending";

              return (
                <article
                  key={group._id}
                  className={styles.groupBar}
                  style={{ "--group-index": index }}
                >
                  {/* ROW ONE — GROUP INFORMATION */}
                  <div className={styles.groupBarTop}>
                    <div className={styles.groupIdentity}>
                      <div
                        className={`${styles.groupAvatar} ${styles[`groupAvatar${index % 4}`]}`}
                      >
                        <Layers3 size={21} />
                      </div>

                      <div className="min-w-0">
                        <div className={styles.groupNameLine}>
                          <h3>{group.name}</h3>
                          <StatusBadge value={group.status} />
                        </div>

                        <p>
                          {group.description ||
                            "No group description has been added."}
                        </p>
                      </div>
                    </div>

                    <div className={styles.groupMetaGrid}>
                      <div>
                        <span>
                          <Users size={13} /> INTERNS
                        </span>
                        <strong>{formatNumber(group.internCount)}</strong>
                      </div>

                      <div>
                        <span>
                          <CalendarDays size={13} /> DURATION
                        </span>
                        <strong>{group.durationDays || 28} days</strong>
                      </div>

                      <div>
                        <span>
                          <CalendarCheck size={13} /> START DATE
                        </span>
                        <strong>
                          {formatDate(
                            group.actualStartDate || group.plannedStartDate,
                            { day: "2-digit", month: "short" },
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <CalendarDays size={13} /> END DATE
                        </span>
                        <strong>
                          {formatDate(endDate, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <ShieldCheck size={13} /> GROUP CODE
                        </span>
                        <strong className={styles.groupCode}>
                          {group.whatsappGroupCode || "Not set"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ROW TWO — GROUP ACTIONS */}
                  <div className={styles.groupBarBottom}>
                    <div className={styles.groupBarFooterInfo}>
                      <span
                        className={active ? styles.onlineDot : styles.idleDot}
                      />
                      {group.inviteActive
                        ? "Registration invitation active"
                        : "Invitation inactive"}
                    </div>

                    <div className={styles.groupActions}>
                      <ActionButton
                        onClick={() => groupAction("details", group)}
                      >
                        <Users size={14} /> Members
                      </ActionButton>

                      <ActionButton
                        onClick={() => groupAction("invite", group)}
                        disabled={group.status === "completed"}
                      >
                        <LinkIcon size={14} /> Invite
                      </ActionButton>

                      <ActionButton onClick={() => openGroup(group)}>
                        <Edit3 size={14} /> Edit
                      </ActionButton>

                      <ActionButton
                        onClick={() => groupAction("reset", group)}
                        disabled={group.status === "completed"}
                      >
                        <RefreshCw size={14} /> Reset link
                      </ActionButton>

                      {group.status === "registration" && (
                        <ActionButton
                          tone="success"
                          onClick={() => groupAction("start", group)}
                        >
                          <Play size={14} /> Start
                        </ActionButton>
                      )}

                      {group.status === "active" && (
                        <ActionButton
                          tone="warning"
                          onClick={() => groupAction("complete", group)}
                        >
                          <CheckCircle2 size={14} /> Complete
                        </ActionButton>
                      )}

                      {group.status === "completion_pending" && (
                        <ActionButton
                          tone="success"
                          onClick={() => groupAction("approveComplete", group)}
                        >
                          <ShieldCheck size={14} /> Second approval
                        </ActionButton>
                      )}

                      {group.status === "completed" && (
                        <>
                          <ActionButton
                            onClick={() => groupAction("export", group)}
                          >
                            <Download size={14} /> Archive
                          </ActionButton>

                          <ActionButton
                            tone="danger"
                            onClick={() => groupAction("delete", group)}
                          >
                            <Trash2 size={14} /> Delete
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              Icon={Layers3}
              title="No groups found"
              description="Create an internship group or change your search."
              action={
                <ActionButton tone="primary" onClick={() => openGroup()}>
                  <Plus size={15} /> Create first group
                </ActionButton>
              }
            />
          )}
        </section>

        {/* CREATE / EDIT GROUP MODAL */}
        <FullscreenModal
          open={modal === "group"}
          title={editing ? "Edit internship group" : "Create internship group"}
          description="Configure cohort identity, communication access and programme duration."
          close={() => setModal("")}
        >
          <form onSubmit={submitGroup} className="space-y-5">
            <div className={styles.formGrid}>
              <FormField label="Group name">
                <input
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="VELOop Internship · Cohort 01"
                />
              </FormField>

              <FormField label="WhatsApp group code">
                <input
                  required
                  value={form.whatsappGroupCode}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      whatsappGroupCode: event.target.value,
                    })
                  }
                  placeholder="Enter assigned group code"
                />
              </FormField>

              <FormField label="Planned start date">
                <input
                  type="date"
                  value={form.plannedStartDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      plannedStartDate: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Duration in days">
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={form.durationDays}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      durationDays: Number(event.target.value),
                    })
                  }
                />
              </FormField>

              <FormField label="Group description" className={styles.fieldFull}>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Add cohort instructions or internal notes..."
                />
              </FormField>
            </div>

            <div className={styles.formNotice}>
              <ShieldCheck size={18} />
              <p>
                Invitation links are generated securely by the backend. A
                completed group cannot accept new registrations.
              </p>
            </div>

            <div className={styles.modalActions}>
              <ActionButton onClick={() => setModal("")}>Cancel</ActionButton>

              <ActionButton tone="primary" type="submit" disabled={busy}>
                <Save size={15} />
                {busy ? "Saving..." : editing ? "Save changes" : "Create group"}
              </ActionButton>
            </div>
          </form>
        </FullscreenModal>

        {/* INVITATION MODAL */}
        <FullscreenModal
          open={modal === "invite"}
          title="Registration invitation"
          description={`Secure invitation for ${target?.name || "the selected group"}.`}
          close={() => setModal("")}
        >
          <div className={styles.invitePanel}>
            <div className={styles.inviteGraphic}>
              <LinkIcon size={25} />
            </div>

            <div>
              <strong>Your invitation link is ready</strong>
              <p>
                Share this link only with interns assigned to this cohort.
                Regenerating the link invalidates the previous one.
              </p>
            </div>

            <div className={styles.copyField}>
              <input readOnly value={inviteUrl} />
              <ActionButton
                tone="primary"
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  toast("Invitation link copied.");
                }}
              >
                <Copy size={15} /> Copy link
              </ActionButton>
            </div>
          </div>
        </FullscreenModal>

        {/* GROUP MEMBER DETAILS */}
        <FullscreenModal
          open={modal === "details"}
          title={target?.name || "Group members"}
          description="Interns assigned to this internship group."
          close={() => setModal("")}
        >
          <div className={styles.memberStats}>
            <Metric
              label="Assigned interns"
              value={groupInterns.length}
              note="Current membership"
              Icon={Users}
              tone="purple"
            />
            <Metric
              label="Group duration"
              value={`${target?.durationDays || 28} days`}
              note="Configured programme length"
              Icon={CalendarDays}
              tone="cyan"
            />
            <Metric
              label="Group status"
              value={getStatusLabel(target?.status)}
              note="Current lifecycle status"
              Icon={ShieldCheck}
              tone="green"
            />
          </div>

          <DataTable
            headers={["Intern", "Intern ID", "Domain", "Contact", "InternCash"]}
            minWidth={720}
            rows={groupInterns.map((intern) => (
              <tr key={intern._id}>
                <td>
                  <strong>{intern.name || "Unnamed intern"}</strong>
                  <small>{intern.email || "—"}</small>
                </td>
                <td className={styles.code}>{intern.internId || "—"}</td>
                <td>{intern.domain || "—"}</td>
                <td>{intern.whatsappNumber || "—"}</td>
                <td>{formatCurrency(intern.internCashBalance)}</td>
              </tr>
            ))}
          />

          {!groupInterns.length && (
            <EmptyState
              Icon={Users}
              title="No members in this group"
              description="No interns have joined this cohort yet."
            />
          )}

          <div className={styles.modalActions}>
            <ActionButton onClick={() => setModal("")}>Close</ActionButton>
            <ActionButton
              tone="primary"
              onClick={() => {
                const groupId = target?._id;
                setModal("");
                navigate(`/admin/interns?groupId=${groupId}`);
              }}
            >
              Open intern directory <ArrowUpRight size={15} />
            </ActionButton>
          </div>
        </FullscreenModal>
      </div>
    );
  }

  /* =========================================================
     ADMIN: INTERN DIRECTORY
  ========================================================== */

  if (path === "/admin/interns") {
    const visibleInterns = data;

    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="PEOPLE OPERATIONS / 02"
          title="Intern directory"
          description="Understand every intern's profile, programme dates, attendance progress and pending follow-up."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Refresh directory
            </ActionButton>
          }
        />

        <div className={styles.internHero}>
          <div className={styles.internHeroIcon}>
            <Users size={25} />
          </div>
          <div className="min-w-0 flex-1">
            <span>PEOPLE OVERVIEW</span>
            <strong>{formatNumber(data.length)} interns in this view</strong>
            <p>Filter by cohort or search for an individual intern.</p>
          </div>
          <div className={styles.internHeroMetric}>
            <strong>
              {formatNumber(
                data.filter((intern) => intern.isActive !== false).length,
              )}
            </strong>
            <span>Profiles available</span>
          </div>
        </div>

        <div className={styles.toolbar}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search name, email, intern ID, WhatsApp or domain..."
          />

          <FilterSelect
            label="Group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((group) => ({
              value: group._id,
              label: group.name,
            }))}
          />

          {/* ATTENDANCE RISK MONITOR */}
          <AttendanceRiskPanel
            interns={visibleInterns}
            attendance={attendanceRecords}
            loading={loading}
            onViewIntern={(intern) => {
              setTarget(intern);
              setModal("internAttendance");
            }}
          />
        </div>

        <div className={styles.internList}>
          {visibleInterns.map((intern) => {
            const summary = internSummary(intern);
            const attendanceLabel =
              summary.expected > 0
                ? `${summary.approved} / ${summary.expected}`
                : `${summary.approved} / —`;

            return (
              <article className={styles.internRow} key={intern._id}>
                <div className={styles.internIdentity}>
                  <div className={styles.internAvatar}>
                    {(intern.name || "I").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <strong>{intern.name || "Unnamed intern"}</strong>
                    <span>{intern.internId || "ID unavailable"}</span>
                    <small>{intern.email || "No email available"}</small>
                  </div>
                </div>

                <div className={styles.internInfo}>
                  <span>PROGRAMME</span>
                  <strong>{summary.group?.name || "Unassigned"}</strong>
                  <small>{intern.domain || "Domain not specified"}</small>
                </div>

                <div className={styles.internInfo}>
                  <span>PROGRAMME END</span>
                  <strong>{formatDate(summary.endDate)}</strong>
                  <small>
                    Started {formatDate(intern.internshipStartDate)}
                  </small>
                </div>

                <div className={styles.attendanceProgress}>
                  <div>
                    <span>ATTENDANCE</span>
                    <strong>{attendanceLabel}</strong>
                  </div>

                  <div className={styles.progressTrack}>
                    <span style={{ width: `${summary.completion}%` }} />
                  </div>

                  <div className={styles.progressNumbers}>
                    <small>{summary.completion}% approved</small>
                    <small>{summary.missed} missed</small>
                  </div>
                </div>

                <div className={styles.internFlags}>
                  <span className={styles.flagGood}>
                    <CheckCircle2 size={13} /> {summary.approved}
                  </span>
                  <span className={styles.flagMissed}>
                    <AlertTriangle size={13} /> {summary.missed}
                  </span>
                  <span className={styles.flagPending}>
                    <Clock3 size={13} /> {summary.pending}
                  </span>
                </div>

                <div className={styles.internActions}>
                  <ActionButton
                    onClick={() => {
                      setTarget(intern);
                      setModal("internAttendance");
                    }}
                  >
                    <CalendarCheck size={14} /> Details
                  </ActionButton>

                  <ActionButton
                    onClick={() => {
                      setTarget(intern);
                      setExtra({
                        ...extra,
                        transferTarget:
                          groups.find(
                            (group) =>
                              group.status !== "completed" &&
                              group._id !== (intern.group?._id || intern.group),
                          )?._id || "",
                        transferReason: "",
                      });
                      setModal("transfer");
                    }}
                  >
                    <ArrowUpRight size={14} /> Transfer
                  </ActionButton>
                </div>
              </article>
            );
          })}

          {!visibleInterns.length && (
            <EmptyState
              Icon={Users}
              title="No interns found"
              description="Try another search term or choose a different group."
            />
          )}
        </div>

        <FullscreenModal
          open={modal === "internAttendance"}
          title={target?.name || "Intern attendance profile"}
          description={`${target?.internId || "Intern profile"} · Detailed attendance and programme summary`}
          close={() => setModal("")}
        >
          {target && (
            <InternAttendanceDetails
              intern={target}
              summary={internSummary(target)}
            />
          )}
        </FullscreenModal>

        <FullscreenModal
          open={modal === "transfer"}
          title={`Transfer ${target?.name || "intern"}`}
          description="Move this intern into another active or registration group."
          close={() => setModal("")}
        >
          <form className="space-y-4" onSubmit={submitTransfer}>
            <div className={styles.formGrid}>
              <FormField label="Destination group">
                <select
                  required
                  value={extra.transferTarget || ""}
                  onChange={(event) =>
                    setExtra({ ...extra, transferTarget: event.target.value })
                  }
                >
                  <option value="">Choose a group</option>
                  {groups
                    .filter(
                      (group) =>
                        group.status !== "completed" &&
                        group._id !== (target?.group?._id || target?.group),
                    )
                    .map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Transfer reason" className={styles.fieldFull}>
                <textarea
                  rows={3}
                  value={extra.transferReason || ""}
                  onChange={(event) =>
                    setExtra({ ...extra, transferReason: event.target.value })
                  }
                  placeholder="Optional reason for audit history..."
                />
              </FormField>
            </div>

            <div className={styles.modalActions}>
              <ActionButton onClick={() => setModal("")}>Cancel</ActionButton>
              <ActionButton type="submit" tone="primary" disabled={busy}>
                <ArrowUpRight size={15} /> Transfer intern
              </ActionButton>
            </div>
          </form>
        </FullscreenModal>
      </div>
    );
  }

  /* =========================================================
     ADMIN: ATTENDANCE APPROVALS
  ========================================================== */

  if (path === "/admin/approvals") {
    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="ATTENDANCE CONTROL / 03"
          title="Approval queue"
          description="Review submissions, verify intern attendance and approve requests individually or in bulk."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Refresh queue
            </ActionButton>
          }
        />

        <div className={styles.metricsFour}>
          <Metric
            label="Awaiting review"
            value={pendingCount}
            note="Pending submissions"
            Icon={Clock3}
            tone="cyan"
          />
          <Metric
            label="Approved"
            value={totalApproved}
            note="Approved records in this view"
            Icon={CheckCircle2}
            tone="green"
          />
          <Metric
            label="Missed"
            value={totalMissed}
            note="Missed or corrected absent"
            Icon={AlertTriangle}
            tone="orange"
          />
          <Metric
            label="Rejected"
            value={totalRejected}
            note="Rejected submissions"
            Icon={X}
            tone="purple"
          />
        </div>

        <div className={styles.toolbar}>
          <FilterSelect
            label="Group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((group) => ({
              value: group._id,
              label: group.name,
            }))}
          />

          <FilterSelect
            label="Session"
            value={sessionFilter}
            onChange={setSessionFilter}
            options={[
              { value: "1", label: "Session 1" },
              { value: "2", label: "Session 2" },
            ]}
          />

          <span className={styles.resultCount}>
            <b>{data.length}</b> requests in queue
          </span>

          <ActionButton
            tone="success"
            disabled={!groupFilter || !data.length || busy}
            onClick={() => approve(true)}
          >
            <CheckCircle2 size={15} /> Approve group queue
          </ActionButton>
        </div>

        <section className={styles.contentPanel}>
          <SectionHeading
            eyebrow="REQUEST REVIEW"
            title="Submitted attendance"
            description="Select multiple records to approve them together."
          />

          <DataTable
            headers={[
              "Select",
              "Intern",
              "Group",
              "Date",
              "Session",
              "Submitted",
              "Status",
            ]}
            rows={data.map((record) => (
              <tr key={record._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(record._id)}
                    onChange={(event) =>
                      setSelected((previous) =>
                        event.target.checked
                          ? [...previous, record._id]
                          : previous.filter((id) => id !== record._id),
                      )
                    }
                  />
                </td>
                <td>
                  <strong>{record.intern?.name || "Unknown intern"}</strong>
                  <small>
                    {record.intern?.internId || "—"} ·{" "}
                    {record.intern?.email || "—"}
                  </small>
                </td>
                <td>{record.group?.name || "—"}</td>
                <td>{formatDate(record.dateKey)}</td>
                <td>
                  <span className={styles.sessionChip}>
                    Session {record.sessionNumber}
                  </span>
                </td>
                <td>{formatDateTime(record.markedAt || record.createdAt)}</td>
                <td>
                  <StatusBadge value={record.status} />
                </td>
              </tr>
            ))}
          />

          {!data.length && (
            <EmptyState
              Icon={CheckCircle2}
              title="The review queue is clear"
              description="No pending attendance requests match the selected filters."
            />
          )}

          {data.length > 0 && (
            <div className={styles.tableFooter}>
              <span>{selected.length} selected</span>
              <ActionButton
                tone="success"
                disabled={!selected.length || busy}
                onClick={() => approve(false)}
              >
                <Check size={15} /> Approve selected
              </ActionButton>
            </div>
          )}
        </section>
      </div>
    );
  }

  /* =========================================================
     ADMIN: ATTENDANCE REPORTS
  ========================================================== */

  if (path === "/admin/attendance") {
    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="ATTENDANCE INTELLIGENCE / 04"
          title="Attendance records"
          description="Explore session history, filter by date and cohort, and correct records with an auditable reason."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Refresh report
            </ActionButton>
          }
        />

        <div className={styles.metricsFour}>
          <Metric
            label="Total records"
            value={data.length}
            note="Returned report records"
            Icon={CalendarDays}
            tone="cyan"
          />
          <Metric
            label="Approved"
            value={totalApproved}
            note="Present sessions"
            Icon={CheckCircle2}
            tone="green"
          />
          <Metric
            label="Missed"
            value={totalMissed}
            note="Absent sessions"
            Icon={AlertTriangle}
            tone="orange"
          />
          <Metric
            label="Pending"
            value={pendingCount}
            note="Awaiting review"
            Icon={Clock3}
            tone="purple"
          />
        </div>

        <div className={styles.toolbar}>
          <FilterSelect
            label="Group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((group) => ({
              value: group._id,
              label: group.name,
            }))}
          />

          <FormField label="From">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </FormField>

          <FormField label="To">
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </FormField>

          <FilterSelect
            label="Session"
            value={sessionFilter}
            onChange={setSessionFilter}
            options={[
              { value: "1", label: "Session 1" },
              { value: "2", label: "Session 2" },
            ]}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "missed", label: "Missed" },
              { value: "rejected", label: "Rejected" },
              { value: "admin_corrected_present", label: "Corrected present" },
              { value: "admin_corrected_absent", label: "Corrected absent" },
            ]}
          />

          <ActionButton tone="primary" onClick={load}>
            <Filter size={15} /> Apply filters
          </ActionButton>
        </div>

        {/* <section className={styles.contentPanel}>
          <SectionHeading
            eyebrow="SESSION AUDIT"
            title="Attendance history"
            description={`${data.length.toLocaleString("en-IN")} records returned by the selected filters.`}
          />

          <AttendanceRecordTable
            records={data}
            loading={loading}
            onCorrect={(record) => {
              setCorrection({
                internId: record.intern?.internId || record.intern?._id || "",
                date: record.dateKey,
                status: "admin_corrected_present",
                reason: "",
                sessionNumber: record.sessionNumber,
              });

              setModal("correction");
            }}
          />

          {!data.length && (
            <EmptyState
              Icon={CalendarDays}
              title="No attendance records"
              description="Change the filters or date range to explore another period."
            />
          )}
        </section> */}
        <AttendanceRecordTable
          records={data}
          loading={loading}
          onCorrect={(record) => {
            setCorrection({
              internId: record.intern?.internId || record.intern?._id || "",
              date: record.dateKey,
              status: "admin_corrected_present",
              reason: "",
              sessionNumber: record.sessionNumber,
            });

            setModal("correction");
          }}
        />

        <FullscreenModal
          open={modal === "correction"}
          title="Correct attendance record"
          description="A reason is required for every administrative correction."
          close={() => setModal("")}
        >
          <form onSubmit={submitCorrection} className="space-y-5">
            <div className={styles.formGrid}>
              <FormField label="Intern ID">
                <input
                  required
                  value={correction.internId}
                  onChange={(event) =>
                    setCorrection({
                      ...correction,
                      internId: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Attendance date">
                <input
                  required
                  type="date"
                  value={correction.date}
                  onChange={(event) =>
                    setCorrection({ ...correction, date: event.target.value })
                  }
                />
              </FormField>

              <FormField label="Session">
                <select
                  value={correction.sessionNumber}
                  onChange={(event) =>
                    setCorrection({
                      ...correction,
                      sessionNumber: Number(event.target.value),
                    })
                  }
                >
                  <option value={1}>Session 1</option>
                  <option value={2}>Session 2</option>
                </select>
              </FormField>

              <FormField label="Corrected status">
                <select
                  value={correction.status}
                  onChange={(event) =>
                    setCorrection({ ...correction, status: event.target.value })
                  }
                >
                  <option value="admin_corrected_present">Present</option>
                  <option value="admin_corrected_absent">Absent</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </FormField>

              <FormField
                label="Reason for correction"
                className={styles.fieldFull}
              >
                <textarea
                  required
                  minLength={3}
                  rows={4}
                  value={correction.reason}
                  onChange={(event) =>
                    setCorrection({ ...correction, reason: event.target.value })
                  }
                  placeholder="Explain why this attendance record needs correction..."
                />
              </FormField>
            </div>

            <div className={styles.modalActions}>
              <ActionButton onClick={() => setModal("")}>Cancel</ActionButton>
              <ActionButton tone="primary" type="submit" disabled={busy}>
                <Save size={15} /> Save correction
              </ActionButton>
            </div>
          </form>
        </FullscreenModal>
      </div>
    );
  }

  /* =========================================================
     ADMIN: WALLET LEDGER
  ========================================================== */

  if (path === "/admin/wallet") {
    const displayedInterns = walletInterns.filter((intern) => {
      const term = walletInternFilter.toLowerCase();

      return (
        !term ||
        String(intern.name || "")
          .toLowerCase()
          .includes(term) ||
        String(intern.internId || "")
          .toLowerCase()
          .includes(term) ||
        String(intern.email || "")
          .toLowerCase()
          .includes(term)
      );
    });

    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="FINANCIAL OPERATIONS / 05"
          title="InternCash ledger"
          description="Review each intern's balance, inspect transactions and make traceable balance adjustments."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Refresh ledger
            </ActionButton>
          }
        />

        <div className={styles.walletHero}>
          <div className={styles.walletHeroIcon}>
            <Wallet size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <span>WALLET PORTFOLIO</span>
            <strong>{formatCurrency(walletTotalBalance)}</strong>
            <p>Combined balance across the interns currently in this view.</p>
          </div>
          <div className={styles.walletHeroStats}>
            <div>
              <strong>{walletInterns.length}</strong>
              <span>Interns</span>
            </div>
            <div>
              <strong>{data.length}</strong>
              <span>Transactions</span>
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <FilterSelect
            label="Group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((group) => ({
              value: group._id,
              label: group.name,
            }))}
          />

          <SearchField
            value={walletInternFilter}
            onChange={setWalletInternFilter}
            placeholder="Find an intern by name, email or ID..."
          />
        </div>

        <section className={styles.contentPanel}>
          <SectionHeading
            eyebrow="GROUP INTERN LEDGER"
            title="Balances by intern"
            description="Select an intern to inspect their transaction history or adjust their balance."
          />

          <div className={styles.walletInternGrid}>
            {displayedInterns.map((intern) => {
              const count = walletTransactionCount(intern);
              const selected =
                getInternKey(selectedWalletIntern) === getInternKey(intern);

              return (
                <article
                  key={intern._id}
                  className={`${styles.walletInternCard} ${selected ? styles.walletInternSelected : ""}`}
                >
                  <div className={styles.walletInternTop}>
                    <span className={styles.walletAvatar}>
                      {(intern.name || "I").charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <strong>{intern.name || "Unnamed intern"}</strong>
                      <small>{intern.internId || "—"}</small>
                    </div>

                    <span className={styles.walletBalance}>
                      {formatCurrency(intern.internCashBalance)}
                    </span>
                  </div>

                  <div className={styles.walletInternMeta}>
                    <span>
                      <Users size={12} /> {intern.group?.name || "Unassigned"}
                    </span>
                    <span>
                      <Activity size={12} /> {count} transactions
                    </span>
                  </div>

                  <div className={styles.walletInternActions}>
                    <ActionButton
                      onClick={() => setSelectedWalletIntern(intern)}
                    >
                      <Activity size={14} /> History
                    </ActionButton>

                    <ActionButton
                      tone="primary"
                      onClick={() => openAdjustment(intern)}
                    >
                      <Plus size={14} /> Adjust balance
                    </ActionButton>
                  </div>
                </article>
              );
            })}
          </div>

          {!displayedInterns.length && (
            <EmptyState
              Icon={Wallet}
              title="No interns in this selection"
              description="Choose another group or clear your search."
            />
          )}
        </section>

        <section className={styles.contentPanel}>
          <SectionHeading
            eyebrow="TRANSACTION HISTORY"
            title={
              selectedWalletIntern
                ? `${selectedWalletIntern.name}'s transactions`
                : "Recent transactions"
            }
            description={
              selectedWalletIntern
                ? `Ledger entries for ${selectedWalletIntern.internId || "this intern"}.`
                : "Select an intern above to filter the ledger to their account."
            }
            action={
              selectedWalletIntern && (
                <ActionButton onClick={() => setSelectedWalletIntern(null)}>
                  <X size={14} /> Clear selection
                </ActionButton>
              )
            }
          />

          <DataTable
            headers={[
              "Intern",
              "Group",
              "Date",
              "Transaction",
              "Amount",
              "Balance after",
            ]}
            rows={[...selectedWalletTransactions]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((transaction) => (
                <tr key={transaction._id}>
                  <td>
                    <strong>{transaction.intern?.name || "—"}</strong>
                    <small>{transaction.intern?.internId || "—"}</small>
                  </td>
                  <td>
                    {transaction.group?.name ||
                      transaction.intern?.group?.name ||
                      "—"}
                  </td>
                  <td>{formatDateTime(transaction.createdAt)}</td>
                  <td>
                    <strong>
                      {transaction.description ||
                        transaction.type ||
                        "Wallet transaction"}
                    </strong>
                    <small>{transaction.reference || "No reference"}</small>
                  </td>
                  <td>
                    <span
                      className={
                        Number(transaction.amount) >= 0
                          ? styles.amountPositive
                          : styles.amountNegative
                      }
                    >
                      {Number(transaction.amount) > 0 ? "+" : ""}
                      {formatNumber(transaction.amount)} IC
                    </span>
                  </td>
                  <td>{formatCurrency(transaction.balanceAfter)}</td>
                </tr>
              ))}
          />

          {!selectedWalletTransactions.length && (
            <EmptyState
              Icon={Activity}
              title="No transactions found"
              description="No wallet transactions match the selected intern or group."
            />
          )}
        </section>

        <FullscreenModal
          open={modal === "adjust"}
          title="Adjust intern balance"
          description="Every adjustment is stored as a wallet transaction with an audit reference."
          close={() => setModal("")}
        >
          <form onSubmit={submitAdjustment} className="space-y-5">
            {target && (
              <div className={styles.adjustTarget}>
                <span className={styles.walletAvatar}>
                  {(target.name || "I").charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{target.name}</strong>
                  <small>
                    {target.internId} · Current balance{" "}
                    {formatCurrency(target.internCashBalance)}
                  </small>
                </div>
              </div>
            )}

            <div className={styles.formGrid}>
              <FormField label="Intern ID">
                <input
                  required
                  value={adjust.internId}
                  onChange={(event) =>
                    setAdjust({ ...adjust, internId: event.target.value })
                  }
                />
              </FormField>

              <FormField label="Adjustment amount (whole IC)">
                <input
                  type="number"
                  required
                  step="1"
                  min="-100000"
                  max="100000"
                  value={adjust.amount}
                  onChange={(event) =>
                    setAdjust({
                      ...adjust,
                      amount: Number(event.target.value),
                    })
                  }
                />
              </FormField>

              <FormField
                label="Reason for adjustment"
                className={styles.fieldFull}
              >
                <textarea
                  required
                  minLength={3}
                  rows={4}
                  value={adjust.reason}
                  onChange={(event) =>
                    setAdjust({ ...adjust, reason: event.target.value })
                  }
                  placeholder="Describe why this balance is being credited or debited..."
                />
              </FormField>
            </div>

            <div className={styles.formNotice}>
              <ShieldCheck size={17} />
              <p>
                The backend rejects zero, fractional and negative-result
                adjustments. A non-empty reason is required.
              </p>
            </div>

            <div className={styles.modalActions}>
              <ActionButton onClick={() => setModal("")}>Cancel</ActionButton>
              <ActionButton
                tone="primary"
                type="submit"
                disabled={busy || !adjust.amount}
              >
                <Save size={15} /> Record adjustment
              </ActionButton>
            </div>
          </form>
        </FullscreenModal>
      </div>
    );
  }

  /* =========================================================
     ADMIN: PROMO CODES
  ========================================================== */

  if (path === "/admin/promos") {
    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="REWARDS & ENGAGEMENT / 06"
          title="Promo campaigns"
          description="Create group-specific reward codes, control redemption limits and monitor promo performance."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Refresh
            </ActionButton>
          }
        />

        <section className={styles.composerPanel}>
          <div className={styles.composerIntro}>
            <span className={`${styles.composerIcon} ${styles.composerPurple}`}>
              <TicketPercent size={22} />
            </span>
            <div>
              <span>CAMPAIGN BUILDER</span>
              <h2>Create a promo code</h2>
              <p>
                Configure the reward range, group audience and redemption cap.
              </p>
            </div>
          </div>

          <form onSubmit={submitPromo} className={styles.formGrid}>
            <FormField label="Target group">
              <select
                value={promo.groupId}
                onChange={(event) =>
                  setPromo({ ...promo, groupId: event.target.value })
                }
                required
              >
                <option value="">Choose a group</option>
                {groups
                  .filter((group) => group.status !== "completed")
                  .map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Custom promo code (optional)">
              <input
                value={promo.code}
                onChange={(event) =>
                  setPromo({
                    ...promo,
                    code: event.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. VELOOPWELCOME"
              />
            </FormField>

            <FormField label="Minimum reward (IC)">
              <input
                type="number"
                min="1"
                required
                value={promo.minReward}
                onChange={(event) =>
                  setPromo({
                    ...promo,
                    minReward: Number(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField label="Maximum reward (IC)">
              <input
                type="number"
                min={promo.minReward}
                required
                value={promo.maxReward}
                onChange={(event) =>
                  setPromo({
                    ...promo,
                    maxReward: Number(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField label="Maximum redemptions">
              <input
                type="number"
                min="1"
                required
                value={promo.maxRedemptions}
                onChange={(event) =>
                  setPromo({
                    ...promo,
                    maxRedemptions: Number(event.target.value),
                  })
                }
              />
            </FormField>

            <FormField label="Expiry (optional)">
              <input
                type="datetime-local"
                value={promo.expiresAt}
                onChange={(event) =>
                  setPromo({ ...promo, expiresAt: event.target.value })
                }
              />
            </FormField>

            <div className={styles.formBottom}>
              <p>
                <ShieldCheck size={15} />
                Promo creation is recorded by the server.
              </p>
              <ActionButton type="submit" tone="primary" disabled={busy}>
                <Plus size={16} /> {busy ? "Creating..." : "Create promo code"}
              </ActionButton>
            </div>
          </form>
        </section>

        <section className={styles.contentPanel}>
          <SectionHeading
            eyebrow="CAMPAIGN HISTORY"
            title="Promo code directory"
            description="Track group allocation, rewards, redemptions and current status."
            action={
              <span className={styles.countPill}>{data.length} codes</span>
            }
          />

          <DataTable
            headers={[
              "Promo code",
              "Group",
              "Reward range",
              "Redemptions",
              "Expiry",
              "Status",
              "Action",
            ]}
            rows={data.map((code) => (
              <tr key={code._id}>
                <td>
                  <div className={styles.copyCode}>
                    <strong>{code.code}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(code.code);
                        toast("Promo code copied.");
                      }}
                      title="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </td>
                <td>{code.group?.name || "—"}</td>
                <td>
                  {code.minReward}–{code.maxReward} IC
                </td>
                <td>
                  {code.redemptionCount || 0} / {code.maxRedemptions}
                </td>
                <td>{formatDate(code.expiresAt)}</td>
                <td>
                  <StatusBadge value={code.active ? "active" : "expired"} />
                </td>
                <td>
                  {code.active && (
                    <ActionButton
                      tone="danger"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            api(`/promo-codes/${code._id}/expire`, {
                              method: "POST",
                              body: {},
                            }),
                          "Promo code expired.",
                        )
                      }
                    >
                      <X size={13} /> Expire
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          />

          {!data.length && (
            <EmptyState
              Icon={TicketPercent}
              title="No promo campaigns yet"
              description="Create your first group promo code using the campaign builder above."
            />
          )}
        </section>
      </div>
    );
  }

  /* =========================================================
     ADMIN: BROADCAST CENTRE
  ========================================================== */

  if (path === "/admin/notifications") {
    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="COMMUNICATION / 07"
          title="Broadcast centre"
          description="Send programme announcements to every intern or target a specific group."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Refresh
            </ActionButton>
          }
        />

        <div className={styles.broadcastHero}>
          <div className={styles.broadcastIcon}>
            <MessageSquare size={25} />
          </div>
          <div>
            <span>COMMUNITY COMMUNICATION</span>
            <h2>One message. The right audience.</h2>
            <p>
              Keep interns informed about schedules, programme updates and
              important actions.
            </p>
          </div>
        </div>

        <section className={styles.composerPanel}>
          <div className={styles.composerIntro}>
            <span className={`${styles.composerIcon} ${styles.composerOrange}`}>
              <Bell size={22} />
            </span>
            <div>
              <span>NEW ANNOUNCEMENT</span>
              <h2>Compose a broadcast</h2>
              <p>Write a clear message and select who should receive it.</p>
            </div>
          </div>

          <form onSubmit={submitNotice} className={styles.formGrid}>
            <FormField label="Notification title" className={styles.fieldFull}>
              <input
                minLength={3}
                required
                value={message.title}
                onChange={(event) =>
                  setMessage({ ...message, title: event.target.value })
                }
                placeholder="Important internship update"
              />
            </FormField>

            <FormField label="Message" className={styles.fieldFull}>
              <textarea
                rows={5}
                required
                minLength={3}
                value={message.message}
                onChange={(event) =>
                  setMessage({ ...message, message: event.target.value })
                }
                placeholder="Write your announcement..."
              />
            </FormField>

            <FormField label="Audience">
              <select
                value={message.targetGroupId}
                onChange={(event) =>
                  setMessage({ ...message, targetGroupId: event.target.value })
                }
              >
                <option value="all">All groups</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Optional action link">
              <input
                type="url"
                value={message.link}
                onChange={(event) =>
                  setMessage({ ...message, link: event.target.value })
                }
                placeholder="https://..."
              />
            </FormField>

            <div className={styles.formBottom}>
              <p>
                <ShieldCheck size={15} />
                Review the audience before sending.
              </p>
              <ActionButton tone="primary" type="submit" disabled={busy}>
                <Bell size={15} /> {busy ? "Sending..." : "Send broadcast"}
              </ActionButton>
            </div>
          </form>
        </section>

        <section className={styles.contentPanel}>
          <SectionHeading
            eyebrow="MESSAGE HISTORY"
            title="Previous broadcasts"
            description="Review the messages that have been sent to your internship community."
            action={
              <span className={styles.countPill}>{data.length} messages</span>
            }
          />

          <div className={styles.broadcastList}>
            {data.map((notification) => (
              <article className={styles.broadcastRow} key={notification._id}>
                <span className={styles.broadcastRowIcon}>
                  <Bell size={19} />
                </span>

                <div className="min-w-0 flex-1">
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>

                  <div className={styles.broadcastMeta}>
                    <span>
                      <Users size={12} />{" "}
                      {notification.targetGroup?.name || "All groups"}
                    </span>
                    <span>
                      <CalendarDays size={12} />{" "}
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>

                  {notification.link && (
                    <a
                      href={notification.link}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.broadcastLink}
                    >
                      Open attached link <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                <ActionButton
                  tone="danger"
                  onClick={() =>
                    run(
                      () =>
                        api(`/notifications/${notification._id}`, {
                          method: "DELETE",
                        }),
                      "Notification deleted.",
                    )
                  }
                >
                  <Trash2 size={14} /> Delete
                </ActionButton>
              </article>
            ))}

            {!data.length && (
              <EmptyState
                Icon={Bell}
                title="No broadcasts sent"
                description="Your sent notifications will appear here."
              />
            )}
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================
     ADMIN: PORTAL SETTINGS
  ========================================================== */

  if (path === "/admin/settings") {
    return (
      <div className={`${styles.page} min-h-[90vh] space-y-6`}>
        <PageHeading
          eyebrow="SYSTEM CONFIGURATION / 08"
          title="Portal settings"
          description="Configure attendance windows, verification timing and intern device restrictions."
          actions={
            <ActionButton onClick={load}>
              <RefreshCw size={15} /> Reload settings
            </ActionButton>
          }
        />

        <section className={styles.settingsHero}>
          <span>
            <SettingsIcon />
          </span>
          <div>
            <strong>Configure the rules of your programme.</strong>
            <p>
              Changes here affect attendance availability across internship
              groups.
            </p>
          </div>
          <StatusBadge value="protected" />
        </section>

        <form onSubmit={saveSettings} className="space-y-5">
          <section className={styles.settingsPanel}>
            <div className={styles.settingsPanelHead}>
              <span className={`${styles.settingsIcon} ${styles.settingsCyan}`}>
                <Clock3 size={21} />
              </span>
              <div>
                <span>ATTENDANCE WINDOWS</span>
                <h2>Daily session schedule</h2>
                <p>All times use India Standard Time (IST).</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <FormField label="Session 1 starts">
                <input
                  type="time"
                  value={settings.firstStart}
                  onChange={(event) =>
                    setSettings({ ...settings, firstStart: event.target.value })
                  }
                />
              </FormField>

              <FormField label="Session 1 ends">
                <input
                  type="time"
                  value={settings.firstEnd}
                  onChange={(event) =>
                    setSettings({ ...settings, firstEnd: event.target.value })
                  }
                />
              </FormField>

              <FormField label="Session 2 starts">
                <input
                  type="time"
                  value={settings.secondStart}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      secondStart: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Session 2 ends">
                <input
                  type="time"
                  value={settings.secondEnd}
                  onChange={(event) =>
                    setSettings({ ...settings, secondEnd: event.target.value })
                  }
                />
              </FormField>

              <FormField label="Minimum page time (seconds)">
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={settings.minimumSeconds}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      minimumSeconds: Number(event.target.value),
                    })
                  }
                />
              </FormField>
            </div>

            <div className={styles.schedulePreview}>
              <div>
                <span>SESSION 01</span>
                <strong>
                  {settings.firstStart} – {settings.firstEnd}
                </strong>
              </div>
              <ArrowRight size={17} />
              <div>
                <span>SESSION 02</span>
                <strong>
                  {settings.secondStart} – {settings.secondEnd}
                </strong>
              </div>
            </div>
          </section>

          <section className={styles.settingsPanel}>
            <div className={styles.settingsPanelHead}>
              <span
                className={`${styles.settingsIcon} ${styles.settingsPurple}`}
              >
                <ShieldCheck size={21} />
              </span>
              <div>
                <span>ACCESS CONTROL</span>
                <h2>Intern device restrictions</h2>
                <p>
                  Control whether attendance marking requires a large screen.
                </p>
              </div>
            </div>

            <label className={styles.settingToggle}>
              <span className={styles.toggleCopy}>
                <strong>Require desktop for attendance</strong>
                <small>
                  Attendance is restricted to viewports of at least 1300px.
                  Admin access is not restricted by this setting.
                </small>
              </span>

              <input
                type="checkbox"
                checked={Boolean(settings.onlyDesktopAccess)}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    onlyDesktopAccess: event.target.checked,
                  })
                }
              />

              <span className={styles.toggleVisual} />
            </label>
          </section>

          <div className={styles.settingsSaveBar}>
            <div>
              <ShieldCheck size={18} />
              <span>Settings are saved to the backend.</span>
            </div>

            <ActionButton type="submit" tone="primary" disabled={busy}>
              <Save size={16} /> {busy ? "Saving..." : "Save all settings"}
            </ActionButton>
          </div>
        </form>
      </div>
    );
  }

  /* =========================================================
     POLICIES & HELP
  ========================================================== */

  return (
    <div className={`${styles.page} min-h-[90vh] space-y-6`}>
      <PageHeading
        eyebrow="VELoop REWARDS / INFORMATION"
        title={title}
        description="Programme information, privacy, platform conditions and support guidance."
      />

      <div className={styles.policyList}>
        <section>
          <h2>Privacy policy</h2>
          <p>
            We collect the details needed to verify internship eligibility,
            manage attendance, communicate group updates, and maintain reward
            records: name, verified email, intern ID, WhatsApp contact, group,
            domain, attendance sessions, and wallet transactions. Offer records
            are checked against the official offer-letter generator. Access is
            role-based and administrative actions should be limited to
            authorized admins. Do not share passwords or invitation links
            publicly.
          </p>
        </section>
        <section>
          <h2>Terms & conditions</h2>
          <p>
            The portal is provided to support the internship programme. Interns
            must provide accurate information, use only their assigned account,
            follow attendance time windows, remain on the attendance page for
            the required verification period, and never attempt to falsify
            attendance or rewards. Attendance requests remain pending until an
            authorized admin approves them. The programme team may correct
            records, suspend misuse, update schedules, or close a group through
            the defined approval workflow.
          </p>
        </section>
        <section>
          <h2>Refund & certification processing charges</h2>
          <p>
            Joining the internship is separate from any optional certificate
            processing or operational charge communicated by VELoop Rewards. Any
            charge must be clearly disclosed before payment with its purpose and
            coverage. Where a certificate-processing service has already been
            initiated or a digital certificate has been issued, the processing
            charge is non-refundable, except where applicable law requires
            otherwise or the payment was collected in error. Contact the
            official programme team for payment disputes or corrections. Do not
            submit payment credentials in this portal.
          </p>
        </section>
        <section>
          <h2>Charges policy</h2>
          <p>
            Attendance, account creation and InternCash balances are recorded
            according to programme rules and are not a cash deposit. Any
            certification processing charge is distinct from rewards and must be
            communicated separately. The portal currently does not process
            certification payments; certification workflow remains subject to
            programme admin instructions.
          </p>
        </section>
        <section>
          <h2>Cookies & session security</h2>
          <p>
            The portal stores an authentication token in browser local storage
            to maintain your signed-in session. Sign out on shared devices, keep
            your browser updated, and never share your account. Avoid using
            public computers for sensitive account actions.
          </p>
        </section>
        <section>
          <h2>Contact & support</h2>
          <p>
            For account verification, attendance approval, group assignment, or
            policy questions, contact your internship group admin through the
            official WhatsApp group.
          </p>
        </section>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return <ShieldCheck size={21} />;
}
