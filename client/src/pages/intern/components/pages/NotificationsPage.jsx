import React, { useEffect, useMemo, useState } from "react";
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
  X,
  ShieldCheck,
  CalendarDays,
  Link2,
  Eye,
  MessageSquareText,
  CircleDot,
  FileText,
} from "lucide-react";

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

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1 && minutes >= 0) return "Just now";
  if (minutes < 60 && minutes >= 0) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24 && hours >= 0) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7 && days >= 0) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function NotificationsPage({ data }) {
  const { notifications = [], refresh, refreshing = false, markRead } = data;

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

  // Keep the selected notification synchronized with refreshed data.
  const activeNotification = selectedNotification
    ? notifications.find((item) => item._id === selectedNotification._id) ||
      selectedNotification
    : null;

  // Close the modal with Escape and lock background scrolling while open.
  useEffect(() => {
    if (!activeNotification) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedNotification(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeNotification]);

  const openNotification = async (notification) => {
    setSelectedNotification(notification);

    // Automatically mark an unread notification as read when opened.
    if (!notification.isRead && markRead) {
      try {
        await markRead(notification);
      } catch (error) {
        console.error("Unable to mark notification as read:", error);
      }
    }
  };

  const handleMarkRead = async (notification) => {
    if (notification.isRead || !markRead) return;

    try {
      await markRead(notification);
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-5">
        {/* Page heading */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-100/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 right-1/4 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Official group updates
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-[34px]">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-3 inline-flex translate-y-[-3px] items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    {unreadCount} new
                  </span>
                )}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                Stay up to date with internship announcements, important
                reminders, and messages from your VELoop administrators.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refresh?.(true)}
              disabled={refreshing}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh updates"}
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={Inbox}
            label="Total notifications"
            value={notifications.length}
            description="All group updates"
            iconClass="bg-sky-50 text-sky-700 ring-sky-100"
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
            iconClass="bg-emerald-50 text-emerald-700 ring-emerald-100"
            highlight={unreadCount > 0}
          />

          <StatCard
            icon={CircleCheck}
            label="Read notifications"
            value={readCount}
            description="Updates you've reviewed"
            iconClass="bg-violet-50 text-violet-700 ring-violet-100"
          />
        </section>

        {/* Notification workspace */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Your updates
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Select any notification to see its full details.
                </p>
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search notifications..."
                  aria-label="Search notifications"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div
              className="mt-5 flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter notifications"
            >
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="All updates"
                count={notifications.length}
              />
              <FilterButton
                active={filter === "unread"}
                onClick={() => setFilter("unread")}
                label="Unread"
                count={unreadCount}
              />
              <FilterButton
                active={filter === "read"}
                onClick={() => setFilter("read")}
                label="Read"
                count={readCount}
              />
            </div>
          </div>

          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
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
              onClear={() => {
                setSearchQuery("");
                setFilter("all");
              }}
            />
          )}

          {filteredNotifications.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span>
                Showing {filteredNotifications.length} of {notifications.length}{" "}
                updates
              </span>

              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Official VELoop communication
              </span>
            </div>
          )}
        </section>
      </div>

      {/* Notification details modal */}
      {activeNotification && (
        <NotificationDetailsModal
          notification={activeNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={handleMarkRead}
        />
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  highlight = false,
}) {
  return (
    <article
      className={`group rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        highlight
          ? "border-emerald-200 hover:border-emerald-300"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
            {description}
          </p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition duration-200 group-hover:scale-105 ${iconClass}`}
        >
          <Icon size={19} strokeWidth={1.9} />
        </div>
      </div>
    </article>
  );
}

function FilterButton({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition duration-200 active:scale-[0.98] sm:text-sm ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm"
          : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
      <span
        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:text-xs ${
          active
            ? "bg-white text-emerald-800"
            : "bg-slate-200/70 text-slate-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function NotificationCard({ notification, onOpen }) {
  const isUnread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      aria-label={`View notification: ${notification.title || "Notification"}`}
      className={`group relative block w-full p-4 text-left transition-colors duration-200 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:p-5 lg:p-6 ${
        isUnread
          ? "bg-emerald-50/40 hover:bg-emerald-50/80"
          : "bg-white hover:bg-slate-50/80"
      }`}
    >
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full bg-emerald-500 sm:bottom-5 sm:top-5"
        />
      )}

      <div className="flex items-start gap-3.5 sm:gap-4">
        <div
          className={`relative flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition duration-200 group-hover:scale-105 sm:size-12 ${
            isUnread
              ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
              : "bg-slate-100 text-slate-500 ring-slate-200"
          }`}
        >
          <Bell size={19} strokeWidth={1.8} />

          {isUnread && (
            <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`break-words text-sm leading-6 sm:text-[15px] ${
                    isUnread
                      ? "font-bold text-slate-900"
                      : "font-semibold text-slate-800"
                  }`}
                >
                  {notification.title || "Notification"}
                </h3>

                {isUnread && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    NEW
                  </span>
                )}
              </div>

              <p className="mt-2 line-clamp-2 whitespace-pre-line break-words text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">
                {notification.message || "No message content provided."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400 sm:pl-3">
              <Clock3 size={13} />
              <time dateTime={notification.createdAt || undefined}>
                {getRelativeTime(notification.createdAt)}
              </time>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                {isUnread ? (
                  <CircleDot size={13} className="text-emerald-600" />
                ) : (
                  <CheckCheck size={13} className="text-emerald-600" />
                )}
                {isUnread ? "Unread" : "Read"}
              </span>

              {notification.link && (
                <span className="inline-flex items-center gap-1.5 text-sky-700">
                  <Link2 size={13} />
                  Contains a link
                </span>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition group-hover:gap-2.5">
              View details
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function NotificationDetailsModal({ notification, onClose, onMarkRead }) {
  const isUnread = !notification.isRead;

  return (
    <div
      className="fixed inset-0 z-9999999 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[3px] animate-in fade-in duration-200 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
        className="relative flex max-h-[92dvh] w-full max-w-2xl animate-in slide-in-from-bottom-3 flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-2xl duration-200 sm:max-h-[88vh] sm:rounded-3xl sm:slide-in-from-bottom-2"
      >
        {/* Modal header */}
        <div className="relative shrink-0 overflow-hidden border-b border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-sky-50 px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-emerald-200/40 blur-3xl"
          />

          <div className="relative flex items-start gap-3.5">
            <div className="flex mt-auto mb-1 size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm sm:size-14">
              <Bell size={24} strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  <ShieldCheck size={12} />
                  Official notification
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    isUnread
                      ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                      : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {isUnread ? (
                    <CircleDot size={11} />
                  ) : (
                    <CheckCheck size={11} />
                  )}
                  {isUnread ? "Unread" : "Read"}
                </span>
              </div>

              <h2
                id="notification-modal-title"
                className="break-words text-xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-2xl"
              >
                {notification.title || "Notification details"}
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                Review the complete announcement and any attached links below.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notification details"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable modal content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:space-y-6 sm:p-7">
          {/* Publication details */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetadataCard
              icon={CalendarDays}
              label="Published on"
              value={formatNotificationDate(notification.createdAt)}
            />

            <MetadataCard
              icon={Clock3}
              label="Time since published"
              value={getRelativeTime(notification.createdAt)}
            />
          </div>

          {/* Full message */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <MessageSquareText size={16} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Full message
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Complete notification content
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">
                {notification.message || "No message content provided."}
              </p>
            </div>
          </section>

          {/* Shared link details */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Link2 size={16} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Shared resources
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Links attached to this notification
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {notification.link ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
                      <ExternalLink size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Shared link
                      </p>

                      <p className="mt-1 break-all text-xs leading-5 text-sky-700 [overflow-wrap:anywhere]">
                        {notification.link}
                      </p>

                      <a
                        href={notification.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                      >
                        Open shared resource
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <FileText
                    size={19}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      No shared links
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This notification does not include an attached link.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Read status */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                isUnread
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white text-emerald-700"
              }`}
            >
              {isUnread ? <Eye size={17} /> : <CheckCheck size={17} />}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">
                {isUnread ? "Awaiting your attention" : "Already acknowledged"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isUnread
                  ? "This notification is currently unread. Opening it requests that it be marked as read."
                  : "This notification is marked as read in your notification list."}
              </p>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
            VELoop Rewards · Official communication
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {isUnread && (
              <button
                type="button"
                onClick={() => onMarkRead(notification)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <Check size={16} />
                Mark as read
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetadataCard({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ hasNotifications, hasSearch, onClear }) {
  const title = hasSearch
    ? "No matching notifications"
    : hasNotifications
      ? "Nothing in this filter"
      : "You're all caught up";

  const description = hasSearch
    ? "Try a different search term or clear your filters."
    : hasNotifications
      ? "There are no notifications in this category right now."
      : "New group announcements and important internship updates will appear here.";

  return (
    <div className="px-5 py-16 text-center sm:px-8 sm:py-20">
      <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 text-emerald-700 shadow-sm">
        {hasNotifications ? (
          <Search size={30} strokeWidth={1.6} />
        ) : (
          <Bell size={30} strokeWidth={1.6} />
        )}

        <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-xl border-2 border-white bg-white text-emerald-600 shadow-sm">
          {hasNotifications ? <X size={13} /> : <Sparkles size={14} />}
        </span>
      </div>

      <h3 className="text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      {(hasSearch || hasNotifications) && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <RefreshCw size={15} />
          Clear filters
        </button>
      )}
    </div>
  );
}
