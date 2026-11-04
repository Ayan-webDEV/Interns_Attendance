import { Bell, ExternalLink, Send } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";

export default function NotificationsPage({
  groups,
  noticeForm,
  setNoticeForm,
  sendNotification,
  notifications,
  fmtDate,
}) {
  const updateField = (key, value) => {
    setNoticeForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-5">
      <header className="page-heading flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">COMMUNICATIONS</div>
          <h1>Notifications</h1>
          <p>
            Send clear updates to every intern or a selected cohort. A link is
            optional.
          </p>
        </div>

        <Bell size={24} color="var(--accent)" className="shrink-0" />
      </header>

      <section className="panel min-w-0">
        <div className="panel-header">
          <div>
            <h2>Compose notification</h2>
            <p>Notifications appear in the intern portal.</p>
          </div>
        </div>

        <form onSubmit={sendNotification} className="space-y-4">
          <Field label="Audience">
            <select
              className="select w-full"
              value={noticeForm.targetGroupId}
              onChange={(event) =>
                updateField("targetGroupId", event.target.value)
              }
            >
              <option value="all">All groups</option>
              {groups
                .filter((group) => group.status !== "completed")
                .map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Title">
            <input
              className="input w-full"
              required
              maxLength={120}
              value={noticeForm.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Important attendance update"
            />
          </Field>

          <Field label="Message">
            <textarea
              className="textarea w-full"
              required
              maxLength={3000}
              value={noticeForm.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Write a clear, actionable message…"
              rows={5}
            />
            <p className="muted small mt-1 text-right">
              {noticeForm.message.length}/3000 characters
            </p>
          </Field>

          <Field label="Optional link">
            <input
              className="input w-full"
              type="url"
              value={noticeForm.link}
              onChange={(event) => updateField("link", event.target.value)}
              placeholder="https://…"
            />
          </Field>

          <button type="submit" className="btn btn-primary">
            <Send size={15} />
            Send notification
          </button>
        </form>
      </section>

      <section className="panel min-w-0">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Sent notifications</h2>
            <p>Recent notices and their audience.</p>
          </div>

          <span className="badge">{notifications.length}</span>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                className="notice-card flex min-w-0 items-start gap-3"
                key={notification._id}
              >
                <div className="stat-icon shrink-0">
                  <Bell size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words">{notification.title}</h3>

                  <p className="break-words whitespace-pre-wrap">
                    {notification.message}
                  </p>

                  <div className="inline-actions mt-2 flex flex-wrap items-center gap-2">
                    <span className="badge">
                      {notification.targetGroup?.name || "All groups"}
                    </span>

                    <span className="muted small">
                      {fmtDate(notification.createdAt)}
                    </span>

                    {notification.link && (
                      <a
                        href={notification.link}
                        target="_blank"
                        rel="noreferrer"
                        className="small inline-flex items-center gap-1"
                      >
                        Open link
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">No notifications sent yet.</div>
        )}
      </section>
    </div>
  );
}
