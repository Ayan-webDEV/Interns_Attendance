import { Menu, RefreshCw, X } from "lucide-react";
import styles from "./AdminHeader.module.css";

export default function AdminHeader({
  menuOpen,
  setMenuOpen,
  refreshing,
  onRefresh,
  activeLabel = "Workspace",
}) {
  return (
    <header
      className={`${styles.mobileTopbar} flex items-center justify-between gap-3`}
    >
      <div className={`${styles.mobileBrand} min-w-0 flex items-center gap-3`}>
        <span className={styles.brandMark}>V</span>
        <div className="min-w-0">
          <strong>VELOOP Admin</strong>
          <span>{activeLabel}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={styles.mobileRefresh}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh admin data"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
