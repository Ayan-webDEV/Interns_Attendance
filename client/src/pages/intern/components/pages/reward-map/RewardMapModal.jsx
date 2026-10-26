import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  Gift,
  Map,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { rewardMapAssets as assets } from "./rewardMapAssets.js";
import {
  formatDate,
  formatIC,
  getMilestoneStatusLabel,
  isCompletedStatus,
} from "./rewardMapUtils.js";
import RewardMapScene from "./RewardMapScene.jsx";
import "./RewardMapModal.css";

const statusOf = (milestone) =>
  String(milestone?.status ?? "locked")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function statusIcon(status) {
  if (isCompletedStatus(status)) return <Check size={15} />;
  if (status === "pending") return <Clock3 size={15} />;
  if (status === "claimable") return <Gift size={15} />;
  return <CircleHelp size={15} />;
}

function rewardText(milestone) {
  const reward = milestone?.reward ?? {};

  if (reward.status === "credited") {
    return reward.amount != null
      ? `${formatIC(reward.amount, reward.currency)} credited`
      : "Reward credited";
  }

  if (reward.status === "pending") {
    return reward.amount != null
      ? `${formatIC(reward.amount, reward.currency)} pending`
      : "Awaiting review";
  }

  if (reward.minAmount != null && reward.maxAmount != null) {
    return `${reward.minAmount}–${reward.maxAmount} ${reward.currency ?? "IC"}`;
  }

  return reward.amount != null
    ? formatIC(reward.amount, reward.currency)
    : "Reward details depend on eligibility";
}

function getCheckpointArt(status) {
  if (status === "pending") return assets.checkpoints.pendingReview;

  if (["locked", "rejected"].includes(status)) {
    return assets.checkpoints.lockedToken;
  }

  if (status === "claimable") return assets.checkpoints.claimable;

  return assets.checkpoints.goldenStar;
}

function ShieldIcon() {
  return (
    <span className="reward-map-modal__shield" aria-hidden="true">
      ✓
    </span>
  );
}

export default function RewardMapModal({
  open = false,
  milestones = [],
  loading = false,
  error = "",
  onClose,
  onRefresh,
  initialMilestone = null,
}) {
  const list = useMemo(
    () => (Array.isArray(milestones) ? milestones : []),
    [milestones],
  );

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!open) return;

    setSelectedId(
      initialMilestone?.id != null ? String(initialMilestone.id) : null,
    );
  }, [open, initialMilestone?.id]);

  // Lock background scrolling and support Escape / arrow-key navigation.
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) ||
        event.target?.isContentEditable
      ) {
        return;
      }

      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      if (!list.length) return;

      event.preventDefault();

      setSelectedId((current) => {
        const currentIndex = list.findIndex(
          (milestone) => String(milestone.id) === String(current),
        );

        const startIndex = currentIndex < 0 ? 0 : currentIndex;

        const nextIndex =
          event.key === "ArrowRight"
            ? Math.min(startIndex + 1, list.length - 1)
            : Math.max(startIndex - 1, 0);

        const nextMilestone = list[nextIndex];

        return nextMilestone?.id != null ? String(nextMilestone.id) : null;
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, list]);

  const selectedIndex = list.findIndex(
    (milestone) => String(milestone.id) === String(selectedId),
  );

  const selected = selectedIndex >= 0 ? list[selectedIndex] : null;

  useEffect(() => {
    if (!open || !selected?.id) return;

    const selector = `[data-reward-checkpoint="${CSS.escape(
      String(selected.id),
    )}"]`;

    document.querySelector(selector)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [open, selected?.id]);

  if (!open || typeof document === "undefined") return null;

  const completed = list.filter((milestone) =>
    isCompletedStatus(statusOf(milestone)),
  ).length;

  const progress = list.length
    ? Math.round((completed / list.length) * 100)
    : 0;

  const selectIndex = (index) => {
    const milestone = list[index];

    setSelectedId(milestone?.id != null ? String(milestone.id) : null);
  };

  const state = statusOf(selected);
  const art = getCheckpointArt(state);

  return createPortal(
    <div
      className="reward-map-modal"
      role="dialog"
      aria-modal="true"
      aria-label="InternCash reward journey"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="reward-map-modal__window"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="reward-map-modal__topbar">
          <button
            className="reward-map-modal__back"
            type="button"
            onClick={onClose}
          >
            <ArrowLeft size={17} />
            <span>Back to Rewards</span>
          </button>

          <div className="reward-map-modal__title">
            <span>
              <Map size={14} />
              INTERN CASH ADVENTURE
            </span>
            <h2>Your Reward Journey</h2>
            <p>Explore checkpoints and follow your reward progress.</p>
          </div>

          <div className="reward-map-modal__top-actions">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh map"
              title="Refresh map"
            >
              <RefreshCw
                size={17}
                className={loading ? "reward-map-modal__spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close map"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Progress */}
        <section
          className="reward-map-modal__progress"
          aria-label="Journey progress"
        >
          <div className="reward-map-modal__progress-top">
            <span>Journey completion</span>
            <strong>{progress}%</strong>
          </div>

          <div
            className="reward-map-modal__progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Reward journey completion"
          >
            <i style={{ width: `${progress}%` }} />
          </div>

          <small>
            {completed} of {list.length} checkpoints completed
          </small>
        </section>

        {error && (
          <div className="reward-map-modal__notice" role="status">
            <CircleHelp size={16} />
            <span>{typeof error === "string" ? error : error.message}</span>
          </div>
        )}

        {/* Main content */}
        <main className="reward-map-modal__content">
          <section
            className="reward-map-modal__map-panel"
            aria-label="Interactive reward map"
          >
            {loading && !list.length ? (
              <div className="reward-map-modal__empty">
                <span className="reward-map-modal__loader" />
                <strong>Preparing your reward world…</strong>
              </div>
            ) : list.length ? (
              <RewardMapScene
                milestones={list}
                selectedMilestoneId={selected?.id ?? null}
                onSelect={(milestone) => {
                  if (milestone?.id != null) {
                    setSelectedId(String(milestone.id));
                  }
                }}
              />
            ) : (
              <div className="reward-map-modal__empty">
                <Map size={32} />
                <strong>Your journey is waiting</strong>
                <p>
                  Reward checkpoints will appear here when records are
                  available.
                </p>
              </div>
            )}
          </section>

          {/* Checkpoint details */}
          <aside className="reward-map-modal__details">
            {selected ? (
              <>
                <span className="reward-map-modal__step">
                  CHECKPOINT {selectedIndex + 1} OF {list.length}
                </span>

                <div className="reward-map-modal__reward-art">
                  <img src={art} alt="" />

                  <span
                    className={`reward-map-modal__status reward-map-modal__status--${state}`}
                  >
                    {statusIcon(state)}
                    {getMilestoneStatusLabel(state)}
                  </span>
                </div>

                <h3>{selected.title}</h3>

                <p className="reward-map-modal__description">
                  {selected.description ||
                    "Keep progressing through your internship journey to unlock more milestones."}
                </p>

                <div className="reward-map-modal__reward-box">
                  <span>
                    <Coins size={19} />
                  </span>

                  <div>
                    <small>REWARD STATUS</small>
                    <strong>{rewardText(selected)}</strong>
                  </div>
                </div>

                {selected.date && (
                  <div className="reward-map-modal__date">
                    <Clock3 size={15} />
                    <span>Milestone date: {formatDate(selected.date)}</span>
                  </div>
                )}

                <div className="reward-map-modal__requirements">
                  <h4>Checkpoint requirements</h4>

                  {selected.requirements?.length ? (
                    <ul>
                      {selected.requirements.map((requirement, index) => (
                        <li key={`${index}-${requirement}`}>
                          <Check size={14} />
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Requirements have not been provided by the reward data.
                    </p>
                  )}
                </div>

                <div className="reward-map-modal__navigation">
                  <button
                    type="button"
                    onClick={() => selectIndex(selectedIndex - 1)}
                    disabled={selectedIndex <= 0}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <span>
                    {selectedIndex + 1} / {list.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => selectIndex(selectedIndex + 1)}
                    disabled={selectedIndex >= list.length - 1}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="reward-map-modal__first-step">
                <span className="reward-map-modal__first-icon">
                  <Trophy size={25} />
                </span>

                <h3>Choose your next checkpoint</h3>

                <p>
                  Select any reward marker on the map to view its status,
                  requirements, and reward information.
                </p>

                {list.length > 0 && (
                  <button
                    type="button"
                    className="reward-map-modal__explore"
                    onClick={() => selectIndex(0)}
                  >
                    <Sparkles size={16} />
                    <span>Explore first checkpoint</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}

            <div className="reward-map-modal__disclaimer">
              <ShieldIcon />
              <p>
                Reward eligibility and crediting depend on verified records and
                applicable VELoop Rewards policies. This map does not itself
                issue wallet rewards.
              </p>
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="reward-map-modal__footer">
          <span>
            <Sparkles size={14} />
            Every milestone moves your journey forward.
          </span>

          <button type="button" onClick={onClose}>
            <ArrowLeft size={15} />
            Return to Wallet
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
