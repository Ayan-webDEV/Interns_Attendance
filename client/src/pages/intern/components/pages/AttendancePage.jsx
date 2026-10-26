import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Wallet,
  UserRound,
  LockKeyhole,
  Send,
  History,
  CircleCheck,
  CircleAlert,
  Copy,
  Mail,
  Fingerprint,
  BriefcaseBusiness,
  KeyRound,
  Sparkles,
  CircleUserRound,
  BadgeCheck,
  Info,
  CalendarDays,
  Camera,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Field, Stat } from "../../../../components/ui/Primitives.jsx";
import AttendanceSessionCard from "../AttendanceSessionCard.jsx";
import { dateToday, money } from "../../../../lib/session.js";
import styles from "./AttendancePage.module.css";
import styling from "./AttendanceHeader.module.css";
import AttendanceCalendar, {
  countMissedSessions,
} from "./AttendanceCalendar/AttendanceCalendar.jsx";
import AttendanceHistory from "./AttendanceHistory/AttendanceHistory.jsx";

const approvedStatus = ["approved", "admin_corrected_present"];
const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const keyDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export default function AttendancePage({ data }) {
  const {
    session,
    tab,
    setTab,
    notify,
    theme,
    onToggleTheme,
    me,
    setMe,
    group,
    setGroup,
    today,
    setToday,
    records,
    setRecords,
    wallet,
    setWallet,
    notifications,
    setNotifications,
    promoCode,
    setPromoCode,
    password,
    setPassword,
    from,
    setFrom,
    to,
    setTo,
    history,
    setHistory,
    attSession,
    setAttSession,
    remaining,
    setRemaining,
    busyLabel,
    setBusyLabel,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    calendarMonth,
    setCalendarMonth,
    refresh,
    run,
    profilePictureStorageKey,
    profilePicture,
    setProfilePicture,
    profilePictureError,
    setProfilePictureError,
    handleProfilePictureChange,
    handleRemoveProfilePicture,
    startAttendance,
    markAttendance,
    redeem,
    setNewPassword,
    markRead,
    firstRecord,
    secondRecord,
    chartData,
    approvedDays,
    dateStart,
    fallbackEnd,
    dateEnd,
    monthDate,
    monthLabel,
    calendar,
    changeMonth,
    groupHasStarted,
    nav,
  } = data;

  const missedSessions = countMissedSessions(calendar, today?.windows);

  return (
    <div className={styles.attendancePage}>
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">YOUR INTERNSHIP</div>
            <h1>Welcome back, {me.name?.split(" ")[0] || "intern"}.</h1>
            <p>
              {group?.name
                ? `You are a member of ${group.name}.`
                : "Your assigned internship group will appear here."}
            </p>
          </div>
          <div className="page-actions">
            <span className="badge">
              {today?.serverTimeIST || "India Standard Time"}
            </span>
            <button
              className={`btn btn-secondary ${refreshing ? "is-refreshing" : ""}`}
              onClick={() => refresh(true)}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={onToggleTheme}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} Theme
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <Stat
            label="Approved days"
            value={approvedDays}
            icon={<CalendarCheck size={17} />}
            sub="Approved Attendance Days"
          />
          <Stat
            label="Pending requests"
            value={records.filter((r) => r.status === "pending").length}
            icon={<Clock3 size={17} />}
            sub="Waiting for admin review"
          />
          <Stat
            label="InternCash balance"
            value={`${wallet?.balance ?? 0} IC`}
            icon={<Wallet size={17} />}
            sub="Welcome + approved rewards"
          />
          <Stat
            label="Group duration"
            value={`${group?.durationDays || 28} days`}
            icon={<Activity size={17} />}
            sub={
              dateEnd ? `Ends ${fmtDate(dateEnd)}` : "Waiting for group start"
            }
          />
        </div>
        {!group || group.status === "registration" ? (
          <section className="panel">
            <div
              className="notice"
              style={{
                display: "flex",
                gap: 13,
                alignItems: "flex-start",
              }}
            >
              <LockKeyhole size={24} color="var(--accent)" />
              <div>
                <h2 style={{ marginBottom: 7 }}>
                  Your internship has not started yet
                </h2>
                <p style={{ margin: 0 }}>
                  Please wait for your group admin to activate the internship.
                  Attendance will become available after the official start
                  date. If you need clarification, contact your group admin.
                </p>
                <p className="small" style={{ marginBottom: 0, marginTop: 9 }}>
                  Assigned group:{" "}
                  <b style={{ color: "var(--text)" }}>
                    {group?.name || "Not assigned"}
                  </b>
                </p>
              </div>
            </div>
          </section>
        ) : group.status === "completed" ? (
          <section className="panel">
            <div className="notice success">
              <CheckCircle2
                size={20}
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              Your internship group is completed. Attendance is closed and your
              certification status is unlocked.
            </div>
          </section>
        ) : !groupHasStarted ? (
          <section className="panel">
            <div className="notice">
              <LockKeyhole
                size={20}
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              <b>Attendance is not open for today.</b>
              <p>
                Your group runs from {fmtDate(group.actualStartDate)} to{" "}
                {fmtDate(dateEnd)}. Please check the group dates and contact
                your admin if they look incorrect.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className={`panel ${styles.attendanceExperience}`}>
              {/* Header */}
              <div
                className={`${styling.attendanceHeader} mb-7 relative isolate overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900 sm:p-6`}
              >
                {/* Decorative background */}
                <div className={styling.headerGlow} aria-hidden="true" />
                <div className={styling.headerGrid} aria-hidden="true" />

                <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Heading */}
                  <div
                    className={`${styling.attendanceHeading} min-w-0 flex-1`}
                  >
                    <span
                      className={`${styling.attendanceEyebrow} mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] sm:text-[11px]`}
                    >
                      <span className={styling.headingDot} />
                      Daily attendance
                    </span>

                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Today's attendance
                        <span className={styling.titleAccent}>.</span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays
                            size={15}
                            strokeWidth={2}
                            className="shrink-0 text-sky-500"
                            aria-hidden="true"
                          />
                          <span>{fmtDate(new Date())}</span>
                        </span>

                        <span
                          className={styling.headerSeparator}
                          aria-hidden="true"
                        >
                          /
                        </span>

                        <span className="inline-flex min-w-0 items-center gap-2">
                          <UsersRound
                            size={15}
                            strokeWidth={2}
                            className="shrink-0 text-sky-500"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {group?.name || "Your internship group"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                      Stay consistent, check in on time, and keep your
                      internship journey on track.
                    </p>
                  </div>

                  {/* Schedule status */}
                  <div className="flex shrink-0 items-center sm:justify-end">
                    <div
                      className={`${styling.scheduleBadge} ${
                        today?.isSunday
                          ? styling.holidayBadge
                          : styling.activeBadge
                      } inline-flex items-center gap-3 rounded-2xl px-4 py-3`}
                      role="status"
                      aria-live="polite"
                    >
                      <span className={styling.scheduleIcon}>
                        <Clock3 size={19} strokeWidth={2} aria-hidden="true" />
                      </span>

                      <span className="flex flex-col gap-1">
                        <span className={styling.scheduleLabel}>
                          {today?.isSunday ? "WEEKLY BREAK" : "DAILY SCHEDULE"}
                        </span>

                        <span className={styling.scheduleValue}>
                          {today?.isSunday ? "Sunday holiday" : "IST schedule"}
                        </span>
                      </span>

                      <span className={styling.statusDot} aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Bottom accent */}
                <div className={styling.headerBottomLine} aria-hidden="true" />
              </div>

              {today?.isSunday ? (
                /* Holiday state */
                <div className={styles.holidayExperience}>
                  <div className={styles.holidayIllustration}>
                    <div className={styles.holidayIcon}>
                      <LockKeyhole size={27} strokeWidth={1.8} />
                    </div>
                    <span className={styles.holidaySparkle}>✦</span>
                  </div>

                  <span className={styles.holidayLabel}>
                    YOUR WELL-DESERVED BREAK
                  </span>

                  <h3>Sunday is a holiday</h3>

                  <p>
                    Attendance is paused for today. Recharge, take a break, and
                    come back ready for your next internship session.
                  </p>

                  <div className={styles.holidayFooter}>
                    <span className={styles.holidayFooterIcon}>✓</span>
                    No attendance action is needed today
                  </div>
                </div>
              ) : attSession ? (
                /* Active timer */
                (() => {
                  const duration = Math.max(
                    0,
                    Number(attSession.minimumSeconds) || 0,
                  );

                  const secondsLeft = Math.max(0, Number(remaining) || 0);

                  const progress =
                    duration > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            ((duration - secondsLeft) / duration) * 100,
                          ),
                        )
                      : 100;

                  return (
                    <div className={styles.activeSession}>
                      <div className={styles.activeSessionTop}>
                        <div className={styles.activeSessionIdentity}>
                          <span className={styles.sessionNumberIcon}>
                            <LockKeyhole size={17} />
                          </span>

                          <div>
                            <span className={styles.activeSessionLabel}>
                              SESSION {attSession.sessionNumber}
                            </span>
                            <span className={styles.activeSessionSubtext}>
                              Secure attendance verification
                            </span>
                          </div>
                        </div>

                        <span
                          className={
                            secondsLeft > 0
                              ? styles.timerRunningBadge
                              : styles.timerReadyBadge
                          }
                        >
                          <span className={styles.statusDot} />
                          {secondsLeft > 0 ? "In progress" : "Ready to submit"}
                        </span>
                      </div>

                      <div className={styles.timerContent}>
                        <div className={styles.timerDial}>
                          <svg
                            className={styles.timerSvg}
                            viewBox="0 0 180 180"
                            aria-hidden="true"
                          >
                            <circle
                              className={styles.timerTrack}
                              cx="90"
                              cy="90"
                              r="77"
                            />
                            <circle
                              className={styles.timerArc}
                              cx="90"
                              cy="90"
                              r="77"
                              strokeDasharray={`${(progress / 100) * 483.8} 483.8`}
                            />
                          </svg>

                          <div className={styles.timerReadout}>
                            <span className={styles.timerCaption}>
                              {secondsLeft > 0 ? "TIME LEFT" : "COMPLETE"}
                            </span>

                            <span
                              className={styles.timerValue}
                              role="timer"
                              aria-live="off"
                            >
                              {secondsLeft > 0
                                ? `${Math.floor(secondsLeft / 60)
                                    .toString()
                                    .padStart(2, "0")}:${(secondsLeft % 60)
                                    .toString()
                                    .padStart(2, "0")}`
                                : "Ready"}
                            </span>

                            <span className={styles.timerUnit}>
                              {secondsLeft > 0
                                ? "minutes : seconds"
                                : "You can continue"}
                            </span>
                          </div>
                        </div>

                        <h3>
                          {secondsLeft > 0
                            ? "You're on your way!"
                            : "Your session is complete"}
                        </h3>

                        <p className={styles.timerDescription}>
                          {secondsLeft > 0
                            ? "Keep this page open while your verification timer runs. Once it finishes, you can submit your attendance for admin review."
                            : "Great job! Your wait is complete. Submit your attendance request for admin approval."}
                        </p>
                      </div>

                      <div className={styles.progressSection}>
                        <div className={styles.progressLabels}>
                          <span>Verification progress</span>
                          <strong>{Math.round(progress)}%</strong>
                        </div>

                        <div
                          className={styles.progressTrack}
                          role="progressbar"
                          aria-label="Verification progress"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(progress)}
                        >
                          <span
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className={styles.timerActions}>
                        <button
                          type="button"
                          className={styles.cancelSessionButton}
                          onClick={() => setAttSession(null)}
                        >
                          Cancel session
                        </button>

                        <button
                          type="button"
                          className={styles.submitSessionButton}
                          disabled={secondsLeft > 0}
                          onClick={markAttendance}
                        >
                          <Send size={16} />
                          Submit attendance
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>

                      <div className={styles.reviewReminder}>
                        <span className={styles.reviewReminderIcon}>
                          <LockKeyhole size={15} />
                        </span>
                        <p>
                          <strong>Fair and secure attendance.</strong> Your
                          request is counted only after admin approval.
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  {/* Attendance sessions */}
                  <div className={`session-grid ${styles.engagingSessionGrid}`}>
                    <AttendanceSessionCard
                      number={1}
                      label="First attendance"
                      window={`${
                        today?.windows?.first?.label || "9:30 AM – 12:30 PM"
                      } IST`}
                      record={firstRecord}
                      open={today?.windows?.first?.open}
                      disabled={!today?.windows?.first?.open}
                      reward={1}
                      onStart={() => startAttendance(1)}
                      note="Complete your session successfully to earn 1 InternCash, subject to admin approval and verification."
                    />

                    <AttendanceSessionCard
                      number={2}
                      label="Re-attendance"
                      window={`${
                        today?.windows?.second?.label || "1:00 PM – 3:30 PM"
                      } IST`}
                      record={secondRecord}
                      open={today?.windows?.second?.open}
                      disabled={!today?.windows?.second?.open}
                      reward={3}
                      onStart={() => startAttendance(2)}
                      note="Missed the first session? You can still request re-attendance. Earn 3 InternCash after admin approval."
                    />
                  </div>
                  <div
                    className={`${styling.approvalBanner} mt-7 group relative isolate overflow-hidden rounded-3xl border p-5 sm:p-6 lg:p-7`}
                  >
                    {/* Ambient background effects */}
                    <div className={styling.approvalGlow} aria-hidden="true" />
                    <div className={styling.approvalOrb} aria-hidden="true" />
                    <div className={styling.approvalGrid} aria-hidden="true" />

                    {/* Top accent */}
                    <div
                      className={styling.approvalTopAccent}
                      aria-hidden="true"
                    />

                    <div className="relative z-10">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          <div className={styling.approvalIconFrame}>
                            <span
                              className={styling.approvalIconHalo}
                              aria-hidden="true"
                            />

                            <span className={styling.approvalIcon}>
                              <LockKeyhole
                                size={23}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                            </span>
                          </div>

                          <div className="min-w-0 pt-0.5">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className={styling.approvalEyebrow}>
                                <span
                                  className={styling.approvalEyebrowDot}
                                  aria-hidden="true"
                                />
                                ATTENDANCE SECURITY
                              </span>

                              <span className={styling.reviewBadge}>
                                <ShieldCheck size={12} aria-hidden="true" />
                                Admin verified
                              </span>
                            </div>

                            <h3
                              className={`${styling.approvalTitle} text-lg font-extrabold tracking-tight sm:text-xl`}
                            >
                              Your check-in. Your progress.
                            </h3>

                            <p
                              className={`${styling.approvalDescription} mt-2 max-w-2xl text-xs leading-6 sm:text-sm`}
                            >
                              Every check-in goes through an admin review to
                              help ensure accurate attendance records and fair
                              reward distribution.
                            </p>
                          </div>
                        </div>

                        {/* Decorative shield indicator */}
                        <div
                          className={styling.approvalTrustMark}
                          title="Attendance approval process"
                          aria-label="Attendance approval process"
                        >
                          <ShieldCheck
                            size={21}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      {/* Approval workflow */}
                      <div className={styling.approvalWorkflow}>
                        <div className={styling.approvalWorkflowHeader}>
                          <span className={styling.approvalWorkflowTitle}>
                            HOW IT WORKS
                          </span>

                          <span className={styling.approvalWorkflowCaption}>
                            Three simple steps
                          </span>
                        </div>

                        <div className={styling.approvalSteps}>
                          {/* Step 1 */}
                          <div className={styling.approvalStep}>
                            <div
                              className={`${styling.approvalStepIcon} ${styling.stepSubmitted}`}
                            >
                              <CheckCircle2 size={17} aria-hidden="true" />
                            </div>

                            <div className={styling.approvalStepCopy}>
                              <strong>Check in</strong>
                              <span>Submit your request</span>
                            </div>
                          </div>

                          <div
                            className={styling.approvalConnector}
                            aria-hidden="true"
                          >
                            <span />
                            <ChevronRight size={15} />
                          </div>

                          {/* Step 2 */}
                          <div className={styling.approvalStep}>
                            <div
                              className={`${styling.approvalStepIcon} ${styling.stepReview}`}
                            >
                              <ShieldCheck size={17} aria-hidden="true" />
                            </div>

                            <div className={styling.approvalStepCopy}>
                              <strong>Admin review</strong>
                              <span>Request is reviewed</span>
                            </div>
                          </div>

                          <div
                            className={styling.approvalConnector}
                            aria-hidden="true"
                          >
                            <span />
                            <ChevronRight size={15} />
                          </div>

                          {/* Step 3 */}
                          <div className={styling.approvalStep}>
                            <div
                              className={`${styling.approvalStepIcon} ${styling.stepApproved}`}
                            >
                              <BadgeCheck size={17} aria-hidden="true" />
                            </div>

                            <div className={styling.approvalStepCopy}>
                              <strong>Confirmation</strong>
                              <span>After approval</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Important policy notice */}
                      <div className={styling.approvalNotice}>
                        <span className={styling.approvalNoticeIcon}>
                          <Info size={16} aria-hidden="true" />
                        </span>

                        <p>
                          <strong>Good to know:</strong> Attendance and rewards
                          are confirmed only after approval. If rejected, you
                          can resubmit while the session’s check-in window
                          remains open.
                        </p>
                      </div>

                      {/* Trust footer */}
                      <div className={styling.approvalFooter}>
                        <span className={styling.approvalMeta}>
                          <LockKeyhole size={13} aria-hidden="true" />
                          Secure review process
                        </span>

                        <span
                          className={styling.approvalFooterDivider}
                          aria-hidden="true"
                        />

                        <span className={styling.approvalMeta}>
                          <ShieldCheck size={14} aria-hidden="true" />
                          Fair attendance tracking
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
            <div className="grid-2">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Attendance by day</h2>
                    <p>Approved first and second sessions, last 14 days.</p>
                  </div>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: "var(--muted)" }}
                        tickFormatter={(x) => x.slice(5)}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "var(--muted)" }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="first"
                        name="First session approved"
                        stackId="a"
                        fill="#168569"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="second"
                        name="Re-attendance approved"
                        stackId="a"
                        fill="#76cdb4"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  <span>
                    <i
                      className="legend-dot"
                      style={{ background: "#168569" }}
                    />
                    First session
                  </span>
                  <span>
                    <i
                      className="legend-dot"
                      style={{ background: "#76cdb4" }}
                    />
                    Re-attendance
                  </span>
                </div>
              </section>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Attendance trend</h2>
                    <p>Approved sessions versus pending requests.</p>
                  </div>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: "var(--muted)" }}
                        tickFormatter={(x) => x.slice(5)}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "var(--muted)" }}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="first"
                        name="First approved"
                        stroke="#168569"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        name="Pending requests"
                        stroke="#d9a63a"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
            {/* calendar */}

            <AttendanceCalendar
              calendar={calendar}
              monthDate={monthDate}
              monthLabel={monthLabel}
              changeMonth={changeMonth}
              dateToday={dateToday}
              windows={today?.windows}
            />

            {/* history */}

            <AttendanceHistory
              history={history}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
              fmtTime={fmtTime}
              approvedStatus={approvedStatus}
              missedCount={missedSessions}
            />
          </>
        )}
      </>
    </div>
  );
}
