import React, { useMemo } from "react";
import { Check, Clock3, Gift, LockKeyhole, Sparkles } from "lucide-react";
import { rewardMapAssets as assets } from "./rewardMapAssets.js";
import { getMilestoneStatusLabel, isCompletedStatus } from "./rewardMapUtils.js";
import RewardMapLegend from "./RewardMapLegend.jsx";
import "./RewardMapScene.css";

const statusOf = (m) => String(m?.status ?? "locked").toLowerCase().replace(/[\s-]+/g, "_");
const statusAsset = (m) => {
  const status = statusOf(m);
  if (status === "pending") return assets.checkpoints.pendingReview;
  if (["locked", "rejected"].includes(status)) return assets.checkpoints.lockedToken;
  if (status === "claimable") return assets.checkpoints.claimable;
  return assets.checkpoints.goldenStar;
};
const iconFor = (status) => {
  if (isCompletedStatus(status)) return <Check size={14} />;
  if (status === "pending") return <Clock3 size={14} />;
  if (status === "claimable") return <Gift size={14} />;
  return <LockKeyhole size={14} />;
};

/** Deterministic alternating route positions; labels and route share these coordinates. */
function getPositions(total) {
  if (!total) return [];
  const usableTop = 13;
  const usableBottom = 80;
  return Array.from({ length: total }, (_, i) => {
    const t = total === 1 ? 0.5 : i / (total - 1);
    const side = i % 2 === 0 ? -1 : 1;
    const x = total === 1 ? 50 : 50 + side * (total > 5 ? 25 : 21);
    return { x, y: usableTop + (usableBottom - usableTop) * t };
  });
}
function curvePath(points, start) {
  const all = [start, ...points];
  if (all.length < 2) return "";
  let d = `M ${all[0].x} ${all[0].y}`;
  for (let i = 1; i < all.length; i += 1) {
    const a = all[i - 1];
    const b = all[i];
    const midY = (a.y + b.y) / 2;
    d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
  }
  return d;
}
function Image({ src, className, alt = "" }) {
  if (!src) return null;
  return <img src={src} className={className} alt={alt} aria-hidden={!alt} draggable="false" onError={(e) => { e.currentTarget.style.display = "none"; }} />;
}

export default function RewardMapScene({ milestones = [], selectedMilestoneId = null, onSelect, compact = false }) {
  const list = Array.isArray(milestones) ? milestones : [];
  const positions = useMemo(() => getPositions(list.length), [list.length]);
  // Start from the project treasure at the lower-right, then connect each reward in order.
  const start = { x: 50, y: 8 };
  const route = useMemo(() => curvePath(positions, start), [positions]);

  return (
    <div className={`reward-map-scene${compact ? " reward-map-scene--compact" : ""}`}>
      <Image src={assets.backgrounds.default} className="reward-map-scene__background" />
      <div className="reward-map-scene__wash" />
      <div className="reward-map-scene__top-chip"><Sparkles size={13} /> INTERN CASH <span>REWARD WORLD</span></div>
      <Image src={assets.clouds.wideFloating} className="reward-map-scene__cloud reward-map-scene__cloud--a" />
      <Image src={assets.clouds.lavenderSwirl} className="reward-map-scene__cloud reward-map-scene__cloud--b" />
      <Image src={assets.decorations.magicalPortal} className="reward-map-scene__portal" />
      <Image src={assets.decorations.grassShrubStoneCluster} className="reward-map-scene__flora reward-map-scene__flora--left" />
      <Image src={assets.decorations.pinkFlowerShrubCluster} className="reward-map-scene__flora reward-map-scene__flora--right" />

      <svg className="reward-map-scene__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="reward-map-scene__route-halo" d={route} />
        <path className="reward-map-scene__route-line" d={route} />
        {positions.map((p, i) => <circle key={`dot-${list[i]?.id ?? i}`} cx={p.x} cy={p.y} r="0.65" className="reward-map-scene__route-dot" />)}
      </svg>

      {list.map((milestone, index) => {
        const status = statusOf(milestone);
        const p = positions[index];
        const selected = String(milestone.id) === String(selectedMilestoneId);
        return (
          <button
            key={milestone.id ?? index}
            type="button"
            className={`reward-map-scene__node reward-map-scene__node--${status}${selected ? " is-selected" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            data-reward-checkpoint={String(milestone.id ?? index)}
            onClick={() => onSelect?.(milestone)}
            aria-pressed={selected}
            aria-label={`${milestone.title}: ${getMilestoneStatusLabel(status)}`}
            title={milestone.title}
          >
            <span className="reward-map-scene__node-art">
              <Image src={assets.checkpoints.stonePlatform} className="reward-map-scene__stone" />
              <Image src={statusAsset(milestone)} className="reward-map-scene__token" />
              <span className="reward-map-scene__node-status">{iconFor(status)}</span>
            </span>
            <span className="reward-map-scene__node-copy">
              <strong>{milestone.title || `Checkpoint ${index + 1}`}</strong>
              <small>{getMilestoneStatusLabel(status)}</small>
            </span>
          </button>
        );
      })}

      <div className="reward-map-scene__start" style={{ left: `${start.x}%`, top: `${start.y}%` }}>
        <Image src={assets.chests.closed} className="reward-map-scene__start-chest" />
        <span>Project Treasure</span><small>Journey starts here</small>
      </div>
      <div className="reward-map-scene__legend"><RewardMapLegend /></div>
    </div>
  );
}
