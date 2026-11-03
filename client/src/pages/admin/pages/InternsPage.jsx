import { useMemo, useState } from "react";
import {
  ArrowUpRight, CalendarCheck, CalendarDays, Clock3, MessageCircle, RefreshCw,
  Search, ShieldAlert, UserRound, UserRoundCog, Wallet, X,
} from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import AdminStatCard from "../components/AdminStatCard.jsx";
import FullscreenModal from "../components/FullscreenModal.jsx";
import { AdminPageSkeleton } from "../components/AdminSkeletons.jsx";
import { getInternAttendanceSummary } from "../utils/adminAttendance.js";
import styles from "./InternsPage.module.css";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const waLink = (number) => {
  const digits = String(number||"").replace(/\D/g,"");
  return digits.length >= 10 ? `https://wa.me/${digits}` : "";
};

export default function InternsPage({
  interns = [], groups = [], attendance = [], query, setQuery, selectedGroup,
  setSelectedGroup, refreshing, loadInterns, transfer, setTransfer,
  transferIntern, busyLabel,
}) {
  const [activeIntern,setActiveIntern] = useState(null);
  const filtered = useMemo(()=>interns,[interns]);
  const availableGroups = groups.filter((group)=>group.status!=="completed");
  const updateTransfer = (key,value)=>setTransfer((previous)=>({...previous,[key]:value}));
  const summary = activeIntern ? getInternAttendanceSummary(activeIntern,attendance) : null;
  const selectedRecords = summary?.records || [];

  if (refreshing && !filtered.length) return <AdminPageSkeleton variant="directory" />;

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader
        eyebrow="PEOPLE & FOLLOW-UP"
        title="Intern directory"
        description="Search your interns, review their programme details and inspect their attendance journey."
        icon={UserRound}
        accent="cyan"
        actions={<button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={()=>loadInterns()} disabled={refreshing}><RefreshCw size={15} className={refreshing?"animate-spin":""}/> Refresh directory</button>}
      />

      <section className={styles.filterPanel}>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,1fr)]">
          <Field label="Search by name, email, intern ID or WhatsApp">
            <div className={styles.searchField}><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search the intern directory…" type="search"/></div>
          </Field>
          <Field label="Filter by internship group">
            <select className="select w-full" value={selectedGroup} onChange={(e)=>setSelectedGroup(e.target.value)}>
              <option value="">All groups</option>{groups.map((group)=><option key={group._id} value={group._id}>{group.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className={styles.resultCount}><b>{filtered.length}</b> matching intern{filtered.length===1?"":"s"}</span>
          {refreshing ? <span className={styles.loadingLabel}>Updating directory…</span> : null}
        </div>
      </section>

      <section className={styles.internGrid}>
        {filtered.length ? filtered.map((intern)=>{
          const link = waLink(intern.whatsappNumber);
          const attendanceSummary = getInternAttendanceSummary(intern,attendance);
          return (
            <article className={styles.internCard} key={intern._id}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{(intern.name||"I").trim().charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <h3>{intern.name||"Unnamed intern"}</h3>
                  <p>{intern.internId||"No intern ID"}</p>
                </div>
                <span className={styles.walletPill}><Wallet size={13}/>{intern.internCashBalance??0} IC</span>
              </div>
              <div className={styles.infoList}>
                <div><span>Email</span><strong>{intern.email||"—"}</strong></div>
                <div><span>Group</span><strong>{intern.group?.name||"Unassigned"}</strong></div>
                <div><span>Domain</span><strong>{intern.domain||"—"}</strong></div>
                <div><span>Start date</span><strong>{formatDate(intern.internshipStartDate)}</strong></div>
              </div>
              <div className={styles.attendancePreview}>
                <div><span><CalendarCheck size={14}/> Approved sessions</span><b>{attendanceSummary.approved}</b></div>
                <div><span><Clock3 size={14}/> Pending</span><b>{attendanceSummary.pending}</b></div>
                <div><span><ShieldAlert size={14}/> Explicit missed</span><b>{attendanceSummary.explicitlyMissedFirst+attendanceSummary.explicitlyMissedSecond}</b></div>
              </div>
              <div className={styles.cardActions}>
                <button type="button" className="btn btn-primary btn-small" onClick={()=>setActiveIntern(intern)}><CalendarDays size={14}/> Attendance details</button>
                {link ? <a className="btn btn-secondary btn-small" href={link} target="_blank" rel="noreferrer"><MessageCircle size={14}/> WhatsApp</a> : <span className={styles.noWhatsApp}>No WhatsApp number</span>}
              </div>
            </article>
          );
        }) : (
          <div className="empty col-span-full">{query||selectedGroup?"No interns match these filters. Try another search or group.":"No interns found."}</div>
        )}
      </section>

      <section className={styles.transferPanel}>
        <div className="flex items-start gap-3">
          <span className={styles.transferIcon}><UserRoundCog size={20}/></span>
          <div><p className={styles.eyebrow}>GROUP OPERATIONS</p><h2>Transfer an intern</h2><p>Move an intern to another open group while retaining existing historical records.</p></div>
        </div>
        <form onSubmit={transferIntern} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Intern ID or account ID"><input className="input w-full" required value={transfer.internId} onChange={(e)=>updateTransfer("internId",e.target.value)} placeholder="VLRINT…"/></Field>
          <Field label="Destination group"><select className="select w-full" required value={transfer.targetGroupId} onChange={(e)=>updateTransfer("targetGroupId",e.target.value)}><option value="">Choose destination</option>{availableGroups.map((group)=><option value={group._id} key={group._id}>{group.name}</option>)}</select></Field>
          <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2" disabled={Boolean(busyLabel)}><UserRoundCog size={15}/>{busyLabel?"Processing…":"Transfer intern"}</button>
        </form>
        <p className={styles.disclaimer}>Transfer changes the current group assignment. Existing attendance and wallet history should remain attached to the original records for audit purposes.</p>
      </section>

      <FullscreenModal
        open={Boolean(activeIntern)}
        title={activeIntern ? `${activeIntern.name || "Intern"} · attendance profile` : "Intern attendance"}
        description={activeIntern ? `${activeIntern.internId || "No intern ID"} · ${activeIntern.group?.name || "Unassigned group"}` : ""}
        size="large"
        onClose={()=>setActiveIntern(null)}
      >
        {activeIntern && summary ? (
          <div className="space-y-5">
            <div className={styles.detailIdentity}>
              <div className={styles.avatarLarge}>{(activeIntern.name||"I").trim().charAt(0).toUpperCase()}</div>
              <div className="min-w-0"><h3>{activeIntern.name}</h3><p>{activeIntern.email}</p><p>{activeIntern.whatsappNumber||"WhatsApp not provided"} · {activeIntern.domain||"Domain not set"}</p></div>
              {waLink(activeIntern.whatsappNumber) ? <a href={waLink(activeIntern.whatsappNumber)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-small"><MessageCircle size={14}/> Contact</a> : null}
            </div>
            <div className={styles.endDateBanner}>
              <div><span>Internship start</span><strong>{formatDate(summary.startDate)}</strong></div>
              <div><span>Calculated end date</span><strong>{formatDate(summary.endDate)}</strong></div>
              <div><span>Attendance progress</span><strong>{summary.approved} / {summary.totalScheduledSessions}</strong></div>
              <div><span>Planned sessions</span><strong>{summary.totalScheduledSessions}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <AdminStatCard label="Approved" value={summary.approved} hint="Including admin corrections" icon={CalendarCheck} tone="green"/>
              <AdminStatCard label="Pending" value={summary.pending} hint="Awaiting review" icon={Clock3} tone="orange"/>
              <AdminStatCard label="Missed · session 1" value={summary.explicitlyMissedFirst} hint="Explicit missed statuses" icon={ShieldAlert} tone="red"/>
              <AdminStatCard label="Missed · session 2" value={summary.explicitlyMissedSecond} hint="Explicit missed statuses" icon={ShieldAlert} tone="purple"/>
            </div>
            <div className={styles.completeness}>
              <div><strong>Session coverage</strong><span>{summary.approved + summary.pending} of {summary.expectedPastSessions} sessions due so far · {summary.totalScheduledSessions} planned in total</span></div>
              <div className={styles.progressTrack}><span style={{width:`${summary.expectedPastSessions ? Math.min(100,((summary.approved+summary.pending)/summary.expectedPastSessions)*100) : 0}%`}}/></div>
              <p>{summary.notRecorded} due session slot(s) have no returned record. This is shown separately and is not automatically classified as missed because holiday exceptions are not included in the supplied data. Last approved session: {summary.lastAttendedDate || "No approved session recorded"}.</p>
            </div>
            <section className={styles.recordsPanel}>
              <div className="flex items-center justify-between gap-3"><h3>Session history</h3><span>{selectedRecords.length} records</span></div>
              {selectedRecords.length ? (
                <div className={styles.recordList}>
                  {[...selectedRecords].sort((a,b)=>String(b.dateKey).localeCompare(String(a.dateKey)) || Number(b.sessionNumber)-Number(a.sessionNumber)).map((record)=>(
                    <div className={styles.recordRow} key={record._id || `${record.dateKey}-${record.sessionNumber}`}>
                      <div><strong>{record.dateKey || "Date unavailable"}</strong><span>Session {record.sessionNumber || "—"}</span></div>
                      <span className={`${styles.recordStatus} ${styles[`status${String(record.status||"unknown").replaceAll("_","")}`]||""}`}>{String(record.status||"unknown").replaceAll("_"," ")}</span>
                      <small>{record.markedAt ? new Date(record.markedAt).toLocaleString("en-IN") : "No mark time"}{record.rejectionReason ? ` · ${record.rejectionReason}` : ""}</small>
                    </div>
                  ))}
                </div>
              ) : <div className="empty">No attendance records were returned for this intern.</div>}
            </section>
          </div>
        ) : null}
      </FullscreenModal>
    </div>
  );
}
