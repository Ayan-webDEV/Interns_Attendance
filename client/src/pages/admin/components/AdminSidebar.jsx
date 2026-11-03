import { ShieldCheck, Sparkles } from "lucide-react";
import styles from "./AdminSidebar.module.css";
import { NAV_ITEMS } from "../navigation";

const toneById = {
  overview:"orange", groups:"purple", interns:"cyan", approvals:"green",
  attendance:"cyan", wallet:"green", promos:"purple", notifications:"orange", settings:"cyan",
};

export default function AdminSidebar({activeTab,onNavigate,pendingApprovals=0,onClose}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-[82px] items-center gap-3 border-b border-[var(--border)] px-5">
        <span className={styles.brandMark}>V</span>
        <div className="min-w-0"><p className="m-0 text-sm font-black tracking-[.16em]">VELOOP</p><p className="m-0 mt-1 text-xs text-[var(--muted)]">ADMIN CONTROL CENTRE</p></div>
      </div>
      <div className="px-5 pb-3 pt-5"><p className="m-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[var(--muted)]"><Sparkles size={12}/> Workspace navigation</p></div>
      <nav aria-label="Admin navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map(({id,label,Icon})=>{
          const active=activeTab===id;
          return (
            <button key={id} type="button" aria-current={active?"page":undefined} onClick={()=>{onNavigate(id);onClose?.();}} className={[styles.navItem,"group relative flex min-h-[46px] w-full shrink-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",active?styles.navItemActive:""].join(" ")}>
              <span className={[styles.navIcon,"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",active?styles.navIconActive:"bg-slate-500/10"].join(" ")}>
                <Icon size={18} strokeWidth={active?2.3:1.9}/>
              </span>
              <span className="min-w-0 flex-1 leading-5">{label}</span>
              {id==="approvals"&&pendingApprovals>0?<span className={`${styles.badge} inline-flex min-w-6 items-center justify-center rounded-full px-2 py-1 text-[10px] font-black`}>{pendingApprovals>99?"99+":pendingApprovals}</span>:null}
              {active?<span className={`${styles.activeIndicator} absolute bottom-2 left-0 top-2 w-1 rounded-r-full`}/>:null}
              <span className="sr-only">{toneById[id]}</span>
            </button>
          );
        })}
      </nav>
      <div className="shrink-0 px-3 pb-4 pt-2">
        <div className={`${styles.notice} rounded-2xl p-4`}>
          <div className="mb-3 flex items-center gap-2">
            <span className={`${styles.securityIcon} flex h-9 w-9 items-center justify-center rounded-xl`}><ShieldCheck size={18}/></span>
            <p className="text-sm font-bold">Secure workspace</p>
          </div>
          <p className="text-xs leading-5 opacity-75">Attendance counts only after approval. Keep group archives before deleting live records.</p>
        </div>
        <p className="px-2 pt-4 text-center text-[10px] opacity-50">VELOop Rewards · Admin Portal</p>
      </div>
    </div>
  );
}
