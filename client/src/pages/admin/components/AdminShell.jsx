import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CircleHelp,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { NAV_ITEMS } from "../navigation.js";
import styles from "./AdminShell.module.css";

const NAV_GROUPS = [
  {
    title: "COMMAND CENTRE",
    ids: ["overview"],
  },
  {
    title: "PEOPLE & OPERATIONS",
    ids: ["groups", "interns", "approvals", "attendance"],
  },
  {
    title: "FINANCE & ENGAGEMENT",
    ids: ["wallet", "promos", "notifications"],
  },
  {
    title: "CONFIGURATION",
    ids: ["settings"],
  },
];

const QUICK_TABS = ["overview", "interns", "approvals", "wallet"];

const getInitials = (name = "Admin") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

function NavigationItem({
  item,
  active,
  pendingApprovals,
  onNavigate,
  onClose,
}) {
  const Icon = item.Icon;

  return (
    <button
      type="button"
      className={[
        styles.navItem,
        active ? styles.navItemActive : "",
        styles[`tone_${item.id}`] || "",
      ].join(" ")}
      onClick={() => {
        onNavigate(item.id);
        onClose?.();
      }}
      aria-current={active ? "page" : undefined}
    >
      <span className={styles.navIcon}>
        <Icon size={19} strokeWidth={active ? 2.5 : 1.9} />
      </span>

      <span className={styles.navLabel}>{item.label}</span>

      {item.id === "approvals" && pendingApprovals > 0 && (
        <span className={styles.navBadge}>
          {pendingApprovals > 99 ? "99+" : pendingApprovals}
        </span>
      )}

      {active && (
        <span className={styles.activeArrow}>
          <ChevronRight size={15} />
        </span>
      )}
    </button>
  );
}

export default function AdminShell({
  activeTab = "overview",
  onNavigate,
  pendingApprovals = 0,
  refreshing = false,
  onRefresh,
  onLogout,
  session,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const activeItem =
    NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const displayName =
    session?.user?.name ||
    session?.name ||
    session?.user?.email ||
    "Workspace admin";

  const displayRole =
    session?.user?.role === "admin" || session?.role === "admin"
      ? "Administrator"
      : "Operations workspace";

  const initials = getInitials(displayName);

  const filteredGroups = useMemo(() => {
    const term = navSearch.trim().toLowerCase();

    return NAV_GROUPS.map((group) => ({
      ...group,
      items: NAV_ITEMS.filter(
        (item) =>
          group.ids.includes(item.id) &&
          (!term ||
            item.label.toLowerCase().includes(term) ||
            group.title.toLowerCase().includes(term)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [navSearch]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const navigate = (tab) => {
    onNavigate?.(tab);
    setDrawerOpen(false);
  };

  return (
    <div
      className={styles.adminShell}
      data-theme="light"
    >
      {/* DESKTOP SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <span>V</span>
            <span className={styles.brandSpark}>
              <Sparkles size={11} />
            </span>
          </div>

          <div className={styles.brandText}>
            <strong>
              VELOOP<span>.</span>
            </strong>
            <small>ADMIN OPERATIONS</small>
          </div>

          <span className={styles.brandVersion}>HQ</span>
        </div>

        <div className={styles.sidebarIntro}>
          <div className={styles.sidebarIntroIcon}>
            <Command size={15} />
          </div>
          <div>
            <strong>Control centre</strong>
            <span>Manage your internship ecosystem</span>
          </div>
        </div>

        <div className={styles.navSearch}>
          <Search size={16} />
          <input
            type="search"
            value={navSearch}
            onChange={(event) => setNavSearch(event.target.value)}
            placeholder="Find a section..."
            aria-label="Find admin section"
          />
          <kbd>/</kbd>
        </div>

        <nav className={styles.sidebarNav} aria-label="Admin sections">
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <div className={styles.navGroup} key={group.title}>
                <p className={styles.navGroupTitle}>{group.title}</p>

                {group.items.map((item) => (
                  <NavigationItem
                    key={item.id}
                    item={item}
                    active={activeTab === item.id}
                    pendingApprovals={pendingApprovals}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            ))
          ) : (
            <div className={styles.noNavResults}>
              <Search size={18} />
              <span>No matching sections</span>
            </div>
          )}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.securityCard}>
            <div className={styles.securityTop}>
              <span className={styles.securityIcon}>
                <ShieldCheck size={18} />
              </span>
              <span className={styles.securityStatus}>PROTECTED</span>
            </div>
            <strong>Your workspace is secure</strong>
            <p>
              Review attendance, manage interns and keep your programme records
              up to date.
            </p>
          </div>

          <div className={styles.sidebarFooter}>
            <span className={styles.sidebarFooterDot} />
            VELoop Rewards · Admin
            <span>v2</span>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {drawerOpen && (
        <button
          type="button"
          className={styles.drawerBackdrop}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={[
          styles.mobileDrawer,
          drawerOpen ? styles.mobileDrawerOpen : "",
        ].join(" ")}
        aria-hidden={!drawerOpen}
      >
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <span>V</span>
            </div>
            <div className={styles.brandText}>
              <strong>
                VELOOP<span>.</span>
              </strong>
              <small>ADMIN OPERATIONS</small>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeDrawer}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.mobileDrawerIntro}>
          <span>YOUR WORKSPACE</span>
          <strong>Where everything gets done.</strong>
        </div>

        <div className={styles.mobileNavScroll}>
          <nav aria-label="Mobile admin navigation">
            {NAV_GROUPS.map((group) => {
              const items = NAV_ITEMS.filter((item) =>
                group.ids.includes(item.id),
              );

              return (
                <div className={styles.navGroup} key={group.title}>
                  <p className={styles.navGroupTitle}>{group.title}</p>

                  {items.map((item) => (
                    <NavigationItem
                      key={item.id}
                      item={item}
                      active={activeTab === item.id}
                      pendingApprovals={pendingApprovals}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              );
            })}
          </nav>
        </div>

        <div className={styles.mobileDrawerUser}>
          <span className={styles.avatar}>{initials}</span>
          <div>
            <strong>{displayName}</strong>
            <small>{displayRole}</small>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              className={styles.logoutIcon}
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open admin navigation"
              aria-expanded={drawerOpen}
            >
              <Menu size={21} />
            </button>

            <div className={styles.breadcrumb}>
              <span>VELOOP</span>
              <ChevronRight size={14} />
              <strong>{activeItem.label}</strong>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.workspaceStatus}>
              <span className={styles.workspaceStatusDot} />
              <span>ADMIN WORKSPACE</span>
            </div>

            <button
              type="button"
              className={styles.headerIconButton}
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh workspace data"
              title="Refresh data"
            >
              <RefreshCw
                size={18}
                className={refreshing ? styles.refreshSpin : ""}
              />
            </button>


            <div className={styles.topbarDivider} />

            <div className={styles.account}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.accountText}>
                <strong>{displayName}</strong>
                <span>{displayRole}</span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                className={styles.logoutButton}
                onClick={onLogout}
                title="Sign out"
              >
                <LogOut size={17} />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </header>

        <div className={styles.mobileContext}>
          <div>
            <span>YOUR WORKSPACE</span>
            <strong>{activeItem.label}</strong>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh page data"
          >
            <RefreshCw
              size={17}
              className={refreshing ? styles.refreshSpin : ""}
            />
          </button>
        </div>

        <main className={`${styles.main} min-h-[90vh]`}>
          <div className={styles.pageFrame}>{children}</div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <span className={styles.footerMark}>V</span>
            <span>
              VELOOP <b>REWARDS</b>
            </span>
          </div>

          <span className={styles.footerMessage}>
            Built for better internship operations.
          </span>

          <div className={styles.footerRight}>
            <ShieldCheck size={14} />
            <span>Secure admin environment</span>
          </div>
        </footer>
      </div>

      {/* MOBILE QUICK NAVIGATION */}
      <nav className={styles.mobileDock} aria-label="Quick admin navigation">
        {QUICK_TABS.map((id) => {
          const item = NAV_ITEMS.find((entry) => entry.id === id);
          if (!item) return null;

          const Icon = item.Icon;
          const active = activeTab === id;

          return (
            <button
              type="button"
              key={id}
              className={active ? styles.dockItemActive : styles.dockItem}
              onClick={() => navigate(id)}
              aria-current={active ? "page" : undefined}
            >
              <span>
                <Icon size={19} />
              </span>
              <small>
                {id === "approvals" ? "Review" : item.label.split(" ")[0]}
              </small>
              {id === "approvals" && pendingApprovals > 0 && (
                <i>{pendingApprovals > 9 ? "9+" : pendingApprovals}</i>
              )}
            </button>
          );
        })}

        <button
          type="button"
          className={styles.dockItem}
          onClick={() => setDrawerOpen(true)}
        >
          <span>
            <LayoutDashboard size={19} />
          </span>
          <small>More</small>
        </button>
      </nav>
    </div>
  );
}
