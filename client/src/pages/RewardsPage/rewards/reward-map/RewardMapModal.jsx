import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Map,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { isCompletedStatus } from "./rewardMapUtils";

import RewardMapHeader from "./RewardMapHeader";
import RewardMapScene from "./RewardMapScene";
import RewardDetailsSheet from "./RewardDetailsSheet";

import styles from "./RewardMapModal.module.css";
import RewardMapLegend from "./RewardMapLegend";

/* =========================================================
   HELPERS
========================================================= */

function getMilestoneId(milestone, index = 0) {
  return String(milestone?.id ?? milestone?._id ?? `milestone-${index + 1}`);
}

function getErrorMessage(error) {
  if (!error) return "";

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.message ?? "The reward map could not be refreshed. Please try again."
  );
}

/* =========================================================
   REWARD MAP MODAL
========================================================= */

export default function RewardMapModal({
  open = false,
  milestones = [],
  loading = false,
  error = "",
  onClose,
  onRefresh,
  compact = false,
  initialMilestone = null,
}) {
  const list = useMemo(() => {
    if (!Array.isArray(milestones)) return [];

    return milestones.filter((item) => item && typeof item === "object");
  }, [milestones]);

  const initialId = initialMilestone?.id ?? initialMilestone?._id ?? null;

  const [selectedId, setSelectedId] = useState(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const onCloseRef = useRef(onClose);

  /* -------------------------------------------------------
     LATEST CLOSE CALLBACK
  ------------------------------------------------------- */

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  /* -------------------------------------------------------
     INITIAL SELECTION
  ------------------------------------------------------- */

  useEffect(() => {
    if (!open) return;

    if (initialId !== null && initialId !== undefined) {
      const exists = list.some(
        (item, index) => getMilestoneId(item, index) === String(initialId),
      );

      setSelectedId(exists ? String(initialId) : null);
    } else {
      setSelectedId(null);
    }

    setRefreshError("");
  }, [open, initialId, list]);

  /* -------------------------------------------------------
     SELECTED MILESTONE
  ------------------------------------------------------- */

  const selectedIndex = list.findIndex(
    (item, index) =>
      getMilestoneId(item, index) === String(selectedIdRef.current),
  );

  const selected = selectedIndex >= 0 ? list[selectedIndex] : null;

  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  const completed = list.filter((item) =>
    isCompletedStatus(item.visualState ?? item.status),
  ).length;

  const progress = list.length
    ? Math.round((completed / list.length) * 100)
    : 0;

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const selectIndex = useCallback(
    (index) => {
      if (index < 0 || index >= list.length) return;

      setSelectedId(getMilestoneId(list[index], index));
    },
    [list],
  );

  /* -------------------------------------------------------
     CLOSE HANDLER
  ------------------------------------------------------- */

  const handleClose = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  /* -------------------------------------------------------
     FOCUS AND KEYBOARD MANAGEMENT
  ------------------------------------------------------- */

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }

    const dialog = dialogRef.current;

    if (!dialog) return undefined;

    previousFocusRef.current = document.activeElement;

    const previousBodyOverflow = document.body.style.overflow;

    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";

    document.documentElement.style.overflow = "hidden";

    // Give the dialog focus when it opens.
    dialog.focus({ preventScroll: true });

    const getFocusableElements = () => {
      const elements = dialog.querySelectorAll(
        [
          "button:not([disabled])",
          "a[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          '[tabindex]:not([tabindex="-1"])',
        ].join(","),
      );

      return Array.from(elements).filter(
        (element) => element.getClientRects().length > 0,
      );
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusableElements();

        if (!focusable.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }

        return;
      }

      // Keyboard checkpoint navigation is only active when
      // the user is interacting with the map canvas.
      const target = event.target;

      const insideMap =
        target instanceof Element &&
        Boolean(target.closest("[data-reward-map-canvas]"));

      if (!insideMap) return;

      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      if (!list.length) return;

      event.preventDefault();

      const currentIndex = list.findIndex(
        (item, index) => getMilestoneId(item, index) === String(selectedId),
      );

      const start = currentIndex < 0 ? 0 : currentIndex;

      const next =
        event.key === "ArrowRight"
          ? Math.min(start + 1, list.length - 1)
          : Math.max(start - 1, 0);

      selectIndex(next);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      document.documentElement.style.overflow = previousHtmlOverflow;

      document.removeEventListener("keydown", handleKeyDown);

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus?.();
      }
    };
  }, [open, handleClose, list, selectIndex]);

  /* -------------------------------------------------------
     REFRESH
  ------------------------------------------------------- */

  const handleRefresh = useCallback(async () => {
    if (refreshing || loading || typeof onRefresh !== "function") {
      return;
    }

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (refreshFailure) {
      setRefreshError(getErrorMessage(refreshFailure));
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, loading, onRefresh]);

  /* -------------------------------------------------------
     SAFETY
  ------------------------------------------------------- */

  if (!open || typeof document === "undefined") {
    return null;
  }

  const errorText = refreshError || getErrorMessage(error);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-map-title"
        tabIndex={-1}
      >
        {/* ===============================================
            HEADER
        =============================================== */}

        <RewardMapHeader
          progress={progress}
          completed={completed}
          total={list.length}
          loading={loading || refreshing}
          onRefresh={handleRefresh}
          onClose={handleClose}
        />

        {/* ===============================================
            ERROR MESSAGE
        =============================================== */}

        {errorText && (
          <div className={styles.notice} role="status">
            <CircleHelp size={17} />

            <span>{errorText}</span>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              Try again
            </button>
          </div>
        )}

        {/* ===============================================
            MAIN CONTENT
        =============================================== */}

        <main className={styles.content}>
          {/* Interactive map */}

          <section
            className={styles.mapPanel}
            data-reward-map-canvas
            aria-label="Interactive reward map"
          >
            {loading && !list.length ? (
              <div className={styles.empty}>
                <span className={styles.loader} />

                <strong>Preparing your reward world...</strong>

                <p>Loading your available attendance and reward checkpoints.</p>
              </div>
            ) : list.length > 0 ? (
              <RewardMapScene
                milestones={list}
                selectedMilestoneId={selected?.id ?? null}
                onSelect={(milestone) => {
                  if (milestone?.id !== undefined && milestone?.id !== null) {
                    setSelectedId(String(milestone.id));
                  }
                }}
              />
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                  <Map size={29} />
                </span>

                <strong>Your journey is waiting</strong>

                <p>
                  Your reward checkpoints will appear here as attendance and
                  wallet records become available.
                </p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? styles.spin : ""}
                  />
                  Refresh journey
                </button>
              </div>
            )}
          </section>

          {/* Details panel */}

          <aside
            className={styles.details}
            aria-label="Selected milestone details"
          >
            <RewardDetailsSheet milestone={selected} />

            {selected && (
              <div className={styles.navigation}>
                <button
                  type="button"
                  onClick={() => selectIndex(selectedIndex - 1)}
                  disabled={selectedIndex <= 0}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span aria-live="polite">
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
            )}

            {!selected && list.length > 0 && (
              <div className={styles.firstStep}>
                <span>
                  <Trophy size={21} />
                </span>

                <strong>Choose your next checkpoint</strong>

                <p>
                  Select a marker on the map to view its status, requirements
                  and reward information.
                </p>

                <button type="button" onClick={() => selectIndex(0)}>
                  Explore first checkpoint
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </aside>
        </main>

        {/* ===============================================
            FOOTER
        =============================================== */}

        <footer className={styles.footer}>
          {!compact && (
            <div>
              <RewardMapLegend />
            </div>
          )}

          {!selected && (
            <button type="button" onClick={handleClose}>
              <ArrowLeft size={15} />
              Return to wallet
            </button>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
