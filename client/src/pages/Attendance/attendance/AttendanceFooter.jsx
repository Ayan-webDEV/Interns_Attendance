import styles from "./AttendanceFooter.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value) {
  if (!value) return "Not available";

  const text = String(value).trim();
  let date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    date = new Date(Date.UTC(year, month - 1, day));
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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

function getGroupCode(group) {
  return group?.groupCode || group?.code || group?.whatsappGroupCode || null;
}

function getGroupStatusLabel(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  const labels = {
    active: "Active",
    started: "Started",
    in_progress: "In progress",
    ongoing: "Ongoing",
    registration: "Registration",
    pending: "Pending activation",
    completed: "Completed",
    inactive: "Inactive",
    paused: "Paused",
  };

  return (
    labels[normalized.replaceAll(" ", "_")] ||
    normalized.replace(/\b\w/g, (character) => character.toUpperCase()) ||
    "Not specified"
  );
}

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
}

function getGroupStartDate(group) {
  return (
    group?.actualStartDate ||
    group?.startDate ||
    group?.internshipStartDate ||
    group?.internshipStart ||
    null
  );
}

function getGroupEndDate(group) {
  return (
    group?.actualEndDate ||
    group?.endDate ||
    group?.internshipEndDate ||
    group?.internshipEnd ||
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function GroupIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function CalendarIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function TrendIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 6-7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceFooter({
  group,
  groupStatus,
  todayKey,
  approvedDays = 0,
  totalSessions = 0,
}) {
  const groupName = getGroupName(group);
  const groupCode = getGroupCode(group);

  const statusLabel = getGroupStatusLabel(groupStatus);

  const startDate = getGroupStartDate(group);
  const endDate = getGroupEndDate(group);

  const safeApprovedDays = safeNumber(approvedDays);
  const safeTotalSessions = safeNumber(totalSessions);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <span className={styles.brandIcon}>
            <ShieldIcon />
          </span>

          <div>
            <strong>Intern Attendance Portal</strong>
            <p>Track your sessions. Stay consistent. Keep progressing.</p>
          </div>
        </div>

        <div className={styles.footerStatus}>
          <span className={styles.statusDot} />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className={styles.footerDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailIcon}>
            <GroupIcon />
          </span>

          <span className={styles.detailText}>
            <span>Internship group</span>
            <strong title={groupName}>{groupName}</strong>

            {groupCode && <small>Code: {groupCode}</small>}
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailIcon}>
            <CalendarIcon />
          </span>

          <span className={styles.detailText}>
            <span>Internship period</span>
            <strong>
              {startDate ? formatDate(startDate) : "Start date unavailable"}
            </strong>
            <small>
              {endDate
                ? `Until ${formatDate(endDate)}`
                : "End date unavailable"}
            </small>
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailIcon}>
            <TrendIcon />
          </span>

          <span className={styles.detailText}>
            <span>Attendance activity</span>
            <strong>
              {safeApprovedDays} approved{" "}
              {safeApprovedDays === 1 ? "day" : "days"}
            </strong>
            <small>
              {safeTotalSessions} recorded{" "}
              {safeTotalSessions === 1 ? "session" : "sessions"}
            </small>
          </span>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>
          Attendance information is displayed according to the latest available
          server records.
        </p>

        <span>
          {todayKey ? `Date: ${formatDate(todayKey)}` : "Intern portal"}
        </span>
      </div>
    </footer>
  );
}
