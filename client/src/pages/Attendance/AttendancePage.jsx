import { useEffect, useMemo, useState } from "react";

import styles from "./AttendancePage.module.css";

import AttendanceHeader from "./attendance/AttendanceHeader";
import AttendanceTabs from "./attendance/AttendanceTabs";
import AttendanceStatusBanner from "./attendance/AttendanceStatusBanner";
import AttendanceStats from "./attendance/AttendanceStats";
import AttendanceCharts from "./attendance/AttendanceCharts";
import AttendanceSessions from "./attendance/AttendanceSessions";
import AttendanceTimer from "./attendance/AttendanceTimer";
import AttendanceFooter from "./attendance/AttendanceFooter";

import AttendanceCalendar from "./attendance/AttendanceCalendar/AttendanceCalendar";
import AttendanceHistory from "./attendance/AttendanceHistory/AttendanceHistory";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const IST_TIME_ZONE = "Asia/Kolkata";

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

const REJECTED_STATUSES = new Set(["rejected"]);

const MISSED_STATUSES = new Set(["missed", "auto_missed", "auto_absent"]);

const ACTIVE_GROUP_STATUSES = new Set([
  "active",
  "started",
  "in_progress",
  "ongoing",
]);

const DEFAULT_MINIMUM_SECONDS = 50;

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

function getISTDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    dateKey: `${values.year}-${values.month}-${values.day}`,
  };
}

function getISTClockParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const hour = Number(values.hour);
  const minute = Number(values.minute);
  const second = Number(values.second);

  return {
    hour,
    minute,
    second,
    secondsAfterMidnight: hour * 3600 + minute * 60 + second,
    timeLabel: `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0",
    )}`,
  };
}

/**
 * Date-only strings are kept as date-only values.
 *
 * This avoids accidentally shifting a date such as "2026-10-31"
 * to the previous day when parsing it as a UTC timestamp.
 */
function getDateKey(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return getISTDateParts(value).dateKey;
  }

  const valueString = String(value).trim();

  const dateOnlyMatch = valueString.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    return valueString;
  }

  const parsedDate = new Date(valueString);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return getISTDateParts(parsedDate).dateKey;
}

function addDaysToDateKey(dateKey, days) {
  if (!dateKey || !Number.isFinite(Number(days))) return null;

  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateLabel(dateKey) {
  if (!dateKey) return "Not available";

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getMonthKey(dateKey) {
  return dateKey ? dateKey.slice(0, 7) : null;
}

/* -------------------------------------------------------------------------- */
/* Data helpers                                                               */
/* -------------------------------------------------------------------------- */

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function isApprovedRecord(record) {
  return APPROVED_STATUSES.has(normalizeStatus(record?.status));
}

function isPendingRecord(record) {
  return PENDING_STATUSES.has(normalizeStatus(record?.status));
}

function isRejectedRecord(record) {
  return REJECTED_STATUSES.has(normalizeStatus(record?.status));
}

function isMissedRecord(record) {
  return (
    MISSED_STATUSES.has(normalizeStatus(record?.status)) ||
    record?.isMissed === true ||
    record?.missed === true
  );
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
  const value =
    record?.sessionNumber ??
    record?.session ??
    record?.sessionNo ??
    record?.number;

  const number = Number(value);

  return number === 1 || number === 2 ? number : null;
}

function getRecordKey(record) {
  if (record?._id) return `id:${record._id}`;
  if (record?.id) return `id:${record.id}`;

  const date = getRecordDate(record);
  const sessionNumber = getSessionNumber(record);

  if (date && sessionNumber) {
    return `${date}:session:${sessionNumber}`;
  }

  return null;
}

function normalizeRecords(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (Array.isArray(value?.records)) {
    return value.records.filter(Boolean);
  }

  if (Array.isArray(value?.items)) {
    return value.items.filter(Boolean);
  }

  if (Array.isArray(value?.data)) {
    return value.data.filter(Boolean);
  }

  return [];
}

/**
 * History and today's records may contain the same attendance record.
 * Prefer the latest copy while keeping records without a usable key.
 */
function combineAttendanceRecords(history, todayRecords) {
  const combined = [
    ...normalizeRecords(history),
    ...normalizeRecords(todayRecords),
  ];

  const recordsByKey = new Map();
  const recordsWithoutKey = [];

  combined.forEach((record) => {
    const key = getRecordKey(record);

    if (!key) {
      recordsWithoutKey.push(record);
      return;
    }

    recordsByKey.set(key, record);
  });

  return [...recordsByKey.values(), ...recordsWithoutKey];
}

function getTodaySessionRecords(records, todayKey) {
  return records.filter((record) => {
    return getRecordDate(record) === todayKey;
  });
}

function getRecordForSession(records, sessionNumber, dateKey) {
  return (
    records.find((record) => {
      return (
        getRecordDate(record) === dateKey &&
        getSessionNumber(record) === sessionNumber
      );
    }) || null
  );
}

function getMinimumSeconds(today, activeSession) {
  const value =
    activeSession?.minimumSeconds ??
    today?.minimumSeconds ??
    DEFAULT_MINIMUM_SECONDS;

  const seconds = Number(value);

  return Number.isFinite(seconds) && seconds > 0
    ? seconds
    : DEFAULT_MINIMUM_SECONDS;
}

function getWindowForSession(today, sessionNumber) {
  const windows = today?.windows;

  if (!windows) return null;

  if (Array.isArray(windows)) {
    return (
      windows.find((window) => {
        return (
          Number(window?.sessionNumber ?? window?.session) === sessionNumber
        );
      }) || null
    );
  }

  if (sessionNumber === 1) {
    return windows.first || windows.session1 || windows["1"] || null;
  }

  return windows.second || windows.session2 || windows["2"] || null;
}

/* -------------------------------------------------------------------------- */
/* Session window helpers                                                     */
/* -------------------------------------------------------------------------- */

function parseTimeToMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 0 && value <= 1440 ? value : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours > 23 ||
    minutes > 59
  ) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;
  }

  return hours * 60 + minutes;
}

function getNumericWindowBounds(window) {
  if (!window) return null;

  let start = parseTimeToMinutes(
    window.start ?? window.startTime ?? window.from,
  );

  let end = parseTimeToMinutes(window.end ?? window.endTime ?? window.to);

  if (start === null || end === null) {
    const label = String(window.label || window.title || "");

    const matches = label.match(
      /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*(?:-|–|to)\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
    );

    if (matches) {
      start = parseTimeToMinutes(matches[1].trim());
      end = parseTimeToMinutes(matches[2].trim());
    }
  }

  if (start === null || end === null || end <= start) {
    return null;
  }

  return { start, end };
}

/**
 * This is a frontend display check only.
 * The backend remains responsible for validating session start and marking.
 */
function getLiveWindowState(window, nowSeconds, minimumSeconds) {
  if (!window) {
    return {
      state: "unavailable",
      canStart: false,
      message: "Session timing is not available yet.",
      start: null,
      end: null,
    };
  }

  const bounds = getNumericWindowBounds(window);

  if (bounds) {
    const startSeconds = bounds.start * 60;
    const endSeconds = bounds.end * 60;

    if (nowSeconds < startSeconds) {
      return {
        state: "upcoming",
        canStart: false,
        message: "This session has not opened yet.",
        ...bounds,
      };
    }

    if (nowSeconds >= endSeconds) {
      return {
        state: "closed",
        canStart: false,
        message: "The attendance window has closed.",
        ...bounds,
      };
    }

    if (nowSeconds + minimumSeconds > endSeconds) {
      return {
        state: "insufficient_time",
        canStart: false,
        message: "Not enough time remains to complete this session.",
        ...bounds,
      };
    }

    return {
      state: "open",
      canStart: true,
      message: "The attendance window is open.",
      ...bounds,
    };
  }

  // Fallback for API responses that provide only an "open" flag.
  if (window.open === true) {
    return {
      state: "open",
      canStart: true,
      message: "The attendance window is open.",
      start: null,
      end: null,
    };
  }

  if (window.open === false) {
    return {
      state: "closed",
      canStart: false,
      message: "The attendance window is currently closed.",
      start: null,
      end: null,
    };
  }

  return {
    state: "unavailable",
    canStart: false,
    message: "Session timing could not be verified. Refresh the page.",
    start: null,
    end: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Group helpers                                                              */
/* -------------------------------------------------------------------------- */

function getGroupStatus(group, today) {
  return normalizeStatus(
    group?.status || group?.groupStatus || today?.groupStatus || "registration",
  );
}

function getGroupStartDate(group, today) {
  return getDateKey(
    group?.actualStartDate ||
      group?.startDate ||
      group?.internshipStartDate ||
      group?.internshipStart ||
      today?.group?.actualStartDate ||
      today?.group?.startDate,
  );
}

function getGroupEndDate(group, today, startDate) {
  const explicitEndDate = getDateKey(
    group?.actualEndDate ||
      group?.endDate ||
      group?.internshipEndDate ||
      group?.internshipEnd ||
      today?.group?.actualEndDate ||
      today?.group?.endDate,
  );

  if (explicitEndDate) return explicitEndDate;

  const duration = Number(
    group?.durationDays ?? group?.duration ?? today?.group?.durationDays,
  );

  if (startDate && Number.isFinite(duration) && duration > 0) {
    return addDaysToDateKey(startDate, Math.max(0, duration - 1));
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendancePage({ data = {} }) {
  const {
    user,
    today,
    group,
    history,

    from,
    setFrom,
    to,
    setTo,

    month,
    setMonth,

    loading,
    refreshing,
    busy,
    dataError,

    activeSession,
    remaining,

    desktopAccessAllowed,

    refresh,
    startAttendance,
    markAttendance,
  } = data;

  /* ------------------------------------------------------------------------ */
  /* Local UI state                                                           */
  /* ------------------------------------------------------------------------ */

  const [activeTab, setActiveTab] = useState("overview");
  const [now, setNow] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Current date and clock                                                   */
  /* ------------------------------------------------------------------------ */

  const todayKey = useMemo(() => {
    return getISTDateParts(now).dateKey;
  }, [now]);

  const clock = useMemo(() => {
    return getISTClockParts(now);
  }, [now]);

  const isSunday = useMemo(() => {
    const [year, monthNumber, day] = todayKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1, day));

    return date.getUTCDay() === 0;
  }, [todayKey]);

  /* ------------------------------------------------------------------------ */
  /* Attendance records                                                       */
  /* ------------------------------------------------------------------------ */

  const allRecords = useMemo(() => {
    return combineAttendanceRecords(history, today?.records);
  }, [history, today?.records]);

  const todayRecords = useMemo(() => {
    return getTodaySessionRecords(allRecords, todayKey);
  }, [allRecords, todayKey]);

  const firstRecord = useMemo(() => {
    return getRecordForSession(todayRecords, 1, todayKey);
  }, [todayRecords, todayKey]);

  const secondRecord = useMemo(() => {
    return getRecordForSession(todayRecords, 2, todayKey);
  }, [todayRecords, todayKey]);

  const firstApproved = isApprovedRecord(firstRecord);
  const secondApproved = isApprovedRecord(secondRecord);

  const firstPending = isPendingRecord(firstRecord);
  const secondPending = isPendingRecord(secondRecord);

  const firstRejected = isRejectedRecord(firstRecord);
  const secondRejected = isRejectedRecord(secondRecord);

  /* ------------------------------------------------------------------------ */
  /* Group eligibility                                                        */
  /* ------------------------------------------------------------------------ */

  const groupStatus = useMemo(() => {
    return getGroupStatus(group, today);
  }, [group, today]);

  const groupStartDate = useMemo(() => {
    return getGroupStartDate(group, today);
  }, [group, today]);

  const groupEndDate = useMemo(() => {
    return getGroupEndDate(group, today, groupStartDate);
  }, [group, today, groupStartDate]);

  const groupIsActive = ACTIVE_GROUP_STATUSES.has(groupStatus);

  const todayIsWithinGroupDates =
    (!groupStartDate || todayKey >= groupStartDate) &&
    (!groupEndDate || todayKey <= groupEndDate);

  const groupHasStarted = groupIsActive && todayIsWithinGroupDates;

  /* ------------------------------------------------------------------------ */
  /* Session windows                                                          */
  /* ------------------------------------------------------------------------ */

  const minimumSeconds = getMinimumSeconds(today, activeSession);

  const firstWindow = useMemo(() => {
    return getWindowForSession(today, 1);
  }, [today]);

  const secondWindow = useMemo(() => {
    return getWindowForSession(today, 2);
  }, [today]);

  const firstWindowState = useMemo(() => {
    return getLiveWindowState(
      firstWindow,
      clock.secondsAfterMidnight,
      minimumSeconds,
    );
  }, [firstWindow, clock.secondsAfterMidnight, minimumSeconds]);

  const secondWindowState = useMemo(() => {
    return getLiveWindowState(
      secondWindow,
      clock.secondsAfterMidnight,
      minimumSeconds,
    );
  }, [secondWindow, clock.secondsAfterMidnight, minimumSeconds]);

  /* ------------------------------------------------------------------------ */
  /* Session eligibility                                                      */
  /* ------------------------------------------------------------------------ */

  const activeSessionNumber = Number(
    activeSession?.sessionNumber ?? activeSession?.session,
  );

  const hasActiveSession = Boolean(
    activeSession?.id || activeSession?._id || activeSession?.sessionId,
  );

  const hasAnyActiveSession = hasActiveSession || Boolean(activeSession);

  const desktopBlocked = desktopAccessAllowed === false;

  const commonStartBlockReason = useMemo(() => {
    if (loading) return "Loading your attendance details...";

    if (dataError)
      return "Attendance details could not be loaded. Refresh and try again.";

    if (desktopBlocked) {
      return "Attendance is available only on an eligible desktop screen.";
    }

    if (!groupIsActive) {
      return "Your internship group has not been activated yet.";
    }

    if (!todayIsWithinGroupDates) {
      if (groupStartDate && todayKey < groupStartDate) {
        return `Your internship starts on ${formatDateLabel(groupStartDate)}.`;
      }

      if (groupEndDate && todayKey > groupEndDate) {
        return "Your internship period has ended.";
      }

      return "Attendance is not available for this date.";
    }

    if (isSunday || today?.isSunday) {
      return "Attendance is not available on Sundays.";
    }

    if (hasAnyActiveSession) {
      return "Complete your active session before starting another one.";
    }

    return null;
  }, [
    loading,
    dataError,
    desktopBlocked,
    groupIsActive,
    todayIsWithinGroupDates,
    groupStartDate,
    groupEndDate,
    todayKey,
    isSunday,
    today?.isSunday,
    hasAnyActiveSession,
  ]);

  function getRecordStartBlockReason(record) {
    if (!record) return null;

    if (isApprovedRecord(record)) {
      return "This session has already been approved.";
    }

    if (isPendingRecord(record)) {
      return "This session is already submitted and waiting for review.";
    }

    if (isRejectedRecord(record)) {
      return null;
    }

    if (isMissedRecord(record)) {
      return "This session has been recorded as missed. It cannot be submitted after its attendance window closes.";
    }

    return "An existing attendance record needs to be reviewed.";
  }

  function getSessionEligibility(sessionNumber) {
    const isFirstSession = sessionNumber === 1;

    const record = isFirstSession ? firstRecord : secondRecord;
    const windowState = isFirstSession ? firstWindowState : secondWindowState;

    let reason = commonStartBlockReason;

    // Session 1 and Session 2 are independent attendance windows.
    // The state of Session 1 must never determine Session 2 eligibility.
    if (!reason) {
      reason = getRecordStartBlockReason(record);
    }

    if (!reason && !windowState.canStart) {
      reason = windowState.message;
    }

    return {
      canStart: !reason,
      reason,
      record,
      window: isFirstSession ? firstWindow : secondWindow,
      windowState,
      approved: isFirstSession ? firstApproved : secondApproved,
      pending: isFirstSession ? firstPending : secondPending,
      rejected: isFirstSession ? firstRejected : secondRejected,
    };
  }

  const firstEligibility = getSessionEligibility(1);
  const secondEligibility = getSessionEligibility(2);

  /* ------------------------------------------------------------------------ */
  /* Statistics                                                               */
  /* ------------------------------------------------------------------------ */

  const approvedRecords = useMemo(() => {
    return allRecords.filter(isApprovedRecord);
  }, [allRecords]);

  const pendingRecords = useMemo(() => {
    return allRecords.filter(isPendingRecord);
  }, [allRecords]);

  const rejectedRecords = useMemo(() => {
    return allRecords.filter(isRejectedRecord);
  }, [allRecords]);

  const missedRecords = useMemo(() => {
    return allRecords.filter(isMissedRecord);
  }, [allRecords]);

  const approvedDateKeys = useMemo(() => {
    return [
      ...new Set(approvedRecords.map(getRecordDate).filter(Boolean)),
    ].sort();
  }, [approvedRecords]);

  const approvedDays = approvedDateKeys.length;

  const approvedSessions = approvedRecords.length;
  const pendingSessions = pendingRecords.length;
  const rejectedSessions = rejectedRecords.length;

  // Prefer the complete backend/user total when available. The current
  // history payload is also counted so missed records remain visible even
  // when an older auth response does not yet include the denormalized count.
  const backendMissedCount = Math.max(
    0,
    Number(today?.missedAttendanceCount || 0),
    Number(user?.missedAttendanceCount || 0),
    Array.isArray(user?.missedAttendanceRecords)
      ? user.missedAttendanceRecords.length
      : 0,
  );

  const missedSessions = Math.max(missedRecords.length, backendMissedCount);

  const totalSessions = allRecords.length;

  const attendanceRate = useMemo(() => {
    const duration = Number(
      group?.durationDays ?? group?.duration ?? today?.group?.durationDays,
    );

    let expectedSessions = 0;

    if (Number.isFinite(duration) && duration > 0) {
      expectedSessions = duration * 2;
    } else if (groupStartDate && groupEndDate) {
      const [startYear, startMonth, startDay] = groupStartDate
        .split("-")
        .map(Number);

      const [endYear, endMonth, endDay] = groupEndDate.split("-").map(Number);

      const start = Date.UTC(startYear, startMonth - 1, startDay);
      const end = Date.UTC(endYear, endMonth - 1, endDay);

      const days = Math.max(1, Math.floor((end - start) / 86400000) + 1);

      expectedSessions = days * 2;
    }

    if (!expectedSessions) {
      return 0;
    }

    const rate = (approvedSessions / expectedSessions) * 100;

    return Math.min(100, Math.max(0, Math.round(rate)));
  }, [group, today, groupStartDate, groupEndDate, approvedSessions]);

  const currentStreak = useMemo(() => {
    if (!approvedDateKeys.length) return 0;

    const approvedSet = new Set(approvedDateKeys);
    let streak = 0;

    let cursor = approvedSet.has(todayKey)
      ? todayKey
      : addDaysToDateKey(todayKey, -1);

    while (cursor && approvedSet.has(cursor)) {
      streak += 1;
      cursor = addDaysToDateKey(cursor, -1);
    }

    return streak;
  }, [approvedDateKeys, todayKey]);

  const stats = useMemo(
    () => ({
      attendanceRate,
      approvedDays,
      approvedSessions,
      pendingSessions,
      rejectedSessions,
      missedSessions,
      totalSessions,
      currentStreak,
      firstSessionApproved: firstApproved,
      secondSessionApproved: secondApproved,
      firstSessionPending: firstPending,
      secondSessionPending: secondPending,
    }),
    [
      attendanceRate,
      approvedDays,
      approvedSessions,
      pendingSessions,
      rejectedSessions,
      missedSessions,
      totalSessions,
      currentStreak,
      firstApproved,
      secondApproved,
      firstPending,
      secondPending,
    ],
  );

  /* ------------------------------------------------------------------------ */
  /* Chart data                                                               */
  /* ------------------------------------------------------------------------ */

  const chartData = useMemo(() => {
    const groupedByDate = new Map();

    allRecords.forEach((record) => {
      const dateKey = getRecordDate(record);

      if (!dateKey) return;

      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          date: dateKey,
          first: 0,
          second: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          missed: 0,
        });
      }

      const item = groupedByDate.get(dateKey);
      const sessionNumber = getSessionNumber(record);

      if (isApprovedRecord(record)) {
        item.approved += 1;

        if (sessionNumber === 1) item.first = 1;
        if (sessionNumber === 2) item.second = 1;
      } else if (isPendingRecord(record)) {
        item.pending += 1;
      } else if (isRejectedRecord(record)) {
        item.rejected += 1;
      } else if (isMissedRecord(record)) {
        item.missed += 1;
      }
    });

    return [...groupedByDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({
        ...item,
        label: formatDateLabel(item.date),
      }));
  }, [allRecords]);

  /* ------------------------------------------------------------------------ */
  /* Calendar state                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setSelectedDayKey((current) => current || todayKey);
  }, [todayKey]);

  const calendarMonth = month || getMonthKey(todayKey);

  const handleMonthChange = (nextMonth) => {
    if (typeof setMonth === "function") {
      setMonth(nextMonth);
    }
  };

  const handleSelectDay = (dateKey) => {
    setSelectedDayKey(dateKey);

    if (dateKey && typeof setMonth === "function") {
      setMonth(getMonthKey(dateKey));
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Session actions                                                          */
  /* ------------------------------------------------------------------------ */

  const handleStartSession = (sessionNumber) => {
    const eligibility = getSessionEligibility(sessionNumber);

    if (!eligibility.canStart) return;

    if (typeof startAttendance === "function") {
      startAttendance(sessionNumber);
    }
  };

  const handleMarkAttendance = () => {
    if (!activeSession || remaining > 0 || busy) return;

    const sessionId =
      activeSession.id || activeSession._id || activeSession.sessionId;

    if (!sessionId || typeof markAttendance !== "function") return;

    markAttendance(sessionId);
  };

  /* ------------------------------------------------------------------------ */
  /* Display data                                                             */
  /* ------------------------------------------------------------------------ */

  const sessionItems = useMemo(
    () => [
      {
        sessionNumber: 1,
        title: "Session 1",
        record: firstRecord,
        window: firstWindow,
        windowState: firstWindowState,
        eligibility: firstEligibility,
        approved: firstApproved,
        pending: firstPending,
        rejected: firstRejected,
        missed: isMissedRecord(firstRecord),
      },
      {
        sessionNumber: 2,
        title: "Session 2",
        record: secondRecord,
        window: secondWindow,
        windowState: secondWindowState,
        eligibility: secondEligibility,
        approved: secondApproved,
        pending: secondPending,
        rejected: secondRejected,
        missed: isMissedRecord(secondRecord),
      },
    ],
    [
      firstRecord,
      firstWindow,
      firstWindowState,
      firstEligibility,
      firstApproved,
      firstPending,
      firstRejected,
      secondRecord,
      secondWindow,
      secondWindowState,
      secondEligibility,
      secondApproved,
      secondPending,
      secondRejected,
    ],
  );

  const statusMessage = useMemo(() => {
    if (dataError) {
      return {
        tone: "error",
        title: "Attendance data could not be loaded",
        message: String(dataError),
      };
    }

    if (desktopBlocked) {
      return {
        tone: "warning",
        title: "Desktop access required",
        message:
          "Open the attendance portal on an eligible desktop screen to mark your attendance.",
      };
    }

    if (!groupIsActive) {
      return {
        tone: "info",
        title: "Your group is not active yet",
        message:
          "Attendance will become available after your internship group is activated.",
      };
    }

    if (!todayIsWithinGroupDates) {
      return {
        tone: "info",
        title: "Outside your internship dates",
        message:
          groupStartDate && todayKey < groupStartDate
            ? `Your internship starts on ${formatDateLabel(groupStartDate)}.`
            : "Your internship period has ended.",
      };
    }

    if (isSunday || today?.isSunday) {
      return {
        tone: "info",
        title: "Sunday holiday",
        message:
          "There are no regular attendance sessions scheduled for today.",
      };
    }

    if (firstApproved && secondApproved) {
      return {
        tone: "success",
        title: "Today's attendance is complete",
        message:
          "Both attendance sessions have been approved. You are all set for today.",
      };
    }

    if (firstPending || secondPending) {
      return {
        tone: "info",
        title: "Attendance under review",
        message:
          "One or more attendance sessions have been submitted and are waiting for review. The other session remains independent.",
      };
    }

    if (missedRecords.length > 0 || firstRejected || secondRejected) {
      return {
        tone: "warning",
        title: "Check your individual session status",
        message:
          "A missed or rejected session does not block the other session. Each session follows its own attendance window.",
      };
    }

    return {
      tone: "default",
      title: "Your attendance overview",
      message:
        "Complete your scheduled sessions during their attendance windows.",
    };
  }, [
    dataError,
    desktopBlocked,
    groupIsActive,
    todayIsWithinGroupDates,
    groupStartDate,
    todayKey,
    isSunday,
    today?.isSunday,
    firstApproved,
    secondApproved,
    firstPending,
    secondPending,
    missedRecords.length,
    firstRejected,
    secondRejected,
  ]);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: IST_TIME_ZONE,
    }).format(now);
  }, [now]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AttendanceHeader
          user={user}
          group={group}
          todayLabel={todayLabel}
          timeLabel={clock.timeLabel}
          refreshing={refreshing}
          onRefresh={refresh}
        />

        <AttendanceTabs activeTab={activeTab} onChange={setActiveTab} />

        <AttendanceStatusBanner
          status={statusMessage}
          group={group}
          groupStatus={groupStatus}
          groupStartDate={groupStartDate}
          groupEndDate={groupEndDate}
        />

        {activeTab === "overview" && (
          <section
            className={styles.tabContent}
            aria-label="Attendance overview"
          >
            <AttendanceStats stats={stats} loading={loading} />

            <AttendanceCharts
              data={chartData}
              stats={stats}
              loading={loading}
            />

            <div className={styles.overviewNote}>
              <div className={styles.overviewNoteIcon} aria-hidden="true">
                <span>i</span>
              </div>

              <div className={styles.overviewNoteContent}>
                <h3>Keep your attendance consistent</h3>
                <p>
                  Your attendance rate is based on approved sessions. Submitted,
                  rejected, and missed sessions are not counted as approved.
                  Session 1 and Session 2 are tracked independently; missing or
                  rejecting one does not prevent you from attending the other.
                  You currently have {missedSessions} missed session
                  {missedSessions === 1 ? "" : "s"} recorded.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "attendance" && (
          <section
            className={styles.tabContent}
            aria-label="Attendance details"
          >
            {hasAnyActiveSession && (
              <AttendanceTimer
                activeSession={activeSession}
                remaining={remaining}
                busy={busy}
                minimumSeconds={minimumSeconds}
                onMark={handleMarkAttendance}
              />
            )}

            <AttendanceSessions
              sessions={sessionItems}
              activeSession={activeSession}
              remaining={remaining}
              busy={busy}
              onStart={handleStartSession}
              onMark={handleMarkAttendance}
            />

            <AttendanceCalendar
              history={allRecords}
              group={group}
              month={calendarMonth}
              onMonthChange={handleMonthChange}
              todayKey={todayKey}
              windows={{
                first: firstWindow,
                second: secondWindow,
              }}
              selectedDayKey={selectedDayKey}
              onSelectDay={handleSelectDay}
            />

            <AttendanceHistory
              history={allRecords}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
            />
          </section>
        )}

        <AttendanceFooter
          group={group}
          groupStatus={groupStatus}
          todayKey={todayKey}
          approvedDays={approvedDays}
          totalSessions={totalSessions}
        />
      </div>
    </main>
  );
}
