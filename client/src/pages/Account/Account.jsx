import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Copy,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  CircleUserRound,
  Wallet,
} from "lucide-react";

import { api } from "../../api/client";
import { useToast } from "../../components/Toast/Toast";
import Loader from "../../components/Loader/Loader";
import styles from "./Account.module.css";

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function SectionLabel({ children }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

function InfoRow({ label, value, icon: Icon, onCopy }) {
  return (
    <div className={styles.infoRow}>
      {Icon && (
        <div className={styles.rowIcon}>
          <Icon size={16} />
        </div>
      )}

      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        <strong className={styles.rowValue}>{value || "Not available"}</strong>
      </div>

      {onCopy && value && (
        <button
          type="button"
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
          onClick={() => onCopy(value, label)}
          className={styles.iconButton}
        >
          <Copy size={15} />
        </button>
      )}
    </div>
  );
}

function QuickLink({ icon: Icon, title, description, onClick }) {
  return (
    <button type="button" onClick={onClick} className={styles.quickLink}>
      <span className={styles.quickIcon}>
        <Icon size={18} />
      </span>

      <span className={styles.quickText}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <ChevronRight size={17} className={styles.quickArrow} />
    </button>
  );
}

export default function Account({ user }) {
  const navigate = useNavigate();
  const notify = useToast();

  const [me, setMe] = useState(user || {});
  const [group, setGroup] = useState(null);
  const [wallet, setWallet] = useState({
    balance: user?.internCashBalance ?? 0,
    conversion: 0.5,
  });
  const [approvedDays, setApprovedDays] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState(user?.gender || "");

  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureError, setProfilePictureError] = useState("");

  // const identityKey = useMemo(
  //   () => user?.id || user?.email || "intern",
  //   [user?.id, user?.email],
  // );

  // const profilePictureKey = `vlr_profile_picture_${identityKey}`;
  const identityKey = useMemo(
    () =>
      me?.id ||
      me?._id ||
      me?.email ||
      user?.id ||
      user?._id ||
      user?.email ||
      "intern",
    [me?.id, me?._id, me?.email, user?.id, user?._id, user?.email],
  );

  const profilePictureKey = `vlr_profile_picture_${identityKey}`;

  const loadAccount = useCallback(async () => {
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        api("/auth/me"),
        api("/groups"),
        api("/wallet/mine"),
        api("/attendance/mine"),
      ]);

      const [profileResult, groupResult, walletResult, attendanceResult] =
        results;

      if (profileResult.status === "fulfilled") {
        const account = profileResult.value.user || user || {};

        setMe(account);
        setGender(account.gender || "");
      } else {
        notify(
          profileResult.reason?.message ||
            "Unable to load your account details.",
          "error",
        );
      }

      if (groupResult.status === "fulfilled") {
        const groups = groupResult.value.groups || [];

        const assignedGroup =
          groups.find(
            (item) =>
              String(item._id) ===
              String(
                profileResult.status === "fulfilled"
                  ? profileResult.value.user?.group
                  : user?.group,
              ),
          ) ||
          groups[0] ||
          null;

        setGroup(assignedGroup);
      } else {
        setGroup(null);
      }

      if (walletResult.status === "fulfilled") {
        setWallet({
          balance: walletResult.value.balance ?? user?.internCashBalance ?? 0,
          conversion: walletResult.value.conversion ?? 0.5,
        });
      }

      if (attendanceResult.status === "fulfilled") {
        setApprovedDays(attendanceResult.value.summary?.approvedDays ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [notify, user]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);

      try {
        const results = await Promise.allSettled([
          api("/auth/me"),
          api("/groups"),
          api("/wallet/mine"),
          api("/attendance/mine"),
        ]);

        if (!active) return;

        const [profileResult, groupResult, walletResult, attendanceResult] =
          results;

        if (profileResult.status === "fulfilled") {
          const account = profileResult.value.user || user || {};

          setMe(account);
          setGender(account.gender || "");
        } else {
          notify(
            profileResult.reason?.message ||
              "Unable to load your account details.",
            "error",
          );
        }

        if (groupResult.status === "fulfilled") {
          const groups = groupResult.value.groups || [];
          const currentUser =
            profileResult.status === "fulfilled"
              ? profileResult.value.user
              : user;

          const assignedGroup =
            groups.find(
              (item) => String(item._id) === String(currentUser?.group),
            ) ||
            groups[0] ||
            null;

          setGroup(assignedGroup);
        }

        if (walletResult.status === "fulfilled") {
          setWallet({
            balance: walletResult.value.balance ?? user?.internCashBalance ?? 0,
            conversion: walletResult.value.conversion ?? 0.5,
          });
        }

        if (attendanceResult.status === "fulfilled") {
          setApprovedDays(attendanceResult.value.summary?.approvedDays ?? 0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [user?.id, user?.email, notify]);

  useEffect(() => {
    try {
      setProfilePicture(window.localStorage.getItem(profilePictureKey) || "");
    } catch {
      setProfilePicture("");
    }
  }, [profilePictureKey]);

  const copyToClipboard = async (value, label = "Value") => {
    try {
      await navigator.clipboard.writeText(String(value));
      notify(`${label} copied to clipboard.`);
    } catch {
      notify(
        `Unable to copy automatically. Please copy ${label.toLowerCase()} manually.`,
        "error",
      );
    }
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setProfilePictureError("");

    if (!file.type.startsWith("image/")) {
      setProfilePictureError("Choose a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfilePictureError("The image must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imageData = String(reader.result || "");

        window.localStorage.setItem(profilePictureKey, imageData);
        window.dispatchEvent(new Event("vlr-profile-picture-updated"));
        setProfilePicture(imageData);

        notify("Profile picture updated.");
      } catch {
        setProfilePictureError(
          "Unable to save the image in this browser. Try a smaller image.",
        );
      }
    };

    reader.onerror = () => {
      setProfilePictureError("Unable to read this image.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemoveProfilePicture = () => {
    try {
      window.localStorage.removeItem(profilePictureKey);
      window.dispatchEvent(new Event("vlr-profile-picture-updated"));
      setProfilePicture("");
      setProfilePictureError("");
      notify("Profile picture removed.");
    } catch {
      notify("Unable to remove the profile picture.", "error");
    }
  };

  const handleGenderSave = async (event) => {
    event.preventDefault();

    if (!gender) {
      notify("Please select your gender first.", "error");
      return;
    }

    setBusy(true);

    try {
      const response = await api("/auth/profile", {
        method: "PATCH",
        body: { gender },
      });

      setMe((current) => ({
        ...current,
        ...(response.user || {}),
        gender,
      }));

      notify("Gender preference saved.");
    } catch (error) {
      notify(error.message || "Unable to update your profile.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();

    if (password.length < 10) {
      notify("Your password must contain at least 10 characters.", "error");
      return;
    }

    setBusy(true);

    try {
      const response = await api("/auth/set-password", {
        method: "POST",
        body: { password },
      });

      setPassword("");
      notify(response.message || "Password updated successfully.");
    } catch (error) {
      notify(error.message || "Unable to update your password.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Loader label="Loading your account…" full={false} />;
  }

  const groupStatus =
    group?.status === "completed"
      ? "Completed"
      : group?.status === "active"
        ? "In progress"
        : group?.status === "registration"
          ? "Not started"
          : "Not assigned";

  const duration = group?.durationDays || 28;

  const initials =
    me?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "I";

  return (
    <div className={styles.page}>
      {/* PAGE HEADER */}

      <header className={styles.pageHeader}>
        <div>
          <SectionLabel>Your personal space</SectionLabel>

          <h1>My account</h1>

          <p>
            Manage your verified identity, internship details, and account
            security.
          </p>
        </div>

        <div className={styles.headerIcon}>
          <CircleUserRound size={25} />
        </div>
      </header>

      {/* PROFILE HERO */}

      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroTop}>
          <span className={styles.profilePill}>
            <ShieldCheck size={14} />
            INTERN PROFILE
          </span>

          <span className={styles.verifiedPill}>
            <CheckCircle2 size={13} />
            VERIFIED ACCOUNT
          </span>
        </div>

        <div className={styles.heroIdentity}>
          <div className={styles.avatarWrap}>
            <label
              htmlFor="intern-profile-picture"
              className={styles.avatarButton}
              title="Change profile picture"
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={`${me?.name || "Intern"} profile`}
                  className={styles.avatarImage}
                />
              ) : (
                <span>{initials}</span>
              )}

              <span className={styles.photoOverlay}>
                <Camera size={19} />
                <small>Change photo</small>
              </span>
            </label>

            <input
              id="intern-profile-picture"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              capture="user"
              className={styles.hiddenInput}
              onChange={handleProfilePictureChange}
            />

            {profilePicture && (
              <button
                type="button"
                className={styles.removePhoto}
                title="Remove photo"
                aria-label="Remove profile picture"
                onClick={handleRemoveProfilePicture}
              >
                <Trash2 size={13} />
              </button>
            )}

            <small className={styles.photoHint}>
              {profilePicture ? "Photo saved locally" : "Add a profile photo"}
            </small>

            {profilePictureError && (
              <small className={styles.photoError} role="alert">
                {profilePictureError}
              </small>
            )}
          </div>

          <div className={styles.identityDetails}>
            <p className={styles.welcome}>WELCOME TO YOUR WORKSPACE</p>

            <h2>{me?.name || "Intern"}</h2>

            <div className={styles.emailLine}>
              <Mail size={14} />
              <span>{me?.email || "Email unavailable"}</span>
            </div>

            <div className={styles.identityChips}>
              <span className={styles.identityChip}>
                <Fingerprint size={14} />
                <span>ID: {me?.internId || "Not assigned"}</span>
              </span>

              <span className={styles.identityChip}>
                <BriefcaseBusiness size={14} />
                <span>{group?.name || "Group not assigned"}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.copyIdButton}
            disabled={!me?.internId}
            onClick={() => copyToClipboard(me.internId, "Intern ID")}
          >
            <Copy size={15} />
            Copy intern ID
          </button>
        </div>

        {/* SUMMARY METRICS */}

        <div className={styles.metrics}>
          <article className={styles.metric}>
            <div className={styles.metricLabel}>
              <CalendarDays size={15} />
              <span>INTERNSHIP DURATION</span>
            </div>

            <strong>{duration} days</strong>
            <small>Assigned group duration</small>
          </article>

          <article className={styles.metric}>
            <div className={styles.metricLabel}>
              <CalendarCheck size={15} />
              <span>APPROVED ATTENDANCE</span>
            </div>

            <strong>{approvedDays} days</strong>
            <small>Approved attendance dates</small>
          </article>

          <article className={styles.metric}>
            <div className={styles.metricLabel}>
              <Wallet size={15} />
              <span>INTERNCASH BALANCE</span>
            </div>

            <strong>{wallet?.balance ?? 0} IC</strong>

            <button
              type="button"
              className={styles.metricLink}
              onClick={() => navigate("/wallet")}
            >
              Open wallet <ChevronRight size={13} />
            </button>
          </article>
        </div>
      </section>

      {/* ACCOUNT INFORMATION */}

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <SectionLabel>Account information</SectionLabel>

          <h2>Your verified details</h2>

          <p>
            Review your registered identity and assigned internship information.
          </p>
        </div>

        <div className={styles.detailsGrid}>
          {/* PERSONAL INFORMATION */}

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <UserRound size={19} />
              </div>

              <div>
                <h3>Personal information</h3>
                <p>Your registered identity</p>
              </div>

              <span className={styles.smallVerified}>
                <CheckCircle2 size={12} />
                Verified
              </span>
            </div>

            <div className={styles.infoRows}>
              <InfoRow label="Full name" value={me?.name} icon={UserRound} />

              <InfoRow label="Verified email" value={me?.email} icon={Mail} />

              <InfoRow
                label="Intern ID"
                value={me?.internId}
                icon={Fingerprint}
                onCopy={copyToClipboard}
              />

              <InfoRow
                label="WhatsApp number"
                value={me?.whatsappNumber}
                icon={UserRound}
              />
            </div>

            <div className={styles.workspacePanel}>
              <div className={styles.panelHeading}>
                <Activity size={16} />
                <h4>Your workspace</h4>
              </div>

              <div className={styles.quickLinks}>
                <QuickLink
                  icon={Wallet}
                  title="InternCash wallet"
                  description="Balance and transaction history"
                  onClick={() => navigate("/wallet")}
                />

                <QuickLink
                  icon={Bell}
                  title="Announcements"
                  description="Updates from your administrators"
                  onClick={() => navigate("/notifications")}
                />
              </div>

              <div className={styles.secureNote}>
                <ShieldCheck size={16} />

                <div>
                  <strong>Keep your account secure</strong>
                  <p>
                    Never share your password, OTP, or private account
                    credentials.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* INTERNSHIP DETAILS */}

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <BriefcaseBusiness size={19} />
              </div>

              <div>
                <h3>Internship details</h3>
                <p>Your assigned programme information</p>
              </div>
            </div>

            <div className={styles.internshipRows}>
              {[
                ["Assigned group", group?.name || "Not assigned"],
                ["Internship domain", me?.domain || "Not available"],
                [
                  "Start date",
                  formatDate(group?.actualStartDate || me?.internshipStartDate),
                ],
                ["Duration", `${duration} days`],
                ["Group status", groupStatus],
                [
                  "Offer letter",
                  me?.offerSentStatus ||
                    (me?.offerSent ? "Sent" : "Verified during registration"),
                ],
                ["Offer sent date", formatDate(me?.offerSentAt)],
                ["Offer issue date", formatDate(me?.offerIssueDate)],
              ].map(([label, value]) => (
                <div className={styles.detailRow} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                onClick={() => navigate("/attendance")}
                className={styles.secondaryButton}
              >
                <span>
                  <CalendarCheck size={15} />
                  View attendance dashboard
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* REQUIRED GENDER PROFILE FIELD */}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <UserRound size={19} />
          </div>

          <div>
            <h3>Profile preferences</h3>
            <p>Complete your account details before attendance</p>
          </div>

          {!me?.gender && (
            <span className={styles.actionRequired}>Action required</span>
          )}
        </div>

        <form onSubmit={handleGenderSave} className={styles.preferenceForm}>
          <div className={styles.fieldGroup}>
            <label htmlFor="intern-gender">Gender</label>

            <select
              id="intern-gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              required
              className={styles.input}
            >
              <option value="">Select your gender</option>

              {GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <small>Select and save your gender before making attendance.</small>
          </div>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!gender || busy || gender === me?.gender}
          >
            <ShieldCheck size={15} />
            Save preference
          </button>
        </form>
      </section>

      {/* ACCOUNT SECURITY */}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <LockKeyhole size={20} />
          </div>

          <div>
            <h3>Account security</h3>
            <p>Set or update your password for secure access</p>
          </div>

          <span className={styles.smallVerified}>
            <ShieldCheck size={13} />
            Secure settings
          </span>
        </div>

        <div className={styles.passwordGrid}>
          <div className={styles.securityIntro}>
            <div className={styles.securityIcon}>
              <KeyRound size={21} />
            </div>

            <h4>Protect your account</h4>

            <p>
              Use a unique password with at least 10 characters. Never share
              your password or verification codes.
            </p>

            <div className={styles.secureNote}>
              <ShieldCheck size={15} />
              <p>
                Password updates use your existing authenticated API. Sign in
                with Google before setting or recovering your password.
              </p>
            </div>
          </div>

          <form className={styles.passwordForm} onSubmit={handlePasswordSave}>
            <div className={styles.fieldGroup}>
              <label htmlFor="intern-new-password">New password</label>

              <input
                id="intern-new-password"
                className={styles.input}
                type="password"
                minLength={10}
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a strong new password"
              />

              <small>
                Minimum 10 characters. Choose a password you do not use on other
                websites.
              </small>
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={password.length < 10 || busy}
            >
              <ShieldCheck size={15} />
              {busy ? "Saving…" : "Save password"}
              <ChevronRight size={15} />
            </button>
          </form>
        </div>
      </section>

      {/* SUPPORT SHORTCUT */}

      <section className={styles.support}>
        <div className={styles.supportIcon}>
          <Sparkles size={20} />
        </div>

        <div className={styles.supportBody}>
          <h3>Need to update your internship details?</h3>

          <p>
            If your name, email, intern ID, offer details, or assigned group
            appears incorrect, contact your authorized internship administrator.
          </p>
        </div>

        <button
          type="button"
          className={styles.supportButton}
          onClick={() => navigate("/notifications")}
        >
          View notices
          <ChevronRight size={15} />
        </button>
      </section>
    </div>
  );
}
