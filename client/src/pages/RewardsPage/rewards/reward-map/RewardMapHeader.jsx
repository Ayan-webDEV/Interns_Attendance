import React from "react";

import {
  Map,
  RefreshCw,
  Sparkles,
  X,
  Trophy,
  CheckCircle2,
} from "lucide-react";

import styles from "./RewardMapHeader.module.css";

/* =========================================================
   HELPERS
========================================================= */

function safeCount(value) {
  const number = Number(value);

  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function safeProgress(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Math.min(100, Math.max(0, number));
}

/* =========================================================
   REWARD MAP HEADER
========================================================= */

export default function RewardMapHeader({
  progress = 0,
  completed = 0,
  total = 0,
  loading = false,
  onRefresh,
  onClose,
}) {
  const progressValue = safeProgress(progress);
  const completedCount = safeCount(completed);
  const totalCount = safeCount(total);

  const hasRefreshHandler = typeof onRefresh === "function";

  const hasCloseHandler = typeof onClose === "function";

  return (
    <header className={styles.header}>
      {/* =================================================
          BRAND AND TITLE
      ================================================= */}

      <div className={styles.title}>
        <span className={styles.icon} aria-hidden="true">
          <Map size={22} strokeWidth={1.9} />
        </span>

        <div className={styles.headingContent}>
          <span className={styles.kicker}>
            <Sparkles size={12} />
            YOUR REWARD ADVENTURE
          </span>

          <h2 id="reward-map-title">InternCash Journey</h2>

          <p>Explore your checkpoints. Celebrate every milestone.</p>
        </div>
      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className={styles.actions}>
        {/* Progress indicator */}

        <div
          className={styles.progress}
          aria-label={`${progressValue}% journey progress`}
        >
          <span className={styles.progressIcon}>
            <Trophy size={14} />
          </span>

          <span className={styles.progressContent}>
            <strong>{progressValue}%</strong>

            <span>
              <CheckCircle2 size={11} />
              {completedCount} of {totalCount} completed
            </span>
          </span>
        </div>

        {/* Refresh */}

        <button
          type="button"
          onClick={hasRefreshHandler ? onRefresh : undefined}
          disabled={loading || !hasRefreshHandler}
          aria-label={loading ? "Refreshing reward map" : "Refresh reward map"}
          title={loading ? "Refreshing..." : "Refresh reward map"}
          aria-busy={loading}
          className={styles.actionButton}
        >
          <RefreshCw size={17} className={loading ? styles.spin : ""} />

          <span className={styles.actionLabel}>
            {loading ? "Syncing" : "Refresh"}
          </span>
        </button>

        {/* Close */}

        <button
          type="button"
          onClick={hasCloseHandler ? onClose : undefined}
          disabled={!hasCloseHandler}
          aria-label="Close reward map"
          title="Close reward map"
          className={`${styles.actionButton} ${styles.closeButton}`}
        >
          <X size={19} />

          <span className={styles.closeLabel}>Close</span>
        </button>
      </div>
    </header>
  );
}
