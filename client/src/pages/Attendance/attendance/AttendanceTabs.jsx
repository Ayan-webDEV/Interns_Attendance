import styles from "./AttendanceTabs.module.css";

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function OverviewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m8 15 2 2 5-5" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab configuration                                                          */
/* -------------------------------------------------------------------------- */

const TAB_ITEMS = [
  {
    id: "overview",
    number: "01",
    label: "Overview",
    description: "Attendance statistics and progress",
    Icon: OverviewIcon,
  },
  {
    id: "attendance",
    number: "02",
    label: "Attendance",
    description: "Sessions, calendar and attendance history",
    Icon: AttendanceIcon,
  },
];

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceTabs({ activeTab = "overview", onChange }) {
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    if (typeof onChange === "function") {
      onChange(tabId);
    }
  };

  const handleKeyDown = (event, currentIndex) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % TAB_ITEMS.length;
        break;

      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + TAB_ITEMS.length) % TAB_ITEMS.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = TAB_ITEMS.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextTab = TAB_ITEMS[nextIndex];

    handleTabChange(nextTab.id);

    document.getElementById(`attendance-tab-${nextTab.id}`)?.focus();
  };

  return (
    <>
      <div className="mt-3" />
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <div className={styles.tabsHeading}>
            <span className={styles.headingIcon}>
              <OverviewIcon />
            </span>

            <div className={styles.headingText}>
              <strong>Attendance workspace</strong>
              <span>Switch between your attendance views</span>
            </div>
          </div>

          <span className={styles.tabsBadge}>
            <span className={styles.badgeDot} />
            LIVE WORKSPACE
          </span>
        </div>

        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Attendance navigation"
        >
          {TAB_ITEMS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.Icon;

            return (
              <button
                key={tab.id}
                id={`attendance-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`attendance-panel-${tab.id}`}
                aria-label={`${tab.label}: ${tab.description}`}
                tabIndex={isActive ? 0 : -1}
                className={[styles.tab, isActive ? styles.activeTab : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className={styles.tabIcon}>
                  <Icon />
                </span>

                <span className={styles.tabText}>
                  <span className={styles.tabTopLine}>
                    <span className={styles.tabNumber}>{tab.number}</span>

                    {isActive && (
                      <span className={styles.selectedLabel}>SELECTED</span>
                    )}
                  </span>

                  <span className={styles.tabLabel}>{tab.label}</span>

                  <span className={styles.tabDescription}>
                    {tab.description}
                  </span>
                </span>

                {isActive && (
                  <span className={styles.activeIndicator} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
