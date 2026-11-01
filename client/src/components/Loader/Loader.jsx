import styles from "./Loader.module.css";

export default function Loader({
  label = "Loading your workspace…",
  full = true,
}) {
  return (
    <div
      className={`${styles.wrap} ${full ? styles.full : styles.inline}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Animated brand section */}
      <div className={styles.loadingContent}>
        <div className={styles.brandVisual}>
          <span
            className={`${styles.orbit} ${styles.orbitOne}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.orbit} ${styles.orbitTwo}`}
            aria-hidden="true"
          />

          <div className={styles.logoFrame}>
            <span className={styles.logoFallback}>V</span>

            <img
              src="/LOGO.jpeg"
              alt="VELoop"
              className={styles.logoImage}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>

          <span className={styles.logoPulse} aria-hidden="true" />
        </div>

        <div className={styles.loadingCopy}>
          <span className={styles.brandName}>VELOOP</span>

          <p className={styles.loadingLabel}>{label}</p>

          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressBar} />
          </div>

          <div className={styles.loadingMeta}>
            <span className={styles.loadingIndicator}>
              <i />
              <i />
              <i />
            </span>

            <span className={styles.loadingMessage}>
              Preparing your experience
            </span>
          </div>
        </div>
      </div>

      {/* Inline dashboard skeleton */}
      {!full && (
        <div className={styles.skeleton} aria-hidden="true">
          {/* Skeleton heading */}
          <div className={styles.skeletonTopbar}>
            <div className={styles.skeletonHeading}>
              <div
                className={`${styles.skeletonBlock} ${styles.skeletonTitle}`}
              />
              <div
                className={`${styles.skeletonBlock} ${styles.skeletonSub}`}
              />
            </div>

            <div
              className={`${styles.skeletonBlock} ${styles.skeletonAction}`}
            />
          </div>

          {/* Skeleton statistics */}
          <div className={styles.skeletonStats}>
            {[1, 2, 3, 4].map((item) => (
              <div className={styles.skeletonStat} key={item}>
                <div
                  className={`${styles.skeletonBlock} ${styles.skeletonStatIcon}`}
                />

                <div className={styles.skeletonStatContent}>
                  <div
                    className={`${styles.skeletonBlock} ${styles.skeletonStatLabel}`}
                  />

                  <div
                    className={`${styles.skeletonBlock} ${styles.skeletonStatValue}`}
                  />

                  <div
                    className={`${styles.skeletonBlock} ${styles.skeletonStatNote}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Main skeleton content */}
          <div className={styles.skeletonContent}>
            {/* Main chart panel */}
            <div className={styles.skeletonPanel}>
              <div className={styles.skeletonPanelHeader}>
                <div
                  className={`${styles.skeletonBlock} ${styles.panelTitle}`}
                />

                <div
                  className={`${styles.skeletonBlock} ${styles.panelAction}`}
                />
              </div>

              <div className={styles.skeletonChart}>
                <div className={styles.chartGridLines}>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>

                <div className={styles.chartBars}>
                  {[42, 68, 52, 83, 61, 94, 70, 100, 57].map(
                    (height, index) => (
                      <div
                        key={index}
                        className={`${styles.skeletonBlock} ${styles.chartBar}`}
                        style={{ "--bar-height": `${height}%` }}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className={styles.skeletonChartFooter}>
                <div
                  className={`${styles.skeletonBlock} ${styles.footerLine}`}
                />
                <div
                  className={`${styles.skeletonBlock} ${styles.footerLine}`}
                />
                <div
                  className={`${styles.skeletonBlock} ${styles.footerLine}`}
                />
              </div>
            </div>

            {/* Side information panel */}
            <div className={styles.skeletonPanel}>
              <div className={styles.skeletonPanelHeader}>
                <div
                  className={`${styles.skeletonBlock} ${styles.panelTitle}`}
                />
                <div
                  className={`${styles.skeletonBlock} ${styles.panelCircle}`}
                />
              </div>

              <div className={styles.skeletonActivityList}>
                {[1, 2, 3, 4].map((item) => (
                  <div className={styles.skeletonActivity} key={item}>
                    <div
                      className={`${styles.skeletonBlock} ${styles.activityIcon}`}
                    />

                    <div className={styles.activityContent}>
                      <div
                        className={`${styles.skeletonBlock} ${styles.activityTitle}`}
                      />

                      <div
                        className={`${styles.skeletonBlock} ${styles.activitySub}`}
                      />
                    </div>

                    <div
                      className={`${styles.skeletonBlock} ${styles.activityBadge}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom loading panel */}
          <div className={styles.skeletonBottomPanel}>
            <div className={`${styles.skeletonBlock} ${styles.bottomTitle}`} />

            <div className={styles.bottomRows}>
              {[1, 2, 3].map((item) => (
                <div className={styles.bottomRow} key={item}>
                  <div
                    className={`${styles.skeletonBlock} ${styles.bottomRowMain}`}
                  />

                  <div
                    className={`${styles.skeletonBlock} ${styles.bottomRowSide}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
