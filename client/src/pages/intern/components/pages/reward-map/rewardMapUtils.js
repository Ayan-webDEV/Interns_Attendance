const normalizeStatus = (value) => String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

export function getDate(record) {
  if (!record || typeof record !== "object") return null;
  return record.date ?? record.createdAt ?? record.submittedAt ?? record.attendanceDate ?? record.updatedAt ?? null;
}

export function formatDate(value) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatIC(value, currency = "IC") {
  if (value === null || value === undefined || value === "") return "Reward varies";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toLocaleString("en-IN")} ${currency}` : "Reward varies";
}

export function getRewardAmount(record) {
  if (!record || typeof record !== "object") return 0;
  const values = [record.rewardAmount, record.amount, record.coins, record.reward?.amount, record.reward?.coins, record.walletReward?.amount, record.transaction?.amount];
  for (const value of values) if (value !== null && value !== undefined && value !== "") {
    const amount = Number(value);
    if (Number.isFinite(amount)) return amount;
  }
  return 0;
}

export function isApproved(record) {
  return [record?.status, record?.approvalStatus, record?.attendanceStatus, record?.reward?.status].map(normalizeStatus).some((s) => ["approved", "accepted", "completed", "success", "successful", "credited", "paid"].includes(s));
}
export function isPending(record) {
  return [record?.status, record?.approvalStatus, record?.attendanceStatus, record?.reward?.status].map(normalizeStatus).some((s) => ["pending", "under_review", "in_review", "processing", "submitted", "awaiting_approval"].includes(s));
}
export function isRejected(record) {
  return [record?.status, record?.approvalStatus, record?.attendanceStatus, record?.reward?.status].map(normalizeStatus).some((s) => ["rejected", "declined", "denied", "failed"].includes(s));
}

export function normalizeMilestone(item, index = 0) {
  const source = item && typeof item === "object" ? item : {};
  const reward = source.reward && typeof source.reward === "object" ? source.reward : {};
  let status = normalizeStatus(source.status ?? source.approvalStatus ?? source.rewardStatus ?? "locked");
  const aliases = { complete: "completed", done: "completed", success: "completed", successful: "completed", accepted: "approved", under_review: "pending", in_review: "pending", awaiting_approval: "pending", denied: "rejected", declined: "rejected", unavailable: "locked" };
  status = aliases[status] ?? status;
  const parse = (value) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
  const amount = parse(reward.amount ?? source.rewardAmount ?? source.amount);
  const minAmount = parse(reward.minAmount ?? source.minRewardAmount);
  const maxAmount = parse(reward.maxAmount ?? source.maxRewardAmount);
  return {
    ...source,
    id: String(source.id ?? source._id ?? `milestone-${index + 1}`),
    title: String(source.title ?? `Milestone ${index + 1}`),
    description: String(source.description ?? ""),
    type: String(source.type ?? "milestone"),
    status,
    visualState: ["credited", "approved"].includes(status) ? "completed" : status,
    date: getDate(source),
    requirements: Array.isArray(source.requirements) ? source.requirements : [],
    reward: { ...reward, amount, minAmount, maxAmount, currency: reward.currency ?? "IC", status: normalizeStatus(reward.status ?? source.rewardStatus ?? (["completed", "credited", "approved"].includes(status) ? "credited" : status === "pending" ? "pending" : "not_issued")) },
  };
}
export function normalizeMilestones(items) { return Array.isArray(items) ? items.map(normalizeMilestone) : []; }

export function getMilestoneStatusLabel(value) {
  const labels = { completed: "Completed", approved: "Approved", credited: "Reward Credited", pending: "Pending Review", rejected: "Needs Attention", locked: "Upcoming", claimable: "Ready to Claim", available: "Available", in_progress: "In Progress" };
  const status = normalizeStatus(value);
  return labels[status] ?? (status ? status.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : "Upcoming");
}

export function getMilestoneRewardLabel(milestone) {
  const reward = milestone?.reward ?? {};
  const currency = reward.currency ?? "IC";
  if (reward.status === "credited") return reward.amount != null ? `${formatIC(reward.amount, currency)} credited` : "Reward credited";
  if (reward.status === "pending") return reward.amount != null ? `${formatIC(reward.amount, currency)} pending` : "Reward pending review";
  if (reward.isVariable && reward.minAmount != null && reward.maxAmount != null) return `${reward.minAmount}–${reward.maxAmount} ${currency}`;
  if (reward.amount != null) return formatIC(reward.amount, currency);
  return "Reward details available when eligible";
}
export const isCompletedStatus = (status) => ["completed", "approved", "credited"].includes(normalizeStatus(status));
