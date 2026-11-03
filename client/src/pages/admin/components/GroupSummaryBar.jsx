import { CalendarDays, Clock3, Edit3, Link2, RefreshCw, Users } from "lucide-react";
import styles from "./GroupSummaryBar.module.css";

const date = (value) => value ? new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Not set";

export default function GroupSummaryBar({ group, actions }) {
  const status = (group.status || "registration").replaceAll("_"," ");
  const start = group.actualStartDate || group.plannedStartDate;
  const end = group.actualEndDate || (start && group.durationDays ? new Date(new Date(start).getTime() + Number(group.durationDays - 1) * 86400000) : null);
  return (
    <article className={styles.card}>
      <div className={styles.mainRow}>
        <div className={styles.nameBlock}>
          <div className={styles.titleLine}>
            <span className={styles.dot} />
            <h3>{group.name}</h3>
            <span className={`${styles.status} ${styles[(group.status || "registration").replaceAll("_","")] || ""}`}>{status}</span>
          </div>
          <p>{group.description || "No cohort description has been added."}</p>
        </div>
        <div className={styles.meta}>
          <div><span><Users size={14}/> Interns</span><strong>{group.internCount ?? 0}</strong></div>
          <div><span><Clock3 size={14}/> Duration</span><strong>{group.durationDays || 28} days</strong></div>
          <div><span><CalendarDays size={14}/> Start</span><strong>{date(start)}</strong></div>
          <div><span><CalendarDays size={14}/> End</span><strong>{date(end)}</strong></div>
          <div><span>Group code</span><strong>{group.whatsappGroupCode || "—"}</strong></div>
        </div>
      </div>
      <div className={styles.actionRow}>
        <span className={styles.actionCaption}>COHORT ACTIONS</span>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </article>
  );
}
