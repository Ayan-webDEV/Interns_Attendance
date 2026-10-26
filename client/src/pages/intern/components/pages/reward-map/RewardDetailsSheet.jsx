import React, { useEffect } from "react";
import { CalendarDays, CheckCircle2, Clock3, Gift, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { rewardMapAssets } from "./rewardMapAssets.js";
import { formatDate, formatIC } from "./rewardMapUtils.js";

const copy = {
  completed: { title: "Milestone completed", description: "This milestone is marked as completed.", icon: CheckCircle2 },
  pending: { title: "Awaiting review", description: "This milestone is awaiting review.", icon: Clock3 },
  claimable: { title: "Reward available", description: "The reward is marked as available by the reward data.", icon: Gift },
  locked: { title: "Upcoming milestone", description: "Review the requirements to see what comes next.", icon: LockKeyhole },
};
export default function RewardDetailsSheet({ milestone, onClose, onClaim, claiming = false }) {
  useEffect(() => {
    if (!milestone) return undefined;
    const keydown = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [milestone, onClose]);
  if (!milestone) return null;
  const state = milestone.visualState || milestone.status || "locked";
  const status = copy[state] ? state : "locked";
  const info = copy[status];
  const Icon = info.icon;
  const reward = milestone.reward || {};
  const amount = milestone.amount ?? reward.amount;
  const requirements = Array.isArray(milestone.requirements) ? milestone.requirements : [];
  const art = status === "claimable" ? rewardMapAssets.chests.open : status === "completed" ? rewardMapAssets.checkpoints.goldenStar : status === "pending" ? rewardMapAssets.checkpoints.pendingReview : rewardMapAssets.checkpoints.lockedToken;
  const canClaim = status === "claimable" && typeof onClaim === "function";
  return <div className="reward-details-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}><section className="reward-details-sheet" role="dialog" aria-modal="true" aria-labelledby="reward-details-title">
    <div className="reward-details-top"><button type="button" className="reward-map-icon-button reward-details-close" onClick={onClose} aria-label="Close reward details"><X size={18} /></button><div className="reward-details-art"><img src={art} alt="" /></div><span className={`reward-details-state is-${status}`}><Icon size={14} />{info.title}</span><h3 id="reward-details-title">{milestone.title}</h3><p>{milestone.description || info.description}</p></div>
    <div className="reward-details-content"><div className="reward-details-amount"><span>Reward amount</span><strong>{milestone.type === "project" && reward.minAmount != null && reward.maxAmount != null ? `${reward.minAmount}–${reward.maxAmount} IC` : formatIC(amount)}</strong>{milestone.type === "project" && <small>Reward amount depends on the applicable admin-issued promo code and reward rules.</small>}{amount != null && reward.status === "credited" && <small><CheckCircle2 size={13} /> Recorded as credited</small>}</div>
      {milestone.date && <div className="reward-details-date"><CalendarDays size={16} /><span>{formatDate(milestone.date)}</span></div>}<h4>Requirements</h4>
      {requirements.length ? <ul className="reward-details-requirements">{requirements.map((r, i) => <li key={`${i}-${r}`}><span className="reward-requirement-bullet"><CheckCircle2 size={15} /></span><span>{r}</span></li>)}</ul> : <p className="reward-details-muted">Requirements have not been provided by the reward data.</p>}
      {reward.transactionId && <div className="reward-details-reference"><ShieldCheck size={15} />Transaction reference: {reward.transactionId}</div>}
      {canClaim && <button type="button" className="reward-map-primary-button" disabled={claiming} onClick={() => onClaim(milestone)}><Gift size={17} />{claiming ? "Processing…" : "Claim reward"}</button>}
      {status === "pending" && <div className="reward-details-notice is-pending"><Clock3 size={16} />This reward is pending review and is not confirmed as credited to your wallet.</div>}
      {status === "locked" && <div className="reward-details-notice"><LockKeyhole size={16} />This milestone is not currently marked as claimable.</div>}
      {status === "completed" && reward.status !== "credited" && <div className="reward-details-notice"><ShieldCheck size={16} />Completion status alone does not confirm a wallet credit. Check the transaction record.</div>}
    </div>
  </section></div>;
}
