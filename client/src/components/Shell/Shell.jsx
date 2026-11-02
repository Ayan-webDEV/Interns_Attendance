import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Layers3,
  Wallet,
  TicketPercent,
  Bell,
  Settings2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  UserRound,
  ClipboardCheck,
  FileCheck2,
  ChevronRight,
  Sparkles,
  CircleHelp,
  Award,
  Search,
  Command,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { tokenStore } from "../../api/client";
import styles from "./Shell.module.css";

const internLinks = [
  { to: "/intern/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/intern/attendance", label: "Attendance", icon: CalendarDays },
  { to: "/intern/wallet", label: "InternCash", icon: Wallet },
  { to: "/intern/notification", label: "Notifications", icon: Bell },
  { to: "/intern/certification", label: "Certification", icon: Award },
  { to: "/intern/promos", label: "Promo rewards", icon: TicketPercent },
  { to: "/intern/account", label: "My account", icon: UserRound },
];
const adminLinks = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/groups", label: "Internship groups", icon: Layers3 },
  {
    to: "/admin/approvals",
    label: "Attendance approvals",
    icon: ClipboardCheck,
    marker: true,
  },
  { to: "/admin/interns", label: "Intern directory", icon: Users },
  { to: "/admin/attendance", label: "Attendance records", icon: CalendarDays },
  { to: "/admin/wallet", label: "Wallet ledger", icon: Wallet },
  { to: "/admin/promos", label: "Promo codes", icon: TicketPercent },
  { to: "/admin/notifications", label: "Broadcasts", icon: Bell },
  { to: "/admin/settings", label: "Portal settings", icon: Settings2 },
];

const pathLabels = {
  "/intern/dashboard": "Overview",
  "/intern/attendance": "Attendance",
  "/intern/wallet": "InternCash",
  "/intern/promos": "Promo rewards",
  "/intern/notification": "Notifications",
  "/intern/account": "My account",
  "/admin": "Overview",
  "/admin/groups": "Internship groups",
  "/admin/approvals": "Attendance approvals",
  "/admin/interns": "Intern directory",
  "/admin/attendance": "Attendance records",
  "/admin/wallet": "Wallet ledger",
  "/admin/promos": "Promo codes",
  "/admin/notifications": "Broadcasts",
  "/admin/settings": "Portal settings",
};

export default function Shell({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Saved profile picture
  const [profilePicture, setProfilePicture] = useState("");

  // const profilePictureKey = `vlr_profile_picture_${
  //   user?.id || user?.email || "intern"
  // }`;

  const profilePictureKey = `vlr_profile_picture_${
    user?.id || user?._id || user?.email || "intern"
  }`;

  const nav = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const brand = import.meta.env.VITE_BRAND_NAME || "VELoop Rewards";
  const links = isAdmin ? adminLinks : internLinks;
  const currentTitle = useMemo(
    () => pathLabels[location.pathname] || "Workspace",
    [location.pathname],
  );
  const firstName = (user?.name || (isAdmin ? "Admin" : "Intern")).split(
    " ",
  )[0];

  /* ---------------------------------------------------------
   Load and synchronize profile picture
--------------------------------------------------------- */

  useEffect(() => {
    const loadProfilePicture = () => {
      try {
        const image = window.localStorage.getItem(profilePictureKey);
        setProfilePicture(image || "");
      } catch {
        setProfilePicture("");
      }
    };

    // Load saved image
    loadProfilePicture();

    // Listen for changes from Account.jsx in the same tab
    window.addEventListener("vlr-profile-picture-updated", loadProfilePicture);

    // Listen for changes from other browser tabs
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

  /* ---------------------------------------------------------
     Role-based footer links
  --------------------------------------------------------- */

  const footerPrimaryLinks = isAdmin
    ? [
        { to: "/admin", label: "Overview" },
        { to: "/admin/groups", label: "Internship groups" },
        { to: "/admin/approvals", label: "Attendance approvals" },
        { to: "/admin/attendance", label: "Attendance records" },
      ]
    : [
        { to: "/intern/dashboard", label: "Overview" },
        { to: "/intern/attendance", label: "Attendance" },
        { to: "/intern/wallet", label: "InternCash" },
        { to: "/intern/certification", label: "Certification" },
      ];

  const footerSecondaryLinks = isAdmin
    ? [
        { to: "/admin/interns", label: "Intern directory" },
        { to: "/admin/wallet", label: "Wallet ledger" },
        { to: "/admin/promos", label: "Promo codes" },
        { to: "/admin/notifications", label: "Broadcasts" },
        { to: "/admin/settings", label: "Portal settings" },
      ]
    : [
        { to: "/intern/notification", label: "Notifications" },
        { to: "/intern/promos", label: "Promo rewards" },
        { to: "/intern/account", label: "My account" },
      ];

  const signOut = () => {
    tokenStore.clear();
    onLogout?.();
    nav("/login", { replace: true });
  };

  return (
    <div className={styles.app}>
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ""}`}>
        <div className={styles.brandRow}>
          <div className={styles.logoMark}>
            <div className="h-10 w-10 bg-contain">
              <img
                src="/LOGO.jpeg"
                className="rounded-xl bg-contain"
                alt="VELoop LOGO"
              />
            </div>
            {/* <span>V</span> */}
            <i />
          </div>
          <div className={styles.brandCopy}>
            <b>{brand}</b>
            <span>PEOPLE & PROGRAMS</span>
          </div>
          <button
            className={styles.close}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className={styles.workspaceCard}>
          <div className={styles.workspaceOrb}>
            <Sparkles size={16} />
          </div>
          <div className={styles.workspaceMeta}>
            <span>YOUR WORKSPACE</span>
            <b>{isAdmin ? "Programme operations" : "Internship journey"}</b>
          </div>
          <span className={styles.liveDot} title="Secure session" />
        </div>

        <nav className={styles.nav} aria-label="Primary navigation">
          <p className={styles.navLabel}>
            {isAdmin ? "OPERATIONS" : "MY JOURNEY"}
          </p>
          {links
            .slice(0, isAdmin ? 5 : 2)
            .map(({ to, label, icon: Icon, end, marker }) => (
              <NavLink
                key={to}
                end={end}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ""}`
                }
              >
                <span className={styles.navIcon}>
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <span className={styles.navText}>{label}</span>
                {marker && <span className={styles.navMarker} />}
                {location.pathname === to && (
                  <ChevronRight size={15} className={styles.navChevron} />
                )}
              </NavLink>
            ))}
          {isAdmin && <p className={styles.navLabel}>PEOPLE & REWARDS</p>}
          {links
            .slice(isAdmin ? 5 : 2)
            .map(({ to, label, icon: Icon, end, marker }) => (
              <NavLink
                key={to}
                end={end}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ""}`
                }
              >
                <span className={styles.navIcon}>
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <span className={styles.navText}>{label}</span>
                {marker && <span className={styles.navMarker} />}
                {location.pathname === to && (
                  <ChevronRight size={15} className={styles.navChevron} />
                )}
              </NavLink>
            ))}
          <p className={styles.navLabel}>SUPPORT</p>
          <NavLink
            to="/policies"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.navIcon}>
              <CircleHelp size={18} strokeWidth={1.9} />
            </span>
            <span className={styles.navText}>Help & policies</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.securityCard}>
            <div className={styles.securityIcon}>
              <ShieldCheck size={17} />
            </div>
            <div>
              <b>Private by design</b>
              <span>Your workspace is protected</span>
            </div>
          </div>
          <button className={styles.logout} onClick={signOut}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
          <div className={styles.sidebarFine}>
            © {new Date().getFullYear()} {brand}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className={styles.scrim}
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              className={styles.menu}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className={styles.breadcrumb}>
              <span>{isAdmin ? "Operations" : "My workspace"}</span>
              <ChevronRight size={14} />
              <b>{currentTitle}</b>
            </div>
          </div>
          <div className={styles.topActions}>
            <div className={styles.securePill}>
              <span />
              <ShieldCheck size={14} /> Secure portal
            </div>
            <div className={styles.topDivider} />
            <div className={styles.userMenu}>
              <div className={styles.topAvatar}>
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={`${user?.name || "User"} profile`}
                  />
                ) : (
                  <span>{firstName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className={styles.userMeta}>
                <b>{user?.name || "Workspace user"}</b>
                <span>
                  {isAdmin
                    ? "Administrator"
                    : user?.internId || "Intern account"}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className={styles.content} key={location.pathname}>
          <Outlet />
        </main>
        {/* <footer className={styles.footer}>
          <span>Made for meaningful work, one day at a time.</span>
          <div>
            <NavLink to="/policies#privacy">Privacy</NavLink>
            <NavLink to="/policies#terms">Terms</NavLink>
            <NavLink to="/policies#refund">Charges & refunds</NavLink>
          </div>
        </footer> */}
        {/* =====================================================
             PREMIUM FOOTER
        ===================================================== */}

        <footer className={styles.footer}>
          <div className={styles.footerGlow} aria-hidden="true" />

          <div className={styles.footerInner}>
            <div className={styles.footerTop}>
              {/* BRAND SECTION */}
              <div className={styles.footerBrandBlock}>
                <NavLink
                  to={isAdmin ? "/admin" : "/intern/dashboard"}
                  className={styles.footerBrand}
                  aria-label="VELoop Rewards home"
                >
                  <span className={styles.footerLogoWrap}>
                    <img src="/LOGO.jpeg" alt="VELoop logo" />
                  </span>

                  <span className={styles.footerBrandCopy}>
                    <b>VELoop Rewards</b>
                    <small>PEOPLE & PROGRAMS</small>
                  </span>
                </NavLink>

                <p className={styles.footerTagline}>
                  Made for meaningful work, one day at a time.
                </p>

                <div className={styles.footerPromise}>
                  <span className={styles.footerPromiseDot} />
                  <span>Every step is part of your growth</span>
                </div>
              </div>

              {/* FOOTER NAVIGATION */}
              <div className={styles.footerLinkGroups}>
                <nav
                  className={styles.footerColumn}
                  aria-label="Workspace links"
                >
                  <h3>{isAdmin ? "Operations" : "Your workspace"}</h3>

                  {footerPrimaryLinks.map((link) => (
                    <NavLink key={link.to} to={link.to}>
                      {link.label}
                      <span aria-hidden="true">↗</span>
                    </NavLink>
                  ))}
                </nav>

                <nav
                  className={styles.footerColumn}
                  aria-label="More platform links"
                >
                  <h3>{isAdmin ? "Management" : "Explore more"}</h3>

                  {footerSecondaryLinks.map((link) => (
                    <NavLink key={link.to} to={link.to}>
                      {link.label}
                      <span aria-hidden="true">↗</span>
                    </NavLink>
                  ))}
                </nav>

                <nav
                  className={styles.footerColumn}
                  aria-label="Policies and support"
                >
                  <h3>Policies & support</h3>

                  <NavLink to="/policies">
                    Help & policies
                    <span aria-hidden="true">↗</span>
                  </NavLink>

                  <NavLink to="/policies#privacy">
                    Privacy
                    <span aria-hidden="true">↗</span>
                  </NavLink>

                  <NavLink to="/policies#terms">
                    Terms
                    <span aria-hidden="true">↗</span>
                  </NavLink>

                  <NavLink to="/policies#refund">
                    Charges & refunds
                    <span aria-hidden="true">↗</span>
                  </NavLink>
                </nav>
              </div>
            </div>

            {/* FOOTER BOTTOM BAR */}
            <div className={styles.footerBottom}>
              <span>
                © {new Date().getFullYear()} VELoop Rewards. All rights
                reserved.
              </span>

              <span className={styles.footerBottomNote}>
                <span className={styles.footerBottomDot} />
                Built for learning, progress & opportunity
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
