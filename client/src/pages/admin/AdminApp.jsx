import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Download,
  Edit3,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  Users,
  Wallet,
  X,
  AlertTriangle,
  Clock3,
  Send,
  UserRoundCog,
  Archive,
  CalendarClock,
  Menu,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./AdminApp.module.css";
import {
  LegalFooter,
  LegalRoutePage,
} from "../../components/legal/LegalPages.jsx";
import { api, apiUrl } from "../../lib/api.js";
import OverviewPage from "./pages/OverviewPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import InternsPage from "./pages/InternsPage.jsx";
import ApprovalsPage from "./pages/ApprovalsPage.jsx";
import WalletPage from "./pages/WalletPage.jsx";
import PromosPage from "./pages/PromosPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";

import { dateToday } from "../../lib/session.js";
import { Field, Stat } from "../../components/ui/Primitives.jsx";
import { ActionOverlay, PageSkeleton } from "../../components/ui/Loading.jsx";
import WalletAdmin from "./WalletAdmin.jsx";
import AdminSidebar from "./components/AdminSidebar.jsx";

const NAV = [
  ["overview", "Overview", LayoutDashboard],
  ["groups", "Groups & invites", Users],
  ["interns", "Intern directory", ClipboardList],
  ["approvals", "Attendance approvals", ClipboardCheck],
  ["attendance", "Attendance reports", CalendarCheck],
  ["wallet", "InternCash ledger", Wallet],
  ["promos", "Promo codes", Gift],
  ["notifications", "Notifications", Bell],
  ["settings", "Attendance timings", CalendarClock],
];
const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const inputDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";
const csvDownload = async (path, token, method = "GET") => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const d = await response.json().catch(() => ({}));
    throw new Error(d.message || `Export failed (${response.status})`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ||
    `VELOop-Archive-Latest-${dateToday()}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
function AdminApp({
  session,
  tab,
  setTab,
  notify,
  onLogout,
  theme,
  onToggleTheme,
}) {
  const [overview, setOverview] = useState(null),
    [groups, setGroups] = useState([]),
    [interns, setInterns] = useState([]),
    [codes, setCodes] = useState([]),
    [attendance, setAttendance] = useState([]),
    [approvals, setApprovals] = useState([]),
    [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState(""),
    [selectedGroup, setSelectedGroup] = useState(""),
    [selectedDetail, setSelectedDetail] = useState(""),
    [groupMembers, setGroupMembers] = useState([]),
    [createdInvite, setCreatedInvite] = useState(""),
    [inviteGroup, setInviteGroup] = useState(""),
    [editGroup, setEditGroup] = useState(null),
    [groupForm, setGroupForm] = useState({
      name: "",
      description: "",
      whatsappGroupCode: "",
      plannedStartDate: "",
      durationDays: 28,
    });
  const [promoForm, setPromoForm] = useState({
    groupId: "",
    code: "",
    minReward: 5,
    maxReward: 20,
    maxRedemptions: 30,
    expiresAt: "",
  });
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    message: "",
    targetGroupId: "all",
    link: "",
  });
  const [completionPassword, setCompletionPassword] = useState(""),
    [approvePassword, setApprovePassword] = useState(""),
    [completionGroup, setCompletionGroup] = useState(null);
  const [dateFrom, setDateFrom] = useState(""),
    [dateTo, setDateTo] = useState(""),
    [reportStatus, setReportStatus] = useState(""),
    [reportGroup, setReportGroup] = useState(""),
    [reportSession, setReportSession] = useState("");
  const [correction, setCorrection] = useState({
    internId: "",
    date: dateToday(),
    sessionNumber: 1,
    status: "approved",
    reason: "",
  });
  const [transfer, setTransfer] = useState({ internId: "", targetGroupId: "" });
  const [selectedApprovals, setSelectedApprovals] = useState([]),
    [approvalGroup, setApprovalGroup] = useState(""),
    [approvalSession, setApprovalSession] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    firstStart: "09:30",
    firstEnd: "12:30",
    secondStart: "13:00",
    secondEnd: "15:30",
    minimumSeconds: 50,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [busyLabel, setBusyLabel] = useState(""),
    [error, setError] = useState("");
  const refresh = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [o, g, i, p, a, n, w] = await Promise.all([
          api("/admin/overview", { token: session.token }),
          api("/groups", { token: session.token }),
          api("/admin/interns", { token: session.token }),
          api("/promo-codes", { token: session.token }),
          api("/attendance/admin/report", { token: session.token }),
          api("/notifications", { token: session.token }),
          api("/wallet/admin/transactions", { token: session.token }),
        ]);
        setOverview(o);
        setGroups(g.groups || []);
        setInterns(i.interns || []);
        setCodes(p.codes || []);
        setAttendance(a.records || []);
        setNotifications(n.notifications || []);
        setError("");
      } catch (e) {
        setError(e.message);
        notify(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session.token, notify],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);
  const run = async (label, fn) => {
    setBusyLabel(label);
    setError("");
    try {
      await fn();
    } catch (e) {
      notify(e.message || "Something went wrong.");
      setError(e.message);
    } finally {
      setBusyLabel("");
    }
  };
  const loadSchedule = useCallback(async () => {
    try {
      const d = await api("/admin/settings/attendance", {
        token: session.token,
      });
      setScheduleForm(d.settings);
    } catch (e) {
      notify(e.message);
    }
  }, [session.token, notify]);
  useEffect(() => {
    if (tab === "settings") loadSchedule();
  }, [tab, loadSchedule]);
  const saveSchedule = async (e) => {
    e.preventDefault();
    await run("Updating attendance timings…", async () => {
      const d = await api("/admin/settings/attendance", {
        token: session.token,
        method: "PATCH",
        body: JSON.stringify({
          ...scheduleForm,
          minimumSeconds: Number(scheduleForm.minimumSeconds),
        }),
      });
      setScheduleForm(d.settings);
      notify(d.message);
    });
  };
  const loadInterns = useCallback(async () => {
    setRefreshing(true);
    try {
      const d = await api(
        `/admin/interns?q=${encodeURIComponent(query)}${selectedGroup ? `&groupId=${selectedGroup}` : ""}`,
        { token: session.token },
      );
      setInterns(d.interns || []);
    } catch (e) {
      notify(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [query, selectedGroup, session.token, notify]);
  useEffect(() => {
    if (tab !== "interns") return;
    const t = setTimeout(loadInterns, 280);
    return () => clearTimeout(t);
  }, [tab, query, selectedGroup, loadInterns]);
  const loadReport = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (reportGroup) params.set("groupId", reportGroup);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (reportStatus) params.set("status", reportStatus);
      if (reportSession) params.set("sessionNumber", reportSession);
      const d = await api(`/attendance/admin/report?${params.toString()}`, {
        token: session.token,
      });
      setAttendance(d.records || []);
    } catch (e) {
      notify(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [
    reportGroup,
    dateFrom,
    dateTo,
    reportStatus,
    reportSession,
    session.token,
    notify,
  ]);
  useEffect(() => {
    if (tab !== "attendance") return;
    const t = setTimeout(loadReport, 250);
    return () => clearTimeout(t);
  }, [tab, loadReport]);
  const loadApprovals = useCallback(async () => {
    setRefreshing(true);
    try {
      const p = new URLSearchParams();
      if (approvalGroup) p.set("groupId", approvalGroup);
      if (approvalSession) p.set("sessionNumber", approvalSession);
      const d = await api(`/attendance/admin/approvals?${p}`, {
        token: session.token,
      });
      setApprovals(d.records || []);
      setSelectedApprovals([]);
    } catch (e) {
      notify(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [approvalGroup, approvalSession, session.token, notify]);
  useEffect(() => {
    if (tab !== "approvals") return;
    loadApprovals();
  }, [tab, loadApprovals]);
  const createGroup = async (e) => {
    e.preventDefault();
    await run("Creating secure group…", async () => {
      const d = await api("/groups", {
        token: session.token,
        method: "POST",
        body: JSON.stringify({
          ...groupForm,
          durationDays: Number(groupForm.durationDays),
        }),
      });
      const invite = `${window.location.origin}/?invite=${d.inviteToken}`;
      setCreatedInvite(invite);
      setInviteGroup(d.group._id);
      setGroupForm({
        name: "",
        description: "",
        whatsappGroupCode: "",
        plannedStartDate: "",
        durationDays: 28,
      });
      notify(
        "Group created. Invitation link is saved securely and can be retrieved any time.",
      );
      await refresh(true);
    });
  };
  const getInvite = async (g) =>
    run("Retrieving invitation link…", async () => {
      const d = await api(`/groups/${g._id}/invite`, { token: session.token });
      setCreatedInvite(`${window.location.origin}/?invite=${d.inviteToken}`);
      setInviteGroup(g._id);
      notify("Current invitation link retrieved.");
    });
  const resetInvite = async (g) => {
    if (
      !window.confirm(
        `Reset the invitation for “${g.name}”? The previous link will stop working immediately.`,
      )
    )
      return;
    await run("Resetting invitation link…", async () => {
      const d = await api(`/groups/${g._id}/regenerate-invite`, {
        token: session.token,
        method: "POST",
        body: "{}",
      });
      setCreatedInvite(`${window.location.origin}/?invite=${d.inviteToken}`);
      setInviteGroup(g._id);
      notify("Invitation reset. The previous link is now invalid.");
      await refresh(true);
    });
  };
  const startGroup = async (g) => {
    const startDate = g.plannedStartDate
      ? inputDate(g.plannedStartDate)
      : dateToday();
    if (
      !window.confirm(
        `Start ${g.name} from ${fmtDate(startDate)} for ${g.durationDays || 28} days?`,
      )
    )
      return;
    await run("Starting internship group…", async () => {
      await api(`/groups/${g._id}/start`, {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ actualStartDate: startDate }),
      });
      notify(
        "Group started. Intern attendance is now enabled according to the schedule.",
      );
      await refresh(true);
    });
  };
  const saveGroup = async (e) => {
    e.preventDefault();
    if (!editGroup) return;
    await run("Saving group details…", async () => {
      await api(`/groups/${editGroup._id}`, {
        token: session.token,
        method: "PATCH",
        body: JSON.stringify({
          ...editGroup,
          durationDays: Number(editGroup.durationDays),
          plannedStartDate: editGroup.plannedStartDate || null,
          actualStartDate: editGroup.actualStartDate || null,
        }),
      });
      setEditGroup(null);
      notify("Group details updated.");
      await refresh(true);
    });
  };
  const requestCompletion = async (e) => {
    e.preventDefault();
    if (!completionGroup) return;
    await run("Submitting completion approval…", async () => {
      await api(`/groups/${completionGroup._id}/request-completion`, {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ password: completionPassword }),
      });
      setCompletionGroup(null);
      setCompletionPassword("");
      notify(
        "First approval saved. A different admin must approve completion.",
      );
      await refresh(true);
    });
  };
  const approveCompletion = async (e) => {
    e.preventDefault();
    if (!completionGroup) return;
    await run("Completing group and archiving records…", async () => {
      await api(`/groups/${completionGroup._id}/approve-completion`, {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ password: approvePassword }),
      });
      setCompletionGroup(null);
      setApprovePassword("");
      notify("Group completed. Preparing the updated archive download…");
      try {
        await csvDownload(
          `/groups/${completionGroup._id}/archive`,
          session.token,
          "POST",
        );
        notify(
          "Cumulative archive downloaded. The completed group is now archived and can be safely deleted when you choose.",
        );
      } catch (e) {
        notify(
          `Group completed, but archive download needs retry: ${e.message}`,
        );
      }
      await refresh(true);
    });
  };
  const deleteGroup = async (g) => {
    if (!g.archivedAt) {
      notify("Archive and download this group before deleting it.");
      return;
    }
    if (
      !window.confirm(
        `Permanently delete live records for “${g.name}”? The archive snapshot will be retained.`,
      )
    )
      return;
    await run("Deleting archived group records…", async () => {
      await api(`/groups/${g._id}`, { token: session.token, method: "DELETE" });
      notify("Live group records deleted. The archive remains available.");
      setSelectedDetail("");
      await refresh(true);
    });
  };
  const showDetails = async (g) => {
    await run("Loading group details…", async () => {
      const d = await api(`/groups/${g._id}/interns`, { token: session.token });
      setSelectedDetail(g._id);
      setGroupMembers(d.interns || []);
      setTab("groups");
    });
  };
  const createPromo = async (e) => {
    e.preventDefault();
    await run("Creating promo code…", async () => {
      await api("/promo-codes", {
        token: session.token,
        method: "POST",
        body: JSON.stringify({
          ...promoForm,
          expiresAt: promoForm.expiresAt || undefined,
        }),
      });
      setPromoForm({
        groupId: "",
        code: "",
        minReward: 5,
        maxReward: 20,
        maxRedemptions: 30,
        expiresAt: "",
      });
      notify("Promo code created.");
      await refresh(true);
    });
  };
  const expirePromo = async (c) => {
    if (
      !window.confirm(
        `Expire ${c.code} now? No further redemptions will be accepted.`,
      )
    )
      return;
    await run("Expiring promo code…", async () => {
      await api(`/promo-codes/${c._id}/expire`, {
        token: session.token,
        method: "POST",
        body: "{}",
      });
      notify(`${c.code} has been expired.`);
      await refresh(true);
    });
  };
  const sendNotification = async (e) => {
    e.preventDefault();
    await run("Sending notification…", async () => {
      await api("/notifications", {
        token: session.token,
        method: "POST",
        body: JSON.stringify(noticeForm),
      });
      setNoticeForm({ title: "", message: "", targetGroupId: "all", link: "" });
      notify("Notification sent to the selected audience.");
      await refresh(true);
    });
  };
  const approveSelected = async (all = false) => {
    if (!all && !selectedApprovals.length) {
      notify("Select at least one attendance request.");
      return;
    }
    if (all && !approvalGroup) {
      notify("Choose a group before approving all requests.");
      return;
    }
    await run("Approving attendance and crediting InternCash…", async () => {
      const body = all
        ? {
            approveAll: true,
            groupId: approvalGroup,
            sessionNumber: approvalSession || undefined,
          }
        : { attendanceIds: selectedApprovals };
      const d = await api("/attendance/admin/approvals/approve", {
        token: session.token,
        method: "POST",
        body: JSON.stringify(body),
      });
      notify(d.message);
      await Promise.all([loadApprovals(), refresh(true)]);
    });
  };
  const rejectSelected = async () => {
    if (!selectedApprovals.length) {
      notify("Select at least one request to reject.");
      return;
    }
    const reason = window.prompt("Enter a short reason for rejection:");
    if (!reason?.trim()) return;
    await run("Updating attendance requests…", async () => {
      const d = await api("/attendance/admin/approvals/reject", {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ attendanceIds: selectedApprovals, reason }),
      });
      notify(d.message);
      await loadApprovals();
    });
  };
  const correctAttendance = async (e) => {
    e.preventDefault();
    await run("Saving attendance correction…", async () => {
      await api("/attendance/admin/correct", {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ ...correction }),
      });
      notify("Attendance correction saved.");
      await loadReport();
    });
  };
  const transferIntern = async (e) => {
    e.preventDefault();
    await run("Transferring intern…", async () => {
      const d = await api(`/groups/${transfer.targetGroupId}/transfer-intern`, {
        token: session.token,
        method: "POST",
        body: JSON.stringify(transfer),
      });
      notify(d.message);
      setTransfer({ internId: "", targetGroupId: "" });
      await refresh(true);
    });
  };
  const exportAttendance = () => {
    const rows = [
      [
        "Date",
        "Session",
        "Intern ID",
        "Name",
        "Email",
        "Group",
        "Status",
        "Marked at",
        "Approved at",
        "Reward IC",
        "Reason",
      ],
      ...attendance.map((a) =>
        [
          a.dateKey,
          a.sessionNumber,
          a.intern?.internId,
          a.intern?.name,
          a.intern?.email,
          a.intern?.group?.name,
          a.status,
          a.markedAt,
          a.approvedAt,
          a.rewardAmount,
          a.rejectionReason || a.correctionReason,
        ].map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`),
      ),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VELOop-Attendance-Report-${dateToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const chartData = useMemo(() => {
    const days = {};
    for (const a of attendance) {
      const key = a.dateKey;
      days[key] ??= { date: key, approved: 0, pending: 0 };
      if (["approved", "admin_corrected_present"].includes(a.status))
        days[key].approved++;
      if (a.status === "pending") days[key].pending++;
    }
    return Object.values(days)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [attendance]);
  const nav = (
    <AdminSidebar
      activeTab={tab}
      onNavigate={setTab}
      pendingApprovals={approvals.length}
      onClose={() => setMobileMenuOpen(false)}
    />
  );
  if (loading && !overview) return <PageSkeleton rows={6} />;
  return (
    <>
      <div className={styles.mobileTopbar}>
        <button
          type="button"
          className={styles.hamburger}
          aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className={styles.mobileBrand}>
          <strong>VELOop Admin</strong>
          <span>{NAV.find(([id]) => id === tab)?.[1] || "Workspace"}</span>
        </div>
        <button
          type="button"
          className={styles.mobileRefresh}
          onClick={() => refresh(true)}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={18} className={refreshing ? "spin" : ""} />
        </button>
      </div>
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation overlay"
          className={styles.mobileBackdrop}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className={styles.dashboard}>
        <aside
          className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}
        >
          {nav}
        </aside>

        <div className={styles.workspace}>
          <main className={styles.pageContent}>
            {tab === "overview" && (
              <OverviewPage
                session={session}
                overview={overview}
                approvals={approvals}
                chartData={chartData}
                refreshing={refreshing}
                refresh={refresh}
                onToggleTheme={onToggleTheme}
                theme={theme}
                setTab={setTab}
              />
            )}
            {tab === "groups" && (
              <GroupsPage
                session={session}
                groups={groups}
                groupForm={groupForm}
                setGroupForm={setGroupForm}
                createGroup={createGroup}
                createdInvite={createdInvite}
                setCreatedInvite={setCreatedInvite}
                inviteGroup={inviteGroup}
                setInviteGroup={setInviteGroup}
                resetInvite={resetInvite}
                getInvite={getInvite}
                refresh={refresh}
                notify={notify}
                selectedDetail={selectedDetail}
                setSelectedDetail={setSelectedDetail}
                groupMembers={groupMembers}
                showDetails={showDetails}
                editGroup={editGroup}
                setEditGroup={setEditGroup}
                saveGroup={saveGroup}
                startGroup={startGroup}
                setCompletionGroup={setCompletionGroup}
                setCompletionPassword={setCompletionPassword}
                setApprovePassword={setApprovePassword}
                deleteGroup={deleteGroup}
                busyLabel={busyLabel}
                csvDownload={csvDownload}
              />
            )}
            {tab === "interns" && (
              <InternsPage
                interns={interns}
                groups={groups}
                query={query}
                setQuery={setQuery}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                refreshing={refreshing}
                loadInterns={loadInterns}
                transfer={transfer}
                setTransfer={setTransfer}
                transferIntern={transferIntern}
                busyLabel={busyLabel}
              />
            )}
            {tab === "approvals" && (
              <ApprovalsPage
                approvals={approvals}
                groups={groups}
                approvalGroup={approvalGroup}
                setApprovalGroup={setApprovalGroup}
                approvalSession={approvalSession}
                setApprovalSession={setApprovalSession}
                selectedApprovals={selectedApprovals}
                setSelectedApprovals={setSelectedApprovals}
                loadApprovals={loadApprovals}
                approveSelected={approveSelected}
                rejectSelected={rejectSelected}
                refreshing={refreshing}
              />
            )}
            {tab === "attendance" && (
              <AttendancePage
                groups={groups}
                attendance={attendance}
                reportGroup={reportGroup}
                setReportGroup={setReportGroup}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                reportStatus={reportStatus}
                setReportStatus={setReportStatus}
                reportSession={reportSession}
                setReportSession={setReportSession}
                refreshing={refreshing}
                loadReport={loadReport}
                exportAttendance={exportAttendance}
                correction={correction}
                setCorrection={setCorrection}
                correctAttendance={correctAttendance}
              />
            )}
            {tab === "wallet" && (
              <WalletPage session={session} groups={groups} notify={notify} />
            )}
            {tab === "promos" && (
              <PromosPage
                groups={groups}
                promoForm={promoForm}
                setPromoForm={setPromoForm}
                createPromo={createPromo}
                codes={codes}
                expirePromo={expirePromo}
                notify={notify}
                fmtDate={fmtDate}
              />
            )}
            {tab === "settings" && (
              <SettingsPage
                scheduleForm={scheduleForm}
                setScheduleForm={setScheduleForm}
                saveSchedule={saveSchedule}
              />
            )}
            {tab === "notifications" && (
              <NotificationsPage
                groups={groups}
                noticeForm={noticeForm}
                setNoticeForm={setNoticeForm}
                sendNotification={sendNotification}
                notifications={notifications}
                fmtDate={fmtDate}
              />
            )}
          </main>
          <LegalFooter />
        </div>
      </div>
      {completionGroup && (
        <div className="legal-backdrop">
          <section
            className="legal-modal"
            style={{ maxWidth: 460, height: "auto" }}
          >
            <header className="legal-header">
              <div>
                <b>
                  {completionGroup.status === "completion_pending"
                    ? "Second completion approval"
                    : "Request group completion"}
                </b>
                <p className="muted small">{completionGroup.name}</p>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setCompletionGroup(null);
                  setCompletionPassword("");
                  setApprovePassword("");
                }}
              >
                <X />
              </button>
            </header>
            <form
              className="legal-content"
              onSubmit={
                completionGroup.status === "completion_pending"
                  ? approveCompletion
                  : requestCompletion
              }
            >
              <div className="notice" style={{ marginBottom: 15 }}>
                Two different admin accounts must approve. The second approval
                closes attendance, unlocks certification status and triggers an
                updated cumulative CSV download.
              </div>
              <Field label="Confirm your admin password">
                <input
                  className="input"
                  type="password"
                  required
                  value={
                    completionGroup.status === "completion_pending"
                      ? approvePassword
                      : completionPassword
                  }
                  onChange={(e) =>
                    completionGroup.status === "completion_pending"
                      ? setApprovePassword(e.target.value)
                      : setCompletionPassword(e.target.value)
                  }
                />
              </Field>
              <button className="btn btn-primary btn-block">
                {completionGroup.status === "completion_pending"
                  ? "Approve completion & archive"
                  : "Submit first approval"}
              </button>
            </form>
          </section>
        </div>
      )}
      {busyLabel && <ActionOverlay label={busyLabel} />}
    </>
  );
}
export default AdminApp;
