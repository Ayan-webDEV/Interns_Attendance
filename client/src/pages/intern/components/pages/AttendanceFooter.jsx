import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import styling from "./AttendanceFooter.module.css";

const AttendanceFooter = () => {
  return (
    <div
      className={`${styling.approvalBanner} mt-7 group relative isolate overflow-hidden rounded-3xl border p-5 sm:p-6 lg:p-7`}
    >
      {/* Ambient background effects */}
      <div className={styling.approvalGlow} aria-hidden="true" />
      <div className={styling.approvalOrb} aria-hidden="true" />
      <div className={styling.approvalGrid} aria-hidden="true" />

      {/* Top accent */}
      <div className={styling.approvalTopAccent} aria-hidden="true" />
      <div className="relative z-10">
        {/* Card header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className={styling.approvalIconFrame}>
              <span className={styling.approvalIconHalo} aria-hidden="true" />

              <span className={styling.approvalIcon}>
                <LockKeyhole size={23} strokeWidth={1.8} aria-hidden="true" />
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
                Every check-in goes through an admin review to help ensure
                accurate attendance records and fair reward distribution.
              </p>
            </div>
          </div>

          {/* Decorative shield indicator */}
          <div
            className={styling.approvalTrustMark}
            title="Attendance approval process"
            aria-label="Attendance approval process"
          >
            <ShieldCheck size={21} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>

        {/* Approval workflow */}
        <div className={styling.approvalWorkflow}>
          <div className={styling.approvalWorkflowHeader}>
            <span className={styling.approvalWorkflowTitle}>HOW IT WORKS</span>

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

            <div className={styling.approvalConnector} aria-hidden="true">
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

            <div className={styling.approvalConnector} aria-hidden="true">
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
            <strong>Good to know:</strong> Attendance and rewards are confirmed
            only after approval. If rejected, you can resubmit while the
            session’s check-in window remains open.
          </p>
        </div>

        {/* Trust footer */}
        <div className={styling.approvalFooter}>
          <span className={styling.approvalMeta}>
            <LockKeyhole size={13} aria-hidden="true" />
            Secure review process
          </span>

          <span className={styling.approvalFooterDivider} aria-hidden="true" />

          <span className={styling.approvalMeta}>
            <ShieldCheck size={14} aria-hidden="true" />
            Fair attendance tracking
          </span>
        </div>
      </div>
    </div>
  );
};
export default AttendanceFooter;
