import { Router } from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";
import InternshipGroup from "../models/InternshipGroup.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AppSettings from "../models/AppSettings.js";
import {
  requireAuth,
  requireRegisteredIntern,
  requireAdmin,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

const dateKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const isSunday = (key) => new Date(`${key}T12:00:00+05:30`).getDay() === 0;

const istSeconds = (date = new Date()) => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return (
    Number(p.find((x) => x.type === "hour")?.value || 0) * 3600 +
    Number(p.find((x) => x.type === "minute")?.value || 0) * 60 +
    Number(p.find((x) => x.type === "second")?.value || 0)
  );
};

const istMinutes = (date = new Date()) => Math.floor(istSeconds(date) / 60);

const defaultSchedule = {
  firstStart: "09:30",
  firstEnd: "12:30",
  secondStart: "13:00",
  secondEnd: "15:30",
  minimumSeconds: Number(process.env.ATTENDANCE_MIN_SECONDS || 50),
};

const toMinutes = (v) => {
  const [h, m] = String(v || "00:00")
    .split(":")
    .map(Number);

  return h * 60 + m;
};

const prettyTime = (v) => {
  const [h, m] = String(v || "00:00")
    .split(":")
    .map(Number);

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getSchedule = async () => ({
  ...defaultSchedule,
  ...((await AppSettings.findOne({ key: "attendance-schedule" }).lean())
    ?.value || {}),
});

const buildWindows = (schedule, secondsNow) => {
  const wait = Number(
    schedule.minimumSeconds || process.env.ATTENDANCE_MIN_SECONDS || 50,
  );

  return {
    1: {
      start: toMinutes(schedule.firstStart),
      end: toMinutes(schedule.firstEnd),
      label: `${prettyTime(schedule.firstStart)} – ${prettyTime(schedule.firstEnd)}`,
      open:
        secondsNow >= toMinutes(schedule.firstStart) * 60 &&
        secondsNow + wait <= toMinutes(schedule.firstEnd) * 60,
    },
    2: {
      start: toMinutes(schedule.secondStart),
      end: toMinutes(schedule.secondEnd),
      label: `${prettyTime(schedule.secondStart)} – ${prettyTime(schedule.secondEnd)}`,
      open:
        secondsNow >= toMinutes(schedule.secondStart) * 60 &&
        secondsNow + wait <= toMinutes(schedule.secondEnd) * 60,
    },
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

router.get(
  "/today",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.user.group).lean();
    const key = dateKey();

    const records = await Attendance.find({
      intern: req.user._id,
      dateKey: key,
    })
      .sort({ sessionNumber: 1 })
      .lean();

    const schedule = await getSchedule();

    const min = Number(
      schedule.minimumSeconds || process.env.ATTENDANCE_MIN_SECONDS || 50,
    );

    const secondsNow = istSeconds();
    const windows = buildWindows(schedule, secondsNow);

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
      minimumSeconds: min,
      windows: { first: windows[1], second: windows[2] },

      serverTimeIST: new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
    });
  }),
);

router.post(
  "/session/start",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const sessionNumber = Number(req.body.sessionNumber || 1);

    if (![1, 2].includes(sessionNumber)) {
      throw new HttpError(400, "Choose a valid attendance session.");
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

    const secondsNow = istSeconds(now);
    const windows = buildWindows(schedule, secondsNow);
    const window = windows[sessionNumber];

    if (
      secondsNow < window.start * 60 ||
      secondsNow +
        Number(
          schedule.minimumSeconds || process.env.ATTENDANCE_MIN_SECONDS || 50,
        ) >
        window.end * 60
    ) {
      throw new HttpError(
        403,
        `Session ${sessionNumber} is available ${window.label} IST, with enough time to complete the wait.`,
      );
    }

    // Session 2 is allowed even if Session 1 was missed or is not approved.
    const existing = await Attendance.findOne({
      intern: req.user._id,
      dateKey: key,
      sessionNumber,
    });

    if (existing && existing.status !== "rejected") {
      throw new HttpError(
        409,
        existing.status === "pending"
          ? "Your attendance request is waiting for admin approval."
          : "This attendance session has already been recorded.",
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
      minimumSeconds: Number(
        schedule.minimumSeconds || process.env.ATTENDANCE_MIN_SECONDS || 50,
      ),
      message:
        "Keep this page open until the timer completes, then submit your attendance request.",
    });
  }),
);

router.post(
  "/session/:id/mark",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const session = await AttendanceSession.findOne({
      _id: req.params.id,
      intern: req.user._id,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new HttpError(
        404,
        "Attendance session expired or not found. Start again.",
      );
    }

    const schedule = await getSchedule();

    const minMs =
      Number(
        schedule.minimumSeconds || process.env.ATTENDANCE_MIN_SECONDS || 50,
      ) * 1000;

    const elapsed = Date.now() - session.startedAt.getTime();

    if (elapsed < minMs) {
      throw new HttpError(
        400,
        `Please wait ${Math.ceil((minMs - elapsed) / 1000)} more seconds before submitting.`,
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

    // No first-attendance approval prerequisite for Session 2.
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
        existing.rejectionReason = "";
        existing.rewardIssued = false;
        existing.rewardAmount = 0;

        attendance = await existing.save();
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
    } catch (e) {
      if (e.code === 11000) {
        throw new HttpError(
          409,
          "This attendance request has already been submitted.",
        );
      }

      throw e;
    }

    res.status(201).json({
      message: `Session ${session.sessionNumber} attendance request sent. It will count only after admin approval.`,
      attendance,
    });
  }),
);

router.get(
  "/mine",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const from = String(req.query.from || "").slice(0, 10);
    const to = String(req.query.to || "").slice(0, 10);

    const filter = { intern: req.user._id };

    if (from || to) {
      filter.dateKey = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const records = await Attendance.find(filter)
      .sort({ dateKey: 1, sessionNumber: 1 })
      .lean();

    const approved = records.filter((x) => eligibleStatus.includes(x.status));

    res.json({
      records,

      summary: {
        approvedSessions: approved.length,
        approvedDays: new Set(approved.map((x) => x.dateKey)).size,
        pending: records.filter((x) => x.status === "pending").length,
        rejected: records.filter((x) => x.status === "rejected").length,
      },
    });
  }),
);

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
          ? { $gte: String(req.query.from).slice(0, 10) }
          : {}),
        ...(req.query.to ? { $lte: String(req.query.to).slice(0, 10) } : {}),
      };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.sessionNumber) {
      filter.sessionNumber = Number(req.query.sessionNumber);
    }

    const records = await Attendance.find(filter)
      .populate({
        path: "intern",
        select: "name email internId domain group",
        populate: { path: "group", select: "name" },
      })
      .populate("approvedBy rejectedBy correctedBy", "name email")
      .sort({ dateKey: -1, sessionNumber: 1 })
      .limit(5000)
      .lean();

    res.json({ records });
  }),
);

router.get(
  "/admin/approvals",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = { status: "pending" };

    if (req.query.groupId) {
      filter.group = req.query.groupId;
    }

    if (req.query.sessionNumber) {
      filter.sessionNumber = Number(req.query.sessionNumber);
    }

    const records = await Attendance.find(filter)
      .populate("intern", "name email internId domain whatsappNumber")
      .populate("group", "name status")
      .sort({ dateKey: 1, sessionNumber: 1, markedAt: 1 })
      .limit(3000)
      .lean();

    res.json({ records });
  }),
);

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

    const filter = { status: "pending" };

    if (approveAll) {
      if (!groupId) {
        throw new HttpError(
          400,
          "Choose a group to approve all pending requests.",
        );
      }

      filter.group = groupId;

      if (sessionNumber) {
        filter.sessionNumber = Number(sessionNumber);
      }
    } else {
      if (
        !Array.isArray(attendanceIds) ||
        !attendanceIds.length ||
        attendanceIds.length > 500
      ) {
        throw new HttpError(400, "Select one or more attendance requests.");
      }

      filter._id = { $in: attendanceIds };
    }

    const session = await mongoose.startSession();
    let approvedCount = 0;

    try {
      await session.withTransaction(async () => {
        approvedCount = 0;

        const pending = await Attendance.find(filter).session(session);

        for (const record of pending) {
          const reward = record.sessionNumber === 1 ? 1 : 3;

          const changed = await Attendance.findOneAndUpdate(
            { _id: record._id, status: "pending" },
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
            { new: true, session },
          );

          if (!changed) continue;

          const user = await User.findByIdAndUpdate(
            record.intern,
            { $inc: { internCashBalance: reward } },
            { new: true, session },
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
            { session },
          );

          approvedCount++;
        }
      });
    } finally {
      await session.endSession();
    }

    res.json({
      message: `${approvedCount} attendance request(s) approved and rewards credited.`,
      approvedCount,
    });
  }),
);

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
      { _id: { $in: ids }, status: "pending" },
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

    const lookup = String(internId || "")
      .trim()
      .toUpperCase();

    const criteria = mongoose.Types.ObjectId.isValid(String(internId || ""))
      ? { _id: internId, role: "intern" }
      : { internId: lookup, role: "intern" };

    const intern = await User.findOne(criteria);

    if (!intern) {
      throw new HttpError(404, "Intern not found.");
    }

    const recordId = await Attendance.findOne({
      intern: intern._id,
      dateKey: String(date).slice(0, 10),
      sessionNumber: Number(sessionNumber),
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

        const wantsPresent = ["approved", "admin_corrected_present"].includes(
          status,
        );

        const reward = record.sessionNumber === 1 ? 1 : 3;

        if (wantsPresent && !record.rewardIssued) {
          user.internCashBalance += reward;
          await user.save({ session: txSession });

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
            { session: txSession },
          );

          record.rewardIssued = true;
          record.rewardAmount = reward;
        }

        if (!wantsPresent && record.rewardIssued) {
          const amount = Number(record.rewardAmount || reward);

          if (user.internCashBalance < amount) {
            throw new HttpError(
              409,
              "This reward cannot be reversed because the intern balance is lower than the credited amount. Review the wallet ledger before correcting.",
            );
          }

          user.internCashBalance -= amount;
          await user.save({ session: txSession });

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
            { session: txSession },
          );

          record.rewardIssued = false;
          record.rewardAmount = 0;
        }

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
        }

        await record.save({ session: txSession });
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
