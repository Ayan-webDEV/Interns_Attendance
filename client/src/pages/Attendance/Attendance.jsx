import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";

import AttendancePage from "./AttendancePage";

/* =========================================================
   CONFIGURATION
========================================================= */

const DEFAULT_MINIMUM_SECONDS = 50;

const DEFAULT_DESKTOP_ACCESS =
  String(import.meta.env.VITE_ONLY_DESKTOP_ACCESS ?? "true").toLowerCase() !==
  "false";

/* =========================================================
   HELPERS
========================================================= */

function getMinimumSeconds(value, fallback = DEFAULT_MINIMUM_SECONDS) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.ceil(number);
}

function getStartedAtTimestamp(value) {
  if (!value) return Date.now();

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function getRemainingSeconds(activeSession) {
  if (!activeSession) return 0;

  const startedAt =
    Number(activeSession.startedAtMs) ||
    getStartedAtTimestamp(activeSession.startedAt);

  const minimumSeconds = getMinimumSeconds(activeSession.minimumSeconds);

  const finishAt = startedAt + minimumSeconds * 1000;

  return Math.max(0, Math.ceil((finishAt - Date.now()) / 1000));
}

function getErrorMessage(error, fallback) {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function getHistoryQuery(from, to) {
  const params = new URLSearchParams();

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = params.toString();

  return query ? `/attendance/history?${query}` : "/attendance/history";
}

function isExpiredSessionError(message = "") {
  return /expired|not found|window has closed|attendance window has closed/i.test(
    String(message),
  );
}

/* =========================================================
   VIEWPORT HELPER
========================================================= */

function getInitialWideViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(min-width: 1250px)").matches;
  }

  return window.innerWidth >= 1250;
}

/* =========================================================
   ATTENDANCE ROUTE CONTROLLER
========================================================= */

export default function Attendance({ user }) {
  const toast = useToast();

  /* -------------------------------------------------------
     SERVER DATA
  ------------------------------------------------------- */

  const [today, setToday] = useState(null);
  const [group, setGroup] = useState(null);
  const [history, setHistory] = useState([]);

  /* -------------------------------------------------------
     FILTERS AND CALENDAR
  ------------------------------------------------------- */

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [month, setMonth] = useState(() => {
    return new Date();
  });

  /* -------------------------------------------------------
     LOADING AND ACTION STATES
  ------------------------------------------------------- */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [dataError, setDataError] = useState("");

  /* -------------------------------------------------------
     ACTIVE ATTENDANCE SESSION
  ------------------------------------------------------- */

  const [activeSession, setActiveSession] = useState(null);
  const [remaining, setRemaining] = useState(0);

  /* -------------------------------------------------------
     DEVICE ACCESS CONFIGURATION
  ------------------------------------------------------- */

  const [onlyDesktopAccess, setOnlyDesktopAccess] = useState(
    DEFAULT_DESKTOP_ACCESS,
  );

  const [wideViewport, setWideViewport] = useState(getInitialWideViewport);

  const desktopAccessAllowed = !onlyDesktopAccess || wideViewport;

  /* -------------------------------------------------------
     REQUEST PROTECTION
  ------------------------------------------------------- */

  const requestSequence = useRef(0);
  const scheduleRefreshInProgress = useRef(false);

  /* =======================================================
     RESPONSIVE VIEWPORT TRACKING

     The old page checked window.innerWidth only during
     render. Resizing the browser did not update the
     desktop-access state.

     This listener keeps the setting reactive.
  ======================================================= */

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(min-width: 1250px)");

    const updateViewport = () => {
      setWideViewport(media.matches);
    };

    updateViewport();

    if (media.addEventListener) {
      media.addEventListener("change", updateViewport);

      return () => {
        media.removeEventListener("change", updateViewport);
      };
    }

    // Compatibility fallback for older browsers.
    media.addListener(updateViewport);

    return () => {
      media.removeListener(updateViewport);
    };
  }, []);

  /* =======================================================
     LOAD ALL ATTENDANCE DATA
  ======================================================= */

  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = ++requestSequence.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setDataError("");

      const results = await Promise.allSettled([
        api("/attendance/today"),

        api("/groups"),

        api("/portal/config"),

        api(getHistoryQuery(from, to)),
      ]);

      // Ignore stale responses after filters change or unmount.
      if (requestId !== requestSequence.current) {
        return false;
      }

      const [todayResult, groupsResult, configResult, historyResult] = results;

      const failures = [];

      let latestToday = today;

      /* -----------------------------------------------
         TODAY'S ATTENDANCE
      ----------------------------------------------- */

      if (todayResult.status === "fulfilled") {
        latestToday = todayResult.value;

        setToday(latestToday);
      } else {
        failures.push("today's attendance");
      }

      /* -----------------------------------------------
         GROUP
      ----------------------------------------------- */

      if (groupsResult.status === "fulfilled") {
        const groups = Array.isArray(groupsResult.value?.groups)
          ? groupsResult.value.groups
          : [];

        const nextGroup = groups[0] ?? latestToday?.group ?? null;

        setGroup(nextGroup);
      } else if (latestToday?.group) {
        // /attendance/today also includes the user's group.
        setGroup(latestToday.group);
      } else {
        failures.push("internship group");
      }

      /* -----------------------------------------------
         PORTAL CONFIGURATION
      ----------------------------------------------- */

      if (configResult.status === "fulfilled") {
        const configuredValue = configResult.value?.settings?.onlyDesktopAccess;

        // Do not accidentally turn the restriction off when
        // the API response doesn't contain this setting.
        if (typeof configuredValue === "boolean") {
          setOnlyDesktopAccess(configuredValue);
        }
      } else {
        // Keep the existing environment-variable fallback.
        console.warn("Attendance access configuration could not be refreshed.");
      }

      /* -----------------------------------------------
         ATTENDANCE HISTORY
      ----------------------------------------------- */

      if (historyResult.status === "fulfilled") {
        const nextRecords = Array.isArray(historyResult.value?.records)
          ? historyResult.value.records
          : [];

        setHistory(nextRecords);
      } else {
        failures.push("attendance history");
      }

      if (failures.length > 0) {
        setDataError(
          `Some attendance information could not be loaded: ${failures.join(", ")}.`,
        );
      }

      if (requestId === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }

      return failures.length === 0;
    },
    [from, to],
  );

  /* =======================================================
     INITIAL LOAD AND DATE FILTER REFRESH
  ======================================================= */

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      requestSequence.current += 1;
    };
  }, []);

  /* =======================================================
     REFRESH TODAY'S SERVER SCHEDULE

     The backend calculates `windows.first.open` and
     `windows.second.open` at request time. Refreshing the
     endpoint periodically keeps those values current.

     The UI also recalculates availability live from the
     returned `start` / `end` values in AttendancePage.
  ======================================================= */

  const refreshSchedule = useCallback(async () => {
    if (scheduleRefreshInProgress.current) return;

    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }

    scheduleRefreshInProgress.current = true;

    try {
      const result = await api("/attendance/today");

      setToday(result);

      if (result?.group) {
        setGroup((current) => current || result.group);
      }
    } catch (error) {
      // Do not repeatedly show toasts during background polling.
      console.warn(
        "Attendance schedule refresh failed:",
        error?.message || error,
      );
    } finally {
      scheduleRefreshInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refreshSchedule, 15000);

    const handleFocus = () => {
      refreshSchedule();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timer);

      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshSchedule]);

  /* =======================================================
     LIVE VERIFICATION TIMER

     Uses server `startedAt` plus `minimumSeconds`.

     This avoids timer drift caused by repeatedly
     subtracting one from local state.
  ======================================================= */

  useEffect(() => {
    if (!activeSession) {
      setRemaining(0);
      return undefined;
    }

    const updateRemaining = () => {
      const nextRemaining = getRemainingSeconds(activeSession);

      setRemaining((current) =>
        current === nextRemaining ? current : nextRemaining,
      );
    };

    // Immediately calculate the current timer state.
    updateRemaining();

    const timer = window.setInterval(updateRemaining, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSession]);

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const refresh = useCallback(
    async (silent = true) => {
      return fetchData({ silent });
    },
    [fetchData],
  );

  /* =======================================================
     COMMON ATTENDANCE PRE-CHECKS
  ======================================================= */

  const canStartAttendance = useCallback(() => {
    if (!user?.gender) {
      toast(
        "Please select your gender in My account before marking attendance.",
        "error",
      );

      window.location.assign("/account");

      return false;
    }

    if (!desktopAccessAllowed) {
      toast(
        "Attendance is available only on a laptop or desktop with a screen width of at least 1250px.",
        "error",
      );

      return false;
    }

    return true;
  }, [user?.gender, desktopAccessAllowed, toast]);

  /* =======================================================
     START ATTENDANCE SESSION

     Backend remains authoritative for:
     - Group active status
     - Internship dates
     - Sunday holidays
     - Session opening and closing time
     - Minimum verification time
     - First-session approval for re-attendance
     - Existing attendance records
  ======================================================= */

  const startAttendance = useCallback(
    async (sessionNumber) => {
      const number = Number(sessionNumber);

      if (![1, 2].includes(number)) {
        toast("Please select a valid attendance session.", "error");

        return false;
      }

      if (!canStartAttendance()) {
        return false;
      }

      if (busy) {
        return false;
      }

      setBusy(true);

      try {
        const started = await api("/attendance/session/start", {
          method: "POST",
          body: {
            sessionNumber: number,
          },
        });

        const minimumSeconds = getMinimumSeconds(
          started?.minimumSeconds,
          getMinimumSeconds(today?.minimumSeconds),
        );

        const startedAtMs = getStartedAtTimestamp(started?.startedAt);

        const nextSession = {
          ...started,
          sessionNumber: number,
          minimumSeconds,
          startedAtMs,
          startedAt: started?.startedAt
            ? started.startedAt
            : new Date(startedAtMs).toISOString(),
        };

        setActiveSession(nextSession);

        setRemaining(getRemainingSeconds(nextSession));

        toast(
          started?.message ||
            `Session ${number} started. Keep this page open until the ${minimumSeconds}-second verification timer completes.`,
          "info",
        );

        return true;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to start this attendance session.",
        );

        toast(message, "error");

        // Refresh the schedule and today's records in case
        // the server rejected a stale availability state.
        await refreshSchedule();

        return false;
      } finally {
        setBusy(false);
      }
    },
    [canStartAttendance, busy, today?.minimumSeconds, toast, refreshSchedule],
  );

  /* =======================================================
     SUBMIT ATTENDANCE REQUEST
  ======================================================= */

  const markAttendance = useCallback(async () => {
    if (!activeSession?.sessionId) {
      toast(
        "No active attendance verification session was found. Please start again.",
        "error",
      );

      return false;
    }

    const secondsLeft = getRemainingSeconds(activeSession);

    if (secondsLeft > 0) {
      setRemaining(secondsLeft);

      toast(
        `Please wait ${secondsLeft} more seconds before submitting your attendance.`,
        "info",
      );

      return false;
    }

    if (busy) {
      return false;
    }

    setBusy(true);

    try {
      const result = await api(
        `/attendance/session/${encodeURIComponent(
          activeSession.sessionId,
        )}/mark`,
        {
          method: "POST",
          body: {},
        },
      );

      setActiveSession(null);
      setRemaining(0);

      toast(
        result?.message ||
          "Attendance request recorded. Await administrator approval.",
        "success",
      );

      await fetchData({ silent: true });

      return true;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to submit your attendance request.",
      );

      toast(message, "error");

      // Expired sessions or closed windows cannot be submitted.
      // Clear only those sessions; preserve the active session
      // after ordinary network errors so the user can retry.
      if (isExpiredSessionError(message)) {
        setActiveSession(null);
        setRemaining(0);

        await refreshSchedule();
      }

      return false;
    } finally {
      setBusy(false);
    }
  }, [activeSession, busy, toast, fetchData, refreshSchedule]);

  /* =======================================================
     DATA FOR THE PRESENTATION LAYER
  ======================================================= */

  const pageData = useMemo(
    () => ({
      user,

      today,
      group,
      history,

      from,
      setFrom,

      to,
      setTo,

      month,
      setMonth,

      loading,
      refreshing,
      busy,
      dataError,

      activeSession,
      remaining,

      onlyDesktopAccess,
      desktopAccessAllowed,

      refresh,
      startAttendance,
      markAttendance,
    }),
    [
      user,
      today,
      group,
      history,
      from,
      to,
      month,
      loading,
      refreshing,
      busy,
      dataError,
      activeSession,
      remaining,
      onlyDesktopAccess,
      desktopAccessAllowed,
      refresh,
      startAttendance,
      markAttendance,
    ],
  );

  return <AttendancePage data={pageData} />;
}
