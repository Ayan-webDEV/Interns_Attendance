import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import InternshipGroup from "../models/InternshipGroup.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";
import WalletTransaction from "../models/WalletTransaction.js";
import PromoCode from "../models/PromoCode.js";
import Notification from "../models/Notification.js";
import GroupArchive from "../models/GroupArchive.js";
import AuditLog from "../models/AuditLog.js";
import ExcelJS from "exceljs";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { generateLorPdf } from "../services/lorPdf.service.js";
import { generateStipendPdf } from "../services/stipendPdf.service.js";
import { createStipendPdfFilename } from "../utils/stipendHelpers.js";

const router = Router();
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
const encryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(
      String(
        process.env.INVITE_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || "",
      ),
    )
    .digest();
const encrypt = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
};
// const decrypt = (value) => {
//   const [iv, tag, data] = String(value || "").split(".");
//   if (!iv || !tag || !data) return null;
//   const decipher = crypto.createDecipheriv(
//     "aes-256-gcm",
//     encryptionKey(),
//     Buffer.from(iv, "base64url"),
//   );
//   decipher.setAuthTag(Buffer.from(tag, "base64url"));
//   return Buffer.concat([
//     decipher.update(Buffer.from(data, "base64url")),
//     decipher.final(),
//   ]).toString("utf8");
// };

const decrypt = (value) => {
  const [iv, tag, data] = String(value || "").split(".");

  if (!iv || !tag || !data) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    console.error(
      "[Groups] Invite token decryption failed. Check whether the original encryption key is still configured.",
      error.message,
    );

    throw new HttpError(
      409,
      "This invitation link cannot be retrieved because its encryption key is incompatible. Please use Reset Invitation to generate a new link.",
    );
  }
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};

const IST = "Asia/Kolkata";

const groupDateKey = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const parseGroupDate = (key) => new Date(`${key}T12:00:00+05:30`);

const isGroupSunday = (key) => parseGroupDate(key).getDay() === 0;

const getGroupWorkingDates = (startDate, durationDays) => {
  if (!startDate) return [];

  const dates = [];
  const cursor = new Date(startDate);
  cursor.setHours(12, 0, 0, 0);

  while (dates.length < Number(durationDays || 0)) {
    const key = groupDateKey(cursor);

    if (!isGroupSunday(key)) dates.push(key);

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const maskEmail = (email) => {
  const [name, domain] = String(email || "").split("@");
  if (!name || !domain) return "—";

  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
};

const attendanceSummaryForIntern = (intern, records, workingDates) => {
  const bySlot = new Map(
    records.map((record) => [
      `${record.dateKey}-${record.sessionNumber}`,
      record,
    ]),
  );

  let attended = 0;
  let missed = 0;
  let pending = 0;
  let rejected = 0;

  const daily = workingDates.map((dateKey) => {
    let dayAttended = 0;

    for (const sessionNumber of [1, 2]) {
      const record = bySlot.get(`${dateKey}-${sessionNumber}`);

      if (
        record &&
        ["approved", "admin_corrected_present"].includes(record.status)
      ) {
        attended += 1;
        dayAttended += 1;
      } else if (
        record &&
        ["missed", "admin_corrected_absent", "rejected"].includes(record.status)
      ) {
        missed += 1;
        if (record.status === "rejected") rejected += 1;
      } else if (record?.status === "pending") {
        pending += 1;
      }
    }

    return {
      dateKey,
      attended: dayAttended,
      total: 2,
    };
  });

  const total = workingDates.length * 2;

  return {
    internId: intern.internId || "—",
    attended,
    missed,
    pending,
    rejected,
    total,
    attendancePercentage: total
      ? Number(((attended / total) * 100).toFixed(2))
      : 0,
    missedPercentage: total ? Number(((missed / total) * 100).toFixed(2)) : 0,
    daily,
  };
};

const safeGroup = (g) => {
  const x = g?.toObject ? g.toObject() : { ...g };
  delete x.inviteTokenHash;
  delete x.inviteTokenEncrypted;
  return x;
};
const csvEscape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
const buildCsv = (archives) => {
  const rows = [
    [
      "archiveVersion",
      "archiveDate",
      "groupId",
      "groupName",
      "recordType",
      "recordId",
      "recordJson",
    ],
  ];
  for (const archive of archives) {
    const snap = archive.snapshot || {};
    for (const [type, list] of Object.entries(snap)) {
      const items = Array.isArray(list) ? list : [list];
      for (const item of items) {
        rows.push([
          "1",
          archive.archivedAt?.toISOString?.() || "",
          archive.originalGroupId,
          archive.groupName,
          type,
          String(item?._id || item?.id || ""),
          JSON.stringify(item),
        ]);
      }
    }
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
};
router.post(
  "/invite/validate",
  asyncHandler(async (req, res) => {
    const token = String(req.body.inviteToken || "");
    if (token.length < 20)
      throw new HttpError(400, "A valid group invitation link is required.");
    const group = await InternshipGroup.findOne({
      inviteTokenHash: hash(token),
      inviteActive: true,
    }).select(
      "name description whatsappGroupCode plannedStartDate durationDays status",
    );
    if (!group || ["completed", "completion_pending"].includes(group.status))
      throw new HttpError(
        400,
        "This group invitation is invalid or no longer accepting registrations.",
      );
    res.json({
      group: {
        name: group.name,
        description: group.description,
        whatsappGroupCode: group.whatsappGroupCode,
        plannedStartDate: group.plannedStartDate,
        durationDays: group.durationDays,
        status: group.status,
      },
    });
  }),
);
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role === "admin") {
      const groups = await InternshipGroup.find()
        .sort({ createdAt: -1 })
        .lean();
      const ids = groups.map((g) => g._id);
      const counts = await User.aggregate([
        { $match: { role: "intern", group: { $in: ids } } },
        { $group: { _id: "$group", count: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
      return res.json({
        groups: groups.map((g) => ({
          ...safeGroup(g),
          internCount: countMap.get(String(g._id)) || 0,
        })),
      });
    }
    if (!req.user.group) return res.json({ groups: [] });
    return res.json({
      groups: await InternshipGroup.find({ _id: req.user.group }).lean(),
    });
  }),
);
router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    if (name.length < 3)
      throw new HttpError(400, "Group name must be at least 3 characters.");
    const whatsappGroupCode = String(req.body.whatsappGroupCode || "").trim();
    if (whatsappGroupCode.length < 2)
      throw new HttpError(400, "WhatsApp group code is required.");
    const durationDays = Number(req.body.durationDays ?? 28);
    if (
      !Number.isInteger(durationDays) ||
      durationDays < 1 ||
      durationDays > 365
    )
      throw new HttpError(
        400,
        "Internship duration must be between 1 and 365 days.",
      );
    const plannedStartDate = req.body.plannedStartDate
      ? new Date(req.body.plannedStartDate)
      : undefined;
    if (plannedStartDate && Number.isNaN(plannedStartDate.getTime()))
      throw new HttpError(400, "Choose a valid planned start date.");
    const inviteToken = crypto.randomBytes(32).toString("base64url");
    const group = await InternshipGroup.create({
      name,
      description: String(req.body.description || ""),
      whatsappGroupCode,
      durationDays,
      inviteTokenHash: hash(inviteToken),
      inviteTokenEncrypted: encrypt(inviteToken),
      createdBy: req.user._id,
      plannedStartDate,
    });
    await AuditLog.create({
      action: "group_created",
      group: group._id,
      actor: req.user._id,
      details: {
        name: group.name,
        durationDays: group.durationDays,
        plannedStartDate: group.plannedStartDate,
      },
    });
    res.status(201).json({ group: safeGroup(group), inviteToken });
  }),
);
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");
    const {
      name,
      description,
      whatsappGroupCode,
      plannedStartDate,
      actualStartDate,
      durationDays,
    } = req.body;
    if (name !== undefined) {
      const v = String(name).trim();
      if (v.length < 3)
        throw new HttpError(400, "Group name must be at least 3 characters.");
      group.name = v;
    }
    if (description !== undefined)
      group.description = String(description).slice(0, 2000);
    if (whatsappGroupCode !== undefined) {
      const v = String(whatsappGroupCode).trim();
      if (v.length < 2)
        throw new HttpError(
          400,
          "WhatsApp group code must be at least 2 characters.",
        );
      group.whatsappGroupCode = v;
    }
    if (durationDays !== undefined) {
      const v = Number(durationDays);
      if (!Number.isInteger(v) || v < 1 || v > 365)
        throw new HttpError(400, "Duration must be between 1 and 365 days.");
      group.durationDays = v;
    }
    if (plannedStartDate !== undefined && group.status === "registration") {
      const d = plannedStartDate ? new Date(plannedStartDate) : undefined;
      if (d && Number.isNaN(d.getTime()))
        throw new HttpError(400, "Choose a valid planned start date.");
      group.plannedStartDate = d;
    }
    if (actualStartDate !== undefined && group.status === "active") {
      const d = new Date(actualStartDate);
      if (Number.isNaN(d.getTime()))
        throw new HttpError(400, "Choose a valid actual start date.");
      group.actualStartDate = d;
    }
    // if (group.status === "active" && group.actualStartDate)
    //   group.actualEndDate = addDays(
    //     group.actualStartDate,
    //     Number(group.durationDays || 28),
    //   );
    if (group.status === "active" && group.actualStartDate) {
      const workingDates = getGroupWorkingDates(
        group.actualStartDate,
        group.durationDays,
      );

      group.actualEndDate = workingDates.length
        ? parseGroupDate(workingDates[workingDates.length - 1])
        : group.actualStartDate;
    }
    if (group.status === "completed") group.archivedAt = undefined;
    await group.save();
    await AuditLog.create({
      action: "group_updated",
      group: group._id,
      actor: req.user._id,
      details: {
        name: group.name,
        description: group.description,
        whatsappGroupCode: group.whatsappGroupCode,
        durationDays: group.durationDays,
        plannedStartDate: group.plannedStartDate,
        actualStartDate: group.actualStartDate,
      },
    });
    res.json({ group: safeGroup(group) });
  }),
);
router.get(
  "/:id/invite",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id).select(
      "+inviteTokenEncrypted",
    );
    if (!group) throw new HttpError(404, "Group not found.");
    if (group.status === "completed")
      throw new HttpError(
        409,
        "Completed groups cannot retrieve active registration links.",
      );
    let token = group.inviteTokenEncrypted
      ? decrypt(group.inviteTokenEncrypted)
      : null;
    if (!token) {
      token = crypto.randomBytes(32).toString("base64url");
      group.inviteTokenHash = hash(token);
      group.inviteTokenEncrypted = encrypt(token);
      group.inviteActive = true;
      await group.save();
    }
    if (!group.inviteActive)
      throw new HttpError(
        409,
        "This invitation has been disabled. Reset it to create a new link.",
      );
    res.json({ inviteToken: token, inviteActive: group.inviteActive });
  }),
);
router.post(
  "/:id/regenerate-invite",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id).select(
      "+inviteTokenEncrypted",
    );
    if (!group) throw new HttpError(404, "Group not found.");
    if (group.status === "completed")
      throw new HttpError(
        409,
        "Completed groups cannot create new registration invitations.",
      );
    const inviteToken = crypto.randomBytes(32).toString("base64url");
    group.inviteTokenHash = hash(inviteToken);
    group.inviteTokenEncrypted = encrypt(inviteToken);
    group.inviteActive = true;
    await group.save();
    res.json({ inviteToken, group: safeGroup(group) });
  }),
);
router.post(
  "/:id/start",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");
    if (group.status === "completed" || group.status === "completion_pending")
      throw new HttpError(
        409,
        "Completed or pending-completion groups cannot be started.",
      );
    const start = req.body.actualStartDate
      ? new Date(req.body.actualStartDate)
      : group.plannedStartDate || new Date();
    if (Number.isNaN(start.getTime()))
      throw new HttpError(400, "Choose a valid start date.");
    group.status = "active";
    group.actualStartDate = start;
    group.durationDays = Number(group.durationDays || 28);
    // group.actualEndDate = addDays(start, group.durationDays);
    const workingDates = getGroupWorkingDates(start, group.durationDays);

    group.actualEndDate = workingDates.length
      ? parseGroupDate(workingDates[workingDates.length - 1])
      : start;
    await group.save();
    await AuditLog.create({
      action: "group_started",
      group: group._id,
      actor: req.user._id,
      details: {
        actualStartDate: group.actualStartDate,
        actualEndDate: group.actualEndDate,
        durationDays: group.durationDays,
      },
    });
    res.json({ group: safeGroup(group) });
  }),
);
router.post(
  "/:id/request-completion",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");
    if (group.status !== "active")
      throw new HttpError(
        409,
        "Only an active group can be marked for completion.",
      );
    const admin = await User.findById(req.user._id).select("+passwordHash");
    if (
      !admin.passwordHash ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        admin.passwordHash,
      ))
    )
      throw new HttpError(401, "Your admin password is incorrect.");
    group.status = "completion_pending";
    group.completionApprovals = [
      { admin: req.user._id, approvedAt: new Date() },
    ];
    await group.save();
    res.json({
      message:
        "First approval recorded. A different authorized admin must approve.",
      group: safeGroup(group),
    });
  }),
);
router.post(
  "/:id/approve-completion",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");
    if (group.status !== "completion_pending")
      throw new HttpError(
        409,
        "This group is not awaiting completion approval.",
      );
    if (
      group.completionApprovals.some(
        (a) => String(a.admin) === String(req.user._id),
      )
    )
      throw new HttpError(
        409,
        "A different authorized admin must provide the second approval.",
      );
    const admin = await User.findById(req.user._id).select("+passwordHash");
    if (
      !admin.passwordHash ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        admin.passwordHash,
      ))
    )
      throw new HttpError(401, "Your admin password is incorrect.");
    group.completionApprovals.push({
      admin: req.user._id,
      approvedAt: new Date(),
    });
    group.status = "completed";
    group.completedAt = new Date();
    group.inviteActive = false;
    await group.save();
    await AuditLog.create({
      action: "group_completed",
      group: group._id,
      actor: req.user._id,
      details: {
        completedAt: group.completedAt,
        approvalCount: group.completionApprovals.length,
      },
    });
    res.json({
      message:
        "Group completed. Attendance is closed and certification status is unlocked.",
      group: safeGroup(group),
    });
  }),
);
// router.get(
//   "/:id/interns",
//   requireAuth,
//   requireAdmin,
//   asyncHandler(async (req, res) => {
//     const group = await InternshipGroup.findById(req.params.id);
//     if (!group) throw new HttpError(404, "Group not found.");
//     const interns = await User.find({ group: group._id, role: "intern" })
//       .select("-passwordHash -googleSub")
//       .sort({ name: 1 })
//       .lean();
//     res.json({ group: safeGroup(group), interns });
//   }),
// );

router.get(
  "/:id/interns",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");

    const interns = await User.find({
      group: group._id,
      role: "intern",
    })
      .select("-passwordHash -googleSub")
      .sort({ name: 1 })
      .lean();

    const startDate = group.actualStartDate || group.plannedStartDate;
    const workingDates = getGroupWorkingDates(startDate, group.durationDays);

    const attendance = await Attendance.find({
      group: group._id,
      intern: { $in: interns.map((intern) => intern._id) },
    }).lean();

    const attendanceByIntern = new Map();

    for (const record of attendance) {
      const key = String(record.intern);
      if (!attendanceByIntern.has(key)) {
        attendanceByIntern.set(key, []);
      }
      attendanceByIntern.get(key).push(record);
    }

    const enrichedInterns = interns.map((intern) => ({
      ...intern,
      attendanceSummary: attendanceSummaryForIntern(
        intern,
        attendanceByIntern.get(String(intern._id)) || [],
        workingDates,
      ),
    }));

    res.json({
      group: safeGroup(group),
      interns: enrichedInterns,
      attendancePolicy: {
        mandatoryPercentage: 75,
        totalWorkingDays: workingDates.length,
        totalScheduledSessions: workingDates.length * 2,
        workingDates,
      },
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: generate LOR selection record PDF                                  */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/lor/generate",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);

    if (!group) {
      throw new HttpError(404, "Group not found.");
    }

    const result = await generateLorPdf({
      ...req.body,
      groupName: String(req.body.groupName || group.name).trim(),
    });

    const safeGroupName = result.groupName
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);

    const filename = `LOR-List-${safeGroupName || "VELoop"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", result.pdfBytes.length);

    res.send(Buffer.from(result.pdfBytes));
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: generate stipend list PDF                                            */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/stipend/generate",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);

    if (!group) {
      throw new HttpError(404, "Group not found.");
    }

    const source = String(req.body.source || "manual");
    let interns = [];

    if (source === "group") {
      const selectedInternIds = Array.isArray(req.body.internIds)
        ? req.body.internIds.map((id) => String(id).trim()).filter(Boolean)
        : [];

      if (selectedInternIds.length === 0) {
        throw new HttpError(400, "Select at least one intern from the group.");
      }

      const uniqueIds = new Set(
        selectedInternIds.map((id) => id.toLowerCase()),
      );

      if (uniqueIds.size !== selectedInternIds.length) {
        throw new HttpError(400, "Duplicate intern IDs are not allowed.");
      }

      // const groupInterns = await User.find({
      //   group: group._id,
      //   role: "intern",
      //   internId: { $in: selectedInternIds },
      // }).select("name internId email domain");
      const groupInterns = await User.find({
        group: group._id,
        role: "intern",
        offerSentStatus: "manual_admin_addition",
        internId: { $in: selectedInternIds },
      }).select("name internId email domain offerSentStatus");

      if (groupInterns.length !== selectedInternIds.length) {
        throw new HttpError(
          400,
          "One or more selected interns do not belong to this group.",
        );
      }

      interns = groupInterns.map((intern) => ({
        name: intern.name,
        internId: intern.internId,
        email: intern.email,
        domain: intern.domain,
      }));
    } else if (source === "manual") {
      interns = Array.isArray(req.body.interns) ? req.body.interns : [];
    } else {
      throw new HttpError(400, "Invalid intern selection method.");
    }

    const result = await generateStipendPdf({
      ...req.body,
      groupName: String(req.body.groupName || group.name).trim(),
      interns,
    });

    const filename = createStipendPdfFilename(
      result.groupName,
      result.template,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", result.pdfBytes.length);
    res.setHeader("Cache-Control", "no-store");

    res.send(Buffer.from(result.pdfBytes));
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: manually add an intern to a group                                   */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/interns",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);

    if (!group) throw new HttpError(404, "Group not found.");

    if (["completed", "completion_pending"].includes(group.status)) {
      throw new HttpError(
        409,
        "Interns cannot be added to a completed or completion-pending group.",
      );
    }

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const internId = String(req.body.internId || "")
      .trim()
      .toUpperCase();
    const password = String(req.body.password || "");
    const domain = String(req.body.domain || "").trim();
    const whatsappNumber = String(req.body.whatsappNumber || "").trim();
    const gender = String(req.body.gender || "").trim();

    if (name.length < 2) {
      throw new HttpError(400, "Enter the intern's full name.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Enter a valid email address.");
    }

    if (!/^[A-Z0-9_-]{5,30}$/.test(internId)) {
      throw new HttpError(
        400,
        "Intern ID must be 5–30 characters and contain only letters, numbers, _ or -.",
      );
    }

    if (password.length < 8) {
      throw new HttpError(400, "Password must contain at least 8 characters.");
    }

    if (!domain) {
      throw new HttpError(400, "Select or enter an internship domain.");
    }

    if (
      gender &&
      !["Female", "Male", "Non-binary", "Prefer not to say"].includes(gender)
    ) {
      throw new HttpError(400, "Choose a valid gender option.");
    }

    const [existingEmail, existingId] = await Promise.all([
      User.findOne({ email }).select("_id"),
      User.findOne({ internId }).select("_id"),
    ]);

    if (existingEmail) {
      throw new HttpError(409, "An account with this email already exists.");
    }

    if (existingId) {
      throw new HttpError(409, "This intern ID is already in use.");
    }

    const bcryptHash = await bcrypt.hash(password, 12);
    const startDate = req.body.internshipStartDate
      ? new Date(req.body.internshipStartDate)
      : group.actualStartDate || group.plannedStartDate || new Date();

    if (Number.isNaN(startDate.getTime())) {
      throw new HttpError(400, "Choose a valid internship start date.");
    }

    const intern = await User.create({
      role: "intern",
      name,
      email,
      internId,
      passwordHash: bcryptHash,
      domain,
      whatsappNumber,
      gender: gender || undefined,
      group: group._id,
      whatsappGroupName: group.name,
      whatsappGroupCode: group.whatsappGroupCode,
      internshipStartDate: startDate,
      registrationComplete: true,
      status: "active",
      termsAccepted: Boolean(req.body.termsAccepted),
      termsAcceptedAt: req.body.termsAccepted ? new Date() : null,
      offerSent: false,
      offerSentStatus: "manual_admin_addition",
    });

    await AuditLog.create({
      action: "intern_manually_added",
      group: group._id,
      intern: intern._id,
      actor: req.user._id,
      details: {
        internId: intern.internId,
        email: intern.email,
        domain: intern.domain,
        source: "admin_manual_addition",
        offerLetterVerification: "not_required",
      },
    });

    const safeIntern = await User.findById(intern._id)
      .select("-passwordHash -googleSub")
      .lean();

    res.status(201).json({
      message: "Intern added to the group successfully.",
      intern: safeIntern,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: terminate an intern's group access                                  */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/interns/:internId/terminate",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");

    const intern = await User.findOne({
      _id: req.params.internId,
      group: group._id,
      role: "intern",
    });

    if (!intern) throw new HttpError(404, "Intern not found in this group.");

    if (intern.status === "terminated" || intern.termination?.isTerminated) {
      throw new HttpError(409, "This intern is already terminated.");
    }

    const reason = String(req.body.reason || "").trim();

    if (reason.length < 5) {
      throw new HttpError(
        400,
        "Provide a termination reason of at least 5 characters.",
      );
    }

    intern.status = "terminated";
    intern.termination = {
      ...(intern.termination?.toObject?.() || intern.termination || {}),
      isTerminated: true,
      reason: reason.slice(0, 1000),
      terminatedAt: new Date(),
      terminatedBy: req.user._id,
      groupAtTermination: group._id,
      reinstatedAt: null,
      reinstatedBy: null,
      reinstatementNote: "",
    };

    await intern.save();

    // Remove unconsumed attendance sessions so an old session cannot be used.
    await AttendanceSession.deleteMany({
      intern: intern._id,
      group: group._id,
      consumedAt: null,
    });

    await AuditLog.create({
      action: "intern_terminated",
      group: group._id,
      intern: intern._id,
      actor: req.user._id,
      details: {
        reason,
        terminatedAt: intern.termination.terminatedAt,
      },
    });

    res.json({
      message: `${intern.name}'s internship access has been revoked.`,
      intern: {
        _id: intern._id,
        internId: intern.internId,
        status: intern.status,
        termination: intern.termination,
      },
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: reinstate a terminated intern                                       */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/interns/:internId/reinstate",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");

    const intern = await User.findOne({
      _id: req.params.internId,
      role: "intern",
      "termination.groupAtTermination": group._id,
    });

    if (!intern || !intern.termination?.isTerminated) {
      throw new HttpError(
        404,
        "No active termination was found for this intern.",
      );
    }

    if (group.status === "completed") {
      if (!group.completedAt) {
        throw new HttpError(
          409,
          "The group completion timestamp is missing. Contact technical support.",
        );
      }

      const deadline = new Date(group.completedAt);
      deadline.setDate(deadline.getDate() + 7);

      if (new Date() > deadline) {
        throw new HttpError(
          409,
          "The seven-day reinstatement window has closed. This termination can no longer be revoked.",
        );
      }
    }

    if (["completion_pending"].includes(group.status)) {
      throw new HttpError(
        409,
        "Reinstatement is unavailable while group completion is awaiting approval.",
      );
    }

    const note = String(req.body.note || "").trim();

    intern.status = "active";
    intern.termination.isTerminated = false;
    intern.termination.reinstatedAt = new Date();
    intern.termination.reinstatedBy = req.user._id;
    intern.termination.reinstatementNote = note.slice(0, 1000);

    await intern.save();

    await AuditLog.create({
      action: "intern_reinstated",
      group: group._id,
      intern: intern._id,
      actor: req.user._id,
      details: {
        note,
        reinstatedAt: intern.termination.reinstatedAt,
      },
    });

    res.json({
      message: `${intern.name}'s internship access has been restored.`,
      intern: {
        _id: intern._id,
        internId: intern.internId,
        status: intern.status,
        termination: intern.termination,
      },
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: export group attendance workbook                                    */
/* -------------------------------------------------------------------------- */

router.get(
  "/:id/attendance-export",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");

    const interns = await User.find({
      group: group._id,
      role: "intern",
    })
      .select("name email internId domain status")
      .sort({ name: 1 })
      .lean();

    const workingDates = getGroupWorkingDates(
      group.actualStartDate || group.plannedStartDate,
      group.durationDays,
    );

    const attendance = await Attendance.find({
      group: group._id,
      intern: { $in: interns.map((intern) => intern._id) },
    }).lean();

    const attendanceByIntern = new Map();

    for (const record of attendance) {
      const key = String(record.intern);
      if (!attendanceByIntern.has(key)) {
        attendanceByIntern.set(key, []);
      }
      attendanceByIntern.get(key).push(record);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "VELOop Rewards";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Group Attendance", {
      views: [{ state: "frozen", ySplit: 1, xSplit: 5 }],
    });

    const headers = [
      "Intern Name",
      "Intern ID",
      "Masked Email",
      "Attendance %",
      "Missed %",
      ...workingDates.map((key) => key.split("-").reverse().join("/")),
    ];

    sheet.addRow(headers);

    const header = sheet.getRow(1);
    header.height = 32;
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF183D31" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    for (const intern of interns) {
      const summary = attendanceSummaryForIntern(
        intern,
        attendanceByIntern.get(String(intern._id)) || [],
        workingDates,
      );

      const row = sheet.addRow([
        intern.name || "—",
        intern.internId || "—",
        maskEmail(intern.email),
        `${summary.attendancePercentage}%`,
        `${summary.missedPercentage}%`,
        // ...summary.daily.map((day) => `${day.attended}/2`),
        ...summary.daily.map((day) => ({
          richText: [
            {
              text: String(day.attended),
              font: { bold: true, color: { argb: "FFDC3545" } },
            },
            {
              text: "/2",
              font: { bold: true, color: { argb: "FF2563EB" } },
            },
          ],
        })),
      ]);

      row.height = 24;
      row.alignment = { vertical: "middle", horizontal: "center" };

      row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
      row.getCell(4).font = { bold: true, color: { argb: "FF16834A" } };
      row.getCell(5).font = { bold: true, color: { argb: "FFDC3545" } };

      // for (let index = 6; index <= row.cellCount; index += 1) {
      //   const cell = row.getCell(index);
      //   const attended = Number(String(cell.value).split("/")[0] || 0);

      //   cell.font = {
      //     bold: true,
      //     color: { argb: attended > 0 ? "FFDC3545" : "FF64748B" },
      //   };
      //   cell.fill = {
      //     type: "pattern",
      //     pattern: "solid",
      //     fgColor: { argb: attended > 0 ? "FFFFF1F2" : "FFF1F5F9" },
      //   };
      // }
      for (let index = 6; index <= row.cellCount; index += 1) {
        const cell = row.getCell(index);
        const attended = summary.daily[index - 6]?.attended || 0;

        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: attended > 0 ? "FFFFF1F2" : "FFF1F5F9",
          },
        };
      }
    }

    sheet.columns = [
      { width: 26 },
      { width: 20 },
      { width: 30 },
      { width: 17 },
      { width: 17 },
      ...workingDates.map(() => ({ width: 14 })),
    ];

    sheet.addRow([]);
    const policyRow = sheet.addRow([
      "MANDATORY ATTENDANCE POLICY",
      "Minimum 75% attendance is required.",
    ]);
    policyRow.getCell(1).font = { bold: true, color: { argb: "FF183D31" } };
    policyRow.getCell(2).font = { bold: true, color: { argb: "FFDC3545" } };

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="VELOop-${group.name.replace(/[^a-z0-9-_]/gi, "-")}-Attendance-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin: export attendance for a single day (today / yesterday)              */
/* -------------------------------------------------------------------------- */

const exportSingleDayAttendance = async (req, res, dayOffset) => {
  const group = await InternshipGroup.findById(req.params.id);

  if (!group) {
    throw new HttpError(404, "Group not found.");
  }

  // Get the current date in India (IST).
  const todayKey = groupDateKey(new Date());
  const targetDate = parseGroupDate(todayKey);

  // Yesterday = one calendar day before today in IST.
  targetDate.setDate(targetDate.getDate() - dayOffset);

  const dateKey = groupDateKey(targetDate);
  const displayDate = dateKey.split("-").reverse().join("/");

  const interns = await User.find({
    group: group._id,
    role: "intern",
  })
    .select("name email internId domain status")
    .sort({ name: 1 })
    .lean();

  const internIds = interns.map((intern) => intern._id);

  // Only fetch attendance records for the requested date.
  const attendance = await Attendance.find({
    group: group._id,
    intern: { $in: internIds },
    dateKey,
  }).lean();

  const attendanceByIntern = new Map();

  for (const record of attendance) {
    const key = String(record.intern);

    if (!attendanceByIntern.has(key)) {
      attendanceByIntern.set(key, []);
    }

    attendanceByIntern.get(key).push(record);
  }

  // Check whether this date belongs to the group's scheduled duration.
  // Sundays and dates outside the internship duration are not scheduled.
  const workingDates = getGroupWorkingDates(
    group.actualStartDate || group.plannedStartDate,
    group.durationDays,
  );

  const isScheduledDay = workingDates.includes(dateKey);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VELOop Rewards";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Daily Attendance", {
    views: [{ state: "frozen", ySplit: 5, xSplit: 3 }],
  });

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "VELOOP REWARDS — DAILY ATTENDANCE";
  sheet.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFFFF" },
  };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF183D31" },
  };
  sheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  sheet.getRow(1).height = 32;

  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = `Group: ${group.name}`;

  sheet.mergeCells("A3:H3");
  sheet.getCell("A3").value = `Attendance Date: ${displayDate} (IST)`;

  sheet.mergeCells("A4:H4");
  sheet.getCell("A4").value = isScheduledDay
    ? "Scheduled Working Day"
    : "NOT SCHEDULED — This date is outside the group's working days";

  sheet.getCell("A4").font = {
    bold: true,
    color: {
      argb: isScheduledDay ? "FF16834A" : "FFDC3545",
    },
  };

  const headers = [
    "Intern Name",
    "Intern ID",
    "Masked Email",
    "Domain",
    "First Session",
    "Re-attendance",
    "Today's Status",
    "Intern Status",
  ];

  sheet.addRow(headers);

  const header = sheet.getRow(5);
  header.height = 30;

  header.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF183D31" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });

  const getSessionStatus = (record) => {
    if (!isScheduledDay) return "Not Scheduled";
    if (!record) return "Not Marked";

    if (["approved", "admin_corrected_present"].includes(record.status)) {
      return "Present";
    }

    if (record.status === "pending") return "Pending";

    if (
      ["rejected", "missed", "admin_corrected_absent"].includes(record.status)
    ) {
      return "Absent";
    }

    return "Not Recorded";
  };

  let fullPresent = 0;
  let partialPresent = 0;
  let absentCount = 0;
  let pendingCount = 0;
  let notMarkedCount = 0;
  let notScheduledCount = 0;

  for (const intern of interns) {
    const records = attendanceByIntern.get(String(intern._id)) || [];

    const firstSessionRecord = records.find(
      (record) => Number(record.sessionNumber) === 1,
    );

    const secondSessionRecord = records.find(
      (record) => Number(record.sessionNumber) === 2,
    );

    const firstStatus = getSessionStatus(firstSessionRecord);
    const secondStatus = getSessionStatus(secondSessionRecord);

    let dailyStatus = "Not Marked";

    if (!isScheduledDay) {
      dailyStatus = "Not Scheduled";
      notScheduledCount += 1;
    } else if (firstStatus === "Pending" || secondStatus === "Pending") {
      dailyStatus = "Pending Review";
      pendingCount += 1;
    } else if (firstStatus === "Present" && secondStatus === "Present") {
      dailyStatus = "Full Present";
      fullPresent += 1;
    } else if (firstStatus === "Present" || secondStatus === "Present") {
      dailyStatus = "Partial Present";
      partialPresent += 1;
    } else if (firstStatus === "Absent" || secondStatus === "Absent") {
      dailyStatus = "Absent";
      absentCount += 1;
    } else {
      dailyStatus = "Not Marked";
      notMarkedCount += 1;
    }

    const row = sheet.addRow([
      intern.name || "—",
      intern.internId || "—",
      maskEmail(intern.email),
      intern.domain || "—",
      firstStatus,
      secondStatus,
      dailyStatus,
      intern.status || "active",
    ]);

    row.height = 24;
    row.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    row.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    const statusCell = row.getCell(7);

    const statusColors = {
      "Full Present": "FF16834A",
      "Partial Present": "FFD97706",
      Absent: "FFDC3545",
      "Pending Review": "FF2563EB",
      "Not Marked": "FF64748B",
      "Not Scheduled": "FF64748B",
    };

    statusCell.font = {
      bold: true,
      color: {
        argb: statusColors[dailyStatus] || "FF64748B",
      },
    };
  }

  sheet.columns = [
    { width: 26 },
    { width: 20 },
    { width: 30 },
    { width: 22 },
    { width: 20 },
    { width: 20 },
    { width: 22 },
    { width: 18 },
  ];

  // Summary section
  sheet.addRow([]);
  sheet.addRow(["ATTENDANCE SUMMARY"]);
  sheet.addRow(["Total Interns", interns.length]);
  sheet.addRow(["Full Present", fullPresent]);
  sheet.addRow(["Partial Present", partialPresent]);
  sheet.addRow(["Absent", absentCount]);
  sheet.addRow(["Pending Review", pendingCount]);
  sheet.addRow(["Not Marked", notMarkedCount]);
  sheet.addRow(["Not Scheduled", notScheduledCount]);

  const summaryTitle = sheet.getRow(sheet.rowCount - 7);
  summaryTitle.getCell(1).font = {
    bold: true,
    color: { argb: "FF183D31" },
  };

  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: headers.length },
  };

  const safeGroupName = group.name.replace(/[^a-z0-9-_]/gi, "-");
  const dayLabel = dayOffset === 0 ? "Today" : "Yesterday";

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="VELOop-${safeGroupName}-${dayLabel}-Attendance-${dateKey}.xlsx"`,
  );

  await workbook.xlsx.write(res);
  res.end();
};

/* Export today's attendance */
router.get(
  "/:id/attendance-export/today",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await exportSingleDayAttendance(req, res, 0);
  }),
);

/* Export yesterday's attendance */
router.get(
  "/:id/attendance-export/yesterday",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await exportSingleDayAttendance(req, res, 1);
  }),
);

router.post(
  "/:id/transfer-intern",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { internId, targetGroupId } = req.body;
    const lookup = String(internId || "")
      .trim()
      .toUpperCase();
    const criteria = mongoose.Types.ObjectId.isValid(String(internId || ""))
      ? { _id: internId, role: "intern" }
      : { internId: lookup, role: "intern" };
    const intern = await User.findOne(criteria);
    if (!intern) throw new HttpError(404, "Intern not found.");
    const target = await InternshipGroup.findById(targetGroupId);
    if (!target || target.status === "completed")
      throw new HttpError(
        400,
        "Choose a valid, non-completed destination group.",
      );
    const sourceGroup = intern.group;
    const internSnapshot = {
      _id: intern._id,
      internId: intern.internId,
      name: intern.name,
      email: intern.email,
      domain: intern.domain,
      whatsappNumber: intern.whatsappNumber,
      sourceGroup,
    };
    intern.group = target._id;
    intern.whatsappGroupName = target.name;
    intern.whatsappGroupCode = target.whatsappGroupCode;
    await intern.save();
    await AttendanceSession.deleteMany({
      intern: intern._id,
      consumedAt: null,
    });
    if (sourceGroup)
      await Attendance.updateMany(
        { intern: intern._id, group: sourceGroup, status: "pending" },
        {
          $set: {
            status: "rejected",
            rejectedAt: new Date(),
            rejectedBy: req.user._id,
            rejectionReason: "Intern transferred to another group.",
          },
          $push: {
            approvalHistory: {
              action: "rejected",
              actor: req.user._id,
              at: new Date(),
              note: "Intern transferred to another group.",
            },
          },
        },
      );
    await AuditLog.create({
      action: "intern_transferred",
      group: sourceGroup || undefined,
      relatedGroup: target._id,
      intern: intern._id,
      actor: req.user._id,
      details: {
        fromGroup: sourceGroup ? String(sourceGroup) : null,
        toGroup: String(target._id),
        internSnapshot,
        reason: String(req.body.reason || "Admin transfer").slice(0, 500),
      },
    });
    res.json({
      message: `${intern.name} transferred to ${target.name}.`,
      intern: {
        id: intern._id,
        internId: intern.internId,
        name: intern.name,
        group: target._id,
      },
    });
  }),
);
router.post(
  "/:id/archive",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);
    if (!group) throw new HttpError(404, "Group not found.");
    if (group.status !== "completed")
      throw new HttpError(409, "Only completed groups can be archived.");
    const groupId = String(group._id);
    await group.populate("completionApprovals.admin", "name email");
    const [
      interns,
      attendance,
      sessions,
      promoCodes,
      notifications,
      auditLogs,
    ] = await Promise.all([
      User.find({ group: group._id, role: "intern" })
        .select("-passwordHash -googleSub")
        .lean(),
      Attendance.find({ group: group._id })
        .populate("intern", "name email internId domain whatsappNumber")
        .populate("approvedBy rejectedBy correctedBy", "name email")
        .lean(),
      AttendanceSession.find({ group: group._id }).lean(),
      PromoCode.find({ group: group._id }).lean(),
      Notification.find({
        $or: [{ targetGroup: group._id }, { targetGroup: null }],
      }).lean(),
      AuditLog.find({
        $or: [{ group: group._id }, { relatedGroup: group._id }],
      })
        .populate("actor", "name email")
        .lean(),
    ]);
    const relatedIds = new Set(interns.map((x) => String(x._id)));
    for (const row of attendance) {
      if (row.intern?._id) relatedIds.add(String(row.intern._id));
    }
    for (const log of auditLogs) {
      if (log.intern) relatedIds.add(String(log.intern));
      if (log.details?.internSnapshot?._id)
        relatedIds.add(String(log.details.internSnapshot._id));
    }
    const internIds = [...relatedIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    const walletTransactions = await WalletTransaction.find({
      $or: [
        { group: group._id },
        { group: { $exists: false }, intern: { $in: internIds } },
      ],
    })
      .populate("createdBy", "name email")
      .lean();
    const snapshot = {
      group: safeGroup(group),
      interns,
      attendance,
      sessions,
      walletTransactions,
      promoCodes,
      notifications,
      auditLogs,
    };
    await GroupArchive.findOneAndUpdate(
      { originalGroupId: groupId },
      {
        $set: {
          groupName: group.name,
          archivedAt: new Date(),
          archivedBy: req.user._id,
          snapshot,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    group.archivedAt = new Date();
    await group.save();
    const archives = await GroupArchive.find().sort({ archivedAt: 1 }).lean();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="VELoop-Complete-Archive-Latest-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send("\uFEFF" + buildCsv(archives));
  }),
);
// router.delete(
//   "/:id",
//   requireAuth,
//   requireAdmin,
//   asyncHandler(async (req, res) => {
//     const group = await InternshipGroup.findById(req.params.id);
//     if (!group) throw new HttpError(404, "Group not found.");
//     if (group.status !== "completed")
//       throw new HttpError(409, "Only completed groups can be deleted.");
//     const archived = await GroupArchive.findOne({
//       originalGroupId: String(group._id),
//     });
//     if (!archived || !group.archivedAt)
//       throw new HttpError(
//         409,
//         "Export and archive the latest group details before deleting it. If you edited the group after archiving, update the archive first.",
//       );
//     const session = await mongoose.startSession();
//     try {
//       await session.withTransaction(async () => {
//         const users = await User.find({ group: group._id, role: "intern" })
//           .select("_id")
//           .session(session);
//         const ids = users.map((u) => u._id);
//         await Attendance.deleteMany({ group: group._id }, { session });
//         await AttendanceSession.deleteMany({ group: group._id }, { session });
//         await WalletTransaction.deleteMany(
//           {
//             $or: [
//               { group: group._id },
//               { group: { $exists: false }, intern: { $in: ids } },
//             ],
//           },
//           { session },
//         );
//         await PromoCode.deleteMany({ group: group._id }, { session });
//         await Notification.deleteMany({ targetGroup: group._id }, { session });
//         await AuditLog.deleteMany(
//           { $or: [{ group: group._id }, { relatedGroup: group._id }] },
//           { session },
//         );
//         await User.deleteMany({ _id: { $in: ids } }, { session });
//         await InternshipGroup.deleteOne({ _id: group._id }, { session });
//       });
//     } finally {
//       await session.endSession();
//     }
//     res.json({
//       message:
//         "Archived group and its live records deleted. The cumulative archive remains available.",
//     });
//   }),
// );

// router.delete(
//   "/:id",
//   requireAuth,
//   requireAdmin,
//   asyncHandler(async (req, res) => {
//     const group = await InternshipGroup.findById(req.params.id);

//     if (!group) {
//       throw new HttpError(404, "Group not found.");
//     }

//     const isCompleted = group.status === "completed";

//     // Completed groups must have an up-to-date archive.
//     if (isCompleted) {
//       const archived = await GroupArchive.findOne({
//         originalGroupId: String(group._id),
//       });

//       if (!archived || !group.archivedAt) {
//         throw new HttpError(
//           409,
//           "Export and archive the latest group details before deleting it.",
//         );
//       }
//     } else {
//       // Uncompleted groups can only be deleted when they have zero interns.
//       const internCount = await User.countDocuments({
//         group: group._id,
//         role: "intern",
//       });

//       if (internCount > 0) {
//         throw new HttpError(
//           409,
//           `This group has ${internCount} intern(s). Transfer or remove all interns before deleting it.`,
//         );
//       }
//     }

//     const session = await mongoose.startSession();

//     try {
//       await session.withTransaction(async () => {
//         const users = await User.find({
//           group: group._id,
//           role: "intern",
//         })
//           .select("_id")
//           .session(session);

//         const ids = users.map((u) => u._id);

//         await Attendance.deleteMany({ group: group._id }, { session });

//         await AttendanceSession.deleteMany({ group: group._id }, { session });

//         await WalletTransaction.deleteMany(
//           {
//             $or: [
//               { group: group._id },
//               {
//                 group: { $exists: false },
//                 intern: { $in: ids },
//               },
//             ],
//           },
//           { session },
//         );

//         await PromoCode.deleteMany({ group: group._id }, { session });

//         await Notification.deleteMany({ targetGroup: group._id }, { session });

//         await AuditLog.deleteMany(
//           {
//             $or: [{ group: group._id }, { relatedGroup: group._id }],
//           },
//           { session },
//         );

//         await User.deleteMany({ _id: { $in: ids } }, { session });

//         await InternshipGroup.deleteOne({ _id: group._id }, { session });
//       });
//     } finally {
//       await session.endSession();
//     }

//     res.json({
//       message: isCompleted
//         ? "Archived group and its live records deleted. The cumulative archive remains available."
//         : "Empty internship group and its associated records deleted successfully.",
//     });
//   }),
// );

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const group = await InternshipGroup.findById(req.params.id);

    if (!group) {
      throw new HttpError(404, "Group not found.");
    }

    // Completed groups must already have an archive.
    if (group.status === "completed") {
      const archived = await GroupArchive.findOne({
        originalGroupId: String(group._id),
      });

      if (!archived || !group.archivedAt) {
        throw new HttpError(
          409,
          "Export and archive the latest group details before deleting it.",
        );
      }
    } else {
      // Only empty, unfinished groups can be deleted.
      const internCount = await User.countDocuments({
        group: group._id,
        role: "intern",
      });

      if (internCount > 0) {
        throw new HttpError(
          409,
          `This group has ${internCount} intern(s). Transfer or remove all interns before deleting it.`,
        );
      }
    }

    // Verify the current administrator's password.
    const admin = await User.findById(req.user._id).select("+passwordHash");

    if (
      !admin ||
      !admin.passwordHash ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        admin.passwordHash,
      ))
    ) {
      throw new HttpError(401, "Your admin password is incorrect.");
    }

    // Find the first approval, if one exists.
    let firstApproval = await AuditLog.findOne({
      group: group._id,
      action: "group_deletion_approval_pending",
    }).sort({ createdAt: -1 });

    // Expire first approvals after 24 hours.
    if (
      firstApproval &&
      Date.now() - new Date(firstApproval.createdAt).getTime() >
        24 * 60 * 60 * 1000
    ) {
      await AuditLog.deleteMany({
        group: group._id,
        action: "group_deletion_approval_pending",
      });

      firstApproval = null;
    }

    // FIRST ADMIN APPROVAL
    if (!firstApproval) {
      await AuditLog.create({
        action: "group_deletion_approval_pending",
        group: group._id,
        actor: req.user._id,
        details: {
          groupName: group.name,
          approvalStep: 1,
          requestedAt: new Date(),
        },
      });

      return res.status(202).json({
        approvalRequired: true,
        message:
          "First approval recorded. A different administrator must approve deletion.",
      });
    }

    // SECOND APPROVAL MUST COME FROM A DIFFERENT ADMIN.
    if (String(firstApproval.actor) === String(req.user._id)) {
      throw new HttpError(
        409,
        "A different administrator must provide the second approval.",
      );
    }

    const firstAdminId = firstApproval.actor;

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Recheck the group and intern count inside the transaction.
        const currentGroup = await InternshipGroup.findById(group._id).session(
          session,
        );

        if (!currentGroup) {
          throw new HttpError(404, "Group not found.");
        }

        if (currentGroup.status !== "completed") {
          const count = await User.countDocuments({
            group: currentGroup._id,
            role: "intern",
          }).session(session);

          if (count > 0) {
            throw new HttpError(
              409,
              "Interns have been added to this group. Deletion is blocked.",
            );
          }
        }

        const users = await User.find({
          group: currentGroup._id,
          role: "intern",
        })
          .select("_id")
          .session(session);

        const ids = users.map((u) => u._id);

        await Attendance.deleteMany({ group: currentGroup._id }, { session });

        await AttendanceSession.deleteMany(
          { group: currentGroup._id },
          { session },
        );

        await WalletTransaction.deleteMany(
          {
            $or: [
              { group: currentGroup._id },
              {
                group: { $exists: false },
                intern: { $in: ids },
              },
            ],
          },
          { session },
        );

        await PromoCode.deleteMany({ group: currentGroup._id }, { session });

        await Notification.deleteMany(
          { targetGroup: currentGroup._id },
          { session },
        );

        await AuditLog.deleteMany(
          {
            $or: [
              { group: currentGroup._id },
              { relatedGroup: currentGroup._id },
            ],
          },
          { session },
        );

        await User.deleteMany({ _id: { $in: ids } }, { session });

        await InternshipGroup.deleteOne({ _id: currentGroup._id }, { session });
      });
    } finally {
      await session.endSession();
    }

    // Preserve a final record of who approved the deletion.
    await AuditLog.create({
      action: "group_deleted",
      actor: req.user._id,
      details: {
        groupId: String(group._id),
        groupName: group.name,
        firstApprovedBy: String(firstAdminId),
        secondApprovedBy: String(req.user._id),
        deletedAt: new Date(),
      },
    });

    res.json({
      approvalRequired: false,
      message:
        "Group deleted after approval from two different administrators.",
    });
  }),
);

router.get(
  "/admin/archive/download",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const archives = await GroupArchive.find().sort({ archivedAt: 1 }).lean();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="VELoop-Complete-Archive-Latest-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send("\uFEFF" + buildCsv(archives));
  }),
);
export default router;
