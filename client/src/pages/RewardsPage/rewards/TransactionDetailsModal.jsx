import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { createPortal } from "react-dom";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Copy,
  Hash,
  ShieldCheck,
  Wallet,
  X,
  FileText,
  Clock3,
} from "lucide-react";

import styles from "./TransactionDetailsModal.module.css";

/* =========================================================
   TRANSACTION HELPERS
========================================================= */

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

const getRawAmount = (transaction) =>
  transaction?.amount ??
  transaction?.value ??
  transaction?.coins ??
  transaction?.rewardAmount ??
  transaction?.netAmount ??
  null;

const getTypeValue = (transaction) =>
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

const getAmount = (transaction) => {
  const amount = toNumber(getRawAmount(transaction));

  if (amount === null) return null;

  const type = getTypeValue(transaction);

  const isDebit =
    type.includes("debit") ||
    type.includes("withdraw") ||
    type.includes("deduction") ||
    type.includes("spent") ||
    type.includes("purchase") ||
    type.includes("expense") ||
    type.includes("outflow");

  return isDebit ? -Math.abs(amount) : amount;
};

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
  "Wallet transaction";

const getBalance = (transaction) =>
  transaction?.balanceAfter ??
  transaction?.walletBalanceAfter ??
  transaction?.newBalance ??
  transaction?.availableBalanceAfter ??
  transaction?.balance ??
  null;

const getStatus = (transaction) =>
  transaction?.status ??
  transaction?.state ??
  transaction?.approvalStatus ??
  transaction?.transactionStatus ??
  "Recorded";

const getDate = (transaction) =>
  transaction?.createdAt ??
  transaction?.date ??
  transaction?.timestamp ??
  transaction?.updatedAt ??
  transaction?.transactionDate ??
  null;

const formatNumber = (value) => {
  const number = toNumber(value);

  if (number === null) return "—";

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const formatAmount = (value) => {
  const amount = toNumber(value);

  if (amount === null) return "Amount unavailable";

  const formatted = Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  if (amount > 0) return `+${formatted} IC`;
  if (amount < 0) return `-${formatted} IC`;

  return `${formatted} IC`;
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  let date;

  if (typeof value === "number") {
    // Supports Unix seconds and milliseconds.
    date = new Date(value < 1000000000000 ? value * 1000 : value);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatType = (value) =>
  String(value ?? "Transaction")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

/* =========================================================
   CLIPBOARD HELPER
========================================================= */

async function copyText(text) {
  if (!text) {
    throw new Error("No transaction reference is available.");
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for browsers without Clipboard API support.
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copying is not supported by this browser.");
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TransactionDetailsModal({
  transaction,
  onClose,
  notify,
  showBalance = true,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const copyTimeoutRef = useRef(null);

  const generatedId = useId();

  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  // Always use the latest close handler without restarting
  // the focus-management effect on every parent render.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const amount = getAmount(transaction);

  const reference = String(getReference(transaction) || "");

  const transactionType = getTypeValue(transaction);

  const description = getDescription(transaction);

  const balance = toNumber(getBalance(transaction));

  const status = formatType(getStatus(transaction));

  const amountClass =
    amount === null
      ? styles.amountNeutral
      : amount > 0
        ? styles.amountCredit
        : amount < 0
          ? styles.amountDebit
          : styles.amountNeutral;

  const AmountIcon =
    amount !== null && amount > 0 ? ArrowDownLeft : ArrowUpRight;

  /* -------------------------------------------------------
     FOCUS, ESCAPE AND SCROLL MANAGEMENT
  ------------------------------------------------------- */

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const dialog = dialogRef.current;

    if (!dialog) return undefined;

    previousFocusRef.current = document.activeElement;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = dialog.querySelectorAll(
        [
          "button:not([disabled])",
          "a[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          '[tabindex]:not([tabindex="-1"])',
        ].join(","),
      );

      const visibleElements = Array.from(focusableElements).filter(
        (element) => element.getClientRects().length > 0,
      );

      if (!visibleElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = visibleElements[0];
      const last = visibleElements[visibleElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;

      document.removeEventListener("keydown", handleKeyDown);

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus?.();
      }

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  /* -------------------------------------------------------
     COPY REFERENCE
  ------------------------------------------------------- */

  const handleCopyReference = useCallback(async () => {
    if (!reference || copying) return;

    try {
      setCopying(true);

      await copyText(reference);

      setCopied(true);
      notify?.("Transaction reference copied.");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      notify?.(
        error?.message || "Unable to copy the transaction reference.",
        "error",
      );
    } finally {
      setCopying(false);
    }
  }, [reference, copying, notify]);

  /* -------------------------------------------------------
     SAFETY
  ------------------------------------------------------- */

  if (!transaction || typeof document === "undefined") {
    return null;
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${generatedId}-title`}
        aria-describedby={`${generatedId}-description`}
        tabIndex={-1}
      >
        {/* HEADER */}

        <header className={styles.header}>
          <div className="flex min-w-0 items-start gap-3">
            <div className={styles.headerIcon}>
              <Wallet size={21} />
            </div>

            <div className="min-w-0">
              <span className={styles.eyebrow}>
                <ShieldCheck size={12} />
                Wallet transaction record
              </span>

              <h2 id={`${generatedId}-title`}>Transaction details</h2>

              <p id={`${generatedId}-description`}>
                Review the information recorded in your InternCash ledger.
              </p>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current?.()}
            className={styles.closeButton}
            aria-label="Close transaction details"
          >
            <X size={19} />
          </button>
        </header>

        {/* AMOUNT SUMMARY */}

        <div className={styles.amountPanel}>
          <span className={styles.amountLabel}>Transaction amount</span>

          <div className={styles.amountLine}>
            <span className={`${styles.amountIcon} ${amountClass}`}>
              <AmountIcon size={21} />
            </span>

            <strong className={amountClass}>{formatAmount(amount)}</strong>
          </div>

          <p>{description}</p>

          {transactionType && (
            <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
              {formatType(transactionType)}
            </span>
          )}
        </div>

        {/* DETAILS */}

        <div className={styles.content}>
          <Detail
            icon={Hash}
            label="Transaction type"
            value={formatType(transactionType)}
          />

          <Detail
            icon={CalendarDays}
            label="Transaction date"
            value={formatDate(getDate(transaction))}
          />

          <Detail icon={Clock3} label="Transaction status" value={status} />

          {/* Do not reveal the balance when wallet visibility is off. */}

          {showBalance && (
            <Detail
              icon={Wallet}
              label="Balance after transaction"
              value={
                balance === null
                  ? "Not provided by server"
                  : `${formatNumber(balance)} IC`
              }
            />
          )}

          {/* REFERENCE */}

          <div className={styles.referenceRow}>
            <div className={styles.referenceText}>
              <span className={styles.detailLabel}>Transaction reference</span>

              <strong>{reference || "Reference not provided"}</strong>
            </div>

            {reference && (
              <button
                type="button"
                onClick={handleCopyReference}
                disabled={copying}
                className={styles.copyButton}
                aria-label="Copy transaction reference"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}

                {copying ? "Copying..." : copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          {/* ADDITIONAL INFORMATION */}

          {(transaction?.remarks ||
            transaction?.reason ||
            transaction?.note ||
            transaction?.metadata?.description) && (
            <div className={styles.note}>
              <FileText size={16} />

              <div>
                <strong className="mb-1 block text-xs font-extrabold">
                  Additional information
                </strong>

                <p>
                  {transaction?.remarks ||
                    transaction?.reason ||
                    transaction?.note ||
                    transaction?.metadata?.description}
                </p>
              </div>
            </div>
          )}

          {/* INFORMATION NOTE */}

          <div className={styles.note}>
            <ShieldCheck size={16} />

            <p>
              This information is displayed from the transaction record returned
              by the VELoop Rewards server. A field marked as unavailable was
              not provided in that record.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <footer className={styles.footer}>
          <span>VELoop Rewards · InternCash</span>

          <button type="button" onClick={() => onCloseRef.current?.()}>
            Close details
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function Detail({ icon: Icon, label, value }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>
        <Icon size={16} />
      </span>

      <span className={styles.detailText}>
        <span className={styles.detailLabel}>{label}</span>

        <strong>{String(value ?? "Not provided")}</strong>
      </span>
    </div>
  );
}
