import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { api, tokenStore } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";
import styles from "./Login.module.css";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("intern");
  const [internId, setInternId] = useState("VLRINT");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const brand = import.meta.env.VITE_BRAND_NAME || "VELoop Rewards";
  const invite = search.get("invite") || search.get("inviteToken") || "";

  const onGoogle = () => {
    if (!window.google?.accounts?.id) {
      toast(
        "Google sign-in is not ready. Please check the Google Client ID configuration.",
        "error",
      );
      return;
    }

    const clientId = import.meta.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast(
        "Add GOOGLE_CLIENT_ID to the frontend environment settings.",
        "error",
      );
      return;
    }

    setBusy(true);

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const data = await api("/auth/google", {
            method: "POST",
            body: { credential: response.credential },
          });

          if (data.onboardingRequired) {
            sessionStorage.setItem(
              "vlr_onboarding_ticket",
              data.onboardingTicket,
            );

            sessionStorage.setItem(
              "vlr_google_profile",
              JSON.stringify(data.googleProfile || {}),
            );

            sessionStorage.setItem("vlr_invite_token", invite);

            nav(
              "/register" +
                (invite ? `?invite=${encodeURIComponent(invite)}` : ""),
            );
          } else {
            tokenStore.set(data.token);
            onLogin(data.user);

            nav(data.user.role === "admin" ? "/admin" : "/intern/dashboard");
          }
        } catch (error) {
          toast(error.message, "error");
        } finally {
          setBusy(false);
        }
      },
    });

    window.google.accounts.id.prompt();
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const endpoint =
        mode === "admin" ? "/auth/admin-login" : "/auth/intern-login";

      const body =
        mode === "admin"
          ? { email: internId.trim(), password }
          : {
              internId: internId.replace(/\s/g, "").toUpperCase(),
              password,
            };

      const data = await api(endpoint, { method: "POST", body });

      tokenStore.set(data.token);
      onLogin(data.user);

      nav(data.user.role === "admin" ? "/admin" : "/intern/dashboard");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Top navigation */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className="w-10 h-10">
            <img src="/LOGO.jpeg" className="rounded-xl" alt="VELoop Logo" />
          </div>
          {/* <span className={styles.logo}>V</span> */}
          <span>{brand}</span>
        </div>

        <div className={styles.headerStatus}>
          <span className={styles.statusDot} />
          <ShieldCheck size={17} />
          <span>Protected workspace</span>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.stage}>
        {/* Left introduction section */}
        <section className={styles.intro}>
          <div className={styles.eyebrow}>
            <span />
            THE INTERNSHIP WORKSPACE
          </div>

          <h1>
            Make every
            <br />
            internship day <em>count.</em>
          </h1>

          <p className={styles.description}>
            Your official space to record attendance, follow programme updates,
            and track the rewards you earn as you learn.
          </p>

          <div className={styles.proof}>
            <div className={styles.proofItem}>
              <span className={styles.proofIcon}>
                <CalendarCheck size={19} />
              </span>

              <span>
                <b>Attendance, made clear</b>
                <small>Know your session and approval status</small>
              </span>
            </div>

            <div className={styles.proofItem}>
              <span className={styles.proofIcon}>
                <Users size={19} />
              </span>

              <span>
                <b>Connected to your group</b>
                <small>Updates from your official programme team</small>
              </span>
            </div>

            <div className={styles.proofItem}>
              <span className={styles.proofIcon}>
                <CheckCircle2 size={19} />
              </span>

              <span>
                <b>Fair and accountable</b>
                <small>Requests are reviewed before they count</small>
              </span>
            </div>
          </div>

          <div className={styles.introNote}>
            <Sparkles size={17} />
            <span>
              Small steps. Consistent progress. A better internship experience.
            </span>
          </div>
        </section>

        {/* Login card */}
        <section className={styles.formCard} aria-labelledby="signin-title">
          <div className={styles.formHeader}>
            <div className={styles.formIcon}>
              <LockKeyhole size={21} />
            </div>

            <div>
              <div className={styles.formEyebrow}>WELCOME BACK</div>
              <h2 id="signin-title">Sign in to continue</h2>
              <p>Choose the access type for your workspace.</p>
            </div>
          </div>

          {/* Access type tabs */}
          <div className={styles.tabs} role="tablist" aria-label="Sign-in type">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "intern"}
              className={mode === "intern" ? styles.tabActive : ""}
              onClick={() => {
                setMode("intern");
                setInternId("VLRINT");
                setPassword("");
              }}
            >
              Intern
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === "admin"}
              className={mode === "admin" ? styles.tabActive : ""}
              onClick={() => {
                setMode("admin");
                setInternId("");
                setPassword("");
              }}
            >
              Admin
            </button>
          </div>

          {/* Intern login */}
          {mode === "intern" ? (
            <>
              <button
                type="button"
                className={styles.google}
                onClick={onGoogle}
                disabled={busy}
              >
                <span className={styles.googleG}>G</span>

                <span>
                  {busy ? "Connecting securely…" : "Continue with Google"}
                </span>

                <ArrowRight size={18} />
              </button>

              <div className={styles.or}>
                <span />
                <span className={styles.orText}>or sign in with intern ID</span>
                <span />
              </div>

              <form onSubmit={submit}>
                <label htmlFor="intern-id">Intern ID</label>

                <div className={styles.field}>
                  <span className={styles.prefix}>VLRINT</span>

                  <input
                    id="intern-id"
                    value={internId}
                    onChange={(event) =>
                      setInternId(event.target.value.toUpperCase())
                    }
                    required
                    autoComplete="username"
                    aria-label="Intern ID"
                  />
                </div>

                <label htmlFor="intern-password">Password</label>

                <div className={styles.field}>
                  <LockKeyhole size={18} />

                  <input
                    id="intern-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className={styles.formHint}>
                  New intern? Open the invitation link shared by your WhatsApp
                  group admin to create your account.
                </div>

                <button className={styles.submit} disabled={busy}>
                  <span>
                    {busy ? "Signing in…" : "Sign in to your workspace"}
                  </span>
                  <ArrowRight size={19} />
                </button>
              </form>

              <button
                type="button"
                className={styles.recover}
                onClick={onGoogle}
              >
                Forgot your password? <b>Continue with Google first</b>
              </button>
            </>
          ) : (
            /* Admin login */
            <form onSubmit={submit}>
              <label htmlFor="admin-email">Admin email</label>

              <div className={styles.field}>
                <input
                  id="admin-email"
                  type="email"
                  value={internId}
                  onChange={(event) => setInternId(event.target.value)}
                  placeholder="admin@yourcompany.com"
                  required
                  autoComplete="username"
                />
              </div>

              <label htmlFor="admin-password">Password</label>

              <div className={styles.field}>
                <LockKeyhole size={18} />

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className={styles.formHint}>
                Administrator access is restricted to approved admin accounts.
              </div>

              <button className={styles.submit} disabled={busy}>
                <span>
                  {busy ? "Verifying access…" : "Open admin workspace"}
                </span>
                <ArrowRight size={19} />
              </button>
            </form>
          )}

          {/* Security information */}
          <div className={styles.trust}>
            <ShieldCheck size={18} />

            <span>
              Role-based access
              <i />
              Private sign-in
              <i />
              Secure session
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} {brand}
        </span>

        <span className={styles.footerRight}>
          <a href="/policies#privacy">Privacy</a>
          <a href="/policies#terms">Terms</a>
          <a href="/policies#refund">Charges &amp; refunds</a>
        </span>
      </footer>
    </div>
  );
}
