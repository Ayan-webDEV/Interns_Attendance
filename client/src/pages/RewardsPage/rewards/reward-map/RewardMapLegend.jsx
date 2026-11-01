import React from "react";

import {
  CheckCircle2,
  BadgeCheck,
  Wallet,
  Clock3,
  AlertCircle,
  CalendarDays,
  LockKeyhole,
  Gift,
} from "lucide-react";

import styles from "./RewardMapLegend.module.css";

/* =========================================================
   REWARD MAP STATUS LEGEND
========================================================= */

const STATES = [
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
    description: "Milestone completed",
  },
  {
    id: "approved",
    label: "Attendance approved",
    icon: BadgeCheck,
    description: "Attendance has been approved",
  },
  {
    id: "credited",
    label: "Reward credited",
    icon: Wallet,
    description: "Reward credit confirmed in wallet",
  },
  {
    id: "pending",
    label: "In review",
    icon: Clock3,
    description: "Awaiting approval or processing",
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: AlertCircle,
    description: "Attendance record rejected",
  },
  {
    id: "missed",
    label: "Missed",
    icon: CalendarDays,
    description: "Attendance session missed",
  },
  {
    id: "holiday",
    label: "Holiday",
    icon: CalendarDays,
    description: "Official holiday record",
  },
  {
    id: "locked",
    label: "Upcoming",
    icon: LockKeyhole,
    description: "Checkpoint not yet available",
  },
  {
    id: "claimable",
    label: "Ready",
    icon: Gift,
    description: "Reward marked as ready to claim",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function RewardMapLegend({ compact = false }) {
  const states = compact
    ? STATES.filter((item) =>
        ["completed", "credited", "pending", "locked", "claimable"].includes(
          item.id,
        ),
      )
    : STATES;

  return (
    <div
      className={`${styles.legend} ${compact ? styles.compact : ""}`}
      role="list"
      aria-label="Reward checkpoint status legend"
    >
      {states.map(({ id, label, icon: Icon, description }) => (
        <span
          key={id}
          className={`${styles.item} ${styles[id] ?? ""}`}
          role="listitem"
          title={description}
        >
          <Icon size={13} strokeWidth={2.2} aria-hidden="true" />

          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
