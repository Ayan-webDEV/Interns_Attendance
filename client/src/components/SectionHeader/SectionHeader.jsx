import styles from "./SectionHeader.module.css";

const SectionHeader = ({ eye, hds, para, badge, status = true }) => {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <span className={styles.sectionEyebrow}>{eye}</span>
        <h2>{hds}</h2>

        <p>{para}</p>
      </div>

      <span
        className={`${styles.periodBadge} ${status ? styles.periodBadgeStatus : ""}`}
      >
        {badge}
      </span>
    </div>
  );
};
export default SectionHeader;
