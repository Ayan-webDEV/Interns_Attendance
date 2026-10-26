import React from "react";
import {
  Clock3,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  Coins,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";

import styling from "./AttendanceSessionCard.module.css";

const approvedStatus = ["approved", "admin_corrected_present"];

export default function AttendanceSessionCard({
  number,
  label,
  window,
  record,
  open,
  disabled,
  reward,
  onStart,
  note,
}) {
  const status = record?.status;
  const approved = approvedStatus.includes(status);
  const pending = status === "pending";
  const rejected = status === "rejected";

  const statusLabel = status ? status.replaceAll("_", " ") : null;

  const buttonDisabled = Boolean(disabled || !open);

  const cardState = approved
    ? styling.cardApproved
    : pending
      ? styling.cardPending
      : rejected
        ? styling.cardRejected
        : open && !disabled
          ? styling.cardAvailable
          : styling.cardUnavailable;

  const handleStart = () => {
    if (!buttonDisabled && typeof onStart === "function") {
      onStart();
    }
  };

  return (
    <article
      className={`${styling.sessionCard} ${cardState} group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-5 sm:p-6`}
    >
      {/* Decorative background */}
      <div className={styling.cardGlow} aria-hidden="true" />

      <div className={styling.cardTopAccent} aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Session heading and status */}
        <div className="flex items-center justify-between gap-3">
          <span className={styling.sessionNumber}>
            <span className={styling.sessionNumberDot} />
            SESSION {number}
          </span>

          {record && (
            <span
              className={`${styling.statusBadge} ${
                approved
                  ? styling.statusApproved
                  : pending
                    ? styling.statusPending
                    : rejected
                      ? styling.statusRejected
                      : styling.statusDefault
              }`}
              role="status"
            >
              <span className={styling.statusIndicator} />
              {statusLabel}
            </span>
          )}
        </div>

        {/* Session title */}
        <div className="mt-5 flex gap-4 items-center">
          <h3
            className={`${styling.sessionTitle} text-lg font-extrabold tracking-tight sm:text-xl`}
          >
            {label}
          </h3>

          <div className={`${styling.sessionTime} flex items-center gap-2`}>
            <span className={styling.clockIcon}>
              <Clock3 size={15} strokeWidth={2} aria-hidden="true" />
            </span>

            <span>{window}</span>
          </div>
        </div>

        {/* Reward panel */}
        <div
          className={`${styling.rewardPanel} relative mt-5 overflow-hidden rounded-xl p-4`}
        >
          <div className={styling.rewardGlow} aria-hidden="true" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={styling.rewardIcon}>
                <Coins size={21} strokeWidth={1.9} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <span className={styling.rewardLabel}>SESSION REWARD</span>

                <div className={styling.rewardAmount}>
                  +{reward} <span>IC</span>
                </div>
              </div>
            </div>

            <span className={styling.rewardLock}>
              <LockKeyhole size={14} aria-hidden="true" />
              <span>After approval</span>
            </span>
          </div>
        </div>

        {/* Optional session note */}
        {note && (
          <p className={`${styling.sessionNote} mt-4 text-xs leading-6`}>
            {note}
          </p>
        )}

        {/* Status feedback */}
        <div className={`${styling.sessionFeedback} mt-5`}>
          {approved ? (
            <div className={`${styling.notice} ${styling.noticeSuccess}`}>
              <span className={styling.noticeIcon}>
                <CheckCircle2 size={17} aria-hidden="true" />
              </span>

              <div className={styling.noticeCopy}>
                <strong>Attendance approved</strong>
                <span>Your attendance has been counted.</span>
              </div>

              <ShieldCheck
                className={styling.noticeTrailingIcon}
                size={19}
                aria-hidden="true"
              />
            </div>
          ) : pending ? (
            <div className={`${styling.notice} ${styling.noticePending}`}>
              <span className={styling.noticeIcon}>
                <Clock3 size={17} aria-hidden="true" />
              </span>

              <div className={styling.noticeCopy}>
                <strong>Awaiting admin review</strong>
                <span>Your request has been submitted.</span>
              </div>

              <span className={styling.pendingPulse} aria-hidden="true" />
            </div>
          ) : rejected ? (
            <div className={`${styling.notice} ${styling.noticeRejected}`}>
              <span className={styling.noticeIcon}>
                <CircleAlert size={17} aria-hidden="true" />
              </span>

              <div className={styling.noticeCopy}>
                <strong>Request rejected</strong>
                <span>
                  You may submit again while this session window is open.
                </span>
              </div>
            </div>
          ) : (
            <div className={`${styling.notice} ${styling.noticeInfo}`}>
              <span className={styling.noticeIcon}>
                <ShieldCheck size={17} aria-hidden="true" />
              </span>

              <div className={styling.noticeCopy}>
                <strong>
                  {open ? "Ready when you are" : "Check-in unavailable"}
                </strong>

                <span>
                  {open
                    ? "Submit your attendance for admin approval."
                    : "This session's check-in window is closed."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {!approved && !pending && (
          <button
            type="button"
            className={`${styling.sessionButton} ${
              rejected ? styling.buttonSecondary : styling.buttonPrimary
            } mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold transition-all duration-200`}
            disabled={buttonDisabled}
            onClick={handleStart}
          >
            <span>
              {rejected
                ? open
                  ? "Request again"
                  : "Session window closed"
                : open
                  ? "Start session"
                  : "Session window closed"}
            </span>

            {open && !disabled ? (
              <ArrowRight
                size={17}
                className={styling.buttonArrow}
                aria-hidden="true"
              />
            ) : (
              <LockKeyhole size={15} aria-hidden="true" />
            )}
          </button>
        )}

        {/* Footer */}
        <div className={`${styling.sessionFooter} mt-auto pt-5`}>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} aria-hidden="true" />
            Admin-verified attendance
          </span>

          <span className={styling.footerDot} aria-hidden="true" />

          <span>InternCash</span>
        </div>
      </div>
    </article>
  );
}
