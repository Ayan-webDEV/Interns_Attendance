import styles from "./AttendanceHeader.module.css";
import { useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getDisplayName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.username ||
    "Intern"
  );
}

function getInitials(name) {
  const parts = String(name || "Intern")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "IN";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getGroupName(group) {
  return (
    group?.groupName ||
    group?.name ||
    group?.title ||
    group?.whatsappGroupName ||
    "Internship group"
  );
}

function getGroupCode(group) {
  return group?.groupCode || group?.code || group?.whatsappGroupCode || null;
}

function getProfileImage(user) {
  return (
    user?.profilePicture ||
    user?.profileImage ||
    user?.avatar ||
    user?.photoURL ||
    user?.picture ||
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function RefreshIcon({ spinning = false }) {
  return (
    <svg
      className={spinning ? styles.spinningIcon : undefined}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M5.6 9a7 7 0 0 1 11.55-2.6L20 12" />
      <path d="M18.4 15a7 7 0 0 1-11.55 2.6L4 12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
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

function GroupIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceHeader({
  user,
  group,
  todayLabel,
  timeLabel,
  refreshing = false,
  onRefresh,
}) {
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const groupName = getGroupName(group);
  const groupCode = getGroupCode(group);

  // Keep the same localStorage key used by Shell.jsx
  const profilePictureKey = `vlr_profile_picture_${
    user?.id || user?._id || user?.email || "intern"
  }`;

  const [savedProfileImage, setSavedProfileImage] = useState("");

  useEffect(() => {
    const loadProfilePicture = () => {
      try {
        const image = window.localStorage.getItem(profilePictureKey);
        setSavedProfileImage(image || "");
      } catch {
        setSavedProfileImage("");
      }
    };

    // Load the saved image when the component mounts
    loadProfilePicture();

    // Update when the Account page uploads or removes a picture
    window.addEventListener("vlr-profile-picture-updated", loadProfilePicture);

    // Update when localStorage changes in another browser tab
    const handleStorageChange = (event) => {
      if (event.key === profilePictureKey || event.key === null) {
        loadProfilePicture();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "vlr-profile-picture-updated",
        loadProfilePicture,
      );

      window.removeEventListener("storage", handleStorageChange);
    };
  }, [profilePictureKey]);

  // Prefer the saved localStorage picture.
  // If unavailable, use the profile image from the user object.
  const profileImage = savedProfileImage || getProfileImage(user);

  const handleRefresh = () => {
    if (refreshing || typeof onRefresh !== "function") return;

    onRefresh();
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.welcomeSection}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            INTERN PORTAL
          </div>

          <h1>
            Welcome back, <span>{displayName.split(" ")[0]}!</span>
          </h1>

          <p className={styles.subtitle}>
            Keep track of your daily sessions and attendance progress.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.profile}>
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${displayName}'s profile`}
                className={styles.profileImage}
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.nextElementSibling?.removeAttribute(
                    "hidden",
                  );
                }}
              />
            ) : null}

            <div
              className={styles.profileFallback}
              hidden={Boolean(profileImage)}
              aria-label={`${displayName} initials`}
            >
              {initials}
            </div>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={
              refreshing ? "Refreshing attendance" : "Refresh attendance"
            }
            title="Refresh attendance data"
          >
            <RefreshIcon spinning={refreshing} />
            <span>{refreshing ? "Refreshing" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className={styles.headerMeta}>
        <div className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <CalendarIcon />
          </span>

          <span className={styles.metaText}>
            <span className={styles.metaLabel}>Today</span>
            <strong>{todayLabel || "Date unavailable"}</strong>
          </span>
        </div>

        <div className={styles.metaDivider} />

        <div className={styles.metaItem}>
          <span className={styles.metaIcon}>
            <ClockIcon />
          </span>

          <span className={styles.metaText}>
            <span className={styles.metaLabel}>Current time · IST</span>
            <strong>{timeLabel || "--:--"}</strong>
          </span>
        </div>

        <div className={styles.metaDivider} />

        <div className={`${styles.metaItem} ${styles.groupMeta}`}>
          <span className={styles.metaIcon}>
            <GroupIcon />
          </span>

          <span className={styles.metaText}>
            <span className={styles.metaLabel}>Your group</span>
            <strong title={groupName}>{groupName}</strong>
          </span>

          {groupCode && <span className={styles.groupCode}>{groupCode}</span>}
        </div>
      </div>
    </header>
  );
}
