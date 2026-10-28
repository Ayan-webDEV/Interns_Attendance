import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { Brand, Field } from "../ui/Primitives.jsx";

export default function LoginScreen({
  onGoogle,
  busy,
  error,
  onboarding,
  setOnboarding,
  googleProfile,
  inviteToken,
  onRegistered,
  onAuthenticated,
  notify = () => {},
}) {
  const [mode, setMode] = useState("google");
  const [internId, setInternId] = useState("");
  const [internPassword, setInternPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [form, setForm] = useState({
    internId: "",
    name: "",
    email: "",
    whatsappNumber: "",
    whatsappGroupName: "",
    whatsappGroupCode: "",
    internshipStartDate: "",
    domain: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (googleProfile)
      setForm((previous) => ({
        ...previous,
        name: googleProfile.name || previous.name,
        email: googleProfile.email || previous.email,
      }));
  }, [googleProfile]);
  const changeMode = (value) => {
    setMode(value);
    setLocalError("");
  };
  const submit = async (event, endpoint, body) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError("");
    try {
      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      onAuthenticated({ token: data.token, user: data.user });
    } catch (err) {
      setLocalError("");
      notify(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const register = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError("");
    try {
      if (!inviteToken)
        throw new Error(
          "Open the unique invitation link shared by your internship group before registering.",
        );
      const data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          onboardingTicket: onboarding,
          inviteToken,
        }),
      });
      onRegistered({ token: data.token, user: data.user });
    } catch (err) {
      setLocalError("");
      notify(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10";
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const modes = [
    { value: "google", label: "Google" },
    { value: "intern", label: "Intern ID" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.82fr)]">
      <section className="relative isolate flex min-h-[340px] flex-col overflow-hidden border-b border-white/[0.08] px-6 py-8 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-14 lg:py-12 xl:px-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_20%,rgba(124,107,255,0.20),transparent_45%),radial-gradient(ellipse_at_90%_85%,rgba(39,190,145,0.08),transparent_35%)]" />
        <Brand />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-12 lg:py-20">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{" "}
            Official internship portal
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
            Your internship, in one place
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl xl:text-6xl">
            Your work matters.
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-indigo-200 bg-clip-text text-transparent">
              Your progress should show.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
            Access your VELoop Rewards attendance calendar, review your
            attendance history, and see your InternCash balance—all from your
            own account.
          </p>

          <div className="mt-9 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                Icon: CalendarCheck,
                title: "Attendance",
                detail: "Calendar & history",
              },
              {
                Icon: Wallet,
                title: "InternCash",
                detail: "Balance & rewards",
              },
              {
                Icon: Award,
                title: "Certification",
                detail: "Status & eligibility",
              },
            ].map(({ Icon, title, detail }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4 transition hover:border-violet-300/30 hover:bg-white/[0.055]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/[0.09] text-violet-200">
                  <Icon size={19} />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-100">
                  {title}
                </p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/10 p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-emerald-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Account access is verified
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                New intern registration requires Google verification and your
                group's invitation link. Your offer-letter details are checked
                before account creation.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} VELoop Rewards</span>
          <span className="inline-flex items-center gap-2">
            <LockKeyhole size={13} /> Secure account access
          </span>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:min-h-screen lg:px-10 lg:py-12">
        <div
          className={`w-full ${onboarding ? "max-w-2xl" : "max-w-md"} rounded-3xl border border-white/[0.09] bg-[#11182a] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.32)] sm:p-8`}
        >
          <div className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
              {onboarding ? "Intern onboarding" : "Member access"}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              {onboarding ? "Set up your intern account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {onboarding
                ? "Your Google email is verified. Complete the details below to match your offer letter."
                : "Sign in using the method associated with your account."}
            </p>
          </div>
          {(error || localError) && null}

          {onboarding ? (
            <form className="mt-5 space-y-4" onSubmit={register}>
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${inviteToken ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100" : "border-amber-300/20 bg-amber-300/[0.06] text-amber-100"}`}
              >
                <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {inviteToken
                      ? "Group invitation detected"
                      : "Group invitation required"}
                  </p>
                  <p className="mt-1 text-xs leading-5 opacity-80">
                    {inviteToken
                      ? "Your account will be assigned to the group linked to this invitation."
                      : "Open the unique invitation link provided by your internship group before registering."}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Intern ID">
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-slate-700 bg-slate-900 px-3 text-xs font-bold text-violet-300">
                      VLRINT
                    </span>
                    <input
                      className={`${inputClass} rounded-l-none`}
                      required
                      value={form.internId.replace(/^VLRINT/i, "")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          internId:
                            "VLRINT" + e.target.value.replace(/^VLRINT/i, ""),
                        })
                      }
                      placeholder="202601234"
                    />
                  </div>
                </Field>
                <Field label="Full name (as on offer letter)">
                  <input
                    className={inputClass}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </Field>
              </div>
              <Field label="Verified Google email">
                <input
                  className={`${inputClass} read-only:cursor-not-allowed read-only:border-slate-800 read-only:bg-slate-900/60 read-only:text-slate-400`}
                  type="email"
                  readOnly
                  required
                  value={form.email}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp number">
                  <input
                    className={inputClass}
                    required
                    value={form.whatsappNumber}
                    onChange={(e) =>
                      setForm({ ...form, whatsappNumber: e.target.value })
                    }
                    placeholder="+91…"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="WhatsApp group name">
                  <input
                    className={inputClass}
                    required
                    value={form.whatsappGroupName}
                    onChange={(e) =>
                      setForm({ ...form, whatsappGroupName: e.target.value })
                    }
                    placeholder="Group name"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp group code">
                  <input
                    className={inputClass}
                    required
                    value={form.whatsappGroupCode}
                    onChange={(e) =>
                      setForm({ ...form, whatsappGroupCode: e.target.value })
                    }
                    placeholder="Code in group description"
                  />
                </Field>
                <Field label="Internship start date">
                  <input
                    className={inputClass}
                    type="date"
                    required
                    value={form.internshipStartDate}
                    onChange={(e) =>
                      setForm({ ...form, internshipStartDate: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Internship domain">
                <select
                  className={inputClass}
                  required
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                >
                  <option value="">Choose your domain</option>
                  {[
                    "Frontend Development",
                    "Full Stack Web Development",
                    "UI/UX Design",
                    "Backend Development",
                    "SEO",
                    "Content Writing",
                    "Digital Marketing",
                    "Game Development",
                    "Other",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Create password (minimum 10 characters)">
                <input
                  className={inputClass}
                  type="password"
                  minLength="10"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Create a strong password"
                />
              </Field>
              <button
                className={`${btn} w-full bg-violet-300 text-slate-950 hover:bg-violet-200`}
                disabled={submitting || busy}
              >
                {submitting
                  ? "Verifying your details…"
                  : "Verify details & create account"}
                <ChevronRight size={17} />
              </button>
              <button
                type="button"
                className={`${btn} w-full border border-white/10 text-slate-300 hover:bg-white/[0.04]`}
                onClick={() => {
                  setOnboarding(null);
                  changeMode("google");
                }}
              >
                Cancel registration
              </button>
              <p className="text-center text-xs leading-5 text-slate-500">
                Your registration is checked against your offer-letter record
                before it is accepted.
              </p>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/[0.07] bg-slate-950/60 p-1.5">
                {modes.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeMode(value)}
                    className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${mode === value ? "bg-violet-300 text-slate-950 shadow-sm" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === "google" && (
                <div className="mt-6">
                  <div className="flex min-h-[54px] justify-center rounded-xl bg-white p-2">
                    <GoogleLogin
                      onSuccess={onGoogle}
                      onError={() =>
                        notify("Google sign-in failed. Please try again.")
                      }
                      text="continue_with"
                      shape="rectangular"
                      theme="outline"
                      width="320"
                    />
                  </div>
                  <div className="mt-5 space-y-3 text-sm text-slate-400">
                    <p className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-300"
                      />
                      Use the Google account associated with your internship.
                    </p>
                    <p className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-300"
                      />
                      New interns must use their group's unique invitation link.
                    </p>
                  </div>
                  {inviteToken && (
                    <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs text-emerald-100">
                      Your group invitation is ready. Continue with Google to
                      begin verification.
                    </div>
                  )}
                </div>
              )}
              {mode === "intern" && (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={(e) =>
                    submit(e, "/auth/intern-login", {
                      internId,
                      password: internPassword,
                    })
                  }
                >
                  <Field label="Intern ID">
                    <input
                      className={inputClass}
                      required
                      autoComplete="username"
                      value={internId}
                      onChange={(e) => setInternId(e.target.value)}
                      placeholder="VLRINT202601234"
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      className={inputClass}
                      type="password"
                      required
                      autoComplete="current-password"
                      value={internPassword}
                      onChange={(e) => setInternPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </Field>
                  <button
                    className={`${btn} w-full bg-violet-300 text-slate-950 hover:bg-violet-200`}
                    disabled={submitting || busy}
                  >
                    {submitting ? "Signing you in…" : "Sign in to attendance"}
                    <ChevronRight size={17} />
                  </button>
                  <p className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
                    Forgot your password? Sign in through Google with your
                    verified account, then set or reset your password in
                    Account.
                  </p>
                </form>
              )}
              {mode === "admin" && (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={(e) =>
                    submit(e, "/auth/admin-login", {
                      email: adminEmail.trim().toLowerCase(),
                      password: adminPassword,
                    })
                  }
                >
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100">
                    <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                    <span>
                      <strong className="font-semibold">
                        Restricted admin area.
                      </strong>{" "}
                      Only pre-authorized, seeded admin accounts can sign in
                      here.
                    </span>
                  </div>
                  <Field label="Admin email">
                    <input
                      className={inputClass}
                      type="email"
                      required
                      autoComplete="username"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="name@ve.in"
                    />
                  </Field>
                  <Field label="Admin password">
                    <input
                      className={inputClass}
                      type="password"
                      required
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                    />
                  </Field>
                  <button
                    className={`${btn} w-full bg-violet-300 text-slate-950 hover:bg-violet-200`}
                    disabled={submitting || busy}
                  >
                    {submitting
                      ? "Verifying admin…"
                      : "Sign in to admin portal"}
                    <ShieldCheck size={17} />
                  </button>
                  <p className="text-xs leading-5 text-slate-500">
                    CEO and Marketing Admin use their own separate credentials.
                    Intern credentials cannot access the admin portal.
                  </p>
                </form>
              )}
            </>
          )}
          <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/[0.07] pt-5 text-xs text-slate-500">
            <LockKeyhole size={13} /> Protected access · VELoop Rewards
          </div>
        </div>
      </section>
    </main>
  );
}
