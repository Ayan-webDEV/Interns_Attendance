import { useEffect, useMemo, useState } from "react";

import styles from "./AttendanceHistory.module.css";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

const MISSED_STATUSES = new Set(["missed", "auto_missed", "auto_absent"]);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getStatus(record) {
  const status = normalizeStatus(record?.status);

  if (APPROVED_STATUSES.has(status)) return "approved";
  if (PENDING_STATUSES.has(status)) return "pending";
  if (status === "rejected") return "rejected";
  if (MISSED_STATUSES.has(status)) return "missed";

  return "review";
}

function getStatusLabel(status) {
  const labels = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    missed: "Missed",
    review: "Needs review",
  };

  return labels[status] || "Needs review";
}

function getSessionNumber(record) {
  const value = Number(
    record?.sessionNumber ??
      record?.session ??
      record?.sessionNo ??
      record?.number,
  );

  return value === 1 || value === 2 ? value : null;
}

function getRecordDate(record) {
  const value =
    record?.dateKey ||
    record?.date ||
    record?.attendanceDate ||
    record?.sessionDate ||
    record?.markedDate ||
    record?.missedAt ||
    record?.createdAt ||
    record?.startedAt;

  if (!value) return null;

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getDateTimestamp(record) {
  const dateKey = getRecordDate(record);

  if (!dateKey) return 0;

  const [year, month, day] = dateKey.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const dateKey = getRecordDate({ date: value });

  if (!dateKey) return "Date unavailable";

  const [year, month, day] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatDuration(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return "Not available";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

function getSessionLabel(record) {
  const number = getSessionNumber(record);

  if (number) return `Session ${number}`;

  return (
    record?.sessionName ||
    record?.sessionLabel ||
    record?.sessionType ||
    "Attendance session"
  );
}

function getRecordId(record, index) {
  return (
    record?._id ||
    record?.id ||
    `${getRecordDate(record) || "record"}-${getSessionNumber(record) || index}-${index}`
  );
}

function getReference(record) {
  return (
    record?.attendanceId ||
    record?.recordId ||
    record?._id ||
    record?.id ||
    null
  );
}

function getReviewNote(record) {
  if (getStatus(record) === "missed") {
    return (
      record?.missedReason ||
      record?.reason ||
      "The attendance window closed before a submission was recorded."
    );
  }

  return (
    record?.adminNote ||
    record?.reviewNote ||
    record?.remarks ||
    record?.rejectionReason ||
    record?.note ||
    null
  );
}

function getStudentName(record) {
  return (
    record?.internName ||
    record?.userName ||
    record?.name ||
    record?.intern?.name ||
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
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

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDown({ expanded }) {
  return (
    <svg
      className={expanded ? styles.rotatedChevron : ""}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Status badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }) {
  return (
    <span
      className={`${styles.statusBadge} ${styles[status] || styles.review}`}
    >
      <span className={styles.statusDot} />
      {getStatusLabel(status)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Expanded record details                                                    */
/* -------------------------------------------------------------------------- */

function RecordDetails({ record }) {
  const status = getStatus(record);
  const reviewNote = getReviewNote(record);

  const details = [
    {
      label: "Session started",
      value: formatDateTime(
        record?.startedAt || record?.startTime || record?.sessionStartedAt,
      ),
    },
    {
      label: "Submitted at",
      value: formatDateTime(
        record?.submittedAt ||
          record?.markedAt ||
          record?.completedAt ||
          record?.updatedAt,
      ),
    },
    {
      label: "Duration",
      value: formatDuration(
        record?.durationSeconds ?? record?.elapsedSeconds ?? record?.timeSpent,
      ),
    },
    {
      label: "Reviewed at",
      value: formatDateTime(
        record?.reviewedAt || record?.approvedAt || record?.rejectedAt,
      ),
    },
    ...(status === "missed"
      ? [
          {
            label: "Missed at",
            value: formatDateTime(
              record?.missedAt || record?.createdAt || record?.updatedAt,
            ),
          },
          ...(record?.missedSource
            ? [{ label: "Missed source", value: String(record.missedSource) }]
            : []),
        ]
      : []),
  ];

  const reference = getReference(record);

  return (
    <div className={styles.expandedContent}>
      <div className={styles.expandedGrid}>
        {details.map((detail) => (
          <div className={styles.expandedDetail} key={detail.label}>
            <span>{detail.label}</span>
            <strong>{detail.value}</strong>
          </div>
        ))}

        {reference && (
          <div className={styles.expandedDetail}>
            <span>Record reference</span>
            <strong className={styles.referenceValue}>
              {String(reference)}
            </strong>
          </div>
        )}
      </div>

      {reviewNote && (
        <div className={styles.reviewNote}>
          <span className={styles.reviewNoteLabel}>
            {status === "missed" ? "Missed reason" : "Administrator note"}
          </span>

          <p>{String(reviewNote)}</p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
}) {
  if (totalRecords === 0) return null;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        Showing{" "}
        <strong>
          {startIndex}–{endIndex}
        </strong>{" "}
        of <strong>{totalRecords}</strong> records
      </span>

      <div className={styles.paginationControls}>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => onPageChange(1)}
            >
              1
            </button>

            {startPage > 2 && <span className={styles.pageEllipsis}>…</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={[
              styles.pageButton,
              currentPage === page ? styles.activePage : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className={styles.pageEllipsis}>…</span>
            )}

            <button
              type="button"
              className={styles.pageButton}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceHistory({
  history = [],
  from = "",
  setFrom,
  to = "",
  setTo,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRecord, setExpandedRecord] = useState(null);

  /* ------------------------------------------------------------------------ */
  /* Filter and sort records                                                  */
  /* ------------------------------------------------------------------------ */

  const filteredRecords = useMemo(() => {
    const records = Array.isArray(history) ? history : [];
    const normalizedSearch = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const recordDate = getRecordDate(record);

        if (from && (!recordDate || recordDate < from)) {
          return false;
        }

        if (to && (!recordDate || recordDate > to)) {
          return false;
        }

        const status = getStatus(record);

        if (statusFilter !== "all" && status !== statusFilter) {
          return false;
        }

        if (!normalizedSearch) return true;

        const searchableText = [
          recordDate,
          getSessionLabel(record),
          getStatusLabel(status),
          getStudentName(record),
          getReference(record),
          record?.remarks,
          record?.adminNote,
          record?.reviewNote,
          record?.rejectionReason,
          record?.missedAt,
          record?.missedReason,
          record?.missedSource,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const difference = getDateTimestamp(a) - getDateTimestamp(b);

        if (difference !== 0) {
          return sortOrder === "newest" ? -difference : difference;
        }

        const sessionDifference =
          (getSessionNumber(a) || 0) - (getSessionNumber(b) || 0);

        return sortOrder === "newest" ? -sessionDifference : sessionDifference;
      });
  }, [history, search, statusFilter, sortOrder, from, to]);

  /* ------------------------------------------------------------------------ */
  /* Pagination state                                                         */
  /* ------------------------------------------------------------------------ */

  const totalRecords = filteredRecords.length;

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRecord(null);
  }, [search, statusFilter, sortOrder, from, to]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  /* ------------------------------------------------------------------------ */
  /* Summary counts                                                           */
  /* ------------------------------------------------------------------------ */

  const summary = useMemo(() => {
    const records = Array.isArray(history) ? history : [];

    return records.reduce(
      (result, record) => {
        const status = getStatus(record);

        if (status === "approved") result.approved += 1;
        else if (status === "pending") result.pending += 1;
        else if (status === "rejected") result.rejected += 1;
        else if (status === "missed") result.missed += 1;

        return result;
      },
      {
        approved: 0,
        pending: 0,
        rejected: 0,
        missed: 0,
      },
    );
  }, [history]);

  /* ------------------------------------------------------------------------ */
  /* Event handlers                                                           */
  /* ------------------------------------------------------------------------ */

  const handleExpand = (recordId) => {
    setExpandedRecord((current) => (current === recordId ? null : recordId));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");

    if (typeof setFrom === "function") setFrom("");
    if (typeof setTo === "function") setTo("");
  };

  const handleFromChange = (event) => {
    const value = event.target.value;

    if (typeof setFrom === "function") setFrom(value);
  };

  const handleToChange = (event) => {
    const value = event.target.value;

    if (typeof setTo === "function") setTo(value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <section className={styles.section} aria-label="Attendance history">
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>YOUR RECORDS</span>
          <h2>Attendance history</h2>
          <p>Search and review your previous attendance submissions.</p>
        </div>

        <span className={styles.totalBadge}>
          {totalRecords} {totalRecords === 1 ? "record" : "records"}
        </span>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryDot} ${styles.approvedDot}`} />
          <span>Approved</span>
          <strong>{summary.approved}</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={`${styles.summaryDot} ${styles.pendingDot}`} />
          <span>Pending</span>
          <strong>{summary.pending}</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={`${styles.summaryDot} ${styles.rejectedDot}`} />
          <span>Rejected</span>
          <strong>{summary.rejected}</strong>
        </div>

        <div className={styles.summaryItem}>
          <span className={`${styles.summaryDot} ${styles.missedDot}`} />
          <span>Missed</span>
          <strong>{summary.missed}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by date, session, status or reference..."
            aria-label="Search attendance history"
          />

          {search && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.filterControls}>
          <label className={styles.filterField}>
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="missed">Missed</option>
              <option value="review">Needs review</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>From date</span>

            <span className={styles.dateInputWrapper}>
              <CalendarIcon />

              <input
                type="date"
                value={from || ""}
                max={to || undefined}
                onChange={handleFromChange}
                aria-label="Filter from date"
              />
            </span>
          </label>

          <label className={styles.filterField}>
            <span>To date</span>

            <span className={styles.dateInputWrapper}>
              <CalendarIcon />

              <input
                type="date"
                value={to || ""}
                min={from || undefined}
                onChange={handleToChange}
                aria-label="Filter to date"
              />
            </span>
          </label>

          <label className={styles.filterField}>
            <span>Sort by</span>

            <select value={sortOrder} onChange={handleSortChange}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          <button
            type="button"
            className={styles.resetButton}
            onClick={clearFilters}
            disabled={
              !search &&
              statusFilter === "all" &&
              !from &&
              !to &&
              sortOrder === "newest"
            }
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Records */}
      <div className={styles.recordsCard}>
        <div className={styles.recordsHeader}>
          <h3>Recorded sessions</h3>

          <span>
            {totalRecords} matching {totalRecords === 1 ? "entry" : "entries"}
          </span>
        </div>

        {paginatedRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <CalendarIcon />
            </span>

            <h3>No attendance records found</h3>

            <p>
              {search || statusFilter !== "all" || from || to
                ? "Try changing your search or filters to find attendance records."
                : "Your submitted attendance sessions will appear here."}
            </p>

            {(search || statusFilter !== "all" || from || to) && (
              <button
                type="button"
                onClick={clearFilters}
                className={styles.emptyResetButton}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Submitted / recorded</th>
                    <th>Status</th>
                    <th aria-label="Expand details" />
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map((record, index) => {
                    const recordId = getRecordId(record, index);
                    const status = getStatus(record);
                    const isExpanded = expandedRecord === recordId;

                    const date = getRecordDate(record);

                    const submittedAt =
                      status === "missed"
                        ? record?.missedAt ||
                          record?.createdAt ||
                          record?.updatedAt
                        : record?.submittedAt ||
                          record?.markedAt ||
                          record?.completedAt ||
                          record?.updatedAt ||
                          record?.createdAt;

                    return (
                      <tr
                        key={recordId}
                        className={isExpanded ? styles.expandedRow : ""}
                      >
                        <td colSpan={5} className={styles.recordCell}>
                          <div className={styles.recordRow}>
                            <div className={styles.dateCell}>
                              <strong>{formatDate(date)}</strong>
                              <span>{date || "Date unavailable"}</span>
                            </div>

                            <div className={styles.sessionCell}>
                              <span className={styles.sessionIcon}>
                                {getSessionNumber(record) || "•"}
                              </span>

                              <strong>{getSessionLabel(record)}</strong>
                            </div>

                            <div className={styles.submittedCell}>
                              <strong>
                                {status === "missed"
                                  ? "Auto-recorded"
                                  : submittedAt
                                    ? formatTime(submittedAt)
                                    : "Not available"}
                              </strong>

                              <span>
                                {submittedAt
                                  ? formatDateTime(submittedAt)
                                  : status === "missed"
                                    ? "Missed time unavailable"
                                    : "Submission time unavailable"}
                              </span>
                            </div>

                            <div className={styles.statusCell}>
                              <StatusBadge status={status} />
                            </div>

                            <div className={styles.expandCell}>
                              <button
                                type="button"
                                className={styles.expandButton}
                                onClick={() => handleExpand(recordId)}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded
                                    ? "Hide attendance details"
                                    : "Show attendance details"
                                }
                              >
                                <ChevronDown expanded={isExpanded} />
                              </button>
                            </div>
                          </div>

                          {isExpanded && <RecordDetails record={record} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </section>
  );
}
