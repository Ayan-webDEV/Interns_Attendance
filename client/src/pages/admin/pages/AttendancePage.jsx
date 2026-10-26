import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import styles from "./AttendancePage.module.css";

const STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  admin_corrected_present: "Admin corrected",
};

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function StatusBadge({ status }) {
  const normalized = status || "unknown";
  const label = STATUS_LABELS[normalized] || normalized.replaceAll("_", " ");

  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`status_${normalized}`] || styles.statusUnknown
      }`}
    >
      <span className={styles.statusDot} />
      {label}
    </span>
  );
}

export default function AttendancePage({
  groups,
  attendance,
  reportGroup,
  setReportGroup,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  reportStatus,
  setReportStatus,
  reportSession,
  setReportSession,
  refreshing,
  loadReport,
  exportAttendance,
  correction,
  setCorrection,
  correctAttendance,
}) {
  const records = Array.isArray(attendance) ? attendance : [];

  const pendingCount = records.filter(
    (record) => record.status === "pending",
  ).length;

  const approvedCount = records.filter((record) =>
    ["approved", "admin_corrected_present"].includes(record.status),
  ).length;

  const rejectedCount = records.filter(
    (record) => record.status === "rejected",
  ).length;

  const updateCorrection = (key, value) => {
    setCorrection((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setReportGroup("");
    setDateFrom("");
    setDateTo("");
    setReportStatus("");
    setReportSession("");
  };

  return (
    <div className={`${styles.attendancePage} min-w-0 space-y-6`}>
      {/* Page heading */}
      <header
        className={`${styles.pageHeader} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}
      >
        <div className="max-w-150">
          <div className={styles.eyebrow}>
            <CalendarCheck size={14} />
            ATTENDANCE MANAGEMENT
          </div>

          <h1 className={styles.pageTitle}>Attendance reports</h1>

          <p className={styles.pageDescription}>
            Track attendance, review session records, export reports, and
            correct entries when necessary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.actionButton}`}
            onClick={resetFilters}
            disabled={refreshing}
          >
            <RotateCcw size={16} />
            Reset filters
          </button>

          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.actionButton}`}
            onClick={loadReport}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className={`${styles.primaryButton} ${styles.actionButton}`}
            onClick={exportAttendance}
            disabled={!records.length}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      {/* Summary cards */}
      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Attendance summary"
      >
        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <CalendarDays size={19} />
          </div>
          <div className={styles.summaryText}>
            <span>Loaded records</span>
            <strong>{records.length}</strong>
            <small>Based on current filters</small>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconGreen}`}>
            <CheckCircle2 size={19} />
          </div>
          <div className={styles.summaryText}>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
            <small>Including admin corrections</small>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconAmber}`}>
            <Clock3 size={19} />
          </div>
          <div className={styles.summaryText}>
            <span>Pending review</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting a decision</small>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.iconRed}`}>
            <ShieldAlert size={19} />
          </div>
          <div className={styles.summaryText}>
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
            <small>Rejected attendance requests</small>
          </div>
        </article>
      </section>

      {/* Filters */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <div className={styles.panelIcon}>
              <Filter size={18} />
            </div>
            <div>
              <h2 className={styles.panelTitle}>Filter attendance</h2>
              <p className={styles.panelDescription}>
                Narrow the report by group, date, session, or status.
              </p>
            </div>
          </div>

          <span className={styles.filterCount}>
            {records.length} record{records.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Internship group">
            <select
              className={`${styles.formControl} input`}
              value={reportGroup}
              onChange={(event) => setReportGroup(event.target.value)}
            >
              <option value="">All groups</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="From date">
            <input
              className={`${styles.formControl} input`}
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </Field>

          <Field label="To date">
            <input
              className={`${styles.formControl} input`}
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </Field>

          <Field label="Attendance status">
            <select
              className={`${styles.formControl} input`}
              value={reportStatus}
              onChange={(event) => setReportStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="admin_corrected_present">Admin corrected</option>
            </select>
          </Field>

          <Field label="Session">
            <select
              className={`${styles.formControl} input`}
              value={reportSession}
              onChange={(event) => setReportSession(event.target.value)}
            >
              <option value="">All sessions</option>
              <option value="1">Session 1</option>
              <option value="2">Session 2</option>
            </select>
          </Field>
        </div>

        <div className={styles.filterFooter}>
          <p>
            <Search size={14} />
            Filters are applied when you select Apply filters.
          </p>

          <button
            type="button"
            className={`${styles.primaryButton} ${styles.actionButton}`}
            onClick={loadReport}
            disabled={refreshing}
          >
            <Filter size={16} />
            {refreshing ? "Loading report..." : "Apply filters"}
          </button>
        </div>
      </section>

      {/* Attendance table */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <div className={styles.panelIcon}>
              <Users size={18} />
            </div>
            <div>
              <h2 className={styles.panelTitle}>Attendance records</h2>
              <p className={styles.panelDescription}>
                Review each intern's date, session, status, and reward.
              </p>
            </div>
          </div>

          <span className={styles.filterCount}>{records.length} total</span>
        </div>

        {records.length > 0 ? (
          <div className={styles.tableScroll}>
            <table className={styles.attendanceTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Intern</th>
                  <th>Group</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Reward</th>
                  <th>Marked at</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td className={styles.dateCell}>{record.dateKey || "—"}</td>

                    <td>
                      <div className={styles.internName}>
                        {record.intern?.name || "Unknown intern"}
                      </div>
                      <div className={styles.internMeta}>
                        {record.intern?.internId ||
                          record.intern?.email ||
                          "No intern ID"}
                      </div>
                    </td>

                    <td>{record.intern?.group?.name || "—"}</td>

                    <td>
                      <span className={styles.sessionBadge}>
                        Session {record.sessionNumber || "—"}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={record.status} />
                    </td>

                    <td className={styles.rewardCell}>
                      {record.rewardAmount ?? 0} <span>IC</span>
                    </td>

                    <td className={styles.dateTimeCell}>
                      {formatDateTime(record.markedAt)}
                    </td>

                    <td className={styles.reasonCell}>
                      {record.rejectionReason || record.correctionReason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <CalendarCheck size={24} />
            </div>
            <h3>No attendance records found</h3>
            <p>
              Try changing the selected filters or clearing them to see more
              records.
            </p>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={resetFilters}
            >
              <X size={15} />
              Clear filters
            </button>
          </div>
        )}

        <div className={styles.tableFooter}>
          <span>
            Showing {records.length} loaded record
            {records.length === 1 ? "" : "s"}
          </span>
          <span>Times shown in your browser's local time zone</span>
        </div>
      </section>

      {/* Correction form */}
      <section className={styles.panel}>
        <div className={styles.correctionHeader}>
          <div className={styles.panelTitleGroup}>
            <div className={`${styles.panelIcon} ${styles.correctionIcon}`}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className={styles.panelTitle}>
                Manual attendance correction
              </h2>
              <p className={styles.panelDescription}>
                Correct an intern's record using the details required by the
                existing admin correction endpoint.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.correctionNotice}>
          <ShieldAlert size={17} />
          <p>
            Verify the intern ID, date, and session before submitting. Add a
            clear reason so the correction can be audited later.
          </p>
        </div>

        <form className="space-y-5 p-4 sm:p-5" onSubmit={correctAttendance}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Intern ID">
              <input
                className={`${styles.formControl} input`}
                value={correction.internId || ""}
                onChange={(event) =>
                  updateCorrection("internId", event.target.value)
                }
                placeholder="Enter the intern's ID"
                autoComplete="off"
                required
              />
            </Field>

            <Field label="Attendance date">
              <input
                className={`${styles.formControl} input`}
                type="date"
                value={correction.date || ""}
                onChange={(event) =>
                  updateCorrection("date", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Session number">
              <select
                className={`${styles.formControl} input`}
                value={String(correction.sessionNumber ?? 1)}
                onChange={(event) =>
                  updateCorrection("sessionNumber", Number(event.target.value))
                }
                required
              >
                <option value="1">Session 1</option>
                <option value="2">Session 2</option>
              </select>
            </Field>

            <Field label="Correct attendance status">
              <select
                className={`${styles.formControl} input`}
                value={correction.status || "approved"}
                onChange={(event) =>
                  updateCorrection("status", event.target.value)
                }
                required
              >
                <option value="approved">Present / Approved</option>
                <option value="absent">Absent</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Reason for correction">
                <textarea
                  className={`${styles.formControl} input ${styles.reasonInput}`}
                  value={correction.reason || ""}
                  onChange={(event) =>
                    updateCorrection("reason", event.target.value)
                  }
                  placeholder="Explain why this attendance record needs correction..."
                  rows={3}
                  maxLength={500}
                  required
                />
              </Field>
              <p className={styles.characterCount}>
                {(correction.reason || "").length}/500 characters
              </p>
            </div>
          </div>

          <div className={styles.correctionFooter}>
            <p>
              <ShieldAlert size={14} />
              Please double-check all details before saving.
            </p>

            <button
              type="submit"
              className={`${styles.primaryButton} ${styles.actionButton}`}
            >
              <Save size={16} />
              Save correction
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
