import React, { useCallback, useEffect, useRef, useState } from "react";

import { CheckCircle2, Sparkles, X, Trophy } from "lucide-react";

import { rewardMapAssets } from "./rewardMapAssets";

import styles from "./RewardCelebration.module.css";

/* =========================================================
   HELPERS
========================================================= */

function getValidAmount(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    value =
      value.$numberDecimal ?? value.$numberInt ?? value.value ?? value.amount;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function formatAmount(value) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getDuration(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 2800;

  return Math.min(10000, Math.max(1000, number));
}

/* =========================================================
   REWARD CELEBRATION
========================================================= */

export default function RewardCelebration({
  active = false,
  amount = null,
  title = "Reward unlocked!",
  description = "Another milestone completed in your VELoop journey.",
  currency = "IC",
  duration = 2800,
  onComplete,
}) {
  const [visible, setVisible] = useState(false);

  const [confettiFailed, setConfettiFailed] = useState(false);

  const [sparklesFailed, setSparklesFailed] = useState(false);

  const [chestFailed, setChestFailed] = useState(false);

  const onCompleteRef = useRef(onComplete);

  const completedRef = useRef(false);

  const durationMs = getDuration(duration);

  const validAmount = getValidAmount(amount);

  /* -------------------------------------------------------
     KEEP LATEST CALLBACK
  ------------------------------------------------------- */

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /* -------------------------------------------------------
     COMPLETE CELEBRATION
  ------------------------------------------------------- */

  const completeCelebration = useCallback(() => {
    if (completedRef.current) return;

    completedRef.current = true;

    setVisible(false);

    onCompleteRef.current?.();
  }, []);

  /* -------------------------------------------------------
     SHOW / HIDE CELEBRATION
  ------------------------------------------------------- */

  useEffect(() => {
    if (!active) {
      setVisible(false);
      completedRef.current = false;

      return undefined;
    }

    completedRef.current = false;

    setConfettiFailed(false);
    setSparklesFailed(false);
    setChestFailed(false);

    setVisible(true);

    const timer = window.setTimeout(() => {
      completeCelebration();
    }, durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active, durationMs, completeCelebration]);

  /* -------------------------------------------------------
     ESCAPE KEY
  ------------------------------------------------------- */

  useEffect(() => {
    if (!visible) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        completeCelebration();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, completeCelebration]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* =================================================
          BACKGROUND EFFECTS
      ================================================= */}

      {!confettiFailed && (
        <img
          className={styles.confetti}
          src={rewardMapAssets.effects.confetti}
          alt=""
          aria-hidden="true"
          draggable="false"
          onError={() => setConfettiFailed(true)}
        />
      )}

      {!sparklesFailed && (
        <img
          className={styles.sparkles}
          src={rewardMapAssets.effects.sparkles}
          alt=""
          aria-hidden="true"
          draggable="false"
          onError={() => setSparklesFailed(true)}
        />
      )}

      {/* =================================================
          CELEBRATION CARD
      ================================================= */}

      <section className={styles.card} aria-label={title}>
        {/* Close */}

        <button
          type="button"
          className={styles.dismiss}
          onClick={completeCelebration}
          aria-label="Dismiss reward celebration"
          title="Close celebration"
        >
          <X size={17} />
        </button>

        {/* Top icon */}

        <span className={styles.topIcon}>
          <Trophy size={20} />
        </span>

        <span className={styles.eyebrow}>
          <Sparkles size={13} />
          MILESTONE ACHIEVED
        </span>

        {/* Treasure chest */}

        <div className={styles.chestWrap}>
          {!chestFailed ? (
            <img
              className={styles.chest}
              src={rewardMapAssets.chests.open}
              alt="Opened golden reward chest"
              draggable="false"
              onError={() => setChestFailed(true)}
            />
          ) : (
            <span className={styles.chestFallback}>
              <GiftFallback />
            </span>
          )}
        </div>

        {/* Heading */}

        <h2>{title}</h2>

        <p className={styles.description}>{description}</p>

        {/* Actual reward amount */}

        {validAmount !== null && (
          <div className={styles.amount}>
            <span>
              <CheckCircle2 size={15} />
              Reward recorded
            </span>

            <strong>
              +{formatAmount(validAmount)} {currency}
            </strong>
          </div>
        )}

        {/* Completion message */}

        <p className={styles.footerMessage}>
          Keep building your progress. Your next milestone awaits.
        </p>

        {/* Continue */}

        <button
          type="button"
          className={styles.continueButton}
          onClick={completeCelebration}
        >
          Continue
          <CheckCircle2 size={16} />
        </button>
      </section>
    </div>
  );
}

/* =========================================================
   FALLBACK ICON
========================================================= */

function GiftFallback() {
  return <Sparkles size={48} />;
}
