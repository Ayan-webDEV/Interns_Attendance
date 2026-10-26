import React from "react";
import { CheckCircle2, Clock3, Gift, LockKeyhole } from "lucide-react";
const STATES = [
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "pending", label: "In review", icon: Clock3 },
  { id: "locked", label: "Upcoming", icon: LockKeyhole },
  { id: "claimable", label: "Ready", icon: Gift },
];
export default function RewardMapLegend() {
  return <div className="reward-map-legend" aria-label="Reward checkpoint status legend">{STATES.map(({ id, label, icon: Icon }) => <span className={`reward-map-legend-item is-${id}`} key={id}><Icon size={13} aria-hidden="true" />{label}</span>)}</div>;
}
