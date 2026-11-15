import { useState } from "react";
import {
  Archive,
  CalendarClock,
  CalendarCheck,
  Download,
  Edit3,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  RotateCcw,
  Trash2,
  Users,
  UserPlus,
  UserX,
  X,
  Play,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { Field } from "../../../components/ui/Primitives.jsx";
import FullscreenModal from "../components/FullscreenModal.jsx";
import GroupSummaryBar from "../components/GroupSummaryBar.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import { api } from "../../../lib/api.js";
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

const EMPTY_INTERN = {
  name: "",
  email: "",
  internId: "",
  password: "",
  domain: "",
  whatsappNumber: "",
  gender: "",
  internshipStartDate: "",
};

export default function GroupsPage(props) {
  const {
    session,
    groups = [],
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
    groupMembers = [],
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
  } = props;

  const [addGroup, setAddGroup] = useState(null);
  const [newIntern, setNewIntern] = useState(EMPTY_INTERN);
  const [terminationTarget, setTerminationTarget] = useState(null);
  const [terminationReason, setTerminationReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const updateForm = (key, value) =>
    setGroupForm((previous) => ({ ...previous, [key]: value }));

  const updateIntern = (key, value) =>
    setNewIntern((previous) => ({ ...previous, [key]: value }));

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(createdInvite);
      notify("Invitation link copied.");
    } catch {
      notify("Could not copy the invitation link. Copy it manually.");
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

  const downloadAll = async () => {
    try {
      await csvDownload("/groups/admin/archive/download", session.token);
      notify("Cumulative archive downloaded.");
    } catch (error) {
      notify(error.message);
    }
  };

  const exportAttendance = async (group) => {
    try {
      await csvDownload(
        `/groups/${group._id}/attendance-export`,
        session.token,
      );
      notify(`Attendance workbook for ${group.name} downloaded.`);
    } catch (error) {
      notify(error.message);
    }
  };

  const openAddIntern = (group) => {
    setAddGroup(group);
    setNewIntern({
      ...EMPTY_INTERN,
      internshipStartDate: inputDate(
        group.actualStartDate || group.plannedStartDate,
      ),
    });
  };

  const submitAddIntern = async (event) => {
    event.preventDefault();
    if (!addGroup) return;

    setActionBusy(true);

    try {
      await api(`/groups/${addGroup._id}/interns`, {
        token: session.token,
        method: "POST",
        body: JSON.stringify(newIntern),
      });

      notify(
        "Intern added successfully. No offer-letter verification was required.",
      );
      setAddGroup(null);
      setNewIntern(EMPTY_INTERN);

      await refresh(true);

      if (selectedDetail === addGroup._id) {
        await showDetails(addGroup);
      }
    } catch (error) {
      notify(error.message);
    } finally {
      setActionBusy(false);
    }
  };

  const submitTermination = async (event) => {
    event.preventDefault();
    if (!terminationTarget) return;

    setActionBusy(true);

    try {
      await api(
        `/groups/${terminationTarget.groupId}/interns/${terminationTarget._id}/terminate`,
        {
          token: session.token,
          method: "POST",
          body: JSON.stringify({ reason: terminationReason }),
        },
      );

      notify(`${terminationTarget.name}'s access has been revoked.`);
      setTerminationTarget(null);
      setTerminationReason("");

      await refresh(true);

      const group = groups.find((item) => item._id === selectedDetail);
      if (group) await showDetails(group);
    } catch (error) {
      notify(error.message);
    } finally {
      setActionBusy(false);
    }
  };

  const reinstateIntern = async (group, intern) => {
    const note = window.prompt(
      `Optional reinstatement note for ${intern.name}:`,
      "",
    );

    if (note === null) return;

    if (
      !window.confirm(`Restore internship dashboard access for ${intern.name}?`)
    ) {
      return;
    }

    setActionBusy(true);

    try {
      await api(`/groups/${group._id}/interns/${intern._id}/reinstate`, {
        token: session.token,
        method: "POST",
        body: JSON.stringify({ note }),
      });

      notify(`${intern.name}'s access has been restored.`);
      await refresh(true);
      await showDetails(group);
    } catch (error) {
      notify(error.message);
    } finally {
      setActionBusy(false);
    }
  };

  const copyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(createdInvite);
      notify("Invitation link copied.");
    } catch {
      notify("Could not copy the invitation link.");
    }
  };

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader
        eyebrow="COHORT OPERATIONS"
        title="Groups & invitations"
        description="Manage cohort identity, dates, access links, membership, attendance and completion approvals."
        icon={Users}
        accent="purple"
        actions={
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center gap-2"
            onClick={downloadAll}
          >
            <Download size={15} />
            Download archive
          </button>
        }
      />

      <section className={styles.createPanel}>
        <div className={styles.createIntro}>
          <span className={styles.createIcon}>
            <Users size={21} />
          </span>
          <div>
            <p className={styles.panelEyebrow}>BUILD A COHORT</p>
            <h2>Create a new group</h2>
            <p>
              Set the group identity and planned duration. You can update
              details later.
            </p>
          </div>
        </div>

        <form
          onSubmit={createGroup}
          className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <Field label="Group name">
            <input
              className="input w-full"
              required
              minLength={3}
              value={groupForm.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="VELOop Internship · Cohort 04"
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
              placeholder="Enter the group code"
            />
          </Field>

          <div className="lg:col-span-2">
            <Field label="Description (optional)">
              <textarea
                className="textarea w-full"
                rows={2}
                value={groupForm.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Add a short description for this cohort…"
              />
            </Field>
          </div>

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

          <Field label="Duration (working days, Sundays excluded)">
            <input
              className="input w-full"
              type="number"
              min="1"
              max="365"
              required
              value={groupForm.durationDays}
              onChange={(event) =>
                updateForm("durationDays", event.target.value)
              }
            />
          </Field>

          <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <p className={styles.helper}>
              <ShieldCheck size={15} />
              Invite links are generated securely after group creation.
            </p>

            <button
              type="submit"
              className="btn btn-primary inline-flex items-center justify-center gap-2"
              disabled={Boolean(busyLabel)}
            >
              <Users size={16} />
              {busyLabel || "Create group & invitation"}
            </button>
          </div>
        </form>

        {createdInvite ? (
          <div className={styles.inviteBanner}>
            <div className="min-w-0">
              <strong>Invitation link ready</strong>
              <p>{createdInvite}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={copyInviteUrl}
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

              <button
                type="button"
                className="icon-button"
                aria-label="Dismiss link"
                onClick={() => {
                  setCreatedInvite("");
                  setInviteGroup("");
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="min-w-0 space-y-3">
        <div className={styles.listHeading}>
          <div>
            <p className={styles.panelEyebrow}>COHORT DIRECTORY</p>
            <h2>
              All internship groups <span>{groups.length}</span>
            </h2>
          </div>

          <button
            className="btn btn-secondary btn-small"
            type="button"
            onClick={() => refresh(true)}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {groups.length ? (
          groups.map((group) => (
            <GroupSummaryBar
              key={group._id}
              group={group}
              actions={
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    disabled={["completed", "completion_pending"].includes(
                      group.status,
                    )}
                    onClick={() => openAddIntern(group)}
                  >
                    <UserPlus size={13} />
                    Add intern
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => exportAttendance(group)}
                  >
                    <FileSpreadsheet size={13} />
                    Export attendance
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    disabled={group.status === "completed"}
                    onClick={() => getInvite(group)}
                  >
                    <Link2 size={13} />
                    Get link
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    disabled={group.status === "completed"}
                    onClick={() => resetInvite(group)}
                  >
                    <RefreshCw size={13} />
                    Reset
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => showDetails(group)}
                  >
                    <Users size={13} />
                    Members
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
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

                  {group.status === "registration" ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => startGroup(group)}
                    >
                      <Play size={13} />
                      Start group
                    </button>
                  ) : null}

                  {group.status === "active" ? (
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
                  ) : null}

                  {group.status === "completion_pending" ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => {
                        setCompletionGroup(group);
                        setApprovePassword("");
                      }}
                    >
                      <CheckCircle2 size={13} />
                      Second approval
                    </button>
                  ) : null}

                  {group.status === "completed" ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => downloadArchive(group)}
                    >
                      <Archive size={13} />
                      Update archive
                    </button>
                  ) : null}

                  {group.status === "completed" && group.archivedAt ? (
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => deleteGroup(group)}
                    >
                      <Trash2 size={13} />
                      Delete live data
                    </button>
                  ) : null}
                </>
              }
            />
          ))
        ) : (
          <div className="empty">
            No groups yet. Create your first internship cohort above.
          </div>
        )}
      </section>

      {selectedDetail ? (
        <section className={styles.membersPanel}>
          <div className={styles.listHeading}>
            <div>
              <p className={styles.panelEyebrow}>GROUP MEMBERS</p>
              <h2>
                {groups.find((group) => group._id === selectedDetail)?.name ||
                  "Selected group"}
              </h2>
              <p className={styles.attendancePolicy}>
                <ShieldCheck size={14} />
                Minimum mandatory attendance: 75%
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setSelectedDetail("")}
            >
              <X size={14} />
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupMembers.map((intern) => {
              const summary = intern.attendanceSummary || {};
              const terminated =
                intern.status === "terminated" ||
                intern.termination?.isTerminated;

              return (
                <article key={intern._id} className={styles.memberCard}>
                  <div className={styles.memberAvatar}>
                    {(intern.name || "I").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <strong>{intern.name || "Unnamed intern"}</strong>
                    <span>{intern.internId || "—"}</span>
                    <small>{intern.email || "—"}</small>
                    <small>{intern.domain || "Domain not set"}</small>

                    <div className={styles.memberAttendance}>
                      <span>
                        <CalendarCheck size={13} />
                        {summary.attended ?? 0}/{summary.total ?? 0} sessions
                      </span>
                      <b>{summary.attendancePercentage ?? 0}%</b>
                    </div>

                    <span
                      className={`${styles.memberStatus} ${
                        terminated ? styles.terminated : styles.active
                      }`}
                    >
                      {terminated ? "Terminated" : "Active"}
                    </span>
                  </div>

                  <div className={styles.memberActions}>
                    {terminated ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        disabled={actionBusy}
                        onClick={() =>
                          reinstateIntern(
                            groups.find(
                              (group) => group._id === selectedDetail,
                            ),
                            intern,
                          )
                        }
                      >
                        <RotateCcw size={13} />
                        Reinstate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        disabled={actionBusy}
                        onClick={() => {
                          setTerminationTarget({
                            ...intern,
                            groupId: selectedDetail,
                          });
                          setTerminationReason("");
                        }}
                      >
                        <UserX size={13} />
                        Terminate
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {!groupMembers.length ? (
            <div className="empty">No interns have joined this group yet.</div>
          ) : null}
        </section>
      ) : null}

      <FullscreenModal
        open={Boolean(addGroup)}
        title="Add intern manually"
        description={
          addGroup
            ? `Add an intern directly to ${addGroup.name}. Offer-letter verification is not required for this admin action.`
            : ""
        }
        size="large"
        onClose={() => !actionBusy && setAddGroup(null)}
      >
        {addGroup ? (
          <form onSubmit={submitAddIntern} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  className="input w-full"
                  required
                  minLength={2}
                  value={newIntern.name}
                  onChange={(event) => updateIntern("name", event.target.value)}
                  placeholder="Intern's full name"
                />
              </Field>

              <Field label="Email address">
                <input
                  className="input w-full"
                  required
                  type="email"
                  value={newIntern.email}
                  onChange={(event) =>
                    updateIntern("email", event.target.value)
                  }
                  placeholder="intern@example.com"
                />
              </Field>

              <Field label="Intern ID">
                <input
                  className="input w-full uppercase"
                  required
                  minLength={5}
                  maxLength={30}
                  value={newIntern.internId}
                  onChange={(event) =>
                    updateIntern("internId", event.target.value.toUpperCase())
                  }
                  placeholder="VLRINT2026..."
                />
              </Field>

              <Field label="Initial password">
                <input
                  className="input w-full"
                  required
                  minLength={8}
                  type="password"
                  value={newIntern.password}
                  onChange={(event) =>
                    updateIntern("password", event.target.value)
                  }
                  placeholder="Minimum 8 characters"
                />
              </Field>

              <Field label="Internship domain">
                <input
                  className="input w-full"
                  required
                  value={newIntern.domain}
                  onChange={(event) =>
                    updateIntern("domain", event.target.value)
                  }
                  placeholder="Frontend Development"
                />
              </Field>

              <Field label="WhatsApp number">
                <input
                  className="input w-full"
                  value={newIntern.whatsappNumber}
                  onChange={(event) =>
                    updateIntern("whatsappNumber", event.target.value)
                  }
                  placeholder="+91..."
                />
              </Field>

              <Field label="Gender (optional)">
                <select
                  className="select w-full"
                  value={newIntern.gender}
                  onChange={(event) =>
                    updateIntern("gender", event.target.value)
                  }
                >
                  <option value="">Not specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>

              <Field label="Internship start date">
                <input
                  className="input w-full"
                  type="date"
                  value={newIntern.internshipStartDate}
                  onChange={(event) =>
                    updateIntern("internshipStartDate", event.target.value)
                  }
                />
              </Field>
            </div>

            <div className={styles.manualNotice}>
              <ShieldCheck size={17} />
              <p>
                This creates an active intern account directly in this group.
                The intern can sign in using the Intern ID and initial password.
                No offer letter or offer verification is performed.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actionBusy}
                onClick={() => setAddGroup(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionBusy}
              >
                <UserPlus size={15} />
                {actionBusy ? "Adding intern…" : "Add intern to group"}
              </button>
            </div>
          </form>
        ) : null}
      </FullscreenModal>

      <FullscreenModal
        open={Boolean(terminationTarget)}
        title="Terminate internship access"
        description={
          terminationTarget
            ? `This will revoke dashboard access for ${terminationTarget.name}. Their account and attendance history will be retained.`
            : ""
        }
        size="medium"
        onClose={() => !actionBusy && setTerminationTarget(null)}
      >
        {terminationTarget ? (
          <form onSubmit={submitTermination} className="space-y-4">
            <div className={styles.terminationNotice}>
              <UserX size={19} />
              <p>
                The intern will no longer be able to access the dashboard.
                Admins may reinstate them within the permitted window.
              </p>
            </div>

            <Field label="Termination reason">
              <textarea
                className="textarea w-full"
                rows={4}
                required
                minLength={5}
                maxLength={1000}
                value={terminationReason}
                onChange={(event) => setTerminationReason(event.target.value)}
                placeholder="Explain why this internship access is being revoked..."
              />
            </Field>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actionBusy}
                onClick={() => setTerminationTarget(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-danger"
                disabled={actionBusy}
              >
                <UserX size={15} />
                {actionBusy ? "Revoking access…" : "Confirm termination"}
              </button>
            </div>
          </form>
        ) : null}
      </FullscreenModal>

      <FullscreenModal
        open={Boolean(editGroup)}
        title="Edit group details"
        description="Update this cohort without recreating it."
        size="medium"
        onClose={() => setEditGroup(null)}
      >
        {editGroup ? (
          <form onSubmit={saveGroup} className="space-y-4">
            <Field label="Group name">
              <input
                className="input w-full"
                required
                value={editGroup.name || ""}
                onChange={(event) =>
                  setEditGroup({ ...editGroup, name: event.target.value })
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
                rows={3}
                value={editGroup.description || ""}
                onChange={(event) =>
                  setEditGroup({
                    ...editGroup,
                    description: event.target.value,
                  })
                }
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

              <Field label="Duration (working days)">
                <input
                  className="input w-full"
                  type="number"
                  min="1"
                  max="365"
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

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditGroup(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={Boolean(busyLabel)}
              >
                <CheckCircle2 size={15} />
                Save changes
              </button>
            </div>
          </form>
        ) : null}
      </FullscreenModal>
    </div>
  );
}
