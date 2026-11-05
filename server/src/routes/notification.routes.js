import { Router } from "express";
import Notification from "../models/Notification.js";
import InternshipGroup from "../models/InternshipGroup.js";
import {
  requireAuth,
  requireAdmin,
  requireRegisteredIntern,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

const safeLink = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new HttpError(
      400,
      "Notification link must be a valid https:// or http:// URL.",
    );
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new HttpError(400, "Only HTTP or HTTPS links are allowed.");
  }

  return url.toString();
};

// Interns receive general notices, their group's notices, and direct notices.
router.get(
  "/mine",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const filter = {
      $or: [
        { targetUser: req.user._id },
        {
          $and: [
            { targetUser: null },
            {
              $or: [
                { targetGroup: null },
                { targetGroup: req.user.group },
              ],
            },
          ],
        },
      ],
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      notifications: notifications.map((notification) => ({
        ...notification,
        isRead: (notification.readBy || []).some(
          (id) => String(id) === String(req.user._id),
        ),
      })),
    });
  }),
);

router.post(
  "/:id/read",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { targetUser: req.user._id },
          {
            $and: [
              { targetUser: null },
              {
                $or: [
                  { targetGroup: null },
                  { targetGroup: req.user.group },
                ],
              },
            ],
          },
        ],
      },
      { $addToSet: { readBy: req.user._id } },
      { new: true },
    );

    if (!notification) throw new HttpError(404, "Notification not found.");

    res.json({ message: "Notification marked as read." });
  }),
);

router.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find()
      .populate("targetGroup", "name")
      .populate("targetUser", "name internId")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    res.json({ notifications });
  }),
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();

    if (title.length < 3 || message.length < 3) {
      throw new HttpError(400, "Enter a notification title and message.");
    }

    let targetGroup = null;
    if (req.body.targetGroupId && req.body.targetGroupId !== "all") {
      targetGroup = await InternshipGroup.findById(req.body.targetGroupId);
      if (!targetGroup) throw new HttpError(404, "Target group not found.");
      targetGroup = targetGroup._id;
    }

    const notification = await Notification.create({
      title,
      message,
      link: safeLink(req.body.link),
      targetGroup,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Notification sent.", notification });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) throw new HttpError(404, "Notification not found.");
    res.json({ message: "Notification deleted." });
  }),
);

export default router;
