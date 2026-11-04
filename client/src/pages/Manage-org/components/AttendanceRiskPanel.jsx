import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import {
  getInternAttendanceSummary,
  getInternRecords,
} from "../../admin/utils/adminAttendance";

import styles from "./AttendanceRiskPanel.module.css";

const MISSED_STATUSES = new Set(["missed", "absent", "not_marked"]);

const FILTERS = [
  { id: "all", label: "All risks" },
  { id: "first", label: "Session 1" },
  { id: "second", label: "Session 2" },
  { id: "streak", label: "Missed streaks" },
  { id: "inactive", label: "Inactive" },
];

const getDateKey = (date) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
};

const parseDateKey = (key) => {
  if (!key) return null;

  const [year, month, day] = key.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const formatDate = (dateKey) => {
  if (!dateKey) return "Not available";

  const date = parseDateKey(dateKey);

  if (!date) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInternName = (intern) =>
  intern?.name || intern?.fullName || intern?.user?.name || "Unknown intern";

const getInternId = (intern) =>
  intern?.internId || intern?.user?.internId || "ID unavailable";

const getGroupName = (intern) =>
  intern?.group?.name || intern?.groupName || "Unassigned group";

/**
 * Calculates a consecutive fully-missed working-day streak.
 *
 * A day counts only when both session records exist and both have an
 * explicit missed status. Sundays are excluded, matching the existing
 * attendance calendar helper.
 *
 * Missing records are not interpreted as absence.
 */
function getConsecutiveMissedDays(intern, attendance, summary) {
  const records = getInternRecords(intern, attendance);

  if (!records.length) return 0;

  const recordMap = new Map();

  records.forEach((record) => {
    const dateKey = record?.dateKey;
    const sessionNumber = Number(record?.sessionNumber);

    if (!dateKey || ![1, 2].includes(sessionNumber)) return;

    const key = `${dateKey}:${sessionNumber}`;

    recordMap.set(key, record);
  });

  const firstRecordDate = records
    .map((record) => record?.dateKey)
    .filter(Boolean)
    .sort()[0];

  const startKey = summary?.startDate
    ? getDateKey(summary.startDate)
    : firstRecordDate;

  if (!startKey) return 0;

  const startDate = parseDateKey(startKey);

  if (!startDate) return 0;

  const today = new Date();
  const todayKey = getDateKey(today);

  let lastEligibleDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const endDate = summary?.endDate ? parseDateKey(summary.endDate) : null;

  if (endDate && endDate < lastEligibleDate) {
    lastEligibleDate = endDate;
  }

  if (startDate > lastEligibleDate) return 0;

  const eligibleDays = [];
  const cursor = new Date(startDate);

  while (cursor <= lastEligibleDate && eligibleDays.length < 370) {
    // Sundays are excluded by the existing attendance calendar.
    if (cursor.getDay() !== 0) {
      eligibleDays.push(getDateKey(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (!eligibleDays.length) return 0;

  let index = eligibleDays.length - 1;

  const latestDate = eligibleDays[index];
  const latestSessionOne = recordMap.get(`${latestDate}:1`);
  const latestSessionTwo = recordMap.get(`${latestDate}:2`);

  /*
   * Today's attendance might still be in progress.
   * Ignore today's incomplete records rather than treating them as missed.
   */
  const internshipHasEnded =
    Boolean(endDate) && endDate < parseDateKey(todayKey);

  if (
    latestDate === todayKey &&
    !internshipHasEnded &&
    (!latestSessionOne || !latestSessionTwo)
  ) {
    index -= 1;
  }

  let streak = 0;

  for (let i = index; i >= 0; i -= 1) {
    const dateKey = eligibleDays[i];

    const first = recordMap.get(`${dateKey}:1`);
    const second = recordMap.get(`${dateKey}:2`);

    // Both session records must exist.
    if (!first || !second) break;

    const firstMissed = MISSED_STATUSES.has(first.status);
    const secondMissed = MISSED_STATUSES.has(second.status);

    // Both sessions must have an explicit missed status.
    if (!firstMissed || !secondMissed) break;

    streak += 1;
  }

  return streak;
}

function getRiskLevel(item) {
  if (item.consecutiveMissedDays >= 3) {
    return {
      label: "High risk",
      type: "high",
    };
  }

  if (
    item.explicitlyMissedFirst > 0 ||
    item.explicitlyMissedSecond > 0 ||
    item.isInactive
  ) {
    return {
      label: "Needs attention",
      type: "medium",
    };
  }

  return {
    label: "Monitor",
    type: "low",
  };
}

function getRiskData(interns = [], attendance = []) {
  return (Array.isArray(interns) ? interns : [])
    .map((intern) => {
      const summary = getInternAttendanceSummary(intern, attendance);

      const consecutiveMissedDays = getConsecutiveMissedDays(
        intern,
        attendance,
        summary,
      );

      const explicitlyMissedFirst = summary.explicitlyMissedFirst || 0;

      const explicitlyMissedSecond = summary.explicitlyMissedSecond || 0;

      const workingDaysSinceLast = summary.workingDaysSinceLast ?? 0;

      const isInactive = workingDaysSinceLast >= 3;

      const item = {
        intern,
        summary,
        name: getInternName(intern),
        internId: getInternId(intern),
        groupName: getGroupName(intern),
        explicitlyMissedFirst,
        explicitlyMissedSecond,
        totalMissed: explicitlyMissedFirst + explicitlyMissedSecond,
        consecutiveMissedDays,
        workingDaysSinceLast,
        lastAttendedDate: summary.lastAttendedDate,
        isInactive,
      };

      return {
        ...item,
        risk: getRiskLevel(item),
      };
    })
    .filter(
      (item) =>
        item.totalMissed > 0 ||
        item.isInactive ||
        item.consecutiveMissedDays >= 3,
    )
    .sort((a, b) => {
      if (b.consecutiveMissedDays !== a.consecutiveMissedDays) {
        return b.consecutiveMissedDays - a.consecutiveMissedDays;
      }

      if (b.totalMissed !== a.totalMissed) {
        return b.totalMissed - a.totalMissed;
      }

      return b.workingDaysSinceLast - a.workingDaysSinceLast;
    });
}

function RiskSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonMetrics}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeletonBlock} ${styles.skeletonMetric}`}
          />
        ))}
      </div>

      <div className={styles.skeletonContent}>
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
      </div>

      <div className={styles.skeletonTable}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeletonBlock} ${styles.skeletonRow}`}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, description, type }) {
  return (
    <div className={`${styles.metricCard} ${styles[`metric_${type}`]}`}>
      <div className={styles.metricTop}>
        <div className={styles.metricIcon}>
          <Icon size={19} />
        </div>

        <span className={styles.metricLabel}>{label}</span>
      </div>

      <div className={styles.metricValue}>{value}</div>

      <p className={styles.metricDescription}>{description}</p>
    </div>
  );
}

function EmptyState({ activeFilter }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <ShieldAlert size={27} />
      </div>

      <h3>No matching risk records</h3>

      <p>
        {activeFilter === "all"
          ? "No attendance risks were found for the currently loaded interns."
          : "No interns match this risk category right now."}
      </p>
    </div>
  );
}

function RiskBadge({ risk }) {
  return (
    <span className={`${styles.riskBadge} ${styles[`risk_${risk.type}`]}`}>
      <span className={styles.riskDot} />
      {risk.label}
    </span>
  );
}

function InternRiskRow({ item, onViewIntern }) {
  const showButton = typeof onViewIntern === "function";

  return (
    <div className={styles.internRow}>
      <div className={styles.internIdentity}>
        <div className={styles.avatar}>
          {item.name?.charAt(0)?.toUpperCase() || "I"}
        </div>

        <div className={styles.internInfo}>
          <div className={styles.internNameLine}>
            <h4>{item.name}</h4>
            <RiskBadge risk={item.risk} />
          </div>

          <p>
            {item.internId}
            <span className={styles.mobileDot}>•</span>
            <span>{item.groupName}</span>
          </p>
        </div>
      </div>

      <div className={styles.sessionStats}>
        <div className={styles.sessionStat}>
          <span className={styles.sessionLabel}>Session 1</span>
          <strong
            className={item.explicitlyMissedFirst ? styles.missedText : ""}
          >
            {item.explicitlyMissedFirst}
          </strong>
        </div>

        <div className={styles.sessionStat}>
          <span className={styles.sessionLabel}>Session 2</span>
          <strong
            className={item.explicitlyMissedSecond ? styles.missedText : ""}
          >
            {item.explicitlyMissedSecond}
          </strong>
        </div>
      </div>

      <div className={styles.streakInfo}>
        <div className={styles.streakValue}>
          <Flame
            size={15}
            className={
              item.consecutiveMissedDays >= 3
                ? styles.hotFlame
                : styles.normalFlame
            }
          />

          <strong>{item.consecutiveMissedDays} days</strong>
        </div>

        <span>Fully missed streak</span>
      </div>

      <div className={styles.lastActive}>
        <span>Last attended</span>

        <strong>
          {item.lastAttendedDate
            ? formatDate(item.lastAttendedDate)
            : "No approved session"}
        </strong>

        {item.isInactive && (
          <small>{item.workingDaysSinceLast} working days inactive</small>
        )}
      </div>

      {showButton && (
        <button
          type="button"
          className={styles.viewButton}
          onClick={() => onViewIntern(item.intern)}
          aria-label={`View ${item.name}`}
        >
          <span>View</span>
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

export default function AttendanceRiskPanel({
  interns = [],
  attendance = [],
  loading = false,
  onViewIntern,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const riskData = useMemo(
    () => getRiskData(interns, attendance),
    [interns, attendance],
  );

  const metrics = useMemo(() => {
    const firstSession = riskData.filter(
      (item) => item.explicitlyMissedFirst > 0,
    ).length;

    const secondSession = riskData.filter(
      (item) => item.explicitlyMissedSecond > 0,
    ).length;

    const missedStreaks = riskData.filter(
      (item) => item.consecutiveMissedDays >= 3,
    ).length;

    const inactive = riskData.filter((item) => item.isInactive).length;

    return {
      firstSession,
      secondSession,
      missedStreaks,
      inactive,
    };
  }, [riskData]);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return riskData.filter((item) => {
      let matchesFilter = true;

      switch (activeFilter) {
        case "first":
          matchesFilter = item.explicitlyMissedFirst > 0;
          break;

        case "second":
          matchesFilter = item.explicitlyMissedSecond > 0;
          break;

        case "streak":
          matchesFilter = item.consecutiveMissedDays >= 3;
          break;

        case "inactive":
          matchesFilter = item.isInactive;
          break;

        default:
          matchesFilter = true;
      }

      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.internId.toLowerCase().includes(normalizedSearch) ||
        item.groupName.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [riskData, activeFilter, search]);

  if (loading) {
    return (
      <section className={styles.panel}>
        <RiskSkeleton />
      </section>
    );
  }

  return (
    <section className={`${styles.panel} min-w-0 w-full`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <ShieldAlert size={21} />
          </div>

          <div>
            <div className={styles.headingLine}>
              <h2>Attendance risk monitor</h2>

              <span className={styles.liveIndicator}>
                <span />
                Live data
              </span>
            </div>

            <p>
              Identify missed sessions, absence patterns and inactive interns.
            </p>
          </div>
        </div>

        <div className={styles.totalInterns}>
          <Users size={15} />
          <span>{interns.length} interns monitored</span>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <MetricCard
          icon={Clock3}
          label="Session 1"
          value={metrics.firstSession}
          description="Interns with missed first sessions"
          type="orange"
        />

        <MetricCard
          icon={XCircle}
          label="Session 2"
          value={metrics.secondSession}
          description="Interns with missed second sessions"
          type="purple"
        />

        <MetricCard
          icon={Flame}
          label="Missed streaks"
          value={metrics.missedStreaks}
          description="At least 3 fully missed working days"
          type="red"
        />

        <MetricCard
          icon={CalendarDays}
          label="Inactive"
          value={metrics.inactive}
          description="No approved attendance for 3+ working days"
          type="cyan"
        />
      </div>

      <div className={styles.insightBanner}>
        <div className={styles.insightIcon}>
          <AlertTriangle size={19} />
        </div>

        <div>
          <strong>Attendance needs attention</strong>
          <p>
            {riskData.length > 0
              ? `${riskData.length} intern${riskData.length === 1 ? "" : "s"} currently match at least one risk condition. Review their records before taking action.`
              : "No attendance risk conditions were detected in the loaded records."}
          </p>
        </div>
      </div>

      <div className={styles.listHeader}>
        <div>
          <h3>Intern risk directory</h3>
          <p>Review session-level attendance and inactivity patterns.</p>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} />

          <input
            type="search"
            placeholder="Search intern or group..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search intern or group"
          />
        </div>
      </div>

      <div className={styles.filterBar}>
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`${styles.filterButton} ${
              activeFilter === filter.id ? styles.filterActive : ""
            }`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className={styles.columnHeader}>
        <span>Intern</span>
        <span>Missed sessions</span>
        <span>Missed streak</span>
        <span>Last activity</span>
        <span>Action</span>
      </div>

      <div className={styles.internList}>
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <InternRiskRow
              key={item.intern?._id || item.intern?.internId}
              item={item}
              onViewIntern={onViewIntern}
            />
          ))
        ) : (
          <EmptyState activeFilter={activeFilter} />
        )}
      </div>

      <div className={styles.footerNote}>
        <div className={styles.footerNoteIcon}>
          <CheckCircle2 size={15} />
        </div>

        <p>
          A missed streak requires two explicit missed records per working day.
          Missing records are not counted as absences. Sundays are excluded;
          holidays and other exceptions cannot be inferred unless supplied by
          the attendance data.
        </p>
      </div>
    </section>
  );
}
