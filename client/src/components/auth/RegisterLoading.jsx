import { ShieldCheck, LoaderCircle, CheckCircle2 } from "lucide-react";
import styles from "./RegisterLoading.module.css";

export default function RegisterLoading({ open }) {
  if (!open) return null;

  return (
    <div
      className={`${styles.backdrop} fixed inset-0 z-[9999] flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-loading-title"
    >
      <div
        className={`${styles.card} w-full max-w-[350px] rounded-2xl bg-white p-6`}
      >
        <div className="flex items-center justify-center">
          <div className={styles.visual}>
            <div className={styles.orbit} />
            <div className={styles.shield}>
              <ShieldCheck size={31} strokeWidth={1.8} />
            </div>
            <div className={styles.spinner}>
              <LoaderCircle size={65} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <div className={styles.status}>
            <span />
            ACCOUNT REGISTRATION
          </div>

          <h3
            id="register-loading-title"
            className="mt-3 text-xl font-extrabold tracking-tight text-slate-800"
          >
            Verifying your details
          </h3>

          <p className="mt-2 text-xs leading-6 text-slate-500">
            Validating your intern profile and official offer details. Please
            wait a moment.
          </p>
        </div>

        <div className="mt-6">
          <div className={styles.progressTrack}>
            <div className={styles.progress} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span className="text-[11px] font-semibold text-slate-500">
            Secure onboarding in progress
          </span>
        </div>
      </div>
    </div>
  );
}
