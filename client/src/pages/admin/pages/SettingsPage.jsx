import { useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Info, Save, ShieldCheck, Sun, Timer } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import styles from "./SettingsPage.module.css";
import { AdminPageSkeleton } from "../components/AdminSkeletons.jsx";

export default function SettingsPage({scheduleLoading=false,scheduleForm,setScheduleForm,saveSchedule}) {
  const [savedPulse,setSavedPulse]=useState(false);
  const update=(key,value)=>setScheduleForm((current)=>({...current,[key]:value}));
  const submit=async(event)=>{
    setSavedPulse(false);
    await saveSchedule(event);
    setSavedPulse(true);
    window.setTimeout(()=>setSavedPulse(false),2200);
  };
  if (scheduleLoading) return <AdminPageSkeleton variant="settings" />;

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader eyebrow="GLOBAL PROGRAMME POLICY" title="Attendance schedule" description="Configure server-enforced attendance windows for every active internship group. Timezone: Indian Standard Time." icon={CalendarClock} accent="orange"/>
      <section className={styles.scheduleHero}>
        <div className={styles.heroIcon}><Sun size={23}/></div>
        <div className="min-w-0 flex-1"><p>DAILY SESSION FRAMEWORK</p><h2>Two attendance checkpoints, one consistent routine.</h2><span>Session 2 is enabled only after session 1 has been approved.</span></div>
        <div className={styles.timezone}>Asia / Kolkata <b>IST · UTC +05:30</b></div>
      </section>
      <form onSubmit={submit} className={styles.formPanel}>
        <div className={styles.sessionGrid}>
          <section className={`${styles.sessionCard} ${styles.sessionOne}`}>
            <div className={styles.sessionHeading}><span><Clock3 size={18}/></span><div><p>CHECKPOINT 01</p><h3>First attendance</h3></div><b>+1 IC</b></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Opens at"><input className="input w-full" type="time" required value={scheduleForm.firstStart} onChange={(e)=>update("firstStart",e.target.value)}/></Field>
              <Field label="Closes at"><input className="input w-full" type="time" required value={scheduleForm.firstEnd} onChange={(e)=>update("firstEnd",e.target.value)}/></Field>
            </div>
            <p className={styles.sessionHint}>Interns submit their first daily attendance within this window.</p>
          </section>
          <section className={`${styles.sessionCard} ${styles.sessionTwo}`}>
            <div className={styles.sessionHeading}><span><Timer size={18}/></span><div><p>CHECKPOINT 02</p><h3>Re-attendance</h3></div><b>+3 IC</b></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Opens at"><input className="input w-full" type="time" required value={scheduleForm.secondStart} onChange={(e)=>update("secondStart",e.target.value)}/></Field>
              <Field label="Closes at"><input className="input w-full" type="time" required value={scheduleForm.secondEnd} onChange={(e)=>update("secondEnd",e.target.value)}/></Field>
            </div>
            <p className={styles.sessionHint}>Re-attendance is available only after the first checkpoint is approved.</p>
          </section>
        </div>
        <section className={styles.minimumCard}>
          <div className={styles.minimumIcon}><ShieldCheck size={19}/></div>
          <div className="min-w-0 flex-1"><h3>Minimum interaction time</h3><p>Minimum time an intern must spend before submitting a session.</p></div>
          <div className={styles.minimumInput}><input className="input w-full" type="number" min="10" max="600" required value={scheduleForm.minimumSeconds} onChange={(e)=>update("minimumSeconds",e.target.value)}/><span>seconds</span></div>
        </section>
        <div className={styles.policyCallout}><Info size={18}/><p><b>Policy reminder:</b> Attendance is limited to the active internship period. Sundays and dates outside the group's internship dates remain locked according to the existing calendar rules. Changes here affect all groups.</p></div>
        <div className={styles.formActions}>
          {savedPulse ? <span className={styles.saved}><CheckCircle2 size={15}/> Schedule saved</span> : <span className={styles.hint}>Review all windows before saving.</span>}
          <button className="btn btn-primary inline-flex items-center justify-center gap-2" type="submit"><Save size={15}/> Save schedule for everyone</button>
        </div>
      </form>
    </div>
  );
}
