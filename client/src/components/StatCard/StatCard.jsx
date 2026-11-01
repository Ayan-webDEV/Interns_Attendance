import styles from './StatCard.module.css';
export default function StatCard({label,value,sub,icon:Icon,tone='mint'}){return <article className={styles.card}><div className={`${styles.icon} ${styles[tone]}`}>{Icon&&<Icon size={19}/>}</div><div className={styles.label}>{label}</div><strong>{value ?? '—'}</strong>{sub&&<small>{sub}</small>}</article>}
