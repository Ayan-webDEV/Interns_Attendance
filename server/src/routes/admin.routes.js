import { Router } from "express";

import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import InternshipGroup from "../models/InternshipGroup.js";
import PromoCode from "../models/PromoCode.js";
import AppSettings from "../models/AppSettings.js";

import { HttpError } from "../utils/httpError.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PRESENT_STATUSES = ["approved", "admin_corrected_present"];

const MISSED_STATUSES = [
  "missed",
  "rejected",
  "absent",
  "admin_corrected_absent",
];

const PENDING_STATUS = "pending";

const defaultSchedule = {
  firstStart: "09:30",
  firstEnd: "12:30",
  secondStart: "13:00",
  secondEnd: "15:30",
  minimumSeconds: Number(process.env.ATTENDANCE_MIN_SECONDS || 50),
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const toMinutes = (value) => {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);

  if (!match) return NaN;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : NaN;
};

const getTodayIST = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/* -------------------------------------------------------------------------- */
/* Portal access settings                                                     */
/* -------------------------------------------------------------------------- */

router.get(
  "/settings/portal-access",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const envDefault =
      String(process.env.ONLY_DESKTOP_ACCESS || "true").toLowerCase() !==
      "false";

    const saved = await AppSettings.findOne({
      key: "portal-access",
    }).lean();

    res.json({
      settings: {
        onlyDesktopAccess: saved?.value?.onlyDesktopAccess ?? envDefault,
      },
    });
  }),
);

router.patch(
  "/settings/portal-access",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (typeof req.body.onlyDesktopAccess !== "boolean") {
      throw new HttpError(
        400,
        "Choose whether intern access should be restricted to desktop screens.",
      );
    }

    const saved = await AppSettings.findOneAndUpdate(
      { key: "portal-access" },
      {
        $set: {
          value: {
            onlyDesktopAccess: req.body.onlyDesktopAccess,
          },
          updatedBy: req.user._id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      message: "Portal access settings saved.",
      settings: saved.value,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Attendance schedule settings                                               */
/* -------------------------------------------------------------------------- */

router.get(
  "/settings/attendance",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const saved = await AppSettings.findOne({
      key: "attendance-schedule",
    }).lean();

    res.json({
      settings: {
        ...defaultSchedule,
        ...(saved?.value || {}),
      },
    });
  }),
);

router.patch(
  "/settings/attendance",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const value = {
      firstStart: String(req.body.firstStart || ""),
      firstEnd: String(req.body.firstEnd || ""),
      secondStart: String(req.body.secondStart || ""),
      secondEnd: String(req.body.secondEnd || ""),
      minimumSeconds: Number(req.body.minimumSeconds || 50),
    };

    const firstStart = toMinutes(value.firstStart);
    const firstEnd = toMinutes(value.firstEnd);
    const secondStart = toMinutes(value.secondStart);
    const secondEnd = toMinutes(value.secondEnd);

    if (
      [firstStart, firstEnd, secondStart, secondEnd].some(Number.isNaN) ||
      firstStart >= firstEnd ||
      secondStart >= secondEnd ||
      firstStart >= secondStart ||
      firstEnd > secondStart
    ) {
      throw new HttpError(
        400,
        "Use valid times. The first window must finish before the second window starts.",
      );
    }

    if (
      !Number.isInteger(value.minimumSeconds) ||
      value.minimumSeconds < 10 ||
      value.minimumSeconds > 600
    ) {
      throw new HttpError(
        400,
        "Minimum attendance wait must be 10–600 seconds.",
      );
    }

    const saved = await AppSettings.findOneAndUpdate(
      { key: "attendance-schedule" },
      {
        $set: {
          value,
          updatedBy: req.user._id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      message: "Attendance schedule updated for all groups.",
      settings: saved.value,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin overview                                                             */
/* -------------------------------------------------------------------------- */

router.get(
  "/overview",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const today = getTodayIST();

    const [
      totalInterns,
      groups,
      activeGroups,
      completedGroups,
      promoCodes,
      attendanceBySession,
    ] = await Promise.all([
      User.countDocuments({
        role: "intern",
      }),

      InternshipGroup.countDocuments(),

      InternshipGroup.countDocuments({
        status: "active",
      }),

      InternshipGroup.countDocuments({
        status: "completed",
      }),

      PromoCode.countDocuments({
        active: true,
      }),

      Attendance.aggregate([
        {
          $match: {
            dateKey: today,
            sessionNumber: {
              $in: [1, 2],
            },
          },
        },
        {
          $group: {
            _id: "$sessionNumber",

            present: {
              $sum: {
                $cond: [
                  {
                    $in: ["$status", PRESENT_STATUSES],
                  },
                  1,
                  0,
                ],
              },
            },

            missed: {
              $sum: {
                $cond: [
                  {
                    $in: ["$status", MISSED_STATUSES],
                  },
                  1,
                  0,
                ],
              },
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", PENDING_STATUS],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const sessionMap = new Map(
      attendanceBySession.map((item) => [
        Number(item._id),
        {
          present: item.present || 0,
          missed: item.missed || 0,
          pending: item.pending || 0,
        },
      ]),
    );

    const session1 = sessionMap.get(1) || {
      present: 0,
      missed: 0,
      pending: 0,
    };

    const session2 = sessionMap.get(2) || {
      present: 0,
      missed: 0,
      pending: 0,
    };

    // Retain the original combined count for compatibility.
    const presentToday = session1.present + session2.present;

    res.json({
      totalInterns,
      groups,
      activeGroups,
      presentToday,
      completedGroups,
      activePromoCodes: promoCodes,

      // New independent session statistics.
      attendanceBySession: {
        session1,
        session2,
      },

      dateKey: today,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin intern directory                                                     */
/* -------------------------------------------------------------------------- */

router.get(
  "/interns",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const query = String(req.query.q || "").trim();

    const filter = {
      role: "intern",
    };

    if (req.query.groupId) {
      filter.group = req.query.groupId;
    }

    if (query) {
      filter.$or = [
        {
          name: {
            $regex: query,
            $options: "i",
          },
        },
        {
          email: {
            $regex: query,
            $options: "i",
          },
        },
        {
          internId: {
            $regex: query,
            $options: "i",
          },
        },
        {
          whatsappNumber: {
            $regex: query,
            $options: "i",
          },
        },
        {
          domain: {
            $regex: query,
            $options: "i",
          },
        },
      ];
    }

    const interns = await User.find(filter)
      .select("-passwordHash -googleSub")
      .populate("group", "name status")
      .sort({
        createdAt: -1,
      })
      .limit(1000)
      .lean();

    res.json({
      interns,
    });
  }),
);

export default router;
