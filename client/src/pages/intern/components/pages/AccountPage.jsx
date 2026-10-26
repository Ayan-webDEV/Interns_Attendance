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
  CalendarDays,
  Camera,
  Trash2,
} from "lucide-react";

const approvedStatus = ["approved", "admin_corrected_present"];
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtTime = (v) => v ? new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const keyDate = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);


export default function AccountPage({ data }) {
  const { session, tab, setTab, notify, theme, onToggleTheme, me, setMe, group, setGroup, today, setToday, records, setRecords, wallet, setWallet, notifications, setNotifications, promoCode, setPromoCode, password, setPassword, from, setFrom, to, setTo, history, setHistory, attSession, setAttSession, remaining, setRemaining, busyLabel, setBusyLabel, loading, setLoading, refreshing, setRefreshing, calendarMonth, setCalendarMonth, refresh, run, profilePictureStorageKey, profilePicture, setProfilePicture, profilePictureError, setProfilePictureError, handleProfilePictureChange, handleRemoveProfilePicture, startAttendance, markAttendance, redeem, setNewPassword, markRead, firstRecord, secondRecord, chartData, approvedDays, dateStart, fallbackEnd, dateEnd, monthDate, monthLabel, calendar, changeMonth, groupHasStarted, nav } = data;
  return (
            <div className="mx-auto max-w-6xl space-y-7 pb-8">
              {/* =========================================================
        PAGE HEADER
    ========================================================= */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-500">
                    Your personal space
                  </p>

                  <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
                    My account
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Manage your verified identity, internship details, and
                    account security.
                  </p>
                </div>

                <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-sm dark:border-white/10 dark:from-indigo-500/20 dark:to-violet-500/20 dark:text-indigo-300 sm:size-14">
                  <CircleUserRound size={25} />
                </div>
              </div>

              {/* =========================================================
        PROFILE HERO
    ========================================================= */}
              <section className="group relative isolate overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 text-white shadow-xl transition duration-300 hover:shadow-2xl">
                <div className="pointer-events-none absolute -right-20 -top-28 -z-10 size-80 rounded-full bg-indigo-400/25 blur-3xl transition duration-700 group-hover:bg-indigo-300/35" />

                <div className="pointer-events-none absolute -bottom-32 -left-16 -z-10 size-72 rounded-full bg-cyan-400/20 blur-3xl" />

                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />

                <div className="relative p-5 sm:p-7 lg:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-extrabold tracking-[0.16em] text-white/90 backdrop-blur-xl">
                      <ShieldCheck size={14} className="text-emerald-300" />
                      INTERN PROFILE
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[9px] font-extrabold tracking-wider text-emerald-200 backdrop-blur-xl">
                      <CheckCircle2 size={13} />
                      VERIFIED ACCOUNT
                    </span>
                  </div>

                  <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
                    {/* Profile avatar — optimized without changing identity layout */}
                    {/* Profile avatar — clean, interactive and aligned */}
                    <div className="relative mx-auto shrink-0 sm:mx-0">
                      <div className="relative w-fit">
                        {/* Avatar / upload trigger */}
                        <label
                          htmlFor="intern-profile-picture"
                          title="Click to change profile picture"
                          className="group/avatar relative block cursor-pointer"
                        >
                          <div className="relative grid size-24 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-400/25 to-violet-500/20 text-3xl font-black uppercase text-white shadow-lg transition duration-200 hover:border-white/40 hover:shadow-indigo-500/20 sm:size-30">
                            {profilePicture ? (
                              <img
                                src={profilePicture}
                                alt={`${me.name || "Intern"} profile`}
                                className="absolute inset-0 size-full object-cover"
                              />
                            ) : (
                              <span>
                                {me.name
                                  ?.trim()
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join("")
                                  .toUpperCase() || "I"}
                              </span>
                            )}

                            {/* Upload hover overlay */}
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-950/65 text-white opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100 group-focus-within/avatar:opacity-100">
                              <Camera size={20} />
                              <span className="text-[10px] font-semibold">
                                Change photo
                              </span>
                            </span>

                            <input
                              id="intern-profile-picture"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              capture="user"
                              className="sr-only"
                              onChange={handleProfilePictureChange}
                            />
                          </div>
                        </label>

                        {/* Verification badge — inside the avatar boundary */}

                        {/* Remove icon — inside the avatar boundary */}
                        {profilePicture && (
                          <button
                            type="button"
                            title="Remove profile picture"
                            aria-label="Remove profile picture"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRemoveProfilePicture();
                            }}
                            className="absolute bottom-0 right-0 z-30 grid size-7 place-items-center rounded-lg border border-white/20 bg-rose-500 text-white shadow-md transition hover:scale-105 hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Helper text — below the avatar, away from both badges */}
                      <div className="mt-3 min-h-5 max-w-28">
                        <p className="flex items-center gap-1.5 text-[9px] leading-4 text-white/60">
                          <Camera size={11} className="shrink-0" />
                          <span>
                            {profilePicture
                              ? "Photo saved locally"
                              : "Tap to add a photo"}
                          </span>
                        </p>

                        {profilePictureError && (
                          <p
                            role="alert"
                            className="mt-1 text-[10px] leading-4 text-rose-200"
                          >
                            {profilePictureError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Identity */}
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-200">
                        Welcome to your workspace
                      </p>

                      <h2 className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl">
                        {me.name || "Intern"}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-white/70 sm:justify-start">
                        <Mail size={14} />
                        <span className="break-all">
                          {me.email || "Email unavailable"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold text-white/90 backdrop-blur-lg">
                          <Fingerprint
                            size={14}
                            className="shrink-0 text-cyan-200"
                          />
                          <span className="break-all">
                            ID: {me.internId || "Not assigned"}
                          </span>
                        </span>

                        <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold text-white/90 backdrop-blur-lg">
                          <BriefcaseBusiness
                            size={14}
                            className="shrink-0 text-violet-200"
                          />
                          <span className="break-words">
                            {group?.name || "Group not assigned"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Copy intern ID */}
                    <button
                      type="button"
                      disabled={!me.internId}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            String(me.internId),
                          );
                          notify("Intern ID copied to clipboard.");
                        } catch {
                          notify(
                            "Unable to copy automatically. Please copy your ID manually.",
                          );
                        }
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-stretch rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white shadow-lg backdrop-blur-xl transition duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                    >
                      <Copy size={15} />
                      Copy intern ID
                    </button>
                  </div>

                  {/* Summary metrics */}
                  <div className="mt-8 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3 sm:gap-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition hover:bg-white/[0.11]">
                      <div className="flex items-center gap-2 text-white/60">
                        <CalendarDays size={15} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          Internship duration
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-black">
                        {group?.durationDays || 28} days
                      </p>

                      <p className="mt-1 text-[10px] text-white/50">
                        Assigned group duration
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition hover:bg-white/[0.11]">
                      <div className="flex items-center gap-2 text-white/60">
                        <CalendarCheck size={15} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          Approved attendance
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-black">
                        {approvedDays} days
                      </p>

                      <p className="mt-1 text-[10px] text-white/50">
                        Approved attendance dates
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition hover:bg-white/[0.11]">
                      <div className="flex items-center gap-2 text-white/60">
                        <Wallet size={15} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          InternCash balance
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-black">
                        {wallet?.balance ?? 0} IC
                      </p>

                      <button
                        type="button"
                        onClick={() => setTab("rewards")}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-cyan-200 transition hover:gap-2"
                      >
                        Open wallet <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* =========================================================
        ACCOUNT INFORMATION
    ========================================================= */}
              <section className="space-y-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-500">
                    Account information
                  </p>

                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--text)]">
                    Your verified details
                  </h2>

                  <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                    Review your registered identity and assigned internship
                    information.
                  </p>
                </div>

                <div className="grid items-stretch gap-4 lg:grid-cols-2">
                  {/* Personal information + workspace */}
                  <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:border-indigo-300/70 hover:shadow-lg">
                    <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
                      <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-[var(--text)]">
                          Personal information
                        </h3>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          Your registered identity
                        </p>
                      </div>

                      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    </div>

                    <div className="divide-y divide-[var(--border)] px-5">
                      {[
                        {
                          label: "Full name",
                          value: me.name,
                          icon: UserRound,
                        },
                        {
                          label: "Verified email",
                          value: me.email,
                          icon: Mail,
                        },
                        {
                          label: "Intern ID",
                          value: me.internId,
                          icon: Fingerprint,
                          copy: true,
                        },
                      ].map(({ label, value, icon: Icon, copy }) => (
                        <div
                          key={label}
                          className="flex min-w-0 items-center gap-3 py-4"
                        >
                          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface2)] text-[var(--muted)]">
                            <Icon size={16} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium text-[var(--muted)]">
                              {label}
                            </p>

                            <p className="mt-1 break-all text-xs font-bold text-[var(--text)]">
                              {value || "Not available"}
                            </p>
                          </div>

                          {copy && value && (
                            <button
                              type="button"
                              title="Copy intern ID"
                              aria-label="Copy intern ID"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    String(value),
                                  );
                                  notify("Intern ID copied to clipboard.");
                                } catch {
                                  notify(
                                    "Unable to copy automatically. Please copy your ID manually.",
                                  );
                                }
                              }}
                              className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] text-[var(--muted)] transition hover:border-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Useful content fills the remaining card height */}
                    <div className="flex flex-1 flex-col border-t border-[var(--border)] bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-violet-500/[0.06] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Activity
                              size={16}
                              className="text-[var(--accent)]"
                            />
                            <h4 className="text-xs font-extrabold text-[var(--text)]">
                              Your workspace
                            </h4>
                          </div>
                        </div>

                        <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[9px] font-bold text-[var(--muted)]">
                          QUICK ACCESS
                        </span>
                      </div>

                      <div className="mt-4 gap-2 flex">
                        <button
                          type="button"
                          onClick={() => setTab("rewards")}
                          className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white dark:text-emerald-300 dark:group-hover:text-white">
                            <Wallet size={17} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-[var(--text)]">
                              InternCash wallet
                            </span>
                            <span className="mt-1 block text-[10px] text-[var(--muted)]">
                              Balance and transaction history
                            </span>
                          </span>

                          <ChevronRight
                            size={16}
                            className="shrink-0 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-emerald-500"
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTab("notifications")}
                          className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500 transition group-hover:bg-violet-500 group-hover:text-white">
                            <Bell size={17} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-[var(--text)]">
                              Announcements
                            </span>
                            <span className="mt-1 block text-[10px] text-[var(--muted)]">
                              Updates from your administrators
                            </span>
                          </span>

                          <ChevronRight
                            size={16}
                            className="shrink-0 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-violet-500"
                          />
                        </button>
                      </div>

                      <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-3.5">
                        <ShieldCheck
                          size={16}
                          className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300"
                        />

                        <div>
                          <p className="text-[10px] font-extrabold text-[var(--text)]">
                            Keep your account secure
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                            Never share your password, OTP, or private account
                            credentials.
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Internship details */}
                  <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-300 hover:border-emerald-300/70 hover:shadow-lg">
                    <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
                      <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                        <BriefcaseBusiness size={19} />
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-[var(--text)]">
                          Internship details
                        </h3>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          Your assigned program information
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 divide-y divide-[var(--border)] px-5">
                      {[
                        ["Assigned group", group?.name || "Not assigned"],
                        [
                          "Internship domain",
                          session.user.domain || "From verified offer",
                        ],
                        [
                          "Start date",
                          fmtDate(
                            group?.actualStartDate ||
                              session.user.internshipStartDate,
                          ),
                        ],
                        ["Duration", `${group?.durationDays || 28} days`],
                        [
                          "Group status",
                          group?.status === "completed"
                            ? "Completed"
                            : group?.status === "active"
                              ? "In progress"
                              : group?.status === "registration"
                                ? "Not started"
                                : "Not assigned",
                        ],
                        [
                          "Offer letter",
                          session.user.offerSentStatus ||
                            (session.user.offerSent
                              ? "Sent"
                              : "Verified during registration"),
                        ],
                        ["Offer sent date", fmtDate(session.user.offerSentAt)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-start justify-between gap-4 py-4"
                        >
                          <span className="text-[10px] text-[var(--muted)]">
                            {label}
                          </span>

                          <span className="max-w-[65%] break-words text-right text-xs font-bold text-[var(--text)]">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[var(--border)] p-4">
                      <button
                        type="button"
                        onClick={() => setTab("attendance")}
                        className="flex w-full items-center justify-between rounded-xl bg-[var(--surface2)] px-4 py-3 text-xs font-bold text-[var(--text)] transition hover:bg-indigo-500/10 hover:text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CalendarCheck size={15} />
                          View attendance dashboard
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </article>
                </div>
              </section>

              {/* =========================================================
        PASSWORD / SECURITY
    ========================================================= */}
              <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div className="flex items-center gap-3 border-b border-[var(--border)] p-5 sm:p-6">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                    <LockKeyhole size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-extrabold text-[var(--text)]">
                      Account security
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Set or update your password for secure access.
                    </p>
                  </div>

                  <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-300 sm:inline-flex">
                    <ShieldCheck size={13} />
                    Secure settings
                  </span>
                </div>

                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface2)] p-5">
                    <div className="grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
                      <KeyRound size={20} />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold text-[var(--text)]">
                      Protect your account
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                      Use a unique password with at least 10 characters. Never
                      share your password or verification codes with anyone.
                    </p>

                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                      <ShieldCheck
                        size={15}
                        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300"
                      />
                      <p className="text-[10px] leading-5 text-[var(--muted)]">
                        Your password is sent through the existing authenticated
                        API.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={setNewPassword}
                    className="flex min-w-0 flex-col justify-center"
                  >
                    <label
                      htmlFor="intern-new-password"
                      className="mb-2 text-xs font-bold text-[var(--text)]"
                    >
                      New password
                    </label>

                    <input
                      id="intern-new-password"
                      className="input w-full transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                      type="password"
                      minLength={10}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong new password"
                    />

                    <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">
                      Minimum 10 characters. Choose a password you do not use on
                      other websites.
                    </p>

                    <button
                      type="submit"
                      disabled={password.length < 10 || Boolean(busyLabel)}
                      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/15 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <ShieldCheck size={15} />
                      Save password
                      <ChevronRight size={15} />
                    </button>
                  </form>
                </div>
              </section>

              {/* =========================================================
        SUPPORT SHORTCUT
    ========================================================= */}
              <section className="relative overflow-hidden rounded-2xl border border-indigo-200/50 bg-gradient-to-r from-indigo-50 via-violet-50 to-sky-50 p-5 dark:border-white/10 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-sky-500/10 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-indigo-200/50 bg-white/70 text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                    <Sparkles size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Need to update your internship details?
                    </h3>

                    <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                      If your name, email, intern ID, offer details, or assigned
                      group appears incorrect, contact your authorized
                      internship administrator.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab("notifications")}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-indigo-200/70 bg-white/80 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-indigo-200 dark:hover:bg-white/10 sm:self-center"
                  >
                    View notices
                    <ChevronRight size={15} />
                  </button>
                </div>
              </section>
            </div>
          );
}
