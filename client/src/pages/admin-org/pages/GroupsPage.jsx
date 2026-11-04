import {
  Archive,
  Download,
  Edit3,
  Link2,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Field } from "../../../components/ui/Primitives.jsx";
import styles from "./GroupsPage.module.css";

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const inputDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export default function GroupsPage({
  session,
  groups,
  groupForm,
  setGroupForm,
  createGroup,
  createdInvite,
  setCreatedInvite,
  inviteGroup,
  setInviteGroup,
  resetInvite,
  getInvite,
  refresh,
  notify,
  selectedDetail,
  setSelectedDetail,
  groupMembers,
  showDetails,
  editGroup,
  setEditGroup,
  saveGroup,
  startGroup,
  setCompletionGroup,
  setCompletionPassword,
  setApprovePassword,
  deleteGroup,
  busyLabel,
  csvDownload,
}) {
  const updateForm = (key, value) => {
    setGroupForm((previous) => ({ ...previous, [key]: value }));
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(createdInvite);
      notify("Invitation link copied.");
    } catch {
      notify("Could not copy the invitation link. Please copy it manually.");
    }
  };

  const downloadArchive = async (group) => {
    try {
      await csvDownload(`/groups/${group._id}/archive`, session.token, "POST");
      notify("Updated cumulative archive downloaded.");
      refresh(true);
    } catch (error) {
      notify(error.message);
    }
  };

  const downloadCumulativeArchive = async () => {
    try {
      await csvDownload("/groups/admin/archive/download", session.token);
      notify("Cumulative archive downloaded.");
    } catch (error) {
      notify(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="page-heading flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0">
          <div className="eyebrow">COHORT MANAGEMENT</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Groups & invitations
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create a cohort, manage its link, choose the internship duration and
            review every group's members.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary inline-flex items-center justify-center gap-2"
          onClick={downloadCumulativeArchive}
        >
          <Download size={15} />
          Download cumulative archive
        </button>
      </header>

      {/* Create group */}
      <section className="panel min-w-0">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Create a group</h2>
            <p>All fields can be corrected later from Edit group.</p>
          </div>
          <span className="badge">New cohort</span>
        </div>

        <form onSubmit={createGroup} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Group name">
              <input
                className="input w-full"
                required
                minLength={3}
                value={groupForm.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="VELOop Rewards Internship · Cohort 04"
              />
            </Field>

            <Field label="WhatsApp group code">
              <input
                className="input w-full"
                required
                value={groupForm.whatsappGroupCode}
                onChange={(event) =>
                  updateForm("whatsappGroupCode", event.target.value)
                }
                placeholder="Code from WhatsApp group description"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className="textarea w-full"
              value={groupForm.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Short, helpful description of this cohort"
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Planned start date">
              <input
                className="input w-full"
                type="date"
                value={groupForm.plannedStartDate}
                onChange={(event) =>
                  updateForm("plannedStartDate", event.target.value)
                }
              />
            </Field>

            <Field label="Internship duration (days)">
              <input
                className="input w-full"
                type="number"
                min={1}
                max={365}
                required
                value={groupForm.durationDays}
                onChange={(event) =>
                  updateForm("durationDays", event.target.value)
                }
              />
            </Field>
          </div>

          <button
            type="submit"
            className="btn btn-primary inline-flex items-center justify-center gap-2"
            disabled={Boolean(busyLabel)}
          >
            <Users size={16} />
            {busyLabel ? "Processing…" : "Create group & invitation"}
          </button>
        </form>

        {createdInvite && (
          <div className="notice success mt-5 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <b>Current invitation link</b>
              <button
                type="button"
                className="icon-button shrink-0"
                onClick={() => {
                  setCreatedInvite("");
                  setInviteGroup("");
                }}
                aria-label="Hide invitation link"
              >
                <X size={16} />
              </button>
            </div>

            <p className="my-3 break-all text-sm">{createdInvite}</p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary btn-small inline-flex items-center gap-2"
                onClick={copyInvite}
              >
                <Link2 size={14} />
                Copy link
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  const group = groups.find((item) => item._id === inviteGroup);
                  if (group) resetInvite(group);
                }}
              >
                Reset link
              </button>
            </div>

            <p className="small mt-3">
              Resetting invalidates the previous link immediately. Save the
              latest link in your admin records.
            </p>
          </div>
        )}
      </section>

      {/* All groups */}
      <section className="panel min-w-0">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>All groups</h2>
            <p>Every group keeps its current invitation available to admins.</p>
          </div>
          <span className="badge">{groups.length} cohorts</span>
        </div>

        {groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {groups.map((group) => (
              <article key={group._id} className="group-card min-w-0">
                <div className="group-card-top flex flex-col justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <h3 className="break-words">{group.name}</h3>
                    <p className="mt-1 break-words">
                      {group.description || "No description added yet."}
                    </p>
                  </div>

                  <span
                    className={[
                      "badge h-fit shrink-0",
                      group.status === "active" ? "badge-green" : "",
                      group.status === "completed" ? "badge-purple" : "",
                      group.status === "completion_pending"
                        ? "badge-yellow"
                        : "",
                    ].join(" ")}
                  >
                    {group.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="group-meta grid grid-cols-2 gap-4">
                  <div>
                    <span>Members</span>
                    <b>{group.internCount ?? "—"} interns</b>
                  </div>
                  <div>
                    <span>Duration</span>
                    <b>{group.durationDays || 28} days</b>
                  </div>
                  <div>
                    <span>Start date</span>
                    <b>
                      {fmtDate(group.actualStartDate || group.plannedStartDate)}
                    </b>
                  </div>
                  <div>
                    <span>End date</span>
                    <b>{fmtDate(group.actualEndDate)}</b>
                  </div>
                </div>

                <div className="inline-actions flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small inline-flex items-center gap-1.5"
                    disabled={group.status === "completed"}
                    onClick={() => getInvite(group)}
                  >
                    <Link2 size={13} />
                    Get link
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small inline-flex items-center gap-1.5"
                    disabled={group.status === "completed"}
                    onClick={() => resetInvite(group)}
                  >
                    <RefreshCw size={13} />
                    Reset link
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small inline-flex items-center gap-1.5"
                    onClick={() => showDetails(group)}
                  >
                    <Users size={13} />
                    View details
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small inline-flex items-center gap-1.5"
                    onClick={() =>
                      setEditGroup({
                        ...group,
                        plannedStartDate: inputDate(group.plannedStartDate),
                        actualStartDate: inputDate(group.actualStartDate),
                        durationDays: group.durationDays || 28,
                      })
                    }
                  >
                    <Edit3 size={13} />
                    Edit
                  </button>

                  {group.status === "registration" && (
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => startGroup(group)}
                    >
                      Start
                    </button>
                  )}

                  {group.status === "active" && (
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => {
                        setCompletionGroup(group);
                        setCompletionPassword("");
                      }}
                    >
                      Complete…
                    </button>
                  )}

                  {group.status === "completion_pending" && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setCompletionGroup(group);
                        setApprovePassword("");
                      }}
                    >
                      Second approval
                    </button>
                  )}

                  {group.status === "completed" && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small inline-flex items-center gap-1.5"
                      onClick={() => downloadArchive(group)}
                    >
                      <Archive size={13} />
                      {group.archivedAt
                        ? "Update archive"
                        : "Archive & download"}
                    </button>
                  )}

                  {group.status === "completed" && group.archivedAt && (
                    <button
                      type="button"
                      className="btn btn-danger btn-small inline-flex items-center gap-1.5"
                      onClick={() => deleteGroup(group)}
                    >
                      <Trash2 size={13} />
                      Delete live data
                    </button>
                  )}
                </div>

                {group.archivedAt && (
                  <p className="small mt-3">
                    Archived {fmtDate(group.archivedAt)} · Live data deletion is
                    available.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            No groups yet. Create your first internship cohort above.
          </div>
        )}
      </section>

      {/* Group member details */}
      {selectedDetail && (
        <section className="panel min-w-0">
          <div className="panel-header flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2>Group details & members</h2>
              <p>
                {groups.find((group) => group._id === selectedDetail)?.name}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-small inline-flex items-center gap-2"
              onClick={() => setSelectedDetail("")}
            >
              <X size={14} />
              Close details
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Intern ID</th>
                  <th>WhatsApp</th>
                  <th>Domain</th>
                  <th>Joined</th>
                  <th>InternCash</th>
                </tr>
              </thead>
              <tbody>
                {groupMembers.map((intern) => (
                  <tr key={intern._id}>
                    <td>
                      <b>{intern.name}</b>
                      <div className="muted small">{intern.email}</div>
                    </td>
                    <td>{intern.internId}</td>
                    <td>{intern.whatsappNumber || "—"}</td>
                    <td>{intern.domain || "—"}</td>
                    <td>{fmtDate(intern.createdAt)}</td>
                    <td>{intern.internCashBalance} IC</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!groupMembers.length && (
              <div className="empty">
                No interns have joined this group yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Edit group modal */}
      {editGroup && (
        <div className="legal-backdrop">
          <section
            className={`${styles.groupEditModal} legal-modal`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-group-title"
          >
            <header className="legal-header">
              <div>
                <b id="edit-group-title">Edit group details</b>
                <p className="muted small">
                  Correct mistakes without recreating the cohort.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close edit group"
                onClick={() => setEditGroup(null)}
              >
                <X />
              </button>
            </header>

            <form className="legal-content space-y-4" onSubmit={saveGroup}>
              <Field label="Group name">
                <input
                  className="input w-full"
                  required
                  value={editGroup.name || ""}
                  onChange={(event) =>
                    setEditGroup({
                      ...editGroup,
                      name: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="WhatsApp group code">
                <input
                  className="input w-full"
                  required
                  value={editGroup.whatsappGroupCode || ""}
                  onChange={(event) =>
                    setEditGroup({
                      ...editGroup,
                      whatsappGroupCode: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Description">
                <textarea
                  className="textarea w-full"
                  value={editGroup.description || ""}
                  onChange={(event) =>
                    setEditGroup({
                      ...editGroup,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={
                    editGroup.status === "registration"
                      ? "Planned start date"
                      : "Actual start date"
                  }
                >
                  <input
                    className="input w-full"
                    type="date"
                    required={editGroup.status !== "registration"}
                    disabled={editGroup.status === "completed"}
                    value={
                      editGroup.status === "registration"
                        ? editGroup.plannedStartDate
                        : editGroup.actualStartDate
                    }
                    onChange={(event) =>
                      setEditGroup({
                        ...editGroup,
                        [editGroup.status === "registration"
                          ? "plannedStartDate"
                          : "actualStartDate"]: event.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Duration (days)">
                  <input
                    className="input w-full"
                    type="number"
                    min={1}
                    max={365}
                    value={editGroup.durationDays || 28}
                    onChange={(event) =>
                      setEditGroup({
                        ...editGroup,
                        durationDays: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={Boolean(busyLabel)}
                >
                  Save group details
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditGroup(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
