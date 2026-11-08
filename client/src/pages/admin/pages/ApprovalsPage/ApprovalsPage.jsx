import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Check,
  ListChecks,
  Users,
} from "lucide-react";
import styles from "./ApprovalsPage.module.css";

export default function ApprovalsPage({
  title = "Attendance approvals",
  data = [],
  groups = [],
  loading = false,
  busy = false,
  groupFilter = "",
  setGroupFilter,
  sessionFilter = "",
  setSessionFilter,
  selected = [],
  setSelected,
  onRefresh,
  onApproveSelected,
  onApproveAllInGroup,
  formatDate,
}) {
  const [search, setSearch] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((record) => {
      if (
        sessionFilter &&
        String(record.sessionNumber) !== String(sessionFilter)
      ) {
        return false;
      }

      if (!query) return true;

      const searchableValues = [
        record.intern?.name,
        record.intern?.email,
        record.intern?.internId,
      ];

      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(query),
      );
    });
  }, [data, search, sessionFilter]);

  const visibleIds = useMemo(
    () => filteredRecords.map((record) => record._id).filter(Boolean),
    [filteredRecords],
  );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selected.includes(id));

  const hiddenSelectedCount = selected.filter(
    (id) => !visibleIds.includes(id),
  ).length;

  const toggleSelectAll = () => {
    if (!setSelected || !visibleIds.length) return;

    setSelected((previous) => {
      if (allVisibleSelected) {
        return previous.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...previous, ...visibleIds])];
    });
  };

  const toggleRecord = (id, checked) => {
    setSelected?.((previous) =>
      checked
        ? [...new Set([...previous, id])]
        : previous.filter((item) => item !== id),
    );
  };

  const handleGroupChange = (value) => {
    setGroupFilter?.(value);
  };

  const handleSessionChange = (value) => {
    setSessionFilter?.(value);
  };

  return (
    <main className={styles.approvalsPage}>
      <header className={styles.header}>
        <div className={styles.headingCopy}>
          <span className={styles.eyebrow}>VELOOP ADMINISTRATION</span>
          <h1>{title}</h1>
          <p>
            Review and approve attendance requests before they count toward
            attendance and rewards.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={loading || busy}
        >
          <RefreshCw size={16} className={loading ? styles.spinning : ""} />
          Refresh
        </button>
      </header>

      <section className={styles.filterPanel} aria-label="Approval filters">
        <label className={styles.searchBox}>
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search intern name, email or Intern ID..."
            aria-label="Search by intern name, email or Intern ID"
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
        </label>

        <label className={styles.selectField}>
          <span>Group</span>
          <select value={groupFilter} onChange={(event) => handleGroupChange(event.target.value)}>
            <option value="">All groups</option>
            {groups.map((group) => (
              <option value={group._id} key={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.selectField}>
          <span>Session</span>
          <select
            value={sessionFilter}
            onChange={(event) => handleSessionChange(event.target.value)}
          >
            <option value="">All sessions</option>
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>
        </label>

        <div className={styles.resultCount}>
          <strong>{filteredRecords.length}</strong>
          <span>of {data.length} pending requests</span>
        </div>

        <button
          type="button"
          className={styles.selectAllButton}
          onClick={toggleSelectAll}
          disabled={!visibleIds.length || busy}
        >
          <ListChecks size={16} />
          {allVisibleSelected ? "Deselect all shown" : "Select all shown"}
        </button>

        <button
          type="button"
          className={styles.approveAllButton}
          disabled={!groupFilter || !data.length || busy}
          onClick={onApproveAllInGroup}
          title={
            groupFilter
              ? "Approve every pending request in the selected group"
              : "Select a specific group to use this action"
          }
        >
          <CheckCircle2 size={16} />
          Approve all in group
        </button>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableTopline}>
          <div>
            <h2>Pending attendance requests</h2>
            <p>
              {filteredRecords.length
                ? "Select individual requests or use Select all shown."
                : "No requests match the current filters."}
            </p>
          </div>
          <span className={styles.selectionPill}>
            {selected.length} selected
          </span>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxColumn}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate =
                          visibleIds.some((id) => selected.includes(id)) &&
                          !allVisibleSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    disabled={!visibleIds.length || busy}
                    aria-label="Select all visible attendance requests"
                  />
                </th>
                <th>Intern</th>
                <th>Group</th>
                <th>Date</th>
                <th>Session</th>
                <th>Requested at</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record._id}>
                  <td className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      checked={selected.includes(record._id)}
                      onChange={(event) =>
                        toggleRecord(record._id, event.target.checked)
                      }
                      disabled={busy}
                      aria-label={`Select attendance request for ${record.intern?.name || "intern"}`}
                    />
                  </td>
                  <td>
                    <div className={styles.internCell}>
                      <span className={styles.avatar}>
                        {(record.intern?.name || "I").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className={styles.internDetails}>
                        <strong>{record.intern?.name || "Unknown intern"}</strong>
                        <small>{record.intern?.email || "Email unavailable"}</small>
                        <small className={styles.internId}>
                          ID: {record.intern?.internId || "—"}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.groupName}>
                      {record.group?.name || "—"}
                    </span>
                  </td>
                  <td>{record.dateKey || "—"}</td>
                  <td>
                    <span className={styles.sessionTag}>
                      Session {record.sessionNumber || "—"}
                    </span>
                  </td>
                  <td>
                    {formatDate
                      ? formatDate(record.markedAt || record.createdAt)
                      : "—"}
                  </td>
                  <td>
                    <span className={styles.pendingBadge}>Pending</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredRecords.length && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                <Users size={21} />
              </span>
              <strong>
                {data.length ? "No matching attendance requests" : "No pending requests"}
              </strong>
              <p>
                {data.length
                  ? "Try a different intern name, email, Intern ID or filter."
                  : "There are no attendance requests waiting for approval with these filters."}
              </p>
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {filteredRecords.length > 0 && (
        <footer className={styles.bottomBar}>
          <div className={styles.selectionInfo}>
            <strong>{selected.length}</strong>
            <span>request{selected.length === 1 ? "" : "s"} selected</span>
            {hiddenSelectedCount > 0 && (
              <small>
                {hiddenSelectedCount} selected request
                {hiddenSelectedCount === 1 ? " is" : "s are"} hidden by the
                current filters.
              </small>
            )}
          </div>

          <button
            type="button"
            className={styles.approveSelectedButton}
            disabled={!selected.length || busy}
            onClick={onApproveSelected}
          >
            <Check size={17} />
            {busy ? "Processing..." : `Approve selected (${selected.length})`}
          </button>
        </footer>
      )}
    </main>
  );
}
