import { useMemo } from "react";
import { Bell, ExternalLink, Send, Users, Megaphone, CalendarClock, Link2 } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import AdminStatCard from "../components/AdminStatCard.jsx";
import styles from "./NotificationsPage.module.css";

export default function NotificationsPage({groups=[],noticeForm,setNoticeForm,sendNotification,notifications=[],fmtDate}) {
  const update=(key,value)=>setNoticeForm((current)=>({...current,[key]:value}));
  const recent=useMemo(()=>[...notifications].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),[notifications]);
  const audienceCount=noticeForm.targetGroupId==="all" ? "All active groups" : groups.find((g)=>g._id===noticeForm.targetGroupId)?.name || "Selected group";

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader eyebrow="COMMUNICATIONS CENTRE" title="Notifications & broadcasts" description="Write a clear announcement, choose an audience and review every sent broadcast." icon={Bell} accent="cyan"/>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <AdminStatCard label="Sent broadcasts" value={notifications.length} hint="Available message history" icon={Megaphone} tone="cyan"/>
        <AdminStatCard label="Active groups" value={groups.filter((g)=>g.status!=="completed").length} hint="Available audiences" icon={Users} tone="green"/>
        <AdminStatCard label="Selected audience" value={noticeForm.targetGroupId==="all"?"All":1} hint={audienceCount} icon={Bell} tone="purple"/>
      </div>
      <section className={styles.composePanel}>
        <div className={styles.composeHeader}><span><Send size={20}/></span><div><p className={styles.eyebrow}>COMPOSE & DISTRIBUTE</p><h2>Create a broadcast</h2><p>Keep the message specific, timely and easy for interns to act on.</p></div></div>
        <form onSubmit={sendNotification} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Audience">
              <select className="select w-full" value={noticeForm.targetGroupId} onChange={(e)=>update("targetGroupId",e.target.value)}>
                <option value="all">All groups</option>{groups.filter((g)=>g.status!=="completed").map((group)=><option key={group._id} value={group._id}>{group.name}</option>)}
              </select>
            </Field>
            <Field label="Optional action link">
              <div className={styles.linkField}><Link2 size={15}/><input type="url" value={noticeForm.link} onChange={(e)=>update("link",e.target.value)} placeholder="https://…"/></div>
            </Field>
          </div>
          <Field label="Notification title">
            <input className="input w-full" required maxLength={120} value={noticeForm.title} onChange={(e)=>update("title",e.target.value)} placeholder="Important attendance update"/>
          </Field>
          <Field label="Message">
            <textarea className="textarea w-full" required maxLength={3000} rows={5} value={noticeForm.message} onChange={(e)=>update("message",e.target.value)} placeholder="Write the message interns will see…"/>
            <div className={styles.characterCount}>{noticeForm.message.length}/3000 characters</div>
          </Field>
          <div className={styles.preview}>
            <div className={styles.previewTop}><span><Bell size={15}/> LIVE MESSAGE PREVIEW</span><small>{audienceCount}</small></div>
            <strong>{noticeForm.title||"Your notification title"}</strong>
            <p>{noticeForm.message||"Your message will appear here as interns receive it."}</p>
            {noticeForm.link ? <span className={styles.previewLink}><ExternalLink size={13}/> {noticeForm.link}</span> : null}
          </div>
          <div className={styles.formFooter}><p><Users size={15}/> This broadcast will be sent to <b>{audienceCount}</b>.</p><button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2"><Send size={15}/> Send notification</button></div>
        </form>
      </section>

      <section className={styles.historyPanel}>
        <div className={styles.historyHeader}><div><p className={styles.eyebrow}>MESSAGE ARCHIVE</p><h2>Broadcast history <span>{notifications.length}</span></h2><p>Latest notices are displayed first.</p></div></div>
        {recent.length ? (
          <div className={styles.noticeList}>
            {recent.map((notice)=>(
              <article className={styles.noticeCard} key={notice._id}>
                <span className={styles.noticeIcon}><Bell size={17}/></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3>{notice.title}</h3><span className={styles.audience}>{notice.targetGroup?.name||"All groups"}</span></div><p>{notice.message}</p><div className={styles.noticeMeta}><span><CalendarClock size={13}/>{fmtDate(notice.createdAt)}</span>{notice.link?<a href={notice.link} target="_blank" rel="noreferrer">Open action link <ExternalLink size={12}/></a>:null}</div></div>
              </article>
            ))}
          </div>
        ) : <div className="empty">No broadcasts have been sent yet.</div>}
      </section>
    </div>
  );
}
