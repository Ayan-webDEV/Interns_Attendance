import {
  Archive, CalendarClock, Download, Edit3, Link2, RefreshCw, Trash2, Users, X, Play, CheckCircle2,
} from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import FullscreenModal from "../components/FullscreenModal.jsx";
import GroupSummaryBar from "../components/GroupSummaryBar.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import styles from "./GroupsPage.module.css";

const fmtDate = (value) => value ? new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const inputDate = (value) => value ? new Date(value).toISOString().slice(0,10) : "";

export default function GroupsPage(props) {
  const {
    session, groups = [], groupForm, setGroupForm, createGroup, createdInvite, setCreatedInvite,
    inviteGroup, setInviteGroup, resetInvite, getInvite, refresh, notify, selectedDetail,
    setSelectedDetail, groupMembers = [], showDetails, editGroup, setEditGroup, saveGroup,
    startGroup, setCompletionGroup, setCompletionPassword, setApprovePassword, deleteGroup,
    busyLabel, csvDownload,
  } = props;

  const updateForm = (key,value) => setGroupForm((prev)=>({...prev,[key]:value}));
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(createdInvite); notify("Invitation link copied."); }
    catch { notify("Could not copy the invitation link. Copy it manually."); }
  };
  const downloadArchive = async (group) => {
    try { await csvDownload(`/groups/${group._id}/archive`,session.token,"POST"); notify("Updated cumulative archive downloaded."); refresh(true); }
    catch (error) { notify(error.message); }
  };
  const downloadAll = async () => {
    try { await csvDownload("/groups/admin/archive/download",session.token); notify("Cumulative archive downloaded."); }
    catch (error) { notify(error.message); }
  };

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader
        eyebrow="COHORT OPERATIONS"
        title="Groups & invitations"
        description="Manage cohort identity, dates, access links, membership and completion approvals."
        icon={Users}
        accent="purple"
        actions={<button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={downloadAll}><Download size={15}/> Download archive</button>}
      />

      <section className={styles.createPanel}>
        <div className={styles.createIntro}>
          <span className={styles.createIcon}><Users size={21}/></span>
          <div><p className={styles.panelEyebrow}>BUILD A COHORT</p><h2>Create a new group</h2><p>Set the group identity and planned duration. You can update details later.</p></div>
        </div>
        <form onSubmit={createGroup} className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <Field label="Group name">
            <input className="input w-full" required minLength={3} value={groupForm.name} onChange={(e)=>updateForm("name",e.target.value)} placeholder="VELOop Internship · Cohort 04"/>
          </Field>
          <Field label="WhatsApp group code">
            <input className="input w-full" required value={groupForm.whatsappGroupCode} onChange={(e)=>updateForm("whatsappGroupCode",e.target.value)} placeholder="Enter the group code"/>
          </Field>
          <div className="lg:col-span-2">
            <Field label="Description (optional)">
              <textarea className="textarea w-full" rows={2} value={groupForm.description} onChange={(e)=>updateForm("description",e.target.value)} placeholder="Add a short description for this cohort…"/>
            </Field>
          </div>
          <Field label="Planned start date">
            <input className="input w-full" type="date" value={groupForm.plannedStartDate} onChange={(e)=>updateForm("plannedStartDate",e.target.value)}/>
          </Field>
          <Field label="Duration (days)">
            <input className="input w-full" type="number" min="1" max="365" required value={groupForm.durationDays} onChange={(e)=>updateForm("durationDays",e.target.value)}/>
          </Field>
          <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <p className={styles.helper}><ShieldCheckIcon/> Invite links are generated securely after group creation.</p>
            <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2" disabled={Boolean(busyLabel)}><Users size={16}/>{busyLabel || "Create group & invitation"}</button>
          </div>
        </form>
        {createdInvite ? (
          <div className={styles.inviteBanner}>
            <div className="min-w-0"><strong>Invitation link ready</strong><p>{createdInvite}</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-small" onClick={copyInvite}><Link2 size={14}/> Copy link</button>
              <button type="button" className="btn btn-secondary btn-small" onClick={()=>{const group=groups.find((g)=>g._id===inviteGroup);if(group)resetInvite(group)}}>Reset link</button>
              <button type="button" className="icon-button" aria-label="Dismiss link" onClick={()=>{setCreatedInvite("");setInviteGroup("")}}><X size={16}/></button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="min-w-0 space-y-3">
        <div className={styles.listHeading}>
          <div><p className={styles.panelEyebrow}>COHORT DIRECTORY</p><h2>All internship groups <span>{groups.length}</span></h2></div>
          <button className="btn btn-secondary btn-small" type="button" onClick={()=>refresh(true)}><RefreshCw size={14}/> Refresh</button>
        </div>
        {groups.length ? groups.map((group)=>(
          <GroupSummaryBar key={group._id} group={group} actions={
            <>
              <button type="button" className="btn btn-secondary btn-small" disabled={group.status==="completed"} onClick={()=>getInvite(group)}><Link2 size={13}/> Get link</button>
              <button type="button" className="btn btn-secondary btn-small" disabled={group.status==="completed"} onClick={()=>resetInvite(group)}><RefreshCw size={13}/> Reset</button>
              <button type="button" className="btn btn-secondary btn-small" onClick={()=>showDetails(group)}><Users size={13}/> Members</button>
              <button type="button" className="btn btn-secondary btn-small" onClick={()=>setEditGroup({...group,plannedStartDate:inputDate(group.plannedStartDate),actualStartDate:inputDate(group.actualStartDate),durationDays:group.durationDays||28})}><Edit3 size={13}/> Edit</button>
              {group.status==="registration" ? <button type="button" className="btn btn-primary btn-small" onClick={()=>startGroup(group)}><Play size={13}/> Start group</button> : null}
              {group.status==="active" ? <button type="button" className="btn btn-danger btn-small" onClick={()=>{setCompletionGroup(group);setCompletionPassword("")}}>Complete…</button> : null}
              {group.status==="completion_pending" ? <button type="button" className="btn btn-primary btn-small" onClick={()=>{setCompletionGroup(group);setApprovePassword("")}}><CheckCircle2 size={13}/> Second approval</button> : null}
              {group.status==="completed" ? <button type="button" className="btn btn-secondary btn-small" onClick={()=>downloadArchive(group)}><Archive size={13}/> Update archive</button> : null}
              {group.status==="completed" && group.archivedAt ? <button type="button" className="btn btn-danger btn-small" onClick={()=>deleteGroup(group)}><Trash2 size={13}/> Delete live data</button> : null}
            </>
          }/>
        )) : <div className="empty">No groups yet. Create your first internship cohort above.</div>}
      </section>

      {selectedDetail ? (
        <section className={styles.membersPanel}>
          <div className={styles.listHeading}>
            <div><p className={styles.panelEyebrow}>GROUP MEMBERS</p><h2>{groups.find((g)=>g._id===selectedDetail)?.name || "Selected group"}</h2></div>
            <button type="button" className="btn btn-secondary btn-small" onClick={()=>setSelectedDetail("")}><X size={14}/> Close</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupMembers.map((intern)=>(
              <article key={intern._id} className={styles.memberCard}>
                <div className={styles.memberAvatar}>{(intern.name||"I").charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><strong>{intern.name||"Unnamed intern"}</strong><span>{intern.internId||"—"}</span><small>{intern.email||"—"}</small></div>
                <b>{intern.internCashBalance??0} IC</b>
              </article>
            ))}
          </div>
          {!groupMembers.length ? <div className="empty">No interns have joined this group yet.</div> : null}
        </section>
      ) : null}

      <FullscreenModal
        open={Boolean(editGroup)}
        title="Edit group details"
        description="Update this cohort without recreating it."
        size="medium"
        onClose={()=>setEditGroup(null)}
      >
        {editGroup ? (
          <form onSubmit={saveGroup} className="space-y-4">
            <Field label="Group name"><input className="input w-full" required value={editGroup.name||""} onChange={(e)=>setEditGroup({...editGroup,name:e.target.value})}/></Field>
            <Field label="WhatsApp group code"><input className="input w-full" required value={editGroup.whatsappGroupCode||""} onChange={(e)=>setEditGroup({...editGroup,whatsappGroupCode:e.target.value})}/></Field>
            <Field label="Description"><textarea className="textarea w-full" rows={3} value={editGroup.description||""} onChange={(e)=>setEditGroup({...editGroup,description:e.target.value})}/></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={editGroup.status==="registration"?"Planned start date":"Actual start date"}>
                <input className="input w-full" type="date" required={editGroup.status!=="registration"} disabled={editGroup.status==="completed"} value={editGroup.status==="registration"?editGroup.plannedStartDate:editGroup.actualStartDate} onChange={(e)=>setEditGroup({...editGroup,[editGroup.status==="registration"?"plannedStartDate":"actualStartDate"]:e.target.value})}/>
              </Field>
              <Field label="Duration (days)"><input className="input w-full" type="number" min="1" max="365" value={editGroup.durationDays||28} onChange={(e)=>setEditGroup({...editGroup,durationDays:e.target.value})}/></Field>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" className="btn btn-secondary" onClick={()=>setEditGroup(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={Boolean(busyLabel)}><CheckCircle2 size={15}/> Save changes</button>
            </div>
          </form>
        ) : null}
      </FullscreenModal>
    </div>
  );
}

function ShieldCheckIcon(){ return <CalendarClock size={15}/>; }
