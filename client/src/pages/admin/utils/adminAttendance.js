const PRESENT = new Set(["approved", "admin_corrected_present"]);
const MISSED = new Set(["missed", "absent", "not_marked"]);

export const getRecordInternKey = (record) =>
  String(record?.intern?._id || record?.internId || record?.userId || "");

export function getInternRecords(intern, attendance = []) {
  const keys = new Set([String(intern?._id || ""), String(intern?.internId || "")]);
  return (Array.isArray(attendance) ? attendance : []).filter((record) => {
    const nested = getRecordInternKey(record);
    return keys.has(nested) || keys.has(String(record?.intern?.internId || ""));
  });
}

const toDateKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const parseDateKey = (key) => {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export function getInternAttendanceSummary(intern, attendance = [], now = new Date()) {
  const records = getInternRecords(intern, attendance);
  const group = intern?.group || {};
  const startValue = intern?.internshipStartDate || group.actualStartDate || group.plannedStartDate;
  const start = startValue ? new Date(startValue) : null;
  const duration = Number(group.durationDays || intern?.durationDays || 0);
  const explicitEnd = group.actualEndDate || intern?.internshipEndDate;
  const end = explicitEnd ? new Date(explicitEnd) : start && duration
    ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + duration - 1)
    : null;

  const endDate = end && !Number.isNaN(end.getTime()) ? end : null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const effectiveEnd = endDate && endDate < today ? endDate : today;

  const eligibleDays = [];
  const plannedDays = [];
  if (start && !Number.isNaN(start.getTime()) && start <= effectiveEnd) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (cursor <= effectiveEnd && eligibleDays.length < 370) {
      // The existing attendance calendar excludes Sundays.
      if (cursor.getDay() !== 0) eligibleDays.push(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  if (start && !Number.isNaN(start.getTime()) && endDate && endDate >= start) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    while (cursor <= finalDate && plannedDays.length < 740) {
      if (cursor.getDay() !== 0) plannedDays.push(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const recordMap = new Map();
  records.forEach((record) => {
    const key = `${record.dateKey || ""}:${Number(record.sessionNumber || 0)}`;
    if (key !== ":0") recordMap.set(key, record);
  });

  const explicitMissedFirst = records.filter((r) => Number(r.sessionNumber) === 1 && MISSED.has(r.status)).length;
  const explicitMissedSecond = records.filter((r) => Number(r.sessionNumber) === 2 && MISSED.has(r.status)).length;
  const approved = records.filter((r) => PRESENT.has(r.status)).length;
  const pending = records.filter((r) => r.status === "pending").length;
  const rejected = records.filter((r) => r.status === "rejected").length;

  const expectedPast = eligibleDays.length * 2;
  const notRecorded = Math.max(0, expectedPast - recordMap.size);
  const presentRecords = records
    .filter((r) => PRESENT.has(r.status))
    .map((r) => r.dateKey)
    .filter(Boolean)
    .sort();
  const lastAttendedDate = presentRecords.at(-1) || "";
  const lastDate = parseDateKey(lastAttendedDate);
  let workingDaysSinceLast = null;
  if (lastDate) {
    workingDaysSinceLast = 0;
    const cursor = new Date(lastDate);
    while (cursor < today && workingDaysSinceLast < 370) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0) workingDaysSinceLast += 1;
    }
  } else if (eligibleDays.length >= 3) {
    workingDaysSinceLast = eligibleDays.length;
  }

  return {
    startDate: startValue || null,
    endDate: endDate ? toDateKey(endDate) : null,
    expectedPastSessions: expectedPast,
    totalScheduledSessions: plannedDays.length * 2,
    approved,
    pending,
    rejected,
    explicitlyMissedFirst: explicitMissedFirst,
    explicitlyMissedSecond: explicitMissedSecond,
    notRecorded,
    totalRecorded: recordMap.size,
    lastAttendedDate,
    workingDaysSinceLast,
    records,
    // Not-recorded sessions are deliberately not labeled "missed":
    // holiday/exception calendars are not included in the supplied API payload.
  };
}

export function buildAttendanceRiskLists(interns = [], attendance = []) {
  const rows = (interns || []).map((intern) => ({
    intern,
    summary: getInternAttendanceSummary(intern, attendance),
  }));
  return {
    firstSession: rows.filter(({ summary }) => summary.explicitlyMissedFirst > 0),
    secondSession: rows.filter(({ summary }) => summary.explicitlyMissedSecond > 0),
    inactive: rows.filter(({ summary }) => summary.workingDaysSinceLast >= 3),
  };
}
