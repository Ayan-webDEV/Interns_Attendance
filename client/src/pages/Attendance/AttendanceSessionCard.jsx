import styles from "./AttendanceSessionCard.module.css";

/* -------------------------------------------------------------------------- */
/* Status helpers                                                             */
/* -------------------------------------------------------------------------- */

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

const MISSED_STATUSES = new Set(["missed", "auto_missed", "auto_absent"]);

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getRecordStatus(record, missedOverride = false) {
  const status = normalizeStatus(record?.status);

  // A persisted missed status must never be presented as a generic review.
  if (
    missedOverride ||
    MISSED_STATUSES.has(status) ||
    record?.isMissed === true ||
    record?.missed === true
  ) {
    return "missed";
  }

  if (APPROVED_STATUSES.has(status)) return "approved";
  if (PENDING_STATUSES.has(status)) return "pending";
  if (status === "rejected") return "rejected";

  if (record) return "review";

  return "not_started";
}

function getStatusDetails(record, missedOverride = false) {
  const status = getRecordStatus(record, missedOverride);

  const details = {
    approved: {
      label: "Approved",
      description: "Your attendance has been approved.",
      className: "approved",
      icon: "check",
    },
    pending: {
      label: "Under review",
      description: "Your attendance has been submitted for review.",
      className: "pending",
      icon: "clock",
    },
    rejected: {
      label: "Rejected",
      description:
        "Your previous submission was rejected. You may retry during this session's attendance window.",
      className: "rejected",
      icon: "alert",
    },
    missed: {
      label: "Missed",
      description:
        "This session was recorded as missed after its attendance window closed. It cannot be submitted now.",
      className: "missed",
      icon: "alert",
    },
    review: {
      label: "Needs review",
      description: "An existing record requires administrator review.",
      className: "review",
      icon: "info",
    },
    not_started: {
      label: "Not started",
      description: "Complete this session during its scheduled window.",
      className: "notStarted",
      icon: "calendar",
    },
  };

  return {
    status,
    ...details[status],
  };
}

/* -------------------------------------------------------------------------- */
/* Display helpers                                                            */
/* -------------------------------------------------------------------------- */

function formatTime(value) {
  if (value === null || value === undefined || value === "") return null;

  let hours;
  let minutes;

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value < 0 || value > 1440) return null;

    hours = Math.floor(value / 60);
    minutes = Math.floor(value % 60);
  } else {
    const match = String(value)
      .trim()
      .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

    if (!match) return null;

    hours = Number(match[1]);
    minutes = Number(match[2]);

    const meridiem = match[3]?.toUpperCase();

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours > 23 ||
      minutes > 59
    ) {
      return null;
    }

    if (meridiem) {
      if (hours < 1 || hours > 12) return null;

      if (meridiem === "AM" && hours === 12) hours = 0;
      if (meridiem === "PM" && hours !== 12) hours += 12;
    }
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function getWindowLabel(window) {
  if (!window) return "Scheduled session";

  if (window.label) return String(window.label);

  const start = formatTime(window.start ?? window.startTime ?? window.from);

  const end = formatTime(window.end ?? window.endTime ?? window.to);

  if (start && end) return `${start} – ${end}`;

  return "Scheduled session";
}

function getWindowStateLabel(windowState) {
  const state = normalizeStatus(windowState?.state);

  const labels = {
    open: "Window open",
    upcoming: "Upcoming",
    closed: "Window closed",
    insufficient_time: "Not enough time",
    insufficient: "Not enough time",
    unavailable: "Schedule unavailable",
  };

  return labels[state] || "Schedule status";
}

function getActionLabel({ isActive, eligibility, status }) {
  if (isActive) return "Session in progress";

  if (status === "approved") return "Approved";
  if (status === "pending") return "Submitted";
  if (status === "missed") return "Missed";
  if (status === "review") return "Needs review";

  if (status === "rejected" && eligibility?.canStart) {
    return "Retry session";
  }

  if (eligibility?.canStart) {
    return "Start session";
  }

  return "Unavailable";
}

function formatMissedAt(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

/* -------------------------------------------------------------------------- */
/* Small icons                                                                */
/* -------------------------------------------------------------------------- */

function StatusIcon({ type }) {
  const sharedProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "check":
      return (
        <svg {...sharedProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "alert":
      return (
        <svg {...sharedProps}>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3l-7.8-14.1a2 2 0 0 0-3.4 0Z" />
        </svg>
      );

    case "info":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      );

    default:
      return (
        <svg {...sharedProps}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceSessionCard({
  sessionNumber = 1,
  title,
  record = null,
  window = null,
  windowState = null,
  eligibility = {},

  approved = false,
  pending = false,
  rejected = false,
  missed = false,

  isActive = false,
  activeSession = null,

  busy = false,
  onStart,
}) {
  const normalizedActiveNumber = Number(
    activeSession?.sessionNumber ?? activeSession?.session,
  );

  const active =
    isActive ||
    (Boolean(activeSession) &&
      normalizedActiveNumber === Number(sessionNumber));

  const statusDetails = getStatusDetails(record, missed);

  // Keep the explicit flags compatible with AttendanceSessions' existing API.
  // A missed state takes precedence over an accidental generic/review state.
  const status =
    missed || statusDetails.status === "missed"
      ? "missed"
      : approved
        ? "approved"
        : pending
          ? "pending"
          : rejected
            ? "rejected"
            : statusDetails.status;

  const statusInfo =
    status === "approved"
      ? {
          label: "Approved",
          description: "Your attendance has been approved.",
          className: "approved",
          icon: "check",
        }
      : status === "pending"
        ? {
            label: "Under review",
            description: "Your attendance has been submitted for review.",
            className: "pending",
            icon: "clock",
          }
        : status === "rejected"
          ? {
              label: "Rejected",
              description:
                "Your previous submission was rejected. You may retry during the session window.",
              className: "rejected",
              icon: "alert",
            }
          : status === "missed"
            ? statusDetails
            : statusDetails;

  const windowLabel = getWindowLabel(window);
  const windowStateLabel = getWindowStateLabel(windowState);

  const canStart = Boolean(eligibility?.canStart) && !active;
  const actionLabel = getActionLabel({
    isActive: active,
    eligibility,
    status,
  });

  const isCompleted = status === "approved";
  const isSubmitted = status === "pending";
  const isMissed = status === "missed";
  const needsReview = status === "review";

  // A missed record is final for that session and must never be actionable,
  // even if an old/stale eligibility object still says canStart=true.
  const buttonDisabled =
    busy ||
    active ||
    isCompleted ||
    isSubmitted ||
    isMissed ||
    needsReview ||
    !canStart ||
    typeof onStart !== "function";

  const handleStart = () => {
    if (buttonDisabled) return;

    onStart(sessionNumber);
  };

  const reason =
    eligibility?.reason ||
    (active
      ? "Complete the active session using the attendance timer."
      : statusInfo.description);

  const missedAtLabel = isMissed ? formatMissedAt(record?.missedAt) : null;

  const missedReason = isMissed
    ? String(record?.missedReason || "").trim()
    : "";

  return (
    <article
      className={[
        styles.card,
        active ? styles.activeCard : "",
        isCompleted ? styles.approvedCard : "",
        status === "rejected" ? styles.rejectedCard : "",
        isMissed ? styles.missedCard : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${title || `Session ${sessionNumber}`} attendance`}
    >
      {/* Card header */}
      <div className={styles.cardHeader}>
        <div className={styles.sessionIdentity}>
          <div className={styles.sessionNumber}>
            <span>{String(sessionNumber).padStart(2, "0")}</span>
          </div>

          <div className={styles.sessionHeading}>
            <div className={styles.titleLine}>
              <h3>{title || `Session ${sessionNumber}`}</h3>

              {active && (
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  Active
                </span>
              )}
            </div>

            <p>{windowLabel}</p>
          </div>
        </div>

        <span
          className={[styles.statusBadge, styles[statusInfo.className]]
            .filter(Boolean)
            .join(" ")}
        >
          <StatusIcon type={statusInfo.icon} />
          {statusInfo.label}
        </span>
      </div>

      {/* Session information */}
      <div className={styles.sessionDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Schedule</span>
          <span className={styles.detailValue}>{windowLabel}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Window status</span>
          <span
            className={[
              styles.windowValue,
              windowState?.state === "open" ? styles.windowOpen : "",
              windowState?.state === "closed" ? styles.windowClosed : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className={styles.windowDot} />
            {windowStateLabel}
          </span>
        </div>
      </div>

      {/* Status explanation */}
      <div className={styles.statusDescription}>
        <div className={styles.statusDescriptionIcon}>
          <StatusIcon type={active ? "clock" : statusInfo.icon} />
        </div>

        <div className={styles.statusDescriptionContent}>
          <p>
            {active
              ? "Your session is in progress. Complete the required timer before submitting your attendance."
              : isMissed
                ? statusInfo.description
                : reason}
          </p>

          {missedAtLabel && (
            <small className={styles.missedMeta}>
              Recorded as missed: {missedAtLabel} IST
            </small>
          )}

          {missedReason && (
            <small className={styles.missedReason}>{missedReason}</small>
          )}
        </div>
      </div>

      {/* Action */}
      <div className={styles.cardFooter}>
        <span className={styles.footerHint}>
          {active
            ? "Use the active session timer below."
            : isCompleted
              ? "No further action required."
              : isSubmitted
                ? "Waiting for administrator review."
                : isMissed
                  ? "This session is recorded as missed and cannot be restarted. The other session remains independent."
                  : needsReview
                    ? "Contact your administrator for assistance."
                    : status === "rejected"
                      ? "You can submit this session again when eligible."
                      : "Attendance is checked against the server schedule."}
        </span>

        <button
          type="button"
          className={[
            styles.actionButton,
            isCompleted ? styles.approvedButton : "",
            isSubmitted ? styles.submittedButton : "",
            active ? styles.activeButton : "",
            status === "rejected" && canStart ? styles.retryButton : "",
            isMissed ? styles.missedButton : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={buttonDisabled}
          onClick={handleStart}
          aria-label={`${actionLabel} for ${title || `Session ${sessionNumber}`}`}
          title={!canStart && !active ? reason : undefined}
        >
          {busy ? (
            <>
              <span className={styles.buttonSpinner} />
              Processing
            </>
          ) : (
            <>
              {isCompleted ? (
                <StatusIcon type="check" />
              ) : active ? (
                <StatusIcon type="clock" />
              ) : isMissed ? (
                <StatusIcon type="alert" />
              ) : (
                <span className={styles.buttonArrow} aria-hidden="true">
                  →
                </span>
              )}

              {actionLabel}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
