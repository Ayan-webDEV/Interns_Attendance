import React, { useEffect, useState } from "react";
import { rewardMapAssets } from "./rewardMapAssets.js";
import { Sparkles } from "lucide-react";
export default function RewardCelebration({ active, amount, title = "Reward unlocked!", onComplete }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!active) { setVisible(false); return undefined; }
    setVisible(true);
    const timer = window.setTimeout(() => { setVisible(false); onComplete?.(); }, 2200);
    return () => window.clearTimeout(timer);
  }, [active, onComplete]);
  if (!visible) return null;
  return <div className="reward-celebration" role="status" aria-live="polite"><img className="reward-celebration-confetti" src={rewardMapAssets.effects.confetti} alt="" /><img className="reward-celebration-sparkles" src={rewardMapAssets.effects.sparkles} alt="" /><div className="reward-celebration-card"><Sparkles size={20} /><img src={rewardMapAssets.chests.open} alt="" /><p>{title}</p>{amount !== null && amount !== undefined && <strong>+{Number(amount).toLocaleString("en-IN")} IC</strong>}</div></div>;
}
