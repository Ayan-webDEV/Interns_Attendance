import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Wallet,
  UserRound,
  LockKeyhole,
  Send,
  History,
  CircleCheck,
  CircleAlert,
  Copy,
  Mail,
  Fingerprint,
  BriefcaseBusiness,
  KeyRound,
  Sparkles,
  CircleUserRound,
  CalendarDays,
  Camera,
  Trash2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../lib/api.js";
import { dateToday, money } from "../../lib/session.js";
import { Field, Stat } from "../../components/ui/Primitives.jsx";
import { ActionOverlay, PageSkeleton } from "../../components/ui/Loading.jsx";
import AttendancePage from "./components/pages/AttendancePage.jsx";
import RewardsPage from "./components/pages/RewardsPage.jsx";
import PromosPage from "./components/pages/PromosPage.jsx";
import NotificationsPage from "./components/pages/NotificationsPage.jsx";
import CertificatePage from "./components/pages/CertificatePage.jsx";
import AccountPage from "./components/pages/AccountPage.jsx";
import AttendanceSessionCard from "./components/AttendanceSessionCard.jsx";
import InternNavigation from "./components/InternNavigation.jsx";
import styles from "./InternApp.module.css";
import { LegalFooter } from "../../components/legal/LegalPages.jsx";

const NAV = [
  ["attendance", "Attendance", CalendarCheck],
  ["rewards", "InternCash wallet", Wallet],
  ["promos", "Promo codes", Gift],
  ["notifications", "Notifications", Bell],
  ["certificate", "Certification", Award],
  ["account", "My account", UserRound],
];
const approvedStatus = ["approved", "admin_corrected_present"];
const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const keyDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

function InternApp({ session, tab, setTab, notify, theme, onToggleTheme }) {
  const [me, setMe] = useState(session.user),
    [group, setGroup] = useState(null),
    [today, setToday] = useState(null),
    [records, setRecords] = useState([]),
    [wallet, setWallet] = useState(null),
    [notifications, setNotifications] = useState([]),
    [promoCode, setPromoCode] = useState(""),
    [password, setPassword] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [history, setHistory] = useState([]),
    [attSession, setAttSession] = useState(null),
    [remaining, setRemaining] = useState(0),
    [busyLabel, setBusyLabel] = useState(""),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [calendarMonth, setCalendarMonth] = useState(null);

  const refresh = useCallback(
    async (silent = false) => {
      silent ? setRefreshing(true) : setLoading(true);
      try {
        const [g, t, a, w, n] = await Promise.all([
          api("/groups", { token: session.token }),
          api("/attendance/today", { token: session.token }),
          api("/attendance/mine", { token: session.token }),
          api("/wallet/mine", { token: session.token }),
          api("/notifications/mine", { token: session.token }),
        ]);
        const grp = g.groups?.[0] || t.group || null;
        setGroup(grp);
        setToday(t);
        setRecords(a.records || []);
        setHistory(a.records || []);
        setWallet(w);
        setNotifications(n.notifications || []);
        setMe({ ...session.user, group: grp?._id || session.user.group });
        if (grp?.actualStartDate && !calendarMonth)
          setCalendarMonth(new Date(grp.actualStartDate));
      } catch (e) {
        notify(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session.token, session.user, notify, calendarMonth],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);
  const run = async (label, fn) => {
    setBusyLabel(label);
    try {
      await fn();
    } catch (e) {
      notify(e.message || "Something went wrong.");
    } finally {
      setBusyLabel("");
    }
  };

  // Profile picture state — stored only in this browser's localStorage
  const profilePictureStorageKey = `vloop-profile-picture-${me?.internId || me?.email || "intern"}`;

  const [profilePicture, setProfilePicture] = useState(() => {
    try {
      return localStorage.getItem(profilePictureStorageKey) || "";
    } catch {
      return "";
    }
  });

  const [profilePictureError, setProfilePictureError] = useState("");

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again after an upload.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfilePictureError("Please choose a valid image file.");
      return;
    }

    // Keep localStorage usage reasonable.
    if (file.size > 2 * 1024 * 1024) {
      setProfilePictureError("Choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imageData = reader.result;

        if (typeof imageData !== "string") {
          setProfilePictureError("Unable to read this image.");
          return;
        }

        const key = `vloop-profile-picture-${session?.user?.internId || session?.user?.email || "intern"}`;

        localStorage.setItem(key, imageData);
        setProfilePicture(imageData);
        setProfilePictureError("");
        notify("Profile picture updated on this device.");
      } catch {
        setProfilePictureError(
          "Could not save this image. Try a smaller picture.",
        );
      }
    };

    reader.onerror = () => {
      setProfilePictureError("Unable to read this image. Please try again.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = () => {
    try {
      const key = `vloop-profile-picture-${session?.user?.internId || session?.user?.email || "intern"}`;

      localStorage.removeItem(key);
      setProfilePicture("");
      setProfilePictureError("");
      notify("Profile picture removed.");
    } catch {
      setProfilePictureError("Unable to remove the profile picture.");
    }
  };

  useEffect(() => {
    if (!attSession) return;
    const tick = () => {
      const elapsed =
        (Date.now() - new Date(attSession.startedAt).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(attSession.minimumSeconds - elapsed)));
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [attSession]);
  useEffect(() => {
    if (!from && !to) {
      setHistory(records);
      return;
    }
    setHistory(
      records.filter(
        (r) => (!from || r.dateKey >= from) && (!to || r.dateKey <= to),
      ),
    );
  }, [from, to, records]);
  const startAttendance = async (sessionNumber) =>
    run(
      sessionNumber === 1
        ? "Starting attendance session…"
        : "Unlocking re-attendance…",
      async () => {
        const d = await api("/attendance/session/start", {
          token: session.token,
          method: "POST",
          body: JSON.stringify({ sessionNumber }),
        });
        setAttSession({ ...d, sessionNumber });
        setRemaining(d.minimumSeconds);
        notify(
          `Session ${sessionNumber} started. Keep this page open until the timer finishes.`,
        );
      },
    );
  const markAttendance = async () => {
    if (!attSession) return;
    await run("Submitting attendance request…", async () => {
      const d = await api(`/attendance/session/${attSession.sessionId}/mark`, {
        token: session.token,
        method: "POST",
        body: "{}",
      });
      setAttSession(null);
      notify(d.message);
      await refresh(true);
    });
  };
  const redeem = async (e) => {
    e.preventDefault();
    await run("Validating promo code…", async () => {
      const d = await api("/promo-codes/redeem", {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ code: promoCode }),
      });
      setPromoCode("");
      notify(d.message);
      await refresh(true);
    });
  };
  const setNewPassword = async (e) => {
    e.preventDefault();
    await run("Updating password securely…", async () => {
      const d = await api("/auth/set-password", {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      notify(d.message);
    });
  };
  const markRead = async (n) =>
    run("Updating notification…", async () => {
      await api(`/notifications/${n._id}/read`, {
        token: session.token,
        method: "POST",
        body: "{}",
      });
      setNotifications((old) =>
        old.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
      );
    });
  const firstRecord = today?.records?.find((r) => r.sessionNumber === 1),
    secondRecord = today?.records?.find((r) => r.sessionNumber === 2);
  const chartData = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const v = map.get(r.dateKey) || {
        date: r.dateKey,
        first: 0,
        second: 0,
        pending: 0,
      };
      if (approvedStatus.includes(r.status)) {
        if (r.sessionNumber === 1) v.first = 1;
        else v.second = 1;
      }
      if (r.status === "pending") v.pending++;
      map.set(r.dateKey, v);
    }
    return [...map.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [records]);
  const approvedDays = new Set(
    records
      .filter((r) => approvedStatus.includes(r.status))
      .map((r) => r.dateKey),
  ).size;
  const dateStart = group?.actualStartDate
    ? keyDate(new Date(group.actualStartDate))
    : null;
  const fallbackEnd = group?.actualStartDate
    ? new Date(new Date(group.actualStartDate).getTime())
    : null;
  if (fallbackEnd)
    fallbackEnd.setDate(
      fallbackEnd.getDate() + Number(group.durationDays || 28),
    );
  const dateEnd = group?.actualEndDate
    ? keyDate(new Date(group.actualEndDate))
    : fallbackEnd
      ? keyDate(fallbackEnd)
      : null;
  const monthDate =
    calendarMonth ||
    (group?.actualStartDate ? new Date(group.actualStartDate) : new Date());
  const monthLabel = monthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const calendar = useMemo(() => {
    if (!group?.actualStartDate) return { offset: 0, items: [] };
    const start = new Date(group.actualStartDate);
    const end = group.actualEndDate
      ? new Date(group.actualEndDate)
      : new Date(start.getTime() + Number(group.durationDays || 28) * 86400000);
    const y = monthDate.getFullYear(),
      m = monthDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const offset =
      y === start.getFullYear() && m === start.getMonth()
        ? start.getDay()
        : first.getDay();
    const items = [];
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(y, m, d);
      const key = keyDate(date);
      if (key < keyDate(start) || key > keyDate(end)) continue;
      const recs = records.filter((r) => r.dateKey === key);
      items.push({
        day: d,
        key,
        sunday: date.getDay() === 0,
        records: recs,
        approved: recs.some((r) => approvedStatus.includes(r.status)),
        pending: recs.some((r) => r.status === "pending"),
        future: key > dateToday(),
      });
    }
    return { offset, items, start, end };
  }, [group, monthDate, records]);
  const changeMonth = (amount) =>
    setCalendarMonth((old) => {
      const next = new Date(old || group?.actualStartDate || new Date());
      next.setMonth(next.getMonth() + amount, 1);
      return next;
    });
  const groupHasStarted =
    group?.status === "active" &&
    dateStart &&
    dateToday() >= dateStart &&
    (!dateEnd || dateToday() <= dateEnd);
  const pageData = {
    session,
    tab,
    setTab,
    notify,
    theme,
    onToggleTheme,
    me,
    setMe,
    group,
    setGroup,
    today,
    setToday,
    records,
    setRecords,
    wallet,
    setWallet,
    notifications,
    setNotifications,
    promoCode,
    setPromoCode,
    password,
    setPassword,
    from,
    setFrom,
    to,
    setTo,
    history,
    setHistory,
    attSession,
    setAttSession,
    remaining,
    setRemaining,
    busyLabel,
    setBusyLabel,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    calendarMonth,
    setCalendarMonth,
    refresh,
    run,
    profilePictureStorageKey,
    profilePicture,
    setProfilePicture,
    profilePictureError,
    setProfilePictureError,
    handleProfilePictureChange,
    handleRemoveProfilePicture,
    startAttendance,
    markAttendance,
    redeem,
    setNewPassword,
    markRead,
    firstRecord,
    secondRecord,
    chartData,
    approvedDays,
    dateStart,
    fallbackEnd,
    dateEnd,
    monthDate,
    monthLabel,
    calendar,
    changeMonth,
    groupHasStarted,
  };
  // if (loading && !today) return <PageSkeleton rows={6} />;

  if (loading && !today) return <PageSkeleton rows={6} />;

  return (
    <div className="intern-dashboard-shell flex min-h-screen flex-col">
      {/* Sidebar and main content share the row below the navbar */}
      <div className="intern-dashboard-body mx-auto flex w-full max-w-[1600px] flex-1 items-stretch">
        <InternNavigation
          variant="desktop"
          tab={tab}
          setTab={setTab}
          notifications={notifications}
        />

        {/* Main column: pages first, footer below the page content */}
        <div className="intern-dashboard-content flex min-h-0 min-w-0 flex-1 flex-col">
          <main
            className={`intern-dashboard-page min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 sm:py-7 sm:pb-7 lg:px-8 xl:px-10 ${styles.workspaceMain}`}
          >
            {tab === "attendance" && <AttendancePage data={pageData} />}
            {tab === "rewards" && <RewardsPage data={pageData} />}
            {tab === "promos" && <PromosPage data={pageData} />}
            {tab === "notifications" && <NotificationsPage data={pageData} />}
            {tab === "certificate" && <CertificatePage data={pageData} />}
            {tab === "account" && <AccountPage data={pageData} />}
          </main>

          {/* Footer belongs to the main column, not the sidebar */}
          <div className="intern-dashboard-footer mt-auto">
            <LegalFooter />
          </div>
        </div>
      </div>

      {/* Existing mobile navigation stays fixed at the bottom */}
      <InternNavigation
        variant="mobile"
        tab={tab}
        setTab={setTab}
        notifications={notifications}
      />

      {busyLabel && <ActionOverlay label={busyLabel} />}
    </div>
  );
}

export default InternApp;
