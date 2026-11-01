import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Wallet,
  Flame,
  ArrowUpRight,
  Bell,
  Clock3,
  ShieldCheck,
  TicketPercent,
  FileCheck2,
  LockKeyhole,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { api } from "../../api/client";
import StatCard from "../../components/StatCard/StatCard";
import Loader from "../../components/Loader/Loader";
import AttendanceTrend from "../../components/AttendanceTrend/AttendanceTrend";
import styles from "./InternDashboard.module.css";

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

const MISSED_STATUSES = new Set([
  "missed",
  "absent",
  "auto_absent",
  "auto_missed",
]);

const IST = "Asia/Kolkata";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getRecordStatus(record) {
  const status = normalizeStatus(record?.status);

  if (APPROVED_STATUSES.has(status)) return "approved";
  if (PENDING_STATUSES.has(status)) return "pending";
  if (status === "rejected") return "rejected";

  if (
    MISSED_STATUSES.has(status) ||
    record?.isMissed === true ||
    record?.missed === true
  ) {
    return "missed";
  }

  return record ? "review" : "not_marked";
}

/**
 * Reads a total missed-session count when the API provides one.
 * Older API responses only return records, so the dashboard falls back
 * to counting the missed records it has received.
 */
function readMissedCount(payload) {
  const candidates = [
    payload?.missedAttendanceCount,
    payload?.missedCount,
    payload?.summary?.missedAttendanceCount,
    payload?.summary?.missedSessions,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const count = Number(candidate);

    if (Number.isFinite(count) && count >= 0) {
      return Math.floor(count);
    }
  }

  return null;
}

function getRecordDateKey(record) {
  const value =
    record?.dateKey ||
    record?.date ||
    record?.attendanceDate ||
    record?.sessionDate ||
    record?.createdAt ||
    record?.startedAt;

  if (!value) return null;

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getISTToday() {
  return getRecordDateKey({ date: new Date() });
}

function getSessionNumber(record) {
  const number = Number(
    record?.sessionNumber ?? record?.session ?? record?.sessionNo,
  );

  return number === 1 || number === 2 ? number : null;
}

function getRecordIdentity(record, index) {
  const id = record?._id || record?.id;

  if (id) return `id:${id}`;

  const dateKey = getRecordDateKey(record);
  const sessionNumber = getSessionNumber(record);

  if (dateKey && sessionNumber) {
    return `${dateKey}:session:${sessionNumber}`;
  }

  return `record:${index}`;
}

/**
 * Combines history and today's records.
 * Today's endpoint is processed second, so its copy wins if the same
 * attendance session exists in both responses.
 */
function mergeAttendanceRecords(...recordArrays) {
  const recordsByKey = new Map();
  let index = 0;

  recordArrays.forEach((records) => {
    if (!Array.isArray(records)) return;

    records.forEach((record) => {
      if (!record) return;

      recordsByKey.set(getRecordIdentity(record, index++), record);
    });
  });

  return [...recordsByKey.values()];
}

function formatToday() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: IST,
  }).format(new Date());
}

function safeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function formatAmount(value) {
  return safeAmount(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function getGroupStatusText(status) {
  const labels = {
    active: "Internship is active",
    started: "Internship is active",
    completed: "Internship completed",
    completion_pending: "Awaiting completion approval",
    registration: "Internship has not started yet",
    inactive: "Internship is currently inactive",
    paused: "Internship is paused",
  };

  return labels[normalizeStatus(status)] || "Internship status unavailable";
}

function getGroupName(today, group, user) {
  return (
    today?.group?.name ||
    group?.name ||
    group?.groupName ||
    user?.whatsappGroupName ||
    "Group not assigned"
  );
}

function getSessionWindowLabel(window) {
  if (!window) return "Schedule not available";

  if (window.label) return `${window.label} IST`;

  const formatMinutes = (value) => {
    const minutes = Number(value);

    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440) {
      return null;
    }

    const hour = Math.floor(minutes / 60);
    const minute = Math.floor(minutes % 60);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
  };

  const start = formatMinutes(window.start);
  const end = formatMinutes(window.end);

  return start && end ? `${start} – ${end} IST` : "Schedule not available";
}

function getSessionPresentation(record) {
  const status = getRecordStatus(record);

  const presentation = {
    approved: {
      label: "Approved",
      detail: "Attendance approved",
      className: "approved",
    },
    pending: {
      label: "Pending review",
      detail: "Waiting for administrator review",
      className: "pending",
    },
    rejected: {
      label: "Rejected",
      detail: "Submission was rejected",
      className: "rejected",
    },
    missed: {
      label: "Missed",
      detail:
        "This session was automatically recorded as missed after its attendance window closed",
      className: "missed",
    },
    review: {
      label: "Needs review",
      detail: "Contact your administrator",
      className: "review",
    },
    not_marked: {
      label: "Not marked",
      detail: "No submission recorded",
      className: "notMarked",
    },
  };

  return presentation[status] || presentation.not_marked;
}

/* -------------------------------------------------------------------------- */
/* Dashboard data loader                                                      */
/* -------------------------------------------------------------------------- */

async function fetchDashboardData() {
  return Promise.allSettled([
    api("/attendance/today"),
    api("/wallet/mine"),
    api("/groups"),
    api("/notifications/mine"),
    api("/attendance/history"),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function InternDashboard({ user }) {
  const [today, setToday] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [group, setGroup] = useState(null);
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [missedCountFromServer, setMissedCountFromServer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadDashboard = useCallback(async ({ initial = false } = {}) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const results = await fetchDashboardData();

      if (results[0].status === "fulfilled") {
        const payload = results[0].value;
        setToday(payload);

        const count = readMissedCount(payload);
        if (count !== null) {
          setMissedCountFromServer(count);
        }
      }

      if (results[1].status === "fulfilled") {
        setWallet(results[1].value);
      }

      if (results[2].status === "fulfilled") {
        const payload = results[2].value;

        const groups = Array.isArray(payload?.groups) ? payload.groups : [];

        setGroup(
          groups[0] || payload?.group || (payload?.name ? payload : null),
        );
      }

      if (results[3].status === "fulfilled") {
        const payload = results[3].value;

        setNotes(
          Array.isArray(payload?.notifications) ? payload.notifications : [],
        );
      }

      if (results[4].status === "fulfilled") {
        const payload = results[4].value;

        setHistory(Array.isArray(payload?.records) ? payload.records : []);

        const count = readMissedCount(payload);
        if (count !== null) {
          setMissedCountFromServer(count);
        }
      }

      const failedRequests = results.filter(
        (result) => result.status === "rejected",
      );

      setLoadError(
        failedRequests.length
          ? "Some dashboard information could not be refreshed. Previously loaded information has been retained."
          : "",
      );
    } catch {
      setLoadError("We could not refresh your dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard({ initial: true });
  }, [loadDashboard]);

  /* ------------------------------------------------------------------------ */
  /* Combined attendance data                                                 */
  /* ------------------------------------------------------------------------ */

  const allRecords = useMemo(() => {
    return mergeAttendanceRecords(history, today?.records);
  }, [history, today?.records]);

  const todayKey = getISTToday();

  const todayRecords = useMemo(() => {
    const recordsFromHistory = allRecords.filter(
      (record) => getRecordDateKey(record) === todayKey,
    );

    return mergeAttendanceRecords(recordsFromHistory, today?.records);
  }, [allRecords, today?.records, todayKey]);

  const approvedToday = todayRecords.filter((record) =>
    APPROVED_STATUSES.has(normalizeStatus(record.status)),
  ).length;

  const pendingToday = todayRecords.filter((record) =>
    PENDING_STATUSES.has(normalizeStatus(record.status)),
  ).length;

  const rejectedToday = todayRecords.filter(
    (record) => normalizeStatus(record.status) === "rejected",
  ).length;

  const missedFromRecords = allRecords.filter(
    (record) => getRecordStatus(record) === "missed",
  ).length;

  // Prefer a backend total when available, but never show less than the
  // missed records currently returned by the API or the authenticated user.
  const missedTotal = Math.max(
    missedFromRecords,
    safeAmount(user?.missedAttendanceCount),
    missedCountFromServer === null ? 0 : missedCountFromServer,
  );

  const missedToday = todayRecords.filter(
    (record) => getRecordStatus(record) === "missed",
  ).length;

  /* ------------------------------------------------------------------------ */
  /* Wallet and group data                                                    */
  /* ------------------------------------------------------------------------ */

  const cash = safeAmount(wallet?.balance ?? user?.internCashBalance ?? 0);

  const groupStatus = normalizeStatus(
    today?.groupStatus || group?.status || "registration",
  );

  const groupActive = ["active", "started"].includes(groupStatus);
  const groupCompleted = groupStatus === "completed";

  const groupName = getGroupName(today, group, user);

  const unreadNotifications = notes.filter(
    (notification) => !notification?.isRead,
  ).length;

  const [todayYear, todayMonth, todayDay] = todayKey.split("-").map(Number);
  const todayIsSunday =
    Boolean(today?.isSunday) ||
    new Date(Date.UTC(todayYear, todayMonth - 1, todayDay)).getUTCDay() === 0;

  /* ------------------------------------------------------------------------ */
  /* Session information                                                      */
  /* ------------------------------------------------------------------------ */

  const sessions = useMemo(() => {
    return [1, 2].map((number) => {
      const record =
        todayRecords.find((item) => getSessionNumber(item) === number) || null;

      const window =
        number === 1 ? today?.windows?.first : today?.windows?.second;

      return {
        number,
        record,
        window,
        presentation: getSessionPresentation(record),
      };
    });
  }, [todayRecords, today?.windows]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <Loader label="Preparing your internship overview…" full={false} />;
  }

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <header className={styles.welcome}>
        <div className={styles.welcomeCopy}>
          <div className={styles.kicker}>
            <span />
            YOUR INTERNSHIP AT A GLANCE
          </div>

          <h1>
            Good to see you,{" "}
            <span>{user?.name?.trim()?.split(/\s+/)?.[0] || "intern"}.</span>
          </h1>

          <p>
            Small consistent steps add up. Here’s where your internship stands
            today.
          </p>
        </div>

        <div className={styles.welcomeActions}>
          <div className={styles.date}>
            <CalendarCheck size={16} />
            <span>{formatToday()}</span>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => loadDashboard()}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? styles.refreshing : ""}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </header>

      {loadError && (
        <div className={styles.errorNotice} role="status">
          <AlertCircle size={17} />
          <span>{loadError}</span>
        </div>
      )}

      {/* Internship group */}
      <section className={styles.groupBanner}>
        <div className={styles.groupIcon}>
          <ShieldCheck size={22} />
        </div>

        <div className={styles.groupText}>
          <small>YOUR WHATSAPP INTERNSHIP GROUP</small>
          <b title={groupName}>{groupName}</b>
          <span>{getGroupStatusText(groupStatus)}</span>
        </div>

        <span
          className={`${styles.status} ${
            groupActive
              ? styles.green
              : groupCompleted
                ? styles.completedStatus
                : ""
          }`}
        >
          {groupStatus.replaceAll("_", " ")}
        </span>
      </section>

      {/* Summary cards */}
      <section className={styles.stats} aria-label="Internship statistics">
        <StatCard
          label="InternCash balance"
          value={`${formatAmount(cash)} IC`}
          sub={`Approx. ₹${formatAmount(cash * 0.5)} reward value`}
          icon={Wallet}
          tone="mint"
        />

        <StatCard
          label="Today's attendance"
          value={`${approvedToday}/2`}
          sub="Approved sessions today"
          icon={CalendarCheck}
          tone="blue"
        />

        <StatCard
          label="Pending requests"
          value={pendingToday}
          sub="Today's sessions awaiting review"
          icon={Clock3}
          tone="amber"
        />

        <StatCard
          label="Missed sessions"
          value={missedTotal}
          sub={`${missedToday} missed today · all recorded sessions`}
          icon={AlertCircle}
          tone="violet"
        />

        <StatCard
          label="Notifications"
          value={unreadNotifications}
          sub="Unread updates from your admin"
          icon={Bell}
          tone="violet"
        />
      </section>

      {/* Main dashboard panels */}
      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>DAILY PROGRESS</span>
              <h2>Today's checklist</h2>
              <p>Track both attendance sessions scheduled for today.</p>
            </div>

            <span className={styles.live}>
              <span />
              LIVE
            </span>
          </div>

          {todayIsSunday ? (
            <div className={styles.holiday}>
              <span className={styles.holidayIcon}>☀</span>
              <div>
                <b>Enjoy your Sunday!</b>
                <p>
                  Attendance is paused for the weekly holiday. Your regular
                  sessions resume on the next working day.
                </p>
              </div>
            </div>
          ) : !groupActive ? (
            <div className={styles.holiday}>
              <span className={styles.holidayIcon}>◷</span>
              <div>
                <b>
                  {groupCompleted
                    ? "Your internship is completed"
                    : "Your internship has not started"}
                </b>
                <p>
                  {groupCompleted
                    ? "Your attendance period is complete. Check the certificate section for updates."
                    : "Please wait for your group administrator to activate the internship. Your attendance schedule will appear once it starts."}
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.sessions}>
              {sessions.map(({ number, record, window, presentation }) => (
                <div className={styles.session} key={number}>
                  <div
                    className={`${styles.sessionIcon} ${
                      styles[presentation.className]
                    }`}
                  >
                    {presentation.className === "approved" ? (
                      <CheckCircle2 size={18} />
                    ) : presentation.className === "missed" ? (
                      <AlertCircle size={18} />
                    ) : (
                      <CalendarCheck size={18} />
                    )}
                  </div>

                  <div className={styles.sessionInfo}>
                    <b>
                      {number === 1 ? "First attendance" : "Second attendance"}
                    </b>

                    <span>{getSessionWindowLabel(window)}</span>
                  </div>

                  <span
                    className={`${styles.badge} ${
                      styles[presentation.className]
                    }`}
                    title={presentation.detail}
                  >
                    {presentation.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <a href="/intern/attendance" className={styles.cta}>
            Open attendance
            <ArrowUpRight size={16} />
          </a>
        </section>

        {/* Rewards */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.panelKicker}>YOUR REWARDS</span>
              <h2>InternCash wallet</h2>
              <p>Track the rewards credited to your account.</p>
            </div>

            <div className={styles.rewardIcon}>
              <Wallet size={19} />
            </div>
          </div>

          <div className={styles.rewardBalance}>
            <span>AVAILABLE BALANCE</span>

            <strong>
              {formatAmount(cash)}
              <small>IC</small>
            </strong>

            <p>
              20 IC welcome bonus · +1 IC first session · +3 IC second session
            </p>
          </div>

          <div className={styles.rewardFoot}>
            <div>
              <Flame size={17} />
              <span>Consistency matters</span>
            </div>

            <a href="/intern/wallet">
              View wallet <ArrowUpRight size={14} />
            </a>
          </div>

          <div className={styles.rewardFoot}>
            <div>
              <TicketPercent size={17} />
              <span>Group promo rewards</span>
            </div>

            <a href="/intern/promos">
              Redeem code <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </div>

      {/* Attendance graph */}
      <AttendanceTrend records={allRecords} />

      {/* Certificate */}
      <section className={styles.certPanel}>
        <div className={styles.certIcon}>
          <FileCheck2 size={20} />
        </div>

        <div className={styles.certCopy}>
          <h2>Internship certificate</h2>

          <p>
            {groupCompleted
              ? "Your group internship is marked complete. The certification process will be announced by your programme administrator."
              : "Your certificate section unlocks after the administrator marks your group internship as completed."}
          </p>
        </div>

        <span
          className={`${styles.certStatus} ${
            groupCompleted ? styles.certUnlocked : ""
          }`}
        >
          {groupCompleted ? (
            <>
              <ShieldCheck size={13} />
              Unlocked
            </>
          ) : (
            <>
              <LockKeyhole size={13} />
              Locked
            </>
          )}
        </span>
      </section>

      {/* Trust panel */}
      <section className={styles.bottomPanel}>
        <div className={styles.bottomMessage}>
          <div className={styles.bottomIcon}>
            <ShieldCheck size={20} />
          </div>

          <div>
            <b>Fair attendance. Clear records.</b>
            <p>
              Attendance requests are reviewed by your administrator. Attendance
              and reward updates follow the recorded approval status.
            </p>
          </div>
        </div>

        <span className={styles.bottomTrust}>
          <ShieldCheck size={15} />
          Secure & transparent
        </span>
      </section>
    </div>
  );
}
