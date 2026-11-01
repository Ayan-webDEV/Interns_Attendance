import React, { useState } from "react";

import {
  AlertCircle,
  Check,
  Clock3,
  Gift,
  LockKeyhole,
  MapPin,
  Sun,
  Sparkles,
} from "lucide-react";

import { rewardMapAssets } from "./rewardMapAssets";

import { formatIC, getMilestoneStatusLabel } from "./rewardMapUtils";

import styles from "./RewardCheckpoint.module.css";

/* =========================================================
   STATUS HELPERS
========================================================= */

function normalize(value) {
  return String(value ?? "locked")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getCheckpointStatus(milestone) {
  const raw = normalize(
    milestone?.status ?? milestone?.visualState ?? "locked",
  );

  const aliases = {
    accepted: "approved",
    present: "approved",
    admin_corrected_present: "approved",

    complete: "completed",
    done: "completed",
    success: "completed",
    successful: "completed",

    under_review: "pending",
    in_review: "pending",
    awaiting_approval: "pending",
    pending_approval: "pending",

    absent: "missed",
    not_present: "missed",

    declined: "rejected",
    denied: "rejected",
    failed: "rejected",

    unavailable: "locked",
  };

  return aliases[raw] ?? raw;
}

/* =========================================================
   CHECKPOINT ARTWORK
========================================================= */

function getCheckpointImage(status) {
  switch (status) {
    case "pending":
      return rewardMapAssets.checkpoints.pendingReview;

    case "claimable":
      return rewardMapAssets.checkpoints.claimable;

    case "completed":
    case "approved":
    case "credited":
      return rewardMapAssets.checkpoints.goldenStar;

    case "locked":
    case "rejected":
    case "missed":
    case "holiday":
    default:
      return rewardMapAssets.checkpoints.lockedToken;
  }
}

/* =========================================================
   CHECKPOINT ICON
========================================================= */

function getCheckpointIcon(status) {
  switch (status) {
    case "approved":
    case "completed":
    case "credited":
      return Check;

    case "pending":
      return Clock3;

    case "claimable":
      return Gift;

    case "rejected":
    case "missed":
      return AlertCircle;

    case "holiday":
      return Sun;

    case "unknown":
      return MapPin;

    default:
      return LockKeyhole;
  }
}

/* =========================================================
   REWARD INFORMATION
========================================================= */

function getRewardDisplay(milestone) {
  const reward = milestone?.reward ?? {};

  const amountValue =
    reward.amount ?? milestone?.rewardAmount ?? milestone?.amount ?? null;

  if (amountValue === null || amountValue === undefined || amountValue === "") {
    return null;
  }

  const amount = Number(amountValue);

  if (!Number.isFinite(amount)) return null;

  const rewardStatus = normalize(reward.status);

  const currency = reward.currency ?? "IC";

  // Only confirmed credits are displayed as credited amounts.
  if (rewardStatus === "credited") {
    return {
      label: formatIC(amount, currency),
      type: "credited",
    };
  }

  // An uncredited amount can be shown only with an explicit
  // pending label; never make it look like a completed credit.
  if (rewardStatus === "pending") {
    return {
      label: `${formatIC(amount, currency)} pending`,
      type: "pending",
    };
  }

  return null;
}

/* =========================================================
   CHECKPOINT COMPONENT
========================================================= */

export default function RewardCheckpoint({
  milestone,
  index = 0,
  selected = false,
  position = {},
  onSelect,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const status = getCheckpointStatus(milestone);

  const image = getCheckpointImage(status);

  const Icon = getCheckpointIcon(status);

  const rewardDisplay = getRewardDisplay(milestone);

  const title = milestone?.title ?? `Checkpoint ${index + 1}`;

  const positionStyle = {
    left: `${position.x ?? 50}%`,
    top: `${position.y ?? 0}%`,
    "--checkpoint-delay": `${(index % 7) * 65}ms`,
  };

  const statusLabel = getMilestoneStatusLabel(status);

  return (
    <button
      type="button"
      className={[
        styles.checkpoint,
        styles[`status_${status}`] ?? "",
        selected ? styles.selected : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={positionStyle}
      onClick={() => onSelect?.(milestone)}
      aria-pressed={selected}
      aria-label={`${title}. ${statusLabel}. Select checkpoint to view details.`}
      title={`${title} — ${statusLabel}`}
    >
      {/* =================================================
          ARTWORK
      ================================================= */}

      <span
        className={[styles.art, imageFailed ? styles.artFallbackMode : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {!imageFailed && image && (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            draggable="false"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}

        {imageFailed && (
          <span className={styles.fallback}>
            <Icon size={23} strokeWidth={2} />
          </span>
        )}

        {/* Small status indicator */}

        <span
          className={`${styles.statusIndicator} ${
            styles[`indicator_${status}`] ?? ""
          }`}
          aria-hidden="true"
        >
          {status === "approved" ||
          status === "completed" ||
          status === "credited" ? (
            <Check size={10} />
          ) : status === "pending" ? (
            <Clock3 size={10} />
          ) : status === "claimable" ? (
            <Sparkles size={10} />
          ) : status === "holiday" ? (
            <Sun size={10} />
          ) : (
            <LockKeyhole size={10} />
          )}
        </span>
      </span>

      {/* =================================================
          CHECKPOINT TITLE
      ================================================= */}

      <span className={styles.label}>{title}</span>

      {/* =================================================
          CREDIT INFORMATION
      ================================================= */}

      {rewardDisplay && (
        <span
          className={[
            styles.amount,
            rewardDisplay.type === "pending"
              ? styles.amountPending
              : styles.amountCredited,
          ].join(" ")}
        >
          {rewardDisplay.label}
        </span>
      )}

      {/* =================================================
          CLAIMABLE STATUS
      ================================================= */}

      {status === "claimable" && (
        <span className={styles.claimBadge}>
          <Sparkles size={10} />
          READY
        </span>
      )}
    </button>
  );
}
