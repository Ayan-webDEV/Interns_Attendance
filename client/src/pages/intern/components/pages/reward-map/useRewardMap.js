import { useCallback, useMemo, useState } from "react";

import {
  getDate,
  getRewardAmount,
  isApproved,
  isPending,
  isRejected,
  normalizeMilestones,
} from "./rewardMapUtils.js";

/**
 * VELoop InternCash Reward Map
 *
 * Builds milestones from the records and wallet data already available
 * to RewardsPage.jsx.
 *
 * This hook does not call a backend endpoint or issue wallet credits.
 */

function getRecordId(record, index) {
  return String(
    record?._id ??
      record?.id ??
      record?.attendanceId ??
      `attendance-${index + 1}`,
  );
}

function getTransactionId(record) {
  return (
    record?.transactionId ??
    record?.walletTransactionId ??
    record?.rewardTransactionId ??
    record?.transaction?._id ??
    record?.transaction?.id ??
    null
  );
}

function getTransactions(wallet) {
  if (Array.isArray(wallet?.transactions)) {
    return wallet.transactions;
  }

  if (Array.isArray(wallet?.recentTransactions)) {
    return wallet.recentTransactions;
  }

  return [];
}

function findLinkedTransaction(record, transactions) {
  const linkedId = getTransactionId(record);

  if (linkedId == null) return null;

  return (
    transactions.find(
      (transaction) =>
        String(transaction?._id ?? transaction?.id ?? "") === String(linkedId),
    ) ?? null
  );
}

function getRecordStatus(record) {
  if (isRejected(record)) return "rejected";
  if (isPending(record)) return "pending";
  if (isApproved(record)) return "approved";

  const rawStatus = String(
    record?.status ?? record?.approvalStatus ?? record?.attendanceStatus ?? "",
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    [
      "completed",
      "complete",
      "success",
      "successful",
      "credited",
      "paid",
    ].includes(rawStatus)
  ) {
    return "approved";
  }

  return "locked";
}

function buildAttendanceMilestone(record, index, transactions) {
  const linkedTransaction = findLinkedTransaction(record, transactions);
  const recordStatus = getRecordStatus(record);

  const transactionStatus = String(linkedTransaction?.status ?? "")
    .trim()
    .toLowerCase();

  const isCredited =
    Boolean(linkedTransaction) &&
    !["failed", "rejected", "cancelled", "canceled"].includes(
      transactionStatus,
    );

  const linkedAmount =
    linkedTransaction?.amount != null ? Number(linkedTransaction.amount) : null;

  const recordAmount = getRewardAmount(record);

  const amount =
    linkedAmount != null && Number.isFinite(linkedAmount)
      ? linkedAmount
      : recordAmount;

  let milestoneStatus = recordStatus;
  let rewardStatus = "not_issued";

  if (recordStatus === "rejected") {
    milestoneStatus = "rejected";
    rewardStatus = "not_issued";
  } else if (recordStatus === "pending") {
    milestoneStatus = "pending";
    rewardStatus = "pending";
  } else if (recordStatus === "approved" && isCredited) {
    milestoneStatus = "credited";
    rewardStatus = "credited";
  } else if (recordStatus === "approved") {
    milestoneStatus = "approved";
    rewardStatus = "not_issued";
  }

  return {
    id: getRecordId(record, index),
    type: "attendance",
    title: index === 0 ? "First Attendance" : `Attendance Day ${index + 1}`,
    description: "Your internship attendance checkpoint.",
    date: getDate(record),
    status: milestoneStatus,
    requirements: [
      "Submit your attendance record",
      "Meet the applicable attendance requirements",
      "Wait for review and approval where required",
    ],
    reward: {
      amount: Number.isFinite(amount) ? amount : null,
      currency: "IC",
      status: rewardStatus,
      transactionId: linkedTransaction?._id ?? linkedTransaction?.id ?? null,
    },
  };
}

function buildFallbackMilestones({ records = [], wallet }) {
  const transactions = getTransactions(wallet);

  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(getDate(a) ?? 0).getTime();
    const dateB = new Date(getDate(b) ?? 0).getTime();

    return (
      (Number.isFinite(dateA) ? dateA : 0) -
      (Number.isFinite(dateB) ? dateB : 0)
    );
  });

  const milestones = [
    {
      id: "joining",
      type: "joining",
      title: "Journey Begins",
      description: "Your VELoop InternCash reward journey starts here.",
      status: "completed",
      requirements: ["Internship enrollment confirmed"],
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
      "Submit your assigned project",
      "Meet the applicable project review criteria",
      "Follow the administrator's reward instructions",
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

/**
 * Usage:
 *
 * const {
 *   milestones,
 *   loading,
 *   error,
 *   refresh,
 * } = useRewardMap({ wallet, records });
 */
export default function useRewardMap({ wallet, records = [], refreshKey = 0 }) {
  const [refreshVersion, setRefreshVersion] = useState(0);

  const milestones = useMemo(() => {
    const safeRecords = Array.isArray(records) ? records : [];

    return normalizeMilestones(
      buildFallbackMilestones({
        records: safeRecords,
        wallet,
      }),
    );
  }, [records, wallet, refreshKey, refreshVersion]);

  const refresh = useCallback(async () => {
    // Rebuild the map from the latest props available to this component.
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
