import React from "react";
import { Map, RefreshCw, X, Sparkles } from "lucide-react";

export default function RewardMapHeader({ progress = 0, completed = 0, total = 0, loading = false, onRefresh, onClose }) {
  return <header className="reward-map-header">
    <div className="reward-map-header-title"><span className="reward-map-header-icon"><Map size={21} /></span><div><span className="reward-map-kicker"><Sparkles size={12} /> YOUR REWARD ADVENTURE</span><h2 id="reward-map-title">InternCash Journey</h2><p>One milestone at a time. Every step counts.</p></div></div>
    <div className="reward-map-header-actions"><div className="reward-map-progress-summary"><strong>{Math.round(progress)}%</strong><span>{completed} of {total} completed</span></div><button type="button" className="reward-map-icon-button" onClick={onRefresh} disabled={loading} aria-label="Refresh reward map"><RefreshCw size={17} className={loading ? "reward-spin" : ""} /></button><button type="button" className="reward-map-icon-button" onClick={onClose} aria-label="Close reward map"><X size={18} /></button></div>
  </header>;
}
