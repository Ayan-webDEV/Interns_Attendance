import React, { useCallback, useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Clock3,
  Gift,
  History,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import styles from "./WalletFAQs.module.css";

/* =========================================================
   FAQ CONTENT
========================================================= */

const FAQS = [
  {
    category: "Wallet basics",
    question: "What is InternCash?",
    answer:
      "InternCash is VELoop Rewards' internal reward unit. Eligible credits and adjustments are recorded in your wallet ledger.",
    icon: Wallet,
  },
  {
    category: "Wallet basics",
    question: "Is InternCash the same as a bank or UPI balance?",
    answer:
      "No. InternCash is an internal reward unit, not a bank deposit or UPI payment balance. Its displayed rupee equivalent is informational only and does not guarantee cash conversion or withdrawal.",
    icon: ShieldCheck,
  },
  {
    category: "Attendance",
    question: "How do attendance rewards work?",
    answer:
      "Under the attendance rules currently shown on this page, first attendance earns +1 IC after admin approval, and re-attendance earns +3 IC after admin approval. The wallet ledger shows credits that have actually been recorded.",
    icon: CalendarDays,
  },
  {
    category: "Project rewards",
    question: "How do I receive the project submission reward?",
    answer:
      "After you submit your project, an admin may share a promo code associated with a reward of 60–140 IC. Follow the instructions provided by the admin and redeem the code according to its validity and eligibility rules. The reward is not credited just because this information is displayed here.",
    icon: Gift,
  },
  {
    category: "Attendance",
    question: "Why is my attendance still pending?",
    answer:
      "Your attendance may be waiting for administrative review. A pending status is not a confirmed credit. Check your notifications and the instructions from your internship administrator for updates.",
    icon: Clock3,
  },
  {
    category: "Troubleshooting",
    question: "Why has my wallet balance not changed?",
    answer:
      "Some rewards depend on approval or promo-code redemption. Refresh the wallet and review your transaction ledger. If the credit is still missing, contact the official internship administration team with the relevant details.",
    icon: History,
  },
  {
    category: "Troubleshooting",
    question: "What if a transaction looks incorrect?",
    answer:
      "Keep the transaction date, amount, description, and reference if available, then contact the internship administration team for a review. Never share your password or OTP.",
    icon: LockKeyhole,
  },
];

/* =========================================================
   MAIN FAQ SECTION
========================================================= */

export default function WalletFAQs() {
  const [selected, setSelected] = useState(null);

  const previousFocus = useRef(null);

  const open = useCallback((faq) => {
    if (typeof document !== "undefined") {
      previousFocus.current = document.activeElement;
    }

    setSelected(faq);
  }, []);

  const close = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <>
      <section
        className={`${styles.section} overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm`}
        aria-labelledby="wallet-faq-heading"
      >
        {/* Header */}
        <header className="border-b border-slate-100 bg-gradient-to-br from-[#F7F4FF] via-white to-[#F1F7FF] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className={styles.headerIcon}>
              <CircleHelp size={22} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h2
                id="wallet-faq-heading"
                className="text-lg font-extrabold text-slate-900 sm:text-xl"
              >
                InternCash FAQs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Straightforward answers about rewards, approvals and balances.
              </p>
            </div>
          </div>
        </header>

        {/* FAQ cards */}
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {FAQS.map((faq) => {
            const Icon = faq.icon;

            const isSelected = selected?.question === faq.question;

            return (
              <button
                type="button"
                key={faq.question}
                onClick={() => open(faq)}
                aria-haspopup="dialog"
                aria-expanded={isSelected}
                className={`${styles.faqCard} group`}
              >
                <span className={styles.faqIcon}>
                  <Icon size={19} aria-hidden="true" />
                </span>

                <span className="min-w-0 flex-1 text-left">
                  <span className={styles.category}>{faq.category}</span>

                  <span className="mt-1 block text-sm font-extrabold leading-6 text-slate-900">
                    {faq.question}
                  </span>

                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    Read the full answer
                  </span>
                </span>

                <ChevronRight
                  size={17}
                  aria-hidden="true"
                  className={styles.cardArrow}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          <ShieldCheck
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-violet-700"
          />

          <p className="text-xs leading-5 text-slate-500">
            Need account-specific help? Contact the official internship
            administration team. Never share your password or OTP.
          </p>
        </footer>
      </section>

      {/* Modal rendered outside the page layout */}
      {selected &&
        typeof document !== "undefined" &&
        createPortal(
          <FAQModal
            faq={selected}
            onClose={close}
            previousFocus={previousFocus}
          />,
          document.body,
        )}
    </>
  );
}

/* =========================================================
   FAQ ANSWER MODAL
========================================================= */

function FAQModal({ faq, onClose, previousFocus }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  const Icon = faq.icon;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;

    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableItems = dialogRef.current?.querySelectorAll(
        [
          "button:not([disabled])",
          "a[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          '[tabindex]:not([tabindex="-1"])',
        ].join(","),
      );

      if (!focusableItems?.length) {
        event.preventDefault();
        return;
      }

      const first = focusableItems[0];

      const last = focusableItems[focusableItems.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
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

      const focusTarget = previousFocus.current;

      if (
        focusTarget &&
        focusTarget.isConnected &&
        typeof focusTarget.focus === "function"
      ) {
        focusTarget.focus();
      }
    };
  }, [onClose, previousFocus]);

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onMouseDown={handleBackdropMouseDown}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-faq-title"
        aria-describedby="wallet-faq-answer"
        className={styles.modal}
      >
        {/* Modal header */}
        <header className={styles.modalHeader}>
          <span className={styles.modalIcon}>
            <Icon size={23} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <span className={styles.category}>{faq.category}</span>

            <h2 id="wallet-faq-title">{faq.question}</h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close answer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Modal answer */}
        <div className={styles.modalBody}>
          <div className={styles.answerLabel}>
            <Sparkles size={15} aria-hidden="true" />
            Answer
          </div>

          <p id="wallet-faq-answer">{faq.answer}</p>

          <div className={styles.reminder}>
            <ShieldCheck size={17} aria-hidden="true" />

            <span>
              Always follow the official instructions shared by your internship
              administrator.
            </span>
          </div>
        </div>

        {/* Modal footer */}
        <footer className={styles.modalFooter}>
          <span>VELoop Rewards · Help center</span>

          <button type="button" onClick={onClose}>
            Got it
          </button>
        </footer>
      </section>
    </div>
  );
}
