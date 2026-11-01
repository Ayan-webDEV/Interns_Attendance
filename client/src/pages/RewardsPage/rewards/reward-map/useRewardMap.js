import { useCallback, useMemo, useState } from "react";

import {
  getDate,
  isApproved,
  isPending,
  isRejected,
  normalizeMilestones,
} from "./rewardMapUtils";

/* =========================================================
   GENERAL HELPERS
========================================================= */

const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    value =
      value.$numberDecimal ?? value.$numberInt ?? value.value ?? value.amount;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

function getDateValue(record) {
  return (
    getDate(record) ??
    record?.dateKey ??
    record?.attendanceDate ??
    record?.sessionDate ??
    null
  );
}

function getTimestamp(value) {
  if (!value) return 0;

  const date =
    typeof value === "number"
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(value);

  const timestamp = date.getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function recordId(record, index) {
  return String(
    record?._id ??
      record?.id ??
      record?.attendanceId ??
      `attendance-${index + 1}`,
  );
}

/* =========================================================
   WALLET TRANSACTIONS
========================================================= */

function getTransactions(wallet) {
  const candidates = [
    wallet?.transactions,
    wallet?.recentTransactions,
    wallet?.ledger,
    wallet?.entries,
    wallet?.data?.transactions,
    wallet?.data?.recentTransactions,
  ];

  return candidates.find(Array.isArray) ?? [];
}

function getTransactionReferenceValues(transaction) {
  return [
    transaction?._id,
    transaction?.id,
    transaction?.transactionId,
    transaction?.reference,
    transaction?.referenceId,
    transaction?.transactionRef,
    transaction?.referenceNumber,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value));
}

function getLinkedTransactionId(record) {
  const candidates = [
    record?.transactionId,
    record?.walletTransactionId,
    record?.rewardTransactionId,
    record?.transaction?._id,
    record?.transaction?.id,
    record?.transaction?.transactionId,
    record?.walletTransaction?._id,
    record?.walletTransaction?.id,
    record?.rewardTransaction?._id,
    record?.rewardTransaction?.id,
  ];

  const linked = candidates.find(
    (value) => value !== null && value !== undefined && value !== "",
  );

  if (linked && typeof linked === "object") {
    return String(
      linked._id ?? linked.id ?? linked.transactionId ?? linked.reference ?? "",
    );
  }

  return linked == null ? null : String(linked);
}

function findLinkedTransaction(record, transactions) {
  const linkedId = getLinkedTransactionId(record);

  if (linkedId) {
    const match = transactions.find((transaction) =>
      getTransactionReferenceValues(transaction).includes(linkedId),
    );

    if (match) return match;
  }

  // Some APIs link a transaction to an attendance record instead
  // of storing the transaction ID directly on the attendance record.
  const attendanceId = recordId(record, 0);

  return (
    transactions.find((transaction) => {
      const linkedAttendanceValues = [
        transaction?.attendanceId,
        transaction?.attendanceRecordId,
        transaction?.sourceAttendanceId,
        transaction?.relatedAttendanceId,
      ]
        .filter(
          (value) => value !== null && value !== undefined && value !== "",
        )
        .map(String);

      return linkedAttendanceValues.includes(attendanceId);
    }) ?? null
  );
}

/* =========================================================
   TRANSACTION AMOUNT AND STATUS
========================================================= */

function getTransactionAmount(transaction) {
  return toNumber(
    transaction?.amount ??
      transaction?.value ??
      transaction?.coins ??
      transaction?.rewardAmount ??
      transaction?.transactionAmount ??
      null,
  );
}

function isDebitTransaction(transaction) {
  const type = normalizeStatus(
    transaction?.type ??
      transaction?.transactionType ??
      transaction?.category ??
      transaction?.entryType ??
      transaction?.direction,
  );

  return (
    type.includes("debit") ||
    type.includes("withdraw") ||
    type.includes("deduction") ||
    type.includes("spent") ||
    type.includes("purchase") ||
    type.includes("expense") ||
    type.includes("outflow")
  );
}

function getTransactionStatus(transaction) {
  return normalizeStatus(
    transaction?.status ??
      transaction?.state ??
      transaction?.transactionStatus ??
      transaction?.approvalStatus,
  );
}

function isPendingTransaction(transaction) {
  const status = getTransactionStatus(transaction);

  return [
    "pending",
    "processing",
    "in_review",
    "under_review",
    "awaiting_approval",
    "submitted",
    "pending_approval",
  ].includes(status);
}

function isFailedTransaction(transaction) {
  const status = getTransactionStatus(transaction);

  return [
    "failed",
    "rejected",
    "cancelled",
    "canceled",
    "declined",
    "reversed",
    "void",
  ].includes(status);
}

/**
 * A linked record alone is not sufficient to confirm a credit.
 *
 * A transaction with a pending/failed state is never considered
 * credited. A positive ledger entry without a status is accepted
 * as recorded because it is already present in the wallet ledger.
 */
function isCreditedTransaction(transaction) {
  if (!transaction || isDebitTransaction(transaction)) {
    return false;
  }

  if (isPendingTransaction(transaction)) {
    return false;
  }

  if (isFailedTransaction(transaction)) {
    return false;
  }

  const status = getTransactionStatus(transaction);
  const amount = getTransactionAmount(transaction);

  if (amount !== null && amount <= 0) {
    return false;
  }

  const confirmedStatuses = [
    "credited",
    "approved",
    "completed",
    "complete",
    "success",
    "successful",
    "paid",
    "posted",
    "settled",
    "issued",
    "recorded",
  ];

  if (status) {
    return confirmedStatuses.includes(status);
  }

  // No explicit status: a positive entry in the wallet ledger
  // is treated as an already recorded credit.
  return amount !== null && amount > 0;
}

/* =========================================================
   ATTENDANCE REWARD AMOUNT
========================================================= */

/**
 * Return null when the API did not provide a reward amount.
 * Do not convert missing reward information into 0 IC.
 */
function getRecordRewardAmount(record) {
  const candidates = [
    record?.rewardAmount,
    record?.amount,
    record?.coins,
    record?.reward?.amount,
    record?.reward?.coins,
    record?.walletReward?.amount,
    record?.transaction?.amount,
  ];

  for (const value of candidates) {
    const amount = toNumber(value);

    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

/* =========================================================
   ATTENDANCE STATUS
========================================================= */

function getRecordStatus(record) {
  if (isRejected(record)) {
    return "rejected";
  }

  if (isPending(record)) {
    return "pending";
  }

  const values = [
    record?.status,
    record?.approvalStatus,
    record?.attendanceStatus,
    record?.reward?.status,
  ].map(normalizeStatus);

  // Explicitly credited is different from attendance approved.
  if (
    values.some((status) =>
      ["credited", "paid", "successful", "success"].includes(status),
    )
  ) {
    return "credited";
  }

  if (isApproved(record)) {
    return "approved";
  }

  if (values.some((status) => ["missed", "absent"].includes(status))) {
    return "missed";
  }

  if (values.includes("holiday")) {
    return "holiday";
  }

  return "locked";
}

/* =========================================================
   SESSION INFORMATION
========================================================= */

function getSession(record) {
  return (
    record?.sessionNumber ??
    record?.session ??
    record?.sessionId ??
    record?.attendanceSession ??
    null
  );
}

function getAttendanceTitle(record, index) {
  const session = getSession(record);

  if (session !== null && session !== undefined && session !== "") {
    return `Attendance · Session ${session}`;
  }

  return index === 0 ? "First Attendance" : `Attendance ${index + 1}`;
}

/* =========================================================
   BUILD ATTENDANCE MILESTONE
========================================================= */

function buildAttendanceMilestone(record, index, transactions) {
  const linked = findLinkedTransaction(record, transactions);

  const recordStatus = getRecordStatus(record);

  const linkedIsCredited = isCreditedTransaction(linked);

  const linkedIsPending = Boolean(linked) && isPendingTransaction(linked);

  const linkedAmount = linked ? getTransactionAmount(linked) : null;

  const recordAmount = getRecordRewardAmount(record);

  // Prefer the actual ledger amount when a ledger credit exists.
  // Otherwise, display a supplied attendance reward amount.
  const amount = linkedAmount !== null ? Math.abs(linkedAmount) : recordAmount;

  let milestoneStatus = recordStatus;
  let rewardStatus = "not_issued";

  if (recordStatus === "rejected") {
    rewardStatus = "not_issued";
  } else if (recordStatus === "pending") {
    rewardStatus = "pending";
  } else if (recordStatus === "credited") {
    milestoneStatus = "credited";
    rewardStatus = "credited";
  } else if (recordStatus === "approved" && linkedIsCredited) {
    milestoneStatus = "credited";
    rewardStatus = "credited";
  } else if (recordStatus === "approved" && linkedIsPending) {
    rewardStatus = "pending";
  }

  // Explicit holidays and missed sessions do not represent wallet credits.
  if (recordStatus === "holiday" || recordStatus === "missed") {
    rewardStatus = "not_issued";
  }

  const session = getSession(record);

  return {
    id: recordId(record, index),
    type: "attendance",
    title: getAttendanceTitle(record, index),

    description:
      session !== null && session !== undefined
        ? `Attendance record for Session ${session}.`
        : "Your internship attendance checkpoint.",

    date: getDateValue(record),

    status: milestoneStatus,

    requirements: [
      "Submit your attendance record.",
      "Meet the applicable attendance requirements.",
      "Wait for review and approval where required.",
    ],

    reward: {
      amount,
      currency: "IC",
      status: rewardStatus,
      transactionId: linked
        ? (linked?._id ??
          linked?.id ??
          linked?.transactionId ??
          linked?.reference ??
          null)
        : null,
    },
  };
}

/* =========================================================
   BUILD COMPLETE REWARD JOURNEY
========================================================= */

function buildMilestones({ records, wallet }) {
  const transactions = getTransactions(wallet);

  const safeRecords = Array.isArray(records)
    ? records.filter((record) => record && typeof record === "object")
    : [];

  const sortedRecords = [...safeRecords].sort((a, b) => {
    const dateA = getTimestamp(getDateValue(a));
    const dateB = getTimestamp(getDateValue(b));

    return dateA - dateB;
  });

  const milestones = [
    {
      id: "joining",
      type: "joining",
      title: "Journey Begins",
      description: "Your VELoop InternCash reward journey starts here.",

      status: "completed",

      requirements: ["Internship enrollment confirmed."],

      reward: {
        amount: null,
        currency: "IC",
        status: "none",
      },
    },
  ];

  sortedRecords.forEach((record, index) => {
    milestones.push(buildAttendanceMilestone(record, index, transactions));
  });

  milestones.push({
    id: "project-submission",
    type: "project",

    title: "Project Treasure",

    description:
      "Complete your assigned project and follow the applicable review and reward instructions.",

    status: "locked",

    requirements: [
      "Submit your assigned project.",
      "Meet the applicable project review criteria.",
      "Follow your administrator's reward instructions.",
    ],

    reward: {
      amount: null,
      minAmount: null,
      maxAmount: null,
      currency: "IC",
      status: "not_issued",
      isVariable: true,
    },
  });

  return milestones;
}

/* =========================================================
   REACT HOOK
========================================================= */

export default function useRewardMap({ wallet, records = [], refreshKey = 0 }) {
  const [refreshVersion, setRefreshVersion] = useState(0);

  const safeRecords = Array.isArray(records) ? records : [];

  const milestones = useMemo(() => {
    const generated = buildMilestones({
      records: safeRecords,
      wallet,
    });

    return normalizeMilestones(generated);
  }, [safeRecords, wallet, refreshKey, refreshVersion]);

  /**
   * This hook derives milestones from already loaded data.
   * It does not make network requests.
   * The parent RewardsPage is responsible for loading fresh
   * wallet and attendance data before requesting a refresh.
   */
  const refresh = useCallback(async () => {
    setRefreshVersion((version) => version + 1);
  }, []);

  return {
    milestones,
    loading: false,
    error: "",
    lastUpdated: null,
    hasLiveData: false,
    refresh,
  };
}
