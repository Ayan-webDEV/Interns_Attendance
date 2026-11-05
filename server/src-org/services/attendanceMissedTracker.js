import Attendance from "../models/Attendance.js";
import InternshipGroup from "../models/InternshipGroup.js";
import User from "../models/User.js";
import AppSettings from "../models/AppSettings.js";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const TRACKER_INTERVAL_MS = 60 * 1000;

const IST_TIME_ZONE = "Asia/Kolkata";

const DEFAULT_SCHEDULE = {
  firstStart: "09:30",
  firstEnd: "12:30",
  secondStart: "13:00",
  secondEnd: "15:30",
  minimumSeconds: Number(process.env.ATTENDANCE_MIN_SECONDS || 50),
};

const MISSED_REASON =
  "No attendance submission was recorded before the session window closed.";

/*
 * Prevent overlapping background scans within this server process.
 * MongoDB's unique attendance index protects against duplicates across
 * multiple processes or multiple backend instances.
 */
let trackerRunning = false;
let trackerInterval = null;

/* -------------------------------------------------------------------------- */
/* Date and time helpers                                                      */
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

function isSunday(dateKey) {
  const date = new Date(`${dateKey}T12:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.getUTCDay() === 0;
}

/* -------------------------------------------------------------------------- */
/* Schedule helpers                                                           */
/* -------------------------------------------------------------------------- */

function toMinutes(value) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

async function getSchedule() {
  const saved = await AppSettings.findOne({
    key: "attendance-schedule",
  }).lean();

  return {
    ...DEFAULT_SCHEDULE,
    ...(saved?.value || {}),
  };
}

function getSessionWindows(schedule) {
  const firstStart = toMinutes(schedule.firstStart);
  const firstEnd = toMinutes(schedule.firstEnd);

  const secondStart = toMinutes(schedule.secondStart);
  const secondEnd = toMinutes(schedule.secondEnd);

  const values = [firstStart, firstEnd, secondStart, secondEnd];

  if (values.some((value) => value === null)) {
    throw new Error(
      "Invalid attendance schedule. Check the administrator attendance settings.",
    );
  }

  if (
    firstStart >= firstEnd ||
    secondStart >= secondEnd ||
    firstEnd > secondStart
  ) {
    throw new Error(
      "Invalid attendance windows. The first session must finish before the second session starts.",
    );
  }

  return {
    1: {
      sessionNumber: 1,
      start: firstStart,
      end: firstEnd,
    },

    2: {
      sessionNumber: 2,
      start: secondStart,
      end: secondEnd,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Group date eligibility                                                     */
/* -------------------------------------------------------------------------- */

/**
 * This intentionally follows the same activeDate calculation currently
 * used by attendance.routes.js.
 *
 * Keeping it consistent prevents the missed tracker from generating
 * records for dates the existing attendance routes consider invalid.
 */
function isGroupActiveOnDate(group, key) {
  if (!group?.actualStartDate) return false;

  const start = getISTDateKey(new Date(group.actualStartDate));

  const fallbackEnd = new Date(group.actualStartDate);

  fallbackEnd.setDate(fallbackEnd.getDate() + Number(group.durationDays || 28));

  const end = group.actualEndDate
    ? getISTDateKey(new Date(group.actualEndDate))
    : getISTDateKey(fallbackEnd);

  return key >= start && key <= end;
}

/* -------------------------------------------------------------------------- */
/* User reference synchronization                                              */
/* -------------------------------------------------------------------------- */

/**
 * Adds the missed Attendance document reference to the User document.
 *
 * The query's $ne condition prevents the same missed record from
 * incrementing missedAttendanceCount more than once.
 *
 * If the user update fails, the next tracker run can safely retry it.
 */
async function linkMissedRecordToUser(internId, attendanceId) {
  if (!internId || !attendanceId) return false;

  const result = await User.updateOne(
    {
      _id: internId,
      missedAttendanceRecords: {
        $ne: attendanceId,
      },
    },
    {
      $addToSet: {
        missedAttendanceRecords: attendanceId,
      },

      $inc: {
        missedAttendanceCount: 1,
      },
    },
  );

  return result.modifiedCount === 1;
}

/* -------------------------------------------------------------------------- */
/* Existing attendance lookup                                                 */
/* -------------------------------------------------------------------------- */

async function synchronizeExistingMissedRecord(internId, attendance) {
  if (!attendance) return false;

  /*
   * Never attach rejected, pending, approved or administrator-corrected
   * attendance records to the missed-session array.
   */
  if (attendance.status !== "missed") {
    return false;
  }

  await linkMissedRecordToUser(internId, attendance._id);

  return true;
}

/* -------------------------------------------------------------------------- */
/* Missed record creation                                                      */
/* -------------------------------------------------------------------------- */

async function createMissedRecord({
  intern,
  group,
  dateKey,
  sessionNumber,
  now,
}) {
  const filter = {
    intern: intern._id,
    dateKey,
    sessionNumber,
  };

  /*
   * First check for any existing session record.
   * Rejected records must remain rejected.
   * Pending and approved records must remain unchanged.
   * Administrator corrections must remain unchanged.
   */
  const existing = await Attendance.findOne(filter).select("_id status").lean();

  if (existing) {
    await synchronizeExistingMissedRecord(intern._id, existing);

    return {
      created: false,
      alreadyRecorded: true,
    };
  }

  /*
   * Use an atomic upsert so simultaneous tracker executions cannot
   * generate duplicate missed documents for the same session.
   *
   * The unique index is:
   * { intern: 1, dateKey: 1, sessionNumber: 1 }
   */
  let result;

  try {
    result = await Attendance.updateOne(
      filter,
      {
        $setOnInsert: {
          intern: intern._id,
          group: group._id,
          dateKey,
          sessionNumber,

          status: "missed",

          missedAt: now,
          missedReason: MISSED_REASON,
          missedSource: "automatic",

          rewardIssued: false,
          rewardAmount: 0,

          approvalHistory: [
            {
              action: "missed",
              at: now,
              note: MISSED_REASON,
            },
          ],
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );
  } catch (error) {
    /*
     * Another request or tracker instance may have created the same
     * attendance record between the initial lookup and this upsert.
     *
     * Do not treat this as a fatal tracker error. Re-read the winner.
     */
    if (error?.code === 11000) {
      const concurrentRecord = await Attendance.findOne(filter)
        .select("_id status")
        .lean();

      if (concurrentRecord) {
        await synchronizeExistingMissedRecord(intern._id, concurrentRecord);
      }

      return {
        created: false,
        alreadyRecorded: true,
      };
    }

    throw error;
  }

  const insertedId = result?.upsertedId;

  if (!insertedId) {
    /*
     * No document was inserted. A matching attendance record already
     * existed or was created concurrently.
     */
    const concurrentRecord = await Attendance.findOne(filter)
      .select("_id status")
      .lean();

    if (concurrentRecord) {
      await synchronizeExistingMissedRecord(intern._id, concurrentRecord);
    }

    return {
      created: false,
      alreadyRecorded: true,
    };
  }

  /*
   * A missed Attendance document was successfully created.
   * Link it to User and increment the count exactly once.
   */
  await linkMissedRecordToUser(intern._id, insertedId);

  return {
    created: true,
    alreadyRecorded: false,
    attendanceId: insertedId,
  };
}

/* -------------------------------------------------------------------------- */
/* Per-intern missed attendance check                                          */
/* -------------------------------------------------------------------------- */

/**
 * This function may be called by:
 * 1. The background tracker.
 * 2. The attendance API when today's data is requested.
 *
 * It checks both sessions independently.
 */
export async function syncMissedAttendanceForIntern({
  internId,
  group,
  now = new Date(),
  schedule: suppliedSchedule,
} = {}) {
  if (!internId || !group?._id) {
    return {
      created: 0,
      skipped: 0,
    };
  }

  if (group.status !== "active") {
    return {
      created: 0,
      skipped: 0,
    };
  }

  const key = getISTDateKey(now);
  const secondsNow = getISTSeconds(now);

  if (isSunday(key)) {
    return {
      created: 0,
      skipped: 2,
    };
  }

  if (!isGroupActiveOnDate(group, key)) {
    return {
      created: 0,
      skipped: 2,
    };
  }

  const schedule = suppliedSchedule || (await getSchedule());

  const windows = getSessionWindows(schedule);

  const intern = await User.findOne({
    _id: internId,
    group: group._id,
    role: "intern",
    registrationComplete: true,
    status: "active",
  })
    .select("_id")
    .lean();

  if (!intern) {
    return {
      created: 0,
      skipped: 2,
    };
  }

  let created = 0;
  let skipped = 0;

  /*
   * Each session is evaluated separately.
   *
   * A missed first session does not prevent the second session
   * from being attended or tracked independently.
   */
  for (const sessionNumber of [1, 2]) {
    const window = windows[sessionNumber];

    /*
     * The existing mark route permits submissions at the exact end
     * second because it rejects only when currentSeconds > end.
     *
     * Therefore, generate the missed record strictly after the
     * window has ended, not at the exact boundary.
     */
    const windowClosed = secondsNow > window.end * 60;

    if (!windowClosed) {
      skipped += 1;
      continue;
    }

    const result = await createMissedRecord({
      intern,
      group,
      dateKey: key,
      sessionNumber,
      now,
    });

    if (result.created) {
      created += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    created,
    skipped,
  };
}

/* -------------------------------------------------------------------------- */
/* Background tracker                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Scans active groups and registered interns for the current IST date.
 *
 * Runs periodically. Each session is checked independently.
 *
 * A failed User reference update is repaired on a later scan because
 * already-existing missed Attendance records are checked again.
 */
export async function runMissedAttendanceTracker({ now = new Date() } = {}) {
  if (trackerRunning) {
    return {
      skipped: true,
      reason: "A tracker scan is already running.",
    };
  }

  trackerRunning = true;

  const summary = {
    groupsChecked: 0,
    internsChecked: 0,
    missedCreated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const key = getISTDateKey(now);

    if (isSunday(key)) {
      return {
        ...summary,
        skipped: 0,
        holiday: true,
      };
    }

    const schedule = await getSchedule();

    // Validate the current schedule before generating any records.
    getSessionWindows(schedule);

    const groups = await InternshipGroup.find({
      status: "active",
      actualStartDate: { $ne: null },
    }).lean();

    for (const group of groups) {
      summary.groupsChecked += 1;

      if (!isGroupActiveOnDate(group, key)) {
        continue;
      }

      const interns = await User.find({
        group: group._id,
        role: "intern",
        registrationComplete: true,
        status: "active",
      })
        .select("_id")
        .lean();

      for (const intern of interns) {
        summary.internsChecked += 1;

        try {
          const result = await syncMissedAttendanceForIntern({
            internId: intern._id,
            group,
            now,
            schedule,
          });

          summary.missedCreated += result.created || 0;
          summary.skipped += result.skipped || 0;
        } catch (error) {
          summary.errors += 1;

          console.error("[AttendanceMissedTracker] Intern processing failed:", {
            internId: String(intern._id),
            groupId: String(group._id),
            dateKey: key,
            message: error?.message || String(error),
          });
        }
      }
    }

    if (summary.missedCreated > 0 || summary.errors > 0) {
      console.info("[AttendanceMissedTracker] Scan completed:", summary);
    }

    return summary;
  } catch (error) {
    console.error(
      "[AttendanceMissedTracker] Scan failed:",
      error?.message || error,
    );

    throw error;
  } finally {
    trackerRunning = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Tracker startup                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Start after MongoDB successfully connects.
 *
 * The first scan is started immediately; subsequent scans run once
 * per minute.
 *
 * Returns a stop function for controlled shutdown or tests.
 */
export function startMissedAttendanceTracker({
  intervalMs = TRACKER_INTERVAL_MS,
} = {}) {
  if (trackerInterval) {
    console.info("[AttendanceMissedTracker] Tracker is already running.");

    return stopMissedAttendanceTracker;
  }

  const safeInterval = Number(intervalMs);

  const effectiveInterval =
    Number.isFinite(safeInterval) && safeInterval >= 5000
      ? safeInterval
      : TRACKER_INTERVAL_MS;

  console.info(
    `[AttendanceMissedTracker] Started. Scan interval: ${effectiveInterval}ms`,
  );

  /*
   * Initial scan.
   */
  runMissedAttendanceTracker().catch((error) => {
    console.error(
      "[AttendanceMissedTracker] Initial scan failed:",
      error?.message || error,
    );
  });

  /*
   * Repeated scans.
   */
  trackerInterval = setInterval(() => {
    runMissedAttendanceTracker().catch((error) => {
      console.error(
        "[AttendanceMissedTracker] Scheduled scan failed:",
        error?.message || error,
      );
    });
  }, effectiveInterval);

  // The tracker should not prevent the Node.js process from exiting.
  trackerInterval.unref?.();

  return stopMissedAttendanceTracker;
}

/* -------------------------------------------------------------------------- */
/* Tracker shutdown                                                           */
/* -------------------------------------------------------------------------- */

export function stopMissedAttendanceTracker() {
  if (trackerInterval) {
    clearInterval(trackerInterval);
    trackerInterval = null;

    console.info("[AttendanceMissedTracker] Tracker stopped.");
  }
}
