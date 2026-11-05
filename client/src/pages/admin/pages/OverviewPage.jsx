// import { useMemo, useState } from "react";
// import {
//   Activity, ArrowUpRight, Bell, CalendarCheck, CheckCircle2, ChevronRight,
//   ClipboardCheck, Clock3, Gift, MessageCircle, RefreshCw, ShieldAlert, Users,
// } from "lucide-react";
// import {
//   Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
// } from "recharts";
// import AdminPageHeader from "../components/AdminPageHeader.jsx";
// import AdminStatCard from "../components/AdminStatCard.jsx";
// import { buildAttendanceRiskLists } from "../utils/adminAttendance.js";
// import styles from "./OverviewPage.module.css";

// const phoneLink = (value) => {
//   const digits = String(value || "").replace(/\D/g, "");
//   return digits.length >= 10 ? `https://wa.me/${digits}` : "";
// };

// function RiskList({ title, subtitle, rows, empty, accent, onViewDirectory }) {
//   return (
//     <section className={`${styles.riskPanel} ${styles[accent]}`}>
//       <div className="flex items-start justify-between gap-3">
//         <div className="min-w-0">
//           <h3>{title}</h3>
//           <p>{subtitle}</p>
//         </div>
//         <span className={styles.riskCount}>{rows.length}</span>
//       </div>
//       {rows.length ? (
//         <div className={styles.riskList}>
//           {rows.map(({ intern, summary }) => {
//             const link = phoneLink(intern.whatsappNumber);
//             return (
//               <article key={intern._id} className={styles.riskItem}>
//                 <div className={styles.avatar}>{(intern.name || "I").trim().charAt(0).toUpperCase()}</div>
//                 <div className="min-w-0 flex-1">
//                   <strong>{intern.name || "Unnamed intern"}</strong>
//                   <span>{intern.internId || intern.email || "No intern ID"} · {intern.group?.name || "No group"}</span>
//                   <small>
//                     {accent === "orange" ? `${summary.explicitlyMissedFirst} first-session missed record(s)` :
//                      accent === "purple" ? `${summary.explicitlyMissedSecond} second-session missed record(s)` :
//                      `${summary.workingDaysSinceLast} scheduled day(s) since last approved session`}
//                     {intern.whatsappNumber ? ` · ${intern.whatsappNumber}` : ""}
//                   </small>
//                 </div>
//                 {link ? (
//                   <a className={styles.whatsapp} href={link} target="_blank" rel="noreferrer" aria-label={`Contact ${intern.name} on WhatsApp`}>
//                     <MessageCircle size={16}/>
//                   </a>
//                 ) : null}
//               </article>
//             );
//           })}
//           {rows.length > 0 ? <button className={styles.viewAll} onClick={onViewDirectory}>Open intern directory <ChevronRight size={15}/></button> : null}
//         </div>
//       ) : (
//         <div className={styles.riskEmpty}><CheckCircle2 size={18}/>{empty}</div>
//       )}
//     </section>
//   );
// }

// export default function OverviewPage({
//   session, overview, approvals, chartData, refreshing, refresh,
//   setTab, interns = [], attendance = [],
// }) {
//   const [riskTab, setRiskTab] = useState("first");
//   const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "Admin";
//   const risks = useMemo(() => buildAttendanceRiskLists(interns, attendance), [interns, attendance]);
//   const activeRows = riskTab === "first" ? risks.firstSession : riskTab === "second" ? risks.secondSession : risks.inactive;

//   return (
//     <div className={`${styles.page} admin-page space-y-6`}>
//       <AdminPageHeader
//         eyebrow="VELOOP CONTROL CENTRE"
//         title={`Welcome back, ${firstName}.`}
//         description="A live operational view of your internship cohorts, attendance health and reward activity."
//         icon={Activity}
//         accent="orange"
//         actions={
//           <>
//             <button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={() => refresh(true)} disabled={refreshing}>
//               <RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/> Refresh
//             </button>
//           </>
//         }
//       />

//       <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Workspace metrics">
//         <AdminStatCard label="Total interns" value={overview?.totalInterns ?? interns.length} hint="Registered intern accounts" icon={Users} tone="orange" onClick={() => setTab("interns")}/>
//         <AdminStatCard label="Internship groups" value={overview?.groups ?? 0} hint="Across all cohorts" icon={Activity} tone="cyan" onClick={() => setTab("groups")}/>
//         <AdminStatCard label="Active groups" value={overview?.activeGroups ?? 0} hint="Currently running" icon={CalendarCheck} tone="green" onClick={() => setTab("groups")}/>
//         <AdminStatCard label="Pending approvals" value={approvals.length} hint="Awaiting admin review" icon={ClipboardCheck} tone="purple" onClick={() => setTab("approvals")}/>
//       </section>

//       <section className={styles.riskSection}>
//         <div className={styles.sectionHeading}>
//           <div>
//             <p className={styles.sectionEyebrow}>EARLY ATTENTION</p>
//             <h2>Interns who may need a check-in</h2>
//             <p>Identify missed-session records and prolonged gaps in approved attendance.</p>
//           </div>
//           <span className={styles.attentionTag}><ShieldAlert size={15}/> Follow-up queue</span>
//         </div>
//         <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//           <AdminStatCard label="Missed first session" value={risks.firstSession.length} hint="Interns with explicit missed records" icon={Clock3} tone="orange" active={riskTab === "first"} onClick={() => setRiskTab("first")}/>
//           <AdminStatCard label="Missed second session" value={risks.secondSession.length} hint="Interns with explicit missed records" icon={CalendarCheck} tone="purple" active={riskTab === "second"} onClick={() => setRiskTab("second")}/>
//           <AdminStatCard label="3+ days without approval" value={risks.inactive.length} hint="Based on scheduled days since last approved session" icon={ShieldAlert} tone="red" active={riskTab === "inactive"} onClick={() => setRiskTab("inactive")}/>
//         </div>
//         <RiskList
//           title={riskTab === "first" ? "First-session attention" : riskTab === "second" ? "Second-session attention" : "Attendance inactivity"}
//           subtitle={riskTab === "inactive" ? "Interns with a gap of at least three scheduled days since their last approved session." : "Interns whose returned attendance records contain an explicit missed status."}
//           rows={activeRows}
//           accent={riskTab === "first" ? "orange" : riskTab === "second" ? "purple" : "cyan"}
//           empty="No interns currently match this attention rule."
//           onViewDirectory={() => setTab("interns")}
//         />
//         <p className={styles.dataNote}>
//           Note: the supplied attendance API returns session records, not a complete holiday calendar. The dashboard counts only explicit missed statuses as missed; sessions with no record are not automatically treated as missed.
//         </p>
//       </section>

//       <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-2">
//         <section className={`${styles.panel} min-w-0`}>
//           <div className={styles.panelHeader}>
//             <div><span className={styles.panelIconCyan}><Activity size={17}/></span><div><h2>Attendance activity</h2><p>Recent records from the currently loaded report.</p></div></div>
//             <button type="button" className="btn btn-secondary btn-small" onClick={() => setTab("attendance")}>Open reports <ChevronRight size={14}/></button>
//           </div>
//           <div className={styles.chartBox}>
//             {chartData?.length ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={chartData} margin={{top:8,right:8,left:-12,bottom:4}}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
//                   <XAxis dataKey="date" tick={{fontSize:11,fill:"var(--muted)"}} tickFormatter={(v)=>String(v).slice(5)} tickMargin={8}/>
//                   <YAxis allowDecimals={false} tick={{fontSize:11,fill:"var(--muted)"}} width={30}/>
//                   <Tooltip/>
//                   <Bar dataKey="approved" name="Approved sessions" fill="#10b981" radius={[6,6,0,0]}/>
//                   <Bar dataKey="pending" name="Pending requests" fill="#f59e0b" radius={[6,6,0,0]}/>
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : <div className={styles.chartEmpty}><CalendarCheck size={22}/>Attendance activity will appear when report data is available.</div>}
//           </div>
//         </section>

//         <section className={`${styles.panel} min-w-0`}>
//           <div className={styles.panelHeader}>
//             <div><span className={styles.panelIconOrange}><Activity size={17}/></span><div><h2>Quick actions</h2><p>Frequently used admin tasks.</p></div></div>
//           </div>
//           <div className={styles.quickGrid}>
//             <button onClick={() => setTab("groups")}><Users size={18}/><span>Manage groups</span><ArrowUpRight size={15}/></button>
//             <button onClick={() => setTab("approvals")}><ClipboardCheck size={18}/><span>Review attendance</span><ArrowUpRight size={15}/></button>
//             <button onClick={() => setTab("notifications")}><Bell size={18}/><span>Send a notice</span><ArrowUpRight size={15}/></button>
//             <button onClick={() => setTab("promos")}><Gift size={18}/><span>Create promo code</span><ArrowUpRight size={15}/></button>
//           </div>
//           <div className={styles.policyNote}><ShieldAlert size={17}/><p>Attendance rewards are credited after approval. Keep group archives before deleting live records.</p></div>
//         </section>
//       </div>
//     </div>
//   );
// }

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Gift,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
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

import AdminPageHeader from "../components/AdminPageHeader.jsx";
import AdminStatCard from "../components/AdminStatCard.jsx";
import { buildAttendanceRiskLists } from "../utils/adminAttendance.js";

import styles from "./OverviewPage.module.css";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const phoneLink = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  return digits.length >= 10 ? `https://wa.me/${digits}` : "";
};

/* -------------------------------------------------------------------------- */
/* Session attendance summary                                                 */
/* -------------------------------------------------------------------------- */

function SessionAttendanceCard({
  sessionName,
  attendance = {},
  tone,
  icon: Icon,
  onClick,
}) {
  const present = Number(attendance.present || 0);
  const missed = Number(attendance.missed || 0);
  const pending = Number(attendance.pending || 0);

  return (
    <div className={`${styles.sessionCard} ${styles[tone] || ""}`}>
      <div className={styles.sessionCardTop}>
        <div>
          <span className={styles.sessionCardLabel}>{sessionName}</span>

          <div className={styles.sessionPresentValue}>{present}</div>

          <span className={styles.sessionPresentCaption}>Interns present</span>
        </div>

        <span className={styles.sessionIcon}>
          <Icon size={20} />
        </span>
      </div>

      <div className={styles.sessionCardDivider} />

      <div className={styles.sessionStatusRow}>
        <span className={styles.missedStatus}>
          <span className={styles.statusDot} />M <strong>{missed}</strong>
        </span>

        <span className={styles.statusSeparator}>//</span>

        <span className={styles.pendingStatus}>
          <span className={styles.statusDot} />P <strong>{pending}</strong>
        </span>
      </div>

      <button type="button" className={styles.sessionAction} onClick={onClick}>
        View attendance
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Attendance risk list                                                       */
/* -------------------------------------------------------------------------- */

function RiskList({ title, subtitle, rows, empty, accent, onViewDirectory }) {
  return (
    <section className={`${styles.riskPanel} ${styles[accent]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <span className={styles.riskCount}>{rows.length}</span>
      </div>

      {rows.length ? (
        <div className={styles.riskList}>
          {rows.map(({ intern, summary }) => {
            const link = phoneLink(intern.whatsappNumber);

            return (
              <article key={intern._id} className={styles.riskItem}>
                <div className={styles.avatar}>
                  {(intern.name || "I").trim().charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <strong>{intern.name || "Unnamed intern"}</strong>

                  <span>
                    {intern.internId || intern.email || "No intern ID"}
                    {" · "}
                    {intern.group?.name || "No group"}
                  </span>

                  <small>
                    {accent === "orange"
                      ? `${summary.explicitlyMissedFirst} first-session missed record(s)`
                      : accent === "purple"
                        ? `${summary.explicitlyMissedSecond} second-session missed record(s)`
                        : `${summary.workingDaysSinceLast} scheduled day(s) since last approved session`}

                    {intern.whatsappNumber ? ` · ${intern.whatsappNumber}` : ""}
                  </small>
                </div>

                {link ? (
                  <a
                    className={styles.whatsapp}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Contact ${intern.name} on WhatsApp`}
                  >
                    <MessageCircle size={16} />
                  </a>
                ) : null}
              </article>
            );
          })}

          <button className={styles.viewAll} onClick={onViewDirectory}>
            Open intern directory
            <ChevronRight size={15} />
          </button>
        </div>
      ) : (
        <div className={styles.riskEmpty}>
          <CheckCircle2 size={18} />
          {empty}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Overview page                                                              */
/* -------------------------------------------------------------------------- */

export default function OverviewPage({
  session,
  overview,
  approvals,
  chartData,
  refreshing,
  refresh,
  setTab,
  interns = [],
  attendance = [],
}) {
  const [riskTab, setRiskTab] = useState("first");

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "Admin";

  /* ---------------------------------------------------------------------- */
  /* Today's session statistics                                             */
  /* ---------------------------------------------------------------------- */

  const session1 = overview?.attendanceBySession?.session1 || {
    present: 0,
    missed: 0,
    pending: 0,
  };

  const session2 = overview?.attendanceBySession?.session2 || {
    present: 0,
    missed: 0,
    pending: 0,
  };

  const combinedPresent =
    overview?.presentToday ??
    Number(session1.present || 0) + Number(session2.present || 0);

  /* ---------------------------------------------------------------------- */
  /* Attendance risk calculation                                            */
  /* ---------------------------------------------------------------------- */

  const risks = useMemo(
    () => buildAttendanceRiskLists(interns, attendance),
    [interns, attendance],
  );

  const activeRows =
    riskTab === "first"
      ? risks.firstSession
      : riskTab === "second"
        ? risks.secondSession
        : risks.inactive;

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      {/* ================================================================== */}
      {/* PAGE HEADER                                                        */}
      {/* ================================================================== */}

      <AdminPageHeader
        eyebrow="VELOOP CONTROL CENTRE"
        title={`Welcome back, ${firstName}.`}
        description="A live operational view of your internship cohorts, attendance health and reward activity."
        icon={Activity}
        accent="orange"
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary inline-flex items-center gap-2"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </>
        }
      />

      {/* ================================================================== */}
      {/* GENERAL WORKSPACE METRICS                                         */}
      {/* ================================================================== */}

      <section
        className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4"
        aria-label="Workspace metrics"
      >
        <AdminStatCard
          label="Total interns"
          value={overview?.totalInterns ?? interns.length}
          hint="Registered intern accounts"
          icon={Users}
          tone="orange"
          onClick={() => setTab("interns")}
        />

        <AdminStatCard
          label="Internship groups"
          value={overview?.groups ?? 0}
          hint="Across all cohorts"
          icon={Activity}
          tone="cyan"
          onClick={() => setTab("groups")}
        />

        <AdminStatCard
          label="Active groups"
          value={overview?.activeGroups ?? 0}
          hint="Currently running"
          icon={CalendarCheck}
          tone="green"
          onClick={() => setTab("groups")}
        />

        <AdminStatCard
          label="Pending approvals"
          value={approvals.length}
          hint="Awaiting admin review"
          icon={ClipboardCheck}
          tone="purple"
          onClick={() => setTab("approvals")}
        />
      </section>

      {/* ================================================================== */}
      {/* TODAY'S ATTENDANCE                                                 */}
      {/* ================================================================== */}

      <section className={styles.sessionSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>DAILY ATTENDANCE</p>

            <h2>Today's attendance overview</h2>

            <p>View total attendance and separate counts for both sessions.</p>
          </div>

          <span className={styles.attentionTag}>
            <CalendarCheck size={15} />
            Session 1 &amp; 2
          </span>
        </div>

        <div className={styles.sessionGrid}>
          {/* Combined attendance */}

          <div className={`${styles.sessionCard} ${styles.totalSessionCard}`}>
            <div className={styles.sessionCardTop}>
              <div>
                <span className={styles.sessionCardLabel}>
                  Total present today
                </span>

                <div className={styles.sessionPresentValue}>
                  {combinedPresent}
                </div>

                <span className={styles.sessionPresentCaption}>
                  Approved attendance records
                </span>
              </div>

              <span className={styles.sessionIcon}>
                <CheckCircle2 size={20} />
              </span>
            </div>

            <div className={styles.sessionCardDivider} />

            <div className={styles.combinedBreakdown}>
              <span>
                S1 <strong>{session1.present || 0}</strong>
              </span>

              <span className={styles.statusSeparator}>+</span>

              <span>
                S2 <strong>{session2.present || 0}</strong>
              </span>
            </div>

            <button
              type="button"
              className={styles.sessionAction}
              onClick={() => setTab("attendance")}
            >
              View attendance
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Session 1 */}

          <SessionAttendanceCard
            sessionName="Session 1 present"
            attendance={session1}
            tone="orange"
            icon={Clock3}
            onClick={() => setTab("attendance")}
          />

          {/* Session 2 */}

          <SessionAttendanceCard
            sessionName="Session 2 present"
            attendance={session2}
            tone="purple"
            icon={CalendarCheck}
            onClick={() => setTab("attendance")}
          />
        </div>

        <p className={styles.attendanceLegend}>
          <span className={styles.legendMissed}>M</span>
          Missed / Absent / Rejected
          <span className={styles.legendDivider}>·</span>
          <span className={styles.legendPending}>P</span>
          Pending admin approval
        </p>
      </section>

      {/* ================================================================== */}
      {/* ATTENDANCE RISK                                                    */}
      {/* ================================================================== */}

      <section className={styles.riskSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>EARLY ATTENTION</p>

            <h2>Interns who may need a check-in</h2>

            <p>
              Identify missed-session records and prolonged gaps in approved
              attendance.
            </p>
          </div>

          <span className={styles.attentionTag}>
            <ShieldAlert size={15} />
            Follow-up queue
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <AdminStatCard
            label="Missed first session"
            value={risks.firstSession.length}
            hint="Interns with explicit missed records"
            icon={Clock3}
            tone="orange"
            active={riskTab === "first"}
            onClick={() => setRiskTab("first")}
          />

          <AdminStatCard
            label="Missed second session"
            value={risks.secondSession.length}
            hint="Interns with explicit missed records"
            icon={CalendarCheck}
            tone="purple"
            active={riskTab === "second"}
            onClick={() => setRiskTab("second")}
          />

          <AdminStatCard
            label="3+ days without approval"
            value={risks.inactive.length}
            hint="Based on scheduled days since last approved session"
            icon={ShieldAlert}
            tone="red"
            active={riskTab === "inactive"}
            onClick={() => setRiskTab("inactive")}
          />
        </div>

        <RiskList
          title={
            riskTab === "first"
              ? "First-session attention"
              : riskTab === "second"
                ? "Second-session attention"
                : "Attendance inactivity"
          }
          subtitle={
            riskTab === "inactive"
              ? "Interns with a gap of at least three scheduled days since their last approved session."
              : "Interns whose returned attendance records contain an explicit missed status."
          }
          rows={activeRows}
          accent={
            riskTab === "first"
              ? "orange"
              : riskTab === "second"
                ? "purple"
                : "cyan"
          }
          empty="No interns currently match this attention rule."
          onViewDirectory={() => setTab("interns")}
        />

        <p className={styles.dataNote}>
          Note: the supplied attendance API returns session records, not a
          complete holiday calendar. The dashboard counts only explicit missed
          statuses as missed; sessions with no record are not automatically
          treated as missed.
        </p>
      </section>

      {/* ================================================================== */}
      {/* CHART AND QUICK ACTIONS                                            */}
      {/* ================================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-2">
        {/* Attendance chart */}

        <section className={`${styles.panel} min-w-0`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIconCyan}>
                <Activity size={17} />
              </span>

              <div>
                <h2>Attendance activity</h2>
                <p>Recent records from the currently loaded report.</p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setTab("attendance")}
            >
              Open reports
              <ChevronRight size={14} />
            </button>
          </div>

          <div className={styles.chartBox}>
            {chartData?.length ? (
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
                      fontSize: 11,
                      fill: "var(--muted)",
                    }}
                    tickFormatter={(value) => String(value).slice(5)}
                    tickMargin={8}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--muted)",
                    }}
                    width={30}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="approved"
                    name="Approved sessions"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="pending"
                    name="Pending requests"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>
                <CalendarCheck size={22} />
                Attendance activity will appear when report data is available.
              </div>
            )}
          </div>
        </section>

        {/* Quick actions */}

        <section className={`${styles.panel} min-w-0`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIconOrange}>
                <Activity size={17} />
              </span>

              <div>
                <h2>Quick actions</h2>
                <p>Frequently used admin tasks.</p>
              </div>
            </div>
          </div>

          <div className={styles.quickGrid}>
            <button onClick={() => setTab("groups")}>
              <Users size={18} />
              <span>Manage groups</span>
              <ArrowUpRight size={15} />
            </button>

            <button onClick={() => setTab("approvals")}>
              <ClipboardCheck size={18} />
              <span>Review attendance</span>
              <ArrowUpRight size={15} />
            </button>

            <button onClick={() => setTab("notifications")}>
              <Bell size={18} />
              <span>Send a notice</span>
              <ArrowUpRight size={15} />
            </button>

            <button onClick={() => setTab("promos")}>
              <Gift size={18} />
              <span>Create promo code</span>
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className={styles.policyNote}>
            <ShieldAlert size={17} />

            <p>
              Attendance rewards are credited after approval. Keep group
              archives before deleting live records.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
