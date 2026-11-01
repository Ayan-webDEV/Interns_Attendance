import React, { useCallback } from "react";

import {
  Bell,
  CheckCircle2,
  Clock3,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import styles from "./RewardPulse.module.css";

/* =========================================================
   SCROLL HELPER
========================================================= */

function scrollToSection(id) {
  if (typeof document === "undefined") return;

  const element = document.getElementById(id);

  if (!element) return;

  element.scrollIntoView({
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}

/* =========================================================
   INTERACTIVE CARD
========================================================= */

function PulseCard({
  className,
  icon: Icon,
  title,
  value,
  description,
  onClick,
  actionLabel,
  badge,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.pulseCard} ${className}`}
      aria-label={actionLabel || `${title}: ${value}. ${description}`}
    >
      <span className={styles.iconBox} aria-hidden="true">
        <Icon size={20} strokeWidth={2.1} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={styles.kicker}>{title}</span>

        <span className={styles.value}>{value}</span>

        <span className={styles.description}>{description}</span>
      </span>

      <span className={styles.cardAction}>
        {badge !== undefined && badge > 0 && (
          <span className={styles.cardBadge}>{badge > 99 ? "99+" : badge}</span>
        )}

        <ChevronRight size={18} className={styles.arrow} aria-hidden="true" />
      </span>
    </button>
  );
}

/* =========================================================
   REWARD PULSE
========================================================= */

export default function RewardPulse({
  pendingCount = 0,
  approvedCount = 0,
  unreadCount = 0,

  onOpenMap,
  onOpenApprovals,
  onOpenNotifications,
}) {
  const handleApprovals = useCallback(() => {
    if (typeof onOpenApprovals === "function") {
      onOpenApprovals();
      return;
    }

    scrollToSection("approval-station");
  }, [onOpenApprovals]);

  const handleNotifications = useCallback(() => {
    if (typeof onOpenNotifications === "function") {
      onOpenNotifications();
      return;
    }

    scrollToSection("wallet-notifications");
  }, [onOpenNotifications]);

  const handleMap = useCallback(() => {
    if (typeof onOpenMap === "function") {
      onOpenMap();
      return;
    }

    scrollToSection("reward-map-preview");
  }, [onOpenMap]);

  const pending = Math.max(0, Number(pendingCount) || 0);
  const approved = Math.max(0, Number(approvedCount) || 0);
  const unread = Math.max(0, Number(unreadCount) || 0);

  return (
    <section
      className={`${styles.grid} flex w-full gap-5`}
      aria-label="Wallet activity overview"
    >
      <button
        type="button"
        onClick={handleMap}
        className={`${styles.pulseCard} ${styles.journey} w-[48%]`}
        aria-label="Explore your reward journey map and checkpoints"
      >
        <span className={styles.iconBox} aria-hidden="true">
          <Sparkles size={21} strokeWidth={2.1} />
        </span>

        <span className="min-w-0 flex-1">
          <span className={styles.kicker}>Reward journey</span>

          <span className={styles.actionValue}>Explore map</span>

          <span className={styles.description}>View your checkpoints</span>
        </span>

        <span className={styles.cardAction}>
          <ArrowUpRight size={18} className={styles.arrow} aria-hidden="true" />
        </span>
      </button>

      {/* Notifications */}

      <PulseCard
        className={`${styles.notifications} w-[49%]`}
        icon={Bell}
        title="New updates"
        value={unread}
        description="Unread notifications"
        badge={unread}
        onClick={handleNotifications}
        actionLabel={`Open wallet updates. ${unread} unread notifications.`}
      />
    </section>
  );
}
