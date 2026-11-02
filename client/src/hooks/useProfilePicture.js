import { useEffect, useState } from "react";

export function getProfilePictureKey(user) {
  const identityKey = user?.id || user?.email || "intern";

  return `vlr_profile_picture_${identityKey}`;
}

export function getStoredProfilePicture(user) {
  try {
    const key = getProfilePictureKey(user);
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

export default function useProfilePicture(user) {
  const profilePictureKey = getProfilePictureKey(user);

  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const loadProfilePicture = () => {
      try {
        setProfilePicture(window.localStorage.getItem(profilePictureKey) || "");
      } catch {
        setProfilePicture("");
      }
    };

    // Load saved picture
    loadProfilePicture();

    // Listen for updates in the current tab
    window.addEventListener("vlr-profile-picture-updated", loadProfilePicture);

    // Listen for updates from other browser tabs
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

  return profilePicture;
}
