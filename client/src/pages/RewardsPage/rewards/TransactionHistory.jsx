import React, { useCallback, useMemo, useState } from "react";

import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Coins,
  Gift,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
  X,
} from "lucide-react";

import TransactionDetailsModal from "./TransactionDetailsModal";
import styles from "./TransactionHistory.module.css";

/* =========================================================
   HELPERS
========================================================= */

const EMPTY_TRANSACTIONS = [];

const toNumber = (value) => {
  if (value && typeof value === "object") {
    value =
      value.$numberDecimal ?? value.$numberInt ?? value.value ?? value.amount;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const getRawAmount = (transaction) =>
  transaction?.amount ??
  transaction?.value ??
  transaction?.coins ??
  transaction?.rewardAmount ??
  transaction?.netAmount ??
  null;

const getTransactionType = (transaction) =>
  String(
    transaction?.type ??
      transaction?.transactionType ??
      transaction?.category ??
      transaction?.entryType ??
      transaction?.action ??
      transaction?.direction ??
      "transaction",
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/**
 * Keep the amount's original sign.
 * If the server sends a positive amount for a debit,
 * use the transaction type/direction to normalize it.
 */
const getAmount = (transaction) => {
  const raw = toNumber(getRawAmount(transaction));

  if (raw === null) return null;

  const type = getTransactionType(transaction);

  const isDebit =
    type.includes("debit") ||
    type.includes("withdraw") ||
    type.includes("deduction") ||
    type.includes("spent") ||
    type.includes("purchase") ||
    type.includes("expense");

  return isDebit ? -Math.abs(raw) : raw;
};

const getType = (transaction) =>
  getTransactionType(transaction)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getDate = (transaction) =>
  transaction?.createdAt ??
  transaction?.date ??
  transaction?.timestamp ??
  transaction?.updatedAt ??
  transaction?.transactionDate ??
  null;

const getReference = (transaction) =>
  transaction?.reference ??
  transaction?.referenceId ??
  transaction?.transactionId ??
  transaction?.transactionRef ??
  transaction?.referenceNumber ??
  transaction?._id ??
  transaction?.id ??
  "";

const getDescription = (transaction) =>
  transaction?.description ??
  transaction?.remarks ??
  transaction?.reason ??
  transaction?.title ??
  transaction?.note ??
  transaction?.message ??
  getType(transaction);

const getBalanceAfter = (transaction) =>
  transaction?.balanceAfter ??
  transaction?.walletBalanceAfter ??
  transaction?.newBalance ??
  transaction?.balance ??
  transaction?.availableBalanceAfter ??
  null;

const getStatus = (transaction) =>
  transaction?.status ??
  transaction?.state ??
  transaction?.approvalStatus ??
  transaction?.transactionStatus ??
  null;

const getTransactionId = (transaction, index) =>
  String(
    transaction?._id ??
      transaction?.id ??
      transaction?.reference ??
      transaction?.transactionId ??
      `${getDate(transaction) ?? "transaction"}-${index}`,
  );

function formatNumber(value) {
  const number = toNumber(value);

  if (number === null) return "—";

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatAmount(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = toNumber(value);

  if (amount === null) return "—";

  const formatted = Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  if (amount > 0) return `+${formatted}`;

  if (amount < 0) return `-${formatted}`;

  return formatted;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  let date;

  if (typeof value === "number") {
    // Support both Unix seconds and milliseconds.
    date = new Date(value < 1000000000000 ? value * 1000 : value);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIcon(transaction, amount) {
  const type = getTransactionType(transaction);

  if (type.includes("attendance")) return CalendarDays;
  if (type.includes("referral")) return Gift;
  if (type.includes("promo")) return Ticket;
  if (type.includes("bonus") || type.includes("reward")) {
    return Sparkles;
  }

  if (amount !== null && amount < 0) {
    return ArrowUpRight;
  }

  if (type.includes("withdraw")) {
    return ArrowUpRight;
  }

  return Coins;
}

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function statusLabel(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getSearchText(transaction) {
  const searchableValues = [
    getDescription(transaction),
    getType(transaction),
    getReference(transaction),
    getRawAmount(transaction),
    getBalanceAfter(transaction),
    getDate(transaction),
    formatDate(getDate(transaction)),
    getStatus(transaction),
    transaction?.internId,
    transaction?.source,
    transaction?.metadata?.description,
    transaction?.metadata?.reference,
  ];

  return searchableValues
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value))
    .join(" ")
    .toLowerCase();
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TransactionHistory({
  transactions = EMPTY_TRANSACTIONS,
  showBalance = true,
  notify,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const safeTransactions = Array.isArray(transactions)
    ? transactions
    : EMPTY_TRANSACTIONS;

  /* -------------------------------------------------------
     FILTER TRANSACTIONS
  ------------------------------------------------------- */

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return safeTransactions.filter((transaction) => {
      if (!transaction || typeof transaction !== "object") {
        return false;
      }

      const amount = getAmount(transaction);

      const matchesFilter =
        filter === "all" ||
        (filter === "credits" && amount !== null && amount > 0) ||
        (filter === "debits" && amount !== null && amount < 0);

      if (!matchesFilter) return false;

      if (!query) return true;

      return getSearchText(transaction).includes(query);
    });
  }, [safeTransactions, searchQuery, filter]);

  /* -------------------------------------------------------
     TRANSACTION COUNTS
  ------------------------------------------------------- */

  const counts = useMemo(() => {
    let credits = 0;
    let debits = 0;
    let creditAmount = 0;
    let debitAmount = 0;

    safeTransactions.forEach((transaction) => {
      const amount = getAmount(transaction);

      if (amount === null) return;

      if (amount > 0) {
        credits += 1;
        creditAmount += amount;
      } else if (amount < 0) {
        debits += 1;
        debitAmount += Math.abs(amount);
      }
    });

    return {
      credits,
      debits,
      creditAmount,
      debitAmount,
    };
  }, [safeTransactions]);

  /* -------------------------------------------------------
     VISIBLE RECORDS
  ------------------------------------------------------- */

  const visibleTransactions = showAll
    ? filteredTransactions
    : filteredTransactions.slice(0, 6);

  /* -------------------------------------------------------
     HANDLERS
  ------------------------------------------------------- */

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setFilter("all");
    setShowAll(false);
  }, []);

  const closeTransaction = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setShowAll(false);
  };

  const handleFilter = (value) => {
    setFilter(value);
    setShowAll(false);
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <>
      <section
        className={`${styles.section} overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm`}
        aria-labelledby="transaction-history-heading"
      >
        {/* Heading */}

        <div className="border-b border-slate-100 bg-gradient-to-br from-[#F7F4FF] via-white to-[#F1F7FF] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-700 shadow-sm">
                <History size={21} />
              </div>

              <div className="min-w-0">
                <h2
                  id="transaction-history-heading"
                  className="text-lg font-extrabold text-slate-900 sm:text-xl"
                >
                  Transaction history
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Every recorded credit, debit and wallet adjustment, in one
                  transparent ledger.
                </p>
              </div>
            </div>

            <span className={styles.entryCount}>
              <Activity size={13} />
              {safeTransactions.length} entries
            </span>
          </div>

          {/* Search and filters */}

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className={styles.searchBox}>
              <Search size={16} aria-hidden="true" />

              <input
                type="search"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search description, type, reference, or date..."
                aria-label="Search wallet transactions"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear transaction search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div
              className={styles.filterGroup}
              role="group"
              aria-label="Filter wallet transactions"
            >
              {[
                {
                  value: "all",
                  label: "All",
                  count: safeTransactions.length,
                },
                {
                  value: "credits",
                  label: "Credits",
                  count: counts.credits,
                },
                {
                  value: "debits",
                  label: "Debits",
                  count: counts.debits,
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={filter === item.value ? styles.filterActive : ""}
                >
                  {item.label}
                  <span className="ml-1 opacity-70">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary strip */}

        {safeTransactions.length > 0 && (
          <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-3">
            <div className="bg-white px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total credits
              </p>

              <p className="mt-1 text-base font-black tabular-nums text-emerald-700">
                +{formatNumber(counts.creditAmount)} IC
              </p>
            </div>

            <div className="bg-white px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total debits
              </p>

              <p className="mt-1 text-base font-black tabular-nums text-rose-600">
                -{formatNumber(counts.debitAmount)} IC
              </p>
            </div>

            <div className="col-span-2 bg-white px-4 py-3 sm:col-span-1 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Matching entries
              </p>

              <p className="mt-1 text-base font-black tabular-nums text-slate-800">
                {filteredTransactions.length}
              </p>
            </div>
          </div>
        )}

        {/* Transaction records */}

        {visibleTransactions.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100">
              {visibleTransactions.map((transaction, index) => {
                const amount = getAmount(transaction);
                const balanceAfter = getBalanceAfter(transaction);
                const status = getStatus(transaction);

                const Icon = getIcon(transaction, amount);

                const isCredit = amount !== null && amount > 0;
                const isDebit = amount !== null && amount < 0;

                return (
                  <button
                    key={getTransactionId(transaction, index)}
                    type="button"
                    onClick={() => setSelectedTransaction(transaction)}
                    aria-label={`View transaction: ${getDescription(transaction)}`}
                    aria-haspopup="dialog"
                    className={`${styles.transactionRow} group`}
                  >
                    {/* Type icon */}

                    <span
                      className={`${styles.transactionIcon} ${
                        isCredit
                          ? styles.creditIcon
                          : isDebit
                            ? styles.debitIcon
                            : styles.neutralIcon
                      }`}
                    >
                      <Icon size={19} />
                    </span>

                    {/* Description and date */}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold capitalize text-slate-800">
                        {getDescription(transaction)}
                      </span>

                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span>{formatDate(getDate(transaction))}</span>

                        <span className="text-slate-300">•</span>

                        <span className="capitalize">
                          {getType(transaction)}
                        </span>
                      </span>

                      {status && (
                        <span className="mt-1.5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                          {statusLabel(status)}
                        </span>
                      )}
                    </span>

                    {/* Amount and optional balance */}

                    <span className="shrink-0 text-right">
                      <span
                        className={`block text-sm font-black tabular-nums ${
                          isCredit
                            ? "text-emerald-700"
                            : isDebit
                              ? "text-rose-600"
                              : "text-slate-600"
                        }`}
                      >
                        {amount === null ? "—" : `${formatAmount(amount)} IC`}
                      </span>

                      {showBalance && (
                        <span className="mt-1 block text-[10px] font-medium text-slate-400">
                          Balance:{" "}
                          {balanceAfter == null
                            ? "—"
                            : `${formatNumber(balanceAfter)} IC`}
                        </span>
                      )}
                    </span>

                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600 sm:block"
                    />
                  </button>
                );
              })}
            </div>

            {/* Show all */}

            {filteredTransactions.length > 6 && (
              <div className="border-t border-slate-100 px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className={styles.viewAll}
                  aria-expanded={showAll}
                >
                  {showAll
                    ? "Show fewer transactions"
                    : `View all ${filteredTransactions.length} transactions`}

                  <ChevronDown
                    size={15}
                    className={showAll ? "rotate-180" : ""}
                  />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty state */

          <div className="px-5 py-14 text-center sm:px-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-sky-50 text-violet-700">
              {searchQuery || filter !== "all" ? (
                <Search size={25} />
              ) : (
                <Wallet size={27} />
              )}
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              {safeTransactions.length === 0
                ? "No wallet transactions yet"
                : "No matching transactions"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {safeTransactions.length === 0
                ? "Your verified attendance credits and other recorded wallet activity will appear here."
                : "Try another search term or select a different transaction filter."}
            </p>

            {(searchQuery || filter !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-violet-100 bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-violet-50"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Footer */}

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

      {/* Transaction details modal */}

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={closeTransaction}
          notify={notify}
          showBalance={showBalance}
        />
      )}
    </>
  );
}
