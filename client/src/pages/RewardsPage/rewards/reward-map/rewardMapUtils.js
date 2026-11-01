/* =========================================================
   REWARD MAP UTILITIES
   VELoop Rewards — InternCash
========================================================= */

/* ---------------------------------------------------------
   GENERAL HELPERS
--------------------------------------------------------- */

export const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

export function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    value =
      value.$numberDecimal ?? value.$numberInt ?? value.value ?? value.amount;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/* ---------------------------------------------------------
   DATE HELPERS
--------------------------------------------------------- */

export function getDate(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  return firstDefined(
    record.date,
    record.dateKey,
    record.attendanceDate,
    record.sessionDate,
    record.createdAt,
    record.submittedAt,
    record.updatedAt,
    record.timestamp,
    null,
  );
}

function parseDate(value) {
  if (!value) return null;

  let date;

  if (typeof value === "number") {
    // Support Unix timestamps in seconds or milliseconds.
    date = new Date(value < 1000000000000 ? value * 1000 : value);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseDate(value);

  if (!date) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* ---------------------------------------------------------
   INTERN CASH FORMATTER
--------------------------------------------------------- */

export function formatIC(value, currency = "IC") {
  const amount = toNumber(value);

  if (amount === null) {
    return "Reward details unavailable";
  }

  return `${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/* ---------------------------------------------------------
   REWARD AMOUNT
--------------------------------------------------------- */

/**
 * Returns null when an amount has not been supplied.
 *
 * IMPORTANT:
 * null = unknown / unavailable
 * 0    = actual zero amount
 *
 * This prevents missing reward amounts from being displayed
 * as fabricated 0 IC rewards.
 */
export function getRewardAmount(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const candidates = [
    record.rewardAmount,
    record.amount,
    record.coins,
    record.reward?.amount,
    record.reward?.coins,
    record.walletReward?.amount,
    record.transaction?.amount,
  ];

  for (const value of candidates) {
    const amount = toNumber(value);

    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

/* ---------------------------------------------------------
   STATUS FIELD EXTRACTION
--------------------------------------------------------- */

/**
 * Attendance status and reward status are separate concepts.
 *
 * An attendance record may be:
 * attendance = approved
 * reward = pending
 *
 * In that case, attendance is approved, but wallet credit
 * must not be displayed as completed.
 */

function getAttendanceStatus(record) {
  if (!record || typeof record !== "object") {
    return "";
  }

  return normalizeStatus(
    firstDefined(
      record.status,
      record.approvalStatus,
      record.attendanceStatus,
      record.state,
      "",
    ),
  );
}

function getRewardStatus(record) {
  if (!record || typeof record !== "object") {
    return "";
  }

  return normalizeStatus(
    firstDefined(
      record.rewardStatus,
      record.reward?.status,
      record.walletReward?.status,
      "",
    ),
  );
}

/* ---------------------------------------------------------
   ATTENDANCE STATUS CHECKS
--------------------------------------------------------- */

const APPROVED_STATUSES = new Set([
  "approved",
  "accepted",
  "completed",
  "complete",
  "success",
  "successful",
  "credited",
  "paid",
  "present",
  "admin_corrected_present",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "under_review",
  "in_review",
  "processing",
  "submitted",
  "awaiting_approval",
  "pending_approval",
]);

const REJECTED_STATUSES = new Set(["rejected", "declined", "denied", "failed"]);

const MISSED_STATUSES = new Set(["missed", "absent", "not_present"]);

const HOLIDAY_STATUSES = new Set([
  "holiday",
  "official_holiday",
  "declared_holiday",
]);

export function isApproved(record) {
  const attendanceStatus = getAttendanceStatus(record);

  if (attendanceStatus) {
    return APPROVED_STATUSES.has(attendanceStatus);
  }

  // Only fall back to reward status when attendance status
  // was not supplied at all.
  return APPROVED_STATUSES.has(getRewardStatus(record));
}

export function isPending(record) {
  const attendanceStatus = getAttendanceStatus(record);

  if (attendanceStatus) {
    return PENDING_STATUSES.has(attendanceStatus);
  }

  return PENDING_STATUSES.has(getRewardStatus(record));
}

export function isRejected(record) {
  const attendanceStatus = getAttendanceStatus(record);

  if (attendanceStatus) {
    return REJECTED_STATUSES.has(attendanceStatus);
  }

  return REJECTED_STATUSES.has(getRewardStatus(record));
}

export function isMissed(record) {
  const status = getAttendanceStatus(record);

  return MISSED_STATUSES.has(status);
}

export function isHoliday(record) {
  const status = getAttendanceStatus(record);

  return HOLIDAY_STATUSES.has(status);
}

/* ---------------------------------------------------------
   MILESTONE STATUS NORMALIZATION
--------------------------------------------------------- */

const STATUS_ALIASES = {
  // Completion
  complete: "completed",
  done: "completed",
  success: "completed",
  successful: "completed",

  // Approval
  accepted: "approved",
  present: "approved",
  admin_corrected_present: "approved",

  // Pending
  under_review: "pending",
  in_review: "pending",
  awaiting_approval: "pending",
  pending_approval: "pending",

  // Rejection
  denied: "rejected",
  declined: "rejected",
  failed: "rejected",

  // Attendance
  absent: "missed",
  not_present: "missed",
  official_holiday: "holiday",
  declared_holiday: "holiday",

  // Locked
  unavailable: "locked",
};

function normalizeMilestoneStatus(value) {
  const normalized = normalizeStatus(value || "locked");

  return STATUS_ALIASES[normalized] ?? normalized;
}

/* ---------------------------------------------------------
   REWARD STATUS NORMALIZATION
--------------------------------------------------------- */

function getDefaultRewardStatus(milestoneStatus) {
  switch (milestoneStatus) {
    case "credited":
      return "credited";

    case "pending":
      return "pending";

    case "approved":
      return "approved";

    case "claimable":
      return "claimable";

    case "rejected":
    case "missed":
    case "holiday":
    case "locked":
      return "not_issued";

    case "completed":
      // Completed progress alone does not prove a wallet credit.
      return "approved";

    default:
      return "not_issued";
  }
}

/* ---------------------------------------------------------
   SINGLE MILESTONE NORMALIZER
--------------------------------------------------------- */

export function normalizeMilestone(item, index = 0) {
  const source = item && typeof item === "object" ? item : {};

  const sourceReward =
    source.reward && typeof source.reward === "object" ? source.reward : {};

  const statusSource = firstDefined(
    source.status,
    source.approvalStatus,
    source.rewardStatus,
    "locked",
  );

  const status = normalizeMilestoneStatus(statusSource);

  const amount = toNumber(
    firstDefined(sourceReward.amount, source.rewardAmount, source.amount),
  );

  const minAmount = toNumber(
    firstDefined(sourceReward.minAmount, source.minRewardAmount),
  );

  const maxAmount = toNumber(
    firstDefined(sourceReward.maxAmount, source.maxRewardAmount),
  );

  const suppliedRewardStatus = firstDefined(
    sourceReward.status,
    source.rewardStatus,
  );

  const rewardStatus = suppliedRewardStatus
    ? normalizeMilestoneStatus(suppliedRewardStatus)
    : getDefaultRewardStatus(status);

  const normalizedRewardStatus =
    rewardStatus === "completed" ? "credited" : rewardStatus;

  const visualState = ["credited", "approved", "completed"].includes(status)
    ? "completed"
    : status;

  return {
    ...source,

    id: String(source.id ?? source._id ?? `milestone-${index + 1}`),

    title: String(source.title ?? `Milestone ${index + 1}`),

    description: String(source.description ?? ""),

    type: String(source.type ?? "milestone"),

    status,
    visualState,

    date: getDate(source),

    requirements: Array.isArray(source.requirements) ? source.requirements : [],

    reward: {
      ...sourceReward,

      amount,
      minAmount,
      maxAmount,

      currency: sourceReward.currency ?? "IC",

      status: normalizedRewardStatus,
    },
  };
}

/* ---------------------------------------------------------
   MILESTONE COLLECTION NORMALIZER
--------------------------------------------------------- */

export function normalizeMilestones(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => normalizeMilestone(item, index));
}

/* ---------------------------------------------------------
   MILESTONE STATUS LABELS
--------------------------------------------------------- */

const STATUS_LABELS = {
  completed: "Completed",
  approved: "Attendance Approved",
  credited: "Reward Credited",

  pending: "Pending Review",
  rejected: "Needs Attention",

  missed: "Attendance Missed",
  holiday: "Holiday",

  locked: "Upcoming",
  claimable: "Ready to Claim",
  available: "Available",
  in_progress: "In Progress",
};

export function getMilestoneStatusLabel(value) {
  const status = normalizeMilestoneStatus(value);

  if (STATUS_LABELS[status]) {
    return STATUS_LABELS[status];
  }

  if (!status) {
    return "Upcoming";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/* ---------------------------------------------------------
   MILESTONE REWARD LABELS
--------------------------------------------------------- */

export function getMilestoneRewardLabel(milestone) {
  const reward = milestone?.reward ?? {};

  const currency = reward.currency ?? "IC";

  const amount = toNumber(reward.amount);

  const minAmount = toNumber(reward.minAmount);

  const maxAmount = toNumber(reward.maxAmount);

  const rewardStatus = normalizeStatus(reward.status);

  if (rewardStatus === "credited") {
    return amount !== null
      ? `${formatIC(amount, currency)} credited`
      : "Reward credited";
  }

  if (rewardStatus === "pending") {
    return amount !== null
      ? `${formatIC(amount, currency)} pending`
      : "Reward pending review";
  }

  if (rewardStatus === "approved") {
    return amount !== null
      ? `${formatIC(amount, currency)} approved · credit not confirmed`
      : "Attendance approved · wallet credit not confirmed";
  }

  if (
    rewardStatus === "claimable" ||
    normalizeStatus(milestone?.status) === "claimable"
  ) {
    return amount !== null
      ? `${formatIC(amount, currency)} available`
      : "Ready according to reward status";
  }

  if (minAmount !== null && maxAmount !== null) {
    return `${formatIC(minAmount, currency)} – ${formatIC(
      maxAmount,
      currency,
    )}`;
  }

  if (amount !== null) {
    return formatIC(amount, currency);
  }

  const milestoneStatus = normalizeMilestoneStatus(milestone?.status);

  if (["rejected", "missed", "holiday"].includes(milestoneStatus)) {
    return "No reward credit recorded";
  }

  if (reward.isVariable) {
    return "Reward depends on applicable eligibility and rules";
  }

  return "Reward details available when eligible";
}

/* ---------------------------------------------------------
   COMPLETION CHECK
--------------------------------------------------------- */

/**
 * This function determines whether a milestone counts as
 * completed progress. It does NOT independently confirm a
 * wallet credit.
 *
 * Wallet credit confirmation is represented separately by
 * milestone.reward.status === "credited".
 */
export const isCompletedStatus = (value) =>
  ["completed", "approved", "credited"].includes(
    normalizeMilestoneStatus(value),
  );
