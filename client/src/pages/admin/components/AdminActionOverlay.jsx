import { ShieldCheck, Sparkles } from "lucide-react";
import styles from "./AdminActionOverlay.module.css";

export default function AdminActionOverlay({ label = "Updating workspace…" }) {
  return (
    <div className={styles.backdrop} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.card}>
        <div className={styles.orbit}><span/><span/><span/><ShieldCheck size={27}/></div>
        <div><p className={styles.eyebrow}><Sparkles size={13}/> VELOOP ADMIN</p><h2>Working securely</h2><p>{label}</p></div>
        <div className={styles.progress}><span/></div>
        <small>Please keep this page open until the action is complete.</small>
      </div>
    </div>
  );
}
