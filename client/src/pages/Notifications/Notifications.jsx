import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Inbox,
  ArrowUpRight,
  CircleCheck,
  Search,
  CheckCircle2,
  X,
  ShieldCheck,
  CalendarDays,
  Link2,
  Eye,
  MessageSquareText,
  CircleDot,
  FileText,
  Copy,
} from "lucide-react";
import { createPortal } from "react-dom";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";
import styles from "./Notifications.module.css";

const formatNotificationDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRelativeTime = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const difference = Date.now() - date.getTime();

  if (difference < 0) return formatNotificationDate(value);

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const safeExternalUrl = (value) => {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (!["https:", "http:"].includes(url.protocol)) return "";

    return url.href;
  } catch {
    return "";
  }
};

export default function Notifications() {
  const notify = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notifications
      .filter((item) => {
        if (filter === "unread" && item.isRead) return false;
        if (filter === "read" && !item.isRead) return false;

        if (query) {
          const searchableText = [item.title, item.message, item.link]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!searchableText.includes(query)) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  }, [notifications, filter, searchQuery]);

  const activeNotification = selectedNotification
    ? notifications.find((item) => item._id === selectedNotification._id) ||
      selectedNotification
    : null;

  const closeNotification = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await api("/notifications/mine");

        setNotifications(
          Array.isArray(response.notifications) ? response.notifications : [],
        );

        setLoadError("");

        if (isRefresh) {
          notify("Notifications refreshed.");
        }
      } catch (error) {
        setLoadError(error.message || "Unable to load notifications.");
        notify(error.message || "Unable to load notifications.", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markNotificationRead = async (notification) => {
    if (!notification?._id || notification.isRead) return;

    try {
      await api(`/notifications/${notification._id}/read`, {
        method: "POST",
        body: {},
      });

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      notify(error.message || "Unable to mark notification as read.", "error");
    }
  };

  const openNotification = async (notification) => {
    setSelectedNotification(notification);

    if (!notification.isRead) {
      await markNotificationRead(notification);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((item) => !item.isRead && item._id);

    if (!unread.length || markingAll) return;

    setMarkingAll(true);

    const successfulIds = [];
    let failed = 0;

    try {
      // Use the existing endpoint for every unread notification.
      for (const item of unread) {
        try {
          await api(`/notifications/${item._id}/read`, {
            method: "POST",
            body: {},
          });

          successfulIds.push(item._id);
        } catch {
          failed += 1;
        }
      }

      if (successfulIds.length) {
        setNotifications((current) =>
          current.map((item) =>
            successfulIds.includes(item._id) ? { ...item, isRead: true } : item,
          ),
        );
      }

      if (failed === 0) {
        notify(
          `All ${successfulIds.length} unread notifications marked as read.`,
        );
      } else {
        notify(
          `${successfulIds.length} marked as read. ${failed} could not be updated.`,
          "error",
        );
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      notify("Notification link copied.");
    } catch {
      notify("Unable to copy the link automatically.", "error");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilter("all");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
        {/* PAGE HEADING */}

        <section
          className={`${styles.hero} relative overflow-hidden rounded-3xl p-5 shadow-sm sm:p-7 lg:p-8`}
        >
          <div aria-hidden="true" className={styles.heroAura} />

          <div aria-hidden="true" className={styles.heroAuraSecondary} />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className={styles.officialBadge}>
                <span className={styles.pulseDot} />
                Official group updates
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-[#172f23] sm:text-4xl">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className={styles.newCount}>
                    <Bell size={13} />
                    {unreadCount} new
                  </span>
                )}
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#526457] sm:text-[15px]">
                Stay up to date with internship announcements, important
                reminders, deadlines, and messages from your VELoop
                administrators.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={styles.heroTag}>
                  <ShieldCheck size={14} />
                  Official communication
                </span>

                <span className={styles.heroTag}>
                  <CheckCircle2 size={14} />
                  {readCount} reviewed
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => loadNotifications(true)}
                disabled={refreshing}
                className={styles.refreshButton}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing…" : "Refresh updates"}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className={styles.markAllButton}
                >
                  <CheckCheck size={16} />
                  {markingAll ? "Updating…" : "Mark all as read"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={Inbox}
            label="Total notifications"
            value={notifications.length}
            description="All available group updates"
            iconClass={styles.iconBlue}
            highlightClass={styles.statBlue}
          />

          <StatCard
            icon={Bell}
            label="Unread updates"
            value={unreadCount}
            description={
              unreadCount > 0
                ? "Waiting for your attention"
                : "You're all caught up"
            }
            iconClass={styles.iconGreen}
            highlightClass={unreadCount > 0 ? styles.statGreen : ""}
          />

          <StatCard
            icon={CircleCheck}
            label="Read notifications"
            value={readCount}
            description="Updates you've reviewed"
            iconClass={styles.iconViolet}
            highlightClass={styles.statViolet}
          />
        </section>

        {/* NOTIFICATION WORKSPACE */}

        <section className="overflow-hidden rounded-3xl border border-[#d7e2d5] bg-white shadow-sm">
          <div className="border-b border-[#d7e2d5] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className={styles.workspaceIcon}>
                    <Inbox size={18} />
                  </div>

                  <h2 className="text-lg font-extrabold text-[#172f23] sm:text-xl">
                    Your updates
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-6 text-[#526457] sm:text-sm">
                  Select any notification to view its complete message and
                  shared resources.
                </p>
              </div>

              <div className={styles.searchWrap}>
                <Search
                  size={17}
                  className={styles.searchIcon}
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search notifications…"
                  aria-label="Search notifications"
                  className={styles.searchInput}
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className={styles.clearSearch}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div
              className={styles.filters}
              role="group"
              aria-label="Filter notifications"
            >
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="All updates"
                count={notifications.length}
                color="green"
              />

              <FilterButton
                active={filter === "unread"}
                onClick={() => setFilter("unread")}
                label="Unread"
                count={unreadCount}
                color="amber"
              />

              <FilterButton
                active={filter === "read"}
                onClick={() => setFilter("read")}
                label="Read"
                count={readCount}
                color="violet"
              />
            </div>
          </div>

          {loading ? (
            <NotificationSkeleton />
          ) : loadError && notifications.length === 0 ? (
            <ErrorState
              message={loadError}
              onRetry={() => loadNotifications()}
            />
          ) : filteredNotifications.length > 0 ? (
            <div className={styles.notificationList}>
              {filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification._id || `${notification.createdAt}-${index}`}
                  notification={notification}
                  onOpen={openNotification}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              hasNotifications={notifications.length > 0}
              hasSearch={Boolean(searchQuery.trim())}
              filter={filter}
              onClear={handleClearFilters}
            />
          )}

          {!loading && filteredNotifications.length > 0 && (
            <div className={styles.listFooter}>
              <span>
                Showing {filteredNotifications.length} of {notifications.length}{" "}
                updates
              </span>

              <span className={styles.footerTrust}>
                <ShieldCheck size={15} />
                Official VELoop communication
              </span>
            </div>
          )}
        </section>
      </div>

      {/* NOTIFICATION DETAILS */}

      {activeNotification &&
        typeof document !== "undefined" &&
        createPortal(
          <NotificationDetailsModal
            notification={activeNotification}
            onClose={closeNotification}
            onMarkRead={markNotificationRead}
            onCopyLink={handleCopyLink}
          />,
          document.body,
        )}
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  highlightClass = "",
}) {
  return (
    <article
      className={`${styles.statCard} ${highlightClass} group rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#526457]">{label}</p>

          <p className="mt-2 text-3xl font-black tracking-tight text-[#172f23] sm:text-4xl">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-[#526457]">{description}</p>
        </div>

        <div className={`${styles.statIcon} ${iconClass}`}>
          <Icon size={21} strokeWidth={2.1} />
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({ active, onClick, label, count, color }) {
  const colorClass =
    color === "amber"
      ? styles.filterAmber
      : color === "violet"
        ? styles.filterViolet
        : styles.filterGreen;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.filterButton} ${active ? colorClass : ""}`}
    >
      {label}

      <span className={styles.filterCount}>{count}</span>
    </button>
  );
}

/* =========================================================
   NOTIFICATION CARD
========================================================= */

function NotificationCard({ notification, onOpen }) {
  const isUnread = !notification.isRead;
  const externalUrl = safeExternalUrl(notification.link);

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      aria-label={`View notification: ${notification.title || "Notification"}`}
      className={`${styles.notificationCard} ${isUnread ? styles.unreadCard : styles.readCard}`}
    >
      {isUnread && <span className={styles.unreadRail} />}

      <div className={styles.cardContent}>
        <div
          className={`${styles.notificationIcon} ${
            isUnread
              ? styles.notificationIconUnread
              : styles.notificationIconRead
          }`}
        >
          <Bell size={21} strokeWidth={2} />

          {isUnread && <span className={styles.unreadDot} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className={styles.notificationHeader}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`${styles.notificationTitle} ${
                    isUnread ? styles.unreadTitle : ""
                  }`}
                >
                  {notification.title || "Notification"}
                </h3>

                {isUnread && (
                  <span className={styles.newBadge}>
                    <span />
                    NEW
                  </span>
                )}
              </div>

              <p className={styles.messagePreview}>
                {notification.message || "No message content provided."}
              </p>
            </div>

            <div className={styles.timestamp}>
              <Clock3 size={14} />
              <time dateTime={notification.createdAt || undefined}>
                {getRelativeTime(notification.createdAt)}
              </time>
            </div>
          </div>

          <div className={styles.cardBottom}>
            <div className={styles.cardMetadata}>
              <span
                className={`${styles.readStatus} ${
                  isUnread ? styles.statusUnread : styles.statusRead
                }`}
              >
                {isUnread ? <CircleDot size={14} /> : <CheckCheck size={14} />}

                {isUnread ? "Unread" : "Read"}
              </span>

              {externalUrl && (
                <span className={styles.linkHint}>
                  <Link2 size={14} />
                  Contains a link
                </span>
              )}
            </div>

            <span className={styles.viewDetails}>
              View details
              <ArrowUpRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function NotificationDetailsModal({
  notification,
  onClose,
  onMarkRead,
  onCopyLink,
}) {
  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);

  const isUnread = !notification.isRead;
  const externalUrl = safeExternalUrl(notification.link);

  // Keep the latest close handler without restarting the scroll lock.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // This component is responsible for scroll locking.
  // Do not add another scroll-lock effect in the parent component.
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = html.style.overflow;

    const previousFocus = document.activeElement;

    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

    const computedPadding =
      Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    // Lock background scrolling and prevent horizontal layout shifts.
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${computedPadding + scrollbarWidth}px`;
    }

    const focusableSelector = [
      "a[href]",
      "button:not(:disabled)",
      "input:not(:disabled)",
      "select:not(:disabled)",
      "textarea:not(:disabled)",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll(focusableSelector),
      ).filter((element) => element.getClientRects().length > 0);

      if (!focusableElements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !modal.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (current === last || !modal.contains(current))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);

      // Restore the exact styles that existed before the modal opened.
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      html.style.overflow = previousHtmlOverflow;

      // Restore focus without moving the page unexpectedly.
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
        tabIndex={-1}
        className={styles.modal}
      >
        {/* Modal header */}

        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTop}>
            <div className="flex items-center justify-center">
              <div className={styles.modalIcon}>
                <Bell size={24} strokeWidth={2.2} />
              </div>
              <div className="ms-4 flex flex-wrap justify-center items-center gap-2">
                <span className={styles.officialModalBadge}>
                  <ShieldCheck size={13} />
                  Official notification
                </span>

                <span
                  className={`${styles.modalStatus} ${
                    isUnread ? styles.modalUnread : styles.modalRead
                  }`}
                >
                  {isUnread ? (
                    <CircleDot size={12} />
                  ) : (
                    <CheckCheck size={12} />
                  )}

                  {isUnread ? "Unread" : "Read"}
                </span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => onCloseRef.current?.()}
              aria-label="Close notification details"
              className={styles.modalClose}
            >
              <X size={18} />
            </button>
          </div>

          <h2 id="notification-modal-title" className={styles.modalTitle}>
            {notification.title || "Notification details"}
          </h2>

          <p className={styles.modalDescription}>
            Review the full announcement and any attached links below.
          </p>
        </div>

        {/* Independently scrollable content */}

        <div className={styles.modalContent}>
          <div className={styles.metadataGrid}>
            <MetadataCard
              icon={CalendarDays}
              variant="green"
              label="Published on"
              value={formatNotificationDate(notification.createdAt)}
            />

            <MetadataCard
              icon={Clock3}
              variant="blue"
              label="Time since published"
              value={getRelativeTime(notification.createdAt)}
            />
          </div>

          {/* Full message */}

          <section className={styles.detailPanel}>
            <div className={styles.panelHeading}>
              <div className={`${styles.panelIcon} ${styles.panelIconGreen}`}>
                <MessageSquareText size={18} />
              </div>

              <div>
                <h3>Full message</h3>
                <p>Complete notification content</p>
              </div>
            </div>

            <div className={styles.messageText}>
              {notification.message || "No message content provided."}
            </div>
          </section>

          {/* Shared resources */}

          <section className={styles.detailPanel}>
            <div className={styles.panelHeading}>
              <div className={`${styles.panelIcon} ${styles.panelIconBlue}`}>
                <Link2 size={18} />
              </div>

              <div>
                <h3>Shared resources</h3>
                <p>Links attached to this notification</p>
              </div>
            </div>

            <div className={styles.resourceContent}>
              {externalUrl ? (
                <div className={styles.resourceBox}>
                  <div className={styles.resourceIcon}>
                    <ExternalLink size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={styles.resourceTitle}>Shared link</p>

                    <p className={styles.resourceUrl}>{externalUrl}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.openResourceButton}
                      >
                        Open shared resource
                        <ArrowUpRight size={15} />
                      </a>

                      <button
                        type="button"
                        onClick={() => onCopyLink(externalUrl)}
                        className={styles.copyLinkButton}
                      >
                        <Copy size={14} />
                        Copy link
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.noLink}>
                  <FileText size={21} />

                  <div>
                    <p>No shared links</p>
                    <span>
                      This notification does not include an attached link.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Read status */}

          <div className={styles.readNotice}>
            <div
              className={`${styles.readNoticeIcon} ${
                isUnread ? styles.noticePending : styles.noticeComplete
              }`}
            >
              {isUnread ? <Eye size={18} /> : <CheckCheck size={18} />}
            </div>

            <div>
              <p>
                {isUnread ? "Awaiting your attention" : "Already acknowledged"}
              </p>

              <span>
                {isUnread
                  ? "This notification is currently unread. You can mark it as read below."
                  : "This notification is marked as read in your notification list."}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed footer */}

        <div className={styles.modalFooter}>
          <div className={styles.footerTrust}>
            <ShieldCheck size={16} />
            <span>VELoop Rewards · Official communication</span>
          </div>

          <div className={styles.modalActions}>
            {isUnread && (
              <button
                type="button"
                onClick={() => onMarkRead(notification)}
                className={styles.modalMarkRead}
              >
                <Check size={16} />
                Mark as read
              </button>
            )}

            <button
              type="button"
              onClick={() => onCloseRef.current?.()}
              className={styles.modalDone}
            >
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MODAL METADATA CARD
========================================================= */

function MetadataCard({ icon: Icon, label, value, variant }) {
  const iconClass =
    variant === "blue" ? styles.metadataIconBlue : styles.metadataIconGreen;

  return (
    <div className={styles.metadataCard}>
      <div className={`${styles.metadataIcon} ${iconClass}`}>
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ hasNotifications, hasSearch, filter, onClear }) {
  const title = hasSearch
    ? "No matching notifications"
    : hasNotifications
      ? "Nothing in this filter"
      : "You're all caught up";

  const description = hasSearch
    ? "Try a different search term or clear the filters."
    : hasNotifications
      ? filter === "unread"
        ? "You have no unread notifications. Check back for new updates."
        : "There are no read notifications in this list yet."
      : "New group announcements and important internship updates will appear here.";

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        {hasSearch ? <Search size={29} /> : <Bell size={29} />}

        <span>{hasSearch ? <X size={14} /> : <Sparkles size={15} />}</span>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {(hasSearch || hasNotifications) && (
        <button
          type="button"
          onClick={onClear}
          className={styles.clearFiltersButton}
        >
          <RefreshCw size={15} />
          Clear filters
        </button>
      )}
    </div>
  );
}

/* =========================================================
   ERROR STATE
========================================================= */

function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.emptyState}>
      <div className={`${styles.emptyIcon} ${styles.errorIcon}`}>
        <Bell size={28} />
      </div>

      <h3>Couldn't load notifications</h3>
      <p>{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className={styles.clearFiltersButton}
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

/* =========================================================
   SKELETON LOADING
========================================================= */

function NotificationSkeleton() {
  return (
    <div className={styles.skeletonList} aria-label="Loading notifications">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonIcon} />

          <div className="min-w-0 flex-1">
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonTextShort} />
            <div className={styles.skeletonBottom} />
          </div>
        </div>
      ))}
    </div>
  );
}
