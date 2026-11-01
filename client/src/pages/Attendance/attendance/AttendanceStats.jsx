import styles from "./AttendanceStats.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) return "0";

  return Math.round(number).toLocaleString("en-IN");
}

function formatPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0%";

  return `${Math.min(100, Math.max(0, Math.round(number)))}%`;
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function RateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 6-7" />
      <path d="M16 6h4v4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="m8 15 2 2 5-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function MissedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3l-7.8-14.1a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22a8 8 0 0 0 8-8c0-4-3-7-5-9-.3 3-2 4-3 5-1-3-3-5-4-6-1 4-4 7-4 11a8 8 0 0 0 8 7Z" />
      <path d="M12 22a4 4 0 0 0 4-4c0-2-1.5-3.5-3-5-1 2-3 3-3 5a4 4 0 0 0 2 4Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function StatSkeleton() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonTop}>
        <span />
        <span />
      </div>

      <div className={styles.skeletonValue} />

      <div className={styles.skeletonBottom} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({ title, value, description, Icon, tone, suffix }) {
  return (
    <article className={`${styles.statCard} ${styles[tone] || ""}`}>
      <div className={styles.cardTop}>
        <div className={styles.statIcon}>
          <Icon />
        </div>

        <span className={styles.statCategory}>{title}</span>
      </div>

      <div className={styles.statValueRow}>
        <strong className={styles.statValue}>{value}</strong>

        {suffix && <span className={styles.statSuffix}>{suffix}</span>}
      </div>

      <div className={styles.cardBottom}>
        <span className={styles.statDescription}>{description}</span>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceStats({ stats = {}, loading = false }) {
  const attendanceRate = formatPercentage(stats.attendanceRate);
  const approvedDays = formatNumber(stats.approvedDays);
  const approvedSessions = formatNumber(stats.approvedSessions);
  const pendingSessions = formatNumber(stats.pendingSessions);
  const rejectedSessions = formatNumber(stats.rejectedSessions);
  const missedSessions = formatNumber(stats.missedSessions);
  const currentStreak = formatNumber(stats.currentStreak);

  const cards = [
    {
      title: "Attendance rate",
      value: attendanceRate,
      description: "Based on approved sessions",
      Icon: RateIcon,
      tone: "rateCard",
    },
    {
      title: "Approved days",
      value: approvedDays,
      description: "Days with approved attendance",
      Icon: CalendarIcon,
      tone: "daysCard",
    },
    {
      title: "Approved sessions",
      value: approvedSessions,
      description: "Successfully approved",
      Icon: CheckIcon,
      tone: "approvedCard",
    },
    {
      title: "Pending reviews",
      value: pendingSessions,
      description: "Waiting for administrator review",
      Icon: ClockIcon,
      tone: "pendingCard",
    },
    {
      title: "Missed sessions",
      value: missedSessions,
      description: "Automatically recorded missed sessions",
      Icon: MissedIcon,
      tone: "missedCard",
    },
  ];

  return (
    <section
      className={styles.section}
      aria-label="Attendance statistics"
      aria-busy={loading}
    >
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>YOUR PERFORMANCE</span>
          <h2>Attendance at a glance</h2>
          <p>Here is how your internship attendance is progressing.</p>
        </div>

        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          Attendance summary
        </div>
      </div>

      {loading ? (
        <div className={styles.statsGrid}>
          {Array.from({ length: 5 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className={styles.statsGrid}>
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      )}

      <div className={styles.secondaryStats}>
        <div className={styles.streakItem}>
          <span className={styles.streakIcon}>
            <FlameIcon />
          </span>

          <span className={styles.secondaryText}>
            <span className={styles.secondaryLabel}>Current streak</span>
            <strong>
              {loading
                ? "—"
                : `${currentStreak} ${Number(currentStreak) === 1 ? "day" : "days"}`}
            </strong>
          </span>
        </div>

        <span className={styles.secondaryDivider} />

        <div className={styles.rejectedItem}>
          <span className={styles.rejectedDot} />

          <span className={styles.secondaryText}>
            <span className={styles.secondaryLabel}>Rejected sessions</span>
            <strong>{loading ? "—" : rejectedSessions}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}
