import React, { useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  ShieldCheck,
  AlertCircle,
  Sun,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";

import styles from "./ApprovalStation.module.css";

/* =========================================================
   STATUS HELPERS
========================================================= */

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const PENDING = new Set([
  "pending",
  "awaiting_approval",
  "submitted",
  "under_review",
  "pending_approval",
  "in_review",
  "processing",
]);

const APPROVED = new Set([
  "approved",
  "admin_corrected_present",
  "present",
  "completed",
  "complete",
  "credited",
  "success",
  "successful",
]);

const REJECTED = new Set(["rejected", "declined", "denied", "failed"]);

const MISSED = new Set(["missed", "absent", "not_present"]);

const HOLIDAY = new Set(["holiday", "official_holiday", "declared_holiday"]);

/**
 * Attendance status is read from the attendance fields only.
 * Do not use reward.status to decide whether attendance was approved.
 */
function getStatus(record) {
  const rawStatus =
    record?.status ??
    record?.attendanceStatus ??
    record?.approvalStatus ??
    record?.state ??
    "";

  const value = normalize(rawStatus);

  if (REJECTED.has(value)) return "rejected";
  if (PENDING.has(value)) return "pending";
  if (APPROVED.has(value)) return "approved";
  if (MISSED.has(value)) return "missed";
  if (HOLIDAY.has(value)) return "holiday";

  return "unknown";
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getRecordDate(record) {
  return (
    record?.dateKey ??
    record?.date ??
    record?.attendanceDate ??
    record?.sessionDate ??
    record?.createdAt ??
    record?.updatedAt ??
    record?.timestamp ??
    null
  );
}

function getTimestamp(value) {
  if (!value) return 0;

  const date =
    typeof value === "number"
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(value);

  const timestamp = date.getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date =
    typeof value === "number"
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   SESSION HELPERS
========================================================= */

function getSessionNumber(record) {
  const value =
    record?.sessionNumber ??
    record?.session ??
    record?.attendanceSession ??
    null;

  const number = Number(value);

  return number === 1 || number === 2 ? number : null;
}

function getSessionLabel(record) {
  const session = getSessionNumber(record);

  if (session === 1) return "First session";
  if (session === 2) return "Second session";

  return "Attendance record";
}

/* =========================================================
   RECORD IDENTIFICATION
========================================================= */

function getRecordKey(record, index) {
  return String(
    record?._id ??
      record?.id ??
      record?.attendanceId ??
      `${getRecordDate(record) ?? "record"}-${getSessionNumber(record) ?? "unknown"}-${index}`,
  );
}

/* =========================================================
   STATUS PRESENTATION
========================================================= */

const STATUS_META = {
  pending: {
    label: "Pending review",
    icon: Clock3,
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    iconClass: "",
  },

  approved: {
    label: "Approved",
    icon: CheckCircle2,
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClass: "approved",
  },

  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    iconClass: "rejected",
  },

  missed: {
    label: "Missed",
    icon: AlertCircle,
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    iconClass: "rejected",
  },

  holiday: {
    label: "Holiday",
    icon: Sun,
    badge: "border-sky-200 bg-sky-50 text-sky-800",
    iconClass: "holiday",
  },

  unknown: {
    label: "Not available",
    icon: ClipboardList,
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    iconClass: "",
  },
};

/* =========================================================
   SUMMARY CARD
========================================================= */

function Summary({ title, count, caption, tone, icon: Icon }) {
  const toneClass = {
    amber: styles.summaryAmber,
    green: styles.summaryGreen,
    rose: styles.summaryRose,
  }[tone];

  return (
    <div className={`${styles.summary} ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <span className={styles.summaryIcon}>
          <Icon size={16} />
        </span>

        {title}
      </div>

      <p className="pt-2.5 text-3xl font-black tracking-tight text-slate-900 tabular-nums">
        {count}
      </p>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">{caption}</p>
    </div>
  );
}

/* =========================================================
   RECORD ROW
========================================================= */

function RecordRow({ record, status }) {
  const meta = STATUS_META[status] ?? STATUS_META.unknown;

  const Icon = meta.icon;

  const sessionNumber = getSessionNumber(record);

  return (
    <article className={styles.recordRow}>
      <span
        className={`${styles.recordIcon} ${
          status === "approved" ? styles.recordIconApproved : ""
        }`}
      >
        <Icon size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block truncate text-sm font-bold text-slate-800">
            {getSessionLabel(record)}
          </span>

          {sessionNumber !== null && (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              Session {sessionNumber}
            </span>
          )}
        </span>

        <span className="mt-1 block text-xs text-slate-500">
          {formatDate(getRecordDate(record))}
        </span>
      </span>

      <span className={`${styles.status} ${meta.badge}`}>{meta.label}</span>
    </article>
  );
}

/* =========================================================
   APPROVAL STATION
========================================================= */

export default function ApprovalStation({ records = [] }) {
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllApproved, setShowAllApproved] = useState(false);
  const [showAllAttention, setShowAllAttention] = useState(false);

  const safeRecords = Array.isArray(records)
    ? records.filter((record) => record !== null && typeof record === "object")
    : [];

  /* -------------------------------------------------------
     GROUP RECORDS
  ------------------------------------------------------- */

  const grouped = useMemo(() => {
    const result = {
      pending: [],
      approved: [],
      rejected: [],
      missed: [],
      holiday: [],
      unknown: [],
    };

    safeRecords.forEach((record) => {
      const status = getStatus(record);

      result[status].push(record);
    });

    const newestFirst = (a, b) => {
      const dateA = getTimestamp(getRecordDate(a));
      const dateB = getTimestamp(getRecordDate(b));

      return dateB - dateA;
    };

    Object.values(result).forEach((items) => {
      items.sort(newestFirst);
    });

    return result;
  }, [safeRecords]);

  /* -------------------------------------------------------
     COUNTS
  ------------------------------------------------------- */

  const needsAttention = [...grouped.rejected, ...grouped.missed].sort(
    (a, b) => getTimestamp(getRecordDate(b)) - getTimestamp(getRecordDate(a)),
  );

  const pendingVisible = showAllPending
    ? grouped.pending
    : grouped.pending.slice(0, 5);

  const approvedVisible = showAllApproved
    ? grouped.approved
    : grouped.approved.slice(0, 4);

  const attentionVisible = showAllAttention
    ? needsAttention
    : needsAttention.slice(0, 4);

  const hasRecords = safeRecords.length > 0;

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="approval-station"
      aria-labelledby="approval-station-heading"
      className={`${styles.station} scroll-mt-6 overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-sm`}
    >
      <div className={styles.glow} aria-hidden="true" />

      <div className="relative p-5 sm:p-6 lg:p-7">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 sm:size-14">
              <Clock3 size={24} />
            </div>

            <div className="min-w-0">
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-800">
                <CalendarDays size={11} />
                Attendance overview
              </span>

              <h2
                id="approval-station-heading"
                className="text-lg font-black tracking-tight text-slate-900 sm:text-xl"
              >
                Approval tracker
              </h2>

              <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm">
                Track each attendance session, see which records are approved,
                and identify entries that need attention.
              </p>
            </div>
          </div>

          <span className={styles.pendingBadge}>
            <span className={styles.pendingDot} />
            {grouped.pending.length} pending
          </span>
        </div>

        {/* Empty state */}

        {!hasRecords ? (
          <div className={`${styles.empty} mt-7`}>
            <CalendarDays size={23} className="mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-extrabold text-slate-800">
                No attendance records yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your first and second attendance-session records will appear
                here after they are submitted.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Summary
                title="Awaiting review"
                count={grouped.pending.length}
                caption="Waiting Attendance records"
                tone="amber"
                icon={Clock3}
              />

              <Summary
                title="Approved records"
                count={grouped.approved.length}
                caption="Attendance sessions approved"
                tone="green"
                icon={CheckCircle2}
              />

              <Summary
                title="Needs attention"
                count={needsAttention.length}
                caption="Rejected or missed sessions"
                tone="rose"
                icon={ShieldCheck}
              />

              <Summary
                title="Holidays"
                count={grouped.holiday.length}
                caption="Sessions recorded as holidays"
                tone="amber"
                icon={Sun}
              />
            </div>

            {/* Pending records */}

            <div className="mt-7">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Awaiting your admin's review
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    These attendance sessions have not yet been approved.
                  </p>
                </div>

                <span className="text-[11px] font-semibold text-slate-500">
                  {grouped.pending.length} records
                </span>
              </div>

              {pendingVisible.length > 0 ? (
                <div className="space-y-2">
                  {pendingVisible.map((record, index) => (
                    <RecordRow
                      key={getRecordKey(record, index)}
                      record={record}
                      status="pending"
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <CheckCircle2 size={21} />

                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      All caught up!
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      There are no recognized attendance records awaiting
                      review.
                    </p>
                  </div>
                </div>
              )}

              {grouped.pending.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllPending((current) => !current)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-50"
                  aria-expanded={showAllPending}
                >
                  {showAllPending
                    ? "Show fewer pending records"
                    : `View all ${grouped.pending.length} pending records`}

                  {showAllPending ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              )}
            </div>

            {/* Approved records */}

            {grouped.approved.length > 0 && (
              <div className="mt-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Recently approved
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Approved attendance sessions.
                    </p>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-700">
                    {grouped.approved.length} approved
                  </span>
                </div>

                <div className="space-y-2">
                  {approvedVisible.map((record, index) => (
                    <RecordRow
                      key={getRecordKey(record, index)}
                      record={record}
                      status="approved"
                    />
                  ))}
                </div>

                {grouped.approved.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllApproved((current) => !current)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
                    aria-expanded={showAllApproved}
                  >
                    {showAllApproved
                      ? "Show fewer approved records"
                      : `View all ${grouped.approved.length} approved records`}

                    {showAllApproved ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Missed and rejected */}

            {needsAttention.length > 0 && (
              <div className="mt-7">
                <div className="mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Records needing attention
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Review rejected or missed attendance sessions.
                  </p>
                </div>

                <div className="space-y-2">
                  {attentionVisible.map((record, index) => (
                    <RecordRow
                      key={getRecordKey(record, index)}
                      record={record}
                      status={
                        getStatus(record) === "missed" ? "missed" : "rejected"
                      }
                    />
                  ))}
                </div>

                {needsAttention.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAttention((current) => !current)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    aria-expanded={showAllAttention}
                  >
                    {showAllAttention
                      ? "Show fewer records"
                      : `View all ${needsAttention.length} records`}

                    {showAllAttention ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Holiday and unknown status information */}

            {(grouped.holiday.length > 0 || grouped.unknown.length > 0) && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {grouped.holiday.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                    <Sun size={17} className="mt-0.5 shrink-0 text-sky-700" />

                    <div>
                      <p className="text-xs font-extrabold text-sky-900">
                        {grouped.holiday.length} holiday records
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-sky-800">
                        These records are identified as holidays, not attendance
                        approvals or wallet credits.
                      </p>
                    </div>
                  </div>
                )}

                {grouped.unknown.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <Info
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-500"
                    />

                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {grouped.unknown.length} unclassified records
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-600">
                        Their status was not recognized. These records have not
                        been counted as approved.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Transparency */}

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />

          <p className="text-[11px] leading-5 text-slate-600">
            <strong className="font-extrabold text-slate-800">
              Status transparency:
            </strong>{" "}
            Each row represents an attendance record, not necessarily a whole
            day. Session 1 and Session 2 are counted separately. Attendance
            approval and InternCash crediting are separate: only a confirmed
            wallet transaction establishes a credit.
          </p>
        </div>
      </div>
    </section>
  );
}
