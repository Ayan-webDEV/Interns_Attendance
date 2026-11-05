// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";

// import {
//   ArrowLeft,
//   ArrowRight,
//   ChevronLeft,
//   ShieldCheck,
//   CheckCircle2,
//   UserRound,
//   Mail,
//   Phone,
//   Users,
//   CalendarDays,
//   BriefcaseBusiness,
//   LockKeyhole,
//   KeyRound,
//   Sparkles,
//   BadgeCheck,
//   Fingerprint,
// } from "lucide-react";

// import { api, tokenStore } from "../api/client";
// import { useToast } from "../components/Toast/Toast";
// import RegisterLoading from "../components/auth/RegisterLoading";
// import styles from "./Register.module.css";

// export default function Register({ onLogin }) {
//   const [search] = useSearchParams();
//   const formRef = useRef(null);

//   const [step, setStep] = useState(1);

//   const [form, setForm] = useState({
//     internId: "",
//     name: "",
//     email: "",
//     whatsappNumber: "",
//     whatsappGroupName: "",
//     whatsappGroupCode: "",
//     internshipStartDate: "",
//     domain: "",
//     password: "",
//   });

//   const [busy, setBusy] = useState(false);
//   const [inviteGroup, setInviteGroup] = useState(null);
//   const [groupLoading, setGroupLoading] = useState(false);

//   const nav = useNavigate();
//   const toast = useToast();

//   const ticket = sessionStorage.getItem("vlr_onboarding_ticket");

//   const profile = JSON.parse(
//     sessionStorage.getItem("vlr_google_profile") || "{}",
//   );

//   const invite =
//     search.get("invite") || sessionStorage.getItem("vlr_invite_token") || "";

//   useEffect(() => {
//     let validProfile = false;

//     try {
//       const savedProfile = JSON.parse(
//         sessionStorage.getItem("vlr_google_profile") || "{}",
//       );

//       validProfile = Boolean(savedProfile.email && savedProfile.name);
//     } catch {
//       validProfile = false;
//     }

//     if (!ticket || !validProfile) {
//       toast("Google verification is required before registration.", "error");

//       nav("/login", { replace: true });
//     }
//     if (
//       sessionStorage.getItem("vlr_google_verified") !== "true" ||
//       !ticket ||
//       !validProfile
//     ) {
//       toast("Google verification is required before registration.", "error");
//       nav("/login", { replace: true });
//     }
//   }, []);

//   useEffect(() => {
//     setForm((p) => ({
//       ...p,
//       email: profile.email || p.email,
//       name: profile.name || p.name,
//     }));

//     if (invite) {
//       setGroupLoading(true);

//       api("/groups/invite/validate", {
//         method: "POST",
//         body: { inviteToken: invite },
//       })
//         .then((r) => {
//           setInviteGroup(r.group);

//           setForm((p) => ({
//             ...p,
//             whatsappGroupName: r.group.name,
//             whatsappGroupCode: r.group.whatsappGroupCode || "",
//             internshipStartDate: r.group.plannedStartDate
//               ? p.internshipStartDate ||
//                 new Date(r.group.plannedStartDate).toISOString().slice(0, 10)
//               : p.internshipStartDate,
//           }));
//         })
//         .catch((e) => toast(e.message, "error"))
//         .finally(() => setGroupLoading(false));
//     }
//   }, []);

//   const change = (e) => {
//     setForm((p) => ({
//       ...p,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleNext = () => {
//     // Check Google verification session
//     const googleVerified =
//       sessionStorage.getItem("vlr_google_verified") === "true";

//     const onboardingTicket = sessionStorage.getItem("vlr_onboarding_ticket");

//     let googleProfile = {};

//     try {
//       googleProfile = JSON.parse(
//         sessionStorage.getItem("vlr_google_profile") || "{}",
//       );
//     } catch {
//       googleProfile = {};
//     }

//     // If Google verification is missing, clear the session and redirect
//     if (
//       !googleVerified ||
//       !onboardingTicket ||
//       !googleProfile.email ||
//       !googleProfile.name
//     ) {
//       sessionStorage.removeItem("vlr_google_verified");
//       sessionStorage.removeItem("vlr_onboarding_ticket");
//       sessionStorage.removeItem("vlr_google_profile");
//       sessionStorage.removeItem("vlr_invite_token");

//       toast("Google verification is required. Please sign in again.", "error");

//       nav("/login", { replace: true });
//       return;
//     }

//     // Validate form fields
//     if (!formRef.current) return;

//     if (!formRef.current.reportValidity()) return;

//     if (groupLoading) {
//       toast("Please wait while your invitation is being verified.", "error");
//       return;
//     }

//     // All checks passed; continue to Step 2
//     setStep(2);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleBack = () => {
//     setStep(1);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const submit = async (e) => {
//     e.preventDefault();

//     if (step === 1) {
//       handleNext();
//       return;
//     }

//     // Verify Google registration session before submitting
//     let googleProfile = {};

//     try {
//       googleProfile = JSON.parse(
//         sessionStorage.getItem("vlr_google_profile") || "{}",
//       );
//     } catch {
//       googleProfile = {};
//     }

//     const isGoogleVerified =
//       sessionStorage.getItem("vlr_google_verified") === "true";

//     const onboardingTicket = sessionStorage.getItem("vlr_onboarding_ticket");

//     if (
//       !isGoogleVerified ||
//       !onboardingTicket ||
//       !googleProfile.email ||
//       !googleProfile.name
//     ) {
//       // Clear invalid or incomplete verification session
//       sessionStorage.removeItem("vlr_google_verified");
//       sessionStorage.removeItem("vlr_onboarding_ticket");
//       sessionStorage.removeItem("vlr_google_profile");
//       sessionStorage.removeItem("vlr_invite_token");

//       toast(
//         "Your Google verification session is missing or expired. Please sign in again.",
//         "error",
//       );

//       nav("/login", { replace: true });
//       return;
//     }

//     setBusy(true);

//     try {
//       const data = await api("/auth/register", {
//         method: "POST",
//         body: {
//           ...form,
//           internId: `VLRINT${String(form.internId)
//             .replace(/^VLRINT/i, "")
//             .replace(/[\s_-]+/g, "")}`,
//           onboardingTicket: ticket,
//           inviteToken: invite,
//         },
//       });

//       // Save the newly created account's authentication token
//       tokenStore.set(data.token);

//       // Clear Google verification and onboarding session
//       sessionStorage.removeItem("vlr_google_verified");
//       sessionStorage.removeItem("vlr_onboarding_ticket");
//       sessionStorage.removeItem("vlr_google_profile");
//       sessionStorage.removeItem("vlr_invite_token");

//       // Update authenticated user state
//       onLogin(data.user);

//       // Show success message
//       toast("Your account is ready. Welcome to the internship!");

//       // Navigate to dashboard
//       nav("/intern/dashboard");
//     } catch (e) {
//       toast(e.message, "error");
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div className={`${styles.page} min-h-screen relative`}>
//       <RegisterLoading open={busy} />

//       {/* BACKGROUND DECORATIONS */}
//       <div className={styles.geometry} aria-hidden="true">
//         <span className={`${styles.shape} ${styles.hexagon}`} />
//         <span className={`${styles.shape} ${styles.octagon}`} />
//         <span className={`${styles.shape} ${styles.triangle}`} />
//         <span className={`${styles.shape} ${styles.circle}`} />
//         <span className={`${styles.shape} ${styles.diamond}`} />
//         <span className={`${styles.shape} ${styles.ring}`} />
//       </div>

//       <div className={styles.ambient} />
//       <div className={styles.ambientBottom} />

//       <main className={styles.layout}>
//         {/* LEFT INTRODUCTION */}
//         <section className={styles.intro}>
//           <div className={styles.brand}>
//             <div className="w-10 h-10">
//               <img src="/LOGO.jpeg" className="rounded-xl" alt="VELoop Logo" />
//             </div>
//             {/* <span className={styles.brandMark}>V</span> */}
//             <div>
//               <strong>
//                 VELOOP <span>REWARDS</span>
//               </strong>
//               <small>INTERN WORKSPACE</small>
//             </div>
//           </div>

//           <div className={styles.introContent}>
//             <div className={styles.eyebrow}>
//               <span />
//               YOUR JOURNEY STARTS HERE
//             </div>

//             <h1>
//               Build your future.
//               <br />
//               <span>Make every</span>
//               <br />
//               opportunity count.
//             </h1>

//             <p className={styles.introDescription}>
//               Complete your profile and become part of your official internship
//               workspace. Stay connected, track your progress and make the most
//               of your learning journey.
//             </p>

//             <div className={styles.benefits}>
//               <div className={styles.benefit}>
//                 <div className={styles.benefitIcon}>
//                   <ShieldCheck size={20} />
//                 </div>
//                 <div>
//                   <strong>Verified onboarding</strong>
//                   <small>Your identity and offer details are validated</small>
//                 </div>
//               </div>

//               <div className={styles.benefit}>
//                 <div className={styles.benefitIcon}>
//                   <Users size={20} />
//                 </div>
//                 <div>
//                   <strong>Connected community</strong>
//                   <small>Join your assigned internship group</small>
//                 </div>
//               </div>

//               <div className={styles.benefit}>
//                 <div className={styles.benefitIcon}>
//                   <CheckCircle2 size={20} />
//                 </div>
//                 <div>
//                   <strong>Your personal workspace</strong>
//                   <small>Access attendance and programme updates</small>
//                 </div>
//               </div>
//             </div>

//             {/* ILLUSTRATION */}
//             <div className={styles.illustrationArea}>
//               <div className={styles.illustrationGlow} />

//               <div className={styles.illustrationCard}>
//                 <div className={styles.illustrationTop}>
//                   <div className={styles.illustrationLogo}>V</div>
//                   <span>MEMBER VERIFICATION</span>
//                   <BadgeCheck size={20} />
//                 </div>

//                 <div className={styles.illustrationMain}>
//                   <div className={styles.avatarIllustration}>
//                     <UserRound size={38} />
//                   </div>

//                   <div className={styles.illustrationText}>
//                     <strong>Your journey awaits</strong>
//                     <small>Intern profile setup</small>
//                     <div className={styles.illustrationProgress}>
//                       <span />
//                     </div>
//                   </div>
//                 </div>

//                 <div className={styles.illustrationFooter}>
//                   <ShieldCheck size={16} />
//                   <span>Secure onboarding experience</span>
//                   <CheckCircle2 size={17} />
//                 </div>
//               </div>

//               <div className={styles.floatingBadge}>
//                 <Sparkles size={16} />
//                 <span>Ready to grow?</span>
//               </div>

//               <div className={styles.floatingCheck}>
//                 <CheckCircle2 size={21} />
//               </div>
//             </div>

//             <div className={styles.introFooter}>
//               <ShieldCheck size={16} />
//               <span>One step closer to your next opportunity.</span>
//             </div>
//           </div>
//         </section>

//         {/* RIGHT REGISTRATION PANEL */}
//         <section className={styles.formSection}>
//           <div className={styles.formCard}>
//             <button
//               type="button"
//               onClick={() => {
//                 sessionStorage.removeItem("vlr_google_verified");
//                 sessionStorage.removeItem("vlr_onboarding_ticket");
//                 sessionStorage.removeItem("vlr_google_profile");
//                 sessionStorage.removeItem("vlr_invite_token");
//                 nav("/login");
//               }}
//               className={styles.backButton}
//             >
//               <ArrowLeft size={16} />
//               Back to sign in
//             </button>

//             {/* HEADING */}
//             <div className={styles.formHeading}>
//               <div
//                 className={`${styles.formHeadingIcon} ${
//                   step === 1 ? styles.orangeHeading : styles.purpleHeading
//                 }`}
//               >
//                 {step === 1 ? (
//                   <UserRound size={23} />
//                 ) : (
//                   <ShieldCheck size={23} />
//                 )}
//               </div>

//               <div>
//                 <div className={styles.formEyebrow}>
//                   {step === 1 ? "PROFILE SETUP" : "FINAL SECURITY STEP"}
//                 </div>

//                 <h2>
//                   {step === 1 ? "Complete your profile" : "Secure your account"}
//                 </h2>

//                 <p>
//                   {step === 1
//                     ? "Let's get your internship details ready."
//                     : "One final step before joining your workspace."}
//                 </p>
//               </div>
//             </div>

//             {/* PROGRESS */}
//             <div className={styles.progressArea}>
//               <div className={styles.progressTop}>
//                 <span>
//                   {step === 1 ? "Profile information" : "Account security"}
//                 </span>
//                 <strong>{step === 1 ? "01 / 02" : "02 / 02"}</strong>
//               </div>

//               <div className={styles.progressTrack}>
//                 <span className={step === 2 ? styles.progressComplete : ""} />
//               </div>

//               <div className={styles.progressSteps}>
//                 <div
//                   className={step === 1 ? styles.activeStep : styles.doneStep}
//                 >
//                   <span>
//                     <CheckCircle2 size={14} />
//                   </span>
//                   Profile
//                 </div>

//                 <div className={step === 2 ? styles.activeStep : ""}>
//                   <span>
//                     <LockKeyhole size={14} />
//                   </span>
//                   Security
//                 </div>
//               </div>
//             </div>

//             {/* GOOGLE VERIFICATION */}
//             <div className={styles.trustBanner}>
//               <span className={styles.trustIcon}>
//                 <ShieldCheck size={19} />
//               </span>
//               <div>
//                 <strong>Google identity verified</strong>
//                 <small>Official offer letter validation required</small>
//               </div>
//               <CheckCircle2 size={18} className={styles.verifiedIcon} />
//             </div>

//             <form
//               ref={formRef}
//               onSubmit={submit}
//               className={styles.registrationForm}
//             >
//               {/* ===================================
//                   STEP 1
//               =================================== */}
//               {step === 1 && (
//                 <div className={styles.stepContent}>
//                   {/* PERSONAL DETAILS */}
//                   <div className={styles.sectionHeading}>
//                     <span
//                       className={`${styles.sectionIcon} ${styles.orangeIcon}`}
//                     >
//                       <UserRound size={19} />
//                     </span>
//                     <div>
//                       <h3>Personal information</h3>
//                       <p>Your identity and contact details</p>
//                     </div>
//                     <span className={styles.sectionNumber}>01</span>
//                   </div>

//                   <div className={styles.formGrid}>
//                     <div className={styles.formGroup}>
//                       <label htmlFor="internId">Intern ID</label>
//                       <div className={styles.field}>
//                         <Fingerprint size={17} />
//                         <span className={styles.prefix}>VLRINT</span>
//                         <input
//                           id="internId"
//                           name="internId"
//                           value={form.internId}
//                           onChange={(e) =>
//                             setForm((p) => ({
//                               ...p,
//                               internId: e.target.value
//                                 .toUpperCase()
//                                 .replace(/^VLRINT/, "")
//                                 .replace(/[^A-Z0-9_-]/g, ""),
//                             }))
//                           }
//                           required
//                           placeholder="202601234"
//                         />
//                       </div>
//                     </div>

//                     <div className={styles.formGroup}>
//                       <label htmlFor="name">Full name</label>
//                       <div className={styles.field}>
//                         <UserRound size={17} />
//                         <input
//                           id="name"
//                           name="name"
//                           value={form.name}
//                           onChange={change}
//                           required
//                           placeholder="Your full name"
//                         />
//                       </div>
//                     </div>

//                     <div className={styles.formGroup}>
//                       <label htmlFor="email">Google email</label>
//                       <div
//                         className={`${styles.field} ${styles.readonlyField}`}
//                       >
//                         <Mail size={17} />
//                         <input
//                           id="email"
//                           name="email"
//                           type="email"
//                           value={form.email}
//                           readOnly
//                           required
//                         />
//                         <CheckCircle2
//                           size={17}
//                           className={styles.verifiedIcon}
//                         />
//                       </div>
//                     </div>

//                     <div className={styles.formGroup}>
//                       <label htmlFor="whatsappNumber">WhatsApp number</label>
//                       <div className={styles.field}>
//                         <Phone size={17} />
//                         <input
//                           id="whatsappNumber"
//                           name="whatsappNumber"
//                           type="tel"
//                           value={form.whatsappNumber}
//                           onChange={change}
//                           required
//                           placeholder="+91..."
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className={styles.sectionDivider} />

//                   {/* INTERNSHIP DETAILS */}
//                   <div className={styles.sectionHeading}>
//                     <span
//                       className={`${styles.sectionIcon} ${styles.purpleIcon}`}
//                     >
//                       <BriefcaseBusiness size={19} />
//                     </span>
//                     <div>
//                       <h3>Internship details</h3>
//                       <p>Your programme and assigned group</p>
//                     </div>
//                     <span className={styles.sectionNumber}>02</span>
//                   </div>

//                   <div className={styles.formGrid}>
//                     <div className={styles.formGroup}>
//                       <label htmlFor="whatsappGroupName">WhatsApp group</label>
//                       <div className={styles.field}>
//                         <Users size={17} />
//                         <input
//                           id="whatsappGroupName"
//                           name="whatsappGroupName"
//                           value={form.whatsappGroupName}
//                           onChange={change}
//                           required
//                           readOnly={!!inviteGroup}
//                           placeholder="Group name"
//                         />
//                       </div>
//                     </div>

//                     <div className={styles.formGroup}>
//                       <label htmlFor="whatsappGroupCode">Group code</label>
//                       <div className={styles.field}>
//                         <KeyRound size={17} />
//                         <input
//                           id="whatsappGroupCode"
//                           name="whatsappGroupCode"
//                           value={form.whatsappGroupCode}
//                           onChange={change}
//                           required
//                           readOnly={!!inviteGroup}
//                           placeholder="Group code"
//                         />
//                       </div>
//                     </div>

//                     <div className={styles.formGroup}>
//                       <label htmlFor="internshipStartDate">Start date</label>
//                       <div className={styles.field}>
//                         <CalendarDays size={17} />
//                         <input
//                           id="internshipStartDate"
//                           name="internshipStartDate"
//                           type="date"
//                           value={form.internshipStartDate}
//                           onChange={change}
//                           required
//                         />
//                       </div>
//                     </div>

//                     <div className={styles.formGroup}>
//                       <label htmlFor="domain">Internship domain</label>
//                       <div className={styles.field}>
//                         <BriefcaseBusiness size={17} />
//                         <input
//                           id="domain"
//                           name="domain"
//                           value={form.domain}
//                           onChange={change}
//                           required
//                           placeholder="Frontend Development"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {groupLoading && (
//                     <div className={styles.inlineNotice}>
//                       <span className={styles.miniSpinner} />
//                       Validating invitation...
//                     </div>
//                   )}

//                   {inviteGroup && (
//                     <div className={styles.detectedNotice}>
//                       <CheckCircle2 size={16} />
//                       Your internship group was detected from your invitation.
//                     </div>
//                   )}

//                   <div className={styles.stepInfo}>
//                     <ShieldCheck size={18} />
//                     Your details will be checked against your official offer
//                     letter.
//                   </div>

//                   <button
//                     type="button"
//                     className={styles.nextButton}
//                     onClick={handleNext}
//                     disabled={groupLoading}
//                   >
//                     <span>Continue to account security</span>
//                     <ArrowRight size={19} />
//                   </button>
//                 </div>
//               )}

//               {/* ===================================
//                   STEP 2
//               =================================== */}
//               {step === 2 && (
//                 <div className={styles.stepContent}>
//                   <div className={styles.securityHero}>
//                     <div className={styles.securityVisual}>
//                       <div className={styles.securityOrbit} />
//                       <ShieldCheck size={43} />
//                       <span>
//                         <CheckCircle2 size={17} />
//                       </span>
//                     </div>

//                     <h3>Almost there!</h3>
//                     <p>
//                       Create a strong password to protect your VELoop internship
//                       workspace.
//                     </p>
//                   </div>

//                   {/* PASSWORD */}
//                   <div className={styles.passwordSection}>
//                     <div className={styles.passwordHeading}>
//                       <span className={styles.passwordIcon}>
//                         <LockKeyhole size={19} />
//                       </span>
//                       <div>
//                         <label htmlFor="password">Create your password</label>
//                         <small>Choose a password you'll remember</small>
//                       </div>
//                     </div>

//                     <div className={styles.passwordField}>
//                       <LockKeyhole size={18} />
//                       <input
//                         id="password"
//                         type="password"
//                         name="password"
//                         value={form.password}
//                         onChange={change}
//                         minLength={10}
//                         required
//                         placeholder="Enter a strong password"
//                         autoComplete="new-password"
//                       />
//                     </div>

//                     <div className={styles.passwordHint}>
//                       <CheckCircle2 size={15} />
//                       Minimum 10 characters required
//                     </div>
//                   </div>

//                   {/* SUMMARY */}
//                   <div className={styles.reviewSection}>
//                     <div className={styles.reviewHeader}>
//                       <Fingerprint size={19} />
//                       <strong>Your registration summary</strong>
//                       <BadgeCheck size={19} />
//                     </div>

//                     <div className={styles.reviewRow}>
//                       <span>Intern ID</span>
//                       <strong>VLRINT{form.internId}</strong>
//                     </div>

//                     <div className={styles.reviewRow}>
//                       <span>Full name</span>
//                       <strong>{form.name}</strong>
//                     </div>

//                     <div className={styles.reviewRow}>
//                       <span>Internship domain</span>
//                       <strong>{form.domain}</strong>
//                     </div>
//                   </div>

//                   <div className={styles.securityNotice}>
//                     <ShieldCheck size={19} />
//                     <p>
//                       Your registration will be verified against your official
//                       offer letter before your account is activated.
//                     </p>
//                   </div>

//                   <div className={styles.stepActions}>
//                     <button
//                       type="button"
//                       className={styles.previousButton}
//                       onClick={handleBack}
//                     >
//                       <ChevronLeft size={18} />
//                       Back
//                     </button>

//                     <button
//                       type="submit"
//                       className={styles.submit}
//                       disabled={busy}
//                     >
//                       <ShieldCheck size={18} />
//                       <span>
//                         {busy ? "Verifying..." : "Verify & create account"}
//                       </span>
//                       <ArrowRight size={18} />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </form>

//             <div className={styles.formFooter}>
//               <ShieldCheck size={15} />
//               Secure registration · Protected onboarding
//             </div>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  UserRound,
  Mail,
  Phone,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  LockKeyhole,
  KeyRound,
  Sparkles,
  BadgeCheck,
  Fingerprint,
} from "lucide-react";

import { api, tokenStore } from "../api/client";
import { useToast } from "../components/Toast/Toast";
import RegisterLoading from "../components/auth/RegisterLoading";
import styles from "./Register.module.css";

const readGoogleProfile = () => {
  try {
    return JSON.parse(sessionStorage.getItem("vlr_google_profile") || "{}");
  } catch {
    return {};
  }
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const REGISTRATION_TERMS_VERSION = "2026-11-05-v1";

// Eight concise acknowledgements summarise the live policy sections.
const REGISTRATION_ACKNOWLEDGEMENTS = [
  {
    id: "terms",
    title: "Account, accuracy and conduct",
    description:
      "I will provide accurate registration details, use only my own account, protect my credentials and follow official programme instructions.",
    policy: "terms",
    policyLabel: "Terms & conditions",
    secondPolicy: "security",
    secondPolicyLabel: "Security policy",
  },
  {
    id: "schedule",
    title: "Working days and hours",
    description:
      "Regular working hours are 9:30 AM–6:00 PM, Monday–Friday. Saturday is a holiday, but I may work independently and mark attendance when the scheduled session is available.",
    policy: "attendance",
    policyLabel: "Attendance policy",
  },
  {
    id: "attendance",
    title: "Attendance requirements",
    description:
      "I understand the two scheduled attendance sessions, device restrictions, attendance review process and that a submission is not approved until the portal records approval.",
    policy: "attendance",
    policyLabel: "Attendance policy",
  },
  {
    id: "privacy",
    title: "Privacy and information use",
    description:
      "I understand that account, contact, internship, attendance, project and reward information is used for programme administration, verification and support.",
    policy: "privacy",
    policyLabel: "Privacy policy",
    secondPolicy: "cookies",
    secondPolicyLabel: "Cookies policy",
  },
  {
    id: "projects",
    title: "Project work and evaluation",
    description:
      "I will submit genuine work that represents my contribution and follow the assigned requirements, instructions, deadlines and review process.",
    policy: "projects",
    policyLabel: "Project submission & evaluation",
  },
  {
    id: "interncash",
    title: "InternCash and reward credits",
    description:
      "I understand InternCash is an internal reward-credit system. Eligible credits may accrue through verified attendance and qualifying project submissions, and may be adjusted against certification processing charges. InternCash does not guarantee a stipend, PPO or certificate.",
    policy: "interncash",
    policyLabel: "InternCash policy",
  },
  {
    id: "outcomes",
    title: "Stipend and PPO outcomes",
    description:
      "I understand stipend and PPO opportunities are separately evaluated, performance/business dependent and not guaranteed by attendance, project submission or programme completion.",
    policy: "stipend",
    policyLabel: "Stipend policy",
    secondPolicy: "ppo",
    secondPolicyLabel: "PPO policy",
  },
  {
    id: "certification",
    title: "Certification charges and refunds",
    description:
      "I understand certification processing is separate from internship participation, applicable charges must be disclosed, and refund/payment disputes follow the published policy.",
    policy: "certification",
    policyLabel: "Certification charges",
    secondPolicy: "refund",
    secondPolicyLabel: "Refund policy",
  },
];

export default function Register({ onLogin }) {
  const [search] = useSearchParams();
  const formRef = useRef(null);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    internId: "",
    name: "",
    email: "",
    whatsappNumber: "",
    gender: "",
    whatsappGroupName: "",
    whatsappGroupCode: "",
    internshipStartDate: "",
    domain: "",
    password: "",
  });

  const [busy, setBusy] = useState(false);
  const [inviteGroup, setInviteGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [offerRecord, setOfferRecord] = useState(null);
  const [offerLookup, setOfferLookup] = useState({
    status: "idle",
    message: "",
  });
  const offerLookupRequestRef = useRef(0);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsChecks, setTermsChecks] = useState({});

  const allTermsAccepted = REGISTRATION_ACKNOWLEDGEMENTS.every(
    (item) => termsChecks[item.id] === true,
  );

  const nav = useNavigate();
  const toast = useToast();

  const ticket = sessionStorage.getItem("vlr_onboarding_ticket");
  const profile = readGoogleProfile();

  const invite =
    search.get("invite") || sessionStorage.getItem("vlr_invite_token") || "";

  useEffect(() => {
    const validProfile = Boolean(profile.email && profile.name);
    const googleVerified =
      sessionStorage.getItem("vlr_google_verified") === "true";

    if (!ticket || !validProfile || !googleVerified) {
      toast("Google verification is required before registration.", "error");
      nav("/login", { replace: true });
    }
  }, []);

  // The invite remains the source of the WhatsApp group name and group code.
  // Internship start date and domain now come only from the offer-letter record.
  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      email: profile.email || previous.email,
    }));

    if (!invite) return undefined;

    let active = true;
    setGroupLoading(true);

    api("/groups/invite/validate", {
      method: "POST",
      body: { inviteToken: invite },
    })
      .then((response) => {
        if (!active) return;

        setInviteGroup(response.group);
        setForm((previous) => ({
          ...previous,
          whatsappGroupName: response.group.name,
          whatsappGroupCode: response.group.whatsappGroupCode || "",
        }));
      })
      .catch((error) => {
        if (active) toast(error.message, "error");
      })
      .finally(() => {
        if (active) setGroupLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Once all 9 numeric digits are entered, look up the matching offer letter.
  // Debouncing and aborting prevent stale responses from overwriting a newer ID.
  useEffect(() => {
    const requestId = ++offerLookupRequestRef.current;
    const digits = String(form.internId || "");

    if (!/^\d{9}$/.test(digits)) {
      setOfferRecord(null);
      setOfferLookup({ status: "idle", message: "" });
      setForm((previous) => ({
        ...previous,
        name: "",
        internshipStartDate: "",
        domain: "",
      }));
      return undefined;
    }

    const controller = new AbortController();

    setOfferRecord(null);
    setOfferLookup({
      status: "waiting",
      message: "Checking your official offer letter…",
    });

    const timer = window.setTimeout(async () => {
      setOfferLookup({
        status: "loading",
        message: "Verifying your Intern ID against the offer-letter record…",
      });

      try {
        const response = await api("/auth/offer-lookup", {
          method: "POST",
          body: {
            internId: `VLRINT${digits}`,
            onboardingTicket: ticket,
          },
          signal: controller.signal,
        });

        if (requestId !== offerLookupRequestRef.current) return;

        const offer = response.offer || response.intern || response;
        const startDate = toDateInputValue(offer.startDate);
        const domain = String(offer.domain || "").trim();
        const offerName = String(offer.name || "").trim();

        if (!offerName || !startDate || !domain) {
          throw new Error(
            "Your offer letter is missing required details. Please contact the administrator.",
          );
        }

        setOfferRecord(offer);
        setForm((previous) => ({
          ...previous,
          internId: digits,
          name: offerName,
          email: String(offer.email || profile.email || previous.email).trim(),
          internshipStartDate: startDate,
          domain,
        }));

        setOfferLookup({
          status: "success",
          message:
            "Offer letter verified. Your internship details have been filled automatically.",
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        if (requestId !== offerLookupRequestRef.current) return;

        setOfferRecord(null);
        const lookupMessage =
          error.message ||
          "We could not verify this Intern ID. Please check the ID and try again.";

        setOfferLookup({
          status: "error",
          message: lookupMessage,
        });
        toast(lookupMessage, "error");
        setForm((previous) => ({
          ...previous,
          name: "",
          internshipStartDate: "",
          domain: "",
        }));
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.internId, ticket]);

  const change = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNext = () => {
    // Check Google verification session
    const googleVerified =
      sessionStorage.getItem("vlr_google_verified") === "true";

    const onboardingTicket = sessionStorage.getItem("vlr_onboarding_ticket");

    let googleProfile = {};

    try {
      googleProfile = JSON.parse(
        sessionStorage.getItem("vlr_google_profile") || "{}",
      );
    } catch {
      googleProfile = {};
    }

    // If Google verification is missing, clear the session and redirect
    if (
      !googleVerified ||
      !onboardingTicket ||
      !googleProfile.email ||
      !googleProfile.name
    ) {
      sessionStorage.removeItem("vlr_google_verified");
      sessionStorage.removeItem("vlr_onboarding_ticket");
      sessionStorage.removeItem("vlr_google_profile");
      sessionStorage.removeItem("vlr_invite_token");

      toast("Google verification is required. Please sign in again.", "error");

      nav("/login", { replace: true });
      return;
    }

    // The offer must be verified before moving to password creation.
    if (
      !offerRecord ||
      offerRecord.internId !== `VLRINT${form.internId}` ||
      offerLookup.status !== "success"
    ) {
      toast(
        "Enter your complete 9-digit Intern ID and wait for offer-letter verification.",
        "error",
      );
      return;
    }

    if (!inviteGroup || groupLoading) {
      toast("Please wait while your invitation is being verified.", "error");
      return;
    }

    // Validate form fields
    if (!formRef.current) return;

    if (!formRef.current.reportValidity()) return;

    // All checks passed; continue to Step 2
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The final button opens the policy-acceptance modal. Account creation only
  // runs after all eight acknowledgements have been checked.
  const submit = (e) => {
    e.preventDefault();

    if (step === 1) {
      handleNext();
      return;
    }

    if (
      !offerRecord ||
      offerRecord.internId !== `VLRINT${form.internId}` ||
      offerLookup.status !== "success"
    ) {
      toast(
        "Your offer-letter details are not verified yet. Return to Step 1 and verify your Intern ID.",
        "error",
      );
      setStep(1);
      return;
    }

    setTermsOpen(true);
  };

  const createAccount = async () => {
    if (!allTermsAccepted) {
      toast("Please review and accept all eight registration terms.", "error");
      return;
    }

    const googleProfile = readGoogleProfile();
    const isGoogleVerified =
      sessionStorage.getItem("vlr_google_verified") === "true";
    const onboardingTicket = sessionStorage.getItem("vlr_onboarding_ticket");

    if (!isGoogleVerified || !onboardingTicket || !googleProfile.email) {
      sessionStorage.removeItem("vlr_google_verified");
      sessionStorage.removeItem("vlr_onboarding_ticket");
      sessionStorage.removeItem("vlr_google_profile");
      sessionStorage.removeItem("vlr_invite_token");

      toast(
        "Your Google verification session has expired. Please sign in with Google again.",
        "error",
      );
      nav("/login", { replace: true });
      return;
    }

    setBusy(true);

    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: {
          ...form,
          internId: offerRecord.internId,
          onboardingTicket,
          inviteToken: invite,
          termsAccepted: true,
          termsVersion: REGISTRATION_TERMS_VERSION,
        },
      });

      tokenStore.set(data.token);
      sessionStorage.removeItem("vlr_google_verified");
      sessionStorage.removeItem("vlr_onboarding_ticket");
      sessionStorage.removeItem("vlr_google_profile");
      sessionStorage.removeItem("vlr_invite_token");

      setTermsOpen(false);
      onLogin(data.user);
      toast("Your account is ready. Welcome to the internship!");
      nav("/intern/dashboard");
    } catch (error) {
      toast(
        error.message ||
          "We could not create your account. Your details are still here; please try again.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.page} min-h-screen relative`}>
      <RegisterLoading open={busy} />

      {/* BACKGROUND DECORATIONS */}
      <div className={styles.geometry} aria-hidden="true">
        <span className={`${styles.shape} ${styles.hexagon}`} />
        <span className={`${styles.shape} ${styles.octagon}`} />
        <span className={`${styles.shape} ${styles.triangle}`} />
        <span className={`${styles.shape} ${styles.circle}`} />
        <span className={`${styles.shape} ${styles.diamond}`} />
        <span className={`${styles.shape} ${styles.ring}`} />
      </div>

      <div className={styles.ambient} />
      <div className={styles.ambientBottom} />

      <main className={styles.layout}>
        {/* LEFT INTRODUCTION */}
        <section className={styles.intro}>
          <div className={styles.brand}>
            <div className="w-10 h-10">
              <img src="/LOGO.jpeg" className="rounded-xl" alt="VELoop Logo" />
            </div>
            {/* <span className={styles.brandMark}>V</span> */}
            <div>
              <strong>
                VELOOP <span>REWARDS</span>
              </strong>
              <small>INTERN WORKSPACE</small>
            </div>
          </div>

          <div className={styles.introContent}>
            <div className={styles.eyebrow}>
              <span />
              YOUR JOURNEY STARTS HERE
            </div>

            <h1>
              Build your future.
              <br />
              <span>Make every</span>
              <br />
              opportunity count.
            </h1>

            <p className={styles.introDescription}>
              Complete your profile and become part of your official internship
              workspace. Stay connected, track your progress and make the most
              of your learning journey.
            </p>

            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <strong>Verified onboarding</strong>
                  <small>Your identity and offer details are validated</small>
                </div>
              </div>

              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <Users size={20} />
                </div>
                <div>
                  <strong>Connected community</strong>
                  <small>Join your assigned internship group</small>
                </div>
              </div>

              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <strong>Your personal workspace</strong>
                  <small>Access attendance and programme updates</small>
                </div>
              </div>
            </div>

            {/* ILLUSTRATION */}
            <div className={styles.illustrationArea}>
              <div className={styles.illustrationGlow} />

              <div className={styles.illustrationCard}>
                <div className={styles.illustrationTop}>
                  <div className={styles.illustrationLogo}>V</div>
                  <span>MEMBER VERIFICATION</span>
                  <BadgeCheck size={20} />
                </div>

                <div className={styles.illustrationMain}>
                  <div className={styles.avatarIllustration}>
                    <UserRound size={38} />
                  </div>

                  <div className={styles.illustrationText}>
                    <strong>Your journey awaits</strong>
                    <small>Intern profile setup</small>
                    <div className={styles.illustrationProgress}>
                      <span />
                    </div>
                  </div>
                </div>

                <div className={styles.illustrationFooter}>
                  <ShieldCheck size={16} />
                  <span>Secure onboarding experience</span>
                  <CheckCircle2 size={17} />
                </div>
              </div>

              <div className={styles.floatingBadge}>
                <Sparkles size={16} />
                <span>Ready to grow?</span>
              </div>

              <div className={styles.floatingCheck}>
                <CheckCircle2 size={21} />
              </div>
            </div>

            <div className={styles.introFooter}>
              <ShieldCheck size={16} />
              <span>One step closer to your next opportunity.</span>
            </div>
          </div>
        </section>

        {/* RIGHT REGISTRATION PANEL */}
        <section className={styles.formSection}>
          <div className={styles.formCard}>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("vlr_google_verified");
                sessionStorage.removeItem("vlr_onboarding_ticket");
                sessionStorage.removeItem("vlr_google_profile");
                sessionStorage.removeItem("vlr_invite_token");
                nav("/login");
              }}
              className={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back to sign in
            </button>

            {/* HEADING */}
            <div className={styles.formHeading}>
              <div
                className={`${styles.formHeadingIcon} ${
                  step === 1 ? styles.orangeHeading : styles.purpleHeading
                }`}
              >
                {step === 1 ? (
                  <UserRound size={23} />
                ) : (
                  <ShieldCheck size={23} />
                )}
              </div>

              <div>
                <div className={styles.formEyebrow}>
                  {step === 1 ? "PROFILE SETUP" : "FINAL SECURITY STEP"}
                </div>

                <h2>
                  {step === 1 ? "Complete your profile" : "Secure your account"}
                </h2>

                <p>
                  {step === 1
                    ? "Let's get your internship details ready."
                    : "One final step before joining your workspace."}
                </p>
              </div>
            </div>

            {/* PROGRESS */}
            <div className={styles.progressArea}>
              <div className={styles.progressTop}>
                <span>
                  {step === 1 ? "Profile information" : "Account security"}
                </span>
                <strong>{step === 1 ? "01 / 02" : "02 / 02"}</strong>
              </div>

              <div className={styles.progressTrack}>
                <span className={step === 2 ? styles.progressComplete : ""} />
              </div>

              <div className={styles.progressSteps}>
                <div
                  className={step === 1 ? styles.activeStep : styles.doneStep}
                >
                  <span>
                    <CheckCircle2 size={14} />
                  </span>
                  Profile
                </div>

                <div className={step === 2 ? styles.activeStep : ""}>
                  <span>
                    <LockKeyhole size={14} />
                  </span>
                  Security
                </div>
              </div>
            </div>

            {/* GOOGLE VERIFICATION */}
            <div className={styles.trustBanner}>
              <span className={styles.trustIcon}>
                <ShieldCheck size={19} />
              </span>
              <div>
                <strong>Google identity verified</strong>
                <small>Official offer letter validation required</small>
              </div>
              <CheckCircle2 size={18} className={styles.verifiedIcon} />
            </div>

            <form
              ref={formRef}
              onSubmit={submit}
              className={styles.registrationForm}
            >
              {/* ===================================
                  STEP 1
              =================================== */}
              {step === 1 && (
                <div className={styles.stepContent}>
                  {/* PERSONAL DETAILS */}
                  <div className={styles.sectionHeading}>
                    <span
                      className={`${styles.sectionIcon} ${styles.orangeIcon}`}
                    >
                      <UserRound size={19} />
                    </span>
                    <div>
                      <h3>Personal information</h3>
                      <p>Your identity and contact details</p>
                    </div>
                    <span className={styles.sectionNumber}>01</span>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="internId">Intern ID</label>
                      <div className={styles.field}>
                        <Fingerprint size={17} />
                        <span className={styles.prefix}>VLRINT</span>
                        <input
                          id="internId"
                          name="internId"
                          value={form.internId}
                          onChange={(event) => {
                            const raw = event.target.value
                              .toUpperCase()
                              .replace(/^VLRINT/, "");
                            const digits = raw.replace(/\D/g, "").slice(0, 9);

                            setOfferRecord(null);
                            setOfferLookup({ status: "idle", message: "" });
                            setForm((previous) => ({
                              ...previous,
                              internId: digits,
                              name: "",
                              internshipStartDate: "",
                              domain: "",
                            }));
                          }}
                          required
                          inputMode="numeric"
                          pattern="[0-9]{9}"
                          minLength={9}
                          maxLength={9}
                          autoComplete="off"
                          placeholder="202601234"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="name">Full name</label>
                      <div
                        className={`${styles.field} ${styles.readonlyField}`}
                      >
                        <UserRound size={17} />
                        <input
                          id="name"
                          name="name"
                          value={form.name}
                          readOnly
                          required
                          placeholder="Verified from your offer letter"
                        />
                        {offerRecord && (
                          <CheckCircle2
                            size={17}
                            className={styles.verifiedIcon}
                          />
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">Google email</label>
                      <div
                        className={`${styles.field} ${styles.readonlyField}`}
                      >
                        <Mail size={17} />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={form.email}
                          readOnly
                          required
                        />
                        <CheckCircle2
                          size={17}
                          className={styles.verifiedIcon}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="whatsappNumber">WhatsApp number</label>
                      <div className={styles.field}>
                        <Phone size={17} />
                        <input
                          id="whatsappNumber"
                          name="whatsappNumber"
                          type="tel"
                          value={form.whatsappNumber}
                          onChange={change}
                          required
                          placeholder="+91..."
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="gender">Gender</label>
                      <div className={styles.field}>
                        <UserRound size={17} />
                        <select
                          id="gender"
                          name="gender"
                          value={form.gender}
                          onChange={change}
                          required
                          aria-describedby="gender-help"
                        >
                          <option value="">Select your gender</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>
                      <small id="gender-help" className={styles.fieldHint}>
                        Required for attendance setup.{" "}
                      </small>
                    </div>
                  </div>

                  <div className={styles.sectionDivider} />

                  {/* INTERNSHIP DETAILS */}
                  <div className={styles.sectionHeading}>
                    <span
                      className={`${styles.sectionIcon} ${styles.purpleIcon}`}
                    >
                      <BriefcaseBusiness size={19} />
                    </span>
                    <div>
                      <h3>Internship details</h3>
                      <p>Your programme and assigned group</p>
                    </div>
                    <span className={styles.sectionNumber}>02</span>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="whatsappGroupName">WhatsApp group</label>
                      <div className={styles.field}>
                        <Users size={17} />
                        <input
                          id="whatsappGroupName"
                          name="whatsappGroupName"
                          value={form.whatsappGroupName}
                          onChange={change}
                          required
                          readOnly={!!inviteGroup}
                          placeholder="Group name"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="whatsappGroupCode">Group code</label>
                      <div className={styles.field}>
                        <KeyRound size={17} />
                        <input
                          id="whatsappGroupCode"
                          name="whatsappGroupCode"
                          value={form.whatsappGroupCode}
                          onChange={change}
                          required
                          readOnly={!!inviteGroup}
                          placeholder="Group code"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="internshipStartDate">Start date</label>
                      <div
                        className={`${styles.field} ${styles.readonlyField}`}
                      >
                        <CalendarDays size={17} />
                        <input
                          id="internshipStartDate"
                          name="internshipStartDate"
                          type="date"
                          value={form.internshipStartDate}
                          readOnly
                          required
                        />
                        {offerRecord && (
                          <CheckCircle2
                            size={17}
                            className={styles.verifiedIcon}
                          />
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="domain">Internship domain</label>
                      <div
                        className={`${styles.field} ${styles.readonlyField}`}
                      >
                        <BriefcaseBusiness size={17} />
                        <input
                          id="domain"
                          name="domain"
                          value={form.domain}
                          readOnly
                          required
                          placeholder="Verified from your offer letter"
                        />
                        {offerRecord && (
                          <CheckCircle2
                            size={17}
                            className={styles.verifiedIcon}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {form.internId.length > 0 && form.internId.length < 9 && (
                    <div className={styles.inlineNotice}>
                      <Fingerprint size={16} />
                      Enter {9 - form.internId.length} more digit(s) to verify
                      your offer letter.
                    </div>
                  )}

                  {offerLookup.status === "waiting" && (
                    <div className={styles.inlineNotice}>
                      <span className={styles.miniSpinner} />
                      Preparing secure offer-letter lookup…
                    </div>
                  )}

                  {offerLookup.status === "loading" && (
                    <div className={styles.inlineNotice}>
                      <span className={styles.miniSpinner} />
                      {offerLookup.message}
                    </div>
                  )}

                  {offerLookup.status === "error" && (
                    <div className={styles.inlineNotice} role="alert">
                      <ShieldCheck size={16} />
                      {offerLookup.message}
                    </div>
                  )}

                  {offerLookup.status === "success" && offerRecord && (
                    <div className={styles.detectedNotice} role="status">
                      <CheckCircle2 size={16} />
                      {offerLookup.message}
                    </div>
                  )}

                  {groupLoading && (
                    <div className={styles.inlineNotice}>
                      <span className={styles.miniSpinner} />
                      Validating invitation...
                    </div>
                  )}

                  {inviteGroup && (
                    <div className={styles.detectedNotice}>
                      <CheckCircle2 size={16} />
                      Your internship group was detected from your invitation.
                    </div>
                  )}

                  <div className={styles.stepInfo}>
                    <ShieldCheck size={18} />
                    Your details will be checked against your official offer
                    letter.
                  </div>

                  <button
                    type="button"
                    className={styles.nextButton}
                    onClick={handleNext}
                    disabled={
                      groupLoading ||
                      offerLookup.status === "loading" ||
                      !offerRecord ||
                      offerLookup.status !== "success"
                    }
                  >
                    <span>Continue to account security</span>
                    <ArrowRight size={19} />
                  </button>
                </div>
              )}

              {/* ===================================
                  STEP 2
              =================================== */}
              {step === 2 && (
                <div className={styles.stepContent}>
                  <div className={styles.securityHero}>
                    <div className={styles.securityVisual}>
                      <div className={styles.securityOrbit} />
                      <ShieldCheck size={43} />
                      <span>
                        <CheckCircle2 size={17} />
                      </span>
                    </div>

                    <h3>Almost there!</h3>
                    <p>
                      Create a strong password to protect your VELoop internship
                      workspace.
                    </p>
                  </div>

                  {/* PASSWORD */}
                  <div className={styles.passwordSection}>
                    <div className={styles.passwordHeading}>
                      <span className={styles.passwordIcon}>
                        <LockKeyhole size={19} />
                      </span>
                      <div>
                        <label htmlFor="password">Create your password</label>
                        <small>Choose a password you'll remember</small>
                      </div>
                    </div>

                    <div className={styles.passwordField}>
                      <LockKeyhole size={18} />
                      <input
                        id="password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={change}
                        minLength={10}
                        required
                        placeholder="Enter a strong password"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className={styles.passwordHint}>
                      <CheckCircle2 size={15} />
                      Minimum 10 characters required
                    </div>
                  </div>

                  {/* SUMMARY */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewHeader}>
                      <Fingerprint size={19} />
                      <strong>Your registration summary</strong>
                      <BadgeCheck size={19} />
                    </div>

                    <div className={styles.reviewRow}>
                      <span>Intern ID</span>
                      <strong>VLRINT{form.internId}</strong>
                    </div>

                    <div className={styles.reviewRow}>
                      <span>Full name</span>
                      <strong>{form.name}</strong>
                    </div>

                    <div className={styles.reviewRow}>
                      <span>Internship domain</span>
                      <strong>{form.domain}</strong>
                    </div>
                  </div>

                  <div className={styles.securityNotice}>
                    <ShieldCheck size={19} />
                    <p>
                      Your registration will be verified against your official
                      offer letter before your account is activated.
                    </p>
                  </div>

                  <div className={styles.stepActions}>
                    <button
                      type="button"
                      className={styles.previousButton}
                      onClick={handleBack}
                    >
                      <ChevronLeft size={18} />
                      Back
                    </button>

                    <button
                      type="submit"
                      className={styles.submit}
                      disabled={busy}
                    >
                      <ShieldCheck size={18} />
                      <span>
                        {busy ? "Verifying..." : "Verify & create account"}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className={styles.formFooter}>
              <ShieldCheck size={15} />
              Secure registration · Protected onboarding
            </div>
          </div>
        </section>
      </main>

      {termsOpen && (
        <div
          className={styles.termsOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setTermsOpen(false);
            }
          }}
        >
          <section
            className={styles.termsModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-terms-title"
          >
            <div className={styles.termsModalHeader}>
              <div>
                <span className={styles.termsEyebrow}>BEFORE YOU JOIN</span>
                <h2 id="registration-terms-title">
                  Programme terms & acknowledgement
                </h2>
                <p>
                  Please review these key points and confirm each one to create
                  your account.
                </p>
              </div>
              <button
                type="button"
                className={styles.termsClose}
                onClick={() => setTermsOpen(false)}
                disabled={busy}
                aria-label="Close terms"
              >
                ×
              </button>
            </div>

            <div className={styles.termsWorkHours}>
              <strong>Working schedule</strong>
              <span>Monday–Friday · 9:30 AM–6:00 PM</span>
              <small>
                Saturday is a holiday. You may work independently and mark
                attendance on Saturday when the scheduled attendance session is
                available.
              </small>
            </div>

            <div className={styles.termsChecklist}>
              {REGISTRATION_ACKNOWLEDGEMENTS.map((item, index) => (
                <div className={styles.termsCheckRow} key={item.id}>
                  <input
                    id={`registration-term-${item.id}`}
                    type="checkbox"
                    checked={termsChecks[item.id] === true}
                    onChange={(event) =>
                      setTermsChecks((current) => ({
                        ...current,
                        [item.id]: event.target.checked,
                      }))
                    }
                  />
                  <div className={styles.termsCheckCopy}>
                    <label
                      className={styles.termsCheckLabel}
                      htmlFor={`registration-term-${item.id}`}
                    >
                      <strong>
                        {index + 1}. {item.title}
                      </strong>
                      <span>{item.description}</span>
                    </label>
                    <span className={styles.termsLearnLinks}>
                      <a
                        href={`/policies#${item.policy}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Learn more: {item.policyLabel}
                      </a>
                      {item.secondPolicy && (
                        <a
                          href={`/policies#${item.secondPolicy}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.secondPolicyLabel}
                        </a>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.termsFooter}>
              <span className={styles.termsProgress}>
                {
                  REGISTRATION_ACKNOWLEDGEMENTS.filter(
                    (item) => termsChecks[item.id],
                  ).length
                }{" "}
                of {REGISTRATION_ACKNOWLEDGEMENTS.length} acknowledged
              </span>
              <div className={styles.termsActions}>
                <button
                  type="button"
                  className={styles.termsCancel}
                  onClick={() => setTermsOpen(false)}
                  disabled={busy}
                >
                  Review later
                </button>
                <button
                  type="button"
                  className={styles.termsConfirm}
                  onClick={createAccount}
                  disabled={!allTermsAccepted || busy}
                >
                  {busy ? "Creating account…" : "I agree & create account"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
