import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  Copy,
  ExternalLink,
  FileText,
  Gift,
  History,
  Info,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import { api } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";
import styles from "./Promos.module.css";

/* =========================================================
   HELPERS
========================================================= */

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

  if (directCode) {
    return String(directCode).toUpperCase();
  }

  const description = String(transaction?.description || "");

  // Supports the description produced by the current backend:
  // "Promo code ABC123 redemption"
  const descriptionMatch = description.match(
    /\bpromo\s+code\s+([A-Z0-9][A-Z0-9_-]{2,})\b/i,
  );

  if (descriptionMatch) {
    return descriptionMatch[1].toUpperCase();
  }

  // Also supports older, explicitly labelled descriptions.
  const labelledMatch = description.match(
    /\b(?:promo(?:\s+code)?|code)\s*[:#=-]\s*([A-Z0-9][A-Z0-9_-]{2,})\b/i,
  );

  return labelledMatch?.[1]?.toUpperCase() || "";
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

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Promos({ user }) {
  const notify = useToast();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState({
    balance: user?.internCashBalance ?? 0,
    conversion: 0.5,
    transactions: [],
  });

  const [promoCode, setPromoCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const transactions = wallet?.transactions || [];

  /*
   * Load the wallet ledger.
   *
   * The backend returns:
   * { balance, conversion, transactions }
   *
   * This keeps the page connected to the authoritative ledger.
   */
  const loadWallet = useCallback(
    async ({ manualRefresh = false, quiet = false } = {}) => {
      if (!quiet) {
        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      try {
        const response = await api("/wallet/mine");

        setWallet({
          balance: response.balance ?? 0,
          conversion: response.conversion ?? 0.5,
          transactions: Array.isArray(response.transactions)
            ? response.transactions
            : [],
        });

        setLoadError("");

        if (manualRefresh && !quiet) {
          notify("Wallet and redemption history refreshed.");
        }

        return response;
      } catch (error) {
        setLoadError(error.message || "Unable to load your wallet history.");

        if (!quiet) {
          notify(
            error.message || "Unable to load your wallet history.",
            "error",
          );
        }

        throw error;
      } finally {
        if (!quiet) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    loadWallet().catch(() => {});
  }, [loadWallet]);

  /* =======================================================
     PROMO TRANSACTION SUMMARY
  ======================================================= */

  const promoTransactions = useMemo(
    () =>
      transactions
        .filter(isPromoTransaction)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        ),
    [transactions],
  );

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

  /* =======================================================
     REDEEM CODE
  ======================================================= */

  const handleRedeem = async (event) => {
    event.preventDefault();

    const normalizedCode = promoCode.trim().toUpperCase();

    if (!normalizedCode) {
      notify("Please enter a promo code.", "error");
      return;
    }

    if (redeeming) return;

    setRedeeming(true);

    try {
      const result = await api("/promo-codes/redeem", {
        method: "POST",
        body: { code: normalizedCode },
      });

      setPromoCode("");

      notify(
        result.message ||
          `Promo code redeemed successfully. You received ${
            result.reward ?? 0
          } InternCash.`,
      );

      /*
       * Refresh the authoritative wallet balance and ledger
       * after redemption.
       */
      try {
        await loadWallet({ quiet: true });
      } catch {
        // Redemption already succeeded. The next refresh can
        // retrieve the latest wallet ledger.
      }
    } catch (error) {
      notify(error.message || "Unable to redeem this promo code.", "error");
    } finally {
      setRedeeming(false);
    }
  };

  /* =======================================================
     COPY CODE
  ======================================================= */

  const handleCopyCode = async (code) => {
    if (!code) {
      notify("The promo code is not recorded in this transaction.", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      notify("Promo code copied.");
    } catch {
      notify("Unable to copy the code. Please copy it manually.", "error");
    } finally {
      window.setTimeout(() => setCopiedCode(false), 1800);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-8 sm:space-y-8">
      {/* ===================================================
          01. HERO
      =================================================== */}

      <section
        className={`${styles.hero} relative isolate overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-7 lg:p-9`}
      >
        <div aria-hidden="true" className={styles.heroGlow} />
        <div aria-hidden="true" className={styles.heroGlowSecondary} />

        <div className="relative flex flex-col-reverse md:flex-row md:items-center">
          {/* grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center */}
          <div className="min-w-0">
            <div className={styles.eyebrowBadge}>
              <Sparkles size={14} />
              VELoop Rewards Center
            </div>

            <h1 className="max-w-2xl text-3xl font-black tracking-tight text-[#172f23] sm:text-4xl lg:text-[42px] lg:leading-tight">
              Your next reward could be one code away.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#435849] sm:text-[15px]">
              Redeem a valid promo code assigned to your internship group and
              review your previous rewards in one place.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className={styles.trustChip}>
                <ShieldCheck size={16} />
                Group-specific codes
              </span>

              <span className={styles.trustChip}>
                <History size={16} />
                Transparent history
              </span>

              <span className={styles.trustChip}>
                <Wallet size={16} />
                Wallet-linked rewards
              </span>
            </div>
          </div>

          <div className={styles.rewardIllustration}>
            <div className={styles.rewardBackCard} />
            <div className={styles.rewardFrontCard} />

            <div className={styles.rewardIcon}>
              <Gift size={44} strokeWidth={1.7} />

              <span className={styles.rewardSparkle}>
                <Sparkles size={18} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          02. SUMMARY CARDS
      =================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={Wallet}
          label="Current balance"
          value={`${formatAmount(wallet.balance)} IC`}
          description="Your available InternCash"
          color="green"
        />

        <SummaryCard
          icon={Ticket}
          label="Promo redemptions"
          value={promoTransactions.length}
          description="Promo-related wallet transactions"
          color="blue"
        />

        <SummaryCard
          icon={TrendingUp}
          label="Promo rewards credited"
          value={`+${formatAmount(totalPromoRewards)} IC`}
          description="Positive promo-related transactions"
          color="violet"
        />
      </section>

      {/* ===================================================
          03. REDEMPTION PANEL
      =================================================== */}

      <section
        className={`${styles.redemptionPanel} relative isolate overflow-hidden rounded-[27px] text-white shadow-xl`}
      >
        <div aria-hidden="true" className={styles.redemptionGlow} />
        <div aria-hidden="true" className={styles.redemptionGlowSecondary} />

        <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10 lg:p-9">
          {/* REDEMPTION FORM */}

          <div className="min-w-0">
            <div className={styles.exclusiveBadge}>
              <Sparkles size={14} />
              Exclusive intern rewards
            </div>

            <div className="mt-7 flex items-start gap-3.5 sm:gap-4">
              <div className={styles.formGiftIcon}>
                <Gift size={27} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Redeem a promo code
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-7 text-emerald-50 sm:text-[15px]">
                  Got a code from your internship administrator? Enter it below
                  to unlock the reward assigned to your group.
                </p>
              </div>
            </div>

            <form onSubmit={handleRedeem} className="mt-7 space-y-4">
              <label
                htmlFor="promo-code-input"
                className="block text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-50 sm:text-sm"
              >
                Your promo code
              </label>

              <div className={styles.promoInputOuter}>
                <div className={styles.promoInputInner}>
                  <Ticket
                    size={21}
                    className="ml-4 shrink-0 text-emerald-200"
                  />

                  <input
                    id="promo-code-input"
                    name="promoCode"
                    type="text"
                    required
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={80}
                    value={promoCode}
                    onChange={(event) =>
                      setPromoCode(event.target.value.toUpperCase())
                    }
                    placeholder="ENTER-YOUR-CODE"
                    aria-describedby="promo-code-help"
                    className={styles.promoInput}
                  />

                  {promoCode && (
                    <button
                      type="button"
                      onClick={() => setPromoCode("")}
                      aria-label="Clear promo code"
                      className={styles.clearPromoButton}
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
              </div>

              <p
                id="promo-code-help"
                className="flex items-start gap-2 text-xs leading-6 text-emerald-50"
              >
                <ShieldCheck size={15} className="mt-1 shrink-0" />
                Codes are converted to uppercase automatically. Eligibility is
                checked securely by the server.
              </p>

              <button
                type="submit"
                disabled={!promoCode.trim() || redeeming}
                className={styles.redeemButton}
              >
                {redeeming ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Validating code…
                  </>
                ) : (
                  <>
                    <Gift size={18} />
                    Redeem my reward
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className={styles.rewardFootnote}>
              <LockKeyhole size={15} />
              <span>
                Each code can be redeemed only once per eligible intern.
              </span>
            </div>
          </div>

          {/* HOW IT WORKS */}

          <aside className={styles.guidancePanel}>
            <div className={styles.guidanceHeading}>
              <ShieldCheck size={20} />
              <h3>How it works</h3>
            </div>

            <div className="mt-6 space-y-6">
              <Guideline
                number="01"
                title="Enter your code"
                description="Use the exact promo code shared with your internship group."
              />

              <Guideline
                number="02"
                title="Redeem securely"
                description="The server validates the code, its group, expiry and redemption eligibility."
              />

              <Guideline
                number="03"
                title="Check your wallet"
                description="Your credited InternCash and recorded transaction will appear in your wallet history."
              />
            </div>

            <div className={styles.guidanceNotice}>
              <Info size={18} />
              <div>
                <h4>Before you redeem</h4>
                <p>
                  The code must be active, available to your group and within
                  its redemption limit. The actual reward depends on the
                  administrator's configured terms.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ===================================================
          04. REDEMPTION HISTORY
      =================================================== */}

      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className={styles.historyIcon}>
                  <History size={23} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-tight text-[#172f23] sm:text-2xl">
                    Redemption history
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-7 text-[#526457]">
                    Review your previous promo transactions and reward details,
                    all in one place.
                  </p>

                  <div className="hidden md:flex mt-4  flex-wrap gap-2">
                    <span className={styles.historyChip}>
                      <ShieldCheck size={14} />
                      Reward activity
                    </span>

                    <span className={styles.historyChip}>
                      <Ticket size={14} />
                      Group-specific codes
                    </span>

                    <span className={styles.historyChip}>
                      <History size={14} />
                      Transparent history
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadWallet({ manualRefresh: true })}
                disabled={refreshing}
                className={styles.historyRefreshButton}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />

                {refreshing ? "Refreshing…" : "Refresh history"}
              </button>
            </div>

            {/* Search */}

            <div className={styles.historySearch}>
              <Search size={18} className={styles.historySearchIcon} />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by code, description or date…"
                aria-label="Search promo redemption history"
                className={styles.historySearchInput}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className={styles.searchClearButton}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History content */}

        {loading ? (
          <HistorySkeleton />
        ) : loadError && transactions.length === 0 ? (
          <HistoryError message={loadError} onRetry={() => loadWallet()} />
        ) : filteredTransactions.length > 0 ? (
          <div className="divide-y divide-[#dce5d9] bg-white">
            {filteredTransactions.map((transaction, index) => (
              <RedemptionRow
                key={transaction._id || transaction.reference || index}
                transaction={transaction}
                onClick={() => setSelectedTransaction(transaction)}
              />
            ))}
          </div>
        ) : (
          <EmptyHistory
            hasPromoTransactions={promoTransactions.length > 0}
            hasSearch={Boolean(searchQuery.trim())}
            onClear={() => setSearchQuery("")}
          />
        )}

        {/* History footer */}

        {!loading && !loadError && (
          <div className={styles.historyFooter}>
            <span>
              Showing {filteredTransactions.length} of{" "}
              {promoTransactions.length} promo entries
            </span>

            <span>
              <ShieldCheck size={15} />
              Based on your wallet ledger
            </span>
          </div>
        )}
      </section>

      {/* ===================================================
    05. FREQUENTLY ASKED QUESTIONS
=================================================== */}

      <div className="mt-17">
        <PromoFAQs />
      </div>

      {/* ===================================================
          05. TRANSACTION DETAILS MODAL
      =================================================== */}

      {selectedTransaction &&
        typeof document !== "undefined" &&
        createPortal(
          <RedemptionModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onCopy={handleCopyCode}
            copiedCode={copiedCode}
          />,
          document.body,
        )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ icon: Icon, label, value, description, color }) {
  const colorClasses = {
    green: styles.summaryGreen,
    blue: styles.summaryBlue,
    violet: styles.summaryViolet,
  };

  const iconClasses = {
    green: styles.summaryIconGreen,
    blue: styles.summaryIconBlue,
    violet: styles.summaryIconViolet,
  };

  return (
    <article className={`${styles.summaryCard} ${colorClasses[color] || ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#405344]">{label}</p>

          <p className="pt-2.5 break-words text-2xl font-black tracking-tight text-[#172f23] sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-xs leading-6 text-[#526457]">{description}</p>
        </div>

        <div className={`${styles.summaryIcon} ${iconClasses[color] || ""}`}>
          <Icon size={22} strokeWidth={2.1} />
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   HOW-IT-WORKS ITEM
========================================================= */

function Guideline({ number, title, description }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className={styles.stepNumber}>{number}</span>

      <div className="min-w-0">
        <p className="text-sm font-extrabold leading-6 text-white">{title}</p>

        <p className="mt-1 text-xs leading-6 text-emerald-50">{description}</p>
      </div>
    </div>
  );
}

/* =========================================================
   REDEMPTION HISTORY ROW
========================================================= */

function RedemptionRow({ transaction, onClick }) {
  const code = getPromoCodeFromTransaction(transaction);
  const amount = Number(transaction.amount) || 0;

  return (
    <button type="button" onClick={onClick} className={styles.redemptionRow}>
      <div className={styles.transactionIcon}>
        <Ticket size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="break-words text-sm font-extrabold text-[#172f23] sm:text-base">
              {code || "Promo redemption"}
            </h3>

            <p className="mt-1.5 break-words text-xs leading-6 text-[#526457] sm:text-sm">
              {transaction.description || "Promo-related wallet transaction"}
            </p>
          </div>

          <span
            className={`${styles.transactionAmount} ${
              amount > 0
                ? styles.amountPositive
                : amount < 0
                  ? styles.amountNegative
                  : styles.amountNeutral
            }`}
          >
            {amount > 0 ? "+" : ""}
            {formatAmount(amount)} IC
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className={styles.transactionDate}>
            <CalendarDays size={14} />
            {formatDateTime(transaction.createdAt)}
          </span>

          <span className={styles.viewTransaction}>
            View details
            <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   TRANSACTION DETAILS MODAL
========================================================= */

function RedemptionModal({ transaction, onClose, onCopy, copiedCode }) {
  const code = getPromoCodeFromTransaction(transaction);
  const amount = Number(transaction.amount) || 0;

  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const oldBodyOverflow = body.style.overflow;
    const oldBodyPadding = body.style.paddingRight;
    const oldHtmlOverflow = html.style.overflow;

    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

    const currentPadding =
      Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }

    const previousFocus = document.activeElement;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const elements = Array.from(
        modal.querySelectorAll(
          'button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);

      body.style.overflow = oldBodyOverflow;
      body.style.paddingRight = oldBodyPadding;
      html.style.overflow = oldHtmlOverflow;

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeRef.current?.();
        }
      }}
    >
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-detail-title"
        tabIndex={-1}
        className={styles.modal}
      >
        {/* Modal header */}

        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTop}>
            <div className="flex items-center justify-center">
              <div className={styles.modalReceiptIcon}>
                <ReceiptText size={23} />
              </div>
              <div className="ms-4 flex flex-wrap gap-2">
                <span className={styles.transactionBadge}>
                  <BadgeCheck size={13} />
                  Transaction details
                </span>

                <span className={styles.ledgerBadge}>
                  <ShieldCheck size={13} />
                  Wallet ledger
                </span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => closeRef.current?.()}
              aria-label="Close transaction details"
              className={styles.modalClose}
            >
              <X size={18} />
            </button>
          </div>

          <h2 id="promo-detail-title" className={styles.modalTitle}>
            {code || "Promo redemption"}
          </h2>

          <p className={styles.modalDescription}>
            Complete details from the recorded wallet transaction.
          </p>
        </div>

        {/* Scrollable modal body */}

        <div className={styles.modalBody}>
          <div className={styles.amountPanel}>
            <p>Recorded transaction amount</p>

            <strong
              className={
                amount >= 0 ? styles.amountPositive : styles.amountNegative
              }
            >
              {amount > 0 ? "+" : ""}
              {formatAmount(amount)} IC
            </strong>

            <span>InternCash ledger amount, not a separate cash payout.</span>
          </div>

          {/* Promo code */}

          {code ? (
            <div className={styles.detailCard}>
              <p className={styles.detailLabel}>Promo code</p>

              <div className="mt-3 flex min-w-0 items-center gap-2">
                <code className={styles.codeValue}>{code}</code>

                <button
                  type="button"
                  onClick={() => onCopy(code)}
                  aria-label="Copy promo code"
                  className={styles.copyCodeButton}
                >
                  {copiedCode ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.missingCode}>
              <Info size={19} />

              <div>
                <p>Promo code not present in ledger details</p>

                <span>
                  The available transaction data does not contain a recognizable
                  promo code.
                </span>
              </div>
            </div>
          )}

          <DetailRow
            icon={CalendarDays}
            color="green"
            label="Recorded date and time"
            value={formatDateTime(transaction.createdAt)}
          />

          <DetailRow
            icon={Coins}
            color="amber"
            label="Transaction type"
            value={normalizeText(transaction.type || "Not specified")}
          />

          <DetailRow
            icon={FileText}
            color="blue"
            label="Description"
            value={transaction.description || "No description recorded"}
          />

          <DetailRow
            icon={Wallet}
            color="violet"
            label="Balance after transaction"
            value={
              transaction.balanceAfter != null
                ? `${formatAmount(transaction.balanceAfter)} IC`
                : "Not available"
            }
          />

          <DetailRow
            icon={ShieldCheck}
            color="green"
            label="Transaction reference"
            value={transaction.reference || transaction._id || "Not available"}
          />

          <div className={styles.modalTrust}>
            <ShieldCheck size={17} />
            <span>
              Transaction information is taken from your available wallet
              ledger.
            </span>
          </div>
        </div>

        {/* Fixed modal footer */}

        <div className={styles.modalFooter}>
          <span className={styles.modalFooterTrust}>
            <ShieldCheck size={15} />
            VELoop Rewards · Official records
          </span>

          <button
            type="button"
            onClick={() => closeRef.current?.()}
            className={styles.modalDone}
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MODAL DETAIL ROW
========================================================= */

function DetailRow({ icon: Icon, label, value, color }) {
  const iconClasses = {
    green: styles.detailIconGreen,
    amber: styles.detailIconAmber,
    blue: styles.detailIconBlue,
    violet: styles.detailIconViolet,
  };

  return (
    <div className={styles.detailRow}>
      <div className={`${styles.detailRowIcon} ${iconClasses[color] || ""}`}>
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={styles.detailLabel}>{label}</p>

        <p className={styles.detailValue}>{value}</p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY HISTORY
========================================================= */

function EmptyHistory({ hasPromoTransactions, hasSearch, onClear }) {
  return (
    <div className={styles.emptyHistory}>
      <div className={styles.emptyHistoryIcon}>
        {hasSearch ? <Search size={28} /> : <Ticket size={29} />}

        <span>{hasSearch ? <X size={13} /> : <Sparkles size={15} />}</span>
      </div>

      <h3>
        {hasSearch
          ? "No matching redemptions"
          : hasPromoTransactions
            ? "No matching results"
            : "No promo redemptions yet"}
      </h3>

      <p>
        {hasSearch
          ? "Try a different search term."
          : "When a promo reward is recorded in your wallet ledger, it will appear here."}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onClear}
          className={styles.clearHistoryButton}
        >
          Clear search
        </button>
      )}
    </div>
  );
}

/* =========================================================
   HISTORY ERROR
========================================================= */

function HistoryError({ message, onRetry }) {
  return (
    <div className={styles.emptyHistory}>
      <div className={styles.errorHistoryIcon}>
        <CircleHelp size={27} />
      </div>

      <h3>Unable to load redemption history</h3>

      <p>{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className={styles.clearHistoryButton}
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

/* =========================================================
   FREQUENTLY ASKED QUESTIONS
========================================================= */

/* =========================================================
   PROMO FAQ SECTION — MODAL VERSION
   Click a question to open its full answer in a modal.
========================================================= */

/* =========================================================
   FAQ DATA
   Defined outside the component to avoid recreating it
   whenever the user searches or changes categories.
========================================================= */

const PROMO_FAQS = [
  {
    id: 1,
    category: "Redemption",
    question: "How do I redeem a promo code?",
    summary: "Redeem the code shared by your internship administrator.",
    answer:
      "Enter the promo code shared by your internship administrator in the redemption form and click Redeem my reward. The server verifies whether the code is valid, active, available to your group, and eligible for redemption.",
    icon: Ticket,
    iconStyle: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: 2,
    category: "Eligibility",
    question: "Why is my promo code being rejected?",
    summary: "Check the code, expiry, group eligibility and redemption limit.",
    answer:
      "Check that you entered the correct code. It may be inactive, expired, intended for another internship group, already redeemed by you, or unavailable because its redemption limit has been reached. Follow the error message displayed by the application.",
    icon: ShieldCheck,
    iconStyle: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: 3,
    category: "Rewards",
    question: "How much InternCash will I receive?",
    summary:
      "Your reward follows the range and rules configured for that code.",
    answer:
      "The administrator configures the reward range when creating a promo code. Your reward is determined by the server according to that code's configured rules. The credited amount may differ from the reward received by another eligible intern.",
    icon: Wallet,
    iconStyle: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    id: 4,
    category: "Redemption",
    question: "Can I redeem the same promo code more than once?",
    summary: "Each intern can redeem a particular promo code only once.",
    answer:
      "No. Each intern can redeem a particular promo code only once. If you have already redeemed it, use a different eligible code shared by your administrator.",
    icon: LockKeyhole,
    iconStyle: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    id: 5,
    category: "Wallet",
    question: "Where can I see my credited reward?",
    summary: "Check your InternCash balance and wallet transaction history.",
    answer:
      "After a successful redemption, check your InternCash balance and wallet transaction history. If the updated transaction does not appear immediately, refresh your wallet history and check again.",
    icon: History,
    iconStyle: "border-teal-200 bg-teal-50 text-teal-700",
  },
  {
    id: 6,
    category: "Eligibility",
    question: "Can I use a code shared with another internship group?",
    summary: "Codes may be restricted to their assigned internship group.",
    answer:
      "Promo codes are assigned to specific internship groups. A code intended for another group will not be eligible for your account. Ask your internship administrator for the correct code for your assigned group.",
    icon: ShieldCheck,
    iconStyle: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: 7,
    category: "Availability",
    question: "Why has a previously working code stopped working?",
    summary: "The code may have expired or reached its redemption limit.",
    answer:
      "An administrator may expire a promo code, or it may become unavailable after its configured redemption limit has been reached. A code must remain active and eligible when you submit your redemption request.",
    icon: Clock3,
    iconStyle: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: 8,
    category: "Rewards",
    question: "Is InternCash the same as a cash payout?",
    summary:
      "InternCash is a platform reward balance, not automatically a cash payout.",
    answer:
      "InternCash is the reward balance recorded in your VELOop account. A promo-code credit is not, by itself, a promise of a separate cash payout. Any conversion or withdrawal is governed by the platform's applicable rules and eligibility requirements.",
    icon: Coins,
    iconStyle: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    id: 9,
    category: "Support",
    question: "What should I do if my reward has not appeared?",
    summary: "Refresh your wallet and check the transaction history first.",
    answer:
      "Refresh your wallet and review the transaction history first. If the problem continues, contact your internship administrator through your official communication channel and provide the promo code and the approximate time of redemption. Never share your password or OTP.",
    icon: CircleHelp,
    iconStyle: "border-blue-200 bg-blue-50 text-blue-700",
  },
];

const PROMO_FAQ_CATEGORIES = [
  "All questions",
  "Redemption",
  "Eligibility",
  "Rewards",
  "Wallet",
  "Availability",
  "Support",
];

/* =========================================================
   MAIN FAQ COMPONENT
========================================================= */

function PromoFAQs() {
  const [activeCategory, setActiveCategory] = useState("All questions");
  const [search, setSearch] = useState("");
  const [selectedFAQ, setSelectedFAQ] = useState(null);

  const previousFocusRef = useRef(null);

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PROMO_FAQS.filter((faq) => {
      const matchesCategory =
        activeCategory === "All questions" || faq.category === activeCategory;

      const searchableContent = [
        faq.question,
        faq.summary,
        faq.answer,
        faq.category,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableContent.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const openFAQ = useCallback((faq) => {
    previousFocusRef.current =
      typeof document !== "undefined" ? document.activeElement : null;

    setSelectedFAQ(faq);
  }, []);

  const closeFAQ = useCallback(() => {
    setSelectedFAQ(null);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setActiveCategory("All questions");
  }, []);

  return (
    <>
      <section
        className="relative isolate mt-6 md:mt-8 overflow-hidden rounded-3xl border border-[#cbdcc7] bg-white shadow-[0_8px_35px_rgba(31,65,39,0.07)] sm:mt-10"
        aria-labelledby="promo-faq-heading"
      >
        {/* Subtle decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 size-64 rounded-full bg-lime-200/40 blur-3xl"
        />

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="relative border-b border-[#d5e3d0] bg-gradient-to-br from-[#f1f9ec] via-white to-[#e8f5e5] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm sm:size-14">
                <CircleHelp size={26} strokeWidth={2.1} />

                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-800 shadow-sm">
                  <Sparkles size={13} />
                  Promo help center
                </span>

                <h2
                  id="promo-faq-heading"
                  className="mt-3 text-2xl font-black tracking-tight text-[#172f23] sm:text-3xl"
                >
                  Frequently asked questions
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#526457]">
                  Everything you need to know about promo codes, eligibility,
                  InternCash rewards and redemption history.
                </p>
              </div>
            </div>

            {/* Live question count */}
            <div className="hidden md:flex w-fit shrink-0 items-center gap-3 rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Ticket size={19} />
              </div>

              <div>
                <p className="text-xl font-black leading-none text-[#172f23]">
                  {filteredFAQs.length.toString().padStart(2, "0")}
                </p>

                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#617263]">
                  {filteredFAQs.length === 1 ? "Answer" : "Answers"}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}
          <div className="mt-6 max-w-2xl">
            <label
              htmlFor="promo-faq-search"
              className="mb-2 block text-xs font-extrabold text-[#334d39]"
            >
              Find your answer
            </label>

            <div className="group relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#526b57] transition group-focus-within:text-emerald-700"
              />

              <input
                id="promo-faq-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search promo codes, rewards, eligibility..."
                aria-label="Search frequently asked questions"
                className="h-12 w-full rounded-xl border border-[#cbdcc7] bg-white pl-11 pr-12 text-sm font-medium text-[#172f23] outline-none transition duration-200 placeholder:text-[#758377] hover:border-[#9fbe98] focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              CATEGORY FILTERS
          ================================================= */}
          <div className="mt-5">
            <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#637466]">
              Browse by topic
            </p>

            <div
              className="flex gap-2 scrollbar-none overflow-x-auto pb-1"
              role="group"
              aria-label="Filter FAQs by category"
            >
              {PROMO_FAQ_CATEGORIES.map((category) => {
                const isActive = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveCategory(category)}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 ${
                      isActive
                        ? "border-[#205c3a] bg-[#205c3a] text-white shadow-[0_4px_12px_rgba(32,92,58,0.2)]"
                        : "border-[#d4dfd1] bg-white text-[#405344] hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                    }`}
                  >
                    {isActive && <CheckCircle2 size={13} />}
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =================================================
            QUESTION CARDS
        ================================================= */}
        <div className="p-4 sm:p-6 lg:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#172f23] sm:text-base">
                {activeCategory === "All questions"
                  ? "Explore the help center"
                  : `${activeCategory} questions`}
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#667568]">
                Select a question to read the complete answer.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4dfd1] bg-[#f5f8f1] px-3 py-2 text-[11px] font-bold text-[#405344]">
              <Search size={13} />
              {filteredFAQs.length} found
            </span>
          </div>

          {filteredFAQs.length > 0 ? (
            <div className="grid grid-cols-1 items-stretch gap-5 md:gap-4 sm:grid-cols-2 sm:gap-4">
              {filteredFAQs.map((faq, index) => {
                const FAQIcon = faq.icon;

                return (
                  <button
                    key={faq.id}
                    type="button"
                    onClick={() => openFAQ(faq)}
                    aria-haspopup="dialog"
                    aria-label={`Read answer: ${faq.question}`}
                    className="group relative flex min-h-[214px] w-full flex-col overflow-hidden rounded-2xl border border-[#d7e2d5] bg-gradient-to-br from-white via-white to-[#f7fbf4] p-4 text-left shadow-[0_7px_10px_rgba(27,65,38,0.035)] transition duration-200 ease-out hover:-translate-y-1 hover:border-[#92bd8b] hover:shadow-[0_14px_32px_rgba(32,93,58,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 sm:p-5"
                  >
                    {/* Hover accent bar */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-emerald-600 via-lime-500 to-teal-500 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                    />

                    {/* Decorative circle */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-8 -top-9 size-24 rounded-full bg-emerald-100/30 transition duration-300 group-hover:scale-150 group-hover:bg-emerald-100/60"
                    />

                    {/* Card top */}
                    <div className="relative mb-3 flex items-start gap-3">
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition duration-200 group-hover:scale-105 group-hover:shadow-sm sm:size-12 ${faq.iconStyle}`}
                      >
                        <FAQIcon size={20} strokeWidth={2.1} />
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <span className="inline-flex max-w-full items-center rounded-md border border-[#dfe8da] bg-white/90 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#527456]">
                          {faq.category}
                        </span>

                        <h4 className="mt-2 text-sm font-extrabold leading-6 text-[#172f23] transition-colors group-hover:text-emerald-800 sm:text-[15px]">
                          {faq.question}
                        </h4>
                      </div>

                      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#d7e2d5] bg-white text-[#526b57] transition duration-200 group-hover:translate-x-0.5 group-hover:border-emerald-300 group-hover:bg-emerald-700 group-hover:text-white">
                        <ChevronRight
                          size={17}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>

                    {/* Card description */}
                    <p className="relative mt-4 line-clamp-2 text-[13px] leading-6 text-[#56685a] sm:text-sm">
                      {faq.summary}
                    </p>

                    {/* Card action */}
                    <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-[#e5ece1] pt-4">
                      <span className="text-[10px] font-semibold text-[#79877a]">
                        Question {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#28613a] transition-all duration-200 group-hover:gap-2.5">
                        Read answer
                        <ArrowRight
                          size={15}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* =================================================
               EMPTY SEARCH STATE
            ================================================= */
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#cbdcc7] bg-[#f8faf5] px-5 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
                <Search size={24} />
              </div>

              <h3 className="mt-4 text-base font-extrabold text-[#172f23]">
                No matching questions
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#526457]">
                Try a different keyword or select another category to find the
                answer you need.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-extrabold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
              >
                <RefreshCw size={14} />
                Reset filters
              </button>
            </div>
          )}

          {/* =================================================
              SUPPORT FOOTER
          ================================================= */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#cbdcc7] bg-gradient-to-r from-[#f0f6e9] to-[#f8faf5] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#c5dcb9] bg-white text-emerald-700 shadow-sm">
                <Bell size={19} />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#172f23]">
                  Still need help?
                </h3>

                <p className="mt-1 text-xs leading-6 text-[#526457]">
                  Contact your internship administrator through your official
                  communication channel for help with a specific code.
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-[#c6ddbe] bg-white px-3 py-2 text-xs font-bold text-[#28613a] sm:self-center">
              <ShieldCheck size={15} />
              Official support
            </span>
          </div>
        </div>
      </section>

      {/* Modal rendered outside the FAQ container */}
      {selectedFAQ &&
        typeof document !== "undefined" &&
        createPortal(
          <PromoFAQModal
            faq={selectedFAQ}
            onClose={closeFAQ}
            previousFocusRef={previousFocusRef}
          />,
          document.body,
        )}
    </>
  );
}

/* =========================================================
   FAQ DETAIL MODAL
========================================================= */

function PromoFAQModal({ faq, onClose, previousFocusRef }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  const FAQIcon = faq.icon;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      // Escape closes the modal.
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      // Keep keyboard focus inside the modal.
      if (event.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements?.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      const previousElement = previousFocusRef?.current;

      if (previousElement && typeof previousElement.focus === "function") {
        previousElement.focus();
      }
    };
  }, [onClose, previousFocusRef]);

  return (
    <div
      className=" fixed inset-0 z-120 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        // Close only when the actual backdrop is clicked.
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-faq-modal-title"
        aria-describedby="promo-faq-modal-answer"
        tabIndex={-1}
        className="my-auto flex max-h-[min(88dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25 outline-none"
      >
        {/* Modal header */}
        <header className="flex shrink-0 items-start gap-4 border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-7">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm">
            <FAQIcon size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800">
              {faq.category}
            </span>

            <h2
              id="promo-faq-modal-title"
              className="mt-2 text-lg font-extrabold leading-7 tracking-tight text-slate-950 sm:text-2xl sm:leading-8"
            >
              {faq.question}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {faq.shortAnswer}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close FAQ answer"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          >
            <X size={19} />
          </button>
        </header>

        {/* Scrollable answer */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-800">
            <Info size={16} />
            Answer
          </div>

          <p
            id="promo-faq-modal-answer"
            className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-[15px]"
          >
            {faq.answer}
          </p>

          {faq.steps?.length > 0 && (
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
                <CheckCircle2 size={18} className="text-emerald-700" />
                What you should do
              </h3>

              <ol className="mt-4 space-y-3">
                {faq.steps.map((step, index) => (
                  <li
                    key={`${faq.id}-${index}`}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-[11px] font-extrabold text-emerald-800">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-amber-700" />

            <p className="text-xs leading-5 text-amber-950 sm:text-sm">
              For account-specific issues, use an official administrator support
              channel. Never share your password or login verification code.
            </p>
          </div>
        </div>

        {/* Modal footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
          <span className="text-xs text-slate-500">Promo code help</span>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            Got it
            <Check size={16} />
          </button>
        </footer>
      </section>
    </div>
  );
}

/* =========================================================
   SKELETON LOADING
========================================================= */

function HistorySkeleton() {
  return (
    <div
      className={styles.skeletonList}
      aria-label="Loading redemption history"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div className={styles.skeletonRow} key={index}>
          <div className={styles.skeletonIcon} />

          <div className="min-w-0 flex-1">
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonDescription} />
            <div className={styles.skeletonFooter} />
          </div>
        </div>
      ))}
    </div>
  );
}
