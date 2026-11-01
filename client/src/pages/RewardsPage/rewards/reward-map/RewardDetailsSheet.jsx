import React, { useState } from "react";

import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";

import { rewardMapAssets } from "./rewardMapAssets";

import {
  formatDate,
  getMilestoneRewardLabel,
  getMilestoneStatusLabel,
} from "./rewardMapUtils";

import styles from "./RewardDetailsSheet.module.css";

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value ?? "locked")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getStatus(milestone) {
  // Use the actual data status first. visualState is only a fallback.
  return normalize(
    milestone?.status ??
      milestone?.approvalStatus ??
      milestone?.visualState ??
      "locked",
  );
}

function getStatusIcon(status) {
  switch (status) {
    case "completed":
      return CheckCircle2;

    case "approved":
      return BadgeCheck;

    case "credited":
      return ShieldCheck;

    case "pending":
      return Clock3;

    case "claimable":
      return Gift;

    case "rejected":
    case "missed":
      return AlertCircle;

    case "holiday":
      return Sun;

    default:
      return LockKeyhole;
  }
}

function getStatusArt(status) {
  switch (status) {
    case "claimable":
      return rewardMapAssets.chests.open;

    case "completed":
    case "credited":
    case "approved":
      return rewardMapAssets.checkpoints.goldenStar;

    case "pending":
      return rewardMapAssets.checkpoints.pendingReview;

    case "rejected":
    case "missed":
    case "holiday":
    case "locked":
    default:
      return rewardMapAssets.checkpoints.lockedToken;
  }
}

function getStatusMessage(status, rewardStatus) {
  if (status === "pending") {
    return {
      type: "pending",
      icon: Clock3,
      title: "Awaiting review",
      message:
        "This attendance or reward checkpoint is still pending review. It is not confirmed as a wallet credit.",
    };
  }

  if (status === "approved" && rewardStatus !== "credited") {
    return {
      type: "approved",
      icon: BadgeCheck,
      title: "Attendance approved",
      message:
        "Your attendance has been approved. A separate confirmed wallet transaction is required before the reward can be considered credited.",
    };
  }

  if (status === "credited" || rewardStatus === "credited") {
    return {
      type: "credited",
      icon: ShieldCheck,
      title: "Reward credit recorded",
      message:
        "The available reward data identifies this reward as credited. Check the transaction reference and your wallet history for the corresponding entry.",
    };
  }

  if (status === "rejected") {
    return {
      type: "rejected",
      icon: AlertCircle,
      title: "Record rejected",
      message:
        "This record has been marked as rejected. Review the instructions from your administrator if you need to take further action.",
    };
  }

  if (status === "missed") {
    return {
      type: "missed",
      icon: AlertCircle,
      title: "Attendance missed",
      message:
        "This attendance session is recorded as missed. It has not been treated as a wallet credit.",
    };
  }

  if (status === "holiday") {
    return {
      type: "holiday",
      icon: Sun,
      title: "Holiday record",
      message:
        "This checkpoint is marked as a holiday. It is not counted as an attendance approval or a wallet credit.",
    };
  }

  if (status === "claimable") {
    return {
      type: "claimable",
      icon: Gift,
      title: "Reward marked as available",
      message:
        "The current reward data marks this checkpoint as ready. Follow the redemption instructions supplied by your administrator.",
    };
  }

  if (status === "completed") {
    return {
      type: "completed",
      icon: CheckCircle2,
      title: "Milestone completed",
      message:
        "This milestone is marked as completed. Completion by itself does not confirm that a wallet transaction has been recorded.",
    };
  }

  return {
    type: "locked",
    icon: LockKeyhole,
    title: "Upcoming milestone",
    message:
      "This checkpoint is not currently marked as available. Review its requirements to see what comes next.",
  };
}

function getRequirementText(requirement) {
  if (typeof requirement === "string") {
    return requirement;
  }

  if (requirement && typeof requirement === "object") {
    return (
      requirement.title ??
      requirement.label ??
      requirement.description ??
      "Requirement information"
    );
  }

  return String(requirement ?? "");
}

async function copyReference(value) {
  if (!value) {
    throw new Error("No transaction reference is available.");
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  // Fallback for browsers without Clipboard API support.
  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");

  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copying is not supported by this browser.");
  }
}

/* =========================================================
   REWARD DETAILS SHEET
========================================================= */

export default function RewardDetailsSheet({ milestone }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  if (!milestone) {
    return (
      <aside className={styles.empty}>
        <div className={styles.emptyIcon}>
          <Sparkles size={25} />
        </div>

        <h3>Select a checkpoint</h3>

        <p>
          Choose a marker on your reward map to see its requirements, current
          status and reward information.
        </p>
      </aside>
    );
  }

  const status = getStatus(milestone);

  const reward = milestone.reward ?? {};

  const rewardStatus = normalize(reward.status);

  const StatusIcon = getStatusIcon(status);

  const message = getStatusMessage(status, rewardStatus);

  const MessageIcon = message.icon;

  const art = getStatusArt(status);

  const requirements = Array.isArray(milestone.requirements)
    ? milestone.requirements.filter(Boolean)
    : [];

  const reference = String(
    reward.transactionId ?? milestone.transactionId ?? "",
  );

  const rewardLabel = getMilestoneRewardLabel(milestone);

  const statusLabel = getMilestoneStatusLabel(status);

  const hasDate = Boolean(milestone.date);

  /* -------------------------------------------------------
     COPY TRANSACTION REFERENCE
  ------------------------------------------------------- */

  const handleCopy = async () => {
    if (!reference) return;

    setCopyError("");

    try {
      await copyReference(reference);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      setCopyError(error?.message ?? "Unable to copy the reference.");
    }
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <aside className={styles.sheet} aria-labelledby="reward-details-heading">
      {/* =================================================
          CHECKPOINT HEADER
      ================================================= */}

      <div className={styles.top}>
        {!frameFailed && (
          <img
            className={styles.frame}
            src={rewardMapAssets.ui.detailFrame}
            alt=""
            aria-hidden="true"
            onError={() => setFrameFailed(true)}
          />
        )}

        <div className="w-full flex justify-between">
          {/* Decorative status artwork */}

          <div className={styles.art}>
            {!imageFailed ? (
              <img
                src={art}
                alt=""
                aria-hidden="true"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className={styles.artFallback}>
                <StatusIcon size={29} />
              </span>
            )}
          </div>

          {/* Status */}

          <span
            className={[styles.state, styles[`state_${status}`] ?? ""]
              .filter(Boolean)
              .join(" ")}
          >
            <StatusIcon size={13} />
            {statusLabel}
          </span>
        </div>

        <h3 id="reward-details-heading">
          {milestone.title ?? "Reward checkpoint"}
        </h3>

        <p>
          {milestone.description ||
            "Keep progressing through your internship journey to unlock more milestones."}
        </p>
      </div>

      {/* =================================================
          DETAILS
      ================================================= */}

      <div className={styles.content}>
        {/* Reward amount */}

        <div className={styles.rewardAmount}>
          <span>Reward information</span>

          <strong>{rewardLabel}</strong>

          {milestone.type === "project" && (
            <small>
              The project reward depends on the applicable admin-issued promo
              code and its configured rules.
            </small>
          )}

          {rewardStatus === "credited" && (
            <small className={styles.credited}>
              <CheckCircle2 size={13} />
              Recorded as credited
            </small>
          )}

          {rewardStatus === "pending" && (
            <small className={styles.pendingText}>
              <Clock3 size={13} />
              Awaiting confirmation
            </small>
          )}
        </div>

        {/* Date */}

        {hasDate && (
          <div className={styles.date}>
            <CalendarDays size={16} />
            <span>{formatDate(milestone.date)}</span>
          </div>
        )}

        {/* Requirements */}

        <div>
          <h4>Checkpoint requirements</h4>

          {requirements.length > 0 ? (
            <ul className={styles.requirements}>
              {requirements.map((requirement, index) => (
                <li key={`${milestone.id ?? "milestone"}-${index}`}>
                  <span>
                    <CheckCircle2 size={14} />
                  </span>

                  <p>{getRequirementText(requirement)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>
              Requirements have not been provided by the available reward data.
            </p>
          )}
        </div>

        {/* Transaction reference */}

        {reference && (
          <div className={styles.reference}>
            <ShieldCheck size={15} />

            <div className={styles.referenceContent}>
              <span>Transaction reference</span>

              <strong>{reference}</strong>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={styles.copyButton}
              aria-label="Copy transaction reference"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}

              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {copyError && (
          <p className={styles.copyError} role="alert">
            {copyError}
          </p>
        )}

        {/* Status explanation */}

        <div
          className={[
            styles.statusNotice,
            styles[`notice_${message.type}`] ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
        >
          <MessageIcon size={16} />

          <span>
            <strong>{message.title}</strong>
            {message.message}
          </span>
        </div>

        {/* Transparency */}

        <p className={styles.disclaimer}>
          Reward-map information is based on available attendance and wallet
          records. Selecting a checkpoint does not itself issue, redeem or
          modify wallet credits.
        </p>
      </div>
    </aside>
  );
}
