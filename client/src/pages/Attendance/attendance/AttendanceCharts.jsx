import styles from "./AttendanceCharts.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatCount(value) {
  return safeNumber(value).toLocaleString("en-IN");
}

function getShortDate(dateKey) {
  if (!dateKey) return "--";

  const match = String(dateKey).match(/^\d{4}-(\d{2})-(\d{2})$/);

  if (!match) return String(dateKey).slice(0, 6);

  return `${Number(match[2])}/${Number(match[1])}`;
}

function getDateTitle(item) {
  return item?.label || item?.date || "Attendance date";
}

function getChartMaximum(data) {
  const highest = data.reduce((maximum, item) => {
    const total =
      safeNumber(item.first) +
      safeNumber(item.second) +
      safeNumber(item.pending) +
      safeNumber(item.rejected) +
      safeNumber(item.missed);

    return Math.max(maximum, total);
  }, 0);

  return Math.max(2, highest);
}

function getPercentage(value, total) {
  if (!total) return 0;

  return Math.min(100, Math.round((value / total) * 100));
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function TrendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
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

function PieIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" />
      <path d="M16 3.7A9 9 0 0 1 20.3 8H16V3.7Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading state                                                              */
/* -------------------------------------------------------------------------- */

function ChartSkeleton() {
  return (
    <div className={styles.chartSkeleton} aria-hidden="true">
      <div className={styles.skeletonHeader}>
        <span />
        <span />
      </div>

      <div className={styles.skeletonBars}>
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            style={{
              height: `${30 + ((index * 17) % 65)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Trend chart                                                                */
/* -------------------------------------------------------------------------- */

function AttendanceTrendChart({ data }) {
  const chartMaximum = getChartMaximum(data);

  if (!data.length) {
    return (
      <div className={styles.emptyChart}>
        <div className={styles.emptyChartIcon}>
          <TrendIcon />
        </div>

        <h3>No attendance trend yet</h3>

        <p>
          Your attendance trend will appear here after your first sessions have
          been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.trendChart}>
      <div className={styles.chartYAxis} aria-hidden="true">
        <span>{chartMaximum}</span>
        <span>{Math.ceil(chartMaximum / 2)}</span>
        <span>0</span>
      </div>

      <div className={styles.chartMain}>
        <div className={styles.chartPlot}>
          <div className={styles.chartGridLines} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div
            className={styles.barCollection}
            role="img"
            aria-label="Daily attendance trend. Each bar shows approved first sessions, approved second sessions, pending sessions, rejected sessions and missed sessions."
          >
            {data.map((item, index) => {
              const first = safeNumber(item.first);
              const second = safeNumber(item.second);
              const pending = safeNumber(item.pending);
              const rejected = safeNumber(item.rejected);
              const missed = safeNumber(item.missed);

              const total = first + second + pending + rejected + missed;

              const title = [
                getDateTitle(item),
                `Approved Session 1: ${first}`,
                `Approved Session 2: ${second}`,
                `Pending: ${pending}`,
                `Rejected: ${rejected}`,
                `Missed: ${missed}`,
              ].join(" · ");

              const height = (total / chartMaximum) * 100;

              return (
                <div
                  className={styles.barColumn}
                  key={`${item.date || "date"}-${index}`}
                  title={title}
                >
                  <div className={styles.barArea}>
                    <div
                      className={styles.barStack}
                      style={{
                        height: `${height}%`,
                      }}
                    >
                      {missed > 0 && (
                        <span
                          className={styles.missedSegment}
                          style={{
                            flexGrow: missed,
                          }}
                        />
                      )}

                      {rejected > 0 && (
                        <span
                          className={styles.rejectedSegment}
                          style={{
                            flexGrow: rejected,
                          }}
                        />
                      )}

                      {pending > 0 && (
                        <span
                          className={styles.pendingSegment}
                          style={{
                            flexGrow: pending,
                          }}
                        />
                      )}

                      {second > 0 && (
                        <span
                          className={styles.secondSegment}
                          style={{
                            flexGrow: second,
                          }}
                        />
                      )}

                      {first > 0 && (
                        <span
                          className={styles.firstSegment}
                          style={{
                            flexGrow: first,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <span className={styles.barDate}>
                    {getShortDate(item.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Session breakdown                                                          */
/* -------------------------------------------------------------------------- */

function BreakdownRow({ label, count, percentage, tone }) {
  return (
    <div className={styles.breakdownRow}>
      <div className={styles.breakdownTop}>
        <span className={styles.breakdownLabel}>
          <span className={`${styles.breakdownDot} ${styles[tone]}`} />
          {label}
        </span>

        <strong>{formatCount(count)}</strong>
      </div>

      <div
        className={styles.breakdownTrack}
        role="progressbar"
        aria-label={`${label} share of recorded sessions`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span
          className={`${styles.breakdownFill} ${styles[`${tone}Fill`]}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <span className={styles.breakdownPercentage}>
        {percentage}% of recorded sessions
      </span>
    </div>
  );
}

function SessionBreakdown({ stats }) {
  const approved = safeNumber(stats.approvedSessions);
  const pending = safeNumber(stats.pendingSessions);
  const rejected = safeNumber(stats.rejectedSessions);
  const missed = safeNumber(stats.missedSessions);

  const total = approved + pending + rejected + missed;

  const items = [
    {
      label: "Approved",
      count: approved,
      percentage: getPercentage(approved, total),
      tone: "approved",
    },
    {
      label: "Pending review",
      count: pending,
      percentage: getPercentage(pending, total),
      tone: "pending",
    },
    {
      label: "Rejected",
      count: rejected,
      percentage: getPercentage(rejected, total),
      tone: "rejected",
    },
    {
      label: "Missed",
      count: missed,
      percentage: getPercentage(missed, total),
      tone: "missed",
    },
  ];

  return (
    <div className={styles.breakdown}>
      <div className={styles.breakdownTotal}>
        <div>
          <span className={styles.breakdownTotalLabel}>Tracked sessions</span>

          <strong>{formatCount(total)}</strong>
        </div>

        <span className={styles.breakdownTotalIcon}>
          <PieIcon />
        </span>
      </div>

      {total === 0 ? (
        <div className={styles.emptyBreakdown}>
          <p>No session records are available yet.</p>
        </div>
      ) : (
        <div className={styles.breakdownRows}>
          {items.map((item) => (
            <BreakdownRow key={item.label} {...item} />
          ))}
        </div>
      )}

      <p className={styles.breakdownNote}>
        Only approved sessions count toward your attendance rate. Missed
        sessions are tracked separately and do not count as approved.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceCharts({
  data = [],
  stats = {},
  loading = false,
}) {
  const chartData = Array.isArray(data) ? data.slice(-14) : [];

  return (
    <section className={styles.section} aria-label="Attendance analytics">
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>ATTENDANCE ANALYTICS</span>
          <h2>Your attendance trends</h2>

          <p>Review your recorded sessions and submission status.</p>
        </div>

        <span className={styles.periodBadge}>Last 14 recorded days</span>
      </div>

      <div className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div className={styles.chartTitleGroup}>
              <span className={styles.chartIcon}>
                <TrendIcon />
              </span>

              <div>
                <h3>Daily session activity</h3>
                <p>Session-wise attendance history</p>
              </div>
            </div>
          </div>

          <div className={styles.chartContent}>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <>
                <AttendanceTrendChart data={chartData} />

                <div className={styles.chartLegend}>
                  <span>
                    <i className={styles.firstLegend} />
                    Session 1 approved
                  </span>

                  <span>
                    <i className={styles.secondLegend} />
                    Session 2 approved
                  </span>

                  <span>
                    <i className={styles.pendingLegend} />
                    Pending
                  </span>

                  <span>
                    <i className={styles.rejectedLegend} />
                    Rejected
                  </span>

                  <span>
                    <i className={styles.missedLegend} />
                    Missed
                  </span>
                </div>
              </>
            )}
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div className={styles.chartTitleGroup}>
              <span className={`${styles.chartIcon} ${styles.breakdownIcon}`}>
                <PieIcon />
              </span>

              <div>
                <h3>Session breakdown</h3>
                <p>Current review status</p>
              </div>
            </div>
          </div>

          <div className={styles.breakdownContent}>
            {loading ? <ChartSkeleton /> : <SessionBreakdown stats={stats} />}
          </div>
        </article>
      </div>
    </section>
  );
}
