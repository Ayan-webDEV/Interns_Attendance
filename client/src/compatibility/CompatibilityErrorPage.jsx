import { useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Laptop,
  LogOut,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import styles from "./CompatibilityErrorPage.module.css";

export default function CompatibilityErrorPage({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout?.();
    navigate("/login", { replace: true });
  };

  return (
    <main
      className={`${styles.page} min-h-screen w-full flex items-center justify-center px-4 py-7 sm:px-6 sm:py-10 lg:px-8`}
    >
      <div className={styles.glowOne} aria-hidden="true" />
      <div className={styles.glowTwo} aria-hidden="true" />
      <section
        className={`${styles.card} w-full max-w-[760px] overflow-hidden rounded-[28px]`}
        aria-labelledby="compatibility-title"
      >
        <div className={styles.topLine} />

        <div className="relative px-5 pb-6 pt-7 sm:px-9 sm:pb-9 sm:pt-9 md:px-12">
          <div className={styles.brandRow}>
            <img
              src="/LOGO.jpeg"
              alt="VELoop Rewards"
              className={styles.logo}
            />
            <div className={styles.brandCopy}>
              <strong>VELoop Rewards</strong>
              <span>INTERNSHIP WORKSPACE</span>
            </div>
            <span className={styles.secureBadge}>
              <ShieldCheck size={14} />
              Account protected
            </span>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.visualHalo} />
            <div className={styles.visualOrbit} />
            <div className={styles.visualMonitor}>
              <Monitor size={49} strokeWidth={1.55} />
              <span className={styles.monitorStand} />
            </div>
            <div className={styles.visualLaptop}>
              <Laptop size={34} strokeWidth={1.65} />
            </div>
            <span className={styles.alertMark}>
              <AlertTriangle size={19} />
            </span>
          </div>

          <div className="mx-auto max-w-[570px] text-center">
            <span className={styles.eyebrow}>DEVICE COMPATIBILITY NOTICE</span>
            <h1 id="compatibility-title" className={styles.title}>
              A wider screen is <span>required</span>
            </h1>
            <p className={styles.description}>
              Your account can use the internship workspace on a desktop or
              laptop with a screen width of at least{" "}
              <strong>1250 pixels</strong>. Please switch to a wider screen to
              continue using your dashboard.
            </p>
          </div>

          <div className={styles.requirement}>
            <div className={styles.requirementIcon}>
              <Monitor size={21} />
            </div>
            <div className={styles.requirementCopy}>
              <span>MINIMUM VIEWPORT WIDTH</span>
              <strong>1250 px</strong>
            </div>
            <div className={styles.requirementStatus}>
              <span />
              Wider display needed
            </div>
          </div>

          <div className={styles.tip}>
            <span className={styles.tipIcon}>
              <Laptop size={18} />
            </span>
            <p>
              Open this portal on a laptop or desktop. You can also resize your
              browser window; access will return automatically when the viewport
              reaches 1250px or wider.
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className={styles.secondaryButton}
            >
              <LogOut size={16} />
              Sign out
            </button>
            <Link to="/policies" className={styles.primaryButton}>
              <BookOpen size={16} />
              View policy centre
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.footerNote}>
            <ShieldCheck size={14} />
            <span>
              This restriction applies to non-administrator accounts. Policy
              information remains available on this device.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
