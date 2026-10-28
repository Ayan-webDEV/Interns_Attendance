import { useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, ShieldCheck } from "lucide-react";

import LoginScreen from "./components/auth/LoginScreen.jsx";
import { Brand, Toast } from "./components/ui/Primitives.jsx";
import AdminApp from "./pages/admin/AdminApp.jsx";
import InternApp from "./pages/intern/InternApp.jsx";
import { api } from "./lib/api.js";
import { getStored, saveStored } from "./lib/session.js";
import { LegalFooter, LegalRoutePage } from "./components/legal/LegalPages.jsx";

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
   * Close a policy page and return to the page from which it was opened.
   * When a policy URL is opened directly, use the user's normal landing page.
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

  return (
    <div className={`app-shell theme-${theme}`}>
      {/* Shared navbar stays visible on all policy routes. */}
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

      {/* Existing dashboard, sidebar and page content are preserved. */}
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

      {/* Shared footer stays in the same place. */}
      {/* <LegalFooter /> */}

      {/* All four policy pages have independent React Router URLs. */}
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
