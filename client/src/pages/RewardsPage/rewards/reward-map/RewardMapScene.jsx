import React, { useMemo } from "react";
import { Sparkles, Compass, MapPin } from "lucide-react";

import { rewardMapAssets as assets } from "./rewardMapAssets";

import { getMilestoneStatusLabel, isCompletedStatus } from "./rewardMapUtils";

import RewardCheckpoint from "./RewardCheckpoint";
import RewardMapLegend from "./RewardMapLegend";

import styles from "./RewardMapScene.module.css";

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value ?? "locked")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function getMilestoneId(milestone, index = 0) {
  return String(milestone?.id ?? milestone?._id ?? `milestone-${index + 1}`);
}

/* =========================================================
   CHECKPOINT POSITIONS
========================================================= */

/**
 * Creates a zig-zag journey path.
 *
 * Checkpoints alternate left and right so that the route
 * looks like a journey rather than a straight column.
 */
function getPositions(total, compact = false) {
  if (!total) return [];

  if (total === 1) {
    return [{ x: 50, y: 50 }];
  }

  const left = compact ? 31 : 28;
  const right = compact ? 69 : 72;

  const top = compact ? 17 : 13;
  const bottom = compact ? 83 : 87;

  return Array.from({ length: total }, (_, index) => {
    const progress = index / (total - 1);

    return {
      x: index % 2 === 0 ? left : right,
      y: top + (bottom - top) * progress,
    };
  });
}

/* =========================================================
   ROUTE CURVE
========================================================= */

function createRoutePath(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];

    return `M ${point.x} ${point.y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    const middleY = (previous.y + current.y) / 2;

    path +=
      ` C ${previous.x} ${middleY},` +
      ` ${current.x} ${middleY},` +
      ` ${current.x} ${current.y}`;
  }

  return path;
}

/* =========================================================
   SAFE DECORATIVE IMAGE
========================================================= */

function SceneImage({ src, className, alt = "" }) {
  if (!src) return null;

  return (
    <img
      src={src}
      className={className}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable="false"
      loading="lazy"
      decoding="async"
      onError={(event) => {
        // Hide only the failed decorative asset.
        // The map canvas continues to display its CSS background.
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

/* =========================================================
   REWARD MAP SCENE
========================================================= */

export default function RewardMapScene({
  milestones = [],
  selectedMilestoneId = null,
  onSelect,
  compact = false,
}) {
  /* -------------------------------------------------------
     NORMALIZE LIST
  ------------------------------------------------------- */

  const list = useMemo(() => {
    if (!Array.isArray(milestones)) return [];

    return milestones
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        ...item,
        id: getMilestoneId(item, index),
      }));
  }, [milestones]);

  /* -------------------------------------------------------
     CHECKPOINT POSITIONS
  ------------------------------------------------------- */

  const positions = useMemo(
    () => getPositions(list.length, compact),
    [list.length, compact],
  );

  /* -------------------------------------------------------
     ROUTE PATH
  ------------------------------------------------------- */

  const route = useMemo(() => createRoutePath(positions), [positions]);

  /* -------------------------------------------------------
     HEIGHT CALCULATION
  ------------------------------------------------------- */

  const mapHeight = useMemo(() => {
    if (!list.length) {
      return compact ? 300 : 620;
    }

    if (compact) {
      return Math.max(300, (list.length - 1) * 100 + 210);
    }

    // Every checkpoint receives sufficient vertical space.
    // This prevents checkpoint cards from overlapping when
    // an intern has many attendance records.
    return Math.max(650, (list.length - 1) * 155 + 260);
  }, [list.length, compact]);

  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const completedCount = useMemo(
    () =>
      list.filter((milestone) =>
        isCompletedStatus(milestone.visualState ?? milestone.status),
      ).length,
    [list],
  );

  const progress = list.length
    ? Math.round((completedCount / list.length) * 100)
    : 0;

  /* -------------------------------------------------------
     SELECTED CHECKPOINT
  ------------------------------------------------------- */

  const selectedId =
    selectedMilestoneId === null || selectedMilestoneId === undefined
      ? null
      : String(selectedMilestoneId);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div
      className={[styles.scene, compact ? styles.compact : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: `${mapHeight}px`,
        minHeight: `${mapHeight}px`,
      }}
      data-reward-map-canvas
      role="group"
      aria-label="Interactive InternCash reward journey map"
    >
      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className={styles.baseLandscape} aria-hidden="true">
        <span className={styles.hillOne} />
        <span className={styles.hillTwo} />
        <span className={styles.hillThree} />
      </div>

      <SceneImage
        src={assets.backgrounds.default}
        className={styles.background}
      />

      <div className={styles.wash} aria-hidden="true" />

      {/* =================================================
          MAP BRAND
      ================================================= */}

      <div className={styles.topChip}>
        <span className={styles.topChipIcon}>
          <Sparkles size={13} />
        </span>

        <strong>InternCash</strong>

        <span className={styles.topChipDivider} />

        <span>Reward world</span>
      </div>

      {/* =================================================
          PROGRESS CHIP
      ================================================= */}

      {!compact && (
        <div
          className={styles.progressChip}
          aria-label={`${completedCount} of ${list.length} checkpoints completed`}
        >
          <span className={styles.progressIcon}>
            <Compass size={13} />
          </span>

          <span>
            <strong>
              {completedCount}/{list.length}
            </strong>

            <small>Completed</small>
          </span>

          <span className={styles.progressPercent}>{progress}%</span>
        </div>
      )}

      {/* =================================================
          DECORATIVE ASSETS
      ================================================= */}

      <SceneImage
        src={assets.clouds.wideFloating}
        className={`${styles.cloud} ${styles.cloudA}`}
      />

      <SceneImage
        src={assets.clouds.lavenderSwirl}
        className={`${styles.cloud} ${styles.cloudB}`}
      />

      <SceneImage
        src={assets.decorations.magicalPortal}
        className={styles.portal}
      />

      <SceneImage
        src={assets.decorations.grassShrubStoneCluster}
        className={`${styles.flora} ${styles.floraLeft}`}
      />

      <SceneImage
        src={assets.decorations.pinkFlowerShrubCluster}
        className={`${styles.flora} ${styles.floraRight}`}
      />

      <SceneImage
        src={assets.decorations.tropicalPalmStoneCluster}
        className={`${styles.flora} ${styles.floraBottom}`}
      />

      {/* =================================================
          ROUTE
      ================================================= */}

      <svg
        className={styles.route}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Path connecting your reward checkpoints"
      >
        <defs>
          <linearGradient
            id="reward-route-gradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#e4b34d" />

            <stop offset="50%" stopColor="#cf983f" />

            <stop offset="100%" stopColor="#70aa76" />
          </linearGradient>
        </defs>

        {route && (
          <>
            <path d={route} className={styles.routeShadow} />

            <path d={route} className={styles.routeHalo} />

            <path d={route} className={styles.routeLine} />
          </>
        )}

        {positions.map((point, index) => (
          <circle
            key={`route-point-${index}`}
            cx={point.x}
            cy={point.y}
            r="1.05"
            className={styles.routeDot}
          />
        ))}
      </svg>

      {/* =================================================
          CHECKPOINTS
      ================================================= */}

      {list.map((milestone, index) => {
        const position = positions[index];

        const selected = selectedId === String(milestone.id);

        const status = normalize(milestone.visualState ?? milestone.status);

        return (
          <React.Fragment key={milestone.id}>
            <RewardCheckpoint
              milestone={milestone}
              index={index}
              selected={selected}
              position={position}
              onSelect={onSelect}
            />

            {/* Position label */}

            <span
              className={[
                styles.checkpointNumber,
                index % 2 === 0 ? styles.numberLeft : styles.numberRight,
                selected ? styles.numberSelected : "",
                status === "completed" ||
                status === "approved" ||
                status === "credited"
                  ? styles.numberCompleted
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden="true"
              style={{
                top: `${position.y}%`,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </React.Fragment>
        );
      })}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {list.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <MapPin size={25} />
          </span>

          <strong>Your reward journey is waiting</strong>

          <p>
            Your checkpoints will appear here as attendance and wallet records
            become available.
          </p>
        </div>
      )}

      {/* =================================================
          MAP LEGEND
      ================================================= */}

      {/* {!compact && (
        <div className={styles.legend}>
          <RewardMapLegend />
        </div>
      )} */}

      {/* =================================================
          COMPACT FOOTER
      ================================================= */}

      {compact && (
        <div className={styles.compactFooter}>
          <Sparkles size={12} />
          {completedCount} of {list.length} checkpoints completed
        </div>
      )}
    </div>
  );
}
