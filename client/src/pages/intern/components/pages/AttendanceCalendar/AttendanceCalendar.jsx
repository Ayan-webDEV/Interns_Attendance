import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleX,
  Clock3,
  LockKeyhole,
  CalendarCheck,
  ShieldCheck,
  Info,
} from "lucide-react";
import styles from "./AttendanceCalendar.module.css";

const STATUS = {
  approved: {
    label: "Approved",
    short: "APPROVED",
    letter: "A",
    color: "#15803d",
    background: "#dcfce7",
  },
  failed: {
    label: "Missed",
    short: "MISSED",
    letter: "M",
    color: "#b91c1c",
    background: "#fee2e2",
  },
  pending: {
    label: "Pending",
    short: "PENDING",
    letter: "P",
    color: "#a16207",
    background: "#fef3c7",
  },
  holiday: {
    label: "Holiday",
    short: "HOLIDAY",
    letter: "H",
    color: "#7e22ce",
    background: "#f3e8ff",
  },
  upcoming: {
    label: "Upcoming",
    short: "UPCOMING",
    letter: "U",
    color: "#64748b",
    background: "#f1f5f9",
  },
  open: {
    label: "Attendance open",
    short: "OPEN",
    letter: "U",
    color: "#047857",
    background: "#d1fae5",
  },
  unknown: {
    label: "Status unavailable",
    short: "REVIEW",
    letter: "?",
    color: "#64748b",
    background: "#f1f5f9",
  },
};

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const FAILED_STATUSES = new Set(["rejected", "failed", "absent", "missed"]);

function getRecordStatus(record) {
  const status = String(record?.status || "").toLowerCase();

  if (APPROVED_STATUSES.has(status)) return "approved";
  if (status === "pending") return "pending";
  if (FAILED_STATUSES.has(status)) return "failed";

  // Unknown statuses must not be silently treated as absent.
  return "unknown";
}

function getISTParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function getISTDateKey(date = new Date()) {
  const parts = getISTParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function parseClock(value) {
  if (!value) return null;

  // Supports labels such as "9:30 AM" and "3:30 PM".
  const match = String(value).match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute > 59) return null;

  if (meridiem === "AM" && hour === 12) hour = 0;
  if (meridiem === "PM" && hour !== 12) hour += 12;

  return hour * 60 + minute;
}

function getWindowTimes(window) {
  if (!window) return null;

  // Prefer explicit numeric hour/minute fields when supplied by the API.
  const startValue = window.startTime ?? window.start ?? window.opensAt ?? null;

  const endValue = window.endTime ?? window.end ?? window.closesAt ?? null;

  if (startValue != null && endValue != null) {
    const parseValue = (value) => {
      if (typeof value === "number") return value;

      const clock = parseClock(value);
      if (clock !== null) return clock;

      const match = String(value).match(/^(\d{1,2}):(\d{2})$/);

      if (match) {
        return Number(match[1]) * 60 + Number(match[2]);
      }

      return null;
    };

    const start = parseValue(startValue);
    const end = parseValue(endValue);

    if (start !== null && end !== null) {
      return { start, end };
    }
  }

  const label = String(window.label || "");
  const clocks = label.match(/\d{1,2}(?::\d{2})?\s*(?:AM|PM)/gi);

  if (!clocks || clocks.length < 2) return null;

  const start = parseClock(clocks[0]);
  const end = parseClock(clocks[1]);

  return start === null || end === null ? null : { start, end };
}

function getWindowState(window, nowMinutes, isToday) {
  if (!window) return "unknown";

  const times = getWindowTimes(window);

  if (times) {
    if (nowMinutes < times.start) return "upcoming";
    if (nowMinutes < times.end) return "open";
    return "closed";
  }

  // An open flag cannot distinguish a future window from a closed one.
  if (window.open === true) return "open";

  return isToday ? "unknown" : "closed";
}

function getDayRecords(day) {
  return Array.isArray(day.records) ? day.records : [];
}

function getSessionStatus(day, sessionNumber, context) {
  if (day.sunday || day.holiday) return "holiday";

  const record = getDayRecords(day).find(
    (item) => Number(item.sessionNumber) === sessionNumber,
  );

  if (record) {
    const status = getRecordStatus(record);

    if (status !== "unknown") return status;
  }

  if (day.future) return "upcoming";

  const isToday = day.key === context.todayKey;

  // Previous dates have passed both attendance sessions.
  if (day.key < context.todayKey) return "failed";

  if (!isToday) return "upcoming";

  const window =
    sessionNumber === 1 ? context.windows?.first : context.windows?.second;

  const windowState = getWindowState(window, context.nowMinutes, true);

  if (windowState === "open") return "open";
  if (windowState === "upcoming") return "upcoming";
  if (windowState === "closed") return "failed";

  // Do not mark attendance missed without reliable timing information.
  return "unknown";
}

function getDayStatus(day, context) {
  if (day.sunday || day.holiday) return "holiday";

  const first = getSessionStatus(day, 1, context);
  const second = getSessionStatus(day, 2, context);
  const statuses = [first, second];

  if (statuses.every((status) => status === "approved")) {
    return "approved";
  }

  if (statuses.every((status) => status === "failed")) {
    return "failed";
  }

  if (statuses.every((status) => status === "pending")) {
    return "pending";
  }

  if (statuses.some((status) => status === "unknown")) {
    if (statuses.some((status) => status === "approved")) {
      return "mixed";
    }

    return "unknown";
  }

  if (statuses.every((status) => status === "upcoming")) {
    return "upcoming";
  }

  if (statuses.some((status) => status === "open")) {
    return statuses.some(
      (status) =>
        status === "approved" || status === "failed" || status === "pending",
    )
      ? "mixed"
      : "open";
  }

  const unique = new Set(statuses);

  return unique.size > 1 ? "mixed" : statuses[0];
}

function getDayBackground(day, context) {
  if (day.sunday || day.holiday) {
    return {
      "--day-bg": "#f3e8ff",
      "--day-border": "#d8b4fe",
      "--day-text": "#7e22ce",
    };
  }

  const first = getSessionStatus(day, 1, context);
  const second = getSessionStatus(day, 2, context);

  const colorFor = (status) => {
    return STATUS[status] || STATUS.unknown;
  };

  if (first === second) {
    const meta = colorFor(first);

    return {
      "--day-bg": meta.background,
      "--day-border": `${meta.color}55`,
      "--day-text": meta.color,
    };
  }

  const firstMeta = colorFor(first);
  const secondMeta = colorFor(second);

  return {
    "--day-bg": `linear-gradient(135deg, ${firstMeta.background} 0%, ${firstMeta.background} 49.5%, #ffffff 49.5%, #ffffff 50.5%, ${secondMeta.background} 50.5%, ${secondMeta.background} 100%)`,
    "--day-border": "#cbd5e1",
    "--day-text": "#334155",
  };
}

function getDayLabel(day, context) {
  if (day.sunday || day.holiday) return "HOLIDAY";

  const first = getSessionStatus(day, 1, context);
  const second = getSessionStatus(day, 2, context);

  if (first === second) {
    return STATUS[first]?.short || "REVIEW";
  }

  if (first === "unknown" || second === "unknown") {
    return "REVIEW";
  }

  return "MIXED";
}

// Converts each session status into its compact calendar letter.
function getSessionLetter(status) {
  const meta = STATUS[status] || STATUS.unknown;

  return {
    letter: meta.letter,
    label: meta.label,
    color: meta.color,
    background: meta.background,
  };
}

function LegendItem({ status, children }) {
  return (
    <span className={styles.legendItem}>
      <span
        className={styles.legendDot}
        style={{ backgroundColor: STATUS[status].color }}
      />
      <span>{children}</span>
    </span>
  );
}

export function countMissedSessions(calendar, windows) {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const todayKey = `${values.year}-${values.month}-${values.day}`;
  const nowMinutes = Number(values.hour) * 60 + Number(values.minute);

  const context = {
    todayKey,
    nowMinutes,
    windows,
  };

  let missed = 0;

  for (const day of calendar?.items || []) {
    if (day.sunday || day.holiday) continue;

    for (const sessionNumber of [1, 2]) {
      if (getSessionStatus(day, sessionNumber, context) === "failed") {
        missed += 1;
      }
    }
  }

  return missed;
}

export default function AttendanceCalendar({
  calendar,
  monthDate,
  monthLabel,
  changeMonth,
  dateToday,
  windows,
  onDayClick,
}) {
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const items = calendar?.items || [];
  const now = new Date();
  const istParts = getISTParts(now);
  const todayKey = dateToday?.() || getISTDateKey(now);

  const nowMinutes = Number(istParts.hour) * 60 + Number(istParts.minute);

  const context = useMemo(
    () => ({ todayKey, nowMinutes, windows }),
    [todayKey, nowMinutes, windows],
  );

  const selectedDay = items.find((day) => day.key === selectedDayKey);

  const attendanceTotals = useMemo(() => {
    const totals = {
      approved: 0,
      missed: 0,
      pending: 0,
      holiday: 0,
    };

    for (const day of items) {
      if (day.sunday || day.holiday) {
        totals.holiday += 1;
        continue;
      }

      // Count each session separately.
      for (const sessionNumber of [1, 2]) {
        const status = getSessionStatus(day, sessionNumber, context);

        if (status === "approved") {
          totals.approved += 1;
        } else if (status === "failed") {
          totals.missed += 1;
        } else if (status === "pending") {
          totals.pending += 1;
        }
      }
    }

    return totals;
  }, [items, context]);

  const approvedDays = attendanceTotals.approved;
  const missedDays = attendanceTotals.missed;
  const pendingDays = attendanceTotals.pending;
  const holidayDays = attendanceTotals.holiday;

  const canGoPrevious =
    !calendar?.start ||
    monthDate.getFullYear() > calendar.start.getFullYear() ||
    (monthDate.getFullYear() === calendar.start.getFullYear() &&
      monthDate.getMonth() > calendar.start.getMonth());

  const canGoNext =
    !calendar?.end ||
    monthDate.getFullYear() < calendar.end.getFullYear() ||
    (monthDate.getFullYear() === calendar.end.getFullYear() &&
      monthDate.getMonth() < calendar.end.getMonth());

  const handleDayClick = (day) => {
    setSelectedDayKey((current) => (current === day.key ? null : day.key));

    onDayClick?.(day);
  };

  return (
    <section
      className={`${styles.calendarPanel} panel w-full min-w-0 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm sm:p-5 lg:p-6`}
      aria-label="Internship attendance calendar"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={styles.headerIcon}>
              <CalendarDays size={19} />
            </span>

            <span className={styles.eyebrow}>INTERNSHIP TRACKER</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Internship calendar
          </h2>

          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
            Track both daily sessions, approvals, and missed attendance.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
          <button
            type="button"
            className={styles.monthButton}
            onClick={() => changeMonth(-1)}
            disabled={!canGoPrevious}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="min-w-[112px] text-center text-sm font-bold text-slate-800">
            {monthLabel}
          </span>

          <button
            type="button"
            className={styles.monthButton}
            onClick={() => changeMonth(1)}
            disabled={!canGoNext}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Attendance summary cards */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          {
            label: "Approved sessions",
            value: approvedDays,
            icon: <CheckCircle2 size={17} />,
            className: styles.approvedIcon,
          },
          {
            label: "Missed sessions",
            value: missedDays,
            icon: <CircleX size={17} />,
            className: styles.failedIcon,
          },
          {
            label: "Pending sessions",
            value: pendingDays,
            icon: <Clock3 size={17} />,
            className: styles.pendingIcon,
          },
          {
            label: "Holidays",
            value: holidayDays,
            icon: <CalendarCheck size={17} />,
            className: styles.holidayIcon,
          },
        ].map((stat) => (
          <div className={styles.summaryCard} key={stat.label}>
            <span className={`${styles.summaryIcon} ${stat.className}`}>
              {stat.icon}
            </span>

            <div className="min-w-0">
              <p className={styles.summaryLabel}>{stat.label}</p>
              <p className={styles.summaryValue}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="mt-5">
        <div className={styles.calendarScroll}>
          <div className={styles.calendarGrid}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className={styles.weekday} key={day}>
                {day}
              </div>
            ))}

            {Array.from({ length: calendar?.offset || 0 }, (_, index) => (
              <div
                className={styles.emptyCell}
                key={`blank-${index}`}
                aria-hidden="true"
              />
            ))}

            {items.map((day) => {
              const status = getDayStatus(day, context);
              const isToday = day.key === todayKey;
              const isSelected = day.key === selectedDayKey;

              const first = getSessionStatus(day, 1, context);
              const second = getSessionStatus(day, 2, context);

              const firstMeta = getSessionLetter(first);
              const secondMeta = getSessionLetter(second);

              const isHoliday = day.sunday || day.holiday;

              const firstLabel = isHoliday ? "Holiday" : firstMeta.label;

              const secondLabel = isHoliday ? "Holiday" : secondMeta.label;

              return (
                <button
                  type="button"
                  key={day.key}
                  className={[
                    styles.dayCell,
                    status === "mixed" ? styles.mixedDay : "",
                    isToday ? styles.today : "",
                    isSelected ? styles.selectedDay : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={getDayBackground(day, context)}
                  onClick={() => handleDayClick(day)}
                  aria-pressed={isSelected}
                  title={
                    isHoliday
                      ? `${day.key}: Holiday`
                      : `Session 1: ${firstLabel} · Session 2: ${secondLabel}`
                  }
                  aria-label={
                    isHoliday
                      ? `${day.key}. Holiday`
                      : `${day.key}. Session 1: ${firstLabel}. Session 2: ${secondLabel}.`
                  }
                >
                  {isToday && <span className={styles.todayMarker}>TODAY</span>}

                  <span className={styles.dayNumber}>{day.day}</span>

                  {/* Compact, color-coded session indicators */}
                  {isHoliday ? (
                    <>
                      <span className={styles.dayStatus}>HOLIDAY</span>

                      <LockKeyhole
                        className={styles.holidayLock}
                        size={11}
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    <>
                      <span className={styles.sessionStatusPair}>
                        <span
                          className={styles.sessionStatusLetter}
                          style={{
                            color: firstMeta.color,
                            backgroundColor: firstMeta.background,
                          }}
                          title={`Session 1: ${firstLabel}`}
                        >
                          {firstMeta.letter}
                        </span>

                        <span
                          className={styles.sessionStatusDivider}
                          aria-hidden="true"
                        >
                          |
                        </span>

                        <span
                          className={styles.sessionStatusLetter}
                          style={{
                            color: secondMeta.color,
                            backgroundColor: secondMeta.background,
                          }}
                          title={`Session 2: ${secondLabel}`}
                        >
                          {secondMeta.letter}
                        </span>
                      </span>

                      <span className={styles.dayStatus}>
                        {getDayLabel(day, context)}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className={styles.legend}>
        <LegendItem status="approved">A · Approved</LegendItem>
        <LegendItem status="failed">M · Missed</LegendItem>
        <LegendItem status="pending">P · Pending</LegendItem>
        <LegendItem status="upcoming">U · Upcoming</LegendItem>
        <LegendItem status="holiday">H · Holiday</LegendItem>
        <LegendItem status="open">Attendance open</LegendItem>
      </div>

      <div className={styles.trustNote}>
        <ShieldCheck size={17} className="mt-0.5 shrink-0" />

        <p>
          Pending attendance is not counted as approved. A session is marked
          missed only after its attendance window has closed and no valid
          attendance record exists.
        </p>
      </div>

      {/* Selected date details */}
      {selectedDay && (
        <div className={styles.dayDetails} aria-live="polite">
          <h3 className="text-sm font-bold text-slate-900">
            Session details · {selectedDay.key}
          </h3>

          {[1, 2].map((number) => {
            const status = getSessionStatus(selectedDay, number, context);

            const record = getDayRecords(selectedDay).find(
              (item) => Number(item.sessionNumber) === number,
            );

            const meta = STATUS[status] || STATUS.unknown;

            return (
              <div className={styles.sessionRow} key={number}>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {number === 1 ? "First attendance" : "Re-attendance"}
                  </p>

                  <p className="text-xs text-slate-500">
                    {record?.status
                      ? record.status.replaceAll("_", " ")
                      : "No attendance record"}
                  </p>
                </div>

                <span
                  className={styles.sessionStatus}
                  style={{
                    color: meta.color,
                    backgroundColor: meta.background,
                  }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}

          <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" />
            If a session has no record and its window times are unavailable, its
            status remains unconfirmed rather than being incorrectly marked
            absent.
          </p>
        </div>
      )}
    </section>
  );
}
