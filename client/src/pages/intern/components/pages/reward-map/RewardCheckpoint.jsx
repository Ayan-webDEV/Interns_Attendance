import React from "react";
import { Check, Clock3, Gift, LockKeyhole } from "lucide-react";
import { rewardMapAssets } from "./rewardMapAssets.js";
import { formatIC, getMilestoneStatusLabel, isCompletedStatus } from "./rewardMapUtils.js";

const normalize = (value) => String(value ?? "locked").toLowerCase().replace(/[\s-]+/g, "_");
export default function RewardCheckpoint({ milestone, index = 0, selected = false, position = {}, onSelect }) {
  const status = normalize(milestone?.status ?? milestone?.visualState);
  const image = status === "pending" ? rewardMapAssets.checkpoints.pendingReview : ["locked", "rejected"].includes(status) ? rewardMapAssets.checkpoints.lockedToken : status === "claimable" ? rewardMapAssets.checkpoints.claimable : rewardMapAssets.checkpoints.goldenStar;
  const amount = milestone?.amount ?? milestone?.reward?.amount;
  const Icon = isCompletedStatus(status) ? Check : status === "pending" ? Clock3 : status === "claimable" ? Gift : LockKeyhole;
  return <button type="button" className={`reward-checkpoint is-${status}${selected ? " is-selected" : ""}${milestone?.type === "project" ? " is-project" : ""}`} style={{ left: `${position.x ?? 50}%`, top: `${position.y ?? 0}%`, "--checkpoint-delay": `${(index % 7) * 70}ms` }} onClick={() => onSelect?.(milestone)} aria-pressed={selected} aria-label={`${milestone?.title ?? "Checkpoint"}: ${getMilestoneStatusLabel(status)}`}>
    <span className="reward-checkpoint-art"><img src={image} alt="" draggable="false" onError={(e) => { e.currentTarget.style.display = "none"; }} /><span className="reward-checkpoint-fallback"><Icon size={20} /></span></span>
    <span className="reward-checkpoint-label">{milestone?.title ?? `Checkpoint ${index + 1}`}</span>
    {isCompletedStatus(status) && amount != null && <span className="reward-checkpoint-amount">{formatIC(amount)}</span>}
    {status === "claimable" && <span className="reward-checkpoint-badge">CLAIM</span>}
  </button>;
}
