import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  Copy,
  Play,
  CheckCircle2,
  Download,
  CalendarDays,
  Users,
  Wallet,
  TicketPercent,
  Bell,
  Settings,
  Edit3,
  Link as LinkIcon,
  Power,
  ArrowUpRight,
  Filter,
  Save,
  Trash2,
  ShieldCheck,
  UserRound,
  Clock3,
  Check,
  AlertTriangle,
} from "lucide-react";
import { api, saveBlob } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";
import Loader from "../../components/Loader/Loader";
import StatCard from "../../components/StatCard/StatCard";
import styles from "./Manage.module.css";
import Account from "../Account/Account";
import Notifications from "../Notifications/Notifications";
import Promos from "../Promos/Promos";
import RewardsPage from "../RewardsPage/RewardsPage";
import CertificatePage from "../Certificate/CertificatePage";

const blankGroup = {
  name: "",
  description: "",
  whatsappGroupCode: "",
  plannedStartDate: "",
  durationDays: 28,
};
export default function Manage({ user }) {
  const loc = useLocation();
  const toast = useToast();
  const rawPath = loc.pathname;
  const normalizedPath = rawPath.startsWith("/intern/")
    ? rawPath.replace("/intern", "")
    : rawPath;
  const path =
    normalizedPath === "/notification" ? "/notifications" : normalizedPath;
  const [data, setData] = useState([]),
    [groups, setGroups] = useState([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [groupFilter, setGroupFilter] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [sessionFilter, setSessionFilter] = useState(""),
    [selected, setSelected] = useState([]),
    [form, setForm] = useState(blankGroup),
    [editing, setEditing] = useState(null),
    [modal, setModal] = useState(""),
    [target, setTarget] = useState(null),
    [inviteUrl, setInviteUrl] = useState(""),
    [groupInterns, setGroupInterns] = useState([]),
    [extra, setExtra] = useState({}),
    [settings, setSettings] = useState({
      firstStart: "09:30",
      firstEnd: "12:30",
      secondStart: "13:00",
      secondEnd: "15:30",
      minimumSeconds: 50,
      onlyDesktopAccess: true,
    }),
    [message, setMessage] = useState({
      title: "",
      message: "",
      link: "",
      targetGroupId: "all",
    }),
    [promo, setPromo] = useState({
      groupId: "",
      code: "",
      minReward: 1,
      maxReward: 10,
      maxRedemptions: 30,
      expiresAt: "",
    }),
    [adjust, setAdjust] = useState({ internId: "", amount: 1, reason: "" }),
    [correction, setCorrection] = useState({
      internId: "",
      date: "",
      status: "admin_corrected_present",
      reason: "",
      sessionNumber: 1,
    });
  const admin = path.startsWith("/admin");
  const title = useMemo(
    () =>
      ({
        groups: "Internship groups",
        interns: "Intern directory",
        approvals: "Attendance approvals",
        attendance: "Attendance records",
        wallet: "InternCash ledger",
        promos: "Promo codes",
        notifications: "Notifications",
        settings: "Portal settings",
        account: "My account",
        policies: "Policies & help",
      })[path.split("/").filter(Boolean).pop()] || "Workspace",
    [path],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const gr = await api("/groups");
      setGroups(gr.groups || []);
      let endpoint = "";
      if (path === "/admin/groups") endpoint = "/groups";
      else if (path === "/admin/interns")
        endpoint = `/admin/interns?q=${encodeURIComponent(search)}${groupFilter ? `&groupId=${groupFilter}` : ""}`;
      else if (path === "/admin/approvals")
        endpoint = `/attendance/admin/approvals${groupFilter ? `?groupId=${groupFilter}` : ""}`;
      else if (path === "/admin/attendance")
        endpoint = `/attendance/admin/report?${new URLSearchParams({ ...(groupFilter ? { groupId: groupFilter } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(sessionFilter ? { sessionNumber: sessionFilter } : {}) })}`;
      else if (path === "/admin/wallet")
        endpoint = `/wallet/admin/transactions${groupFilter ? `?groupId=${groupFilter}` : ""}`;
      else if (path === "/admin/promos") endpoint = "/promo-codes";
      else if (path === "/admin/notifications") endpoint = "/notifications";
      else if (path === "/admin/settings") {
        const [p, a] = await Promise.all([
          api("/admin/settings/portal-access"),
          api("/admin/settings/attendance"),
        ]);
        setSettings({ ...p.settings, ...a.settings });
        setData([]);
        return;
      } else if (path === "/wallet") endpoint = "/wallet/mine";
      else if (path === "/promos") endpoint = "/notifications/mine";
      else if (path === "/notifications") endpoint = "/notifications/mine";
      else if (path === "/account") endpoint = "/auth/me";
      else endpoint = "/wallet/mine";
      const res = await api(endpoint);
      const arr =
        res.groups ||
        res.interns ||
        res.records ||
        res.transactions ||
        res.codes ||
        res.notifications ||
        [];
      setData(Array.isArray(arr) ? arr : []);
      if (path === "/wallet") setExtra(res);
      if (path === "/account") setExtra(res.user || {});
      if (path === "/promos") setExtra(res);
    } catch (e) {
      toast(e.message, "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [path, search, groupFilter, from, to, sessionFilter]);
  useEffect(() => {
    load();
  }, [load]);
  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      toast(success || "Changes saved.");
      setModal("");
      await load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const openGroup = (g = null) => {
    setEditing(g ? g._id : null);
    setForm(
      g
        ? {
            name: g.name || "",
            description: g.description || "",
            whatsappGroupCode: g.whatsappGroupCode || "",
            plannedStartDate: (g.plannedStartDate || "").slice(0, 10),
            actualStartDate: (g.actualStartDate || "").slice(0, 10),
            durationDays: g.durationDays || 28,
          }
        : blankGroup,
    );
    setModal("group");
  };
  const groupAction = async (action, g) => {
    if (action === "invite") {
      await run(async () => {
        const x = await api(`/groups/${g._id}/invite`);
        const url = `${location.origin}/login?invite=${encodeURIComponent(x.inviteToken)}`;
        setInviteUrl(url);
        setTarget(g);
      }, "Invitation link ready.");
      setModal("invite");
      return;
    }
    if (action === "reset") {
      if (
        !confirm(
          `Reset the invitation for ${g.name}? The previous link will stop working.`,
        )
      )
        return;
      await run(async () => {
        const x = await api(`/groups/${g._id}/regenerate-invite`, {
          method: "POST",
          body: {},
        });
        setInviteUrl(
          `${location.origin}/login?invite=${encodeURIComponent(x.inviteToken)}`,
        );
        setTarget(g);
      }, "New invitation link generated.");
      setModal("invite");
      return;
    }
    if (action === "start") {
      const date = prompt(
        "Internship start date (YYYY-MM-DD)",
        g.plannedStartDate?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
      );
      if (!date) return;
      await run(
        () =>
          api(`/groups/${g._id}/start`, {
            method: "POST",
            body: { actualStartDate: date },
          }),
        "Internship started.",
      );
      return;
    }
    if (action === "complete") {
      const password = prompt(
        "Enter your admin password to record the first completion approval:",
      );
      if (password === null) return;
      await run(
        () =>
          api(`/groups/${g._id}/request-completion`, {
            method: "POST",
            body: { password },
          }),
        "First approval recorded. A different admin must approve completion.",
      );
      return;
    }
    if (action === "approveComplete") {
      const password = prompt(
        "Enter your admin password to provide the second approval:",
      );
      if (password === null) return;
      await run(async () => {
        await api(`/groups/${g._id}/approve-completion`, {
          method: "POST",
          body: { password },
        });
        const blob = await api(`/groups/${g._id}/archive`, {
          method: "POST",
          body: {},
        });
        saveBlob(
          blob,
          `VELOop-Complete-Archive-Latest-${new Date().toISOString().slice(0, 10)}.csv`,
        );
      }, "Group completed and the cumulative CSV archive was downloaded.");
      return;
    }
    if (action === "export") {
      await run(async () => {
        const blob = await api(`/groups/${g._id}/archive`, {
          method: "POST",
          body: {},
        });
        saveBlob(
          blob,
          `VELOop-Complete-Archive-Latest-${new Date().toISOString().slice(0, 10)}.csv`,
        );
      }, "Archive exported.");
      return;
    }
    if (action === "delete") {
      if (
        !confirm(
          "Permanently delete this completed group and its live records? Ensure the CSV archive has been downloaded first.",
        )
      )
        return;
      await run(
        () => api(`/groups/${g._id}`, { method: "DELETE" }),
        "Group deleted after archive verification.",
      );
    }
  };
  const submitGroup = (e) => {
    e.preventDefault();
    run(
      async () => {
        if (editing)
          await api(`/groups/${editing}`, { method: "PATCH", body: form });
        else await api("/groups", { method: "POST", body: form });
      },
      editing ? "Group details updated." : "Group created.",
    );
  };
  const approve = async (all = false) =>
    run(
      () =>
        api("/attendance/admin/approvals/approve", {
          method: "POST",
          body: all
            ? {
                groupId: groupFilter,
                sessionNumber: sessionFilter || undefined,
                approveAll: true,
              }
            : { attendanceIds: selected },
        }),
      all ? "All pending requests approved." : "Selected requests approved.",
    );
  const submitPromo = (e) => {
    e.preventDefault();
    run(
      () => api("/promo-codes", { method: "POST", body: promo }),
      "Promo code created.",
    );
  };
  const submitNotice = (e) => {
    e.preventDefault();
    run(
      () => api("/notifications", { method: "POST", body: message }),
      "Notification sent.",
    );
  };
  const groupName = (x) =>
    x?.group?.name || groups.find((g) => g._id === x?.group)?.name || "—";
  const date = (v) =>
    v
      ? new Date(v).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  if (loading)
    return (
      <Loader label={`Loading ${title.toLowerCase()}…`} full={false}>
        {" "}
      </Loader>
    );
  if (path === "/admin/groups")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Create groups, manage invitation links, and control the internship lifecycle."
          action={
            <button className={styles.primary} onClick={() => openGroup()}>
              <Plus size={16} /> Create group
            </button>
          }
        />
        <div className={styles.filters}>
          <div className={styles.search}>
            <Search size={16} />
            <input
              placeholder="Search groups"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.ghost} onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        <div className={styles.groupGrid}>
          {groups
            .filter((g) => g.name?.toLowerCase().includes(search.toLowerCase()))
            .map((g) => (
              <article className={styles.groupCard} key={g._id}>
                <div className={styles.groupCardTop}>
                  <div className={styles.glyph}>
                    <Users size={19} />
                  </div>
                  <span
                    className={`${styles.status} ${g.status === "active" ? styles.statusActive : ""}`}
                  >
                    {String(g.status || "registration").replace("_", " ")}
                  </span>
                </div>
                <h3>{g.name}</h3>
                <p>{g.description || "No group description added yet."}</p>
                <div className={styles.groupMetrics}>
                  <div>
                    <small>Interns</small>
                    <b>{g.internCount || 0}</b>
                  </div>
                  <div>
                    <small>Duration</small>
                    <b>{g.durationDays || 28} days</b>
                  </div>
                  <div>
                    <small>Start date</small>
                    <b>{date(g.actualStartDate || g.plannedStartDate)}</b>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={async () => {
                      setTarget(g);
                      setGroupInterns([]);
                      setModal("details");
                      try {
                        const r = await api(`/groups/${g._id}/interns`);
                        setGroupInterns(r.interns || []);
                      } catch (e) {
                        toast(e.message, "error");
                      }
                    }}
                  >
                    <Users size={14} /> Details
                  </button>
                  <button onClick={() => groupAction("invite", g)}>
                    <LinkIcon size={14} /> Get link
                  </button>
                  <button onClick={() => openGroup(g)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => groupAction("reset", g)}>
                    <RefreshCw size={14} /> Reset link
                  </button>
                  {g.status === "registration" && (
                    <button
                      className={styles.greenBtn}
                      onClick={() => groupAction("start", g)}
                    >
                      <Play size={14} /> Start internship
                    </button>
                  )}
                  {g.status === "active" && (
                    <button
                      className={styles.amberBtn}
                      onClick={() => groupAction("complete", g)}
                    >
                      <CheckCircle2 size={14} /> Complete group
                    </button>
                  )}
                  {g.status === "completion_pending" && (
                    <button
                      className={styles.greenBtn}
                      onClick={() => groupAction("approveComplete", g)}
                    >
                      <ShieldCheck size={14} /> Second approval
                    </button>
                  )}
                  {g.status === "completed" && (
                    <>
                      <button onClick={() => groupAction("export", g)}>
                        <Download size={14} /> Export full CSV
                      </button>
                      <button
                        className={styles.dangerBtn}
                        onClick={() => groupAction("delete", g)}
                      >
                        <Trash2 size={14} /> Delete group
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
        </div>
        {groups.length === 0 && (
          <Empty text="No groups yet. Create your first group to generate a secure registration link." />
        )}
        {modal === "group" && (
          <Modal
            title={editing ? "Edit group details" : "Create internship group"}
            close={() => setModal("")}
          >
            <form className={styles.formGrid} onSubmit={submitGroup}>
              <label>
                Group name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={3}
                  placeholder="VELoop Rewards Internship — Group 01"
                />
              </label>
              <label>
                WhatsApp group code
                <input
                  value={form.whatsappGroupCode}
                  onChange={(e) =>
                    setForm({ ...form, whatsappGroupCode: e.target.value })
                  }
                  required
                  placeholder="Code from group description"
                />
              </label>
              <label>
                {editing &&
                groups.find((g) => g._id === editing)?.status === "active"
                  ? "Actual start date"
                  : "Planned start date"}
                <input
                  type="date"
                  value={
                    editing &&
                    groups.find((g) => g._id === editing)?.status === "active"
                      ? form.actualStartDate || ""
                      : form.plannedStartDate
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [editing &&
                      groups.find((g) => g._id === editing)?.status === "active"
                        ? "actualStartDate"
                        : "plannedStartDate"]: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Internship duration (days)
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm({ ...form, durationDays: Number(e.target.value) })
                  }
                  required
                />
              </label>
              <label className={styles.full}>
                Group description
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Internal notes or group instructions"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className={styles.primary} disabled={busy}>
                  <Save size={15} />
                  {busy ? "Saving…" : "Save group"}
                </button>
              </div>
            </form>
          </Modal>
        )}
        {modal === "invite" && (
          <Modal title="Group registration link" close={() => setModal("")}>
            <p className={styles.modalSub}>
              Share this unique link with interns in <b>{target?.name}</b>.
              Resetting the link invalidates the previous invitation.
            </p>
            <div className={styles.copyField}>
              <input readOnly value={inviteUrl} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  toast("Invitation link copied.");
                }}
              >
                <Copy size={15} /> Copy
              </button>
            </div>
          </Modal>
        )}
        {modal === "details" && (
          <Modal
            title={target?.name || "Group details"}
            close={() => setModal("")}
          >
            <div className={styles.detailsGrid}>
              <div>
                <small>Current status</small>
                <b>{target?.status}</b>
              </div>
              <div>
                <small>Intern count</small>
                <b>{target?.internCount || 0}</b>
              </div>
              <div>
                <small>Duration</small>
                <b>{target?.durationDays || 28} days</b>
              </div>
              <div>
                <small>Start date</small>
                <b>
                  {date(target?.actualStartDate || target?.plannedStartDate)}
                </b>
              </div>
            </div>
            <h3 style={{ fontSize: 12, margin: "20px 0 8px" }}>
              Interns in this group ({groupInterns.length})
            </h3>
            <div className={styles.tableWrap} style={{ marginBottom: 14 }}>
              <table style={{ minWidth: 420 }}>
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Intern ID</th>
                    <th>Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {groupInterns.map((i) => (
                    <tr key={i._id}>
                      <td>
                        <b>{i.name}</b>
                        <small>{i.email}</small>
                      </td>
                      <td className={styles.code}>{i.internId}</td>
                      <td>{i.domain || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!groupInterns.length && (
                <div
                  style={{ padding: 15, fontSize: 10, color: "var(--muted)" }}
                >
                  Loading group interns or no interns have joined yet.
                </div>
              )}
            </div>
            <button
              className={styles.primary}
              onClick={() => {
                setModal("");
                location.href = "/admin/interns?groupId=" + target?._id;
              }}
            >
              View intern directory <ArrowUpRight size={15} />
            </button>
          </Modal>
        )}
      </div>
    );
  if (path === "/admin/approvals")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Review attendance requests before they count toward attendance and rewards."
          action={
            <button className={styles.ghost} onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
          }
        />
        <div className={styles.filters}>
          <Select
            label="Group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((g) => ({ label: g.name, value: g._id }))}
          />
          <Select
            label="Session"
            value={sessionFilter}
            onChange={setSessionFilter}
            options={[
              { label: "Session 1", value: "1" },
              { label: "Session 2", value: "2" },
            ]}
          />
          <span className={styles.count}>{data.length} pending requests</span>
          <button
            className={styles.primary}
            disabled={!groupFilter || !data.length || busy}
            onClick={() => approve(true)}
          >
            <CheckCircle2 size={15} /> Approve all in group
          </button>
        </div>
        <DataTable
          headers={[
            "Select",
            "Intern",
            "Group",
            "Date",
            "Session",
            "Requested",
            "Status",
          ]}
          rows={data.map((r) => (
            <tr key={r._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(r._id)}
                  onChange={(e) =>
                    setSelected((p) =>
                      e.target.checked
                        ? [...p, r._id]
                        : p.filter((x) => x !== r._id),
                    )
                  }
                />
              </td>
              <td>
                <b>{r.intern?.name || "Unknown intern"}</b>
                <small>
                  {r.intern?.internId} · {r.intern?.email}
                </small>
              </td>
              <td>{r.group?.name || "—"}</td>
              <td>{r.dateKey}</td>
              <td>Session {r.sessionNumber}</td>
              <td>{date(r.markedAt || r.createdAt)}</td>
              <td>
                <span className={styles.statusPending}>Pending</span>
              </td>
            </tr>
          ))}
        />
        {data.length > 0 && (
          <div className={styles.bottomActions}>
            <span>{selected.length} selected</span>
            <button
              className={styles.primary}
              disabled={!selected.length || busy}
              onClick={() => approve(false)}
            >
              <Check size={15} /> Approve selected
            </button>
          </div>
        )}
        {data.length === 0 && (
          <Empty text="No attendance requests are waiting for approval with these filters." />
        )}
      </div>
    );
  if (path === "/admin/interns")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Search registered interns and review their group assignment and contact details."
          action={
            <button className={styles.ghost} onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
          }
        />
        <div className={styles.filters}>
          <div className={styles.search}>
            <Search size={16} />
            <input
              placeholder="Search name, email, intern ID, phone or domain"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            label="All groups"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((g) => ({ label: g.name, value: g._id }))}
          />
        </div>
        <DataTable
          headers={[
            "Intern",
            "Intern ID",
            "Contact",
            "Domain",
            "Group",
            "Start date",
            "InternCash",
          ]}
          rows={data.map((x) => (
            <tr key={x._id}>
              <td>
                <b>{x.name}</b>
                <small>{x.email}</small>
              </td>
              <td className={styles.code}>{x.internId}</td>
              <td>{x.whatsappNumber || "—"}</td>
              <td>{x.domain || "—"}</td>
              <td>{x.group?.name || groupName(x)}</td>
              <td>{date(x.internshipStartDate)}</td>
              <td>
                <b>{x.internCashBalance ?? 0} IC</b>
                <button
                  className={styles.iconButton}
                  onClick={() => {
                    setTarget(x);
                    setExtra({
                      ...extra,
                      transferTarget:
                        groups.find(
                          (g) =>
                            g._id !== (x.group?._id || x.group) &&
                            g.status !== "completed",
                        )?._id || "",
                      transferReason: "",
                    });
                    setModal("transfer");
                  }}
                  title="Transfer intern to another group"
                >
                  <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        />
        {data.length === 0 && <Empty text="No interns match this search." />}
        {modal === "transfer" && (
          <Modal
            title={`Transfer ${target?.name || "intern"} to another group`}
            close={() => setModal("")}
          >
            <form
              className={styles.formGrid}
              onSubmit={(e) => {
                e.preventDefault();
                const source =
                  target?.group?._id ||
                  target?.group ||
                  groups.find((g) => g._id === extra.transferTarget)?._id;
                run(
                  () =>
                    api(`/groups/${source || groups[0]?._id}/transfer-intern`, {
                      method: "POST",
                      body: {
                        internId: target?.internId || target?._id,
                        targetGroupId: extra.transferTarget,
                        reason: extra.transferReason || "Admin transfer",
                      },
                    }),
                  "Intern transferred successfully.",
                );
              }}
            >
              <label className={styles.full}>
                Destination group
                <select
                  required
                  value={extra.transferTarget || ""}
                  onChange={(e) =>
                    setExtra({ ...extra, transferTarget: e.target.value })
                  }
                >
                  <option value="">Choose a group</option>
                  {groups
                    .filter(
                      (g) =>
                        g.status !== "completed" &&
                        g._id !== (target?.group?._id || target?.group),
                    )
                    .map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className={styles.full}>
                Transfer reason
                <input
                  value={extra.transferReason || ""}
                  onChange={(e) =>
                    setExtra({ ...extra, transferReason: e.target.value })
                  }
                  placeholder="Optional reason for audit history"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className={styles.primary} disabled={busy}>
                  <ArrowUpRight size={15} /> Transfer intern
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  if (path === "/admin/attendance")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Filter attendance history by date range, group and session."
          action={
            <button className={styles.ghost} onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
          }
        />
        <div className={styles.filters}>
          <Select
            label="All groups"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groups.map((g) => ({ label: g.name, value: g._id }))}
          />
          <label className={styles.dateFilter}>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className={styles.dateFilter}>
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <Select
            label="Session"
            value={sessionFilter}
            onChange={setSessionFilter}
            options={[
              { label: "Session 1", value: "1" },
              { label: "Session 2", value: "2" },
            ]}
          />
          <button className={styles.primary} onClick={load}>
            <Filter size={14} /> Apply filters
          </button>
        </div>
        <DataTable
          headers={[
            "Intern",
            "Group",
            "Date",
            "Session",
            "Status",
            "Approved by",
            "Correction",
          ]}
          rows={data.map((r) => (
            <tr key={r._id}>
              <td>
                <b>{r.intern?.name || "—"}</b>
                <small>{r.intern?.internId}</small>
              </td>
              <td>{r.intern?.group?.name || r.group?.name || "—"}</td>
              <td>{r.dateKey}</td>
              <td>Session {r.sessionNumber}</td>
              <td>
                <span className={styles.status}>{r.status}</span>
              </td>
              <td>{r.approvedBy?.name || "—"}</td>
              <td>
                <button
                  className={styles.ghost}
                  onClick={() => {
                    setCorrection({
                      internId: r.intern?.internId || r.intern?._id || "",
                      date: r.dateKey,
                      status: "admin_corrected_present",
                      reason: "",
                      sessionNumber: r.sessionNumber,
                    });
                    setModal("correction");
                  }}
                >
                  <Edit3 size={13} /> Correct
                </button>
              </td>
            </tr>
          ))}
        />
        {data.length === 0 && (
          <Empty text="No records found for the selected filters." />
        )}
        {modal === "correction" && (
          <Modal title="Correct attendance record" close={() => setModal("")}>
            <form
              className={styles.formGrid}
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    api("/attendance/admin/correct", {
                      method: "POST",
                      body: correction,
                    }),
                  "Attendance correction saved.",
                );
              }}
            >
              <label>
                Intern ID
                <input
                  value={correction.internId}
                  onChange={(e) =>
                    setCorrection({ ...correction, internId: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={correction.date}
                  onChange={(e) =>
                    setCorrection({ ...correction, date: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Session
                <select
                  value={correction.sessionNumber}
                  onChange={(e) =>
                    setCorrection({
                      ...correction,
                      sessionNumber: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>Session 1</option>
                  <option value={2}>Session 2</option>
                </select>
              </label>
              <label>
                Corrected status
                <select
                  value={correction.status}
                  onChange={(e) =>
                    setCorrection({ ...correction, status: e.target.value })
                  }
                >
                  <option value="admin_corrected_present">Present</option>
                  <option value="admin_corrected_absent">Absent</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label className={styles.full}>
                Reason for correction
                <textarea
                  rows="3"
                  value={correction.reason}
                  onChange={(e) =>
                    setCorrection({ ...correction, reason: e.target.value })
                  }
                  required
                  minLength={3}
                  placeholder="Explain why this attendance record is being corrected"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className={styles.primary} disabled={busy}>
                  <Save size={15} /> Save correction
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );

  if (path === "/wallet") {
    return <RewardsPage user={user} />;
  }

  if (path === "/certification") {
    return <CertificatePage user={user} />;
  }

  if (path === "/admin/wallet" || path === "/wallet")
    return (
      <div className={styles.page}>
        <Head
          title={path === "/wallet" ? "My InternCash wallet" : title}
          sub={
            path === "/wallet"
              ? "Your current balance and every credit or debit in one place."
              : "Review credit and debit logs for all interns."
          }
          action={
            <div style={{ display: "flex", gap: 8 }}>
              {admin && (
                <button
                  className={styles.primary}
                  onClick={() => setModal("adjust")}
                >
                  <Plus size={15} /> Adjust balance
                </button>
              )}
              <button className={styles.ghost} onClick={load}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          }
        />

        {/* {path === "/wallet" && (
          // <div className={styles.balance}>
          //   <small>Available balance</small>
          //   <strong>
          //     {extra.balance ?? user?.internCashBalance ?? 0} <span>IC</span>
          //   </strong>
          //   <p>
          //     1 InternCash ≈ ₹{extra.conversion ?? 0.5}. Rewards are recorded
          //     after approval.
          //   </p>
          // </div>
          // <RewardsPage data={data} />
        )} */}

        {admin && (
          <div className={styles.filters}>
            <Select
              label="All groups"
              value={groupFilter}
              onChange={setGroupFilter}
              options={groups.map((g) => ({ label: g.name, value: g._id }))}
            />
            <span className={styles.count}>{data.length} transactions</span>
          </div>
        )}

        {/*  */}
        {/* {DataTable({
          headers: admin
            ? [
                "Intern",
                "Group",
                "Date",
                "Transaction",
                "Amount",
                "Balance after",
              ]
            : ["Date", "Transaction", "Reference", "Amount", "Balance after"],
          rows: data.map((t) => (
            <tr key={t._id}>
              <td>
                {admin ? (
                  <>
                    <b>{t.intern?.name || "—"}</b>
                    <small>{t.intern?.internId || ""}</small>
                  </>
                ) : (
                  date(t.createdAt)
                )}
              </td>
              {admin && <td>{t.group?.name || "—"}</td>}
              <td>{admin ? date(t.createdAt) : t.description || t.type}</td>
              <td>{admin ? t.description || t.type : t.reference || "—"}</td>
              <td
                className={
                  Number(t.amount) >= 0 ? styles.positive : styles.negative
                }
              >
                {Number(t.amount) > 0 ? "+" : ""}
                {t.amount} IC
              </td>
              <td>{t.balanceAfter ?? "—"} IC</td>
            </tr>
          )),
        })}
        {data.length === 0 && <Empty text="No wallet transactions yet." />} */}

        {/*  */}
        {modal === "adjust" && (
          <Modal title="Adjust intern balance" close={() => setModal("")}>
            <form
              className={styles.formGrid}
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    api("/wallet/admin/adjust", {
                      method: "POST",
                      body: adjust,
                    }),
                  "Wallet balance adjusted and ledger entry recorded.",
                );
              }}
            >
              <label className={styles.full}>
                Intern ID
                <input
                  value={adjust.internId}
                  onChange={(e) =>
                    setAdjust({ ...adjust, internId: e.target.value })
                  }
                  required
                  placeholder="VLRINT202601234"
                />
              </label>
              <label>
                Amount (IC)
                <input
                  type="number"
                  value={adjust.amount}
                  onChange={(e) =>
                    setAdjust({ ...adjust, amount: Number(e.target.value) })
                  }
                  required
                  min="-100000"
                  max="100000"
                />
              </label>
              <label className={styles.full}>
                Reason
                <textarea
                  rows="3"
                  value={adjust.reason}
                  onChange={(e) =>
                    setAdjust({ ...adjust, reason: e.target.value })
                  }
                  required
                  placeholder="Reason for credit or debit adjustment"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className={styles.primary} disabled={busy}>
                  <Save size={15} /> Record adjustment
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  if (path === "/admin/promos")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Create group-specific codes with random rewards, redemption limits and optional expiry."
          action={
            <button
              className={styles.primary}
              onClick={() => setModal("promo")}
            >
              <Plus size={15} /> Create promo code
            </button>
          }
        />
        <DataTable
          headers={[
            "Code",
            "Group",
            "Reward range",
            "Redemptions",
            "Expires",
            "Status",
            "Action",
          ]}
          rows={data.map((c) => (
            <tr key={c._id}>
              <td className={styles.code}>
                <b>{c.code}</b>
                <button
                  className={styles.iconButton}
                  onClick={() => {
                    navigator.clipboard.writeText(c.code);
                    toast("Promo code copied.");
                  }}
                >
                  <Copy size={13} />
                </button>
              </td>
              <td>{c.group?.name || "—"}</td>
              <td>
                {c.minReward}–{c.maxReward} IC
              </td>
              <td>
                {c.redemptionCount || 0} / {c.maxRedemptions}
              </td>
              <td>{date(c.expiresAt)}</td>
              <td>
                <span
                  className={
                    c.active ? styles.statusActive : styles.statusExpired
                  }
                >
                  {c.active ? "Active" : "Expired"}
                </span>
              </td>
              <td>
                {c.active && (
                  <button
                    className={styles.dangerBtn}
                    onClick={() =>
                      run(
                        () =>
                          api(`/promo-codes/${c._id}/expire`, {
                            method: "POST",
                            body: {},
                          }),
                        "Promo code expired.",
                      )
                    }
                  >
                    Expire now
                  </button>
                )}
              </td>
            </tr>
          ))}
        />
        {modal === "promo" && (
          <Modal title="Create group promo code" close={() => setModal("")}>
            <form className={styles.formGrid} onSubmit={submitPromo}>
              <label className={styles.full}>
                For which group?
                <select
                  value={promo.groupId}
                  onChange={(e) =>
                    setPromo({ ...promo, groupId: e.target.value })
                  }
                  required
                >
                  <option value="">Choose a group</option>
                  {groups
                    .filter((g) => g.status !== "completed")
                    .map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Minimum reward (IC)
                <input
                  type="number"
                  min="1"
                  value={promo.minReward}
                  onChange={(e) =>
                    setPromo({ ...promo, minReward: Number(e.target.value) })
                  }
                  required
                />
              </label>
              <label>
                Maximum reward (IC)
                <input
                  type="number"
                  min={promo.minReward}
                  value={promo.maxReward}
                  onChange={(e) =>
                    setPromo({ ...promo, maxReward: Number(e.target.value) })
                  }
                  required
                />
              </label>
              <label>
                Maximum redemptions
                <input
                  type="number"
                  min="1"
                  value={promo.maxRedemptions}
                  onChange={(e) =>
                    setPromo({
                      ...promo,
                      maxRedemptions: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>
              <label>
                Expiry (optional)
                <input
                  type="datetime-local"
                  value={promo.expiresAt}
                  onChange={(e) =>
                    setPromo({ ...promo, expiresAt: e.target.value })
                  }
                />
              </label>
              <label className={styles.full}>
                Custom code (optional)
                <input
                  value={promo.code}
                  onChange={(e) =>
                    setPromo({ ...promo, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Leave blank to generate automatically"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className={styles.primary} disabled={busy}>
                  <Plus size={15} /> Generate code
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  if (path === "/promos") return <Promos />;
  if (path === "/admin/notifications")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Send announcements to every intern or target one specific group."
          action={
            <button
              className={styles.primary}
              onClick={() => setModal("notice")}
            >
              <Plus size={15} /> New notification
            </button>
          }
        />
        <DataTable
          headers={["Notification", "Audience", "Sent", "Link", "Action"]}
          rows={data.map((n) => (
            <tr key={n._id}>
              <td>
                <b>{n.title}</b>
                <small>{n.message}</small>
              </td>
              <td>{n.targetGroup?.name || "All groups"}</td>
              <td>{date(n.createdAt)}</td>
              <td>
                {n.link ? (
                  <a href={n.link} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <button
                  className={styles.dangerBtn}
                  onClick={() =>
                    run(
                      () =>
                        api(`/notifications/${n._id}`, { method: "DELETE" }),
                      "Notification deleted.",
                    )
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        />
        {modal === "notice" && (
          <Modal title="Send a notification" close={() => setModal("")}>
            <form className={styles.formGrid} onSubmit={submitNotice}>
              <label className={styles.full}>
                Title
                <input
                  value={message.title}
                  onChange={(e) =>
                    setMessage({ ...message, title: e.target.value })
                  }
                  minLength={3}
                  required
                />
              </label>
              <label className={styles.full}>
                Message
                <textarea
                  rows="4"
                  value={message.message}
                  onChange={(e) =>
                    setMessage({ ...message, message: e.target.value })
                  }
                  minLength={3}
                  required
                />
              </label>
              <label className={styles.full}>
                Send to
                <select
                  value={message.targetGroupId}
                  onChange={(e) =>
                    setMessage({ ...message, targetGroupId: e.target.value })
                  }
                >
                  <option value="all">All groups</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.full}>
                Optional link
                <input
                  type="url"
                  value={message.link}
                  onChange={(e) =>
                    setMessage({ ...message, link: e.target.value })
                  }
                  placeholder="https://…"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className={styles.primary} disabled={busy}>
                  <Bell size={15} /> Send notification
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  if (path === "/notifications" || path === "/promos") return <Notifications />;
  if (path === "/admin/settings")
    return (
      <div className={styles.page}>
        <Head
          title={title}
          sub="Control attendance windows and intern device access."
        />
        <form
          className={styles.settingsForm}
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/admin/settings/attendance", {
                method: "PATCH",
                body: {
                  firstStart: settings.firstStart,
                  firstEnd: settings.firstEnd,
                  secondStart: settings.secondStart,
                  secondEnd: settings.secondEnd,
                  minimumSeconds: Number(settings.minimumSeconds),
                },
              });
              await api("/admin/settings/portal-access", {
                method: "PATCH",
                body: { onlyDesktopAccess: !!settings.onlyDesktopAccess },
              });
            }, "Portal settings updated.");
          }}
        >
          <section>
            <div className={styles.settingsIcon}>
              <Clock3 size={19} />
            </div>
            <h2>Attendance schedule</h2>
            <p>
              Times apply across all internship groups. Use India Standard Time
              (IST).
            </p>
            <div className={styles.formGrid}>
              <label>
                Session 1 starts
                <input
                  type="time"
                  value={settings.firstStart}
                  onChange={(e) =>
                    setSettings({ ...settings, firstStart: e.target.value })
                  }
                />
              </label>
              <label>
                Session 1 ends
                <input
                  type="time"
                  value={settings.firstEnd}
                  onChange={(e) =>
                    setSettings({ ...settings, firstEnd: e.target.value })
                  }
                />
              </label>
              <label>
                Session 2 starts
                <input
                  type="time"
                  value={settings.secondStart}
                  onChange={(e) =>
                    setSettings({ ...settings, secondStart: e.target.value })
                  }
                />
              </label>
              <label>
                Session 2 ends
                <input
                  type="time"
                  value={settings.secondEnd}
                  onChange={(e) =>
                    setSettings({ ...settings, secondEnd: e.target.value })
                  }
                />
              </label>
              <label>
                Minimum time on page (seconds)
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={settings.minimumSeconds}
                  onChange={(e) =>
                    setSettings({ ...settings, minimumSeconds: e.target.value })
                  }
                />
              </label>
            </div>
          </section>
          <section>
            <div className={styles.settingsIcon}>
              <LockKeyholeIcon />
            </div>
            <h2>Intern attendance device access</h2>
            <p>
              Interns can explore the rest of the portal on any device.
              Attendance marking can be restricted to large screens.
            </p>
            <label className={styles.toggle}>
              <span>
                <b>Require desktop for attendance</b>
                <small>
                  Minimum viewport width: 1250px. Admin access is not
                  restricted.
                </small>
              </span>
              <input
                type="checkbox"
                checked={!!settings.onlyDesktopAccess}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    onlyDesktopAccess: e.target.checked,
                  })
                }
              />
            </label>
          </section>
          <button className={styles.primary} disabled={busy}>
            <Save size={15} /> Save settings
          </button>
        </form>
      </div>
    );
  if (path === "/account") return <Account />;
  return (
    <div className={styles.page}>
      <Head
        title={title}
        sub="Clear information about how the VELoop Rewards internship portal works."
      />
      <div className={styles.policyList}>
        <section id="privacy">
          <h2>Privacy policy</h2>
          <p>
            We collect the details needed to verify internship eligibility,
            manage attendance, communicate group updates, and maintain reward
            records: name, verified email, intern ID, WhatsApp contact, group,
            domain, attendance sessions, and wallet transactions. Offer records
            are checked against the official offer-letter generator. Access is
            role-based and administrative actions should be limited to
            authorized admins. Do not share passwords or invitation links
            publicly.
          </p>
        </section>
        <section id="terms">
          <h2>Terms & conditions</h2>
          <p>
            The portal is provided to support the internship programme. Interns
            must provide accurate information, use only their assigned account,
            follow attendance time windows, remain on the attendance page for
            the required verification period, and never attempt to falsify
            attendance or rewards. Attendance requests remain pending until an
            authorized admin approves them. The programme team may correct
            records, suspend misuse, update schedules, or close a group through
            the defined approval workflow.
          </p>
        </section>
        <section id="refund">
          <h2>Refund & certification processing charges</h2>
          <p>
            Joining the internship is separate from any optional certificate
            processing or operational charge communicated by VELoop Rewards. Any
            charge must be clearly disclosed before payment with its purpose and
            coverage. Where a certificate-processing service has already been
            initiated or a digital certificate has been issued, the processing
            charge is non-refundable, except where applicable law requires
            otherwise or the payment was collected in error. Contact the
            official programme team for payment disputes or corrections. Do not
            submit payment credentials in this portal.
          </p>
        </section>
        <section id="charges">
          <h2>Charges policy</h2>
          <p>
            Attendance, account creation and InternCash balances are recorded
            according to the programme rules and are not a cash deposit. Any
            certification processing charge is distinct from rewards and must be
            communicated separately. The portal currently does not process
            certification payments; certification workflow remains subject to
            programme admin instructions.
          </p>
        </section>
        <section id="cookies">
          <h2>Cookies & session security</h2>
          <p>
            The portal stores an authentication token in browser local storage
            to maintain your signed-in session. Sign out on shared devices, keep
            your browser updated, and never share your account. Avoid using
            public computers for sensitive account actions.
          </p>
        </section>
        <section>
          <h2>Contact & support</h2>
          <p>
            For account verification, attendance approval, group assignment, or
            policy questions, contact your internship group admin through the
            official WhatsApp group.
          </p>
        </section>
      </div>
    </div>
  );
}
function Head({ title, sub, action }) {
  return (
    <div className={styles.head}>
      <div>
        <div className={styles.eyebrow}>VELOOP REWARDS / WORKSPACE</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action && <div className={styles.headAction}>{action}</div>}
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className={styles.empty}>
      <div>
        <ShieldCheck size={20} />
      </div>
      <p>{text}</p>
    </div>
  );
}
function DataTable({ headers, rows }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className={styles.selectWrap}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label}</option>
        {options.map((o) => (
          <option value={o.value} key={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Modal({ title, close, children }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeHandlerRef = useRef(close);
  closeHandlerRef.current = close;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const previousActiveElement = document.activeElement;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      'input:not([disabled]):not([type="hidden"])',
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const focusClose = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHandlerRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const nodes = Array.from(
        dialogRef.current.querySelectorAll(focusableSelector),
      ).filter((node) => node.getClientRects().length > 0);
      if (!nodes.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusClose);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      if (
        previousActiveElement &&
        typeof previousActiveElement.focus === "function"
      ) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalTitleWrap}>
            <span className={styles.modalEyebrow}>VELOOP WORKSPACE</span>
            <h2>{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.modalClose}
            onClick={close}
            aria-label="Close dialog"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}
function LockKeyholeIcon() {
  return <ShieldCheck size={19} />;
}
