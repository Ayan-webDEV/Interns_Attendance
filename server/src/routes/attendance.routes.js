import { Router } from "express";
import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";
import InternshipGroup from "../models/InternshipGroup.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AppSettings from "../models/AppSettings.js";
import Notification from "../models/Notification.js";

import {
  requireAuth,
  requireRegisteredIntern,
  requireAdmin,
} from "../middleware/auth.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

import { syncMissedAttendanceForIntern } from "../services/attendanceMissedTracker.js";

const router = Router();

/**
 * Keep one private reminder per intern. If the intern already read it but
 * still has no gender selected, make the existing reminder unread again.
 */
async function ensureGenderAttendanceReminder(user) {
  const code = "gender-required-for-attendance";
  const existing = await Notification.findOne({
    targetUser: user._id,
    code,
  });

  if (existing) {
    await Notification.updateOne(
      { _id: existing._id },
      { $pull: { readBy: user._id } },
    );
    return;
  }

  await Notification.create({
    title: "Complete your profile before marking attendance",
    message:
      "Attendance requires a gender selection in your profile. Open My Account → Profile preferences → Gender, choose an option (Female, Male, Non-binary, or Prefer not to say), and select Save preference. Then return to Attendance and start your session again.",
    link: "",
    targetGroup: user.group || null,
    targetUser: user._id,
    code,
    createdBy: user._id,
  });
}

/* -------------------------------------------------------------------------- */
/* Constants and date/time helpers                                            */
/* -------------------------------------------------------------------------- */

const IST = "Asia/Kolkata";

const dateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const isSunday = (key) => {
  const date = new Date(`${key}T12:00:00+05:30`);

  return !Number.isNaN(date.getTime()) && date.getDay() === 0;
};

const istSeconds = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, Number(part.value)]),
  );

  return (
    (values.hour || 0) * 3600 + (values.minute || 0) * 60 + (values.second || 0)
  );
};

const defaultSchedule = {
  firstStart: "09:30",
  firstEnd: "12:30",
  secondStart: "13:00",
  secondEnd: "15:30",
  minimumSeconds: Number(process.env.ATTENDANCE_MIN_SECONDS || 50),
};

const toMinutes = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return NaN;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return NaN;

  return hours * 60 + minutes;
};

const prettyTime = (value) => {
  const minutes = toMinutes(value);

  if (!Number.isFinite(minutes)) {
    return "Time unavailable";
  }

  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const getSchedule = async () => {
  const saved = await AppSettings.findOne({
    key: "attendance-schedule",
  }).lean();

  return {
    ...defaultSchedule,
    ...(saved?.value || {}),
  };
};

const getMinimumSeconds = (schedule) => {
  const seconds = Number(
    schedule?.minimumSeconds ||
      process.env.ATTENDANCE_MIN_SECONDS ||
      defaultSchedule.minimumSeconds,
  );

  return Number.isFinite(seconds) && seconds > 0 ? seconds : 50;
};

const validateSchedule = (schedule) => {
  const values = [
    toMinutes(schedule.firstStart),
    toMinutes(schedule.firstEnd),
    toMinutes(schedule.secondStart),
    toMinutes(schedule.secondEnd),
  ];

  const [firstStart, firstEnd, secondStart, secondEnd] = values;

  if (
    values.some((value) => !Number.isFinite(value)) ||
    firstStart >= firstEnd ||
    secondStart >= secondEnd ||
    firstEnd > secondStart
  ) {
    throw new HttpError(
      500,
      "The attendance schedule is invalid. Please contact the administrator.",
    );
  }

  return {
    firstStart,
    firstEnd,
    secondStart,
    secondEnd,
  };
};

const buildWindows = (schedule, secondsNow) => {
  const validated = validateSchedule(schedule);
  const minimumSeconds = getMinimumSeconds(schedule);

  const makeWindow = (start, end) => {
    const startTime = `${Math.floor(start / 60)}:${String(start % 60).padStart(2, "0")}`;

    const endTime = `${Math.floor(end / 60)}:${String(end % 60).padStart(2, "0")}`;

    return {
      start,
      end,
      label: `${prettyTime(startTime)} – ${prettyTime(endTime)}`,
      open: secondsNow >= start * 60 && secondsNow + minimumSeconds <= end * 60,
    };
  };

  return {
    1: makeWindow(validated.firstStart, validated.firstEnd),

    2: makeWindow(validated.secondStart, validated.secondEnd),
  };
};

const activeDate = (group, key) => {
  if (!group?.actualStartDate) return false;

  const start = dateKey(group.actualStartDate);

  const fallbackEnd = new Date(group.actualStartDate);

  fallbackEnd.setDate(fallbackEnd.getDate() + Number(group.durationDays || 28));

  const end = dateKey(group.actualEndDate || fallbackEnd);

  return key >= start && key <= end;
};

const eligibleStatus = ["approved", "admin_corrected_present"];

/* -------------------------------------------------------------------------- */
/* Attendance summary                                                         */
/* -------------------------------------------------------------------------- */

const recordSummary = (records) => {
  const safeRecords = Array.isArray(records) ? records : [];

  const approved = safeRecords.filter((record) =>
    eligibleStatus.includes(record.status),
  );

  return {
    approvedSessions: approved.length,

    approvedDays: new Set(approved.map((record) => record.dateKey)).size,

    pending: safeRecords.filter((record) => record.status === "pending").length,

    rejected: safeRecords.filter((record) => record.status === "rejected")
      .length,

    missed: safeRecords.filter((record) => record.status === "missed").length,

    adminCorrectedAbsent: safeRecords.filter(
      (record) => record.status === "admin_corrected_absent",
    ).length,
  };
};

/* -------------------------------------------------------------------------- */
/* Missed attendance reconciliation                                           */
/* -------------------------------------------------------------------------- */

/**
 * Reconcile the current day's sessions before returning attendance data.
 *
 * The background tracker is the primary missed-session mechanism.
 * This request-time check handles the small gap between a session window
 * closing and the next background scan.
 *
 * A reconciliation failure is logged but does not make the existing
 * attendance history inaccessible.
 */

const reconcileCurrentIntern = async (req) => {
  if (!req.user?.group) {
    return {
      synced: false,
      created: 0,
    };
  }

  try {
    const group = await InternshipGroup.findById(req.user.group).lean();

    if (!group) {
      return {
        synced: false,
        created: 0,
      };
    }

    const result = await syncMissedAttendanceForIntern({
      internId: req.user._id,
      group,
      now: new Date(),
    });

    return {
      synced: true,
      created: result.created || 0,
    };
  } catch (error) {
    console.error("[Attendance] Current-user missed reconciliation failed:", {
      internId: String(req.user._id),
      message: error?.message || String(error),
    });

    return {
      synced: false,
      created: 0,
    };
  }
};

/**
 * Read the latest count because req.user was loaded before the
 * reconciliation updated its missedAttendanceCount.
 */

const getLatestMissedCount = async (internId) => {
  const user = await User.findById(internId)
    .select("missedAttendanceCount")
    .lean();

  return Number(user?.missedAttendanceCount || 0);
};

/* -------------------------------------------------------------------------- */
/* Intern: today's attendance                                                 */
/* -------------------------------------------------------------------------- */

router.get(
  "/today",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const key = dateKey();

    const reconciliation = await reconcileCurrentIntern(req);

    const group = await InternshipGroup.findById(req.user.group).lean();

    const records = await Attendance.find({
      intern: req.user._id,
      dateKey: key,
    })
      .sort({ sessionNumber: 1 })
      .lean();

    const schedule = await getSchedule();

    const minimumSeconds = getMinimumSeconds(schedule);

    const windows = buildWindows(schedule, istSeconds());

    const summary = recordSummary(records);

    const missedAttendanceCount = await getLatestMissedCount(req.user._id);

    res.json({
      dateKey: key,

      isSunday: isSunday(key),

      groupStatus: group?.status || "registration",

      group: group
        ? {
            _id: group._id,
            name: group.name,
            description: group.description,
            status: group.status,
            actualStartDate: group.actualStartDate,
            actualEndDate: group.actualEndDate,
            durationDays: group.durationDays,
          }
        : null,

      records,

      summary,

      missedAttendanceCount,

      missedTrackingSynced: reconciliation.synced,

      minimumSeconds,

      windows: {
        first: windows[1],
        second: windows[2],
      },

      serverTimeIST: new Intl.DateTimeFormat("en-IN", {
        timeZone: IST,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Intern: start an individual attendance session                              */
/* -------------------------------------------------------------------------- */

router.post(
  "/session/start",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const sessionNumber = Number(req.body.sessionNumber || 1);

    if (![1, 2].includes(sessionNumber)) {
      throw new HttpError(400, "Choose a valid attendance session.");
    }

    if (!req.user.gender) {
      await ensureGenderAttendanceReminder(req.user);

      throw new HttpError(
        403,
        "Please select your gender in My Account → Profile preferences → Gender, then select Save preference. We have also sent you a notification with the steps.",
        "GENDER_REQUIRED",
      );
    }

    const group = await InternshipGroup.findById(req.user.group);

    if (!group || group.status !== "active" || !group.actualStartDate) {
      throw new HttpError(
        403,
        "Your internship has not started yet. Please contact your group admin.",
      );
    }

    const now = new Date();
    const key = dateKey(now);

    if (!activeDate(group, key)) {
      throw new HttpError(
        403,
        "Attendance is available only during your group internship dates.",
      );
    }

    if (isSunday(key)) {
      throw new HttpError(
        403,
        "Sunday is a holiday. Please come back tomorrow.",
      );
    }

    const schedule = await getSchedule();

    const minimumSeconds = getMinimumSeconds(schedule);

    const secondsNow = istSeconds(now);

    const windows = buildWindows(schedule, secondsNow);

    const window = windows[sessionNumber];

    if (
      secondsNow < window.start * 60 ||
      secondsNow + minimumSeconds > window.end * 60
    ) {
      throw new HttpError(
        403,
        `Session ${sessionNumber} is available ${window.label} IST, with enough time to complete the wait.`,
      );
    }

    /*
     * IMPORTANT:
     *
     * Session 1 and Session 2 are completely independent.
     *
     * There is deliberately NO query checking whether Session 1
     * has been approved before allowing Session 2 to start.
     *
     * Each session has its own time window and attendance record.
     */

    const existing = await Attendance.findOne({
      intern: req.user._id,
      dateKey: key,
      sessionNumber,
    });

    /*
     * Only a rejected record may be resubmitted.
     *
     * A missed record is not eligible for a new submission after
     * its attendance window has closed.
     */

    if (existing && existing.status !== "rejected") {
      if (existing.status === "pending") {
        throw new HttpError(
          409,
          "Your attendance request is waiting for admin approval.",
        );
      }

      if (existing.status === "missed") {
        throw new HttpError(
          409,
          "This attendance window has already been recorded as missed.",
        );
      }

      throw new HttpError(
        409,
        "This attendance session has already been recorded.",
      );
    }

    const session = await AttendanceSession.create({
      intern: req.user._id,
      group: group._id,
      dateKey: key,
      sessionNumber,
      startedAt: now,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    });

    res.status(201).json({
      sessionId: session._id,
      sessionNumber,
      startedAt: session.startedAt,
      minimumSeconds,

      message:
        "Keep this page open until the timer completes, then submit your attendance request.",
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Intern: submit an individual attendance session                             */
/* -------------------------------------------------------------------------- */

router.post(
  "/session/:id/mark",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const session = await AttendanceSession.findOne({
      _id: req.params.id,
      intern: req.user._id,
      consumedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!session) {
      throw new HttpError(
        404,
        "Attendance session expired or not found. Start again.",
      );
    }

    const schedule = await getSchedule();

    const minimumSeconds = getMinimumSeconds(schedule);

    const minimumMs = minimumSeconds * 1000;

    const elapsed = Date.now() - session.startedAt.getTime();

    if (elapsed < minimumMs) {
      throw new HttpError(
        400,
        `Please wait ${Math.ceil(
          (minimumMs - elapsed) / 1000,
        )} more seconds before submitting.`,
      );
    }

    if (String(session.group) !== String(req.user.group)) {
      throw new HttpError(
        403,
        "This attendance session belongs to a different group.",
      );
    }

    const group = await InternshipGroup.findById(session.group);

    if (
      !group ||
      group.status !== "active" ||
      !activeDate(group, session.dateKey)
    ) {
      throw new HttpError(
        403,
        "This internship group is not active for this date.",
      );
    }

    if (isSunday(session.dateKey)) {
      throw new HttpError(403, "Sunday is a holiday.");
    }

    const currentSeconds = istSeconds();

    const currentWindow = buildWindows(schedule, currentSeconds)[
      session.sessionNumber
    ];

    if (
      currentSeconds < currentWindow.start * 60 ||
      currentSeconds > currentWindow.end * 60
    ) {
      throw new HttpError(
        403,
        `The attendance window has closed. Requests must be submitted ${currentWindow.label} IST.`,
      );
    }

    /*
     * No first-session approval prerequisite.
     * Either session can be submitted independently.
     */

    session.consumedAt = new Date();

    await session.save();

    let attendance;

    try {
      const existing = await Attendance.findOne({
        intern: req.user._id,
        dateKey: session.dateKey,
        sessionNumber: session.sessionNumber,
      });

      if (existing?.status === "rejected") {
        existing.approvalHistory.push({
          action: "submitted",
          actor: req.user._id,
          at: new Date(),
          note: "Resubmitted after rejection",
        });

        existing.status = "pending";

        existing.sessionStartedAt = session.startedAt;
        existing.markedAt = new Date();

        existing.rejectedAt = undefined;
        existing.rejectedBy = undefined;
        existing.rejectionReason = undefined;

        existing.rewardIssued = false;
        existing.rewardAmount = 0;

        // Defensive cleanup of any stale missed metadata.
        existing.missedAt = undefined;
        existing.missedReason = undefined;
        existing.missedSource = undefined;

        attendance = await existing.save();
      } else if (existing) {
        throw new HttpError(
          409,
          "This attendance session has already been recorded.",
        );
      } else {
        attendance = await Attendance.create({
          intern: req.user._id,
          group: group._id,
          dateKey: session.dateKey,
          sessionNumber: session.sessionNumber,

          status: "pending",

          sessionStartedAt: session.startedAt,
          markedAt: new Date(),

          rewardIssued: false,
          rewardAmount: 0,

          approvalHistory: [
            {
              action: "submitted",
              actor: req.user._id,
              at: new Date(),
              note: "Attendance submitted",
            },
          ],
        });
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      if (error?.code === 11000) {
        throw new HttpError(
          409,
          "This attendance request has already been submitted.",
        );
      }

      throw error;
    }

    res.status(201).json({
      message: `Session ${session.sessionNumber} attendance request sent. It will count only after admin approval.`,

      attendance,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Intern: all attendance records                                             */
/* -------------------------------------------------------------------------- */

router.get(
  "/mine",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const reconciliation = await reconcileCurrentIntern(req);

    const from = String(req.query.from || "").slice(0, 10);

    const to = String(req.query.to || "").slice(0, 10);

    const filter = {
      intern: req.user._id,
    };

    if (from || to) {
      filter.dateKey = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const records = await Attendance.find(filter)
      .sort({
        dateKey: 1,
        sessionNumber: 1,
      })
      .lean();

    const missedAttendanceCount = await getLatestMissedCount(req.user._id);

    res.json({
      records,

      summary: recordSummary(records),

      missedAttendanceCount,

      missedTrackingSynced: reconciliation.synced,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Intern: attendance history                                                 */
/* -------------------------------------------------------------------------- */

router.get(
  "/history",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const reconciliation = await reconcileCurrentIntern(req);

    const filter = {
      intern: req.user._id,
    };

    if (req.query.from || req.query.to) {
      filter.dateKey = {
        ...(req.query.from
          ? {
              $gte: String(req.query.from).slice(0, 10),
            }
          : {}),

        ...(req.query.to
          ? {
              $lte: String(req.query.to).slice(0, 10),
            }
          : {}),
      };
    }

    const records = await Attendance.find(filter)
      .sort({
        dateKey: -1,
        sessionNumber: 1,
      })
      .limit(500)
      .lean();

    const missedAttendanceCount = await getLatestMissedCount(req.user._id);

    res.json({
      records,

      summary: recordSummary(records),

      missedAttendanceCount,

      missedTrackingSynced: reconciliation.synced,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: attendance report                                                   */
/* -------------------------------------------------------------------------- */

router.get(
  "/admin/report",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.groupId) {
      filter.group = req.query.groupId;
    }

    if (req.query.from || req.query.to) {
      filter.dateKey = {
        ...(req.query.from
          ? {
              $gte: String(req.query.from).slice(0, 10),
            }
          : {}),

        ...(req.query.to
          ? {
              $lte: String(req.query.to).slice(0, 10),
            }
          : {}),
      };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.sessionNumber) {
      const sessionNumber = Number(req.query.sessionNumber);

      if (![1, 2].includes(sessionNumber)) {
        throw new HttpError(400, "Choose a valid attendance session.");
      }

      filter.sessionNumber = sessionNumber;
    }

    const records = await Attendance.find(filter)
      .populate({
        path: "intern",
        select: "name email internId domain group missedAttendanceCount",

        populate: {
          path: "group",
          select: "name",
        },
      })
      .populate("approvedBy rejectedBy correctedBy", "name email")
      .sort({
        dateKey: -1,
        sessionNumber: 1,
      })
      .limit(5000)
      .lean();

    res.json({
      records,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: pending approvals                                                   */
/* -------------------------------------------------------------------------- */

router.get(
  "/admin/approvals",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {
      status: "pending",
    };

    if (req.query.groupId) {
      filter.group = req.query.groupId;
    }

    if (req.query.sessionNumber) {
      const sessionNumber = Number(req.query.sessionNumber);

      if (![1, 2].includes(sessionNumber)) {
        throw new HttpError(400, "Choose a valid attendance session.");
      }

      filter.sessionNumber = sessionNumber;
    }

    const records = await Attendance.find(filter)
      .populate("intern", "name email internId domain whatsappNumber")
      .populate("group", "name status")
      .sort({
        dateKey: 1,
        sessionNumber: 1,
        markedAt: 1,
      })
      .limit(3000)
      .lean();

    res.json({
      records,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: approve attendance and credit rewards                               */
/* -------------------------------------------------------------------------- */

router.post(
  "/admin/approvals/approve",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      attendanceIds = [],
      groupId,
      sessionNumber,
      approveAll = false,
    } = req.body;

    const filter = {
      status: "pending",
    };

    if (approveAll) {
      if (!groupId) {
        throw new HttpError(
          400,
          "Choose a group to approve all pending requests.",
        );
      }

      filter.group = groupId;

      if (sessionNumber) {
        const parsedSession = Number(sessionNumber);

        if (![1, 2].includes(parsedSession)) {
          throw new HttpError(400, "Choose a valid attendance session.");
        }

        filter.sessionNumber = parsedSession;
      }
    } else {
      if (
        !Array.isArray(attendanceIds) ||
        !attendanceIds.length ||
        attendanceIds.length > 500
      ) {
        throw new HttpError(400, "Select one or more attendance requests.");
      }

      filter._id = {
        $in: attendanceIds,
      };
    }

    const txSession = await mongoose.startSession();

    let approvedCount = 0;

    try {
      await txSession.withTransaction(async () => {
        approvedCount = 0;

        const pendingRecords = await Attendance.find(filter).session(txSession);

        for (const record of pendingRecords) {
          const reward = record.sessionNumber === 1 ? 1 : 3;

          const changed = await Attendance.findOneAndUpdate(
            {
              _id: record._id,
              status: "pending",
            },
            {
              $set: {
                status: "approved",
                approvedAt: new Date(),
                approvedBy: req.user._id,
                rewardIssued: true,
                rewardAmount: reward,
              },

              $push: {
                approvalHistory: {
                  action: "approved",
                  actor: req.user._id,
                  at: new Date(),
                  note: "Approved by admin",
                },
              },
            },
            {
              new: true,
              session: txSession,
            },
          );

          if (!changed) continue;

          const user = await User.findByIdAndUpdate(
            record.intern,
            {
              $inc: {
                internCashBalance: reward,
              },
            },
            {
              new: true,
              session: txSession,
            },
          );

          if (!user) {
            throw new Error("Attendance intern record is missing.");
          }

          await WalletTransaction.create(
            [
              {
                intern: user._id,
                group: record.group,
                amount: reward,

                type:
                  record.sessionNumber === 1
                    ? "attendance_reward"
                    : "reattendance_reward",

                reference: `attendance:${record._id}`,

                description: `Session ${record.sessionNumber} attendance approved for ${record.dateKey}`,

                balanceAfter: user.internCashBalance,
                createdBy: req.user._id,
              },
            ],
            {
              session: txSession,
            },
          );

          approvedCount++;
        }
      });
    } finally {
      await txSession.endSession();
    }

    res.json({
      message: `${approvedCount} attendance request(s) approved and rewards credited.`,

      approvedCount,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: reject pending attendance                                           */
/* -------------------------------------------------------------------------- */

router.post(
  "/admin/approvals/reject",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ids = req.body.attendanceIds;

    const reason = String(req.body.reason || "").trim();

    if (!Array.isArray(ids) || !ids.length || !reason) {
      throw new HttpError(
        400,
        "Select attendance requests and provide a reason.",
      );
    }

    const result = await Attendance.updateMany(
      {
        _id: {
          $in: ids,
        },
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: req.user._id,
          rejectionReason: reason.slice(0, 500),
        },

        $push: {
          approvalHistory: {
            action: "rejected",
            actor: req.user._id,
            at: new Date(),
            note: reason.slice(0, 500),
          },
        },
      },
    );

    res.json({
      message: `${result.modifiedCount} request(s) rejected. Interns can submit a new request during the same session window.`,

      rejectedCount: result.modifiedCount,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: correct an existing attendance record                               */
/* -------------------------------------------------------------------------- */

router.post(
  "/admin/correct",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { internId, date, status, reason, sessionNumber = 1 } = req.body;

    if (
      ![
        "approved",
        "rejected",
        "admin_corrected_present",
        "admin_corrected_absent",
      ].includes(status) ||
      !reason
    ) {
      throw new HttpError(
        400,
        "Choose a valid status and provide a correction reason.",
      );
    }

    const parsedSession = Number(sessionNumber);

    if (![1, 2].includes(parsedSession)) {
      throw new HttpError(400, "Choose a valid attendance session.");
    }

    const lookup = String(internId || "")
      .trim()
      .toUpperCase();

    const criteria = mongoose.Types.ObjectId.isValid(String(internId || ""))
      ? {
          _id: internId,
          role: "intern",
        }
      : {
          internId: lookup,
          role: "intern",
        };

    const intern = await User.findOne(criteria);

    if (!intern) {
      throw new HttpError(404, "Intern not found.");
    }

    const recordId = await Attendance.findOne({
      intern: intern._id,
      dateKey: String(date || "").slice(0, 10),
      sessionNumber: parsedSession,
    }).select("_id");

    if (!recordId) {
      throw new HttpError(404, "Attendance record not found.");
    }

    const txSession = await mongoose.startSession();

    let updatedRecord;

    try {
      await txSession.withTransaction(async () => {
        const record = await Attendance.findById(recordId._id).session(
          txSession,
        );

        const user = await User.findById(intern._id).session(txSession);

        if (!record || !user) {
          throw new HttpError(404, "Attendance or intern record not found.");
        }

        const wasMissed = record.status === "missed";

        const wantsPresent = ["approved", "admin_corrected_present"].includes(
          status,
        );

        const reward = record.sessionNumber === 1 ? 1 : 3;

        /* ------------------------------------------------------------------ */
        /* Reward credit                                                       */
        /* ------------------------------------------------------------------ */

        if (wantsPresent && !record.rewardIssued) {
          user.internCashBalance += reward;

          await user.save({
            session: txSession,
          });

          await WalletTransaction.create(
            [
              {
                intern: user._id,
                group: record.group,
                amount: reward,

                type:
                  record.sessionNumber === 1
                    ? "attendance_reward"
                    : "reattendance_reward",

                reference: `attendance-correction-credit:${record._id}:${Date.now()}`,

                description: `Admin correction credit: session ${record.sessionNumber}, ${record.dateKey}`,

                balanceAfter: user.internCashBalance,
                createdBy: req.user._id,
              },
            ],
            {
              session: txSession,
            },
          );

          record.rewardIssued = true;
          record.rewardAmount = reward;
        }

        /* ------------------------------------------------------------------ */
        /* Reward reversal                                                     */
        /* ------------------------------------------------------------------ */

        if (!wantsPresent && record.rewardIssued) {
          const amount = Number(record.rewardAmount || reward);

          if (user.internCashBalance < amount) {
            throw new HttpError(
              409,
              "This reward cannot be reversed because the intern balance is lower than the credited amount. Review the wallet ledger before correcting.",
            );
          }

          user.internCashBalance -= amount;

          await user.save({
            session: txSession,
          });

          await WalletTransaction.create(
            [
              {
                intern: user._id,
                group: record.group,
                amount: -amount,
                type: "admin_adjustment",

                reference: `attendance-correction-debit:${record._id}:${Date.now()}`,

                description: `Admin correction reversal: session ${record.sessionNumber}, ${record.dateKey}`,

                balanceAfter: user.internCashBalance,
                createdBy: req.user._id,
              },
            ],
            {
              session: txSession,
            },
          );

          record.rewardIssued = false;
          record.rewardAmount = 0;
        }

        /* ------------------------------------------------------------------ */
        /* Remove missed reference after administrator correction            */
        /* ------------------------------------------------------------------ */

        if (wasMissed) {
          const missedRefs = Array.isArray(user.missedAttendanceRecords)
            ? user.missedAttendanceRecords
            : [];

          const hadReference = missedRefs.some(
            (id) => String(id) === String(record._id),
          );

          if (hadReference) {
            user.missedAttendanceRecords = missedRefs.filter(
              (id) => String(id) !== String(record._id),
            );

            user.missedAttendanceCount = Math.max(
              0,
              Number(user.missedAttendanceCount || 0) - 1,
            );

            await user.save({
              session: txSession,
            });
          }
        }

        /* ------------------------------------------------------------------ */
        /* Save correction                                                     */
        /* ------------------------------------------------------------------ */

        record.status = wantsPresent ? "admin_corrected_present" : status;

        record.correctedBy = req.user._id;

        record.correctionReason = String(reason).slice(0, 500);

        if (status === "rejected" || status === "admin_corrected_absent") {
          record.rejectedAt = new Date();
          record.rejectedBy = req.user._id;

          record.rejectionReason = String(reason).slice(0, 500);
        } else {
          record.rejectedAt = undefined;
          record.rejectedBy = undefined;
          record.rejectionReason = undefined;
        }

        record.approvalHistory.push({
          action: "corrected",
          actor: req.user._id,
          at: new Date(),
          note: String(reason).slice(0, 500),
        });

        if (wantsPresent) {
          record.approvedAt = new Date();
          record.approvedBy = req.user._id;
        } else {
          record.approvedAt = undefined;
          record.approvedBy = undefined;
        }

        if (wasMissed) {
          record.missedAt = undefined;
          record.missedReason = undefined;
          record.missedSource = undefined;
        }

        await record.save({
          session: txSession,
        });

        updatedRecord = record.toObject();
      });
    } finally {
      await txSession.endSession();
    }

    res.json({
      message:
        "Attendance correction saved with a wallet ledger adjustment where required.",

      record: updatedRecord,
    });
  }),
);

export default router;
