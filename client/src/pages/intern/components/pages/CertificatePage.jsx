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

export default function CertificatePage({ data }) {
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
  return (
    <div className="space-y-7 pb-8">
      {/* Page heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-500">
            Your achievements
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-(--text)] sm:text-3xl">
            Certification hub
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-(--muted)]">
            Track your internship milestone and discover what comes next in your
            certification journey.
          </p>
        </div>

        <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-indigo-200/50 bg-linear-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-sm dark:border-white/10 dark:from-indigo-500/20 dark:to-violet-500/20 dark:text-indigo-300 sm:size-14">
          <Award size={25} />
        </div>
      </div>

      {/* Premium glassmorphism hero */}

      <section
        className={`group relative isolate overflow-hidden rounded-[30px] border bg-[#fffdf9] text-[#292039] shadow-[0_12px_45px_rgba(51,35,69,0.07)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(51,35,69,0.12)] ${
          group?.status === "completed"
            ? "border-amber-200/80"
            : "border-[#e9e1ee]"
        }`}
      >
        {/* Premium ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(244,214,157,0.22),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(190,155,220,0.13),transparent_45%)]" />
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-amber-100/30 blur-3xl transition duration-700 group-hover:bg-amber-100/50" />
        <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-56 w-56 rounded-full bg-violet-100/40 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-9">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e9dfed] bg-white/90 px-3.5 py-2 shadow-sm">
              <span className="grid size-7 place-items-center rounded-full bg-[#f5e9d2] text-[#80602c]">
                <ShieldCheck size={14} />
              </span>
              <span className="text-[9px] font-black tracking-[0.2em] text-[#554260]">
                VELOOP REWARDS
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[9px] font-extrabold tracking-[0.12em] ${
                group?.status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-[#8b6427]"
              }`}
            >
              {group?.status === "completed" ? (
                <CheckCircle2 size={14} />
              ) : (
                <LockKeyhole size={13} />
              )}
              {group?.status === "completed"
                ? "MILESTONE UNLOCKED"
                : "IN PROGRESS"}
            </span>
          </div>

          {/* Main content */}
          <div className="grid items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-[#a17b3e]">
                <Sparkles size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.23em]">
                  Your internship milestone
                </p>
              </div>

              <h2 className="mt-4 max-w-lg text-[32px] font-black leading-[1.12] tracking-[-0.045em] text-[#30223d] sm:text-4xl lg:text-[43px]">
                {group?.status === "completed"
                  ? "You made it."
                  : "Your next achievement awaits."}
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-[#776d80]">
                {group?.status === "completed"
                  ? "Your internship group has been officially completed. Your certification status is now unlocked."
                  : "Every approved attendance brings you closer to your milestone. Complete your internship journey to unlock your certification status."}
              </p>

              {/* Assigned group */}
              <div className="mt-6 flex max-w-full items-center gap-3 rounded-2xl border border-[#ece4ef] bg-white/80 p-3.5 shadow-[0_4px_16px_rgba(57,38,73,0.035)] sm:max-w-md sm:p-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f6e9cc] to-[#ead8ae] text-[#80602c]">
                  <Award size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#9a8ba3]">
                    Assigned group
                  </p>
                  <p className="mt-1 break-words text-sm font-extrabold text-[#392c46]">
                    {group?.name || "Awaiting group assignment"}
                  </p>
                </div>

                <div
                  className={`size-2 shrink-0 rounded-full ${
                    group?.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-amber-400"
                  }`}
                />
              </div>

              {/* CTA */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    group?.status === "completed"
                      ? notify(
                          "Certificate generation is not available in this release. Please follow the official admin instructions.",
                        )
                      : setTab("attendance")
                  }
                  className="group/button inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#382443] via-[#493052] to-[#5b3d64] px-5 py-3 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(62,41,76,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(62,41,76,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b99ac9] focus-visible:ring-offset-2 sm:px-6"
                >
                  {group?.status === "completed"
                    ? "View next steps"
                    : "Continue my journey"}
                  <span className="transition-transform duration-300 group-hover/button:translate-x-1">
                    ↗
                  </span>
                </button>

                {group?.status !== "completed" && (
                  <span className="inline-flex items-center gap-2 text-[10px] font-medium text-[#8a7e92]">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Every approved attendance counts
                  </span>
                )}
              </div>
            </div>

            {/* Premium certificate showcase */}
            <div className="relative mx-auto flex aspect-[1/0.88] w-full max-w-[340px] items-center justify-center">
              {/* Decorative rings */}
              <div className="absolute size-[90%] rounded-full border border-[#e9d9bd]/80" />
              <div className="absolute size-[75%] rounded-full border border-dashed border-[#d9c8e3]" />
              <div className="absolute size-[58%] rounded-full bg-gradient-to-br from-[#f8ebd0]/70 via-white/60 to-[#eadcf3]/70 blur-xl" />

              {/* Floating sparkle accents */}
              <div className="absolute left-[12%] top-[20%] text-[#c5a46b] transition-transform duration-500 group-hover:-translate-y-1">
                <Sparkles size={20} />
              </div>
              <div className="absolute bottom-[18%] right-[12%] text-[#b8a0c8] transition-transform duration-500 group-hover:translate-y-1">
                <Sparkles size={16} />
              </div>

              {/* Certificate card */}
              <div className="relative w-[205px] max-w-[74%] rotate-[-3deg] overflow-hidden rounded-[20px] border border-[#e7d5b0] bg-gradient-to-br from-white via-[#fffdf8] to-[#f6eedf] p-4 shadow-[0_24px_55px_rgba(75,53,77,0.16)] transition-all duration-500 group-hover:rotate-0 group-hover:scale-[1.035] sm:w-[220px] sm:p-5">
                {/* Fine inner frame */}
                <div className="pointer-events-none absolute inset-2 rounded-[13px] border border-[#e7d7b8]/80" />

                <div className="relative flex items-center justify-between gap-2">
                  <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#f0dfba] to-[#dfc18b] text-lg font-black text-[#63491e] shadow-sm">
                    V
                  </div>

                  <div className="text-right">
                    <p className="text-[7px] font-black tracking-[0.2em] text-[#70547e]">
                      VELOOP
                    </p>
                    <p className="mt-1 text-[6px] font-bold tracking-[0.13em] text-[#a48b60]">
                      REWARDS
                    </p>
                  </div>
                </div>

                <div className="relative mx-auto my-5 grid size-[68px] place-items-center rounded-full border border-[#e5d3ad] bg-gradient-to-br from-[#fff9eb] to-[#efdfbd] shadow-[0_0_0_6px_rgba(231,213,176,0.18)] sm:my-6 sm:size-[76px]">
                  <div className="grid size-[54px] place-items-center rounded-full border border-[#d9bf89] bg-white/60 text-[#8c6a30] sm:size-[62px]">
                    {group?.status === "completed" ? (
                      <CheckCircle2 size={30} />
                    ) : (
                      <LockKeyhole size={27} />
                    )}
                  </div>
                </div>

                <div className="relative text-center">
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.22em] text-[#9d7b3f]">
                    {group?.status === "completed"
                      ? "Milestone achieved"
                      : "Your next milestone"}
                  </p>

                  <p className="mt-2 font-serif text-[21px] font-bold leading-tight tracking-[-0.03em] text-[#3d2c48] sm:text-[23px]">
                    {group?.status === "completed"
                      ? "Well Done"
                      : "Certificate"}
                  </p>

                  <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-[#c6a56c] to-transparent" />

                  <p className="mt-3 text-[7px] font-bold uppercase tracking-[0.13em] text-[#9c8b9f]">
                    {group?.status === "completed"
                      ? "STATUS UNLOCKED"
                      : "EARNED THROUGH DEDICATION"}
                  </p>
                </div>

                {/* Signature-style ornament */}
                <div className="relative mx-auto mt-5 flex max-w-[130px] items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-[#e5d7bd]" />
                  <Award size={15} className="text-[#b28c4c]" />
                  <div className="h-px flex-1 bg-[#e5d7bd]" />
                </div>

                <div className="pointer-events-none absolute -bottom-8 -right-2 select-none font-serif text-[120px] font-black leading-none text-[#5b3d64]/[0.035]">
                  V
                </div>
              </div>

              {/* Floating status badge */}
              <div className="absolute right-[3%] top-[13%] grid size-12 place-items-center rounded-2xl border border-white bg-white/95 text-[#856333] shadow-[0_8px_24px_rgba(65,44,75,0.12)] transition-transform duration-500 group-hover:-translate-y-1 sm:right-[5%]">
                {group?.status === "completed" ? (
                  <CheckCircle2 size={21} className="text-emerald-600" />
                ) : (
                  <LockKeyhole size={20} className="text-[#b48a42]" />
                )}
              </div>

              {/* Floating award badge */}
              <div className="absolute bottom-[11%] left-[3%] grid size-12 place-items-center rounded-2xl border border-white bg-white/95 text-[#a27a37] shadow-[0_8px_24px_rgba(65,44,75,0.12)] transition-transform duration-500 group-hover:translate-y-1 sm:left-[5%]">
                <Award size={22} />
              </div>
            </div>
          </div>

          {/* Bottom metrics */}
          <div className="grid gap-3 border-t border-[#ece4ef] pt-5 sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#eee6f0] bg-white/75 p-3.5 transition-colors hover:bg-white sm:p-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f4ebda] text-[#92703b]">
                <CalendarCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#96899d]">
                  Group duration
                </p>
                <p className="mt-1 text-base font-black tracking-tight text-[#382a43]">
                  {group?.durationDays || 28} days
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#eee6f0] bg-white/75 p-3.5 transition-colors hover:bg-white sm:p-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e9f4ed] text-[#367b54]">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#96899d]">
                  Approved days
                </p>
                <p className="mt-1 text-base font-black tracking-tight text-[#382a43]">
                  {approvedDays} days
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#eee6f0] bg-white/75 p-3.5 transition-colors hover:bg-white sm:p-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f0e9f5] text-[#78528c]">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#96899d]">
                  Group status
                </p>
                <p className="mt-1 text-base font-black tracking-tight text-[#382a43]">
                  {group?.status === "completed"
                    ? "Completed"
                    : group?.status === "active"
                      ? "In progress"
                      : "Not started"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey steps */}
      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-500">
            The road ahead
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--text)]">
            Your certification journey
          </h2>
          <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
            Understand what happens before your certification status becomes
            available.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-70" />

            <div className="mb-5 flex items-center justify-between">
              <div className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface2)] text-[var(--accent)] transition duration-300 group-hover:scale-105">
                <CalendarCheck size={21} />
              </div>
              <span className="text-lg font-black text-[var(--muted)]/50">
                01
              </span>
            </div>

            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
              Your daily routine
            </p>
            <h3 className="mt-2 text-base font-extrabold text-[var(--text)]">
              Build consistency
            </h3>
            <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
              Submit attendance during the permitted session windows. Requests
              count only after admin approval.
            </p>

            <button
              type="button"
              onClick={() => setTab("attendance")}
              className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--accent)] transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              View attendance <span>→</span>
            </button>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 to-violet-500 opacity-70" />

            <div className="mb-5 flex items-center justify-between">
              <div className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface2)] text-[var(--accent)] transition duration-300 group-hover:scale-105">
                {group?.status === "completed" ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <ShieldCheck size={21} />
                )}
              </div>
              <span className="text-lg font-black text-[var(--muted)]/50">
                02
              </span>
            </div>

            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
              Official completion
            </p>
            <h3 className="mt-2 text-base font-extrabold text-[var(--text)]">
              {group?.status === "completed"
                ? "Group completed"
                : "Complete your journey"}
            </h3>
            <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
              Your group must be officially marked completed by authorized
              administrators before certification status unlocks.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[10px] font-bold text-[var(--muted)]">
              {group?.status === "completed" ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <Clock3 size={14} className="text-amber-500" />
              )}
              {group?.status === "completed"
                ? "Status unlocked"
                : "Awaiting group completion"}
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-xl md:col-span-2 xl:col-span-1">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-70" />

            <div className="mb-5 flex items-center justify-between">
              <div className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface2)] text-[var(--accent)] transition duration-300 group-hover:scale-105">
                {group?.status === "completed" ? (
                  <Award size={21} />
                ) : (
                  <LockKeyhole size={21} />
                )}
              </div>
              <span className="text-lg font-black text-[var(--muted)]/50">
                03
              </span>
            </div>

            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
              Certification status
            </p>
            <h3 className="mt-2 text-base font-extrabold text-[var(--text)]">
              {group?.status === "completed"
                ? "Ready for next steps"
                : "Your milestone awaits"}
            </h3>
            <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
              Once unlocked, follow official administrator instructions.
              Unlocking status does not mean a certificate has already been
              issued.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[10px] font-bold text-[var(--muted)]">
              {group?.status === "completed" ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <LockKeyhole size={14} className="text-amber-500" />
              )}
              {group?.status === "completed"
                ? "Status unlocked"
                : "Locked for now"}
            </div>
          </article>
        </div>
      </section>

      {/* Interactive FAQs */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface2)] text-[var(--accent)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[var(--text)]">
              Good to know
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Quick answers about your certification status.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[var(--border)] px-5">
          {[
            {
              question: "When does my certification status unlock?",
              answer:
                "It unlocks when your internship group is officially marked completed by authorized administrators. Attendance approval and group completion are separate processes.",
            },
            {
              question: "Does unlocked status mean my certificate is ready?",
              answer:
                "No. This page shows your status only. Certificate generation and download are not available in the current release. Follow official administrator instructions.",
            },
            {
              question: "What if my group details or status look incorrect?",
              answer:
                "Contact your assigned group administrator to verify your group dates, attendance records, and completion status.",
            },
          ].map((faq) => (
            <details key={faq.question} className="group/faq py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-bold leading-6 text-[var(--text)] outline-none transition hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-indigo-400">
                <span>{faq.question}</span>
                <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-base text-[var(--accent)] transition duration-200 group-open/faq:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-3xl pb-1 pt-3 text-xs leading-7 text-[var(--muted)]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
