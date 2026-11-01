/* =========================================================
   VELOOP REWARDS — REWARD WORLD ASSET REGISTRY

   Expected public folder:

   public/
     assets/
       reward-map/
         backgrounds/
         chests/
         checkpoints/
         environment/
         clouds/
         effects/
         ui/

   Files placed in Vite's public folder are served from
   the application base URL.
========================================================= */

/* ---------------------------------------------------------
   BASE PATH
--------------------------------------------------------- */

// Vite BASE_URL normally ends with a slash.
// Remove trailing slashes to avoid double separators.
const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");

const root = `${baseUrl}/assets/reward-map`;

/* ---------------------------------------------------------
   PATH BUILDER
--------------------------------------------------------- */

const file = (group, name) => `${root}/${group}/${name}`;

/* =========================================================
   ASSET REGISTRY
========================================================= */

export const rewardMapAssets = {
  /* -------------------------------------------------------
     BACKGROUNDS
  ------------------------------------------------------- */

  backgrounds: {
    default: file("backgrounds", "prompt-A.png"),

    journeyBeginning: file("backgrounds", "1-journey-beginning.png"),

    attendanceTrail: file("backgrounds", "2-attendance-trail.png"),

    consistencyValley: file("backgrounds", "3-consistency-valley.png"),

    projectTreasureIsland: file("backgrounds", "4-project-treasure-island.png"),
  },

  /* -------------------------------------------------------
     TREASURE CHESTS
  ------------------------------------------------------- */

  chests: {
    closed: file("chests", "1-closed-wooden-treasure-chest.png"),

    open: file("chests", "2-open-wooden-treasure-chest.png"),
  },

  /* -------------------------------------------------------
     CHECKPOINTS
  ------------------------------------------------------- */

  checkpoints: {
    stonePlatform: file(
      "checkpoints",
      "3-rounded-stone-milestone-platform.png",
    ),

    goldenStar: file("checkpoints", "5-small-golden-star-reward-token.png"),

    pendingReview: file("checkpoints", "6-amber-pending-review-marker.png"),

    lockedToken: file(
      "checkpoints",
      "7-silver-purple-locked-milestone-token.png",
    ),

    claimable: file("checkpoints", "checkpoint-claimable.png"),

    // Compatibility aliases used by previous components.
    completed: file("checkpoints", "5-small-golden-star-reward-token.png"),

    pending: file("checkpoints", "6-amber-pending-review-marker.png"),

    locked: file("checkpoints", "7-silver-purple-locked-milestone-token.png"),
  },

  /* -------------------------------------------------------
     ENVIRONMENT DECORATIONS
  ------------------------------------------------------- */

  decorations: {
    magicalPortal: file("environment", "4-violet-turquoise-magical-portal.png"),

    woodenBridge: file("environment", "9-small-wooden-bridge-section.png"),

    grassShrubStoneCluster: file(
      "environment",
      "10-decorative-grass-shrub-stone-cluster.png",
    ),

    pinkFlowerShrubCluster: file(
      "environment",
      "11-decorative-pink-flower-shrub-cluster.png",
    ),

    tropicalPalmStoneCluster: file(
      "environment",
      "12-tropical-palm-stone-cluster.png",
    ),
  },

  /* -------------------------------------------------------
     CLOUDS
  ------------------------------------------------------- */

  clouds: {
    wideFloating: file("clouds", "1-wide-floating-cloud.png"),

    layeredLavender: file("clouds", "2-layered-lavender-cloud.png"),

    roundedFantasy: file("clouds", "3-rounded-fantasy-cloud.png"),

    lavenderSwirl: file("clouds", "4-lavender-swirl-cloud.png"),

    creamLavenderFantasy: file("clouds", "5-cream-lavender-fantasy-cloud.png"),

    softWhiteFloating: file("clouds", "8-soft-white-floating-cloud.png"),
  },

  /* -------------------------------------------------------
     VISUAL EFFECTS
  ------------------------------------------------------- */

  effects: {
    confetti: file("effects", "1-golden-confetti-burst.png"),

    sparkles: file("effects", "2-reward-sparkles.png"),

    coinTrail: file("effects", "3-coin-trail.png"),

    chestUnlockGlow: file("effects", "4-chest-unlock-glow.png"),

    completionRing: file("effects", "5-Milestone-Completion-Ring.png"),

    softRewardAura: file("effects", "6-soft-reward-aura.png"),

    projectCelebration: file("effects", "7-project-completion-celebration.png"),
  },

  /* -------------------------------------------------------
     UI ASSETS
  ------------------------------------------------------- */

  ui: {
    promptC: file("ui", "prompt-C.png"),

    promptH: file("ui", "prompt-H.png"),

    detailFrame: file("ui", "prompt-C.png"),
  },
};

/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

export const REWARD_MAP_ASSETS = rewardMapAssets;

/* =========================================================
   ASSET FALLBACK HELPER
========================================================= */

export const getRewardMapAsset = (primary, fallback = "") => {
  return primary || fallback || "";
};

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default rewardMapAssets;
