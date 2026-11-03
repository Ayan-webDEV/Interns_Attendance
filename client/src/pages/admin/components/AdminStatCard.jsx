import styles from "./AdminStatCard.module.css";

export default function AdminStatCard({
  label, value, hint, icon: Icon, tone = "orange", onClick, active = false,
}) {
  const Tag = onClick ? "button" : "article";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${styles.card} ${styles[tone] || styles.orange} ${active ? styles.active : ""} ${onClick ? styles.interactive : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value ?? "—"}</p>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
        </div>
        <span className={styles.icon}>{Icon ? <Icon size={20} /> : null}</span>
      </div>
      {onClick ? <span className={styles.actionHint}>{active ? "Selected view" : "View details"}</span> : null}
    </Tag>
  );
}
