import React from "react";

import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { useToast } from "../../../components/Toast/Toast";

import styles from "./WalletHero.module.css";

/* =========================================================
   IMAGE ASSET
========================================================= */

const WALLET_ILLUSTRATION = `${
  import.meta.env.BASE_URL || "/"
}wallet/interncash-hero-illustration.webp`;

/* =========================================================
   INFO TOAST MESSAGE
========================================================= */

const WALLET_INFO_MESSAGE =
  "The displayed rupee equivalent is an informational estimate based on the configured conversion rate. InternCash is an internal reward unit, not a bank or UPI balance. This value does not guarantee cash conversion or withdrawal eligibility.";

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "object") {
    value =
      value.$numberDecimal ?? value.$numberInt ?? value.value ?? value.amount;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const format = (value) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date =
    typeof value === "number"
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTransactionDate = (transaction) =>
  transaction?.createdAt ??
  transaction?.date ??
  transaction?.timestamp ??
  transaction?.updatedAt ??
  transaction?.transactionDate ??
  null;

/* =========================================================
   MAIN WALLET HERO
========================================================= */

export default function WalletHero({
  balance = 0,
  indicativeValue = 0,
  stats = {},
  transactionCount = 0,
  latestTransaction = null,
  showBalance = true,
  onToggleBalance,
}) {
  // Uses the existing application-wide ToastProvider.
  const toast = useToast();

  const credits = toNumber(stats?.credits);
  const debits = toNumber(stats?.debits);

  const creditCount = Math.max(0, toNumber(stats?.creditCount));

  const debitCount = Math.max(0, toNumber(stats?.debitCount));

  const activityCount = Math.max(0, toNumber(transactionCount));

  const safeBalance = Math.max(0, toNumber(balance));

  const safeEquivalent = Math.max(0, toNumber(indicativeValue));

  const latestDate = formatDate(getTransactionDate(latestTransaction));

  const hasLatestTransaction = Boolean(
    latestTransaction && typeof latestTransaction === "object",
  );

  /* =======================================================
     SHOW INFO AS GLOBAL TOAST
  ======================================================= */

  const showWalletInformation = () => {
    toast(WALLET_INFO_MESSAGE, "info");
  };

  return (
    <section
      className={styles.hero}
      aria-labelledby="interncash-wallet-heading"
    >
      {/* Background decoration */}

      <div className={styles.backdropGlow} aria-hidden="true" />

      <div className={styles.backdropGrid} aria-hidden="true" />

      <div className={styles.shell}>
        {/* =================================================
            HEADER
        ================================================= */}

        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <Wallet size={23} strokeWidth={1.9} />
            </div>

            <div className={styles.brandInfo}>
              <div className={styles.brandTitle}>
                <h2 id="interncash-wallet-heading">InternCash</h2>

                <span className={styles.brandBadge}>IC WALLET</span>
              </div>

              <p>Your personal rewards wallet</p>
            </div>
          </div>

          <div className={styles.statusPill}>
            <span className={styles.statusDot} />

            <span>Wallet overview</span>

            <ShieldCheck size={14} />
          </div>
        </header>

        {/* =================================================
            BALANCE + ILLUSTRATION
        ================================================= */}

        <div className={styles.heroBody}>
          {/* BALANCE SECTION */}

          <div className={styles.balanceColumn}>
            <div className={styles.balanceLabelRow}>
              <span className={styles.balanceLabel}>AVAILABLE BALANCE</span>

              <button
                type="button"
                onClick={onToggleBalance}
                disabled={typeof onToggleBalance !== "function"}
                className={styles.visibilityButton}
                aria-label={
                  showBalance ? "Hide wallet balance" : "Show wallet balance"
                }
                aria-pressed={!showBalance}
                title={
                  showBalance ? "Hide wallet balance" : "Show wallet balance"
                }
              >
                {showBalance ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </div>

            {/* Main balance */}

            <div
              className={styles.balanceValueRow}
              aria-live="polite"
              aria-atomic="true"
            >
              <p className={styles.balanceValue}>
                {showBalance ? format(safeBalance) : "••••••"}
              </p>

              <span className={styles.currencyTag}>IC</span>
            </div>

            {/* Indicative rupee equivalent */}

            <div className={styles.equivalentRow}>
              <span className={styles.equivalentLabel}>
                Indicative rupee equivalent
              </span>

              <span className={styles.equivalentValue}>
                {showBalance ? `₹${format(safeEquivalent)}` : "••••"}
              </span>

              {/* INFO BUTTON — SHOWS TOAST */}

              <button
                type="button"
                className={styles.infoButton}
                onClick={showWalletInformation}
                aria-label="Show information about the indicative rupee value"
                title="About the indicative rupee value"
              >
                <Info size={15} />
              </button>
            </div>

            <p className={styles.balanceNote}>
              Your balance reflects amounts recorded by the server. Pending
              approvals are not presented here as confirmed wallet credits.
            </p>
          </div>

          {/* =================================================
              WALLET ILLUSTRATION
          ================================================= */}

          <div className={styles.visualColumn}>
            <div className={styles.visualFrame}>
              <div className={styles.visualAura} aria-hidden="true" />

              <div className={styles.visualOrb} aria-hidden="true" />

              {/* Fallback if image is unavailable */}

              <div className={styles.visualFallback} aria-hidden="true">
                <Coins size={62} />
                <Sparkles size={20} />
              </div>

              <img
                className={styles.visualImage}
                src={WALLET_ILLUSTRATION}
                alt="Golden InternCash reward vault with floating reward tokens"
                draggable="false"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <div className={styles.visualChip}>
                <Sparkles size={13} />

                <span>YOUR REWARD JOURNEY</span>
              </div>

              <div className={styles.visualCaption}>
                <span className={styles.captionIcon}>
                  <ShieldCheck size={15} />
                </span>

                <span>
                  <strong>Every IC counts</strong>

                  <small>Your activity, clearly recorded</small>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            WALLET STATISTICS
        ================================================= */}

        <div className={styles.metrics}>
          <MetricCard
            label="Total credits"
            amount={credits}
            count={creditCount}
            hidden={!showBalance}
            icon={ArrowDownLeft}
            tone="credit"
          />

          <MetricCard
            label="Total debits"
            amount={debits}
            count={debitCount}
            hidden={!showBalance}
            icon={ArrowUpRight}
            tone="debit"
          />

          <MetricCard
            label="Wallet activity"
            amount={activityCount}
            count={null}
            hidden={false}
            icon={Activity}
            tone="activity"
            latestDate={hasLatestTransaction ? latestDate : null}
          />
        </div>

        {/* =================================================
            TRANSPARENCY FOOTER
        ================================================= */}

        <footer className={styles.disclosure}>
          <span className={styles.disclosureIcon}>
            <LockKeyhole size={15} />
          </span>

          <p>
            <strong>Your wallet, clearly recorded.</strong> InternCash is an
            internal reward unit, not a bank or UPI balance. Its indicative
            rupee value does not guarantee cash conversion or withdrawal.
          </p>
        </footer>
      </div>
    </section>
  );
}

/* =========================================================
   WALLET METRIC CARD
========================================================= */

function MetricCard({
  label,
  amount,
  count,
  hidden,
  icon: Icon,
  tone,
  latestDate,
}) {
  const isActivity = tone === "activity";

  const prefix = tone === "credit" ? "+" : tone === "debit" ? "-" : "";

  return (
    <article className={`${styles.metric} ${styles[`metric_${tone}`]}`}>
      <div className={styles.metricTop}>
        <div className={styles.metricLabel}>
          <span className={styles.metricIcon}>
            <Icon size={18} />
          </span>

          <span>{label}</span>
        </div>

        <span className={styles.metricIndicator}>
          {tone === "credit" ? (
            <ArrowDownLeft size={15} />
          ) : tone === "debit" ? (
            <ArrowUpRight size={15} />
          ) : (
            <Sparkles size={15} />
          )}
        </span>
      </div>

      <p className={styles.metricAmount}>
        {hidden
          ? "••••"
          : isActivity
            ? toNumber(amount).toLocaleString("en-IN")
            : `${prefix}${format(amount)}`}

        {!isActivity && <span className={styles.metricSuffix}>IC</span>}

        {isActivity && <span className={styles.metricSuffix}>entries</span>}
      </p>

      <p className={styles.metricFoot}>
        {isActivity
          ? latestDate
            ? `Latest activity: ${latestDate}`
            : "Your wallet activity will appear here"
          : `${toNumber(count).toLocaleString("en-IN")} recorded entries`}
      </p>
    </article>
  );
}
