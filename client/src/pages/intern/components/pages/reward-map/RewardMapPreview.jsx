import React, { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Compass, Gift, Sparkles, Trophy } from "lucide-react";
import { rewardMapAssets as assets } from "./rewardMapAssets.js";
import { formatIC, getMilestoneStatusLabel, isCompletedStatus } from "./rewardMapUtils.js";
import "./rewardmappreview.css";

const statusOf = (m) => String(m?.status ?? "locked").toLowerCase().replace(/[\s-]+/g, "_");
function nodeAsset(m) {
  const status = statusOf(m);
  if (status === "pending") return assets.checkpoints.pendingReview;
  if (["locked", "rejected"].includes(status)) return assets.checkpoints.lockedToken;
  if (status === "claimable") return assets.checkpoints.claimable;
  return assets.checkpoints.goldenStar;
}
function rewardLabel(m) {
  const r = m?.reward ?? {};
  if (r.status === "credited") return r.amount != null ? `${formatIC(r.amount)} credited` : "Reward credited";
  if (r.status === "pending") return r.amount != null ? `${formatIC(r.amount)} pending` : "Awaiting review";
  if (r.minAmount != null && r.maxAmount != null) return `${r.minAmount}–${r.maxAmount} ${r.currency ?? "IC"}`;
  return r.amount != null ? formatIC(r.amount, r.currency ?? "IC") : "Milestone reward";
}

export default function RewardMapPreview({ milestones = [], loading = false, onSelect, onExplore }) {
  const list = useMemo(() => Array.isArray(milestones) ? milestones : [], [milestones]);
  const [activeIndex, setActiveIndex] = useState(0);
  const completed = list.filter((m) => isCompletedStatus(statusOf(m))).length;
  const progress = list.length ? Math.round(completed / list.length * 100) : 0;
  const nextMilestone = list.find((m) => !isCompletedStatus(statusOf(m))) ?? list[0] ?? null;
  const visible = list.slice(0, 5);
  const featured = visible[Math.min(activeIndex, Math.max(visible.length - 1, 0))] ?? nextMilestone;

  return (
    <section className="reward-map-preview" aria-labelledby="reward-map-preview-title">
      <div className="reward-map-preview__glow" aria-hidden="true" />
      <header className="reward-map-preview__header">
        <div className="reward-map-preview__brand-icon"><Compass size={23} /></div>
        <div className="reward-map-preview__heading">
          <span className="reward-map-preview__eyebrow"><Sparkles size={13} /> YOUR REWARD WORLD</span>
          <h2 id="reward-map-preview-title">Every milestone brings a reward.</h2>
          <p>Follow your internship journey, explore checkpoints, and keep your progress moving.</p>
        </div>
        <div className="reward-map-preview__trophy"><Trophy size={22} /><span>{progress}%</span></div>
      </header>

      <div className="reward-map-preview__main">
        <div className="reward-map-preview__mini-map">
          <img className="reward-map-preview__map-bg" src={assets.backgrounds.default} alt="" aria-hidden="true" />
          <div className="reward-map-preview__map-wash" />
          <div className="reward-map-preview__map-badge"><span /> LIVE JOURNEY MAP</div>
          <svg className="reward-map-preview__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 82 88 C 64 83, 32 78, 28 65 S 73 55, 74 43 S 32 34, 28 23 S 63 15, 51 10" className="reward-map-preview__route-halo" />
            <path d="M 82 88 C 64 83, 32 78, 28 65 S 73 55, 74 43 S 32 34, 28 23 S 63 15, 51 10" className="reward-map-preview__route-line" />
          </svg>
          {loading ? <div className="reward-map-preview__empty"><span className="reward-map-preview__spinner" /> Loading your journey…</div> : list.length === 0 ? (
            <div className="reward-map-preview__empty"><Compass size={28} /><strong>Your adventure starts here</strong><span>Milestones will appear when available.</span></div>
          ) : (
            <div className="reward-map-preview__nodes">
              {visible.map((m, i) => {
                const status = statusOf(m);
                const selected = String(m.id) === String(featured?.id);
                const x = [51, 27, 72, 34, 76][i];
                const y = [12, 31, 49, 68, 84][i];
                return <button key={m.id ?? i} type="button" className={`reward-map-preview__node reward-map-preview__node--${status}${selected ? " is-active" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => { setActiveIndex(i); onSelect?.(m); }} aria-label={`${m.title}: ${getMilestoneStatusLabel(status)}`} title={m.title}>
                  <span className="reward-map-preview__node-token"><img src={nodeAsset(m)} alt="" /><i>{isCompletedStatus(status) ? <CheckCircle2 size={13} /> : status === "claimable" ? <Gift size={13} /> : null}</i></span>
                  <span className="reward-map-preview__node-label">{m.title}</span>
                </button>;
              })}
            </div>
          )}
          <div className="reward-map-preview__treasure"><img src={assets.chests.closed} alt="" /><span>Project Treasure</span></div>
          {list.length > 5 && <span className="reward-map-preview__more">+{list.length - 5} more checkpoints in full map</span>}
        </div>

        <aside className="reward-map-preview__side-card">
          <div className="reward-map-preview__side-top"><span className="reward-map-preview__side-icon"><Gift size={18} /></span><span className="reward-map-preview__side-label">UP NEXT ON YOUR PATH</span></div>
          {featured ? <>
            <div className="reward-map-preview__featured-art"><img src={nodeAsset(featured)} alt="" /><span>{getMilestoneStatusLabel(statusOf(featured))}</span></div>
            <h3>{featured.title}</h3>
            <p>{featured.description || "Keep moving through your internship journey to unlock the next milestone."}</p>
            <div className="reward-map-preview__reward-value"><Sparkles size={16} /><span><small>POTENTIAL REWARD</small><strong>{rewardLabel(featured)}</strong></span></div>
            <button className="reward-map-preview__view-checkpoint" type="button" onClick={() => onSelect?.(featured)}>View checkpoint <ArrowRight size={16} /></button>
          </> : <div className="reward-map-preview__side-empty">Your next checkpoint will show here.</div>}
          <div className="reward-map-preview__progress-box">
            <div className="reward-map-preview__progress-heading"><span>Journey progress</span><strong>{progress}%</strong></div>
            <div className="reward-map-preview__progress-track" role="progressbar" aria-label="Reward journey progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            <small>{completed} of {list.length} milestones completed</small>
          </div>
        </aside>
      </div>
      <footer className="reward-map-preview__footer">
        <span><span className="reward-map-preview__footer-dot" /> Your progress is based on recorded milestone status.</span>
        <button type="button" onClick={onExplore}><Compass size={17} /> Explore Full Reward Map <ArrowRight size={17} /></button>
      </footer>
    </section>
  );
}
