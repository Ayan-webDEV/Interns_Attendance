import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";

import { api } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";

import styles from "./RewardsPage.module.css";

import WalletHero from "./rewards/WalletHero";
import RewardPulse from "./rewards/RewardPulse";
import ApprovalStation from "./rewards/ApprovalStation";
import ProjectRewardCard from "./rewards/ProjectRewardCard";
import TransactionHistory from "./rewards/TransactionHistory";
import WalletFAQs from "./rewards/WalletFAQs";
import WalletTrustFooter from "./rewards/WalletTrustFooter";

import RewardMapPreview from "./rewards/reward-map/RewardMapPreview";
import RewardMapModal from "./rewards/reward-map/RewardMapModal";
import useRewardMap from "./rewards/reward-map/useRewardMap";

/* =========================================================
   GENERAL HELPERS
========================================================= */

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const firstArray = (...values) => values.find(Array.isArray) ?? [];

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    value =
      value.$numberDecimal ?? value.$numberInt ?? value.value ?? value.amount;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/* =========================================================
   WALLET RESPONSE NORMALIZATION
========================================================= */

function normalizeWalletResponse(response, user) {
  const root = isObject(response?.data) ? response.data : response;

  const walletCandidate = firstDefined(
    root?.wallet?.wallet,
    root?.wallet,
    root?.walletData,
    root,
    response,
  );

  const wallet = isObject(walletCandidate) ? walletCandidate : {};

  const transactions = firstArray(
    wallet.transactions,
    wallet.recentTransactions,
    wallet.ledger,
    wallet.entries,

    root?.transactions,
    root?.recentTransactions,
    root?.ledger,
    root?.entries,

    response?.transactions,
  );

  return {
    ...root,
    ...wallet,

    balance: toNumber(
      firstDefined(
        wallet.balance,
        wallet.walletBalance,
        wallet.availableBalance,
        root?.balance,
        root?.walletBalance,
        response?.balance,
        user?.internCashBalance,
      ),
      0,
    ),

    conversion: toNumber(
      firstDefined(
        wallet.conversion,
        wallet.conversionRate,
        root?.conversion,
        root?.conversionRate,
        response?.conversion,
      ),
      0.5,
    ),

    transactions,
  };
}

/* =========================================================
   ATTENDANCE RESPONSE
========================================================= */

function normalizeAttendanceResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  const root = isObject(response?.data) ? response.data : response;

  return firstArray(
    root?.records,
    root?.attendance,
    root?.attendances,
    root?.attendanceRecords,
    response?.records,
  );
}

/* =========================================================
   NOTIFICATION RESPONSE
========================================================= */

function normalizeNotificationResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  const root = isObject(response?.data) ? response.data : response;

  return firstArray(root?.notifications, root?.items, response?.notifications);
}

function isNotificationRead(notification) {
  return Boolean(
    notification?.isRead === true ||
    notification?.read === true ||
    notification?.readAt ||
    notification?.read_at,
  );
}

/* =========================================================
   TRANSACTION HELPERS
========================================================= */

function getTransactionDate(transaction) {
  return (
    transaction?.createdAt ??
    transaction?.date ??
    transaction?.timestamp ??
    transaction?.updatedAt ??
    transaction?.transactionDate ??
    null
  );
}

function getTransactionAmount(transaction) {
  const amount = toNumber(
    firstDefined(
      transaction?.amount,
      transaction?.value,
      transaction?.coins,
      transaction?.rewardAmount,
      transaction?.netAmount,
    ),
    0,
  );

  const type = normalizeStatus(
    firstDefined(
      transaction?.type,
      transaction?.transactionType,
      transaction?.category,
      transaction?.entryType,
      transaction?.direction,
    ),
  );

  const isDebit =
    type.includes("debit") ||
    type.includes("withdraw") ||
    type.includes("deduction") ||
    type.includes("spent") ||
    type.includes("purchase") ||
    type.includes("expense");

  return isDebit ? -Math.abs(amount) : amount;
}

function sortTransactions(transactions) {
  return [...transactions].filter(isObject).sort((a, b) => {
    const dateA = new Date(getTransactionDate(a) ?? 0).getTime();

    const dateB = new Date(getTransactionDate(b) ?? 0).getTime();

    const safeA = Number.isFinite(dateA) ? dateA : 0;
    const safeB = Number.isFinite(dateB) ? dateB : 0;

    return safeB - safeA;
  });
}

/* =========================================================
   ATTENDANCE STATUS
========================================================= */

function getAttendanceStatus(record) {
  return normalizeStatus(
    record?.status ??
      record?.attendanceStatus ??
      record?.approvalStatus ??
      record?.state,
  );
}

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_approval",
  "submitted",
  "under_review",
  "pending_approval",
  "in_review",
  "processing",
]);

const APPROVED_STATUSES = new Set([
  "approved",
  "admin_corrected_present",
  "present",
  "completed",
  "complete",
  "success",
  "successful",
]);

/* =========================================================
   MAIN REWARDS PAGE
========================================================= */

export default function RewardsPage({ user }) {
  const toast = useToast();

  /* -------------------------------------------------------
     DATA STATE
  ------------------------------------------------------- */

  const [wallet, setWallet] = useState({
    balance: toNumber(user?.internCashBalance, 0),
    conversion: 0.5,
    transactions: [],
  });

  const [records, setRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [walletError, setWalletError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [notificationError, setNotificationError] = useState("");

  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [showBalance, setShowBalance] = useState(true);

  const [mapOpen, setMapOpen] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState(null);

  /* -------------------------------------------------------
     REQUEST SAFETY
  ------------------------------------------------------- */

  const requestSequence = useRef(0);

  /* =======================================================
     TOAST
  ======================================================= */

  const notify = useCallback(
    (message, type = "success") => {
      if (typeof message === "string" && message.trim()) {
        toast(message, type);
      }
    },
    [toast],
  );

  /* =======================================================
     LOAD PAGE DATA
  ======================================================= */

  const loadPageData = useCallback(
    async ({ manualRefresh = false } = {}) => {
      const requestId = ++requestSequence.current;

      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      setWalletError("");
      setAttendanceError("");
      setNotificationError("");

      const results = await Promise.allSettled([
        api("/wallet/mine"),

        // This is the actual endpoint used by Attendance.jsx.
        api("/attendance/history"),

        // This is the actual endpoint used by Notifications.jsx.
        api("/notifications/mine"),
      ]);

      // Do not update the page with an older response.
      if (requestId !== requestSequence.current) {
        return [];
      }

      const [walletResult, attendanceResult, notificationResult] = results;

      const failures = [];

      /* -----------------------------------------------
         WALLET
      ----------------------------------------------- */

      if (walletResult.status === "fulfilled") {
        const normalized = normalizeWalletResponse(walletResult.value, user);

        setWallet(normalized);
      } else {
        const message =
          walletResult.reason?.message ?? "Unable to load wallet information.";

        setWalletError(message);
        failures.push("wallet");
      }

      /* -----------------------------------------------
         ATTENDANCE HISTORY
      ----------------------------------------------- */

      if (attendanceResult.status === "fulfilled") {
        const attendanceRecords = normalizeAttendanceResponse(
          attendanceResult.value,
        );

        setRecords(attendanceRecords);
      } else {
        const message =
          attendanceResult.reason?.message ??
          "Unable to load attendance history.";

        setAttendanceError(message);
        failures.push("attendance history");
      }

      /* -----------------------------------------------
         NOTIFICATIONS
      ----------------------------------------------- */

      if (notificationResult.status === "fulfilled") {
        const notificationList = normalizeNotificationResponse(
          notificationResult.value,
        );

        setNotifications(notificationList);
      } else {
        const message =
          notificationResult.reason?.message ?? "Unable to load notifications.";

        setNotificationError(message);
        failures.push("notifications");
      }

      if (requestId === requestSequence.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }

      if (manualRefresh) {
        if (failures.length > 0) {
          notify(
            `Some data could not be refreshed: ${failures.join(", ")}.`,
            "error",
          );
        } else {
          notify("Your wallet and reward information is up to date.");
        }
      }

      return failures;
    },
    [user, notify],
  );

  /* =======================================================
     INITIAL DATA LOAD
  ======================================================= */

  useEffect(() => {
    loadPageData();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadPageData]);

  /* =======================================================
     NORMALIZE TRANSACTIONS
  ======================================================= */

  const transactions = useMemo(
    () =>
      sortTransactions(
        Array.isArray(wallet?.transactions) ? wallet.transactions : [],
      ),
    [wallet.transactions],
  );

  const safeRecords = useMemo(
    () => (Array.isArray(records) ? records : []),
    [records],
  );

  const safeNotifications = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications],
  );

  /* =======================================================
     WALLET BALANCE
  ======================================================= */

  const balance = toNumber(
    wallet?.balance,
    toNumber(user?.internCashBalance, 0),
  );

  const conversion = toNumber(wallet?.conversion, 0.5);

  const indicativeValue = balance * conversion;

  /* =======================================================
     TRANSACTION STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        const amount = getTransactionAmount(transaction);

        if (amount > 0) {
          result.credits += amount;
          result.creditCount += 1;
        } else if (amount < 0) {
          result.debits += Math.abs(amount);
          result.debitCount += 1;
        }

        return result;
      },
      {
        credits: 0,
        debits: 0,
        creditCount: 0,
        debitCount: 0,
      },
    );
  }, [transactions]);

  /* =======================================================
     ATTENDANCE COUNTS
  ======================================================= */

  const pendingCount = useMemo(
    () =>
      safeRecords.filter((record) =>
        PENDING_STATUSES.has(getAttendanceStatus(record)),
      ).length,
    [safeRecords],
  );

  const approvedCount = useMemo(
    () =>
      safeRecords.filter((record) =>
        APPROVED_STATUSES.has(getAttendanceStatus(record)),
      ).length,
    [safeRecords],
  );

  /* =======================================================
     NOTIFICATION COUNTS
  ======================================================= */

  const unreadCount = useMemo(
    () =>
      safeNotifications.filter(
        (notification) => !isNotificationRead(notification),
      ).length,
    [safeNotifications],
  );

  /* =======================================================
     REWARD MAP
  ======================================================= */

  const walletForMap = useMemo(
    () => ({
      ...wallet,
      transactions,
    }),
    [wallet, transactions],
  );

  const {
    milestones,
    loading: mapLoading,
    error: mapError,
    refresh: refreshMap,
  } = useRewardMap({
    wallet: walletForMap,
    records: safeRecords,
  });

  /* =======================================================
     MAP CONTROLS
  ======================================================= */

  const openMap = useCallback((milestone = null) => {
    setSelectedMilestone(milestone);
    setMapOpen(true);
  }, []);

  const closeMap = useCallback(() => {
    setMapOpen(false);
    setSelectedMilestone(null);
  }, []);

  /* =======================================================
     FULL REFRESH
  ======================================================= */

  const handleRefresh = useCallback(async () => {
    try {
      await loadPageData({
        manualRefresh: true,
      });

      // Recalculate the derived map state after fresh API data.
      await refreshMap?.();
    } catch (error) {
      notify(error?.message ?? "Unable to refresh wallet data.", "error");
    }
  }, [loadPageData, refreshMap, notify]);

  /* =======================================================
     MARK NOTIFICATION AS READ
  ======================================================= */

  const markRead = useCallback(
    async (notification) => {
      const id = notification?._id ?? notification?.id;

      if (!id) {
        notify("This notification does not have a valid ID.", "error");

        return false;
      }

      if (isNotificationRead(notification)) {
        return true;
      }

      try {
        await api(`/notifications/${encodeURIComponent(id)}/read`, {
          method: "POST",
          body: {},
        });

        setNotifications((current) =>
          current.map((item) => {
            const itemId = item?._id ?? item?.id;

            return String(itemId) === String(id)
              ? {
                  ...item,
                  isRead: true,
                  read: true,
                  readAt: new Date().toISOString(),
                }
              : item;
          }),
        );

        return true;
      } catch (error) {
        notify(
          error?.message ?? "Unable to mark the notification as read.",
          "error",
        );

        return false;
      }
    },
    [notify],
  );

  /* =======================================================
     PAGE ERROR
  ======================================================= */

  const errors = [
    walletError
      ? {
          label: "Wallet",
          message: walletError,
        }
      : null,

    attendanceError
      ? {
          label: "Attendance",
          message: attendanceError,
        }
      : null,

    notificationError
      ? {
          label: "Notifications",
          message: notificationError,
        }
      : null,
  ].filter(Boolean);

  /* =======================================================
     INITIAL LOADING VIEW
  ======================================================= */

  if (initialLoading) {
    return (
      <main className={styles.page}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-800">
              <Sparkles size={13} />
              VELoop Rewards · InternCash
            </span>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Your reward universe
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Preparing your wallet and reward journey...
            </p>
          </div>
        </header>

        <section className={styles.loadingCard}>
          <span className={styles.loadingIcon}>
            <LoaderCircle size={25} className="animate-spin" />
          </span>

          <h2>Preparing your InternCash wallet</h2>

          <p>
            Loading your actual balance, attendance history and transaction
            records.
          </p>

          <div className={styles.loadingGrid}>
            <span />
            <span />
            <span />
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <main className={styles.page}>
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-800">
            <Sparkles size={13} />
            VELoop Rewards · InternCash
          </span>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-[34px]">
            Your reward universe
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            Explore your reward progress, review attendance approvals and
            understand every recorded wallet transaction.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />

          {refreshing ? "Syncing..." : "Sync wallet"}
        </button>
      </header>

      {/* =================================================
          API ERROR MESSAGES
      ================================================= */}

      {errors.length > 0 && (
        <section className="grid gap-2" aria-label="Data loading warnings">
          {errors.map((item) => (
            <div
              key={item.label}
              role="alert"
              className="flex min-w-0 items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-rose-600"
              />

              <div className="min-w-0">
                <p className="text-xs font-extrabold text-rose-900">
                  {item.label} information could not be loaded
                </p>

                <p className="mt-1 break-words text-xs leading-5 text-rose-700">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* =================================================
          WALLET HERO
      ================================================= */}

      <WalletHero
        balance={balance}
        indicativeValue={indicativeValue}
        stats={stats}
        transactionCount={transactions.length}
        latestTransaction={transactions[0] ?? null}
        showBalance={showBalance}
        onToggleBalance={() => setShowBalance((current) => !current)}
        notify={notify}
      />

      {/* =================================================
          QUICK INSIGHTS
      ================================================= */}

      <RewardPulse
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        unreadCount={unreadCount}
        onOpenMap={() => openMap()}
      />

      {/* =================================================
          APPROVAL TRACKER
      ================================================= */}

      <ApprovalStation records={safeRecords} />

      {/* =================================================
          PROJECT REWARD CARD
      ================================================= */}

      <ProjectRewardCard notify={notify} />

      {/* =================================================
          REWARD MAP PREVIEW
      ================================================= */}

      <section className={styles.mapSection}>
        <RewardMapPreview
          milestones={milestones}
          loading={mapLoading}
          onSelect={(milestone) => openMap(milestone)}
          onExplore={() => openMap()}
        />
      </section>

      {/* =================================================
          TRANSACTION HISTORY
      ================================================= */}

      <TransactionHistory
        transactions={transactions}
        showBalance={showBalance}
        notify={notify}
      />

      {/* =================================================
          FAQ
      ================================================= */}

      <WalletFAQs />

      {/* =================================================
          TRUST FOOTER
      ================================================= */}

      <WalletTrustFooter />

      {/* =================================================
          FULL REWARD MAP MODAL
      ================================================= */}

      <RewardMapModal
        open={mapOpen}
        milestones={milestones}
        loading={mapLoading || refreshing}
        error={mapError}
        onClose={closeMap}
        onRefresh={handleRefresh}
        initialMilestone={selectedMilestone}
      />
    </main>
  );
}
