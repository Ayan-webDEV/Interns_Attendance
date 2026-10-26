import React from "react";
import {
  Award,
  Bell,
  CalendarCheck,
  Gift,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

const NAV = [
  ["attendance", "Attendance", CalendarCheck],
  ["rewards", "InternCash wallet", Wallet],
  ["promos", "Promo codes", Gift],
  ["notifications", "Notifications", Bell],
  ["certificate", "Certification", Award],
  ["account", "My account", UserRound],
];

export default function InternNavigation({
  variant = "desktop",
  tab,
  setTab,
  notifications = [],
}) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <nav
        aria-label="Mobile portal navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 min-[761px]:hidden"
      >
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            aria-label={label}
            onClick={() => setTab(id)}
            className={`relative flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${tab === id ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`}
          >
            <Icon size={17} />
            <span className="max-w-full truncate">{label}</span>
            {id === "notifications" && unreadCount > 0 && (
              <span className="absolute right-3 top-1 size-1.5 rounded-full bg-rose-500" />
            )}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <aside
      aria-label="Intern workspace navigation"
      className="sticky top-17.5 z-30 flex h-[calc(100vh-72px)] w-67 shrink-0 flex-col self-start overflow-y-auto overscroll-contain border-r border-slate-200 bg-white/95 px-4 py-6 shadow-[4px_0_24px_rgba(15,23,42,0.025)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 max-[760px]:hidden"
    >
      <div className="mb-3 px-3 pb-2 text-[10px] font-extrabold tracking-[0.16em] text-slate-400 dark:text-slate-500">
        YOUR WORKSPACE
      </div>
      <nav className="grid gap-1.5" aria-label="Intern portal sections">
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            className={`group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 ${tab === id ? "bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20" : "text-slate-500 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
            onClick={() => setTab(id)}
          >
            {tab === id && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
            )}
            <Icon size={17} className="shrink-0" />
            <span className="min-w-0 flex-1">{label}</span>
            {id === "notifications" && unreadCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mx-0.5 mt-auto rounded-2xl border border-emerald-200/70 bg-linear-to-br from-emerald-50 to-teal-50 p-3.5 text-xs leading-4 text-slate-600 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-teal-950/30 dark:text-slate-300">
        <div className="flex gap-3 items-center">
          <div className="mb-2 grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <ShieldCheck size={18} />
          </div>
          <b className="mb-2 block text-[12.5px] font-extrabold text-slate-900 dark:text-white">
            Attendance Approval
          </b>
        </div>
        <span className="inline-flex text-[10.5px]">
          Attendance counts only after admin approval. Follow up on pending
          requests with your group admin.
        </span>
      </div>
      <span></span>
    </aside>
  );
}
