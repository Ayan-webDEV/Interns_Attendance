import { useMemo, useState } from "react";

import AttendanceSessionCard from "../AttendanceSessionCard";
import styles from "./AttendanceSessions.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const MISSED_STATUSES = new Set(["missed", "auto_missed", "auto_absent"]);

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function isMissedSession(session) {
  const status = normalizeStatus(session?.record?.status);

  return (
    session?.missed === true ||
    session?.record?.isMissed === true ||
    session?.record?.missed === true ||
    MISSED_STATUSES.has(status)
  );
}

function getActiveSessionNumber(activeSession) {
  if (!activeSession) return null;

  const number = Number(activeSession.sessionNumber ?? activeSession.session);

  return number === 1 || number === 2 ? number : null;
}

function getSessionState(session) {
  // A persisted missed record is final for that session. Check it before
  // other flags so an outdated flag cannot make a missed session look open.
  if (isMissedSession(session)) return "missed";

  const status = normalizeStatus(session?.record?.status);

  if (
    session?.approved ||
    status === "approved" ||
    status === "admin_corrected_present"
  ) {
    return "approved";
  }

  if (
    session?.pending ||
    status === "pending" ||
    status === "awaiting_review" ||
    status === "under_review"
  ) {
    return "pending";
  }

  if (session?.rejected || status === "rejected") {
    return "rejected";
  }

  return "not_started";
}

function getSummary(sessions) {
  const states = sessions.map(getSessionState);

  const approved = states.filter((state) => state === "approved").length;
  const pending = states.filter((state) => state === "pending").length;
  const rejected = states.filter((state) => state === "rejected").length;
  const missed = states.filter((state) => state === "missed").length;

  // A rejected session remains retryable within its own time window, so it
  // remains in the remaining count. A missed session is final and is excluded.
  const remaining = Math.max(0, sessions.length - approved - pending - missed);

  return {
    approved,
    pending,
    rejected,
    missed,
    remaining,
  };
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function SessionsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m8 15 2 2 5-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function MissedIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3l-7.8-14.1a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

function SessionSummary({ summary = {}, onFilterChange }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const cards = [
    {
      key: "approved",
      label: "Approved",
      value: Number(summary.approved) || 0,
      description: "Successfully verified",
      icon: <CheckIcon />,
    },
    {
      key: "pending",
      label: "Under review",
      value: Number(summary.pending) || 0,
      description: "Awaiting admin approval",
      icon: <ClockIcon />,
    },
    {
      key: "missed",
      label: "Missed",
      value: Number(summary.missed) || 0,
      description: "Attendance window closed",
      icon: <MissedIcon />,
    },
    {
      key: "remaining",
      label: "Remaining",
      value: Number(summary.remaining) || 0,
      description: "Sessions still available",
      icon: <SessionsIcon />,
    },
  ];

  const total = Math.max(
    2,
    cards.reduce((sum, card) => sum + card.value, 0),
  );

  const handleFilter = (key) => {
    const nextFilter = activeFilter === key ? "all" : key;

    setActiveFilter(nextFilter);
    onFilterChange?.(nextFilter === "all" ? null : nextFilter);
  };

  return (
    <section className={styles.summary} aria-label="Today's attendance summary">
      <div className={styles.summaryHeader}>
        <div>
          <span className={styles.summaryEyebrow}>DAILY OVERVIEW</span>

          <h3>Today's session summary</h3>

          <p>Track your attendance progress at a glance.</p>
        </div>

        <span className={styles.summaryTotal}>
          <span className={styles.summaryTotalDot} />
          {total} sessions
        </span>
      </div>

      <div className={styles.summaryGrid}>
        {cards.map((card) => {
          const percentage = Math.min(
            100,
            Math.round((card.value / total) * 100),
          );

          const selected = activeFilter === card.key;

          return (
            <button
              key={card.key}
              type="button"
              className={[
                styles.summaryCard,
                styles[`${card.key}Card`],
                selected ? styles.summaryCardActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleFilter(card.key)}
              aria-pressed={selected}
              title={`Show ${card.label.toLowerCase()} sessions`}
            >
              <div className={styles.summaryCardTop}>
                <span
                  className={`${styles.summaryIcon} ${
                    styles[`${card.key}Icon`]
                  }`}
                >
                  {card.icon}
                </span>

                <span
                  className={`${styles.summaryArrow} ${
                    selected ? styles.summaryArrowActive : ""
                  }`}
                  aria-hidden="true"
                >
                  {selected ? "✓" : "↗"}
                </span>
              </div>

              <div className={styles.summaryValue}>{card.value}</div>

              <div className={styles.summaryLabel}>{card.label}</div>

              <div className={styles.summaryMeta}>{card.description}</div>

              <div
                className={styles.summaryProgress}
                aria-label={`${percentage}% of today's sessions`}
              >
                <span
                  className={`${styles.summaryProgressFill} ${
                    styles[`${card.key}Fill`]
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className={styles.summaryPercentage}>
                <span>Today's share</span>
                <strong>{percentage}%</strong>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.summaryFooter}>
        <span>
          <span className={styles.summaryFooterDot} />
          Updated attendance overview
        </span>

        {activeFilter !== "all" && (
          <button
            type="button"
            className={styles.clearSummaryFilter}
            onClick={() => handleFilter(activeFilter)}
          >
            Clear selection ×
          </button>
        )}

        {activeFilter === "all" && (
          <span className={styles.summaryHint}>
            Select a card to filter sessions
          </span>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceSessions({
  sessions = [],
  activeSession = null,
  remaining = 0,
  busy = false,
  onStart,
}) {
  const safeSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];

    return sessions
      .filter(Boolean)
      .slice()
      .sort(
        (a, b) => Number(a.sessionNumber || 0) - Number(b.sessionNumber || 0),
      );
  }, [sessions]);

  const activeSessionNumber = getActiveSessionNumber(activeSession);

  const summary = useMemo(() => {
    return getSummary(safeSessions);
  }, [safeSessions]);

  if (!safeSessions.length) {
    return (
      <section className={styles.section}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <SessionsIcon />
          </span>

          <h3>Sessions are not available</h3>

          <p>
            Your attendance sessions will appear here after the schedule becomes
            available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.section}
      aria-label="Today's attendance sessions"
    >
      <div className={styles.sectionHeader}>
        <div className={styles.headingGroup}>
          <span className={styles.headingIcon}>
            <SessionsIcon />
          </span>

          <div>
            <span className={styles.eyebrow}>DAILY ATTENDANCE</span>
            <h2>Your sessions</h2>

            <p>
              Each session has its own attendance window. Missing or having one
              session rejected does not block the other.
            </p>
          </div>
        </div>

        <span className={styles.sessionCount}>
          {safeSessions.length}{" "}
          {safeSessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      <SessionSummary summary={summary} />

      {activeSessionNumber && (
        <div className={styles.activeNotice} role="status" aria-live="polite">
          <span className={styles.activeNoticeDot} />

          <div>
            <strong>Session {activeSessionNumber} is currently active</strong>
            <p>
              {remaining > 0
                ? "Complete the remaining timer before submitting your attendance."
                : "Your minimum session time is complete. You can submit your attendance."}
            </p>
          </div>
        </div>
      )}

      <div className={styles.sessionsGrid}>
        {safeSessions.map((session) => {
          const sessionNumber = Number(session.sessionNumber);
          const isActive = activeSessionNumber === sessionNumber;
          const missed = getSessionState(session) === "missed";

          return (
            <AttendanceSessionCard
              key={sessionNumber}
              sessionNumber={sessionNumber}
              title={session.title}
              record={session.record}
              window={session.window}
              windowState={session.windowState}
              eligibility={session.eligibility}
              approved={session.approved}
              pending={session.pending}
              rejected={session.rejected}
              missed={missed}
              isActive={isActive}
              activeSession={isActive ? activeSession : null}
              busy={busy}
              onStart={onStart}
            />
          );
        })}
      </div>

      <div className={styles.policyNote}>
        <span className={styles.policyIcon} aria-hidden="true">
          i
        </span>

        <p>
          Attendance can only be started during its permitted session window.
          Each session is tracked separately. A missed or rejected Session 1
          does not prevent you from completing Session 2 during Session 2's own
          window, and the same applies in reverse.
        </p>
      </div>
    </section>
  );
}
