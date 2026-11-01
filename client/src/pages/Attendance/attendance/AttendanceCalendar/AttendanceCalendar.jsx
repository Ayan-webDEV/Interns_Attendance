import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleX,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Info,
  AlertCircle,
  CircleHelp,
} from "lucide-react";

import styles from "./AttendanceCalendar.module.css";

/* -------------------------------------------------------------------------- */
/* Attendance status configuration                                            */
/* -------------------------------------------------------------------------- */

const IST_TIME_ZONE = "Asia/Kolkata";
const DEFAULT_MINIMUM_SECONDS = 50;

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

const MISSED_STATUSES = new Set(["missed", "auto_missed", "auto_absent"]);

const STATUS_DETAILS = {
  approved: {
    label: "Approved",
    shortLabel: "Approved",
    letter: "A",
    className: "approved",
    color: "#14532D",
    background: "#D6E9D1",
    description: "This attendance session has been approved.",
  },
  pending: {
    label: "Pending review",
    shortLabel: "Pending",
    letter: "P",
    className: "pending",
    color: "#76500F",
    background: "#F8E9BF",
    description:
      "Your attendance request is waiting for administrator approval.",
  },
  rejected: {
    label: "Rejected",
    shortLabel: "Rejected",
    letter: "R",
    className: "rejected",
    color: "#8F2F28",
    background: "#F8DFD9",
    description: "This attendance submission was rejected by an administrator.",
  },
  missed: {
    label: "Missed",
    shortLabel: "Missed",
    letter: "M",
    className: "missed",
    color: "#912018",
    background: "#FEE4E2",
    description:
      "No valid attendance was completed before this session's attendance window closed.",
  },
  admin_absent: {
    label: "Marked absent",
    shortLabel: "Absent",
    letter: "X",
    className: "adminAbsent",
    color: "#503559",
    background: "#E9DDED",
    description: "An administrator corrected this session to absent.",
  },
  review: {
    label: "Needs review",
    shortLabel: "Review",
    letter: "?",
    className: "review",
    color: "#53658D",
    background: "#EEF1F8",
    description:
      "This record has an unrecognized status. Please check with your administrator.",
  },
  holiday: {
    label: "Holiday",
    shortLabel: "Holiday",
    letter: "H",
    className: "holiday",
    color: "#294D86",
    background: "#E1EAFC",
    description: "No regular attendance session is scheduled for this day.",
  },
  upcoming: {
    label: "Upcoming",
    shortLabel: "Upcoming",
    letter: "U",
    className: "upcoming",
    color: "#4B5C51",
    background: "#EFF2EC",
    description:
      "This session has not reached its scheduled attendance window.",
  },
  open: {
    label: "Window open",
    shortLabel: "Open",
    letter: "O",
    className: "open",
    color: "#24633D",
    background: "#E8F5EA",
    description: "The attendance window is currently open.",
  },
  insufficient_time: {
    label: "Window closing",
    shortLabel: "Closing",
    letter: "!",
    className: "insufficient",
    color: "#86621F",
    background: "#FDF5E4",
    description: "There may not be enough time left to complete this session.",
  },
  unknown: {
    label: "Status unavailable",
    shortLabel: "Review",
    letter: "?",
    className: "unknown",
    color: "#68756A",
    background: "#F3F4F0",
    description:
      "The session schedule or attendance status could not be verified.",
  },
  outside: {
    label: "Outside internship",
    shortLabel: "—",
    letter: "—",
    className: "outside",
    color: "#89928A",
    background: "#F5F6F3",
    description: "This date is outside the recorded internship period.",
  },
};

/* -------------------------------------------------------------------------- */
/* Date and time helpers                                                       */
/* -------------------------------------------------------------------------- */

function getISTDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getISTSeconds(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, Number(part.value)]),
  );

  return values.hour * 3600 + values.minute * 60 + values.second;
}

function getDateKey(value) {
  if (!value) return null;

  const text = String(value).trim();
  const dateOnly = text.match(/^\d{4}-\d{2}-\d{2}$/);

  if (dateOnly) return text;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return getISTDateKey(date);
}

function dateKeyToUTC(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(year, month, day) {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function getMonthParts(monthKey) {
  const match = String(monthKey || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * The attendance route still initializes its month state with `new Date()`
 * (the same contract used by the previous project). Accept that Date value
 * as well as the YYYY-MM string written by the month navigation controls.
 * Without this normalization, getMonthParts(Date) returns null and the
 * calendar renders weekdays with an empty date grid.
 */
function normalizeMonthKey(value, fallbackMonth) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? fallbackMonth
      : getISTDateKey(value).slice(0, 7);
  }

  const text = String(value ?? "").trim();
  const monthMatch = text.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);

  if (monthMatch) {
    const monthNumber = Number(monthMatch[2]);
    if (monthNumber >= 1 && monthNumber <= 12) {
      return `${monthMatch[1]}-${monthMatch[2]}`;
    }
  }

  if (text) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return getISTDateKey(parsed).slice(0, 7);
    }
  }

  return fallbackMonth;
}

function addMonths(monthKey, amount) {
  const parts = getMonthParts(monthKey);
  if (!parts) return null;

  const date = new Date(Date.UTC(parts.year, parts.month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey) {
  const parts = getMonthParts(monthKey);
  if (!parts) return "Attendance calendar";

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, 1)));
}

function getDateLabel(dateKey) {
  const date = dateKeyToUTC(dateKey);
  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST_TIME_ZONE,
  }).format(date);
}

/* -------------------------------------------------------------------------- */
/* Attendance record helpers                                                   */
/* -------------------------------------------------------------------------- */

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getRecordStatus(record) {
  if (!record) return null;

  const status = normalizeStatus(record.status);

  if (APPROVED_STATUSES.has(status)) return "approved";
  if (PENDING_STATUSES.has(status)) return "pending";
  if (status === "rejected") return "rejected";
  if (status === "admin_corrected_absent") return "admin_absent";

  if (
    MISSED_STATUSES.has(status) ||
    record.isMissed === true ||
    record.missed === true
  ) {
    return "missed";
  }

  return "review";
}

function getRecordDate(record) {
  return (
    getDateKey(
      record?.dateKey ||
        record?.date ||
        record?.attendanceDate ||
        record?.sessionDate ||
        record?.markedDate ||
        record?.missedAt ||
        record?.markedAt ||
        record?.createdAt ||
        record?.startedAt,
    ) || null
  );
}

function getSessionNumber(record) {
  const number = Number(
    record?.sessionNumber ??
      record?.session ??
      record?.sessionNo ??
      record?.number,
  );

  return number === 1 || number === 2 ? number : null;
}

function getRecordTimestamp(record) {
  const value =
    record?.updatedAt ||
    record?.missedAt ||
    record?.markedAt ||
    record?.createdAt ||
    record?.startedAt;

  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function groupRecordsByDate(records) {
  const map = new Map();
  if (!Array.isArray(records)) return map;

  records.forEach((record) => {
    const dateKey = getRecordDate(record);
    const sessionNumber = getSessionNumber(record);

    if (!dateKey || !sessionNumber) return;

    if (!map.has(dateKey)) {
      map.set(dateKey, { first: null, second: null });
    }

    const day = map.get(dateKey);
    const key = sessionNumber === 1 ? "first" : "second";
    const current = day[key];

    if (!current || getRecordTimestamp(record) >= getRecordTimestamp(current)) {
      day[key] = record;
    }
  });

  return map;
}

/* -------------------------------------------------------------------------- */
/* Group dates and holiday helpers                                             */
/* -------------------------------------------------------------------------- */

function getGroupStartDate(group) {
  return getDateKey(
    group?.actualStartDate ||
      group?.plannedStartDate ||
      group?.startDate ||
      group?.internshipStartDate ||
      group?.internshipStart ||
      group?.group?.actualStartDate ||
      group?.group?.plannedStartDate ||
      group?.group?.startDate ||
      group?.group?.internshipStartDate,
  );
}

function getGroupEndDate(group, startDate) {
  const explicitEnd = getDateKey(
    group?.actualEndDate ||
      group?.plannedEndDate ||
      group?.endDate ||
      group?.internshipEndDate ||
      group?.internshipEnd ||
      group?.group?.actualEndDate ||
      group?.group?.plannedEndDate ||
      group?.group?.endDate ||
      group?.group?.internshipEndDate,
  );

  if (explicitEnd) return explicitEnd;

  const duration = Number(group?.durationDays ?? group?.duration);
  if (!startDate || !Number.isFinite(duration) || duration <= 0) return null;

  const date = dateKeyToUTC(startDate);
  if (!date) return null;

  date.setUTCDate(date.getUTCDate() + Math.max(0, duration - 1));

  return formatDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function isWithinGroupDates(dateKey, startDate, endDate) {
  if (!dateKey) return false;
  if (startDate && dateKey < startDate) return false;
  if (endDate && dateKey > endDate) return false;
  return true;
}

function getHolidayMap(group) {
  const entries =
    group?.holidays || group?.holidayDates || group?.nonWorkingDays || [];

  const map = new Map();
  if (!Array.isArray(entries)) return map;

  entries.forEach((entry) => {
    const value =
      typeof entry === "string" ? entry : entry?.date || entry?.holidayDate;

    const dateKey = getDateKey(value);
    if (!dateKey) return;

    map.set(dateKey, {
      name:
        typeof entry === "object"
          ? entry?.name || entry?.title || "Holiday"
          : "Holiday",
    });
  });

  return map;
}

function getWeekday(dateKey) {
  const date = dateKeyToUTC(dateKey);
  return date ? date.getUTCDay() : null;
}

/* -------------------------------------------------------------------------- */
/* Session window helpers                                                      */
/* -------------------------------------------------------------------------- */

function parseTimeToMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 0 && value <= 1440 ? value : null;
  }

  if (typeof value !== "string") return null;

  const match = value.trim().match(/^\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\s*$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    minute > 59 ||
    hour > 23
  ) {
    return null;
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "AM" && hour === 12) hour = 0;
    if (meridiem === "PM" && hour !== 12) hour += 12;
  }

  return hour * 60 + minute;
}

function getWindowBounds(window) {
  if (!window) return null;

  const start = parseTimeToMinutes(
    window.start ?? window.startTime ?? window.from,
  );
  const end = parseTimeToMinutes(window.end ?? window.endTime ?? window.to);

  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function getWindowForSession(windows, sessionNumber) {
  if (!windows) return null;

  if (Array.isArray(windows)) {
    return (
      windows.find(
        (item) =>
          Number(item?.sessionNumber ?? item?.session) === sessionNumber,
      ) || null
    );
  }

  return sessionNumber === 1
    ? windows.first || windows.session1 || windows["1"] || null
    : windows.second || windows.session2 || windows["2"] || null;
}

function getTodayWindowState(window, nowSeconds) {
  if (!window) return "unknown";

  const bounds = getWindowBounds(window);

  if (!bounds) {
    if (window.open === true) return "open";
    if (window.open === false) return "closed";
    return "unknown";
  }

  const startSeconds = bounds.start * 60;
  const endSeconds = bounds.end * 60;

  if (nowSeconds < startSeconds) return "upcoming";
  if (nowSeconds >= endSeconds) return "closed";

  if (nowSeconds + DEFAULT_MINIMUM_SECONDS > endSeconds) {
    return "insufficient_time";
  }

  return "open";
}

function getWindowLabel(window, sessionNumber) {
  if (window?.label) return window.label;

  const bounds = getWindowBounds(window);

  if (!bounds) {
    return sessionNumber === 1
      ? "9:30 AM – 12:30 PM IST"
      : "1:00 PM – 3:30 PM IST";
  }

  const formatMinutes = (minutes) => {
    const hour24 = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;

    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  return `${formatMinutes(bounds.start)} – ${formatMinutes(bounds.end)} IST`;
}

/* -------------------------------------------------------------------------- */
/* Resolve status for one session                                              */
/* -------------------------------------------------------------------------- */

function getSessionStatus({
  record,
  dateKey,
  todayKey,
  startDate,
  endDate,
  holidayMap,
  window,
  nowSeconds,
}) {
  // A stored backend record always takes priority over inferred calendar state.
  const recordStatus = getRecordStatus(record);
  if (recordStatus) return recordStatus;

  if (!isWithinGroupDates(dateKey, startDate, endDate)) {
    return "outside";
  }

  if (holidayMap.has(dateKey) || getWeekday(dateKey) === 0) {
    return "holiday";
  }

  if (dateKey > todayKey) return "upcoming";

  // Past sessions with no valid attendance record are shown as Missed.
  // Session 1 and Session 2 are evaluated independently.
  if (dateKey < todayKey) return "missed";

  const windowState = getTodayWindowState(window, nowSeconds);

  if (windowState === "upcoming") return "upcoming";
  if (windowState === "open") return "open";
  if (windowState === "insufficient_time") return "insufficient_time";
  if (windowState === "closed") return "missed";

  return "unknown";
}

function getStatusDetails(status) {
  return STATUS_DETAILS[status] || STATUS_DETAILS.unknown;
}

function getDaySummary(firstStatus, secondStatus) {
  if (firstStatus === secondStatus) {
    return getStatusDetails(firstStatus).className;
  }

  return "mixedDay";
}

function getSessionLetter(status) {
  const details = getStatusDetails(status);

  return {
    letter: details.letter,
    label: details.label,
    color: details.color,
    background: details.background,
  };
}

function getDayBackground(firstStatus, secondStatus) {
  const first = getStatusDetails(firstStatus);
  const second = getStatusDetails(secondStatus);

  if (firstStatus === secondStatus) {
    return {
      background: first.background,
      borderColor: `${first.color}35`,
      color: first.color,
    };
  }

  return {
    background: `linear-gradient(135deg, ${first.background} 0%, ${first.background} 49.2%, #FFFFFF 49.2%, #FFFFFF 50.8%, ${second.background} 50.8%, ${second.background} 100%)`,
    borderColor: "#D8D7D1",
    color: "#344137",
  };
}

function getDayLabel(firstStatus, secondStatus) {
  if (firstStatus === secondStatus) {
    return getStatusDetails(firstStatus).shortLabel.toUpperCase();
  }

  return "MIXED";
}

function getMonthGrid(monthKey, internshipStartDate, internshipEndDate) {
  const parts = getMonthParts(monthKey);
  if (!parts) return [];

  const { year, month } = parts;
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const monthStartKey = formatDateKey(year, month, 1);
  const monthEndKey = formatDateKey(year, month, totalDays);

  // Clip the visible range to the internship period (both boundary dates inclusive).
  const firstVisibleKey =
    internshipStartDate && internshipStartDate > monthStartKey
      ? internshipStartDate
      : monthStartKey;
  const lastVisibleKey =
    internshipEndDate && internshipEndDate < monthEndKey
      ? internshipEndDate
      : monthEndKey;

  if (firstVisibleKey > lastVisibleKey) return [];

  const firstVisibleDay = Number(firstVisibleKey.slice(8, 10));
  const lastVisibleDay = Number(lastVisibleKey.slice(8, 10));

  // Keep dates under their real weekday columns. Empty cells are only spacing;
  // no dates before the internship start or after the internship end are shown.
  const firstWeekday = new Date(
    Date.UTC(year, month - 1, firstVisibleDay),
  ).getUTCDay();
  const days = Array.from({ length: firstWeekday }, () => null);

  for (let day = firstVisibleDay; day <= lastVisibleDay; day += 1) {
    days.push({
      day,
      dateKey: formatDateKey(year, month, day),
    });
  }

  return days;
}

function isRecordMissed(record) {
  return getRecordStatus(record) === "missed";
}

function getRecordReason(record) {
  return (
    record?.missedReason ||
    record?.rejectionReason ||
    record?.correctionReason ||
    record?.reason ||
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Small reusable visual elements                                              */
/* -------------------------------------------------------------------------- */

function LegendItem({ status, children }) {
  const details = getStatusDetails(status);

  return (
    <span className={styles.legendItem}>
      <span
        className={styles.legendDot}
        style={{ backgroundColor: details.color }}
      />
      <span>{children}</span>
    </span>
  );
}

function StatusIcon({ status }) {
  if (status === "approved") return <CheckCircle2 size={17} />;
  if (status === "pending") return <Clock3 size={17} />;
  if (status === "missed" || status === "admin_absent")
    return <CircleX size={17} />;
  if (status === "rejected") return <AlertCircle size={17} />;
  if (status === "holiday") return <LockKeyhole size={17} />;
  if (status === "open") return <CalendarCheck size={17} />;
  if (status === "unknown") return <CircleHelp size={17} />;
  return <Info size={17} />;
}

/* -------------------------------------------------------------------------- */
/* Main calendar component                                                     */
/* -------------------------------------------------------------------------- */

export default function AttendanceCalendar({
  history = [],
  group,
  month,
  onMonthChange,
  todayKey,
  windows = {},
  selectedDayKey,
  onSelectDay,
}) {
  const [clock, setClock] = useState(() => new Date());

  // Re-evaluate today's open/closed window during a long-lived page session.
  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const currentDateKey = todayKey || getISTDateKey(clock);
  const currentMonth = currentDateKey.slice(0, 7);
  const nowSeconds = getISTSeconds(clock);

  const recordsByDate = useMemo(() => groupRecordsByDate(history), [history]);

  const groupStartDate = useMemo(() => getGroupStartDate(group), [group]);

  const groupEndDate = useMemo(
    () => getGroupEndDate(group, groupStartDate),
    [group, groupStartDate],
  );

  const holidayMap = useMemo(() => getHolidayMap(group), [group]);

  // The route initially supplies a Date and later supplies YYYY-MM strings.
  // Clamp the first render to the internship's first/last month when needed.
  const requestedMonth = normalizeMonthKey(month, currentMonth);
  const firstInternshipMonth = groupStartDate?.slice(0, 7) || null;
  const lastInternshipMonth = groupEndDate?.slice(0, 7) || null;
  const displayMonth =
    firstInternshipMonth && requestedMonth < firstInternshipMonth
      ? firstInternshipMonth
      : lastInternshipMonth && requestedMonth > lastInternshipMonth
        ? lastInternshipMonth
        : requestedMonth;

  const monthGrid = useMemo(
    () => getMonthGrid(displayMonth, groupStartDate, groupEndDate),
    [displayMonth, groupStartDate, groupEndDate],
  );

  const monthDays = useMemo(() => monthGrid.filter(Boolean), [monthGrid]);

  const preferredDate =
    groupStartDate && currentDateKey < groupStartDate
      ? groupStartDate
      : groupEndDate && currentDateKey > groupEndDate
        ? groupEndDate
        : currentDateKey;

  const selectedDate =
    selectedDayKey &&
    selectedDayKey.startsWith(displayMonth) &&
    isWithinGroupDates(selectedDayKey, groupStartDate, groupEndDate)
      ? selectedDayKey
      : preferredDate.startsWith(displayMonth) &&
          isWithinGroupDates(preferredDate, groupStartDate, groupEndDate)
        ? preferredDate
        : monthDays[0]?.dateKey || null;

  const getStatusForDate = useCallback(
    (dateKey, sessionNumber) => {
      const dayRecords = recordsByDate.get(dateKey) || {
        first: null,
        second: null,
      };

      return getSessionStatus({
        record: sessionNumber === 1 ? dayRecords.first : dayRecords.second,
        dateKey,
        todayKey: currentDateKey,
        startDate: groupStartDate,
        endDate: groupEndDate,
        holidayMap,
        window:
          dateKey === currentDateKey
            ? getWindowForSession(windows, sessionNumber)
            : null,
        nowSeconds,
      });
    },
    [
      recordsByDate,
      currentDateKey,
      groupStartDate,
      groupEndDate,
      holidayMap,
      windows,
      nowSeconds,
    ],
  );

  const monthlyStats = useMemo(() => {
    const totals = {
      approved: 0,
      missed: 0,
      pending: 0,
      rejected: 0,
      holidays: 0,
    };

    monthDays.forEach((day) => {
      if (!isWithinGroupDates(day.dateKey, groupStartDate, groupEndDate)) {
        return;
      }

      const holiday =
        holidayMap.has(day.dateKey) || getWeekday(day.dateKey) === 0;

      if (holiday) {
        totals.holidays += 1;
        return;
      }

      [1, 2].forEach((sessionNumber) => {
        const status = getStatusForDate(day.dateKey, sessionNumber);

        if (status === "approved") totals.approved += 1;
        if (status === "missed") totals.missed += 1;
        if (status === "pending") totals.pending += 1;
        if (status === "rejected") totals.rejected += 1;
      });
    });

    return totals;
  }, [monthDays, groupStartDate, groupEndDate, holidayMap, getStatusForDate]);

  const dayDetails = useMemo(() => {
    if (!selectedDate) return null;

    const dayRecords = recordsByDate.get(selectedDate) || {
      first: null,
      second: null,
    };

    const firstStatus = getStatusForDate(selectedDate, 1);
    const secondStatus = getStatusForDate(selectedDate, 2);

    return {
      dateKey: selectedDate,
      isHoliday:
        isWithinGroupDates(selectedDate, groupStartDate, groupEndDate) &&
        (holidayMap.has(selectedDate) || getWeekday(selectedDate) === 0),
      holidayName:
        holidayMap.get(selectedDate)?.name ||
        (getWeekday(selectedDate) === 0 ? "Sunday" : "Holiday"),
      first: {
        record: dayRecords.first,
        status: firstStatus,
        details: getStatusDetails(firstStatus),
      },
      second: {
        record: dayRecords.second,
        status: secondStatus,
        details: getStatusDetails(secondStatus),
      },
    };
  }, [
    selectedDate,
    recordsByDate,
    getStatusForDate,
    groupStartDate,
    groupEndDate,
    holidayMap,
  ]);

  const canGoPrevious =
    !groupStartDate || displayMonth > groupStartDate.slice(0, 7);
  const canGoNext = !groupEndDate || displayMonth < groupEndDate.slice(0, 7);

  const handleMonthNavigation = (amount) => {
    const nextMonth = addMonths(displayMonth, amount);
    if (!nextMonth || typeof onMonthChange !== "function") return;

    if (groupStartDate && nextMonth < groupStartDate.slice(0, 7)) return;
    if (groupEndDate && nextMonth > groupEndDate.slice(0, 7)) return;

    onMonthChange(nextMonth);
  };

  const handleSelectDate = (dateKey) => {
    onSelectDay?.(dateKey);
  };

  const stats = [
    {
      label: "Approved sessions",
      value: monthlyStats.approved,
      icon: <CheckCircle2 size={17} />,
      className: styles.approvedIcon,
      cardClass: styles.approvedSummary,
      note: "Verified attendance",
    },
    {
      label: "Missed sessions",
      value: monthlyStats.missed,
      icon: <CircleX size={17} />,
      className: styles.missedIcon,
      cardClass: styles.missedSummary,
      note: "No valid attendance",
    },
    {
      label: "Pending sessions",
      value: monthlyStats.pending,
      icon: <Clock3 size={17} />,
      className: styles.pendingIcon,
      cardClass: styles.pendingSummary,
      note: "Awaiting approval",
    },
    {
      label: "Holidays",
      value: monthlyStats.holidays,
      icon: <CalendarCheck size={17} />,
      className: styles.holidayIcon,
      cardClass: styles.holidaySummary,
      note: "Non-working days",
    },
  ];

  return (
    <section
      className={styles.section}
      aria-label="Monthly attendance calendar"
    >
      {/* Section heading */}
      <div className={styles.sectionHeader}>
        <div className={styles.headingGroup}>
          <span className={styles.headingIcon}>
            <CalendarDays size={19} />
          </span>

          <div>
            <span className={styles.eyebrow}>INTERNSHIP TRACKER</span>
            <h2>Attendance calendar</h2>
            <p>Explore your attendance status by date and session.</p>
          </div>
        </div>

        <span className={styles.monthInfo}>{getMonthLabel(displayMonth)}</span>
      </div>

      <div className={styles.calendarCard}>
        {/* Monthly toolbar */}
        <div className={styles.calendarToolbar}>
          <div className={styles.monthHeading}>
            <h3>{getMonthLabel(displayMonth)}</h3>
            <span>
              {currentMonth === displayMonth ? "Current month" : "Monthly view"}
            </span>
          </div>

          <div className={styles.monthControls}>
            <button
              type="button"
              className={styles.monthButton}
              onClick={() => handleMonthNavigation(-1)}
              disabled={!canGoPrevious}
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>

            <span className={styles.monthDisplay} aria-live="polite">
              {getMonthLabel(displayMonth)}
            </span>

            <button
              type="button"
              className={styles.monthButton}
              onClick={() => handleMonthNavigation(1)}
              disabled={!canGoNext}
              aria-label="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* Monthly overview cards */}
        <div className={styles.summaryGrid}>
          {stats.map((stat) => (
            <div
              className={`${styles.summaryCard} ${stat.cardClass}`}
              key={stat.label}
            >
              <span className={`${styles.summaryIcon} ${stat.className}`}>
                {stat.icon}
              </span>

              <div className={styles.summaryCopy}>
                <span className={styles.summaryLabel}>{stat.label}</span>
                <strong className={styles.summaryValue}>{stat.value}</strong>
                <span className={styles.summaryNote}>{stat.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly calendar grid */}
        <div className={styles.calendarGrid}>
          <div className={styles.weekdayRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (weekday) => (
                <span key={weekday}>{weekday}</span>
              ),
            )}
          </div>

          <div className={styles.dayGrid}>
            {monthGrid.map((item, index) => {
              if (!item) {
                return (
                  <div
                    key={`empty-${index}`}
                    className={styles.emptyDay}
                    aria-hidden="true"
                  />
                );
              }

              const dayRecords = recordsByDate.get(item.dateKey) || {
                first: null,
                second: null,
              };

              const firstStatus = getStatusForDate(item.dateKey, 1);
              const secondStatus = getStatusForDate(item.dateKey, 2);
              const dayStatus = getDaySummary(firstStatus, secondStatus);
              const isToday = item.dateKey === currentDateKey;
              const isSelected = item.dateKey === selectedDate;
              const isHoliday =
                isWithinGroupDates(
                  item.dateKey,
                  groupStartDate,
                  groupEndDate,
                ) &&
                (holidayMap.has(item.dateKey) ||
                  getWeekday(item.dateKey) === 0);

              const firstMeta = getSessionLetter(firstStatus);
              const secondMeta = getSessionLetter(secondStatus);

              return (
                <button
                  key={item.dateKey}
                  type="button"
                  className={[
                    styles.dayCell,
                    styles[dayStatus],
                    isToday ? styles.todayCell : "",
                    isSelected ? styles.selectedCell : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={getDayBackground(firstStatus, secondStatus)}
                  onClick={() => handleSelectDate(item.dateKey)}
                  aria-pressed={isSelected}
                  aria-label={`${getDateLabel(item.dateKey)}. Session 1: ${getStatusDetails(firstStatus).label}. Session 2: ${getStatusDetails(secondStatus).label}.`}
                  title={`${getDateLabel(item.dateKey)} · Session 1: ${getStatusDetails(firstStatus).label} · Session 2: ${getStatusDetails(secondStatus).label}`}
                >
                  {isToday && <span className={styles.todayMarker}>TODAY</span>}

                  <span className={styles.dayNumber}>{item.day}</span>

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
                          title={`Session 1: ${firstMeta.label}`}
                        >
                          {firstMeta.letter}
                        </span>

                        <span
                          className={styles.sessionStatusDivider}
                          aria-hidden="true"
                        >
                          /
                        </span>

                        <span
                          className={styles.sessionStatusLetter}
                          style={{
                            color: secondMeta.color,
                            backgroundColor: secondMeta.background,
                          }}
                          title={`Session 2: ${secondMeta.label}`}
                        >
                          {secondMeta.letter}
                        </span>
                      </span>

                      <span className={styles.dayStatus}>
                        {getDayLabel(firstStatus, secondStatus)}
                      </span>
                    </>
                  )}

                  {isRecordMissed(dayRecords.first) ||
                  isRecordMissed(dayRecords.second) ? (
                    <span className={styles.recordedMarker}>RECORDED</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status legend */}
        <div className={styles.legend}>
          <LegendItem status="approved">A · Approved</LegendItem>
          <LegendItem status="pending">P · Pending</LegendItem>
          <LegendItem status="missed">M · Missed</LegendItem>
          <LegendItem status="rejected">R · Rejected</LegendItem>
          <LegendItem status="upcoming">U · Upcoming</LegendItem>
          <LegendItem status="holiday">H · Holiday</LegendItem>
        </div>

        {/* Backend tracking note */}
        <div className={styles.trustNote}>
          <ShieldCheck size={17} className={styles.trustIcon} />
          <p>
            A session is marked missed when its attendance window has closed
            without a valid attendance record. Session 1 and Session 2 are
            evaluated independently.
          </p>
        </div>
      </div>

      {/* Selected date detail panel */}
      {dayDetails && (
        <div className={styles.selectedDayPanel} aria-live="polite">
          <div className={styles.selectedDayHeader}>
            <div>
              <span className={styles.selectedEyebrow}>SELECTED DATE</span>
              <h3>{getDateLabel(dayDetails.dateKey)}</h3>
            </div>

            {dayDetails.dateKey === currentDateKey && (
              <span className={styles.currentDayBadge}>Today</span>
            )}
          </div>

          {dayDetails.isHoliday && (
            <p className={styles.holidayNote}>
              <LockKeyhole size={14} />
              {dayDetails.holidayName ||
                "No regular attendance sessions are scheduled."}
            </p>
          )}

          <div className={styles.selectedSessions}>
            {[
              { label: "Session 1", number: 1, session: dayDetails.first },
              { label: "Session 2", number: 2, session: dayDetails.second },
            ].map(({ label, number, session }) => {
              const record = session.record;
              const reason = getRecordReason(record);
              const eventTime =
                session.status === "missed"
                  ? formatDateTime(record?.missedAt)
                  : session.status === "rejected"
                    ? formatDateTime(record?.rejectedAt || record?.updatedAt)
                    : formatDateTime(record?.markedAt || record?.createdAt);

              return (
                <article
                  className={`${styles.selectedSession} ${styles[`selected_${session.details.className}`] || ""}`}
                  key={label}
                >
                  <div className={styles.selectedSessionTop}>
                    <div className={styles.selectedSessionInfo}>
                      <span className={styles.sessionNumber}>0{number}</span>

                      <div>
                        <strong>{label}</strong>
                        <p>
                          {getWindowLabel(
                            getWindowForSession(windows, number),
                            number,
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`${styles.sessionStatus} ${styles[session.details.className] || styles.unknown}`}
                    >
                      <StatusIcon status={session.status} />
                      {session.details.label}
                    </span>
                  </div>

                  <p className={styles.sessionDescription}>
                    {session.details.description}
                  </p>

                  {eventTime && (
                    <p className={styles.recordMeta}>
                      {session.status === "missed"
                        ? "Missed recorded"
                        : session.status === "rejected"
                          ? "Last updated"
                          : "Attendance recorded"}
                      : {eventTime}
                    </p>
                  )}

                  {reason && (
                    <div className={styles.reasonNote}>
                      <Info size={13} />
                      <span>{reason}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <p className={styles.selectedFootnote}>
            Session 1 and Session 2 are tracked independently. A missed or
            rejected first session does not change the status of the second
            session.
          </p>
        </div>
      )}

      <p className={styles.calendarFootnote}>
        Each working date shows two indicators: the first for Session 1 and the
        second for Session 2. The monthly summary counts individual sessions;
        holidays are counted by day.
      </p>
    </section>
  );
}
