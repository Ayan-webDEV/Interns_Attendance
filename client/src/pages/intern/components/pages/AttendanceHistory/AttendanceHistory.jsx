import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CircleX,
  History,
  RotateCcw,
  Gift,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  FileClock,
} from "lucide-react";
import styles from "./AttendanceHistory.module.css";

const APPROVED_STATUSES = new Set([
  "approved",
  "admin_corrected_present",
  "admin_corrected_approved",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "under_review",
]);

const MISSED_STATUSES = new Set([
  "rejected",
  "failed",
  "absent",
  "missed",
  "admin_rejected",
  "rejected_by_admin",
  "attendance_rejected",
  "request_rejected",
  "admin_corrected_absent",
  "not_present",
  "no_show",
  "declined",
]);

const DEFAULT_PAGE_SIZE = 10;

const getStatusType = (status) => {
  const value = String(status || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  // Check approved and pending first.
  if (APPROVED_STATUSES.has(value)) return "approved";
  if (PENDING_STATUSES.has(value)) return "pending";

  // Match known statuses and common backend status variants.
  if (
    MISSED_STATUSES.has(value) ||
    /(^|_)(rejected|reject|failed|failure|absent|missed|declined|no_show)(_|$)/.test(
      value,
    )
  ) {
    return "missed";
  }

  return "other";
};

// const DEFAULT_PAGE_SIZE = 10;

const formatStatus = (status) =>
  String(status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "—";

  // Prevent timezone shifts for YYYY-MM-DD date-only values.
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AttendanceHistory({
  history = [],
  from = "",
  setFrom,
  to = "",
  setTo,
  fmtTime: externalFmtTime,
  approvedStatus,
  missedCount = 0,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const safeHistory = Array.isArray(history) ? history : [];

  const approvedSet = useMemo(() => {
    const additionalStatuses = Array.isArray(approvedStatus)
      ? approvedStatus
      : typeof approvedStatus === "string"
        ? [approvedStatus]
        : [];

    return new Set([
      ...APPROVED_STATUSES,
      ...additionalStatuses.map((status) =>
        String(status).toLowerCase().trim(),
      ),
    ]);
  }, [approvedStatus]);

  const getRecordType = (record) => {
    const status = String(record?.status || "")
      .toLowerCase()
      .trim();

    if (approvedSet.has(status)) return "approved";

    return getStatusType(status);
  };

  // Convert a date into YYYY-MM-DD without changing date-only values.
  const getDateKey = (value) => {
    if (!value) return "";

    const stringValue = String(value);
    const match = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) return match[1];

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Summary cards count all records, not just the current page.
  const stats = useMemo(() => {
    const result = safeHistory.reduce(
      (totals, record) => {
        totals.total += 1;

        const type = getRecordType(record);

        if (type === "approved") totals.approved += 1;
        else if (type === "pending") totals.pending += 1;

        return totals;
      },
      { total: 0, approved: 0, pending: 0, missed: 0 },
    );

    result.missed = missedCount;

    return result;
  }, [safeHistory, approvedSet, missedCount]);

  // Search, status, date filters, and sorting are applied before pagination.
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeHistory
      .filter((record) => {
        const type = getRecordType(record);
        const recordDate = getDateKey(record.dateKey);

        if (statusFilter !== "all" && type !== statusFilter) {
          return false;
        }

        if (from && (!recordDate || recordDate < from)) {
          return false;
        }

        if (to && (!recordDate || recordDate > to)) {
          return false;
        }

        if (!query) return true;

        const searchable = [
          record.dateKey,
          record.sessionNumber === 1 ? "first session" : "re-attendance",
          record.status,
          record.rejectionReason,
          record._id,
          record.rewardAmount,
          record.rewardIssued ? "reward issued" : "",
          record.markedAt,
          record.approvedAt,
          record.rejectedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .slice()
      .sort((a, b) => {
        const dateCompare = String(a.dateKey || "").localeCompare(
          String(b.dateKey || ""),
        );

        const sessionCompare =
          Number(a.sessionNumber || 0) - Number(b.sessionNumber || 0);

        if (sortOrder === "oldest") {
          return dateCompare || sessionCompare;
        }

        return -dateCompare || -sessionCompare;
      });
  }, [safeHistory, search, statusFilter, sortOrder, from, to, approvedSet]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

  // Reset pagination when filters or sorting change.
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRecord(null);
  }, [search, statusFilter, sortOrder, from, to, pageSize]);

  // Keep the current page valid if records are removed.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (Math.min(currentPage, totalPages) - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredHistory.length);

  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
  const activePage = Math.min(currentPage, totalPages);

  const pageNumbers = Array.from(
    {
      length: Math.min(totalPages, 5),
    },
    (_, index) => {
      const firstPage = Math.max(1, Math.min(activePage - 2, totalPages - 4));

      return firstPage + index;
    },
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
    setFrom?.("");
    setTo?.("");
    setCurrentPage(1);
    setSelectedRecord(null);
  };

  const hasFilters = Boolean(search || statusFilter !== "all" || from || to);

  const displayTime = externalFmtTime || formatTime;

  const getApprovalText = (record) => {
    if (record.rejectionReason) return record.rejectionReason;

    if (record.approvedAt) {
      return `Approved ${displayTime(record.approvedAt)}`;
    }

    if (record.rejectedAt) {
      return `Rejected ${displayTime(record.rejectedAt)}`;
    }

    if (getRecordType(record) === "pending") {
      return "Waiting for admin";
    }

    if (getRecordType(record) === "approved") {
      return "Approved";
    }

    return "No additional details";
  };

  const renderStatus = (record) => {
    const type = getRecordType(record);

    const className =
      type === "approved"
        ? styles.statusApproved
        : type === "pending"
          ? styles.statusPending
          : type === "missed"
            ? styles.statusMissed
            : styles.statusOther;

    return (
      <span className={`${styles.statusBadge} ${className}`}>
        <span className={styles.statusDot} />
        {formatStatus(record.status)}
      </span>
    );
  };

  const renderRecordDetails = (record) => (
    <div className={styles.recordDetails}>
      <div className={styles.detailItem}>
        <span className={styles.detailLabel}>Requested at</span>
        <span className={styles.detailValue}>
          {displayTime(record.markedAt)}
        </span>
      </div>

      <div className={styles.detailItem}>
        <span className={styles.detailLabel}>Approval / rejection</span>
        <span className={styles.detailValue}>{getApprovalText(record)}</span>
      </div>

      <div className={styles.detailItem}>
        <span className={styles.detailLabel}>Reward</span>
        <span
          className={record.rewardIssued ? styles.rewardValue : styles.noReward}
        >
          {record.rewardIssued
            ? `+${record.rewardAmount || 0} IC`
            : "Not issued"}
        </span>
      </div>
    </div>
  );

  return (
    <section
      className={`${styles.historyPanel}  min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white`}
      aria-label="Attendance history"
    >
      {/* Header */}
      <div className={styles.historyHeader}>
        <div className="flex min-w-0 items-start gap-3">
          <span className={styles.headerIcon}>
            <History size={21} />
          </span>

          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Attendance history
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Review your requests, decisions, and earned rewards.
            </p>
          </div>
        </div>

        <span className={styles.totalBadge}>
          <FileClock size={14} />
          {stats.total} records
        </span>
      </div>

      {/* Summary cards — existing UI preserved */}

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
          <span className={styles.statLabel}>Rejected / missed</span>
          <strong className={styles.statValue}>{stats.missed}</strong>
          <span className={styles.statCaption}>Needs attention</span>
        </div>
      </div>

      {/* Search and filters — existing UI preserved */}
      <div className={styles.filterSection}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className={styles.searchBox}>
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search date, status, session..."
              aria-label="Search attendance records"
            />

            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <label className={styles.selectBox}>
            <Filter size={16} />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by attendance status"
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="missed">Rejected / missed</option>
              <option value="other">Other statuses</option>
            </select>

            <ChevronDown size={15} />
          </label>

          <button
            type="button"
            className={styles.sortButton}
            onClick={() =>
              setSortOrder((current) =>
                current === "newest" ? "oldest" : "newest",
              )
            }
          >
            <ArrowUpDown size={16} />
            {sortOrder === "newest" ? "Newest first" : "Oldest first"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={styles.dateFilter}>
            <CalendarDays size={16} />
            <span>From</span>

            <input
              type="date"
              value={from || ""}
              max={to || undefined}
              onChange={(event) => setFrom?.(event.target.value)}
              aria-label="Filter from date"
            />
          </label>

          <label className={styles.dateFilter}>
            <CalendarDays size={16} />
            <span>To</span>

            <input
              type="date"
              value={to || ""}
              min={from || undefined}
              onChange={(event) => setTo?.(event.target.value)}
              aria-label="Filter to date"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500" aria-live="polite">
            Showing{" "}
            <strong className="text-slate-700">
              {filteredHistory.length === 0 ? 0 : startIndex + 1}–{endIndex}
            </strong>{" "}
            of {filteredHistory.length} filtered records ({stats.total} total)
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className={styles.resetButton}
            >
              <RotateCcw size={14} />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className={`${styles.desktopTable} hidden md:block`}>
        <div className="overflow-x-auto">
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>Status</th>
                <th>Requested at</th>
                <th>Decision details</th>
                <th>Reward</th>
              </tr>
            </thead>

            <tbody>
              {paginatedHistory.map((record, index) => (
                <tr
                  key={
                    record._id ||
                    `${record.dateKey}-${record.sessionNumber}-${startIndex + index}`
                  }
                >
                  <td>
                    <div className={styles.dateCell}>
                      <CalendarDays size={16} />
                      <span>{formatDate(record.dateKey)}</span>
                    </div>
                  </td>

                  <td>
                    <span className={styles.sessionPill}>
                      {Number(record.sessionNumber) === 1
                        ? "First session"
                        : "Re-attendance"}
                    </span>
                  </td>

                  <td>{renderStatus(record)}</td>

                  <td className={styles.mutedCell}>
                    {displayTime(record.markedAt)}
                  </td>

                  <td className={styles.decisionCell}>
                    {getApprovalText(record)}
                  </td>

                  <td>
                    {record.rewardIssued ? (
                      <span className={styles.rewardPill}>
                        <Gift size={14} />+{record.rewardAmount || 0} IC
                      </span>
                    ) : (
                      <span className={styles.noReward}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && <EmptyState hasFilters={hasFilters} />}
      </div>

      {/* Mobile record cards */}
      <div className={`${styles.mobileRecords} md:hidden`}>
        {paginatedHistory.map((record, index) => {
          const recordKey =
            record._id ||
            `${record.dateKey}-${record.sessionNumber}-${startIndex + index}`;

          const isExpanded = selectedRecord === recordKey;

          return (
            <article className={styles.mobileRecord} key={recordKey}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={styles.mobileDateIcon}>
                    <CalendarDays size={18} />
                  </span>

                  <div className="min-w-0">
                    <p className={styles.mobileDate}>
                      {formatDate(record.dateKey)}
                    </p>
                    <p className={styles.mobileSession}>
                      {Number(record.sessionNumber) === 1
                        ? "First session"
                        : "Re-attendance"}
                    </p>
                  </div>
                </div>

                {renderStatus(record)}
              </div>

              {renderRecordDetails(record)}

              <button
                type="button"
                className={styles.detailsButton}
                onClick={() =>
                  setSelectedRecord((current) =>
                    current === recordKey ? null : recordKey,
                  )
                }
                aria-expanded={isExpanded}
              >
                {isExpanded ? "Hide record details" : "View record details"}

                <ChevronDown
                  size={15}
                  className={isExpanded ? styles.chevronOpen : ""}
                />
              </button>

              {isExpanded && (
                <div className={styles.expandedDetails}>
                  <p>
                    <strong>Record ID:</strong> {record._id || "Unavailable"}
                  </p>

                  <p>
                    <strong>Marked at:</strong>{" "}
                    {record.markedAt
                      ? new Date(record.markedAt).toLocaleString("en-IN")
                      : "—"}
                  </p>

                  <p>
                    <strong>Approved at:</strong>{" "}
                    {record.approvedAt
                      ? new Date(record.approvedAt).toLocaleString("en-IN")
                      : "—"}
                  </p>

                  {record.rejectionReason && (
                    <p>
                      <strong>Reason:</strong> {record.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {filteredHistory.length === 0 && <EmptyState hasFilters={hasFilters} />}
      </div>

      {/* Always show pagination for nonempty results. */}
      {filteredHistory.length > 0 && (
        <nav
          className={styles.pagination}
          aria-label="Attendance history pagination"
        >
          <p className={styles.paginationInfo}>
            Showing{" "}
            <strong>
              {startIndex + 1}–{endIndex}
            </strong>{" "}
            of <strong>{filteredHistory.length}</strong> records
          </p>

          <div className={styles.paginationControls}>
            <label className={styles.pageSizeControl}>
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                aria-label="Records per page"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.pageArrow}
              onClick={() => {
                setCurrentPage((page) =>
                  Math.max(1, Math.min(page, totalPages) - 1),
                );
                setSelectedRecord(null);
              }}
              disabled={activePage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            <div className={styles.pageNumbers}>
              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  className={`${styles.pageNumber} ${
                    activePage === page ? styles.pageNumberActive : ""
                  }`}
                  onClick={() => {
                    setCurrentPage(page);
                    setSelectedRecord(null);
                  }}
                  aria-label={`Go to page ${page}`}
                  aria-current={activePage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.pageArrow}
              onClick={() => {
                setCurrentPage((page) => Math.min(totalPages, page + 1));
                setSelectedRecord(null);
              }}
              disabled={activePage === totalPages}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </nav>
      )}

      {/* Existing footer */}
      {filteredHistory.length > 0 && (
        <div className={styles.historyFooter}>
          <span>
            <CheckCircle2 size={15} />
            Your attendance records are shown below.
          </span>
          <span>{filteredHistory.length} results</span>
        </div>
      )}
    </section>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        <History size={24} />
      </span>

      <h3>
        {hasFilters ? "No matching records" : "No attendance records yet"}
      </h3>

      <p>
        {hasFilters
          ? "Try changing your search, status, or date range."
          : "Your attendance requests will appear here once you submit one."}
      </p>
    </div>
  );
}
