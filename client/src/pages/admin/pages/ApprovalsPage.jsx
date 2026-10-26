import { Check, CheckCheck, ClipboardCheck, RefreshCw } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";

export default function ApprovalsPage({
  approvals,
  groups,
  approvalGroup,
  setApprovalGroup,
  approvalSession,
  setApprovalSession,
  selectedApprovals,
  setSelectedApprovals,
  loadApprovals,
  approveSelected,
  rejectSelected,
  refreshing,
}) {
  const allShownSelected =
    approvals.length > 0 &&
    approvals.every((item) => selectedApprovals.includes(item._id));

  const toggleOne = (id, checked) => {
    setSelectedApprovals((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((itemId) => itemId !== id);
    });
  };

  const toggleAllShown = (checked) => {
    setSelectedApprovals((current) => {
      if (!checked) {
        const visibleIds = new Set(approvals.map((item) => item._id));
        return current.filter((id) => !visibleIds.has(id));
      }

      const combined = new Set(current);
      approvals.forEach((item) => combined.add(item._id));
      return [...combined];
    });
  };

  return (
    <div className="space-y-5">
      <header className="page-heading flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow">ATTENDANCE CONTROL</div>
          <h1>Attendance approvals</h1>
          <p>
            Only approved attendance counts. First session earns 1 IC;
            re-attendance earns 3 IC.
          </p>
        </div>

        <button
          type="button"
          className={`btn btn-secondary shrink-0 ${
            refreshing ? "is-refreshing" : ""
          }`}
          onClick={loadApprovals}
          disabled={refreshing}
        >
          <RefreshCw size={15} />
          {refreshing ? "Refreshing…" : "Refresh queue"}
        </button>
      </header>

      <section className="panel min-w-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Group">
            <select
              className="select w-full"
              value={approvalGroup}
              onChange={(event) => setApprovalGroup(event.target.value)}
            >
              <option value="">All groups</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Session">
            <select
              className="select w-full"
              value={approvalSession}
              onChange={(event) => setApprovalSession(event.target.value)}
            >
              <option value="">Both sessions</option>
              <option value="1">First attendance · 9:30–12:30</option>
              <option value="2">Re-attendance · 1:00–3:30</option>
            </select>
          </Field>
        </div>

        <div className="my-4 flex flex-col gap-3 border-b border-[var(--border-color,#2b3045)] pb-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-actions flex flex-wrap items-center gap-3">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={allShownSelected}
                onChange={(event) => toggleAllShown(event.target.checked)}
              />
              Select all shown
            </label>

            <span className="badge">{approvals.length} pending</span>

            {selectedApprovals.length > 0 && (
              <span className="muted small">
                {selectedApprovals.length} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => approveSelected(false)}
              disabled={!selectedApprovals.length}
            >
              <Check size={14} />
              Approve selected
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => approveSelected(true)}
              disabled={!approvalGroup}
              title={
                approvalGroup
                  ? "Approve pending requests in this group"
                  : "Choose a group first"
              }
            >
              <CheckCheck size={14} />
              Approve all in group
            </button>

            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={rejectSelected}
              disabled={!selectedApprovals.length}
            >
              Reject selected
            </button>
          </div>
        </div>

        {approvals.length > 0 ? (
          <div className="space-y-3">
            {approvals.map((item) => {
              const selected = selectedApprovals.includes(item._id);
              const firstSession = Number(item.sessionNumber) === 1;

              return (
                <article
                  className="approval-row flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start"
                  key={item._id}
                >
                  <div className="flex shrink-0 items-start pt-1">
                    <input
                      type="checkbox"
                      aria-label={`Select attendance for ${
                        item.intern?.name || "unknown intern"
                      }`}
                      checked={selected}
                      onChange={(event) =>
                        toggleOne(item._id, event.target.checked)
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <b className="break-words">
                      {item.intern?.name || "Unknown intern"}
                    </b>

                    <div className="muted small break-words">
                      {item.intern?.internId || "No intern ID"}
                      {" · "}
                      {item.intern?.email || "No email"}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="badge">
                        {item.group?.name || "Group"}
                      </span>

                      <span className="badge">
                        Session {item.sessionNumber}
                      </span>

                      <span className="badge">{item.dateKey}</span>

                      <span className="badge">
                        {item.markedAt
                          ? new Date(item.markedAt).toLocaleTimeString("en-IN")
                          : "Time unavailable"}
                      </span>

                      <span
                        className={`badge ${
                          firstSession ? "badge-green" : "badge-purple"
                        }`}
                      >
                        +{firstSession ? 1 : 3} IC on approval
                      </span>
                    </div>
                  </div>

                  <div className="approval-actions flex shrink-0">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => toggleOne(item._id, !selected)}
                      aria-pressed={selected}
                    >
                      {selected ? "Deselect" : "Select"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty px-4 py-12 text-center">
            <ClipboardCheck size={28} className="mx-auto mb-3 opacity-40" />
            <b>No pending requests</b>
            <p>New attendance requests will appear here for approval.</p>
          </div>
        )}
      </section>
    </div>
  );
}
