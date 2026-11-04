import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import styles from "./InternAttendanceDetails.module.css";

const STATUS = {
  approved: { label: "Approved", tone: "approved" },
  admin_corrected_present: {
    label: "Corrected present",
    tone: "corrected",
  },
  pending: { label: "Pending", tone: "pending" },
  rejected: { label: "Rejected", tone: "rejected" },
  missed: { label: "Missed", tone: "missed" },
  admin_corrected_absent: {
    label: "Corrected absent",
    tone: "correctedAbsent",
  },
};

const formatDate = (value) => {
  if (!value) return "—";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return `${date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  })}, ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const initials = (name) =>
  String(name || "Intern")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

function StatusBadge({ value }) {
  const config = STATUS[value] || {
    label: String(value || "Unknown").replaceAll("_", " "),
    tone: "unknown",
  };

  return (
    <span className={`${styles.status} ${styles[`status_${config.tone}`]}`}>
      <span />
      {config.label}
    </span>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone }) {
  return (
    <article className={`${styles.metric} ${styles[`metric_${tone}`]}`}>
      <div className={styles.metricTop}>
        <span>{label}</span>
        <div className={styles.metricIcon}>
          <Icon size={17} />
        </div>
      </div>

      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function ProfileField({ label, value, icon: Icon }) {
  return (
    <div className={styles.profileField}>
      <div className={styles.fieldIcon}>
        <Icon size={15} />
      </div>

      <div className={styles.fieldContent}>
        <span>{label}</span>
        <strong title={String(value || "")}>{value || "—"}</strong>
      </div>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className={styles.emptyHistory}>
      <div>
        <CalendarDays size={24} />
      </div>
      <strong>No attendance history yet</strong>
      <p>
        Attendance submissions and administrative corrections will appear here
        when records are available.
      </p>
    </div>
  );
}

export default function InternAttendanceDetails({ intern, summary }) {
  const [filter, setFilter] = useState("all");

  const records = Array.isArray(summary?.records) ? summary.records : [];

  const approved = Number(summary?.approved || 0);
  const missed = Number(summary?.missed || 0);
  const pending = Number(summary?.pending || 0);
  const rejected = Number(summary?.rejected || 0);
  const expected = Number(summary?.expected || 0);

  const firstSession = records.filter(
    (record) =>
      Number(record.sessionNumber) === 1 &&
      ["approved", "admin_corrected_present"].includes(record.status),
  ).length;

  const secondSession = records.filter(
    (record) =>
      Number(record.sessionNumber) === 2 &&
      ["approved", "admin_corrected_present"].includes(record.status),
  ).length;

  const firstMissed = records.filter(
    (record) =>
      Number(record.sessionNumber) === 1 &&
      ["missed", "admin_corrected_absent"].includes(record.status),
  ).length;

  const secondMissed = records.filter(
    (record) =>
      Number(record.sessionNumber) === 2 &&
      ["missed", "admin_corrected_absent"].includes(record.status),
  ).length;

  const filteredRecords = useMemo(() => {
    return [...records]
      .filter((record) => {
        if (filter === "all") return true;

        if (filter === "approved") {
          return ["approved", "admin_corrected_present"].includes(
            record.status,
          );
        }

        if (filter === "missed") {
          return ["missed", "admin_corrected_absent"].includes(record.status);
        }

        return record.status === filter;
      })
      .sort((a, b) => {
        const dateComparison = String(b.dateKey || "").localeCompare(
          String(a.dateKey || ""),
        );

        if (dateComparison !== 0) return dateComparison;

        return Number(b.sessionNumber || 0) - Number(a.sessionNumber || 0);
      });
  }, [records, filter]);

  const completion = Math.min(
    100,
    Math.max(0, Number(summary?.completion || 0)),
  );

  const fullName = intern?.name || "Unnamed intern";

  return (
    <div className={`${styles.details} min-w-0`}>
      {/* PROFILE OVERVIEW */}
      <section className={styles.hero}>
        <div className={styles.avatar}>{initials(fullName)}</div>

        <div className={styles.heroIdentity}>
          <span className={styles.eyebrow}>INTERN PROFILE</span>
          <h3>{fullName}</h3>
          <p>{intern?.internId || "Intern ID unavailable"}</p>

          <div className={styles.heroTags}>
            <span>
              <Users size={12} />
              {summary?.group?.name || "Unassigned group"}
            </span>

            {intern?.domain && <span>{intern.domain}</span>}
          </div>
        </div>

        <div className={styles.completion}>
          <div
            className={styles.progressRing}
            style={{ "--progress": `${completion}%` }}
          >
            <div>
              <strong>{completion}%</strong>
              <span>Approved</span>
            </div>
          </div>
        </div>
      </section>

      {/* ATTENDANCE METRICS */}
      <section className={styles.metrics}>
        <MetricCard
          label="Expected"
          value={expected}
          note="Scheduled sessions due"
          icon={CalendarDays}
          tone="cyan"
        />

        <MetricCard
          label="Approved"
          value={approved}
          note={`${completion}% completion`}
          icon={CheckCircle2}
          tone="green"
        />

        <MetricCard
          label="Missed"
          value={missed}
          note="Missed or corrected absent"
          icon={XCircle}
          tone="orange"
        />

        <MetricCard
          label="Pending"
          value={pending}
          note="Waiting for review"
          icon={Clock3}
          tone="purple"
        />
      </section>

      {/* SESSION BREAKDOWN */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span>SESSION PERFORMANCE</span>
            <h4>Session-wise breakdown</h4>
          </div>
        </div>

        <div className={styles.sessionGrid}>
          <article className={styles.sessionCard}>
            <div className={styles.sessionTop}>
              <span>SESSION 01</span>
              <span className={styles.sessionTag}>First session</span>
            </div>

            <div className={styles.sessionCounts}>
              <div>
                <strong>{firstSession}</strong>
                <span>Approved</span>
              </div>

              <div>
                <strong className={styles.missedValue}>{firstMissed}</strong>
                <span>Missed</span>
              </div>
            </div>
          </article>

          <article className={styles.sessionCard}>
            <div className={styles.sessionTop}>
              <span>SESSION 02</span>
              <span className={styles.sessionTag}>Second session</span>
            </div>

            <div className={styles.sessionCounts}>
              <div>
                <strong>{secondSession}</strong>
                <span>Approved</span>
              </div>

              <div>
                <strong className={styles.missedValue}>{secondMissed}</strong>
                <span>Missed</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* PERSONAL DETAILS */}
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span>INTERN INFORMATION</span>
            <h4>Programme and contact details</h4>
          </div>
        </div>

        <div className={styles.profileGrid}>
          <ProfileField
            label="Email address"
            value={intern?.email}
            icon={Mail}
          />

          <ProfileField
            label="WhatsApp number"
            value={intern?.whatsappNumber}
            icon={Phone}
          />

          <ProfileField
            label="Internship start"
            value={formatDate(intern?.internshipStartDate)}
            icon={CalendarDays}
          />

          <ProfileField
            label="Programme end"
            value={formatDate(summary?.endDate)}
            icon={CalendarDays}
          />

          <ProfileField
            label="InternCash balance"
            value={formatCurrency(intern?.internCashBalance)}
            icon={Wallet}
          />

          <ProfileField
            label="Attendance records"
            value={records.length}
            icon={UserRound}
          />
        </div>
      </section>

      {/* ATTENDANCE HISTORY */}
      <section className={styles.section}>
        <div className={styles.historyHeading}>
          <div className={styles.sectionHeading}>
            <div>
              <span>SESSION AUDIT</span>
              <h4>Attendance history</h4>
              <p>{records.length} records available for this intern.</p>
            </div>
          </div>

          <div className={styles.historySummary}>
            <span>{approved} approved</span>
            <span>{missed} missed</span>
            <span>{rejected} rejected</span>
          </div>
        </div>

        <div className={styles.filters}>
          {[
            { value: "all", label: "All records" },
            { value: "approved", label: "Approved" },
            { value: "missed", label: "Missed" },
            { value: "pending", label: "Pending" },
            { value: "rejected", label: "Rejected" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={filter === item.value ? styles.filterActive : ""}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filteredRecords.length > 0 ? (
          <div className={styles.historyList}>
            {filteredRecords.map((record, index) => (
              <article
                className={styles.historyRow}
                key={
                  record._id ||
                  `${record.dateKey}-${record.sessionNumber}-${index}`
                }
              >
                <div className={styles.historyDate}>
                  <div className={styles.historyDateIcon}>
                    <CalendarDays size={16} />
                  </div>

                  <div>
                    <strong>{formatDate(record.dateKey)}</strong>
                    <span>
                      {formatDateTime(record.markedAt || record.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={styles.historySession}>
                  <span>SESSION</span>
                  <strong>{record.sessionNumber || "—"}</strong>
                </div>

                <div className={styles.historyReviewer}>
                  <span>REVIEWED BY</span>
                  <strong>
                    {record.approvedBy?.name ||
                      record.correctedBy?.name ||
                      record.rejectedBy?.name ||
                      "—"}
                  </strong>
                </div>

                <StatusBadge value={record.status} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyHistory />
        )}
      </section>

      <div className={styles.footnote}>
        <CheckCircle2 size={15} />
        <p>
          Expected sessions are calculated using the portal's existing schedule
          and exclude Sundays. A separate holiday calendar is not available in
          this summary.
        </p>
      </div>
    </div>
  );
}
