import { Menu, RefreshCw, X } from "lucide-react";
import styles from "../AdminApp.module.css";

export default function AdminHeader({
  menuOpen,
  setMenuOpen,
  refreshing,
  onRefresh,
}) {
  return (
    <header
      className={`${styles.mobileTopbar} flex items-center justify-between gap-3`}
    >
      <div className={`${styles.mobileBrand} flex min-w-0 items-center gap-3`}>
        <div className={styles.brandMark} aria-hidden="true">
          V
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-wide">VELOOP</p>
          <p className="truncate text-xs opacity-70">Admin workspace</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={styles.mobileRefresh}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
        >
          <RefreshCw size={17} className={refreshing ? "spin" : ""} />
        </button>

        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
