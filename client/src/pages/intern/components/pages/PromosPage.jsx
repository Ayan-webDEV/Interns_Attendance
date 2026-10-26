import React, { useEffect, useMemo, useState } from "react";
import {
  Gift,
  Sparkles,
  ShieldCheck,
  Clock3,
  CalendarDays,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Search,
  RefreshCw,
  Ticket,
  Copy,
  Check,
  History,
  Coins,
  ChevronRight,
  X,
  Info,
  TrendingUp,
  CircleHelp,
  BadgeCheck,
  ReceiptText,
  LockKeyhole,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ");

const getPromoCodeFromTransaction = (transaction) => {
  const directCode =
    transaction?.promoCode ||
    transaction?.promo?.code ||
    transaction?.code ||
    transaction?.metadata?.promoCode ||
    transaction?.metadata?.code;

  if (directCode) return String(directCode).toUpperCase();

  const description = String(transaction?.description || "");

  // Extract a code only when the description explicitly labels it.
  const match = description.match(
    /\b(?:promo(?:\s+code)?|code)\s*[:#=-]\s*([A-Z0-9][A-Z0-9_-]{2,})\b/i,
  );

  return match?.[1]?.toUpperCase() || "";
};

const isPromoTransaction = (transaction) => {
  const type = normalizeText(transaction?.type);
  const description = normalizeText(transaction?.description);

  return (
    type.includes("promo") ||
    description.includes("promo code") ||
    description.includes("promo redemption")
  );
};

export default function PromosPage({ data }) {
  const {
    session,
    notify,
    wallet,
    promoCode,
    setPromoCode,
    redeem,
    refresh,
    refreshing = false,
    busyLabel,
  } = data;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const transactions = wallet?.transactions || [];

  const promoTransactions = useMemo(() => {
    return transactions
      .filter(isPromoTransaction)
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  }, [transactions]);

  const totalPromoRewards = useMemo(
    () =>
      promoTransactions.reduce(
        (total, transaction) =>
          total + Math.max(0, Number(transaction.amount) || 0),
        0,
      ),
    [promoTransactions],
  );

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return promoTransactions;

    return promoTransactions.filter((transaction) => {
      const code = getPromoCodeFromTransaction(transaction);

      return [
        code,
        transaction.description,
        transaction.type,
        transaction.reference,
        formatDateTime(transaction.createdAt),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [promoTransactions, searchQuery]);

  useEffect(() => {
    if (!selectedTransaction) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedTransaction(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTransaction]);

  const handleCopyCode = async (code) => {
    if (!code) {
      notify?.("The promo code is not recorded in this transaction.");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      notify?.("Unable to copy the code. Please copy it manually.");
    }
  };

  const handleRedeem = async (event) => {
    event.preventDefault();

    if (!promoCode.trim()) {
      notify?.("Please enter a promo code.");
      return;
    }

    await redeem(event);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-emerald-200/80 bg-linear-to-br from-[#F0FBF5] via-white to-[#EFF8FF] p-5 shadow-sm sm:p-7 lg:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 -z-10 size-64 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-1/3 -z-10 size-48 rounded-full bg-sky-200/30 blur-3xl"
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
              <Sparkles size={13} />
              VELoop rewards center
            </div>

            <h1 className="max-w-2xl text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Your next reward could be one code away.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Redeem a valid promo code assigned to your internship group and
              review your previous redemptions in one place.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                <ShieldCheck size={15} className="text-emerald-600" />
                Group-specific codes
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                <History size={15} className="text-sky-700" />
                Transparent history
              </span>
            </div>
          </div>

          <div className="relative mx-auto flex size-36 items-center justify-center sm:size-44 lg:mr-5">
            <div className="absolute inset-1 rounded-[2.5rem] rotate-6 bg-emerald-200/50" />
            <div className="absolute inset-2 rounded-[2.25rem] -rotate-3 border border-emerald-100 bg-white/90 shadow-xl" />
            <div className="relative flex size-24 items-center justify-center rounded-[1.75rem] bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-700/20 sm:size-28">
              <Gift size={43} strokeWidth={1.6} />
              <span className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-xl border-2 border-white bg-amber-300 text-amber-950 shadow-md">
                <Sparkles size={17} />
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <SummaryCard
          icon={Wallet}
          label="Current balance"
          value={`${formatAmount(wallet?.balance)} IC`}
          description="Your available InternCash"
          color="emerald"
        />
        <SummaryCard
          icon={Ticket}
          label="Promo redemptions"
          value={promoTransactions.length}
          description="Matching entries in your wallet ledger"
          color="sky"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Promo rewards credited"
          value={`+${formatAmount(totalPromoRewards)} IC`}
          description="Positive promo-related transactions"
          color="violet"
        />
      </section>

      {/* Redemption form */}
      <section className="group relative mt-10 isolate overflow-hidden rounded-[28px] border border-emerald-300/50 bg-linear-to-br from-[#063F35] via-[#087F68] to-[#0E9F83] text-white shadow-[0_18px_55px_rgba(5,105,82,0.18)] transition-shadow duration-300 hover:shadow-[0_24px_65px_rgba(5,105,82,0.26)]">
        {/* Ambient background effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-emerald-300/20 blur-3xl transition-transform duration-700 group-hover:scale-125"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/4 -z-10 size-72 rounded-full bg-teal-300/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.12),transparent_32%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.035)_45%,transparent_75%)]"
        />

        <div className="relative grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_0.78fr] lg:gap-10 lg:p-9">
          {/* Main redemption area */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-50 shadow-sm backdrop-blur-md sm:text-xs">
              <Sparkles size={14} className="text-amber-300" />
              Exclusive intern rewards
            </div>

            <div className="mt-8 flex items-start gap-3.5 sm:gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-amber-200 shadow-inner backdrop-blur-md transition duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:size-14">
                <Gift size={27} strokeWidth={1.7} />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Redeem a promo code
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-emerald-50/85 sm:text-[15px] sm:leading-7">
                  Got a code from your internship administrator? Enter it below
                  and unlock the reward assigned to your group.
                </p>
              </div>
            </div>

            <form onSubmit={handleRedeem} className="mt-7 space-y-3.5">
              <label
                htmlFor="promo-code-input"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-emerald-50/90"
              >
                Your promo code
              </label>

              <div className="group/input relative rounded-2xl p-px transition duration-300 focus-within:bg-linear-to-r focus-within:from-amber-300 focus-within:via-white focus-within:to-emerald-200">
                <div className="relative flex items-center rounded-2xl border border-white/20 bg-[#063F35]/70 transition duration-300 focus-within:border-transparent focus-within:bg-[#04382F] focus-within:ring-4 focus-within:ring-white/10">
                  <Ticket
                    size={20}
                    className="ml-4 shrink-0 text-emerald-200 transition-colors group-focus-within/input:text-amber-300"
                  />

                  <input
                    id="promo-code-input"
                    name="promoCode"
                    type="text"
                    required
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={80}
                    value={promoCode}
                    onChange={(event) =>
                      setPromoCode(event.target.value.toUpperCase())
                    }
                    placeholder="ENTER-YOUR-CODE"
                    aria-describedby="promo-code-help"
                    className="h-14.5 min-w-0 flex-1 bg-transparent px-3 text-sm font-extrabold tracking-widest text-white outline-none placeholder:font-semibold placeholder:tracking-[0.04em] placeholder:text-emerald-100/40 sm:text-base"
                  />

                  {promoCode && (
                    <button
                      type="button"
                      onClick={() => setPromoCode("")}
                      aria-label="Clear promo code"
                      className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-xl text-emerald-100/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
              </div>

              <p
                id="promo-code-help"
                className="flex items-start gap-2 text-xs leading-5 text-emerald-50/75"
              >
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                Your code is automatically converted to uppercase.
              </p>

              <button
                type="submit"
                disabled={!promoCode.trim() || Boolean(busyLabel)}
                className="group/button relative inline-flex min-h-13 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-linear-to-r from-amber-300 via-yellow-300 to-amber-200 px-5 py-3 text-sm font-extrabold text-emerald-950 shadow-[0_7px_22px_rgba(253,224,71,0.17)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(253,224,71,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto sm:min-w-56"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover/button:translate-x-full"
                />

                <span className="relative inline-flex items-center gap-2 w-65 justify-center">
                  {busyLabel ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Validating code...
                    </>
                  ) : (
                    <>
                      <Gift size={17} />
                      Redeem my reward
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-200 group-hover/button:translate-x-1"
                      />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Redemption guidance panel */}
          <aside className="relative self-stretch overflow-hidden rounded-2xl border border-white/20 bg-[#042F2A]/35 p-5 shadow-inner backdrop-blur-sm sm:p-6 lg:flex lg:flex-col lg:justify-between">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full border border-white/[0.07]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -top-2 size-24 rounded-full border border-white/[0.07]"
            />

            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <ShieldCheck size={18} className="text-emerald-200" />
                How it works
              </div>

              <div className="mt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-extrabold text-amber-200">
                    01
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Enter your code
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-50/70">
                      Use the exact promo code shared with your group.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-extrabold text-amber-200">
                    02
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Redeem securely
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-50/70">
                      The system checks the code's validity, group, and
                      redemption eligibility.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-extrabold text-amber-200">
                    03
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Check your wallet
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-50/70">
                      Review your recorded transaction and any credited
                      InternCash.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/6 p-3.5">
              <LockKeyhole
                size={17}
                className="mt-0.5 shrink-0 text-emerald-200"
              />
              <div>
                <p className="text-xs font-bold text-white">
                  A quick eligibility reminder
                </p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-50/70">
                  Codes must be active, available to your group, and unused by
                  you. The reward depends on the code's configured terms.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Redemption history */}

      <section className="overflow-hidden mt-14 rounded-3xl border border-emerald-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        {/* Premium light gradient header */}
        <div className="relative overflow-hidden border-b border-emerald-100/80 bg-linear-to-br from-[#F7FFFB] via-[#F0FDF8] to-[#E0F9EF] p-5 sm:p-7">
          {/* Soft decorative glows */}
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-1/4 size-40 rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white/90 text-emerald-700 shadow-sm sm:size-14">
                  <History size={23} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                    Redemption history
                  </h2>

                  <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-600">
                    Review your recorded promo transactions and reward details,
                    all in one place.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Reward Activity
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                      <ShieldCheck size={14} className="text-amber-500" />
                      Group-specific codes
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                      <History size={14} className="text-sky-600" />
                      Transparent history
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => refresh?.(true)}
                disabled={refreshing}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-emerald-200/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-sm"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh history"}
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-6">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by code, description, or date..."
                aria-label="Search promo redemption history"
                className="h-12 w-full rounded-xl border border-emerald-100 bg-white/90 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-emerald-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>
        </div>

        {/* Redemption transaction list */}
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 bg-white">
            {filteredTransactions.map((transaction, index) => (
              <RedemptionRow
                key={transaction._id || transaction.reference || index}
                transaction={transaction}
                onClick={() => setSelectedTransaction(transaction)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-linear-to-b from-white to-slate-50/70 px-5 py-14 text-center sm:px-8 sm:py-16">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-sky-50 text-emerald-700 shadow-sm">
              {searchQuery ? <Search size={26} /> : <Ticket size={27} />}
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              {searchQuery
                ? "No matching redemptions"
                : "No promo redemptions found"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {searchQuery
                ? "Try a different search term."
                : "Once a promo redemption is recorded in your wallet ledger, matching transactions will appear here."}
            </p>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredTransactions.length} of {promoTransactions.length} matching
            wallet entries
          </span>

          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            Based on your available wallet ledger
          </span>
        </div>
      </section>

      {/* Redemption details modal */}
      {selectedTransaction && (
        <RedemptionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onCopy={handleCopyCode}
          copiedCode={copiedCode}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, description, color }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">
            {label}
          </p>
          <p className="mt-2 wrap-break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
            {description}
          </p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition group-hover:scale-105 ${colors[color]}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </article>
  );
}

function Guideline({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-xs leading-5 text-emerald-950/80">
      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-700" />
      <span>{children}</span>
    </li>
  );
}

function RedemptionRow({ transaction, onClick }) {
  const code = getPromoCodeFromTransaction(transaction);
  const amount = Number(transaction.amount) || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full p-4 text-left transition hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:p-5"
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 transition group-hover:scale-105 sm:size-12">
          <Ticket size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="wrap-break-words text-sm font-bold text-slate-900 sm:text-[15px]">
                {code || "Promo redemption"}
              </h3>

              <p className="mt-1 wrap-break-words text-xs leading-5 text-slate-500 sm:text-sm">
                {transaction.description || "Promo-related wallet transaction"}
              </p>
            </div>

            <span
              className={`shrink-0 text-sm font-extrabold ${
                amount > 0
                  ? "text-emerald-700"
                  : amount < 0
                    ? "text-rose-600"
                    : "text-slate-600"
              }`}
            >
              {amount > 0 ? "+" : ""}
              {formatAmount(amount)} IC
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <CalendarDays size={13} />
              {formatDateTime(transaction.createdAt)}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 transition group-hover:gap-2">
              View details
              <ChevronRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function RedemptionModal({ transaction, onClose, onCopy, copiedCode }) {
  const code = getPromoCodeFromTransaction(transaction);
  const amount = Number(transaction.amount) || 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-detail-title"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-sky-50 p-5 sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-emerald-200/40 blur-3xl"
          />

          <div className="relative flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
              <ReceiptText size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                <BadgeCheck size={12} />
                Transaction details
              </span>

              <h2
                id="promo-detail-title"
                className="mt-2 wrap-break-words text-xl font-extrabold tracking-tight text-slate-900"
              >
                {code || "Promo redemption"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Complete details from the recorded wallet transaction.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close transaction details"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-7">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Recorded transaction amount
            </p>

            <p
              className={`mt-2 text-3xl font-extrabold tracking-tight ${
                amount >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {amount > 0 ? "+" : ""}
              {formatAmount(amount)} IC
            </p>

            <p className="mt-1 text-xs text-slate-500">
              InternCash ledger amount; not a separate cash payout.
            </p>
          </div>

          {code ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Promo code
              </p>

              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-50 px-3 py-3 font-mono text-sm font-extrabold tracking-wider text-slate-900">
                  {code}
                </code>

                <button
                  type="button"
                  onClick={() => onCopy(code)}
                  aria-label="Copy promo code"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {copiedCode ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Info size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Promo code not present in ledger details
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  The transaction contains no recognizable promo-code field. The
                  code cannot be determined from the available data.
                </p>
              </div>
            </div>
          )}

          <DetailRow
            icon={CalendarDays}
            label="Recorded date and time"
            value={formatDateTime(transaction.createdAt)}
          />

          <DetailRow
            icon={Coins}
            label="Transaction type"
            value={String(transaction.type || "Not specified").replaceAll(
              "_",
              " ",
            )}
          />

          <DetailRow
            icon={ReceiptText}
            label="Description"
            value={transaction.description || "No description recorded"}
          />

          <DetailRow
            icon={Wallet}
            label="Balance after transaction"
            value={
              transaction.balanceAfter != null
                ? `${formatAmount(transaction.balanceAfter)} IC`
                : "Not available"
            }
          />

          <DetailRow
            icon={ShieldCheck}
            label="Transaction reference"
            value={transaction.reference || transaction._id || "Not available"}
          />
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white p-4 sm:px-7 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 sm:p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1.5 wrap-break-words text-sm font-semibold capitalize leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}
