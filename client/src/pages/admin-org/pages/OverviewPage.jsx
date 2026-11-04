import {
  Activity,
  Bell,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  Gift,
  Moon,
  RefreshCw,
  Sun,
  Users,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Stat } from "../../../components/ui/Primitives.jsx";

export default function OverviewPage({
  session,
  overview,
  approvals,
  chartData,
  refreshing,
  refresh,
  onToggleTheme,
  theme,
  setTab,
}) {
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "Admin";

  return (
    <div className="space-y-6">
      <div className="page-heading flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0">
          <div className="eyebrow">ADMIN WORKSPACE</div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Good to see you, {firstName}.
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keep cohorts, attendance approvals and rewards running smoothly from
            one place.
          </p>
        </div>

        <div className="page-actions flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center justify-center gap-2"
            onClick={() => refresh(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-secondary inline-flex items-center justify-center gap-2"
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}

            {theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
        </div>
      </div>

      <div className="stats-grid grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <Stat
          label="Total interns"
          value={overview?.totalInterns ?? 0}
          icon={<Users size={17} />}
          sub="Registered intern accounts"
        />

        <Stat
          label="Internship groups"
          value={overview?.groups ?? 0}
          icon={<Activity size={17} />}
          sub="Across all cohorts"
        />

        <Stat
          label="Active groups"
          value={overview?.activeGroups ?? 0}
          icon={<CalendarCheck size={17} />}
          sub="Currently running"
        />

        <Stat
          label="Pending attendance"
          value={approvals.length}
          icon={<ClipboardCheck size={17} />}
          sub="Awaiting admin approval"
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-2">
        <section className="panel min-w-0">
          <div className="panel-header flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2>Attendance activity</h2>
              <p>Recent requests based on selected filters in reports.</p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-small inline-flex shrink-0 items-center justify-center gap-2"
              onClick={() => setTab("attendance")}
            >
              View reports
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="chart-box min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -12,
                  bottom: 4,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted)",
                  }}
                  tickFormatter={(value) => value.slice(5)}
                  tickMargin={8}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted)",
                  }}
                  width={30}
                />

                <Tooltip />

                <Bar
                  dataKey="approved"
                  name="Approved sessions"
                  fill="#20a57e"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="pending"
                  name="Pending requests"
                  fill="#e6b74e"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel min-w-0">
          <div className="panel-header">
            <div>
              <h2>Quick actions</h2>
              <p>Common admin tasks, one click away.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="btn btn-secondary flex items-center justify-center gap-2"
              onClick={() => setTab("groups")}
            >
              <Users size={16} />
              Manage groups
            </button>

            <button
              type="button"
              className="btn btn-secondary flex items-center justify-center gap-2"
              onClick={() => setTab("approvals")}
            >
              <ClipboardCheck size={16} />
              Review attendance
            </button>

            <button
              type="button"
              className="btn btn-secondary flex items-center justify-center gap-2"
              onClick={() => setTab("notifications")}
            >
              <Bell size={16} />
              Send notice
            </button>

            <button
              type="button"
              className="btn btn-secondary flex items-center justify-center gap-2"
              onClick={() => setTab("promos")}
            >
              <Gift size={16} />
              Create promo
            </button>
          </div>

          <div className="notice mt-4">
            Two different authorized admin accounts are required to complete a
            group. The cumulative archive is updated when a group is archived.
          </div>
        </section>
      </div>
    </div>
  );
}
