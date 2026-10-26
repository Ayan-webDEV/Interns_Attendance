import { useEffect, useMemo, useState } from "react";
import styles from "./teststats.module.css";

const PAGE_SIZE = 10;

const APPROVED_STATUSES = new Set(["approved", "admin_corrected_present"]);

const PENDING_STATUSES = new Set(["pending"]);

const MISSED_STATUSES = new Set(["rejected", "failed", "absent", "missed"]);

const normalizeStatus = (status) =>
  String(status || "pending")
    .toLowerCase()
    .trim();

const getStatusType = (status) => {
  const normalized = normalizeStatus(status);

  if (APPROVED_STATUSES.has(normalized)) return "approved";
  if (PENDING_STATUSES.has(normalized)) return "pending";
  if (MISSED_STATUSES.has(normalized)) return "missed";

  return "other";
};

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);

  const labels = {
    approved: "Approved",
    admin_corrected_present: "Admin corrected",
    pending: "Pending",
    rejected: "Rejected",
    failed: "Failed",
    absent: "Absent",
    missed: "Missed",
  };

  return (
    labels[normalized] ||
    normalized
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

const getRecordDate = (record) => {
  const value =
    record?.dateKey || record?.date || record?.createdAt || record?.timestamp;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getRecordSearchText = (record) =>
  [
    record?.dateKey,
    record?.date,
    record?.status,
    record?.checkIn,
    record?.checkOut,
    record?.checkInTime,
    record?.checkOutTime,
    record?.remarks,
    record?.note,
    record?.reason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const formatDate = (record) => {
  const date = getRecordDate(record);

  if (!date) return record?.dateKey || record?.date || "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value, fmtTime) => {
  if (!value) return "—";

  try {
    return typeof fmtTime === "function" ? fmtTime(value) : String(value);
  } catch {
    return String(value);
  }
};

const getCheckIn = (record) =>
  record?.checkIn ??
  record?.checkInTime ??
  record?.clockIn ??
  record?.punchIn ??
  null;

const getCheckOut = (record) =>
  record?.checkOut ??
  record?.checkOutTime ??
  record?.clockOut ??
  record?.punchOut ??
  null;

const getRecordKey = (record, index) =>
  record?._id ??
  record?.id ??
  `${record?.dateKey || record?.date || "record"}-${index}`;

function StatusBadge({ status }) {
  const type = getStatusType(status);

  return (
    <span className={`${styles.statusBadge} ${styles[`status_${type}`]}`}>
      <span className={styles.statusDot} />
      {getStatusLabel(status)}
    </span>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3.5"
            y="5"
            width="17"
            height="15"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M7.5 3.5V7M16.5 3.5V7M3.5 9.5H20.5M8 13H11M8 16H14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3>{hasFilters ? "No matching records" : "No attendance yet"}</h3>

      <p>
        {hasFilters
          ? "Try changing your search, date range, or status filter."
          : "Your attendance history will appear here when records are available."}
      </p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  startIndex,
  endIndex,
  onPageChange,
}) {
  if (totalRecords === 0) return null;

  const getPages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) return [1, 2, 3, 4, 5];

    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, index) => totalPages - 4 + index);
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  return (
    <div className={styles.pagination}>
      <p className={styles.paginationInfo}>
        Showing{" "}
        <strong>
          {startIndex + 1}–{endIndex}
        </strong>{" "}
        of <strong>{totalRecords}</strong> records
      </p>

      <nav className={styles.paginationControls} aria-label="Attendance pages">
        <button
          type="button"
          className={styles.pageArrow}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 4.5L7 10L12.5 15.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Previous</span>
        </button>

        <div className={styles.pageNumbers}>
          {getPages().map((page) => (
            <button
              type="button"
              key={page}
              className={`${styles.pageNumber} ${
                currentPage === page ? styles.pageNumberActive : ""
              }`}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.pageArrow}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span>Next</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M7.5 4.5L13 10L7.5 15.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </nav>
    </div>
  );
}

export default function AttendanceHistory({
  history = [],
  from = "",
  setFrom,
  to = "",
  setTo,
  fmtTime,
  approvedStatus,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const records = Array.isArray(history) ? history : [];

  const approvedStatusSet = useMemo(() => {
    const values = ["approved", "admin_corrected_present"];

    if (Array.isArray(approvedStatus)) {
      values.push(...approvedStatus);
    } else if (typeof approvedStatus === "string") {
      values.push(approvedStatus);
    }

    return new Set(values.map(normalizeStatus));
  }, [approvedStatus]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => {
        const recordDate = getRecordDate(record);

        // Date range filters use YYYY-MM-DD local date keys when available.
        const dateKey =
          record?.dateKey ||
          (recordDate
            ? [
                recordDate.getFullYear(),
                String(recordDate.getMonth() + 1).padStart(2, "0"),
                String(recordDate.getDate()).padStart(2, "0"),
              ].join("-")
            : "");

        if (from && dateKey && dateKey < from) return false;
        if (to && dateKey && dateKey > to) return false;

        if (query && !getRecordSearchText(record).includes(query)) {
          return false;
        }

        const normalized = normalizeStatus(record?.status);
        const isApproved =
          approvedStatusSet.has(normalized) ||
          APPROVED_STATUSES.has(normalized);

        if (statusFilter === "approved" && !isApproved) return false;

        if (statusFilter === "pending" && !PENDING_STATUSES.has(normalized)) {
          return false;
        }

        if (statusFilter === "missed" && !MISSED_STATUSES.has(normalized)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = getRecordDate(a.record)?.getTime() ?? 0;
        const dateB = getRecordDate(b.record)?.getTime() ?? 0;

        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [records, search, statusFilter, sortOrder, from, to, approvedStatusSet]);

  const stats = useMemo(() => {
    return records.reduce(
      (result, record) => {
        const status = normalizeStatus(record?.status);

        if (approvedStatusSet.has(status) || APPROVED_STATUSES.has(status)) {
          result.approved += 1;
        } else if (PENDING_STATUSES.has(status)) {
          result.pending += 1;
        } else if (MISSED_STATUSES.has(status)) {
          result.missed += 1;
        }

        return result;
      },
      {
        total: records.length,
        approved: 0,
        pending: 0,
        missed: 0,
      },
    );
  }, [records, approvedStatusSet]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  // Keep pagination valid when search, dates, or status filters change.
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRecord(null);
  }, [search, statusFilter, sortOrder, from, to]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredHistory.length);

  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(safePage);
    setSelectedRecord(null);
  };

  const hasFilters = Boolean(
    search.trim() || statusFilter !== "all" || from || to,
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
    setFrom?.("");
    setTo?.("");
    setCurrentPage(1);
    setSelectedRecord(null);
  };

  return (
    <section className={styles.historySection}>
      <div className={styles.sectionHeading}>
        <div className={styles.headingContent}>
          <div className={styles.headingIcon}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12A8 8 0 1 0 6.3 6.3L4 8.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M4 4.5V8.5H8M12 7.5V12L15 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h2>Attendance History</h2>
            <p>Review and track your attendance records.</p>
          </div>
        </div>

        <span className={styles.recordCount}>
          {filteredHistory.length}{" "}
          {filteredHistory.length === 1 ? "record" : "records"}
        </span>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statTotal}`}>
          <span className={styles.statLabel}>Total records</span>
          <strong className={styles.statValue}>{stats.total}</strong>
          <span className={styles.statCaption}>All attendance entries</span>
        </div>

        <div className={`${styles.statCard} ${styles.statApproved}`}>
          <span className={styles.statLabel}>Approved</span>
          <strong className={styles.statValue}>{stats.approved}</strong>
          <span className={styles.statCaption}>Verified attendance</span>
        </div>

        <div className={`${styles.statCard} ${styles.statPending}`}>
          <span className={styles.statLabel}>Pending</span>
          <strong className={styles.statValue}>{stats.pending}</strong>
          <span className={styles.statCaption}>Awaiting review</span>
        </div>

        <div className={`${styles.statCard} ${styles.statMissed}`}>
          <span className={styles.statLabel}>Missed / rejected</span>
          <strong className={styles.statValue}>{stats.missed}</strong>
          <span className={styles.statCaption}>Needs attention</span>
        </div>
      </div>

      <div className={styles.filterPanel}>
        <div className={styles.filterTopRow}>
          <label className={styles.searchBox}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle
                cx="8.8"
                cy="8.8"
                r="5.8"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M13.2 13.2L17 17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search attendance..."
              aria-label="Search attendance records"
            />
          </label>

          <label className={styles.filterField}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="missed">Missed / rejected</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Sort by</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sort attendance records"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <div className={styles.filterBottomRow}>
          <div className={styles.dateFilters}>
            <label className={styles.dateField}>
              <span>From</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom?.(event.target.value)}
                aria-label="Start date"
              />
            </label>

            <label className={styles.dateField}>
              <span>To</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo?.(event.target.value)}
                aria-label="End date"
              />
            </label>
          </div>

          {hasFilters && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <div className={styles.desktopTableWrap}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {paginatedHistory.map(({ record, index }) => (
                  <tr key={getRecordKey(record, index)}>
                    <td>
                      <div className={styles.dateCell}>
                        <span className={styles.dateIcon}>
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="4.5"
                              width="14"
                              height="12.5"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M6.5 2.8V6M13.5 2.8V6M3 8H17"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        <span>{formatDate(record)}</span>
                      </div>
                    </td>

                    <td>{formatTime(getCheckIn(record), fmtTime)}</td>
                    <td>{formatTime(getCheckOut(record), fmtTime)}</td>

                    <td>
                      <StatusBadge status={record?.status} />
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.detailsButton}
                        onClick={() => {
                          setSelectedRecord(
                            selectedRecord === getRecordKey(record, index)
                              ? null
                              : getRecordKey(record, index),
                          );
                        }}
                        aria-expanded={
                          selectedRecord === getRecordKey(record, index)
                        }
                      >
                        {selectedRecord === getRecordKey(record, index)
                          ? "Hide details"
                          : "View details"}
                      </button>

                      {selectedRecord === getRecordKey(record, index) && (
                        <div className={styles.inlineDetails}>
                          <strong>Record details</strong>
                          <span>Status: {getStatusLabel(record?.status)}</span>
                          {(record?.remarks ||
                            record?.note ||
                            record?.reason) && (
                            <span>
                              Note:{" "}
                              {record.remarks || record.note || record.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileRecords}>
            {paginatedHistory.map(({ record, index }) => {
              const recordKey = getRecordKey(record, index);
              const isExpanded = selectedRecord === recordKey;

              return (
                <article className={styles.mobileRecord} key={recordKey}>
                  <div className={styles.mobileRecordTop}>
                    <div className={styles.mobileDate}>
                      <span className={styles.dateIcon}>
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <rect
                            x="3"
                            y="4.5"
                            width="14"
                            height="12.5"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M6.5 2.8V6M13.5 2.8V6M3 8H17"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <strong>{formatDate(record)}</strong>
                        <span>Attendance record</span>
                      </div>
                    </div>

                    <StatusBadge status={record?.status} />
                  </div>

                  <div className={styles.mobileTimeGrid}>
                    <div className={styles.mobileTimeItem}>
                      <span>Check-in</span>
                      <strong>{formatTime(getCheckIn(record), fmtTime)}</strong>
                    </div>

                    <div className={styles.mobileTimeItem}>
                      <span>Check-out</span>
                      <strong>
                        {formatTime(getCheckOut(record), fmtTime)}
                      </strong>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.mobileDetails}>
                      <strong>Record details</strong>
                      <span>Status: {getStatusLabel(record?.status)}</span>
                      {(record?.remarks || record?.note || record?.reason) && (
                        <span>
                          Note: {record.remarks || record.note || record.reason}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.mobileDetailsButton}
                    onClick={() =>
                      setSelectedRecord(isExpanded ? null : recordKey)
                    }
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? "Hide details" : "View details"}
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className={isExpanded ? styles.chevronUp : ""}
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </article>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredHistory.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </section>
  );
}
