import React, { useMemo, useState } from "react";
import { money } from "../../../../lib/session.js";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  Coins,
  Gift,
  History,
  Info,
  LockKeyhole,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import "./RewardsPage.css";
import RewardMapPreview from "./reward-map/RewardMapPreview.jsx";
import RewardMapModal from "./reward-map/RewardMapModal.jsx";
import useRewardMap from "./reward-map/useRewardMap.js";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getAmount = (value) => Number(value) || 0;

const formatAmount = (value) => {
  const amount = getAmount(value);
  return `${amount > 0 ? "+" : ""}${amount}`;
};

const transactionType = (transaction) =>
  String(transaction?.type || "transaction").replaceAll("_", " ");

const getTransactionIcon = (transaction) => {
  const type = String(transaction?.type || "").toLowerCase();

  if (type.includes("attendance") || type.includes("present")) {
    return CalendarDays;
  }
  if (type.includes("referral")) return Gift;
  if (type.includes("bonus") || type.includes("reward")) return Sparkles;
  if (getAmount(transaction?.amount) < 0) return ArrowUpRight;

  return Coins;
};

const pendingStatuses = new Set([
  "pending",
  "awaiting_approval",
  "submitted",
  "under_review",
  "pending_approval",
  "in_review",
]);

const approvedStatuses = new Set([
  "approved",
  "admin_corrected_present",
  "present",
  "completed",
]);

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

const getRecordStatus = (record) =>
  normalizeStatus(
    record?.status ??
      record?.approvalStatus ??
      record?.attendanceStatus ??
      record?.state,
  );

const getRecordDate = (record) =>
  record?.date ??
  record?.attendanceDate ??
  record?.createdAt ??
  record?.updatedAt;

const getNotificationTitle = (notification) =>
  notification?.title ??
  notification?.heading ??
  notification?.subject ??
  "Wallet update";

const getNotificationMessage = (notification) =>
  notification?.message ??
  notification?.body ??
  notification?.description ??
  "Open your notifications to review this update.";

const faqs = [
  {
    question: "What is InternCash?",
    answer:
      "InternCash is VELoop Rewards' internal reward unit. Eligible credits and adjustments are recorded in your wallet ledger.",
  },
  {
    question: "Is InternCash the same as a bank or UPI balance?",
    answer:
      "No. InternCash is an internal reward unit, not a bank deposit or UPI payment balance. Its displayed rupee equivalent is informational only and does not guarantee cash conversion or withdrawal.",
  },
  {
    question: "How do attendance rewards work?",
    answer:
      "Under the current rules shown here, first attendance earns +1 IC after admin approval, and re-attendance earns +3 IC after admin approval. The wallet ledger shows credits that have actually been recorded.",
  },
  {
    question: "How do I receive the project submission reward?",
    answer:
      "After you submit your project, an admin may share a promo code associated with a reward of 60–140 IC. Follow the instructions provided by the admin and redeem the code according to its validity and eligibility rules. The reward is not credited just because this information is displayed here.",
  },
  {
    question: "Why is my attendance still pending?",
    answer:
      "Your attendance may be waiting for administrative review. A pending status is not a confirmed credit. Check your notifications and the instructions from your internship administrator for updates.",
  },
  {
    question: "Why has my wallet balance not changed?",
    answer:
      "Some rewards depend on approval or promo-code redemption. Refresh the wallet and review your transaction ledger. If the credit is still missing, contact the official internship administration team with the relevant details.",
  },
  {
    question: "What if a transaction looks incorrect?",
    answer:
      "Keep the transaction date, amount, description, and reference if available, then contact the internship administration team for a review. Never share your password or OTP.",
  },
];

export default function RewardsPage({ data }) {
  const {
    session,
    wallet,
    refreshing,
    refresh,
    notify,
    records = [],
    notifications = [],
    markRead,
  } = data;

  const [searchQuery, setSearchQuery] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const [mapOpen, setMapOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const {
    milestones,
    loading: mapLoading,
    error: mapError,
    refresh: refreshMap,
  } = useRewardMap({
    wallet,
    records,
  });

  const transactions = useMemo(
    () =>
      [...(wallet?.transactions || [])].sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime(),
      ),
    [wallet?.transactions],
  );

  const balance = getAmount(wallet?.balance);
  const conversion = getAmount(wallet?.conversion ?? 0.5);
  const indicativeValue = balance * conversion;

  const stats = useMemo(
    () =>
      transactions.reduce(
        (result, transaction) => {
          const amount = getAmount(transaction?.amount);

          if (amount > 0) {
            result.credits += amount;
            result.creditCount += 1;
          } else if (amount < 0) {
            result.debits += Math.abs(amount);
            result.debitCount += 1;
          }

          return result;
        },
        { credits: 0, debits: 0, creditCount: 0, debitCount: 0 },
      ),
    [transactions],
  );

  const attendanceRecords = Array.isArray(records) ? records : [];

  const pendingRecords = useMemo(
    () =>
      attendanceRecords.filter((record) =>
        pendingStatuses.has(getRecordStatus(record)),
      ),
    [attendanceRecords],
  );

  const approvedRecords = useMemo(
    () =>
      attendanceRecords.filter((record) =>
        approvedStatuses.has(getRecordStatus(record)),
      ),
    [attendanceRecords],
  );

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const amount = getAmount(transaction?.amount);

      const matchesFilter =
        transactionFilter === "all" ||
        (transactionFilter === "credits" && amount > 0) ||
        (transactionFilter === "debits" && amount < 0);

      const searchableText = [
        transaction?.description,
        transaction?.type,
        transaction?.reference,
        transaction?.amount,
        formatDate(transaction?.createdAt),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchableText.includes(query));
    });
  }, [transactions, transactionFilter, searchQuery]);

  const visibleTransactions = showAllTransactions
    ? filteredTransactions
    : filteredTransactions.slice(0, 5);

  const unreadNotifications = notifications.filter(
    (item) => !item?.read && !item?.isRead && !item?.readAt,
  );

  const visibleNotifications = showAllNotifications
    ? notifications
    : notifications.slice(0, 3);

  const handleRefresh = async () => {
    try {
      await refresh?.(true);
      await refreshMap?.();
    } catch {
      notify?.(
        "Unable to refresh your wallet and reward map. Please try again.",
      );
    }
  };

  const handleNotificationClick = (notification) => {
    const id = notification?._id ?? notification?.id;

    if (id && typeof markRead === "function") {
      markRead(id);
    }
  };

  return (
    <div className="rewards-page space-y-6 pb-8">
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-800 sm:text-[11px]">
            <Sparkles size={13} />
            VELoop Rewards · InternCash
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Your reward wallet
          </h1>

          <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
            Track your earned credits, follow approval updates, and keep every
            recorded transaction transparent.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh wallet"}
        </button>
      </header>

      {/* Main fintech wallet card */}

      <section className="wallet-hero group relative isolate overflow-hidden rounded-[30px] border border-violet-400/20 bg-gradient-to-br from-[#171022] via-[#29183F] to-[#48265F] p-5 text-white shadow-[0_24px_70px_rgba(35,16,52,0.32)] sm:p-7 lg:p-8">
        {/* Ambient plum and gold lighting */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(196,145,65,0.20),transparent_36%),radial-gradient(ellipse_at_5%_100%,rgba(139,92,246,0.18),transparent_42%)]" />

        <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-fuchsia-400/15 blur-[90px] transition-transform duration-700 group-hover:scale-110" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-violet-500/15 blur-[85px]" />

        {/* Decorative orbit rings */}
        <div className="pointer-events-none absolute -right-16 top-10 -z-10 size-64 rounded-full border border-amber-200/[0.12] sm:right-0 sm:size-80" />
        <div className="pointer-events-none absolute -right-5 top-20 -z-10 size-48 rounded-full border border-white/[0.08] sm:right-14 sm:size-56" />
        <div className="pointer-events-none absolute right-20 top-28 -z-10 size-28 rounded-full border border-violet-200/[0.10]" />

        <div className="relative">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="relative flex size-13 shrink-0 items-center justify-center rounded-[18px] border border-amber-200/20 bg-gradient-to-br from-amber-200/20 to-white/[0.04] text-amber-200 shadow-[0_8px_25px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                <Wallet size={25} strokeWidth={1.8} />
                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#29183F] bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-black tracking-tight text-white sm:text-lg">
                    InternCash
                  </p>
                  <span className="rounded-md border border-amber-200/20 bg-amber-200/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-amber-200">
                    Rewards
                  </span>
                </div>
                <p className="mt-1 text-xs text-violet-100/65">
                  Your internal rewards wallet
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-black/15 px-3.5 py-2 text-[10px] font-bold text-amber-100/90 shadow-sm backdrop-blur-xl sm:text-xs">
              <ShieldCheck size={15} className="text-amber-300" />
              Ledger-backed
              <span className="size-1 rounded-full bg-amber-300" />
            </div>
          </div>

          {/* Main balance */}
          <div className="mt-9 grid gap-7 lg:mt-11 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-100/65 sm:text-xs">
                  Available balance
                </p>

                <span className="h-px w-8 bg-amber-200/35" />

                <button
                  type="button"
                  onClick={() => setShowBalance((value) => !value)}
                  aria-label={
                    showBalance ? "Hide wallet balance" : "Show wallet balance"
                  }
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-violet-100/75 transition hover:border-amber-200/30 hover:bg-amber-200/10 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                >
                  {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="break-words text-4xl font-black leading-none tracking-[-0.055em] text-white [text-shadow:0_4px_28px_rgba(196,145,65,0.15)] tabular-nums sm:text-5xl lg:text-6xl">
                  {showBalance ? balance.toLocaleString("en-IN") : "••••••"}
                </h2>

                <span className="text-sm font-black tracking-wide text-amber-200">
                  IC
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  notify?.(
                    `Indicative display equivalent: ₹${money(indicativeValue)}. InternCash is not a bank or UPI balance and this value does not guarantee cash conversion.`,
                  )
                }
                className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-lg text-left text-xs font-medium text-violet-100/65 underline decoration-amber-200/25 underline-offset-4 transition hover:text-amber-100"
              >
                <Info size={13} className="shrink-0 text-amber-300/80" />
                Indicative value:
                <span className="font-bold text-amber-100/90">
                  {showBalance ? `₹${money(indicativeValue)}` : "••••"}
                </span>
              </button>
            </div>

            {/* Decorative reward coin */}
            <div className="hidden lg:flex lg:items-center lg:justify-center lg:pb-1 lg:pr-5">
              <div className="relative flex size-28 items-center justify-center rounded-full border border-amber-200/25 bg-gradient-to-br from-amber-100/[0.14] via-white/[0.04] to-transparent shadow-[0_0_55px_rgba(196,145,65,0.10)]">
                <div className="absolute inset-2 rounded-full border border-dashed border-amber-200/25" />
                <div className="flex size-[68px] items-center justify-center rounded-full border border-amber-200/40 bg-gradient-to-br from-[#F8E2A1] via-[#D6AA54] to-[#9D6A2C] text-[#392044] shadow-[0_5px_25px_rgba(214,170,84,0.24)]">
                  <Coins size={32} strokeWidth={1.7} />
                </div>
                <Sparkles
                  size={15}
                  className="absolute right-2 top-3 text-amber-200"
                />
                <Sparkles
                  size={11}
                  className="absolute bottom-4 left-1 text-violet-200"
                />
              </div>
            </div>
          </div>

          {/* Financial activity statistics */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="group/stat relative overflow-hidden rounded-[20px] border border-white/[0.11] bg-white/[0.055] p-4 backdrop-blur-xl transition duration-300 hover:border-amber-200/25 hover:bg-white/[0.085]">
              <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-amber-200/[0.07] blur-2xl transition group-hover/stat:bg-amber-200/[0.12]" />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-100/70">
                  <ArrowDownLeft size={16} className="text-amber-300" />
                  Recorded credits
                </div>
                <span className="rounded-lg bg-amber-200/[0.10] p-1.5 text-amber-200">
                  <TrendingUp size={13} />
                </span>
              </div>

              <p className="relative mt-4 text-2xl font-black tracking-tight text-white tabular-nums">
                {showBalance
                  ? `+${stats.credits.toLocaleString("en-IN")}`
                  : "••••"}
                <span className="ml-1.5 text-[11px] font-bold text-amber-200/80">
                  IC
                </span>
              </p>

              <p className="relative mt-1.5 text-[10px] text-violet-100/50">
                {stats.creditCount} credit entries
              </p>

              <div className="relative mt-4 h-0.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-300/70 to-yellow-100/80" />
              </div>
            </div>

            <div className="group/stat relative overflow-hidden rounded-[20px] border border-white/[0.11] bg-white/[0.055] p-4 backdrop-blur-xl transition duration-300 hover:border-fuchsia-200/25 hover:bg-white/[0.085]">
              <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-fuchsia-300/[0.07] blur-2xl" />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-100/70">
                  <ArrowUpRight size={16} className="text-fuchsia-200" />
                  Recorded debits
                </div>
                <span className="rounded-lg bg-fuchsia-200/[0.10] p-1.5 text-fuchsia-200">
                  <Activity size={13} />
                </span>
              </div>

              <p className="relative mt-4 text-2xl font-black tracking-tight text-white tabular-nums">
                {showBalance ? stats.debits.toLocaleString("en-IN") : "••••"}
                <span className="ml-1.5 text-[11px] font-bold text-violet-100/60">
                  IC
                </span>
              </p>

              <p className="relative mt-1.5 text-[10px] text-violet-100/50">
                {stats.debitCount} debit entries
              </p>

              <div className="relative mt-4 h-0.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-fuchsia-300/70 to-violet-200/80" />
              </div>
            </div>

            <div className="group/stat relative overflow-hidden rounded-[20px] border border-white/[0.11] bg-white/[0.055] p-4 backdrop-blur-xl transition duration-300 hover:border-violet-200/25 hover:bg-white/[0.085]">
              <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-violet-300/[0.09] blur-2xl" />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-100/70">
                  <Activity size={16} className="text-violet-200" />
                  Wallet activity
                </div>
                <span className="rounded-lg bg-violet-200/[0.10] p-1.5 text-violet-200">
                  <Clock3 size={13} />
                </span>
              </div>

              <p className="relative mt-4 text-2xl font-black tracking-tight text-white tabular-nums">
                {transactions.length}
                <span className="ml-1.5 text-[11px] font-bold text-violet-100/60">
                  entries
                </span>
              </p>

              <p className="relative mt-1.5 truncate text-[10px] text-violet-100/50">
                {transactions[0]
                  ? `Latest: ${formatDate(transactions[0].createdAt)}`
                  : "No transactions yet"}
              </p>

              <div className="relative mt-4 h-0.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-300/70 to-fuchsia-200/80" />
              </div>
            </div>
          </div>

          {/* Trust and ledger note */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100/[0.13] bg-black/[0.12] px-4 py-3.5 text-xs leading-5 text-violet-100/65">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-200/15 bg-amber-200/[0.08] text-amber-200">
              <LockKeyhole size={14} />
            </span>
            <p>
              <strong className="font-bold text-violet-50/90">
                Clear records. Transparent balance.
              </strong>{" "}
              Your balance reflects recorded ledger entries. InternCash is an
              internal reward unit, not a bank balance, UPI balance, or
              guaranteed cash-out amount.
            </p>
          </div>
        </div>
      </section>

      {/* Pending approvals */}

      <section className="group relative isolate overflow-hidden rounded-[28px] border border-amber-200/80 bg-white shadow-[0_12px_38px_-22px_rgba(180,120,25,0.25)] transition-shadow duration-300 hover:shadow-[0_18px_45px_-22px_rgba(180,120,25,0.32)]">
        {/* Warm light background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#FFFCF3] via-white to-[#FFF7E8]" />
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 size-48 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-40 rounded-full bg-orange-100/40 blur-3xl" />

        <div className="relative p-5 sm:p-6 lg:p-7">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100/70 text-amber-700 shadow-sm sm:size-14">
                <Clock3 size={24} strokeWidth={1.9} />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white">
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-800 shadow-sm">
                  <Sparkles size={11} />
                  Attendance overview
                </div>

                <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  Approval tracker
                </h2>

                <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm">
                  Keep track of attendance records awaiting review and monitor
                  approved records in one place. Pending entries are not
                  confirmed wallet credits.
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-amber-200 bg-white px-3.5 py-2 text-xs font-extrabold text-amber-800 shadow-sm">
              <span className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <CircleAlert size={14} />
              </span>
              {pendingRecords.length} pending
            </span>
          </div>

          {/* Summary statistics */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[20px] border border-amber-200/80 bg-white/90 p-4 shadow-[0_4px_16px_rgba(146,99,21,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md sm:p-5">
              <div className="pointer-events-none absolute -right-7 -top-7 size-24 rounded-full bg-amber-100/60 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Clock3 size={16} />
                    </span>
                    Awaiting review
                  </div>

                  <p className="mt-4 text-3xl font-black tracking-tight text-amber-700 tabular-nums">
                    {pendingRecords.length}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Attendance records awaiting a decision
                  </p>
                </div>

                <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-800">
                  Pending
                </span>
              </div>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-amber-50">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-orange-300" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] border border-violet-200/80 bg-white/90 p-4 shadow-[0_4px_16px_rgba(109,40,217,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md sm:p-5">
              <div className="pointer-events-none absolute -right-7 -top-7 size-24 rounded-full bg-violet-100/60 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <CheckCircle2 size={16} />
                    </span>
                    Approved records
                  </div>

                  <p className="mt-4 text-3xl font-black tracking-tight text-violet-700 tabular-nums">
                    {approvedRecords.length}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Attendance records marked as approved
                  </p>
                </div>

                <span className="rounded-lg border border-violet-100 bg-violet-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-violet-800">
                  Reviewed
                </span>
              </div>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-violet-50">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-300" />
              </div>
            </div>
          </div>

          {/* Pending record list */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                Recent pending records
              </h3>

              <span className="text-[10px] font-semibold text-slate-400">
                Showing up to 3
              </span>
            </div>

            {pendingRecords.length > 0 ? (
              <div className="space-y-2.5">
                {pendingRecords.slice(0, 3).map((record, index) => (
                  <div
                    key={record?._id || record?.id || index}
                    className="group/record flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white/90 p-3.5 transition duration-200 hover:border-amber-300 hover:bg-amber-50/40 sm:px-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 transition-colors group-hover/record:bg-amber-100">
                        <Clock3 size={17} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-800">
                          {record?.description || "Attendance review"}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock3 size={12} className="shrink-0" />
                          {formatDate(getRecordDate(record))}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-extrabold capitalize text-amber-800">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      {getRecordStatus(record).replaceAll("_", " ") ||
                        "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-200 bg-white/80 p-4 sm:p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <CheckCircle2 size={19} />
                </span>

                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    No recognized pending records
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    No attendance records with a recognized pending status were
                    found in the available records. If your backend uses
                    different status values, update the status mapping in this
                    file.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Transparency note */}
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />

            <p className="text-[11px] leading-5 text-slate-600">
              <strong className="font-extrabold text-slate-800">
                Status transparency:
              </strong>{" "}
              Approval status and wallet crediting are separate. Only verified,
              recorded wallet transactions should be treated as confirmed
              credits.
            </p>
          </div>
        </div>
      </section>

      {/* Project submission reward */}

      <section className="group relative isolate overflow-hidden rounded-[28px] border border-violet-200/70 bg-white shadow-[0_12px_40px_-18px_rgba(109,40,217,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-18px_rgba(109,40,217,0.32)]">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-indigo-50/80" />
        <div className="pointer-events-none absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-violet-300/20 blur-3xl transition-all duration-500 group-hover:bg-violet-300/30" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 -z-10 size-52 rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Main information */}
            <div className="min-w-0 flex-1">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-800 shadow-sm">
                  <Sparkles size={13} className="text-violet-600" />
                  Project rewards
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Earn through project submission
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 sm:size-14">
                  <Gift size={25} strokeWidth={1.9} />

                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-amber-950">
                    <Sparkles size={10} />
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="max-w-2xl text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-[28px]">
                    Your project could unlock a reward.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                    Submit your project and watch for a promo code from your
                    admin. Eligible assigned codes may offer a reward worth{" "}
                    <strong className="font-extrabold text-violet-800">
                      60–140 IC.
                    </strong>
                    Follow the admin’s instructions to redeem your code.
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-violet-100/90 bg-white/80 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Check size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">
                      01. Submit
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Send your project
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-violet-100/90 bg-white/80 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <CircleHelp size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">
                      02. Check
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Look for your code
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-violet-100/90 bg-white/80 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Coins size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">
                      03. Redeem
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Follow admin guidance
                    </p>
                  </div>
                </div>
              </div>

              {/* Important clarification */}
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3">
                <Info size={16} className="mt-0.5 shrink-0 text-amber-700" />
                <p className="text-xs leading-5 text-amber-900/80">
                  <strong className="font-extrabold text-amber-950">
                    Please note:
                  </strong>{" "}
                  The reward amount depends on the code assigned to you. This
                  offer does not confirm that your reward has been approved or
                  credited to your wallet.
                </p>
              </div>
            </div>

            {/* Reward showcase */}
            <div className="relative w-full shrink-0 lg:w-[245px]">
              <div className="relative overflow-hidden rounded-[24px] border border-violet-500/30 bg-gradient-to-br from-[#30205D] via-[#4C288D] to-[#30205D] p-5 text-white shadow-xl shadow-violet-900/15 sm:p-6">
                {/* Showcase glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-fuchsia-400/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 size-32 rounded-full bg-indigo-400/25 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-violet-200">
                      Potential reward
                    </span>

                    <span className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-amber-300">
                      <Coins size={19} />
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-4xl font-black tracking-tight text-white sm:text-[42px]">
                      60–140
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-amber-300 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-violet-950">
                      IC
                    </span>
                    <span className="text-xs font-medium text-violet-200">
                      Reward range
                    </span>
                  </div>

                  <div className="my-5 h-px bg-gradient-to-r from-white/30 via-white/15 to-transparent" />

                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <Check size={14} />
                    </span>

                    <p className="text-xs leading-5 text-violet-100">
                      <strong className="font-bold text-white">
                        Code-based reward
                      </strong>
                      <br />
                      Redeem your assigned promo code according to the admin’s
                      instructions.
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-center text-[11px] font-bold text-white/90">
                    <Sparkles size={14} className="text-amber-300" />
                    Your next milestone awaits
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] leading-4 text-slate-500">
                Rewards are subject to assigned codes and applicable
                eligibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive reward journey */}
      <section className="reward-map-section">
        <RewardMapPreview
          milestones={milestones}
          loading={mapLoading}
          onSelect={(milestone) => {
            // Open the map focused on the checkpoint selected in the preview.
            setSelectedMilestone(milestone);
            setMapOpen(true);
          }}
          onExplore={() => {
            // Explore opens the map without preselecting a checkpoint.
            setSelectedMilestone(null);
            setMapOpen(true);
          }}
        />

        <RewardMapModal
          open={mapOpen}
          milestones={milestones}
          loading={mapLoading}
          error={mapError}
          onClose={() => {
            setMapOpen(false);
            setSelectedMilestone(null);
          }}
          onRefresh={refreshMap}
          initialMilestone={selectedMilestone}
        />
      </section>

      {/* Transaction history */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-[#F7F4FF] via-white to-[#F1F7FF] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-700 shadow-sm">
                <History size={21} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                  Transaction history
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Review recorded credits, debits, and wallet adjustments.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold text-violet-800">
              <Activity size={13} />
              {transactions.length} entries
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowAllTransactions(false);
                }}
                placeholder="Search reason, type, reference, or date..."
                aria-label="Search wallet transactions"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              {[
                { value: "all", label: "All" },
                { value: "credits", label: "Credits" },
                { value: "debits", label: "Debits" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setTransactionFilter(filter.value);
                    setShowAllTransactions(false);
                  }}
                  aria-pressed={transactionFilter === filter.value}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    transactionFilter === filter.value
                      ? "bg-indigo-950 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visibleTransactions.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100">
              {visibleTransactions.map((transaction, index) => {
                const amount = getAmount(transaction?.amount);
                const Icon = getTransactionIcon(transaction);

                return (
                  <button
                    key={transaction?._id || transaction?.reference || index}
                    type="button"
                    onClick={() => setSelectedTransaction(transaction)}
                    className="group flex w-full items-center gap-3 px-4 py-4 text-left transition duration-200 hover:bg-violet-50/40 sm:gap-4 sm:px-6"
                  >
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border transition duration-200 group-hover:scale-105 ${
                        amount > 0
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : amount < 0
                            ? "border-rose-100 bg-rose-50 text-rose-600"
                            : "border-slate-100 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold capitalize text-slate-800">
                        {transaction?.description ||
                          transactionType(transaction)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span>{formatDateTime(transaction?.createdAt)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="capitalize">
                          {transactionType(transaction)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-extrabold tabular-nums ${
                          amount > 0
                            ? "text-emerald-700"
                            : amount < 0
                              ? "text-rose-600"
                              : "text-slate-600"
                        }`}
                      >
                        {formatAmount(amount)} IC
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        Balance: {transaction?.balanceAfter ?? "—"} IC
                      </p>
                    </div>

                    <ChevronRight
                      size={16}
                      className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600 sm:block"
                    />
                  </button>
                );
              })}
            </div>

            {filteredTransactions.length > 5 && (
              <div className="border-t border-slate-100 px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllTransactions((value) => !value)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                >
                  {showAllTransactions
                    ? "Show less"
                    : `View all ${filteredTransactions.length} transactions`}
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${
                      showAllTransactions ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="px-5 py-14 text-center sm:px-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-sky-50 text-violet-700">
              {searchQuery ? <Search size={25} /> : <Wallet size={27} />}
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {searchQuery || transactionFilter !== "all"
                ? "No matching transactions"
                : "Your wallet journey starts here"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {searchQuery || transactionFilter !== "all"
                ? "Try another search term or select a different filter."
                : "Approved attendance credits and other recorded wallet activity will appear here."}
            </p>

            {(searchQuery || transactionFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTransactionFilter("all");
                }}
                className="mt-4 rounded-xl border border-violet-100 bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-violet-50"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleTransactions.length} of{" "}
            {filteredTransactions.length} matching entries
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-violet-600" />
            Based on your available wallet ledger
          </span>
        </div>
      </section>

      {/* Transaction details */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-99999 h-full flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTransaction(null)}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ic-transaction-title"
            className="wallet-modal w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#F5F3FF] via-white to-[#EFF6FF] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-800">
                    <ShieldCheck size={12} />
                    Transaction details
                  </div>
                  <h2
                    id="ic-transaction-title"
                    className="mt-3 text-xl font-extrabold text-slate-900"
                  >
                    Wallet activity
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  aria-label="Close transaction details"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <p
                className={`mt-5 text-3xl font-black tabular-nums ${
                  getAmount(selectedTransaction.amount) > 0
                    ? "text-emerald-700"
                    : getAmount(selectedTransaction.amount) < 0
                      ? "text-rose-600"
                      : "text-slate-700"
                }`}
              >
                {formatAmount(selectedTransaction.amount)} IC
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedTransaction.description ||
                  transactionType(selectedTransaction)}
              </p>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {[
                ["Transaction type", transactionType(selectedTransaction)],
                [
                  "Date and time",
                  formatDateTime(selectedTransaction.createdAt),
                ],
                [
                  "Balance after",
                  `${selectedTransaction.balanceAfter ?? "—"} IC`,
                ],
                [
                  "Reference",
                  selectedTransaction.reference ||
                    selectedTransaction._id ||
                    "Not provided",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="max-w-[60%] break-all text-right text-sm font-semibold capitalize text-slate-800">
                    {value}
                  </span>
                </div>
              ))}

              <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/70 p-3 text-xs leading-5 text-violet-900">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                Details are shown from the available wallet transaction record.
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-full rounded-xl bg-indigo-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-900"
              >
                Close details
              </button>
            </div>
          </section>
        </div>
      )}

      {/* FAQs */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-[#F7F4FF] via-white to-[#F1F7FF] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-700 shadow-sm">
              <CircleHelp size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                InternCash FAQs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Straightforward answers about rewards, approvals, and balances.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 px-5 sm:px-6">
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;

            return (
              <div key={faq.question} className="py-1">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-sm font-bold text-slate-800 transition hover:text-violet-800">
                    {faq.question}
                  </span>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition duration-200 ${
                      isOpen
                        ? "rotate-180 bg-violet-50 text-violet-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    <ChevronDown size={17} />
                  </span>
                </button>

                {isOpen && (
                  <p className="wallet-faq-answer pb-4 pr-3 text-sm leading-6 text-slate-500">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust footer */}

      <section className="group relative isolate overflow-hidden rounded-[26px] border border-indigo-200/70 bg-white shadow-[0_10px_35px_-20px_rgba(79,70,229,0.28)] transition-all duration-300 hover:shadow-[0_16px_42px_-18px_rgba(79,70,229,0.3)]">
        {/* Soft gradient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-indigo-50/80" />
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 size-44 rounded-full bg-violet-300/25 blur-3xl transition-colors duration-300 group-hover:bg-violet-300/35" />
        <div className="pointer-events-none absolute -bottom-14 left-1/3 -z-10 size-36 rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {/* Message */}
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-indigo-700 shadow-[0_5px_14px_-6px_rgba(79,70,229,0.3)] sm:size-14">
              <BadgeCheck size={25} strokeWidth={1.9} />

              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                <Check size={10} strokeWidth={3} />
              </span>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-indigo-800">
                  <Sparkles size={11} className="text-violet-600" />
                  Your contribution matters
                </span>
              </div>

              <h3 className="text-base font-black leading-snug tracking-tight text-slate-900 sm:text-lg">
                Every reward starts with your contribution.
              </h3>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm">
                Stay consistent with your assigned work, follow the attendance
                process, and keep an eye on your wallet for verified updates.
                Your progress starts with the work you put in.
              </p>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-indigo-100 bg-white/90 px-4 py-3 shadow-sm sm:self-center">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-700">
              <LockKeyhole size={19} strokeWidth={2} />
            </span>

            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Transparency first
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Clear updates. Verified records.
              </p>
            </div>

            <span className="ml-1 flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={13} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-300 opacity-70" />
      </section>
    </div>
  );
}
