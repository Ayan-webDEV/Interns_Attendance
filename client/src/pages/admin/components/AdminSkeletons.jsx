import styles from "./AdminSkeletons.module.css";

function Block({ className = "" }) {
  return <span aria-hidden="true" className={`${styles.block} ${className}`} />;
}

export function AdminPageSkeleton({ variant = "overview" }) {
  const Heading = () => <div className={styles.heading}><Block className="h-5 w-36"/><Block className="mt-3 h-9 w-72 max-w-full"/><Block className="mt-2 h-4 w-96 max-w-full"/></div>;
  const Stats = ({count=4}) => <div className={styles.stats}>{Array.from({length:count},(_,i)=><Block key={i} className="h-28"/>)}</div>;
  const Lines = ({count=4,height="h-16"}) => <div className={styles.section}>{Array.from({length:count},(_,i)=><Block key={i} className={height}/>)}</div>;

  if (variant === "wallet") return <div className={`${styles.page} ${styles.wallet}`} aria-label="Loading wallet ledger" aria-busy="true"><Heading/><Stats/><Block className="h-24"/><Lines count={5}/></div>;
  if (variant === "directory") return <div className={styles.page} aria-label="Loading intern directory" aria-busy="true"><Heading/><Block className="h-24"/><div className={styles.cards}>{Array.from({length:4},(_,i)=><Block key={i} className="h-52"/>)}</div></div>;
  if (variant === "groups") return <div className={styles.page} aria-label="Loading groups" aria-busy="true"><Heading/><Block className="h-64"/><Lines count={4} height="h-32"/></div>;
  if (variant === "approvals") return <div className={styles.page} aria-label="Loading approvals" aria-busy="true"><Heading/><Stats count={3}/><Block className="h-24"/><Lines count={5}/></div>;
  if (variant === "attendance") return <div className={styles.page} aria-label="Loading attendance report" aria-busy="true"><Heading/><Stats/><Block className="h-48"/><Lines count={5}/></div>;
  if (variant === "promos") return <div className={styles.page} aria-label="Loading promo campaigns" aria-busy="true"><Heading/><Block className="h-72"/><Lines count={4} height="h-28"/></div>;
  if (variant === "notifications") return <div className={styles.page} aria-label="Loading notifications" aria-busy="true"><Heading/><Block className="h-72"/><Lines count={4} height="h-24"/></div>;
  if (variant === "settings") return <div className={styles.page} aria-label="Loading attendance settings" aria-busy="true"><Heading/><Block className="h-36"/><div className={styles.columns}><Block className="h-64"/><Block className="h-64"/></div></div>;

  return <div className={styles.page} aria-label="Loading admin overview" aria-busy="true"><Heading/><Stats/><div className={styles.columns}><Block className="h-80"/><Block className="h-80"/></div></div>;
}

export function SectionSkeleton({ rows = 3 }) {
  return <div className={styles.section} aria-busy="true">{Array.from({length:rows},(_,i)=><Block key={i} className="h-16"/>)}</div>;
}
