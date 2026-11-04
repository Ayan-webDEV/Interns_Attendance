import { RefreshCw, Search, UserRoundCog } from "lucide-react";

import { Field } from "../../../components/ui/Primitives.jsx";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function InternsPage({
  interns = [],
  groups = [],
  query,
  setQuery,
  selectedGroup,
  setSelectedGroup,
  refreshing,
  loadInterns,
  transfer,
  setTransfer,
  transferIntern,
  busyLabel,
}) {
  const updateTransfer = (key, value) => {
    setTransfer((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const availableGroups = groups.filter(
    (group) => group.status !== "completed",
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <header className="page-heading flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="eyebrow">PEOPLE</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Intern directory
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Search is automatic and group filters update immediately.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary inline-flex shrink-0 items-center justify-center gap-2"
          onClick={() => loadInterns()}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? "spin" : ""} />
          Refresh results
        </button>
      </header>

      {/* Directory and filters */}
      <section className="panel min-w-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Search intern">
            <div className="input-with-icon min-w-0">
              <Search size={16} />
              <input
                className="input w-full min-w-0"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email, ID, WhatsApp or domain"
                aria-label="Search interns"
              />
            </div>
          </Field>

          <Field label="Filter by group">
            <select
              className="select w-full"
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
            >
              <option value="">All groups</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            {interns.length} matching{" "}
            {interns.length === 1 ? "intern" : "interns"}
          </p>

          {refreshing && (
            <span className="text-xs text-slate-500" role="status">
              Updating directory…
            </span>
          )}
        </div>

        <div className="table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th>Intern</th>
                <th>Intern ID</th>
                <th>WhatsApp</th>
                <th>Start date</th>
                <th>Domain</th>
                <th>Group</th>
                <th>InternCash</th>
              </tr>
            </thead>

            <tbody>
              {interns.map((intern) => (
                <tr key={intern._id}>
                  <td>
                    <b>{intern.name || "—"}</b>
                    <div className="muted small break-all">
                      {intern.email || "—"}
                    </div>
                  </td>

                  <td>{intern.internId || "—"}</td>
                  <td>{intern.whatsappNumber || "—"}</td>
                  <td>{formatDate(intern.internshipStartDate)}</td>
                  <td>{intern.domain || "—"}</td>
                  <td>{intern.group?.name || "—"}</td>

                  <td>
                    <b>{intern.internCashBalance ?? 0} IC</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!interns.length && (
            <div className="empty">
              {query || selectedGroup
                ? "No matching interns. Try changing your search or group filter."
                : "No interns found."}
            </div>
          )}
        </div>
      </section>

      {/* Transfer intern */}
      <section className="panel min-w-0">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Transfer an intern</h2>
            <p>Moves the intern to a different non-completed group.</p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10">
            <UserRoundCog size={20} />
          </div>
        </div>

        <form onSubmit={transferIntern} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Intern ID or account ID">
              <input
                className="input w-full"
                required
                value={transfer.internId}
                onChange={(event) =>
                  updateTransfer("internId", event.target.value)
                }
                placeholder="VLRINT…"
                autoComplete="off"
              />
            </Field>

            <Field label="Destination group">
              <select
                className="select w-full"
                required
                value={transfer.targetGroupId}
                onChange={(event) =>
                  updateTransfer("targetGroupId", event.target.value)
                }
              >
                <option value="">Choose destination</option>

                {availableGroups.map((group) => (
                  <option value={group._id} key={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="submit"
            className="btn btn-primary inline-flex items-center justify-center gap-2"
            disabled={Boolean(busyLabel)}
          >
            <UserRoundCog size={16} />
            {busyLabel ? "Processing…" : "Transfer intern"}
          </button>
        </form>

        <p className="policy-disclaimer mt-4">
          Transfer changes the intern’s current group assignment. Existing
          attendance and wallet history remains in the original records for
          audit purposes.
        </p>
      </section>
    </div>
  );
}
