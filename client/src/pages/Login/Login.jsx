// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import {
//   ArrowRight,
//   CalendarCheck,
//   CheckCircle2,
//   Eye,
//   EyeOff,
//   LockKeyhole,
//   ShieldCheck,
//   Sparkles,
//   Users,
// } from "lucide-react";
// import { api, tokenStore } from "../../api/client";
// import { useToast } from "../../components/Toast/Toast";
// import styles from "./Login.module.css";
// import AuthLoadingOverlay from "../../components/auth/AuthLoadingOverlay";

// export default function Login({ onLogin, onGoogleVerified }) {
//   const [mode, setMode] = useState("intern");
//   const [internId, setInternId] = useState("VLRINT");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [busy, setBusy] = useState(false);
//   const [authLoadingType, setAuthLoadingType] = useState("intern");
//   const googleButtonRef = useRef(null);
//   const [search] = useSearchParams();
//   const nav = useNavigate();
//   const toast = useToast();

//   const brand = import.meta.env.VITE_BRAND_NAME || "VELoop Rewards";
//   const invite = search.get("invite") || search.get("inviteToken") || "";

//   const onGoogle = () => {
//     if (!window.google?.accounts?.id) {
//       toast(
//         "Google sign-in is not ready. Please check the Google Client ID configuration.",
//         "error",
//       );
//       return;
//     }

//     if (!clientId) {
//       toast(
//         "Add GOOGLE_CLIENT_ID to the frontend environment settings.",
//         "error",
//       );
//       return;
//     }

//     // setBusy(true);

//     window.google.accounts.id.initialize({
//       client_id: clientId,

//       callback: async (response) => {
//         try {
//           if (!response?.credential) {
//             throw new Error("Google did not return a valid credential.");
//           }

//           setAuthLoadingType("google");
//           setBusy(true);

//           const data = await api("/auth/google", {
//             method: "POST",
//             body: { credential: response.credential },
//           });

//           // if (data.onboardingRequired) {
//           //   sessionStorage.setItem(
//           //     "vlr_onboarding_ticket",
//           //     data.onboardingTicket,
//           //   );

//           //   sessionStorage.setItem(
//           //     "vlr_google_profile",
//           //     JSON.stringify(data.googleProfile || {}),
//           //   );

//           //   sessionStorage.setItem("vlr_invite_token", invite);

//           //   nav(
//           //     "/register" +
//           //       (invite ? `?invite=${encodeURIComponent(invite)}` : ""),
//           //   );
//           // } else {
//           //   tokenStore.set(data.token);
//           //   onLogin(data.user);

//           //   nav(data.user.role === "admin" ? "/admin" : "/intern/dashboard");
//           // }
//           if (data.onboardingRequired && data.onboardingTicket) {
//             // Clear any previous verification session
//             sessionStorage.removeItem("vlr_google_verified");

//             sessionStorage.setItem(
//               "vlr_onboarding_ticket",
//               data.onboardingTicket,
//             );

//             sessionStorage.setItem(
//               "vlr_google_profile",
//               JSON.stringify(data.googleProfile || {}),
//             );

//             sessionStorage.setItem("vlr_invite_token", invite);

//             // Mark Google verification as completed
//             sessionStorage.setItem("vlr_google_verified", "true");
//             onGoogleVerified?.();

//             nav(
//               "/register" +
//                 (invite ? `?invite=${encodeURIComponent(invite)}` : ""),
//             );
//           } else if (data.token && data.user) {
//             tokenStore.set(data.token);
//             onLogin(data.user);

//             nav(data.user.role === "admin" ? "/admin" : "/intern/dashboard");
//           } else {
//             throw new Error(
//               "Google authentication did not return a valid response.",
//             );
//           }
//         } catch (error) {
//           toast(error.message, "error");
//         } finally {
//           setBusy(false);
//         }
//       },
//     });

//     window.google.accounts.id.prompt();
//   };

//   const clientId = import.meta.env.GOOGLE_CLIENT_ID;

//   useEffect(() => {
//     if (!clientId || !googleButtonRef.current) return;

//     let cancelled = false;

//     const initializeGoogleButton = () => {
//       if (
//         cancelled ||
//         !window.google?.accounts?.id ||
//         !googleButtonRef.current
//       ) {
//         return;
//       }

//       const container = googleButtonRef.current;
//       container.innerHTML = "";

//       window.google.accounts.id.initialize({
//         client_id: clientId,

//         // Avoid the FedCM button flow.
//         use_fedcm_for_button: false,

//         callback: async (response) => {
//           if (!response?.credential) {
//             toast("Google sign-in did not return a credential.", "error");
//             return;
//           }

//           setBusy(true);

//           try {
//             const data = await api("/auth/google", {
//               method: "POST",
//               body: { credential: response.credential },
//             });

//             if (data.onboardingRequired && data.onboardingTicket) {
//               // Clear any previous verification session
//               sessionStorage.removeItem("vlr_google_verified");

//               sessionStorage.setItem(
//                 "vlr_onboarding_ticket",
//                 data.onboardingTicket,
//               );

//               sessionStorage.setItem(
//                 "vlr_google_profile",
//                 JSON.stringify(data.googleProfile || {}),
//               );

//               sessionStorage.setItem("vlr_invite_token", invite);

//               // Mark Google verification as completed
//               sessionStorage.setItem("vlr_google_verified", "true");
//               onGoogleVerified?.();

//               nav(
//                 "/register" +
//                   (invite ? `?invite=${encodeURIComponent(invite)}` : ""),
//               );
//             } else if (data.token && data.user) {
//               tokenStore.set(data.token);
//               onLogin(data.user);

//               nav(data.user.role === "admin" ? "/admin" : "/intern/dashboard");
//             } else {
//               throw new Error(
//                 "Google authentication did not return a valid response.",
//               );
//             }
//           } catch (error) {
//             toast(error.message, "error");
//           } finally {
//             setBusy(false);
//           }
//         },
//       });

//       window.google.accounts.id.renderButton(container, {
//         type: "standard",
//         theme: "outline",
//         size: "large",
//         text: "continue_with",
//         shape: "rectangular",
//         width: 320,
//       });
//     };

//     const script = document.querySelector(
//       'script[src="https://accounts.google.com/gsi/client"]',
//     );

//     if (window.google?.accounts?.id) {
//       initializeGoogleButton();
//     } else if (script) {
//       script.addEventListener("load", initializeGoogleButton, {
//         once: true,
//       });
//     } else {
//       const newScript = document.createElement("script");
//       newScript.src = "https://accounts.google.com/gsi/client";
//       newScript.async = true;
//       newScript.defer = true;
//       newScript.onload = initializeGoogleButton;
//       document.head.appendChild(newScript);
//     }

//     return () => {
//       cancelled = true;
//       script?.removeEventListener("load", initializeGoogleButton);
//     };
//   }, [clientId, invite, nav, onLogin, toast]);

//   const submit = async (event) => {
//     event.preventDefault();

//     setAuthLoadingType(mode);
//     setBusy(true);

//     try {
//       const endpoint =
//         mode === "admin" ? "/auth/admin-login" : "/auth/intern-login";

//       const body =
//         mode === "admin"
//           ? { email: internId.trim(), password }
//           : {
//               internId: internId.replace(/\s/g, "").toUpperCase(),
//               password,
//             };

//       const data = await api(endpoint, { method: "POST", body });

//       tokenStore.set(data.token);
//       onLogin(data.user);

//       nav(data.user.role === "admin" ? "/admin" : "/intern/dashboard");
//     } catch (error) {
//       toast(error.message, "error");
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div className={styles.page}>
//       <AuthLoadingOverlay open={busy} type={authLoadingType} />
//       {/* Top navigation */}
//       <header className={styles.topbar}>
//         <div className={styles.brand}>
//           <div className="w-10 h-10">
//             <img src="/LOGO.jpeg" className="rounded-xl" alt="VELoop Logo" />
//           </div>
//           {/* <span className={styles.logo}>V</span> */}
//           <span>{brand}</span>
//         </div>

//         <div className={styles.headerStatus}>
//           <span className={styles.statusDot} />
//           <ShieldCheck size={17} />
//           <span>Protected workspace</span>
//         </div>
//       </header>

//       {/* Main content */}
//       <main className={styles.stage}>
//         {/* Left introduction section */}
//         <section className={styles.intro}>
//           <div className={styles.eyebrow}>
//             <span />
//             THE INTERNSHIP WORKSPACE
//           </div>

//           <h1>
//             Make every
//             <br />
//             internship day <em>count.</em>
//           </h1>

//           <p className={styles.description}>
//             Your official space to record attendance, follow programme updates,
//             and track the rewards you earn as you learn.
//           </p>

//           <div className={styles.proof}>
//             <div className={styles.proofItem}>
//               <span className={styles.proofIcon}>
//                 <CalendarCheck size={19} />
//               </span>

//               <span>
//                 <b>Attendance, made clear</b>
//                 <small>Know your session and approval status</small>
//               </span>
//             </div>

//             <div className={styles.proofItem}>
//               <span className={styles.proofIcon}>
//                 <Users size={19} />
//               </span>

//               <span>
//                 <b>Connected to your group</b>
//                 <small>Updates from your official programme team</small>
//               </span>
//             </div>

//             <div className={styles.proofItem}>
//               <span className={styles.proofIcon}>
//                 <CheckCircle2 size={19} />
//               </span>

//               <span>
//                 <b>Fair and accountable</b>
//                 <small>Requests are reviewed before they count</small>
//               </span>
//             </div>
//           </div>

//           <div className={styles.introNote}>
//             <Sparkles size={17} />
//             <span>
//               Small steps. Consistent progress. A better internship experience.
//             </span>
//           </div>
//         </section>

//         {/* Login card */}
//         <section className={styles.formCard} aria-labelledby="signin-title">
//           <div className={styles.formHeader}>
//             <div className={styles.formIcon}>
//               <LockKeyhole size={21} />
//             </div>

//             <div>
//               <div className={styles.formEyebrow}>WELCOME BACK</div>
//               <h2 id="signin-title">Sign in to continue</h2>
//               <p>Choose the access type for your workspace.</p>
//             </div>
//           </div>

//           {/* Access type tabs */}
//           <div className={styles.tabs} role="tablist" aria-label="Sign-in type">
//             <button
//               type="button"
//               role="tab"
//               aria-selected={mode === "intern"}
//               className={mode === "intern" ? styles.tabActive : ""}
//               onClick={() => {
//                 setMode("intern");
//                 setInternId("VLRINT");
//                 setPassword("");
//               }}
//             >
//               Intern
//             </button>

//             <button
//               type="button"
//               role="tab"
//               aria-selected={mode === "admin"}
//               className={mode === "admin" ? styles.tabActive : ""}
//               onClick={() => {
//                 setMode("admin");
//                 setInternId("");
//                 setPassword("");
//               }}
//             >
//               Admin
//             </button>
//           </div>

//           {/* Intern login */}
//           {mode === "intern" ? (
//             <>
//               <button
//                 type="button"
//                 className={styles.google}
//                 onClick={onGoogle}
//                 disabled={busy}
//               >
//                 <span className={styles.googleG}>G</span>

//                 <span>
//                   {busy ? "Connecting securely…" : "Continue with Google"}
//                 </span>

//                 <ArrowRight size={18} />
//               </button>
//               {/* <div
//                 ref={googleButtonRef}
//                 className={styles.googleButton}
//                 aria-label="Continue with Google"
//                 aria-busy={busy}
//                 style={{
//                   pointerEvents: busy ? "none" : "auto",
//                   opacity: busy ? 0.6 : 1,
//                 }}
//               /> */}

//               <div className={styles.or}>
//                 <span />
//                 <span className={styles.orText}>or sign in with intern ID</span>
//                 <span />
//               </div>

//               <form onSubmit={submit}>
//                 <label htmlFor="intern-id">Intern ID</label>

//                 <div className={styles.field}>
//                   <span className={styles.prefix}>VLRINT</span>

//                   <input
//                     id="intern-id"
//                     value={internId}
//                     onChange={(event) =>
//                       setInternId(event.target.value.toUpperCase())
//                     }
//                     required
//                     autoComplete="username"
//                     aria-label="Intern ID"
//                   />
//                 </div>

//                 <label htmlFor="intern-password">Password</label>

//                 <div className={styles.field}>
//                   <LockKeyhole size={18} />

//                   <input
//                     id="intern-password"
//                     type={showPassword ? "text" : "password"}
//                     value={password}
//                     onChange={(event) => setPassword(event.target.value)}
//                     placeholder="Enter your password"
//                     required
//                     autoComplete="current-password"
//                   />

//                   <button
//                     type="button"
//                     onClick={() => setShowPassword((value) => !value)}
//                     aria-label="Toggle password visibility"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>

//                 <div className={styles.formHint}>
//                   New intern? Open the invitation link shared by your WhatsApp
//                   group admin to create your account.
//                 </div>

//                 <button className={styles.submit} disabled={busy}>
//                   <span>
//                     {busy ? "Signing in…" : "Sign in to your workspace"}
//                   </span>
//                   <ArrowRight size={19} />
//                 </button>
//               </form>

//               <button
//                 type="button"
//                 className={styles.recover}
//                 onClick={onGoogle}
//               >
//                 Forgot your password? <b>Continue with Google first</b>
//               </button>
//             </>
//           ) : (
//             /* Admin login */
//             <form onSubmit={submit}>
//               <label htmlFor="admin-email">Admin email</label>

//               <div className={styles.field}>
//                 <input
//                   id="admin-email"
//                   type="email"
//                   value={internId}
//                   onChange={(event) => setInternId(event.target.value)}
//                   placeholder="admin@yourcompany.com"
//                   required
//                   autoComplete="username"
//                 />
//               </div>

//               <label htmlFor="admin-password">Password</label>

//               <div className={styles.field}>
//                 <LockKeyhole size={18} />

//                 <input
//                   id="admin-password"
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(event) => setPassword(event.target.value)}
//                   placeholder="Enter admin password"
//                   required
//                   autoComplete="current-password"
//                 />

//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((value) => !value)}
//                   aria-label="Toggle password visibility"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>

//               <div className={styles.formHint}>
//                 Administrator access is restricted to approved admin accounts.
//               </div>

//               <button className={styles.submit} disabled={busy}>
//                 <span>
//                   {busy ? "Verifying access…" : "Open admin workspace"}
//                 </span>
//                 <ArrowRight size={19} />
//               </button>
//             </form>
//           )}

//           {/* Security information */}
//           <div className={styles.trust}>
//             <ShieldCheck size={18} />

//             <span>
//               Role-based access
//               <i />
//               Private sign-in
//               <i />
//               Secure session
//             </span>
//           </div>
//         </section>
//       </main>

//       {/* Footer */}
//       <footer className={styles.footer}>
//         <span>
//           © {new Date().getFullYear()} {brand}
//         </span>

//         <span className={styles.footerRight}>
//           <a href="/policies#privacy">Privacy</a>
//           <a href="/policies#terms">Terms</a>
//           <a href="/policies#refund">Charges &amp; refunds</a>
//         </span>
//       </footer>
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
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
import AuthLoadingOverlay from "../../components/auth/AuthLoadingOverlay";

export default function Login({ onLogin, onGoogleVerified }) {
  const [mode, setMode] = useState("intern");
  const [internId, setInternId] = useState("VLRINT");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authLoadingType, setAuthLoadingType] = useState("intern");
  const googleButtonRef = useRef(null);
  const [search] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const brand = import.meta.env.VITE_BRAND_NAME || "VELoop Rewards";
  const invite = search.get("invite") || search.get("inviteToken") || "";

  const clientId = import.meta.env.GOOGLE_CLIENT_ID;

  // Keep the latest callbacks without reinitializing Google Identity Services
  // whenever the parent recreates a callback function.
  const authHandlersRef = useRef({});
  authHandlersRef.current = {
    onLogin,
    onGoogleVerified,
    nav,
    toast,
  };

  useEffect(() => {
    // The Google button only exists in the intern sign-in tab.
    if (mode !== "intern" || !clientId || !googleButtonRef.current) {
      return undefined;
    }

    let cancelled = false;
    let resizeObserver = null;
    let lastButtonWidth = 0;
    let scriptElement = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    const container = googleButtonRef.current;

    const handleCredentialResponse = async (response) => {
      if (!response?.credential) {
        authHandlersRef.current.toast(
          "Google sign-in did not return a valid credential. Please try again.",
          "error",
        );
        return;
      }

      if (cancelled) return;

      setAuthLoadingType("google");
      setBusy(true);

      try {
        const data = await api("/auth/google", {
          method: "POST",
          body: { credential: response.credential },
        });

        if (data.onboardingRequired && data.onboardingTicket) {
          // Start a clean onboarding verification session.
          sessionStorage.removeItem("vlr_google_verified");

          sessionStorage.setItem(
            "vlr_onboarding_ticket",
            data.onboardingTicket,
          );

          sessionStorage.setItem(
            "vlr_google_profile",
            JSON.stringify(data.googleProfile || {}),
          );

          sessionStorage.setItem("vlr_invite_token", invite);
          sessionStorage.setItem("vlr_google_verified", "true");

          authHandlersRef.current.onGoogleVerified?.();

          authHandlersRef.current.nav(
            "/register" +
              (invite ? `?invite=${encodeURIComponent(invite)}` : ""),
          );
        } else if (data.token && data.user) {
          tokenStore.set(data.token);
          authHandlersRef.current.onLogin(data.user);

          authHandlersRef.current.nav(
            data.user.role === "admin" ? "/admin" : "/intern/dashboard",
          );
        } else {
          throw new Error(
            "Google authentication did not return a valid response.",
          );
        }
      } catch (error) {
        authHandlersRef.current.toast(
          error?.message || "Google sign-in failed. Please try again.",
          "error",
        );
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !container) {
        return;
      }

      const measuredWidth = Math.floor(
        container.getBoundingClientRect().width || 320,
      );
      // Google Identity Services accepts button widths from 120 to 400 px.
      const buttonWidth = Math.max(120, Math.min(400, measuredWidth));

      if (buttonWidth === lastButtonWidth && container.firstElementChild) {
        return;
      }

      lastButtonWidth = buttonWidth;
      container.innerHTML = "";

      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: buttonWidth,
      });
    };

    const initializeGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !container) {
        return;
      }

      // Popup UX opens Google's dedicated sign-in window instead of One Tap.
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: "popup",
        use_fedcm_for_button: false,
        auto_select: false,
        callback: handleCredentialResponse,
      });

      renderGoogleButton();

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(renderGoogleButton);
        resizeObserver.observe(container);
      }
    };

    const handleScriptError = () => {
      if (!cancelled) {
        authHandlersRef.current.toast(
          "Google sign-in could not be loaded. Please refresh the page and try again.",
          "error",
        );
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogleButton();
    } else if (scriptElement) {
      scriptElement.addEventListener("load", initializeGoogleButton, {
        once: true,
      });
      scriptElement.addEventListener("error", handleScriptError, {
        once: true,
      });
    } else {
      scriptElement = document.createElement("script");
      scriptElement.src = "https://accounts.google.com/gsi/client";
      scriptElement.async = true;
      scriptElement.defer = true;
      scriptElement.addEventListener("load", initializeGoogleButton, {
        once: true,
      });
      scriptElement.addEventListener("error", handleScriptError, {
        once: true,
      });
      document.head.appendChild(scriptElement);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      scriptElement?.removeEventListener("load", initializeGoogleButton);
      scriptElement?.removeEventListener("error", handleScriptError);
    };
  }, [clientId, invite, mode]);

  const focusGoogleButton = () => {
    googleButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    googleButtonRef.current?.querySelector("iframe")?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();

    setAuthLoadingType(mode);
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
      <AuthLoadingOverlay open={busy} type={authLoadingType} />
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
              <div
                className={styles.googleButtonWrap}
                aria-label="Continue with Google"
                aria-busy={busy}
                style={{
                  pointerEvents: busy ? "none" : "auto",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <div ref={googleButtonRef} className={styles.googleButton} />
              </div>

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
                onClick={focusGoogleButton}
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
