import { ArrowUpRight } from "lucide-react";
import styles from "./AdminPageHeader.module.css";

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent = "orange",
  actions,
  aside,
}) {
  return (
    <header className={`${styles.header} flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`}>
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {Icon ? (
          <span className={`${styles.icon} ${styles[accent] || styles.orange}`}>
            <Icon size={22} strokeWidth={2.1} />
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
      </div>
      {(actions || aside) ? (
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          {actions}
          {aside}
        </div>
      ) : null}
    </header>
  );
}
