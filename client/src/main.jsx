import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { api, tokenStore } from "./api/client";
import { ToastProvider } from "./components/Toast/Toast";
import Loader from "./components/Loader/Loader";
import Shell from "./components/Shell/Shell";
import Login from "./pages/Login/Login";
import Register from "./pages/Register";
import InternDashboard from "./pages/InternDashboard/InternDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import Attendance from "./pages/Attendance/Attendance";
import Manage from "./pages/Manage/Manage";
import PublicPolicies from "./pages/PublicPolicies";
import "./styles/global.css";
import CompatibilityErrorPage from "./compatibility/CompatibilityErrorPage";

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));
  const location = useLocation();

  // Minimum screen-width detection
  const [isBelow1300, setIsBelow1300] = useState(
    () => window.innerWidth < 1300,
  );

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsBelow1300(window.innerWidth < 1300);
    };

    window.addEventListener("resize", checkScreenWidth);

    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!tokenStore.get()) {
      setChecking(false);
      return () => {
        active = false;
      };
    }
    api("/auth/me")
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        tokenStore.clear();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const brand = import.meta.env.VITE_BRAND_NAME || "VELoop Rewards";
    document.title = `${brand} · Internship workspace`;
  }, [location.pathname]);

  if (checking) return <Loader label="Preparing your secure workspace…" />;

  // Only the admin role bypasses the screen-width restriction.
  const isAdmin = user?.role === "admin";

  // Login and policy pages remain accessible.
  const isAllowedPublicPage =
    location.pathname === "/login" || location.pathname === "/policies";

  // Block authenticated non-admin users below 1300px.
  const shouldShowCompatibilityError =
    Boolean(user) && !isAdmin && isBelow1300 && !isAllowedPublicPage;

  // Display the compatibility page instead of the dashboard.
  if (shouldShowCompatibilityError) {
    return <CompatibilityErrorPage />;
  }

  const home = user?.role === "admin" ? "/admin" : "/intern/dashboard";
  const privateShell = user ? (
    <Shell user={user} onLogout={() => setUser(null)} />
  ) : (
    <Navigate to={`/login${location.search || ""}`} replace />
  );

  const [googleVerified, setGoogleVerified] = useState(
    () => sessionStorage.getItem("vlr_google_verified") === "true",
  );
  const login = (
    <Login onGoogleVerified={() => setGoogleVerified(true)} onLogin={setUser} />
  );

  return (
    <Routes>
      {/* <Route
        path="/login"
        element={user ? <Navigate to={home} replace /> : login}
      /> */}

      <Route
        path="/login"
        element={
          user && !(isBelow1300 && !isAdmin) ? (
            <Navigate to={home} replace />
          ) : (
            login
          )
        }
      />

      {/* <Route
        path="/register"
        element={
          user ? <Navigate to={home} replace /> : <Register onLogin={setUser} />
        }
      /> */}

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={home} replace />
          ) : googleVerified &&
            sessionStorage.getItem("vlr_google_verified") === "true" &&
            sessionStorage.getItem("vlr_onboarding_ticket") &&
            sessionStorage.getItem("vlr_google_profile") ? (
            <Register onLogin={setUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/policies" element={<PublicPolicies />} />

      <Route element={privateShell}>
        <Route
          path="/intern"
          element={<Navigate to="/intern/dashboard" replace />}
        />
        <Route
          path="/intern/dashboard"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <InternDashboard user={user} />
            )
          }
        />
        <Route
          path="/intern/attendance"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin/attendance" replace />
            ) : (
              <Attendance user={user} />
            )
          }
        />
        <Route
          path="/intern/wallet"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Manage user={user} />
            )
          }
        />

        <Route
          path="/intern/certification"
          element={
            // <CertificatePage />
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Manage user={user} />
            )
          }
        />

        <Route
          path="/intern/promos"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Manage user={user} />
            )
          }
        />
        <Route
          path="/intern/notification"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Manage user={user} />
            )
          }
        />
        <Route
          path="/intern/notifications"
          element={<Navigate to="/intern/notification" replace />}
        />
        <Route
          path="/intern/account"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Manage user={user} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/groups"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/approvals"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/interns"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/attendance"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/wallet"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/promos"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/notifications"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/settings"
          element={
            user?.role === "admin" ? (
              <Manage user={user} />
            ) : (
              <Navigate to="/intern/dashboard" replace />
            )
          }
        />
      </Route>

      {/* Backwards-compatible paths for bookmarks from the previous portal. */}
      <Route
        path="/dashboard"
        element={<Navigate to={user ? home : "/login"} replace />}
      />
      <Route
        path="/attendance"
        element={
          <Navigate
            to={
              user
                ? user.role === "admin"
                  ? "/admin/attendance"
                  : "/intern/attendance"
                : "/login"
            }
            replace
          />
        }
      />
      <Route
        path="/wallet"
        element={<Navigate to={user ? "/intern/wallet" : "/login"} replace />}
      />
      <Route
        path="/promos"
        element={<Navigate to={user ? "/intern/promos" : "/login"} replace />}
      />
      <Route
        path="/notifications"
        element={
          <Navigate to={user ? "/intern/notification" : "/login"} replace />
        }
      />
      <Route
        path="/account"
        element={<Navigate to={user ? "/intern/account" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={user ? home : "/login"} replace />}
      />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>,
);
