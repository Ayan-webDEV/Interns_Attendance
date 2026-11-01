// import { useCallback, useEffect, useState } from "react";
// import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
// import { LogOut, Moon, Sun, ShieldCheck } from "lucide-react";

// import LoginScreen from "./components/auth/LoginScreen.jsx";
// import { Brand, Toast } from "./components/ui/Primitives.jsx";
// import AdminApp from "./pages/admin/AdminApp.jsx";
// import InternApp from "./pages/intern/InternApp.jsx";
// import { api } from "./lib/api.js";
// import { getStored, saveStored } from "./lib/session.js";
// import { LegalFooter, LegalRoutePage } from "./components/legal/LegalPages.jsx";

// export default function App() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [session, setSession] = useState(getStored);
//   const [onboarding, setOnboarding] = useState(null);
//   const [googleProfile, setGoogleProfile] = useState(null);
//   const [toast, setToast] = useState("");
//   const [error, setError] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [tab, setTab] = useState("overview");

//   const [theme, setTheme] = useState(() => {
//     const stored = getStored();
//     const role = stored?.user?.role || "intern";

//     return (
//       localStorage.getItem(`vloop-theme-${role}`) ||
//       (role === "admin" ? "dark" : "light")
//     );
//   });

//   const inviteToken =
//     new URLSearchParams(window.location.search).get("invite") || "";

//   const notify = useCallback((message) => {
//     setToast(message);
//     setError("");
//   }, []);

//   const acceptSession = useCallback((next) => {
//     setSession(next);
//     saveStored(next);
//     setOnboarding(null);

//     const role = next.user.role;
//     setTab(role === "admin" ? "overview" : "attendance");

//     const nextTheme =
//       localStorage.getItem(`vloop-theme-${role}`) ||
//       (role === "admin" ? "dark" : "light");

//     setTheme(nextTheme);
//   }, []);

//   const logout = useCallback(() => {
//     setSession(null);
//     saveStored(null);
//     setOnboarding(null);
//     setGoogleProfile(null);
//     setError("");
//     setTab("overview");
//     setTheme(localStorage.getItem("vloop-theme-intern") || "light");

//     navigate("/login", { replace: true });
//   }, [navigate]);

//   const loginGoogle = async (result) => {
//     setBusy(true);
//     setError("");

//     try {
//       const data = await api("/auth/google", {
//         method: "POST",
//         body: JSON.stringify({
//           credential: result.credential,
//         }),
//       });

//       if (data.onboardingRequired && !data.token) {
//         setOnboarding(data.onboardingTicket);
//         setGoogleProfile(data.googleProfile);
//         return;
//       }

//       if (data.token) {
//         acceptSession({
//           token: data.token,
//           user: data.user,
//         });

//         if (data.user.role === "intern" && data.onboardingRequired) {
//           notify("Complete your intern profile to access attendance.");
//         }
//       }
//     } catch (err) {
//       setError(err.message);
//       notify(err.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   const toggleTheme = useCallback(() => {
//     setTheme((oldTheme) => {
//       const nextTheme = oldTheme === "dark" ? "light" : "dark";
//       const role = session?.user?.role || "intern";

//       localStorage.setItem(`vloop-theme-${role}`, nextTheme);
//       return nextTheme;
//     });
//   }, [session]);

//   useEffect(() => {
//     document.documentElement.dataset.theme = theme;
//   }, [theme]);

//   /*
//    * Close a policy page and return to the page from which it was opened.
//    * When a policy URL is opened directly, use the user's normal landing page.
//    */
//   const closeLegalPage = useCallback(() => {
//     const previousPath = location.state?.from;

//     if (previousPath && !previousPath.startsWith("/policies/")) {
//       navigate(previousPath, { replace: true });
//       return;
//     }

//     if (session?.user?.role === "admin") {
//       navigate("/admin/overview", { replace: true });
//       return;
//     }

//     if (session?.user?.role === "intern") {
//       navigate("/intern/attendance", { replace: true });
//       return;
//     }

//     navigate("/login", { replace: true });
//   }, [location.state, navigate, session]);

//   if (!session) {
//     return (
//       <div className="app-shell">
//         <LoginScreen
//           onGoogle={loginGoogle}
//           busy={busy}
//           error={error}
//           notify={notify}
//           onboarding={onboarding}
//           setOnboarding={setOnboarding}
//           googleProfile={googleProfile}
//           inviteToken={inviteToken}
//           onRegistered={(next) => {
//             acceptSession(next);
//             notify("Account created. Welcome bonus of 20 InternCash credited.");
//           }}
//           onAuthenticated={acceptSession}
//         />

//         <Routes>
//           <Route
//             path="/policies/:page"
//             element={<LegalRoutePage onClose={closeLegalPage} />}
//           />
//         </Routes>

//         <Toast message={toast} onClose={() => setToast("")} />
//       </div>
//     );
//   }

//   return (
//     <div className={`app-shell theme-${theme}`}>
//       {/* Shared navbar stays visible on all policy routes. */}
//       <header className="topbar">
//         <Brand />

//         <div className="top-actions">
//           <span className="badge">
//             <ShieldCheck size={12} />
//             {session.user.role === "admin"
//               ? "AUTHORIZED ADMIN"
//               : "VERIFIED INTERN"}
//           </span>

//           <span className="muted small user-name">{session.user.name}</span>

//           <button className="btn btn-ghost" onClick={logout} type="button">
//             <LogOut size={15} />
//             Sign out
//           </button>
//         </div>
//       </header>
//       <div className="h-17.5"></div>

//       {/* Existing dashboard, sidebar and page content are preserved. */}
//       {session.user.role === "admin" ? (
//         <AdminApp
//           session={session}
//           tab={tab}
//           setTab={setTab}
//           notify={notify}
//           onLogout={logout}
//           theme={theme}
//           onToggleTheme={toggleTheme}
//         />
//       ) : (
//         <InternApp
//           session={session}
//           tab={tab}
//           setTab={setTab}
//           notify={notify}
//           theme={theme}
//           onToggleTheme={toggleTheme}
//         />
//       )}

//       {/* Shared footer stays in the same place. */}
//       {/* <LegalFooter /> */}

//       {/* All four policy pages have independent React Router URLs. */}
//       <Routes>
//         <Route
//           path="/policies/:page"
//           element={<LegalRoutePage onClose={closeLegalPage} />}
//         />
//       </Routes>

//       <Toast message={toast} onClose={() => setToast("")} />
//     </div>
//   );
// }

import { useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, Laptop, Monitor } from "lucide-react";

import LoginScreen from "./components/auth/LoginScreen.jsx";
import { Brand, Toast } from "./components/ui/Primitives.jsx";
import AdminApp from "./pages/admin/AdminApp.jsx";
import InternApp from "./pages/intern/InternApp.jsx";
import { api } from "./lib/api.js";
import { getStored, saveStored } from "./lib/session.js";
import { LegalRoutePage } from "./components/legal/LegalPages.jsx";

const DESKTOP_QUERY = "(min-width: 1300px)";

/**
 * Shown whenever the browser viewport is narrower than 1300px.
 * Dashboard and authentication UI are not mounted while this is visible.
 */
function DeviceCompatibilityPage() {
  return (
    <main className="device-compatibility">
      <nav className="device-compatibility__nav">
        <a
          href="/"
          className="device-compatibility__brand"
          aria-label="VELoop Rewards home"
        >
          <img
            src="/LOGO.jpeg"
            alt="VELoop Rewards"
            className="device-compatibility__logo"
          />

          <span className="device-compatibility__brand-text">
            <strong>VELOOP</strong>
            <span>REWARDS</span>
          </span>
        </a>

        <span className="device-compatibility__nav-label">
          <span className="device-compatibility__status-dot" />
          Desktop Experience
        </span>
      </nav>

      <section
        className="device-compatibility__content"
        aria-labelledby="device-compatibility-title"
      >
        <div className="device-compatibility__icon" aria-hidden="true">
          <Laptop size={48} strokeWidth={1.5} />
        </div>

        <p className="device-compatibility__eyebrow">
          VELoop Attendance Portal · Desktop Experience
        </p>

        <h1
          id="device-compatibility-title"
          className="device-compatibility__title"
        >
          A bigger screen.
          <br />A better experience.
        </h1>

        <p className="device-compatibility__description">
          VELoop Attendance is designed for laptop and desktop screens. To keep
          your dashboard clear, accessible, and easy to use, please open the
          platform on a compatible device.
        </p>

        <div className="device-compatibility__requirement">
          <Monitor size={28} color="#7dd3fc" aria-hidden="true" />

          <div style={{ textAlign: "left" }}>
            <strong>Minimum screen width: 1300px</strong>
            <span>
              Open VELoop Attendance on a laptop or desktop with a browser
              viewport at least 1300 pixels wide.
            </span>
          </div>
        </div>

        <p className="device-compatibility__footer">
          Already using a laptop? Maximize your browser window and try again.
          <br />
          Your saved session is preserved.
        </p>

        <button
          type="button"
          className="device-compatibility__close"
          onClick={() => {
            window.close();

            // Show a message if the browser refuses to close the tab.
            setTimeout(() => {
              document
                .getElementById("close-tab-fallback")
                ?.removeAttribute("hidden");
            }, 100);
          }}
        >
          <span aria-hidden="true">×</span>
          Close this tab
        </button>

        <p
          id="close-tab-fallback"
          className="device-compatibility__footer"
          hidden
        >
          Your browser blocked automatic tab closing. Please close this tab
          using the browser's × button.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(getStored);
  const [onboarding, setOnboarding] = useState(null);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("overview");

  // Check viewport compatibility before mounting application screens.
  const [isDesktopCompatible, setIsDesktopCompatible] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);

    const updateCompatibility = (event) => {
      setIsDesktopCompatible(event.matches);
    };

    setIsDesktopCompatible(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateCompatibility);

    return () => {
      mediaQuery.removeEventListener("change", updateCompatibility);
    };
  }, []);

  const [theme, setTheme] = useState(() => {
    const stored = getStored();
    const role = stored?.user?.role || "intern";

    return (
      localStorage.getItem(`vloop-theme-${role}`) ||
      (role === "admin" ? "dark" : "light")
    );
  });

  const inviteToken =
    new URLSearchParams(window.location.search).get("invite") || "";

  const notify = useCallback((message) => {
    setToast(message);
    setError("");
  }, []);

  const acceptSession = useCallback((next) => {
    setSession(next);
    saveStored(next);
    setOnboarding(null);

    const role = next.user.role;
    setTab(role === "admin" ? "overview" : "attendance");

    const nextTheme =
      localStorage.getItem(`vloop-theme-${role}`) ||
      (role === "admin" ? "dark" : "light");

    setTheme(nextTheme);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    saveStored(null);
    setOnboarding(null);
    setGoogleProfile(null);
    setError("");
    setTab("overview");
    setTheme(localStorage.getItem("vloop-theme-intern") || "light");

    navigate("/login", { replace: true });
  }, [navigate]);

  const loginGoogle = async (result) => {
    setBusy(true);
    setError("");

    try {
      const data = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          credential: result.credential,
        }),
      });

      if (data.onboardingRequired && !data.token) {
        setOnboarding(data.onboardingTicket);
        setGoogleProfile(data.googleProfile);
        return;
      }

      if (data.token) {
        acceptSession({
          token: data.token,
          user: data.user,
        });

        if (data.user.role === "intern" && data.onboardingRequired) {
          notify("Complete your intern profile to access attendance.");
        }
      }
    } catch (err) {
      setError(err.message);
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleTheme = useCallback(() => {
    setTheme((oldTheme) => {
      const nextTheme = oldTheme === "dark" ? "light" : "dark";

      const role = session?.user?.role || "intern";

      localStorage.setItem(`vloop-theme-${role}`, nextTheme);

      return nextTheme;
    });
  }, [session]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /*
   * Close a policy page and return to its previous page.
   * Direct policy visits return to the appropriate landing page.
   */
  const closeLegalPage = useCallback(() => {
    const previousPath = location.state?.from;

    if (previousPath && !previousPath.startsWith("/policies/")) {
      navigate(previousPath, { replace: true });
      return;
    }

    if (session?.user?.role === "admin") {
      navigate("/admin/overview", { replace: true });
      return;
    }

    if (session?.user?.role === "intern") {
      navigate("/intern/attendance", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [location.state, navigate, session]);

  /*
   * DEVICE GATE
   *
   * This return must stay before LoginScreen, AdminApp and InternApp.
   * Below 1300px, none of those screen components mount.
   */
  if (!isDesktopCompatible) {
    return <DeviceCompatibilityPage />;
  }

  // Unauthenticated application.
  if (!session) {
    return (
      <div className="app-shell">
        <LoginScreen
          onGoogle={loginGoogle}
          busy={busy}
          error={error}
          notify={notify}
          onboarding={onboarding}
          setOnboarding={setOnboarding}
          googleProfile={googleProfile}
          inviteToken={inviteToken}
          onRegistered={(next) => {
            acceptSession(next);
            notify("Account created. Welcome bonus of 20 InternCash credited.");
          }}
          onAuthenticated={acceptSession}
        />

        <Routes>
          <Route
            path="/policies/:page"
            element={<LegalRoutePage onClose={closeLegalPage} />}
          />
        </Routes>

        <Toast message={toast} onClose={() => setToast("")} />
      </div>
    );
  }

  // Authenticated application.
  return (
    <div className={`app-shell theme-${theme}`}>
      <header className="topbar">
        <Brand />

        <div className="top-actions">
          <span className="badge">
            <ShieldCheck size={12} />

            {session.user.role === "admin"
              ? "AUTHORIZED ADMIN"
              : "VERIFIED INTERN"}
          </span>

          <span className="muted small user-name">{session.user.name}</span>

          <button className="btn btn-ghost" onClick={logout} type="button">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <div className="h-17.5"></div>

      {session.user.role === "admin" ? (
        <AdminApp
          session={session}
          tab={tab}
          setTab={setTab}
          notify={notify}
          onLogout={logout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <InternApp
          session={session}
          tab={tab}
          setTab={setTab}
          notify={notify}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      <Routes>
        <Route
          path="/policies/:page"
          element={<LegalRoutePage onClose={closeLegalPage} />}
        />
      </Routes>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
