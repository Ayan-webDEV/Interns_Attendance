import {
  ShieldCheck,
  LockKeyhole,
  Sparkles,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

import styles from "./AuthLoadingOverlay.module.css";

const loadingContent = {
  google: {
    eyebrow: "GOOGLE AUTHENTICATION",
    title: "Verifying your identity",
    description:
      "We're securely validating your Google account and preparing your workspace.",
    steps: [
      "Google identity received",
      "Verifying account credentials",
      "Preparing your workspace",
    ],
  },

  intern: {
    eyebrow: "INTERN AUTHENTICATION",
    title: "Verifying your credentials",
    description:
      "Please wait while we securely verify your intern ID and password.",
    steps: [
      "Credentials submitted",
      "Verifying your account",
      "Preparing your workspace",
    ],
  },

  admin: {
    eyebrow: "ADMIN AUTHENTICATION",
    title: "Securing administrator access",
    description:
      "We're verifying your administrator credentials and checking your access permissions.",
    steps: [
      "Credentials submitted",
      "Checking administrator access",
      "Preparing admin workspace",
    ],
  },
};

export default function AuthLoadingOverlay({ open, type = "intern" }) {
  if (!open) return null;

  const content = loadingContent[type] || loadingContent.intern;

  return (
    <div
      className={`${styles.backdrop} fixed inset-0 z-99999 flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-loading-title"
      aria-describedby="auth-loading-description"
    >
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />

      <div
        className={`${styles.panel} relative w-full max-w-[430px] overflow-hidden rounded-[28px] bg-white p-7 shadow-2xl sm:p-9`}
      >
        {/* Top decorative glow */}
        <div className={styles.topGlow} />

        {/* Brand header */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <div className={styles.brandIcon}>
            <ShieldCheck size={18} />
          </div>

          <span className="text-xs font-bold tracking-[0.2em] text-slate-600">
            VELOOP <span className="text-sky-500">SECURE</span>
          </span>
        </div>

        {/* Animated security illustration */}
        <div className="relative z-10 my-9 flex items-center justify-center">
          <div className={styles.outerOrbit} />

          <div className={styles.middleOrbit} />

          <div className={styles.loaderRing}>
            <LoaderCircle
              size={142}
              strokeWidth={1.15}
              className={styles.rotatingLoader}
            />
          </div>

          <div className={styles.iconContainer}>
            <div className={styles.iconGlow} />

            <div className={styles.shieldIcon}>
              <ShieldCheck size={48} strokeWidth={1.7} />
            </div>

            <div className={styles.lockIcon}>
              <LockKeyhole size={18} />
            </div>
          </div>

          <div className={styles.floatingSparkle}>
            <Sparkles size={19} />
          </div>

          <div className={styles.floatingCheck}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Loading text */}
        <div className="relative z-10 text-center">
          <div className={styles.eyebrow}>
            <span className={styles.statusDot} />
            {content.eyebrow}
          </div>

          <h2
            id="auth-loading-title"
            className="mt-4 text-[25px] font-bold tracking-tight text-slate-900 sm:text-[28px]"
          >
            {content.title}
          </h2>

          <p
            id="auth-loading-description"
            className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-slate-500"
          >
            {content.description}
          </p>
        </div>

        {/* Animated progress */}
        <div className="relative z-10 mt-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Secure authentication
            </span>

            <span className="text-xs font-bold text-sky-600">
              Processing...
            </span>
          </div>

          <div className={styles.progressTrack}>
            <div className={styles.progressBar} />
          </div>
        </div>

        {/* Verification information */}
        <div className={`${styles.infoBox} relative z-10 mt-7`}>
          <div className={styles.infoIcon}>
            <LockKeyhole size={17} />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700">
              Your account is protected
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Your credentials are being securely processed. Please don't close
              or refresh this page.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-7 flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />

          <span className="text-[10px] font-semibold tracking-wide text-slate-400">
            SECURE SIGN-IN · {new Date().getFullYear()} VELOOP REWARDS
          </span>
        </div>
      </div>
    </div>
  );
}
