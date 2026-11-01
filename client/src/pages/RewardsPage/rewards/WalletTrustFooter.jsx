import React from "react";

import {
  BadgeCheck,
  Check,
  LockKeyhole,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import styles from "./WalletTrustFooter.module.css";

export default function WalletTrustFooter() {
  return (
    <section
      className={`${styles.footer} mb-14`}
      aria-label="VELoop Rewards information"
    >
      {/* Decorative background */}
      <div className={styles.glowOne} aria-hidden="true" />

      <div className={styles.glowTwo} aria-hidden="true" />

      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.message}>
          <div className={styles.brandIcon} aria-hidden="true">
            <BadgeCheck size={26} />

            <span>
              <Check size={10} />
            </span>
          </div>

          <div className={styles.messageContent}>
            <span className={styles.eyebrow}>
              <Sparkles size={12} />
              Your contribution matters
            </span>

            <h2>Every milestone starts with your contribution.</h2>

            <p>
              Stay consistent with your assigned work, follow the attendance
              process, and review your wallet for recorded reward updates. Your
              progress is built through your effort and completed milestones.
            </p>
          </div>
        </div>

        {/* Trust information */}
        <aside className={styles.trustBadge}>
          <span className={styles.trustIcon} aria-hidden="true">
            <LockKeyhole size={19} />
          </span>

          <div className={styles.trustText}>
            <strong>Transparency first</strong>

            <small>Clear updates. Recorded activity.</small>
          </div>

          <span className={styles.trustCheck} aria-hidden="true">
            <ShieldCheck size={15} />
          </span>
        </aside>
      </div>

      {/* Bottom accent */}
      <div className={styles.accent} aria-hidden="true" />
    </section>
  );
}
