import { ShieldCheck } from "lucide-react";
import styles from "../AdminApp.module.css";
import { NAV_ITEMS } from "../navigation";

export default function AdminSidebar({
  activeTab,
  onNavigate,
  pendingApprovals = 0,
  onClose,
}) {
  return (
    <div className="flex h-[90vh] min-h-0 flex-col">
      <div className="px-5 pb-3 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-50">
          Workspace
        </p>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden px-3 pb-4"
      >
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => {
                onNavigate(id);
                onClose?.();
              }}
              className={[
                styles.sidebarNavItem,
                "group relative flex w-full shrink-0 items-center gap-3",
                "rounded-xl px-2 py-2 text-left text-[12px]",
                "transition-colors duration-300",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-emerald-500",
                active ? styles.sidebarNavItemActive : "hover:bg-slate-500/10",
              ].join(" ")}
            >
              <span
                className={[
                  styles.sidebarNavIcon,
                  "flex h-8.5 w-9 shrink-0 items-center justify-center rounded-lg",
                  active ? styles.sidebarNavIconActive : "bg-slate-500/10",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              </span>

              <span className="min-w-0 flex-1 whitespace-normal leading-5">
                {label}
              </span>

              {id === "approvals" && pendingApprovals > 0 && (
                <span
                  className={`${styles.sidebarBadge} inline-flex shrink-0 items-center justify-center rounded-full px-2 py-1 text-[11px] font-bold`}
                >
                  {pendingApprovals > 99 ? "99+" : pendingApprovals}
                </span>
              )}

              {active && (
                <span
                  className={`${styles.sidebarActiveIndicator} absolute bottom-2 left-0 top-2 w-1 rounded-r-full`}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 px-3 pb-4 pt-2">
        <div className={`${styles.sidebarNotice} rounded-2xl p-4`}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`${styles.sidebarSecurityIcon} flex h-9 w-9 items-center justify-center rounded-xl`}
            >
              <ShieldCheck size={18} />
            </span>
            <p className="text-sm font-semibold">Secure workspace</p>
          </div>

          <p className="text-xs leading-5 opacity-70">
            Attendance counts only after approval. Save group archives before
            deleting live records.
          </p>
        </div>

        <p className="px-2 pt-4 text-center text-[10px] opacity-50">
          VELoop Rewards · Admin Portal
        </p>
      </div>
    </div>
  );
}
