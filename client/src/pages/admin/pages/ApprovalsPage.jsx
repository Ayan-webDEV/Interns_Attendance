import { useMemo } from "react";
import {
  Check,
  CheckCheck,
  ClipboardCheck,
  RefreshCw,
  XCircle,
  Clock3,
} from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import AdminStatCard from "../components/AdminStatCard.jsx";
import { AdminPageSkeleton } from "../components/AdminSkeletons.jsx";
import styles from "./ApprovalsPage.module.css";

export default function ApprovalsPage({
  approvals = [],
  groups = [],
  approvalGroup,
  setApprovalGroup,
  approvalSession,
  setApprovalSession,
  selectedApprovals = [],
  setSelectedApprovals,
  loadApprovals,
  approveSelected,
  rejectSelected,
  refreshing,
}) {
  const allShownSelected =
    approvals.length > 0 &&
    approvals.every((item) => selectedApprovals.includes(item._id));
  const counts = useMemo(
    () => ({
      first: approvals.filter((item) => Number(item.sessionNumber) === 1)
        .length,
      second: approvals.filter((item) => Number(item.sessionNumber) === 2)
        .length,
    }),
    [approvals],
  );
  const toggleOne = (id, checked) =>
    setSelectedApprovals((current) =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((x) => x !== id),
    );
  const toggleAll = (checked) =>
    setSelectedApprovals((current) => {
      const ids = new Set(approvals.map((item) => item._id));
      return checked
        ? [...new Set([...current, ...ids])]
        : current.filter((id) => !ids.has(id));
    });

  if (refreshing && !approvals.length)
    return <AdminPageSkeleton variant="approvals" />;

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader
        eyebrow="ATTENDANCE CONTROL"
        title="Attendance approvals"
        description="Review submissions before they count toward attendance progress and InternCash rewards."
        icon={ClipboardCheck}
        accent="green"
        actions={
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center gap-2"
            onClick={loadApprovals}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />{" "}
            Refresh queue
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <AdminStatCard
          label="Waiting for review"
          value={approvals.length}
          hint="Current filtered queue"
          icon={Clock3}
          tone="orange"
        />
        <AdminStatCard
          label="First session"
          value={counts.first}
          hint="Standard attendance requests"
          icon={Check}
          tone="green"
        />
        <AdminStatCard
          label="Second session"
          value={counts.second}
          hint="Re-attendance requests"
          icon={CheckCheck}
          tone="purple"
        />
      </div>

      <section className={styles.queuePanel}>
        <div className={styles.filters}>
          <Field label="Internship group">
            <select
              className="select w-full"
              value={approvalGroup}
              onChange={(e) => setApprovalGroup(e.target.value)}
            >
              <option value="">All groups</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Attendance session">
            <select
              className="select w-full"
              value={approvalSession}
              onChange={(e) => setApprovalSession(e.target.value)}
            >
              <option value="">Both sessions</option>
              <option value="1">Session 1</option>
              <option value="2">Session 2</option>
            </select>
          </Field>
        </div>
        <div className={styles.bulkBar}>
          <label className={styles.selectAll}>
            <input
              type="checkbox"
              checked={allShownSelected}
              onChange={(e) => toggleAll(e.target.checked)}
            />{" "}
            Select all visible <span>{approvals.length}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => approveSelected(false)}
              disabled={!selectedApprovals.length}
            >
              <Check size={14} /> Approve selected ({selectedApprovals.length})
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => approveSelected(true)}
              disabled={!approvalGroup}
            >
              <CheckCheck size={14} /> Approve all in group
            </button>
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={rejectSelected}
              disabled={!selectedApprovals.length}
            >
              <XCircle size={14} /> Reject selected
            </button>
          </div>
        </div>

        {approvals.length ? (
          <div className={styles.approvalList}>
            {approvals.map((item) => {
              const first = Number(item.sessionNumber) === 1;
              const selected = selectedApprovals.includes(item._id);
              return (
                <article
                  key={item._id}
                  className={`${styles.approvalCard} ${selected ? styles.selected : ""}`}
                >
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => toggleOne(item._id, e.target.checked)}
                      aria-label={`Select ${item.intern?.name || "intern"} attendance`}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3>{item.intern?.name || "Unknown intern"}</h3>
                      <span
                        className={`${styles.sessionBadge} ${first ? styles.first : styles.second}`}
                      >
                        Session {item.sessionNumber}
                      </span>
                    </div>
                    <p>
                      {item.intern?.internId || "No intern ID"} ·{" "}
                      {item.intern?.email || "No email"}
                    </p>
                    <div className={styles.metadata}>
                      <span>{item.group?.name || "Group unavailable"}</span>
                      <span>{item.dateKey || "Date unavailable"}</span>
                      <span>
                        {item.markedAt
                          ? new Date(item.markedAt).toLocaleTimeString("en-IN")
                          : "Time unavailable"}
                      </span>
                      <b>+{first ? 1 : 3} IC after approval</b>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => toggleOne(item._id, !selected)}
                  >
                    {selected ? "Deselect" : "Select"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <span>
              <CheckCheck size={25} />
            </span>
            <h3>All caught up</h3>
            <p>No pending attendance requests match these filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
