import styles from "./AttendanceStatusBanner.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value) {
  if (!value) return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatGroupStatus(value) {
  if (!value) return "Not specified";

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getGroupName(group) {
  return (
    group?.groupName ||
    group?.name ||
    group?.title ||
    group?.whatsappGroupName ||
    "Internship group"
  );
}

function getTone(value) {
  const allowedTones = new Set([
    "success",
    "warning",
    "error",
    "info",
    "default",
  ]);

  return allowedTones.has(value) ? value : "default";
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function StatusIcon({ tone }) {
  const sharedProps = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (tone === "success") {
    return (
      <svg {...sharedProps}>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m8.5 12 2.3 2.3 4.8-4.8" />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg {...sharedProps}>
        <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }

  if (tone === "info") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceStatusBanner({
  status = {},
  group,
  groupStatus,
  groupStartDate,
  groupEndDate,
}) {
  const tone = getTone(status?.tone || status?.status);
  const title = status?.title || "Attendance information";
  const message =
    status?.message || "Check your attendance schedule and session details.";

  const groupName = getGroupName(group);
  const formattedGroupStatus = formatGroupStatus(groupStatus);

  const startLabel = formatDate(groupStartDate);
  const endLabel = formatDate(groupEndDate);

  const hasDateRange = Boolean(startLabel || endLabel);

  return (
    <section
      className={`${styles.banner} ${styles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <div className={styles.bannerMain}>
        <div className={styles.statusIcon}>
          <StatusIcon tone={tone} />
        </div>

        <div className={styles.statusContent}>
          <div className={styles.titleRow}>
            <h2>{title}</h2>

            <span className={styles.statusPill}>{formattedGroupStatus}</span>
          </div>

          <p>{message}</p>
        </div>
      </div>

      <div className={styles.bannerDetails}>
        <div className={styles.detail}>
          <span className={styles.detailIcon}>
            <GroupIcon />
          </span>

          <span className={styles.detailText}>
            <span className={styles.detailLabel}>Internship group</span>
            <strong title={groupName}>{groupName}</strong>
          </span>
        </div>

        {hasDateRange && (
          <div className={styles.detail}>
            <span className={styles.detailIcon}>
              <CalendarIcon />
            </span>

            <span className={styles.detailText}>
              <span className={styles.detailLabel}>Internship period</span>
              <strong>
                {startLabel || "Start date unavailable"}
                {" – "}
                {endLabel || "End date unavailable"}
              </strong>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
