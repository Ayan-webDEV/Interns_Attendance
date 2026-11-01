import { useMemo } from "react";

import styles from "./AttendanceTimer.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function safeSeconds(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Math.max(0, Math.ceil(number));
}

function formatDuration(totalSeconds) {
  const seconds = safeSeconds(totalSeconds);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function getSessionNumber(session) {
  const number = Number(session?.sessionNumber ?? session?.session);

  return number === 1 || number === 2 ? number : null;
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function ClockIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceTimer({
  activeSession,
  remaining = 0,
  busy = false,
  minimumSeconds = 50,
  onMark,
}) {
  const requiredSeconds = useMemo(() => {
    const value = Number(activeSession?.minimumSeconds ?? minimumSeconds);

    return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 50;
  }, [activeSession?.minimumSeconds, minimumSeconds]);

  const remainingSeconds = safeSeconds(remaining);

  const elapsedSeconds = Math.min(
    requiredSeconds,
    Math.max(0, requiredSeconds - remainingSeconds),
  );

  const progress = requiredSeconds
    ? Math.min(100, Math.max(0, (elapsedSeconds / requiredSeconds) * 100))
    : 0;

  const isComplete = remainingSeconds <= 0;
  const sessionNumber = getSessionNumber(activeSession);

  const sessionLabel = sessionNumber
    ? `Session ${sessionNumber}`
    : "Attendance session";

  const circumference = 2 * Math.PI * 49;
  const strokeOffset = circumference - (progress / 100) * circumference;

  const handleSubmit = () => {
    if (!isComplete || busy || typeof onMark !== "function") return;

    onMark();
  };

  return (
    <section
      className={`${styles.timerCard} ${
        isComplete ? styles.completedTimer : ""
      }`}
      aria-label={`${sessionLabel} timer`}
      aria-live="polite"
    >
      <div className={styles.timerHeader}>
        <div className={styles.timerHeading}>
          <span className={styles.timerIcon}>
            <ClockIcon />
          </span>

          <div>
            <span className={styles.eyebrow}>ACTIVE ATTENDANCE</span>
            <h2>{sessionLabel} in progress</h2>
          </div>
        </div>

        <span
          className={`${styles.timerStatus} ${
            isComplete ? styles.readyStatus : ""
          }`}
        >
          <span className={styles.statusDot} />
          {isComplete ? "Ready to submit" : "Timer running"}
        </span>
      </div>

      <div className={styles.timerBody}>
        <div className={styles.progressArea}>
          <div
            className={styles.progressRing}
            role="img"
            aria-label={
              isComplete
                ? "Required session time completed"
                : `${Math.round(progress)} percent of required session time completed`
            }
          >
            <svg
              className={styles.progressSvg}
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <circle className={styles.progressTrack} cx="60" cy="60" r="49" />

              <circle
                className={styles.progressValue}
                cx="60"
                cy="60"
                r="49"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
              />
            </svg>

            <div className={styles.timerValue}>
              {isComplete ? (
                <span className={styles.completeCheck}>
                  <CheckIcon />
                </span>
              ) : (
                <>
                  <strong>{formatDuration(remainingSeconds)}</strong>
                  <span>remaining</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.progressCaption}>
            <strong>{Math.round(progress)}%</strong>
            <span>Time completed</span>
          </div>
        </div>

        <div className={styles.timerInformation}>
          <div className={styles.informationHeading}>
            <h3>
              {isComplete ? "Your session is complete" : "Stay on this page"}
            </h3>

            <p>
              {isComplete
                ? "You have completed the minimum required session duration. Submit your attendance to finish."
                : "Keep your session active until the countdown reaches zero. You can submit your attendance once the required time is completed."}
            </p>
          </div>

          <div className={styles.durationDetails}>
            <div className={styles.durationItem}>
              <span>Required duration</span>
              <strong>{formatDuration(requiredSeconds)}</strong>
            </div>

            <div className={styles.durationItem}>
              <span>Time completed</span>
              <strong>{formatDuration(elapsedSeconds)}</strong>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.submitButton} ${
              isComplete ? styles.submitReady : ""
            }`}
            disabled={!isComplete || busy || typeof onMark !== "function"}
            onClick={handleSubmit}
          >
            {busy ? (
              <>
                <span className={styles.spinner} />
                Submitting attendance...
              </>
            ) : isComplete ? (
              <>
                <CheckIcon />
                Submit attendance
              </>
            ) : (
              <>
                <ClockIcon />
                Complete timer first
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.timerFootnote}>
        <span className={styles.footnoteIcon}>
          <ShieldIcon />
        </span>

        <p>
          Your session time is validated by the attendance server. Do not close
          the session before submitting your attendance.
        </p>
      </div>
    </section>
  );
}
