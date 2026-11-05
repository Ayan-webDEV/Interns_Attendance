import styles from "./StatCard.module.css";
export default function StatCard({
  label,
  value,
  double = false,
  sub,
  subIcon,
  subOpt,
  icon: Icon,
  tone = "mint",
}) {
  return (
    <article className={styles.card}>
      <div className={`${styles.icon} ${styles[tone]}`}>
        {Icon && <Icon size={19} />}
      </div>
      <div className={styles.label}>{label}</div>
      <strong>{value ?? "—"}</strong>
      {sub && (
        <small>
          <span className="flex items-center ">
            {sub}{" "}
            {double && (
              <span className="flex justify-center ms-2.5">{subIcon}</span>
            )}{" "}
            {double && subOpt}
          </span>
        </small>
      )}
    </article>
  );
}
