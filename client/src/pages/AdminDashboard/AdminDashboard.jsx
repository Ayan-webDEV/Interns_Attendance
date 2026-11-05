import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Layers3,
  CalendarCheck,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Clock3,
  ChevronRight,
  Tally1,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import StatCard from "../../components/StatCard/StatCard";
import Loader from "../../components/Loader/Loader";
import styles from "./AdminDashboard.module.css";

/* -------------------------------------------------------------------------- */
/* IST date                                                                   */
/* -------------------------------------------------------------------------- */

const getTodayIST = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/* -------------------------------------------------------------------------- */
/* Attendance status definitions                                              */
/* -------------------------------------------------------------------------- */

const PRESENT_STATUSES = ["approved", "admin_corrected_present"];

const MISSED_STATUSES = [
  "missed",
  "rejected",
  "admin_corrected_absent",
  "absent",
];

/* -------------------------------------------------------------------------- */
/* Get session statistics from attendance records                            */
/* -------------------------------------------------------------------------- */

const getSessionStatsFromRecords = (records, sessionNumber, today) => {
  const sessionRecords = records.filter(
    (record) =>
      String(record.dateKey || "").slice(0, 10) === today &&
      Number(record.sessionNumber) === sessionNumber,
  );

  return {
    present: sessionRecords.filter((record) =>
      PRESENT_STATUSES.includes(record.status),
    ).length,

    missed: sessionRecords.filter((record) =>
      MISSED_STATUSES.includes(record.status),
    ).length,

    pending: sessionRecords.filter((record) => record.status === "pending")
      .length,
  };
};

/* -------------------------------------------------------------------------- */
/* Prefer backend aggregation, fall back to the attendance report             */
/* -------------------------------------------------------------------------- */

const getSessionStats = (backendStats, records, sessionNumber, today) => {
  if (backendStats && typeof backendStats === "object") {
    return {
      present: Number(backendStats.present || 0),
      missed: Number(backendStats.missed || 0),
      pending: Number(backendStats.pending || 0),
    };
  }

  return getSessionStatsFromRecords(records, sessionNumber, today);
};

/* -------------------------------------------------------------------------- */
/* Session attendance card                                                   */
/* -------------------------------------------------------------------------- */

function SessionSummaryCard({ title, subtitle, stats, icon: Icon, tone }) {
  return (
    <section className={`${styles.sessionCard} ${styles[tone]}`}>
      <div className={styles.sessionTop}>
        <div>
          <span className={styles.sessionLabel}>{title}</span>

          <div className="my-2 w-full flex justify-between items-center">
            <div className={styles.sessionPresent}>{stats.present}</div>
            <span
              className={`ms-10  text-xs  rounded-2xl ${title === "Session 2" ? "bg-slate-100" : "bg-amber-100"} px-3 py-2`}
            >
              ~{" "}
              {stats.present + stats.missed + stats.pending === 0
                ? 0
                : Math.round(
                    (stats.present / (stats.present + stats.missed)) * 100,
                  )}
              % <small>Present</small>
            </span>
          </div>

          <span className={styles.sessionSubtitle}>{subtitle}</span>
        </div>

        <div className={styles.sessionIcon}>
          <Icon size={20} />
        </div>
      </div>

      <div className={styles.sessionDivider} />

      <div className={styles.sessionBottom}>
        <span className={styles.totalCount}>
          T{" "}
          <strong className="flex">
            <div className="w-4">
              <Tally1 size={17} className="ms-1" />
            </div>
            {stats.missed + stats.present + stats.pending}
          </strong>
        </span>

        <span className={styles.sessionSeparator}>//</span>

        <span className={styles.missedCount}>
          M{" "}
          <strong className="flex">
            <div className="w-4">
              <Tally1 size={17} className="ms-1" />
            </div>
            {stats.missed}
          </strong>
        </span>

        <span className={styles.sessionSeparator}>//</span>

        <span className={styles.pendingCount}>
          P
          <strong className="flex">
            <div className="w-4">
              <Tally1 size={17} className="ms-1" />
            </div>
            {stats.pending}
          </strong>
        </span>
      </div>
    </section>
  );
}
/* -------------------------------------------------------------------------- */
/* Admin dashboard                                                            */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setLoadError("");

      const results = await Promise.allSettled([
        api("/admin/overview"),
        api("/groups"),
        api("/attendance/admin/report"),
      ]);

      if (!active) return;

      if (results[0].status === "fulfilled") {
        setData(results[0].value);
      } else {
        setLoadError(
          results[0].reason?.message ||
            "Unable to load admin overview statistics.",
        );
      }

      if (results[1].status === "fulfilled") {
        setGroups(results[1].value.groups || []);
      }

      if (results[2].status === "fulfilled") {
        setRecords(results[2].value.records || []);
      }

      setLoading(false);
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const today = getTodayIST();

  /* ---------------------------------------------------------------------- */
  /* Today's session data                                                   */
  /* ---------------------------------------------------------------------- */

  const session1 = useMemo(
    () =>
      getSessionStats(data?.attendanceBySession?.session1, records, 1, today),
    [data, records, today],
  );

  const session2 = useMemo(
    () =>
      getSessionStats(data?.attendanceBySession?.session2, records, 2, today),
    [data, records, today],
  );

  const combinedPresent = data?.attendanceBySession
    ? session1.present + session2.present
    : Number(data?.presentToday ?? session1.present + session2.present);

  /* ---------------------------------------------------------------------- */
  /* Existing pending approvals                                             */
  /* ---------------------------------------------------------------------- */

  const pending = records.filter(
    (record) => record.status === "pending",
  ).length;

  if (loading) {
    return <Loader label="Loading administration workspace…" full={false} />;
  }

  return (
    <div className={styles.page}>
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}

      <div className={styles.heading}>
        <div>
          <div className={styles.kicker}>ADMINISTRATION / OVERVIEW</div>

          <h1>Good day. Here’s the overview.</h1>

          <p>
            Manage your intern groups, review attendance, and keep the programme
            running smoothly.
          </p>
        </div>

        <div className={styles.secure}>
          <ShieldCheck size={16} />
          Admin workspace
        </div>
      </div>

      {loadError && (
        <div className={styles.dashboardError} role="alert">
          <ShieldCheck size={16} />
          {loadError}
        </div>
      )}

      {/* ================================================================== */}
      {/* MAIN STAT CARDS                                                     */}
      {/* ================================================================== */}

      <div className={styles.stats}>
        <StatCard
          label="Total interns"
          value={data?.totalInterns ?? 0}
          sub="All registered accounts"
          icon={Users}
          tone="blue"
        />

        <StatCard
          label="Internship groups"
          value={data?.groups ?? groups.length}
          sub={`${data?.activeGroups ?? 0} currently active`}
          icon={Layers3}
          tone="mint"
        />

        <StatCard
          label="Present today"
          value={combinedPresent}
          double={true}
          subIcon={<Tally1 size={14} />}
          sub={
            <>
              S_01 : <span className="me-1.5" />
              {session1.present}
            </>
          }
          subOpt={
            <>
              S_02 : <span className="me-1.5" />
              {session2.present}
            </>
          }
          icon={CalendarCheck}
          tone="violet"
        />

        <StatCard
          label="Pending approvals"
          value={pending}
          sub="Requests to review"
          icon={Clock3}
          tone="amber"
        />
      </div>

      {/* ================================================================== */}
      {/* NEW: SESSION-WISE ATTENDANCE                                        */}
      {/* ================================================================== */}

      <section className={styles.sessionSection}>
        <div className={styles.sessionHeading}>
          <div>
            <span className={styles.sessionEyebrow}>TODAY'S ATTENDANCE</span>

            <h2>Session-wise attendance</h2>

            <p>
              Separate present, missed and pending counts for both attendance
              sessions.
            </p>
          </div>

          <span className={styles.todayBadge}>
            {today}
            <CalendarCheck size={14} />
          </span>
        </div>

        <div className={styles.sessionGrid}>
          <div>
            <SessionSummaryCard
              title="Session 1"
              subtitle="Interns present"
              stats={session1}
              icon={Clock3}
              tone="sessionOne"
              // sessionSection={true}
            />
          </div>

          <SessionSummaryCard
            title="Session 2"
            subtitle="Interns present"
            stats={session2}
            icon={CalendarCheck}
            tone="sessionTwo"
            // sessionSection={true}
          />
        </div>

        <div className={styles.sessionLegend}>
          <span className="flex items-center">
            <i className={styles.totalDot} />T = Total Intern
          </span>
          <span>
            <i className={styles.missedDot} />M = Missed / Rejected
          </span>
          <span>
            <i className={styles.pendingDot} />P = Pending approval
          </span>
        </div>
      </section>

      {/* ================================================================== */}
      {/* GROUP ACTIVITY AND QUICK ACTIONS                                   */}
      {/* ================================================================== */}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Group activity</h2>
              <p>Keep track of the groups you oversee.</p>
            </div>

            <Link to="/admin/groups">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className={styles.groups}>
            {groups.slice(0, 5).map((group) => (
              <div className={styles.group} key={group._id}>
                <div className={styles.groupIcon}>
                  <Layers3 size={17} />
                </div>

                <div className={styles.groupInfo}>
                  <b>{group.name}</b>

                  <span>
                    {group.internCount || 0} interns ·{" "}
                    {group.durationDays || 28} day duration
                  </span>
                </div>

                <span
                  className={`${styles.pill} ${
                    group.status === "active" ? styles.active : ""
                  }`}
                >
                  {String(group.status || "registration").replace("_", " ")}
                </span>

                <Link to="/admin/groups" aria-label={`Manage ${group.name}`}>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            ))}

            {groups.length === 0 && (
              <div className={styles.empty}>
                No groups yet. Create your first internship group to get
                started.
              </div>
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Quick actions</h2>
              <p>Common admin tasks, one click away.</p>
            </div>

            <Activity size={18} color="#42b990" />
          </div>

          <div className={styles.actions}>
            <Link to="/admin/groups">
              <span className={styles.actionIcon}>
                <Layers3 size={18} />
              </span>

              <span>
                <b>Create or edit a group</b>
                <small>Set duration, group code and invite link</small>
              </span>

              <ArrowUpRight size={15} />
            </Link>

            <Link to="/admin/approvals">
              <span className={styles.actionIcon}>
                <CheckCircle2 size={18} />
              </span>

              <span>
                <b>Review attendance</b>
                <small>Approve single or multiple requests</small>
              </span>

              <ArrowUpRight size={15} />
            </Link>

            <Link to="/admin/interns">
              <span className={styles.actionIcon}>
                <Users size={18} />
              </span>

              <span>
                <b>Find an intern</b>
                <small>Search profiles and group assignments</small>
              </span>

              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className={styles.note}>
            <ShieldCheck size={17} />

            <p>
              Completing a group requires two different authorized admin
              approvals. Export the full archive before deleting a completed
              group.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
