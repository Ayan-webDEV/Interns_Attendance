import { useEffect } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

/* -----------------------------------------
   ICON WRAPPER
----------------------------------------- */
export function Icon({ children }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#eadff0] bg-gradient-to-br from-white via-[#faf6fc] to-[#f0e6f5] text-[#755284] shadow-[0_4px_12px_rgba(68,43,82,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:border-[#d9c5e4]">
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(213,188,229,0.28),transparent_70%)]" />
      <span className="relative flex items-center justify-center">
        {children}
      </span>
    </span>
  );
}

/* -----------------------------------------
   FORM FIELD
----------------------------------------- */
export function Field({ label, children }) {
  return (
    <div className="group/field min-w-0 space-y-2.5">
      <label className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#72627f] transition-colors duration-200 group-focus-within/field:text-[#79518b]">
        {label}
      </label>

      <div className="min-w-0 [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[#e7deeb] [&_input]:bg-white [&_input]:px-4 [&_input]:text-sm [&_input]:font-medium [&_input]:text-[#30243b] [&_input]:shadow-[0_2px_8px_rgba(53,35,66,0.025)] [&_input]:outline-none [&_input]:transition-all [&_input]:duration-200 [&_input]:placeholder:text-[#b3a8ba] [&_input:focus]:border-[#b89ac9] [&_input:focus]:ring-4 [&_input:focus]:ring-[#b89ac9]/15 [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-[#e7deeb] [&_select]:bg-white [&_select]:px-4 [&_select]:text-sm [&_select]:font-medium [&_select]:text-[#30243b] [&_select]:outline-none [&_select]:transition-all [&_select:focus]:border-[#b89ac9] [&_select:focus]:ring-4 [&_select:focus]:ring-[#b89ac9]/15 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-[#e7deeb] [&_textarea]:bg-white [&_textarea]:p-4 [&_textarea]:text-sm [&_textarea]:text-[#30243b] [&_textarea]:outline-none [&_textarea]:transition-all [&_textarea:focus]:border-[#b89ac9] [&_textarea:focus]:ring-4 [&_textarea:focus]:ring-[#b89ac9]/15">
        {children}
      </div>
    </div>
  );
}

/* -----------------------------------------
   STATISTIC CARD
----------------------------------------- */
export function Stat({ label, value, icon, sub }) {
  return (
    <div className="group relative isolate min-w-0 overflow-hidden rounded-[24px] border border-[#ece3ef] bg-gradient-to-br from-white via-[#fffefe] to-[#fbf7fc] p-5 shadow-[0_6px_24px_rgba(56,37,68,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ddcbe6] hover:shadow-[0_15px_35px_rgba(56,37,68,0.09)] sm:p-6">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-12 -top-14 -z-10 size-36 rounded-full bg-[#eee1f5]/55 blur-3xl transition-colors duration-500 group-hover:bg-[#e3cef0]/70" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase leading-5 text-[#8c7b98] sm:text-[11px]">
            {label}
          </p>

          <div className="mt-4 wrap-words text-[28px] font-black leading-none tracking-[-0.045em] text-[#30213d] sm:text-[32px]">
            {value}
          </div>
        </div>

        <Icon>{icon}</Icon>
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-[#f0e8f2] pt-3.5">
        <span className="mt-0.5 shrink-0 text-[#b08a4d]">
          <Sparkles size={12} />
        </span>

        <p className="min-w-0 text-[11px] leading-5 text-[#8c8095] sm:text-xs">
          {sub}
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#d9c3e5]/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

/* -----------------------------------------
   BRAND
----------------------------------------- */
export function Brand() {
  return (
    <div className="group/brand flex min-w-0 items-center gap-3.5">
      <div className="relative shrink-0">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#e8d6a9] via-[#e9d9ef] to-[#d9c1e6] opacity-60 blur-md transition-opacity duration-300 group-hover/brand:opacity-100" />

        <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl border border-[#e9dfeb] bg-white p-1.5 shadow-[0_5px_16px_rgba(54,34,66,0.09)] sm:size-[52px]">
          <img
            className="size-full rounded-xl object-contain"
            src="/LOGO.jpeg"
            alt="VELoop Rewards logo"
          />
        </div>

        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-[#f1e4c9] text-[#87632e] shadow-sm">
          <ShieldCheck size={10} />
        </span>
      </div>

      <div className="min-w-0">
        <div className="truncate text-[16px] font-black leading-tight tracking-[-0.035em] text-[#332340] sm:text-[18px]">
          VELoop Rewards
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="size-1.5 shrink-0 rounded-full bg-[#b28b4c]" />
          <span className="truncate text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8b7b96] sm:text-[10px]">
            Intern Attendance Portal
          </span>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------
   ERROR MESSAGE
----------------------------------------- */
export function ErrorText({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4 text-sm leading-6 text-rose-800 shadow-[0_4px_14px_rgba(190,50,75,0.045)]"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600">
        <AlertCircle size={17} />
      </span>

      <div className="min-w-0 flex-1 break-words pt-1 font-medium">
        {message}
      </div>
    </div>
  );
}

/* -----------------------------------------
   TOAST NOTIFICATION
----------------------------------------- */
export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;

    const t = setTimeout(() => {
      onClose?.();
    }, 4200);

    return () => clearTimeout(t);
  }, [message, onClose]);

  const safeMessage =
    message instanceof Error
      ? message.message
      : typeof message === "string"
        ? message
        : message == null
          ? ""
          : "Something went wrong. Please try again.";

  if (!safeMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[9999] flex w-[calc(100%-2rem)] max-w-[390px] items-start gap-3 overflow-hidden rounded-2xl border border-[#e6d9ec] bg-white/95 p-4 shadow-[0_18px_55px_rgba(42,26,54,0.18)] backdrop-blur-xl animate-in slide-in-from-top-2 duration-300 sm:right-6 sm:top-6"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
        <CheckCircle2 size={19} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8b7b96]">
          VELoop Rewards
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#392b45]">
          {safeMessage}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onClose?.()}
        aria-label="Dismiss notification"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-[#95879e] transition-colors hover:bg-[#f4eef6] hover:text-[#493354] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89ac9]"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          ×
        </span>
      </button>

      <div className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full origin-left bg-gradient-to-r from-[#b89ac9] via-[#d8b879] to-[#b89ac9]" />
    </div>
  );
}
