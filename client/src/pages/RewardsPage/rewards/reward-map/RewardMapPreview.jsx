import React, { useMemo, useState, useCallback } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Gift,
  Sparkles,
  Trophy,
  Map,
  LockKeyhole,
  Clock3,
} from "lucide-react";

import { rewardMapAssets } from "./rewardMapAssets";

import {
  getMilestoneStatusLabel,
  getMilestoneRewardLabel,
  isCompletedStatus,
} from "./rewardMapUtils";

import styles from "./RewardMapPreview.module.css";

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getMilestoneImage(milestone) {
  const status = normalize(milestone?.status ?? milestone?.visualState);

  if (status === "pending") {
    return rewardMapAssets.checkpoints.pendingReview;
  }

  if (status === "claimable") {
    return rewardMapAssets.checkpoints.claimable;
  }

  if (
    status === "credited" ||
    status === "completed" ||
    status === "approved"
  ) {
    return rewardMapAssets.checkpoints.goldenStar;
  }

  return rewardMapAssets.checkpoints.lockedToken;
}

function getMilestoneIcon(status) {
  const value = normalize(status);

  if (value === "pending") return Clock3;

  if (value === "completed" || value === "approved" || value === "credited") {
    return CheckCircle2;
  }

  return LockKeyhole;
}

/* =========================================================
   REWARD MAP PREVIEW
========================================================= */

export default function RewardMapPreview({
  milestones = [],
  loading = false,
  onSelect,
  onExplore,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const [backgroundFailed, setBackgroundFailed] = useState(false);

  const [failedFeaturedImage, setFailedFeaturedImage] = useState("");

  const list = Array.isArray(milestones)
    ? milestones.filter((item) => item && typeof item === "object")
    : [];

  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const completed = useMemo(
    () =>
      list.filter((milestone) =>
        isCompletedStatus(milestone.visualState ?? milestone.status),
      ).length,
    [list],
  );

  const total = list.length;

  const progress = total ? Math.round((completed / total) * 100) : 0;

  const visible = list.slice(0, 5);

  const safeActiveIndex =
    visible.length > 0 ? Math.min(activeIndex, visible.length - 1) : 0;

  const featured =
    visible[safeActiveIndex] ??
    list.find((item) => !isCompletedStatus(item.visualState ?? item.status)) ??
    list[0] ??
    null;

  /* -------------------------------------------------------
     FEATURED IMAGE
  ------------------------------------------------------- */

  const featuredImage = featured ? getMilestoneImage(featured) : "";

  const canShowFeaturedImage =
    Boolean(featuredImage) && featuredImage !== failedFeaturedImage;

  /* -------------------------------------------------------
     CHECKPOINT SELECTION
  ------------------------------------------------------- */

  const handleSelect = useCallback(
    (milestone, index) => {
      setActiveIndex(index);
      onSelect?.(milestone);
    },
    [onSelect],
  );

  const handleExplore = useCallback(() => {
    onExplore?.();
  }, [onExplore]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="reward-map-preview"
      className={styles.preview}
      aria-labelledby="reward-map-preview-title"
    >
      {/* Background glow */}

      <div className={styles.glow} aria-hidden="true" />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className={styles.header}>
        <div className={styles.brandIcon}>
          <Compass size={23} />
        </div>

        <div className={styles.heading}>
          <span>
            <Sparkles size={13} />
            YOUR REWARD WORLD
          </span>

          <h2 id="reward-map-preview-title">
            Every milestone brings you closer.
          </h2>

          <p>
            Explore your internship journey, follow your attendance checkpoints
            and keep track of your reward progress.
          </p>
        </div>

        <div
          className={styles.trophy}
          aria-label={`${progress}% journey progress`}
        >
          <Trophy size={21} />

          <span>{progress}%</span>

          <small>PROGRESS</small>
        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className={styles.main}>
        {/* ===============================================
            MAP CANVAS
        =============================================== */}

        <div className={styles.miniMap}>
          {!backgroundFailed && (
            <img
              src={rewardMapAssets.backgrounds.default}
              className={styles.mapBackground}
              alt=""
              aria-hidden="true"
              onError={() => setBackgroundFailed(true)}
            />
          )}

          <div className={styles.mapWash} aria-hidden="true" />

          {/* Map badge */}

          <div className={styles.mapBadge}>
            <span />
            REWARD JOURNEY
          </div>

          {/* Progress counter */}

          <div className={styles.mapProgress}>
            <span>Completed checkpoints</span>

            <strong>
              {completed}/{total}
            </strong>
          </div>

          {/* Decorative trail */}

          <div className={styles.trail} aria-hidden="true" />

          {/* Checkpoint list */}

          <div className={styles.mapChips}>
            {visible.map((milestone, index) => {
              const status = milestone.visualState ?? milestone.status;

              const selected = String(featured?.id) === String(milestone.id);

              const Icon = getMilestoneIcon(status);

              const isCompleted = isCompletedStatus(status);

              return (
                <button
                  key={milestone.id ?? index}
                  type="button"
                  onClick={() => handleSelect(milestone, index)}
                  className={[
                    styles.mapChip,
                    selected ? styles.mapChipActive : "",
                    isCompleted ? styles.mapChipCompleted : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    "--chip-index": index,
                  }}
                  aria-pressed={selected}
                  aria-label={`Checkpoint ${index + 1}: ${milestone.title}. ${getMilestoneStatusLabel(status)}. Open details.`}
                >
                  <span>
                    <Icon size={13} />
                  </span>

                  <strong>{milestone.title}</strong>

                  {selected && (
                    <span className={styles.selectedMarker}>
                      <CheckCircle2 size={13} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Empty journey */}

          {!loading && visible.length === 0 && (
            <div className={styles.mapEmpty}>
              <span>
                <Map size={24} />
              </span>

              <strong>Your journey begins here</strong>

              <p>
                Your reward checkpoints will appear as your internship records
                become available.
              </p>
            </div>
          )}

          {/* Bottom note */}

          <div className={styles.mapFooter}>
            <span>
              <span className={styles.liveDot} />
              Checkpoints update with your records
            </span>
          </div>
        </div>

        {/* ===============================================
            FEATURED CHECKPOINT
        =============================================== */}

        <aside className={styles.featured} aria-live="polite">
          <div className={styles.featuredTop}>
            <span className={styles.featuredLabel}>SELECTED CHECKPOINT</span>

            <span className={styles.featuredIcon}>
              <Gift size={17} />
            </span>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <span className={styles.loadingSpinner}>
                <Sparkles size={19} />
              </span>

              <span>Preparing your reward journey...</span>
            </div>
          ) : featured ? (
            <>
              {/* Featured artwork */}

              <span className={styles.featuredArt}>
                {canShowFeaturedImage ? (
                  <img
                    src={featuredImage}
                    alt=""
                    aria-hidden="true"
                    onError={() => setFailedFeaturedImage(featuredImage)}
                  />
                ) : (
                  <span className={styles.artFallback}>
                    <Gift size={30} />
                  </span>
                )}
              </span>

              {/* Checkpoint details */}

              <h3>{featured.title}</h3>

              <p>
                {featured.description ||
                  "Continue your internship journey to unlock this milestone."}
              </p>

              <span className={styles.featuredStatus}>
                {getMilestoneStatusLabel(
                  featured.visualState ?? featured.status,
                )}
              </span>

              {/* Reward information */}

              <div className={styles.rewardLabel}>
                <span>Reward information</span>

                <strong>{getMilestoneRewardLabel(featured)}</strong>
              </div>

              <button
                type="button"
                onClick={handleExplore}
                className={styles.explore}
              >
                Explore full journey
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <div className={styles.loading}>
              Your first reward checkpoint will appear here.
            </div>
          )}
        </aside>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className={styles.footer}>
        <span>
          <CheckCircle2 size={15} />
          {completed} of {total} milestones completed
        </span>

        <button type="button" onClick={handleExplore}>
          Open reward map
          <ArrowRight size={15} />
        </button>
      </footer>
    </section>
  );
}
