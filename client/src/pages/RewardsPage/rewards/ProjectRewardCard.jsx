import React from "react";
import {
  BadgeCheck,
  Gift,
  Info,
  LockKeyhole,
  Sparkles,
  Ticket,
} from "lucide-react";

import styles from "./ProjectRewardCard.module.css";

const STEPS = [
  {
    number: "01",
    title: "Build your project",
    description: "Complete the project assigned to you during your internship.",
  },
  {
    number: "02",
    title: "Submit for review",
    description:
      "Share your completed work using the submission instructions provided.",
  },
  {
    number: "03",
    title: "Redeem your reward",
    description: "Use the eligible promo code issued by your administrator.",
  },
];

export default function ProjectRewardCard() {
  return (
    <section className={styles.card} aria-labelledby="project-reward-title">
      <div className={styles.glowOne} aria-hidden="true" />

      <div className={styles.glowTwo} aria-hidden="true" />

      <div className={styles.layout}>
        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className={styles.content}>
          <div className={styles.badges}>
            <span className={styles.categoryBadge}>
              <Sparkles size={13} />
              Project rewards
            </span>

            <span className={styles.processBadge}>
              <BadgeCheck size={13} />
              Admin-issued reward process
            </span>
          </div>

          <div className={styles.headingRow}>
            <div className={styles.giftIcon}>
              <Gift size={27} />

              <span className={styles.giftSparkle}>
                <Sparkles size={11} />
              </span>
            </div>

            <div className={styles.headingContent}>
              <h2 id="project-reward-title">
                Your project could unlock a reward.
              </h2>

              <p>
                Turn your internship work into a reward opportunity. Complete
                your assigned project and follow the administrator&apos;s
                redemption instructions.
              </p>
            </div>
          </div>

          {/* =================================================
              PROCESS STEPS
          ================================================= */}

          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step.number} className={styles.step}>
                <span className={styles.stepNumber}>{step.number}</span>

                <span className={styles.stepContent}>
                  <strong>{step.title}</strong>

                  <span>{step.description}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* =================================================
              IMPORTANT INFORMATION
          ================================================= */}

          <div className={styles.notice}>
            <Info size={17} className={styles.noticeIcon} />

            <p>
              Submitting a project does not automatically add InternCash to your
              wallet. A reward is credited only after the applicable
              administrator-issued promo code is successfully redeemed.
            </p>
          </div>
        </div>

        {/* =================================================
            REWARD RANGE
        ================================================= */}

        <aside
          className={styles.rewardRange}
          aria-label="Potential project reward information"
        >
          <div className={styles.rangeTop}>
            <span className={styles.rangeBadge}>
              <Ticket size={13} />
              Project reward
            </span>

            <LockKeyhole size={18} className={styles.lockIcon} />
          </div>

          <div className={styles.rangeContent}>
            <span className={styles.rangeLabel}>Potential reward range</span>

            <div className={styles.amount}>
              <strong>60–140</strong>
              <span>IC</span>
            </div>

            <p className={styles.rangeDescription}>
              The actual reward depends on the promo code issued and its
              configured redemption rules.
            </p>
          </div>

          <div className={styles.rangeFooter}>
            <Sparkles size={16} />

            <span>Your next milestone awaits</span>
          </div>

          <div className={styles.rangeDecoration} aria-hidden="true" />
        </aside>
      </div>
    </section>
  );
}
