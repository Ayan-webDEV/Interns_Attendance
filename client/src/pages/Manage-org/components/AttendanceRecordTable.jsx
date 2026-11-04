import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import styles from "./AttendanceRecordTable.module.css";

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    className: "approved",
  },
  pending: {
    label: "Pending",
    className: "pending",
  },
  rejected: {
    label: "Rejected",
    className: "rejected",
  },
  missed: {
    label: "Missed",
    className: "missed",
  },
  absent: {
    label: "Absent",
    className: "missed",
  },
  not_marked: {
    label: "Not marked",
    className: "missed",
  },
  admin_corrected_present: {
    label: "Corrected present",
    className: "corrected",
  },
  admin_corrected_absent: {
    label: "Corrected absent",
    className: "correctedAbsent",
  },
};

const getStatus = (status) =>
  STATUS_CONFIG[status] || {
    label: String(status || "Unknown").replaceAll("_", " "),
    className: "unknown",
  };

const getInitials = (name) =>
  String(name || "Unknown")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const formatDate = (dateKey) => {
  if (!dateKey) return "—";

  const match = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(dateKey);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AttendanceSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonToolbar}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonSearch}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonFilter}`} />
      </div>

      <div className={styles.skeletonHeader} />

      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className={`${styles.skeletonBlock} ${styles.skeletonRecord}`}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = getStatus(status);

  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`status_${config.className}`]
      }`}
    >
      <span className={styles.statusDot} />
      {config.label}
    </span>
  );
}

function AttendanceRecordCard({ record, onCorrect }) {
  const internName = record.intern?.name || "Unknown intern";
  const internId = record.intern?.internId || "ID unavailable";

  return (
    <article className={styles.recordCard}>
      <div className={styles.cardTop}>
        <div className={styles.internIdentity}>
          <div className={styles.avatar}>{getInitials(internName)}</div>

          <div className={styles.internDetails}>
            <strong>{internName}</strong>
            <span>{internId}</span>
          </div>
        </div>

        <StatusBadge status={record.status} />
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.detailItem}>
          <span>Group</span>
          <strong>
            {record.intern?.group?.name || record.group?.name || "Unassigned"}
          </strong>
        </div>

        <div className={styles.detailItem}>
          <span>Date</span>
          <strong>{formatDate(record.dateKey)}</strong>
        </div>

        <div className={styles.detailItem}>
          <span>Session</span>
          <strong>Session {record.sessionNumber || "—"}</strong>
        </div>

        <div className={styles.detailItem}>
          <span>Marked at</span>
          <strong>{formatTime(record.markedAt || record.createdAt)}</strong>
        </div>

        <div className={styles.detailItem}>
          <span>Approved by</span>
          <strong>{record.approvedBy?.name || "—"}</strong>
        </div>
      </div>

      {typeof onCorrect === "function" && (
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.correctButton}
            onClick={() => onCorrect(record)}
          >
            <Edit3 size={14} />
            Correct record
          </button>
        </div>
      )}
    </article>
  );
}

export default function AttendanceRecordTable({
  records = [],
  loading = false,
  onCorrect,
  pageSize = PAGE_SIZE,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const safeRecords = Array.isArray(records) ? records : [];

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeRecords.filter((record) => {
      const name = record.intern?.name || "";
      const internId = record.intern?.internId || "";
      const email = record.intern?.email || "";
      const group = record.intern?.group?.name || record.group?.name || "";

      const searchableText = [
        name,
        internId,
        email,
        group,
        record.dateKey,
        record.status,
        `session ${record.sessionNumber}`,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;

      const matchesSession =
        sessionFilter === "all" ||
        String(record.sessionNumber) === sessionFilter;

      return matchesSearch && matchesStatus && matchesSession;
    });
  }, [safeRecords, search, statusFilter, sessionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sessionFilter]);

  const startRecord =
    filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endRecord = Math.min(currentPage * pageSize, filteredRecords.length);

  if (loading) {
    return (
      <section className={styles.wrapper}>
        <AttendanceSkeleton />
      </section>
    );
  }

  return (
    <section className={`${styles.wrapper} min-w-0 w-full`}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <div className={styles.titleIcon}>
            <CalendarDays size={19} />
          </div>

          <div>
            <h3>Attendance history</h3>
            <p>Review individual attendance sessions and corrections.</p>
          </div>
        </div>

        <div className={styles.recordCount}>
          <ShieldCheck size={15} />
          <span>{safeRecords.length} loaded records</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={16} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search intern, ID, email or group..."
            aria-label="Search attendance records"
          />
        </div>

        <label className={styles.selectControl}>
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
            <option value="admin_corrected_present">Corrected present</option>
            <option value="admin_corrected_absent">Corrected absent</option>
          </select>
        </label>

        <label className={styles.selectControl}>
          <span>Session</span>
          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
          >
            <option value="all">Both sessions</option>
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>
        </label>
      </div>

      {filteredRecords.length > 0 ? (
        <>
          <div className={styles.desktopTable}>
            <div className={styles.tableScroller}>
              <table>
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Group</th>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th>Approved by</th>
                    {onCorrect && <th>Action</th>}
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map((record, index) => (
                    <tr
                      key={
                        record._id ||
                        `${record.intern?.internId}-${record.dateKey}-${record.sessionNumber}-${index}`
                      }
                    >
                      <td>
                        <div className={styles.internIdentity}>
                          <div className={styles.avatar}>
                            {getInitials(record.intern?.name)}
                          </div>

                          <div className={styles.internDetails}>
                            <strong>
                              {record.intern?.name || "Unknown intern"}
                            </strong>
                            <span>
                              {record.intern?.internId || "ID unavailable"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.groupName}>
                          {record.intern?.group?.name ||
                            record.group?.name ||
                            "Unassigned"}
                        </span>
                      </td>

                      <td>
                        <span className={styles.dateValue}>
                          {formatDate(record.dateKey)}
                        </span>
                      </td>

                      <td>
                        <span className={styles.sessionPill}>
                          <Clock3 size={12} />
                          Session {record.sessionNumber || "—"}
                        </span>
                      </td>

                      <td>
                        <StatusBadge status={record.status} />
                      </td>

                      <td>
                        <span className={styles.approvedBy}>
                          {record.approvedBy?.name || "—"}
                        </span>
                      </td>

                      {onCorrect && (
                        <td>
                          <button
                            type="button"
                            className={styles.tableAction}
                            onClick={() => onCorrect(record)}
                            title="Correct attendance record"
                            aria-label={`Correct attendance for ${
                              record.intern?.name || "intern"
                            }`}
                          >
                            <Edit3 size={14} />
                            <span>Correct</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.mobileRecords}>
            {paginatedRecords.map((record, index) => (
              <AttendanceRecordCard
                key={
                  record._id ||
                  `${record.intern?.internId}-${record.dateKey}-${record.sessionNumber}-${index}`
                }
                record={record}
                onCorrect={onCorrect}
              />
            ))}
          </div>

          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Showing{" "}
              <strong>
                {startRecord}–{endRecord}
              </strong>{" "}
              of <strong>{filteredRecords.length}</strong> records
            </div>

            <div className={styles.paginationActions}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span className={styles.pageNumber}>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                className={styles.pageButton}
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            {search ? <Search size={24} /> : <UserRound size={24} />}
          </div>

          <h4>
            {safeRecords.length === 0
              ? "No attendance records"
              : "No matching records"}
          </h4>

          <p>
            {safeRecords.length === 0
              ? "Attendance records will appear here once interns start submitting their sessions."
              : "Try changing your search text or selecting a different status or session."}
          </p>

          {(search || statusFilter !== "all" || sessionFilter !== "all") && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setSessionFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className={styles.bottomNote}>
        <ShieldCheck size={14} />
        <span>
          Corrections are handled through the existing admin correction
          workflow. Pagination applies to the records currently loaded from the
          server.
        </span>
      </div>
    </section>
  );
}
