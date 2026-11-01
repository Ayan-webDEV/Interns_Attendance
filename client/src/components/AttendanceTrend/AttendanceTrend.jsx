import { useMemo, useState } from "react";
import { ChartNoAxesColumn, ChartNoAxesCombined, Activity } from "lucide-react";

import styles from "./AttendanceTrend.module.css";

const SERIES = [
  {
    key: "approved",
    label: "Approved",
    color: "#16834a",
  },
  {
    key: "pending",
    label: "Pending",
    color: "#e09a12",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#d94e43",
  },
  {
    key: "missed",
    label: "Missed",
    color: "#8057c7",
  },
];

const MISSED_STATUSES = new Set(["missed", "absent", "auto_absent"]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

/* -------------------------------------------------------------------------- */
/* Data helpers                                                               */
/* -------------------------------------------------------------------------- */

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getStatus(record) {
  const status = normalizeStatus(record?.status);

  if (status === "approved" || status === "admin_corrected_present") {
    return "approved";
  }

  if (PENDING_STATUSES.has(status)) {
    return "pending";
  }

  if (status === "rejected") {
    return "rejected";
  }

  if (
    MISSED_STATUSES.has(status) ||
    record?.isMissed === true ||
    record?.missed === true
  ) {
    return "missed";
  }

  return null;
}

function getDateKey(record) {
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
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getSessionNumber(record) {
  const number = Number(
    record?.sessionNumber ?? record?.session ?? record?.sessionNo,
  );

  return number === 1 || number === 2 ? number : null;
}

function getUpdatedTimestamp(record) {
  const value =
    record?.reviewedAt ||
    record?.updatedAt ||
    record?.submittedAt ||
    record?.createdAt;

  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getStatusPriority(record) {
  const status = getStatus(record);

  return (
    {
      approved: 5,
      pending: 4,
      rejected: 3,
      missed: 2,
    }[status] || 0
  );
}

function getUniqueRecords(records) {
  const unique = new Map();
  const unkeyed = [];

  (Array.isArray(records) ? records : []).forEach((record, index) => {
    if (!record) return;

    const dateKey = getDateKey(record);
    const sessionNumber = getSessionNumber(record);

    if (!dateKey) {
      unkeyed.push(record);
      return;
    }

    const id = record?._id || record?.id;

    const key = sessionNumber
      ? `${dateKey}:session:${sessionNumber}`
      : id
        ? `${dateKey}:id:${id}`
        : `${dateKey}:record:${index}`;

    const previous = unique.get(key);

    if (!previous) {
      unique.set(key, record);
      return;
    }

    const previousTime = getUpdatedTimestamp(previous);
    const nextTime = getUpdatedTimestamp(record);

    if (
      nextTime > previousTime ||
      (nextTime === previousTime &&
        getStatusPriority(record) > getStatusPriority(previous))
    ) {
      unique.set(key, record);
    }
  });

  return [...unique.values(), ...unkeyed];
}

function formatDay(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return "--";

  const [, year, month, day] = match;

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function getAxisLabels(maxValue) {
  return [maxValue, Math.ceil(maxValue / 2), 0];
}

function buildPoints(records) {
  const uniqueRecords = getUniqueRecords(records);
  const dateMap = new Map();

  uniqueRecords.forEach((record) => {
    const dateKey = getDateKey(record);
    const status = getStatus(record);

    if (!dateKey || !status) return;

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        approved: 0,
        pending: 0,
        rejected: 0,
        missed: 0,
      });
    }

    dateMap.get(dateKey)[status] += 1;
  });

  return [...dateMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((item) => ({
      ...item,
      label: formatDay(item.date),
      total: item.approved + item.pending + item.rejected + item.missed,
    }));
}

function getSeriesTotals(points) {
  return SERIES.reduce((totals, series) => {
    totals[series.key] = points.reduce(
      (sum, point) => sum + point[series.key],
      0,
    );

    return totals;
  }, {});
}

/* -------------------------------------------------------------------------- */
/* SVG line helpers                                                           */
/* -------------------------------------------------------------------------- */

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 260;
const PLOT_LEFT = 35;
const PLOT_RIGHT = 985;
const PLOT_TOP = 22;
const PLOT_BOTTOM = 218;

function getX(index, length) {
  if (length <= 1) {
    return (PLOT_LEFT + PLOT_RIGHT) / 2;
  }

  return PLOT_LEFT + index * ((PLOT_RIGHT - PLOT_LEFT) / (length - 1));
}

function getY(value, maxValue) {
  const ratio = Math.max(0, Math.min(1, value / maxValue));

  return PLOT_BOTTOM - ratio * (PLOT_BOTTOM - PLOT_TOP);
}

function createLinePath(points, seriesKey, maxValue) {
  if (!points.length) return "";

  return points
    .map((point, index) => {
      const x = getX(index, points.length);
      const y = getY(point[seriesKey], maxValue);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function EmptyGraphIcon() {
  return <Activity size={24} strokeWidth={1.7} aria-hidden="true" />;
}

/* -------------------------------------------------------------------------- */
/* Line graph                                                                 */
/* -------------------------------------------------------------------------- */

function LineGraph({ points, maxValue }) {
  const axisLabels = getAxisLabels(maxValue);

  return (
    <div className={styles.chartLayout}>
      <div className={styles.yAxis} aria-hidden="true">
        {axisLabels.map((value, index) => (
          <span key={`${value}-${index}`}>{value}</span>
        ))}
      </div>

      <div className={styles.plotArea}>
        <svg
          className={styles.lineSvg}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Attendance line graph showing approved, pending, rejected and missed sessions for each recorded date."
        >
          {axisLabels.map((value, index) => {
            const y = getY(value, maxValue);

            return (
              <line
                key={`grid-${index}`}
                x1={PLOT_LEFT}
                x2={PLOT_RIGHT}
                y1={y}
                y2={y}
                className={styles.gridLine}
              />
            );
          })}

          {SERIES.map((series) => {
            const path = createLinePath(points, series.key, maxValue);

            return (
              <g key={series.key}>
                <path
                  d={path}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />

                {points.map((point, index) => {
                  const x = getX(index, points.length);
                  const y = getY(point[series.key], maxValue);

                  return (
                    <circle
                      key={`${series.key}-${point.date}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#ffffff"
                      stroke={series.color}
                      strokeWidth="2.8"
                      vectorEffect="non-scaling-stroke"
                    >
                      <title>
                        {`${formatDay(point.date)} — ${series.label}: ${point[series.key]}`}
                      </title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>

        <div
          className={styles.xAxis}
          style={{
            gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
          }}
        >
          {points.map((point) => (
            <span key={point.date} title={point.date}>
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bar graph                                                                  */
/* -------------------------------------------------------------------------- */

function BarGraph({ points, maxValue }) {
  const axisLabels = getAxisLabels(maxValue);

  return (
    <div className={styles.chartLayout}>
      <div className={styles.yAxis} aria-hidden="true">
        {axisLabels.map((value, index) => (
          <span key={`${value}-${index}`}>{value}</span>
        ))}
      </div>

      <div className={styles.barPlot}>
        <div className={styles.barGridLines} aria-hidden="true">
          {axisLabels.map((value, index) => (
            <span key={`${value}-${index}`} />
          ))}
        </div>

        <div
          className={styles.barCollection}
          role="img"
          aria-label="Stacked bar graph of attendance statuses across recorded dates."
        >
          {points.map((point) => (
            <div
              className={styles.barColumn}
              key={point.date}
              title={[
                formatDay(point.date),
                ...SERIES.map(
                  (series) => `${series.label}: ${point[series.key]}`,
                ),
              ].join(" · ")}
            >
              <div className={styles.barArea}>
                <div
                  className={styles.barStack}
                  style={{
                    height: `${(point.total / maxValue) * 100}%`,
                  }}
                >
                  {SERIES.map((series) => {
                    const value = point[series.key];

                    if (!value) return null;

                    return (
                      <span
                        key={series.key}
                        className={styles[series.key]}
                        style={{
                          height: `${(value / point.total) * 100}%`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <span className={styles.barDate}>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Legend                                                                     */
/* -------------------------------------------------------------------------- */

function GraphLegend({ totals }) {
  return (
    <div className={styles.legend} aria-label="Graph indicators">
      {SERIES.map((series) => (
        <div className={styles.legendItem} key={series.key}>
          <span
            className={`${styles.legendDot} ${styles[`${series.key}Dot`]}`}
          />

          <span className={styles.legendLabel}>{series.label}</span>

          <strong>{totals[series.key] || 0}</strong>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceTrend({ records = [], missedRecords = [] }) {
  const [mode, setMode] = useState("line");

  const points = useMemo(() => {
    return buildPoints([
      ...(Array.isArray(records) ? records : []),
      ...(Array.isArray(missedRecords) ? missedRecords : []),
    ]);
  }, [records, missedRecords]);

  const totals = useMemo(() => {
    return getSeriesTotals(points);
  }, [points]);

  const maxValue = useMemo(() => {
    const highest = points.reduce(
      (maximum, point) => Math.max(maximum, point.total),
      0,
    );

    return Math.max(2, highest);
  }, [points]);

  const totalRecords = Object.values(totals).reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <section className={styles.card} aria-label="Attendance trend">
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <Activity size={19} />
          </span>

          <div>
            <span className={styles.kicker}>ATTENDANCE ANALYTICS</span>
            <h2>Attendance trend</h2>
            <p>Daily session outcomes across your latest recorded dates.</p>
          </div>
        </div>

        <div className={styles.toggle} aria-label="Graph display">
          <button
            type="button"
            className={mode === "line" ? styles.active : ""}
            onClick={() => setMode("line")}
            aria-label="Show line graph"
            aria-pressed={mode === "line"}
          >
            <ChartNoAxesCombined size={16} />
            <span>Line</span>
          </button>

          <button
            type="button"
            className={mode === "bar" ? styles.active : ""}
            onClick={() => setMode("bar")}
            aria-label="Show bar graph"
            aria-pressed={mode === "bar"}
          >
            <ChartNoAxesColumn size={16} />
            <span>Bars</span>
          </button>
        </div>
      </div>

      {points.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <EmptyGraphIcon />
          </span>

          <h3>No attendance activity yet</h3>

          <p>
            Your attendance graph will appear after session records are
            available. Approved, pending, rejected and missed sessions will have
            separate indicators.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.chartSummary}>
            {SERIES.map((series) => (
              <div className={styles.summaryItem} key={series.key}>
                <span
                  className={`${styles.summaryDot} ${styles[`${series.key}Dot`]}`}
                />
                <span>{series.label}</span>
                <strong>{totals[series.key] || 0}</strong>
              </div>
            ))}
          </div>

          <div className={styles.graph}>
            {mode === "line" ? (
              <LineGraph points={points} maxValue={maxValue} />
            ) : (
              <BarGraph points={points} maxValue={maxValue} />
            )}
          </div>

          <GraphLegend totals={totals} />
        </>
      )}

      <div className={styles.footer}>
        <span>
          <span className={styles.footerDot} />
          {points.length} recorded {points.length === 1 ? "date" : "dates"}
        </span>

        <small>{totalRecords} classified session records</small>
      </div>

      <p className={styles.graphNote}>
        Missed sessions are counted only when supplied as a missed/absent record
        or with <code>isMissed: true</code>. A date without a record is not
        automatically treated as missed.
      </p>
    </section>
  );
}
