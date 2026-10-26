/** VELoop InternCash reward-world asset registry. Public assets are served from /assets. */
const root = "/assets/reward-map";
const file = (group, name) => `${root}/${group}/${name}`;

export const rewardMapAssets = {
  backgrounds: {
    default: file("backgrounds", "prompt-A.png"),
    journeyBeginning: file("backgrounds", "1-journey-beginning.png"),
    attendanceTrail: file("backgrounds", "2-attendance-trail.png"),
    consistencyValley: file("backgrounds", "3-consistency-valley.png"),
    projectTreasureIsland: file("backgrounds", "4-project-treasure-island.png"),
  },
  chests: {
    closed: file("chests", "1-closed-wooden-treasure-chest.png"),
    open: file("chests", "2-open-wooden-treasure-chest.png"),
  },
  checkpoints: {
    stonePlatform: file("checkpoints", "3-rounded-stone-milestone-platform.png"),
    goldenStar: file("checkpoints", "5-small-golden-star-reward-token.png"),
    pendingReview: file("checkpoints", "6-amber-pending-review-marker.png"),
    lockedToken: file("checkpoints", "7-silver-purple-locked-milestone-token.png"),
    claimable: file("checkpoints", "checkpoint-claimable.png"),
    completed: file("checkpoints", "5-small-golden-star-reward-token.png"),
    pending: file("checkpoints", "6-amber-pending-review-marker.png"),
    locked: file("checkpoints", "7-silver-purple-locked-milestone-token.png"),
  },
  decorations: {
    magicalPortal: file("environment", "4-violet-turquoise-magical-portal.png"),
    woodenBridge: file("environment", "9-small-wooden-bridge-section.png"),
    grassShrubStoneCluster: file("environment", "10-decorative-grass-shrub-stone-cluster.png"),
    pinkFlowerShrubCluster: file("environment", "11-decorative-pink-flower-shrub-cluster.png"),
    tropicalPalmStoneCluster: file("environment", "12-tropical-palm-stone-cluster.png"),
  },
  clouds: {
    wideFloating: file("clouds", "1-wide-floating-cloud.png"),
    layeredLavender: file("clouds", "2-layered-lavender-cloud.png"),
    roundedFantasy: file("clouds", "3-rounded-fantasy-cloud.png"),
    lavenderSwirl: file("clouds", "4-lavender-swirl-cloud.png"),
    creamLavenderFantasy: file("clouds", "5-cream-lavender-fantasy-cloud.png"),
    softWhiteFloating: file("clouds", "8-soft-white-floating-cloud.png"),
  },
  effects: {
    confetti: file("effects", "1-golden-confetti-burst.png"),
    sparkles: file("effects", "2-reward-sparkles.png"),
    coinTrail: file("effects", "3-coin-trail.png"),
    chestUnlockGlow: file("effects", "4-chest-unlock-glow.png"),
    completionRing: file("effects", "5-Milestone-Completion-Ring.png"),
    softRewardAura: file("effects", "6-soft-reward-aura.png"),
    projectCelebration: file("effects", "7-project-completion-celebration.png"),
  },
  ui: {
    promptC: file("ui", "prompt-C.png"),
    promptH: file("ui", "prompt-H.png"),
    detailFrame: file("ui", "prompt-C.png"),
  },
};
export const REWARD_MAP_ASSETS = rewardMapAssets;
export const getRewardMapAsset = (primary, fallback = "") => primary || fallback;
export default rewardMapAssets;
