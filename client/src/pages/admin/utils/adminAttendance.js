const PRESENT = new Set(["approved", "admin_corrected_present"]);
const MISSED = new Set(["missed", "absent", "not_marked"]);

export const getRecordInternKey = (record) =>
  String(record?.intern?._id || record?.internId || record?.userId || "");

export function getInternRecords(intern, attendance = []) {
  const keys = new Set([
    String(intern?._id || ""),
    String(intern?.internId || ""),
  ]);
  return (Array.isArray(attendance) ? attendance : []).filter((record) => {
    const nested = getRecordInternKey(record);
    return keys.has(nested) || keys.has(String(record?.intern?.internId || ""));
  });
}

const toDateKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseDateKey = (key) => {
  const [year, month, day] = String(key || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

// export function getInternAttendanceSummary(
//   intern,
//   attendance = [],
//   now = new Date(),
// ) {
//   const records = getInternRecords(intern, attendance);
//   const group = intern?.group || {};
//   const startValue =
//     intern?.internshipStartDate ||
//     group.actualStartDate ||
//     group.plannedStartDate;
//   const start = startValue ? new Date(startValue) : null;
//   const duration = Number(group.durationDays || intern?.durationDays || 0);
//   const explicitEnd = group.actualEndDate || intern?.internshipEndDate;
//   const end = explicitEnd
//     ? new Date(explicitEnd)
//     : start && duration
//       ? new Date(
//           start.getFullYear(),
//           start.getMonth(),
//           start.getDate() + duration - 1,
//         )
//       : null;

//   const endDate = end && !Number.isNaN(end.getTime()) ? end : null;
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const effectiveEnd = endDate && endDate < today ? endDate : today;

//   const eligibleDays = [];
//   const plannedDays = [];
//   if (start && !Number.isNaN(start.getTime()) && start <= effectiveEnd) {
//     const cursor = new Date(
//       start.getFullYear(),
//       start.getMonth(),
//       start.getDate(),
//     );
//     while (cursor <= effectiveEnd && eligibleDays.length < 370) {
//       // The existing attendance calendar excludes Sundays.
//       if (cursor.getDay() !== 0) eligibleDays.push(toDateKey(cursor));
//       cursor.setDate(cursor.getDate() + 1);
//     }
//   }
//   if (start && !Number.isNaN(start.getTime()) && endDate && endDate >= start) {
//     const cursor = new Date(
//       start.getFullYear(),
//       start.getMonth(),
//       start.getDate(),
//     );
//     const finalDate = new Date(
//       endDate.getFullYear(),
//       endDate.getMonth(),
//       endDate.getDate(),
//     );
//     while (cursor <= finalDate && plannedDays.length < 740) {
//       if (cursor.getDay() !== 0) plannedDays.push(toDateKey(cursor));
//       cursor.setDate(cursor.getDate() + 1);
//     }
//   }

//   const recordMap = new Map();
//   records.forEach((record) => {
//     const key = `${record.dateKey || ""}:${Number(record.sessionNumber || 0)}`;
//     if (key !== ":0") recordMap.set(key, record);
//   });

//   const explicitMissedFirst = records.filter(
//     (r) => Number(r.sessionNumber) === 1 && MISSED.has(r.status),
//   ).length;
//   const explicitMissedSecond = records.filter(
//     (r) => Number(r.sessionNumber) === 2 && MISSED.has(r.status),
//   ).length;
//   const approved = records.filter((r) => PRESENT.has(r.status)).length;
//   const pending = records.filter((r) => r.status === "pending").length;
//   const rejected = records.filter((r) => r.status === "rejected").length;

//   const expectedPast = eligibleDays.length * 2;
//   const notRecorded = Math.max(0, expectedPast - recordMap.size);
//   const presentRecords = records
//     .filter((r) => PRESENT.has(r.status))
//     .map((r) => r.dateKey)
//     .filter(Boolean)
//     .sort();
//   const lastAttendedDate = presentRecords.at(-1) || "";
//   const lastDate = parseDateKey(lastAttendedDate);
//   let workingDaysSinceLast = null;
//   if (lastDate) {
//     workingDaysSinceLast = 0;
//     const cursor = new Date(lastDate);
//     while (cursor < today && workingDaysSinceLast < 370) {
//       cursor.setDate(cursor.getDate() + 1);
//       if (cursor.getDay() !== 0) workingDaysSinceLast += 1;
//     }
//   } else if (eligibleDays.length >= 3) {
//     workingDaysSinceLast = eligibleDays.length;
//   }

//   return {
//     startDate: startValue || null,
//     endDate: endDate ? toDateKey(endDate) : null,
//     expectedPastSessions: expectedPast,
//     totalScheduledSessions: plannedDays.length * 2,
//     approved,
//     pending,
//     rejected,
//     explicitlyMissedFirst: explicitMissedFirst,
//     explicitlyMissedSecond: explicitMissedSecond,
//     notRecorded,
//     totalRecorded: recordMap.size,
//     lastAttendedDate,
//     workingDaysSinceLast,
//     records,
//     // Not-recorded sessions are deliberately not labeled "missed":
//     // holiday/exception calendars are not included in the supplied API payload.
//   };
// }

export function getInternAttendanceSummary(
  intern,
  attendance = [],
  now = new Date(),
) {
  const records = getInternRecords(intern, attendance);
  const group = intern?.group || {};

  // Determine the internship start date.
  const startValue =
    intern?.internshipStartDate ||
    group.actualStartDate ||
    group.plannedStartDate;

  const start = startValue ? new Date(startValue) : null;

  const validStart =
    start && !Number.isNaN(start.getTime())
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate())
      : null;

  // Internship duration is counted in working days, excluding Sundays.
  const duration = Number(group.durationDays || intern?.durationDays || 0);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Generate the complete scheduled working-day calendar.
  const plannedDays = [];

  if (validStart && Number.isInteger(duration) && duration > 0) {
    const cursor = new Date(validStart);

    while (plannedDays.length < duration && plannedDays.length < 365) {
      // Sunday is excluded from the internship duration.
      if (cursor.getDay() !== 0) {
        plannedDays.push(toDateKey(cursor));
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // The final scheduled working date.
  const endDate = plannedDays.length
    ? parseDateKey(plannedDays[plannedDays.length - 1])
    : null;

  // Only dates that have already arrived are eligible for past-session
  // calculations. Future sessions are still included in the full denominator.
  const eligibleDays = plannedDays.filter(
    (dateKey) => parseDateKey(dateKey) <= today,
  );

  // Build a unique record map using date + session number.
  // This prevents duplicate records from inflating attendance.
  const recordMap = new Map();

  records.forEach((record) => {
    const dateKey = record.dateKey || "";
    const sessionNumber = Number(record.sessionNumber || 0);

    if (dateKey && [1, 2].includes(sessionNumber)) {
      recordMap.set(`${dateKey}:${sessionNumber}`, record);
    }
  });

  const uniqueRecords = Array.from(recordMap.values());

  // Attendance status categories.
  const approved = uniqueRecords.filter((record) =>
    PRESENT.has(record.status),
  ).length;

  const pending = uniqueRecords.filter(
    (record) => record.status === "pending",
  ).length;

  const rejected = uniqueRecords.filter(
    (record) => record.status === "rejected",
  ).length;

  const explicitMissedFirst = uniqueRecords.filter(
    (record) =>
      Number(record.sessionNumber) === 1 &&
      (MISSED.has(record.status) ||
        record.status === "rejected" ||
        record.status === "admin_corrected_absent"),
  ).length;

  const explicitMissedSecond = uniqueRecords.filter(
    (record) =>
      Number(record.sessionNumber) === 2 &&
      (MISSED.has(record.status) ||
        record.status === "rejected" ||
        record.status === "admin_corrected_absent"),
  ).length;

  const missed = explicitMissedFirst + explicitMissedSecond;

  // Two sessions are scheduled for every working day.
  const totalScheduledSessions = plannedDays.length * 2;

  // Expected sessions up to today.
  const expectedPast = eligibleDays.length * 2;

  // Sessions that have no attendance record yet.
  const notRecorded = Math.max(
    0,
    expectedPast -
      eligibleDays.reduce((count, dateKey) => {
        const first = recordMap.has(`${dateKey}:1`) ? 1 : 0;
        const second = recordMap.has(`${dateKey}:2`) ? 1 : 0;

        return count + first + second;
      }, 0),
  );

  // Attendance percentages use the complete internship duration.
  const attendancePercentage = totalScheduledSessions
    ? Number(((approved / totalScheduledSessions) * 100).toFixed(2))
    : 0;

  const missedPercentage = totalScheduledSessions
    ? Number(((missed / totalScheduledSessions) * 100).toFixed(2))
    : 0;

  // Find the most recent attended date.
  const presentRecords = uniqueRecords
    .filter((record) => PRESENT.has(record.status))
    .map((record) => record.dateKey)
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

      if (cursor.getDay() !== 0) {
        workingDaysSinceLast += 1;
      }
    }
  } else if (eligibleDays.length >= 3) {
    workingDaysSinceLast = eligibleDays.length;
  }

  return {
    startDate: startValue || null,

    endDate: endDate ? toDateKey(endDate) : null,

    durationDays: plannedDays.length,

    totalWorkingDays: plannedDays.length,

    totalScheduledSessions,

    expectedPastSessions: expectedPast,

    approved,

    attended: approved,

    pending,

    rejected,

    missed,

    explicitlyMissedFirst: explicitMissedFirst,

    explicitlyMissedSecond: explicitMissedSecond,

    attendancePercentage,

    missedPercentage,

    notRecorded,

    totalRecorded: uniqueRecords.length,

    lastAttendedDate,

    workingDaysSinceLast,

    records: uniqueRecords,

    plannedDays,

    eligibleDays,

    // Unrecorded sessions are not automatically labeled missed.
    // They remain separate until the missed-attendance tracker records them.
  };
}

export function buildAttendanceRiskLists(interns = [], attendance = []) {
  const rows = (interns || []).map((intern) => ({
    intern,
    summary: getInternAttendanceSummary(intern, attendance),
  }));
  return {
    firstSession: rows.filter(
      ({ summary }) => summary.explicitlyMissedFirst > 0,
    ),
    secondSession: rows.filter(
      ({ summary }) => summary.explicitlyMissedSecond > 0,
    ),
    inactive: rows.filter(({ summary }) => summary.workingDaysSinceLast >= 3),
  };
}
