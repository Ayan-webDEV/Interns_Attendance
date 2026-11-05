import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  LockKeyhole,
  CalendarDays,
  WalletCards,
  ReceiptText,
  Award,
  BriefcaseBusiness,
  FileCheck2,
  Cookie,
  LifeBuoy,
  ClipboardList,
  BadgeIndianRupee,
  Monitor,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Menu,
  X,
  Scale,
  UserRound,
  Bell,
  FileText,
  ArrowUpRight,
} from "lucide-react";

import styles from "./PublicPolicies.module.css";

/* ============================================================
   POLICY CONTENT
============================================================ */

const policySections = [
  {
    id: "overview",
    number: "01",
    category: "GETTING STARTED",
    title: "Programme overview",
    subtitle: "Understanding the VELoop Rewards internship programme",
    icon: Sparkles,
    blocks: [
      {
        type: "paragraph",
        text: "The VELoop Rewards Internship Programme is designed to provide participants with opportunities to work on assigned projects, develop practical skills, receive guidance and demonstrate their professional capabilities. The attendance dashboard supports programme administration, attendance tracking, project evaluation, InternCash records and certification processing.",
      },
      {
        type: "paragraph",
        text: "Participation in the internship, submission of a project, attendance completion or completion of the internship duration does not automatically guarantee a stipend, Pre-Placement Offer (PPO) or certificate. Each outcome is subject to its own applicable eligibility, verification and evaluation requirements.",
      },
      {
        type: "list",
        title: "Important distinctions",
        items: [
          {
            label: "Internship participation",
            text: "Joining and participating in the programme is separate from applicable certification processing charges.",
          },
          {
            label: "InternCash",
            text: "An internal programme credit system that may be adjusted against applicable certification processing charges under the stated rules.",
          },
          {
            label: "Stipend",
            text: "A performance-based opportunity of up to ₹6,000. It is not a guaranteed payment.",
          },
          {
            label: "PPO",
            text: "A separate performance and business-requirement-based hiring opportunity. It is not guaranteed.",
          },
          {
            label: "Certification",
            text: "Subject to applicable completion, verification and processing requirements, including payment of the applicable processing charge.",
          },
        ],
      },
      {
        type: "callout",
        tone: "green",
        title: "Please read before proceeding",
        text: "Certification processing, stipend evaluation and PPO consideration are separate processes. Paying a certification processing charge does not guarantee a stipend, PPO or any particular evaluation result.",
      },
    ],
  },

  {
    id: "terms",
    number: "02",
    category: "PROGRAMME RULES",
    title: "Terms & conditions",
    subtitle: "Your responsibilities while participating in the programme",
    icon: FileCheck2,
    blocks: [
      {
        type: "paragraph",
        text: "By registering for and using the VELoop Rewards internship portal, you agree to provide accurate information, follow official programme instructions and use the platform responsibly. These terms apply to your use of the portal and its internship-related features.",
      },
      {
        type: "list",
        title: "Participant responsibilities",
        items: [
          {
            label: "Accurate information",
            text: "Use your correct name, verified email address, Intern ID, WhatsApp number, domain and other requested registration details.",
          },
          {
            label: "Account ownership",
            text: "Use your own account. Do not share login credentials, allow another person to mark attendance for you, or impersonate another intern.",
          },
          {
            label: "Genuine submissions",
            text: "Submit original work that accurately represents your own contribution. Disclose material third-party or open-source components where relevant.",
          },
          {
            label: "Attendance",
            text: "Follow the announced attendance sessions, use the permitted device and ensure that each submission is successfully recorded.",
          },
          {
            label: "Professional conduct",
            text: "Follow project instructions, deadlines, feedback, communication requirements and reasonable programme guidelines.",
          },
          {
            label: "Platform integrity",
            text: "Do not manipulate attendance, InternCash, project records, verification information or other platform data.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Authorized programme administrators may review submissions, verify records, correct inaccurate entries, update schedules, manage group membership and take appropriate action where misuse or a breach of programme requirements is identified.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Offer letter and official notices",
        text: "These portal policies supplement the applicable offer letter and official programme communications. Where a participant identifies a discrepancy, they should request written clarification from the programme team rather than assume that an informal message changes an issued offer or policy.",
      },
    ],
  },

  {
    id: "attendance",
    number: "03",
    category: "DAILY PARTICIPATION",
    title: "Attendance policy",
    subtitle: "Registration, daily sessions and device requirements",
    icon: CalendarDays,
    blocks: [
      {
        type: "paragraph",
        text: "The official Intern Attendance Dashboard is used to maintain attendance records, monitor programme participation and support applicable internship evaluation and certification processes.",
      },
      {
        type: "paragraph",
        text: "Regular programme working hours are 9:30 AM to 6:00 PM, Monday through Friday. Saturday is a weekly holiday; interns may still work independently on their own tasks and may mark attendance when the scheduled attendance session is available.",
      },
      {
        type: "steps",
        title: "Dashboard registration",
        items: [
          "Interns who confirm their willingness to continue with the internship will receive the dashboard link and registration instructions.",
          "The dashboard link is intended to be shared before the assessment assignment is distributed.",
          "Interested interns must register using their correct internship information.",
          "Registration details must match the issued offer letter and assigned Intern ID.",
        ],
      },
      {
        type: "callout",
        tone: "green",
        title: "Two attendance sessions every working day",
        text: "Both Session 1 and Session 2 are compulsory on scheduled working days. Missing either session will be reflected in the attendance record. Marking attendance is expected to take approximately two minutes per session.",
      },
      {
        type: "table",
        title: "Daily attendance allocation",
        headers: ["Session", "Requirement", "InternCash"],
        rows: [
          ["Session 1", "First attendance", "1 IC"],
          ["Session 2", "Second attendance", "3 IC"],
        ],
      },
      {
        type: "device",
        title: "Laptop/desktop requirement",
        text: "Access to the attendance dashboard and attendance marking are restricted to laptops and desktop computers under the communicated programme instructions. Mobile phones and mobile browsers are not permitted for attendance marking. Participants should arrange regular access to a supported computer.",
      },
      {
        type: "list",
        title: "Why attendance matters",
        items: [
          {
            label: "Participation records",
            text: "Attendance helps document your regular participation in the internship.",
          },
          {
            label: "Performance evaluation",
            text: "Attendance consistency may be considered as part of the overall stipend evaluation.",
          },
          {
            label: "Certification",
            text: "Verified attendance may be considered during applicable certification eligibility and completion checks.",
          },
          {
            label: "InternCash",
            text: "Verified attendance is used when calculating eligible session credits.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Participants should review their attendance records regularly. If a submission appears missing or incorrect, report the date, session number and relevant details to the official programme administrator promptly so that the record can be reviewed.",
      },
    ],
  },

  {
    id: "interncash",
    number: "04",
    category: "INTERNAL REWARD CREDITS",
    title: "InternCash policy",
    subtitle: "How attendance and project credits are calculated",
    icon: WalletCards,
    blocks: [
      {
        type: "paragraph",
        text: "InternCash (IC) is the internal reward-credit system used by the VELoop Rewards internship workflow. Eligible credits can accumulate through verified attendance and qualifying project submissions.",
      },
      {
        type: "table",
        title: "InternCash allocation",
        headers: ["Activity", "Eligible credit"],
        rows: [
          ["Session 1 attendance", "1 IC"],
          ["Session 2 attendance", "3 IC"],
          ["Eligible project submission", "60–140 IC"],
        ],
      },
      {
        type: "callout",
        tone: "green",
        title: "InternCash conversion rate",
        text: "2 IC = ₹1. Eligible accumulated InternCash may be adjusted against the applicable certification processing charge after the relevant records and credits have been verified.",
      },
      {
        type: "list",
        title: "Project credit evaluation",
        items: [
          {
            label: "Requirement fulfilment",
            text: "The submitted project must address the assigned requirements and specifications.",
          },
          {
            label: "Quality and completeness",
            text: "Functionality, usability, structure, accuracy and overall execution may affect the awarded credits.",
          },
          {
            label: "Authenticity",
            text: "The submission must demonstrate genuine individual contribution.",
          },
          {
            label: "Implementation",
            text: "The degree of completion and quality of implementation may be considered.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Project credits are not automatic merely because a project has been uploaded. The awarded amount within the 60–140 IC range depends on the evaluation of the submitted work and applicable project requirements.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Important distinction",
        text: "InternCash credits used for certification-charge adjustments are separate from the performance-based stipend. InternCash accumulation does not guarantee a stipend, PPO or certificate.",
      },
    ],
  },

  {
    id: "projects",
    number: "05",
    category: "PROJECT WORK",
    title: "Project submission & evaluation",
    subtitle: "Quality, originality and fulfilment of assigned requirements",
    icon: ClipboardList,
    blocks: [
      {
        type: "paragraph",
        text: "Projects are evaluated against the assignment document, instructions, required features, technical or professional standards and the quality of the final deliverable. A submission must represent genuine work and demonstrable individual contribution.",
      },
      {
        type: "list",
        title: "Project evaluation may consider",
        items: [
          {
            label: "Requirement compliance",
            text: "Following the project document, instructions, specifications and functional requirements accurately.",
          },
          {
            label: "Quality of work",
            text: "Code, design or content quality, accuracy, usability, structure and overall execution.",
          },
          {
            label: "Technical and professional standards",
            text: "Appropriate practices, organized work and delivery at the expected professional standard.",
          },
          {
            label: "Originality and authenticity",
            text: "Genuine work and demonstrable individual contribution.",
          },
          {
            label: "Timeliness and consistency",
            text: "Meeting assigned deadlines and maintaining progress throughout the project.",
          },
          {
            label: "Feedback and revisions",
            text: "Taking instructions seriously, implementing feedback and resolving identified issues.",
          },
          {
            label: "Problem-solving",
            text: "Understanding requirements, identifying issues and working towards practical solutions.",
          },
          {
            label: "Final deliverable",
            text: "Completeness, functionality and readiness of the submitted project.",
          },
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Submission is not qualification",
        text: "Submitting a project does not by itself establish that the work has passed evaluation or that the intern qualifies for a stipend, PPO, certificate or a particular InternCash award.",
      },
    ],
  },

  {
    id: "certification",
    number: "06",
    category: "CERTIFICATE PROCESSING",
    title: "Certification processing charges",
    subtitle: "Fee requirements, InternCash adjustments and processing",
    icon: ReceiptText,
    blocks: [
      {
        type: "paragraph",
        text: "Certification processing is a separate administrative process. An applicable certification processing and operational charge is required when the participant proceeds with certification. This charge is separate from internship participation, account registration, dashboard access and daily attendance.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Payment is required for certification processing",
        text: "Where a certification processing charge applies, certification processing will not proceed until the applicable charge has been paid and the payment has been verified. Completing the internship or meeting attendance requirements does not waive this processing requirement.",
      },
      {
        type: "list",
        title: "What the processing charge may cover",
        items: [
          {
            label: "Certificate preparation",
            text: "Administrative preparation and formatting of the certificate.",
          },
          {
            label: "Identity and completion verification",
            text: "Checking participant identity and relevant internship completion records.",
          },
          {
            label: "Records administration",
            text: "Processing and maintaining the relevant certification records.",
          },
          {
            label: "Issuance operations",
            text: "Administrative work associated with certificate issuance and delivery.",
          },
        ],
      },
      {
        type: "callout",
        tone: "green",
        title: "Estimated remaining payable amount",
        text: "After eligible InternCash adjustments, the estimated remaining payable amount will generally be approximately ₹170–₹230. This is an estimate, not a fixed amount or guarantee. The final amount depends on the applicable charge and verified eligible credits.",
      },
      {
        type: "steps",
        title: "How the adjustment works",
        items: [
          "The applicable certification processing charge is communicated through the official programme instructions.",
          "Eligible InternCash is verified from attendance and project evaluation records.",
          "The verified eligible balance is converted using the rate of 2 IC = ₹1.",
          "The eligible adjustment is applied against the applicable processing charge.",
          "The remaining payable amount is communicated before payment.",
          "Certification processing proceeds after the required payment and verification are complete.",
        ],
      },
      {
        type: "paragraph",
        text: "The amount may vary based on missed or incomplete attendance sessions, attendance consistency, project submission quality, project evaluation and total eligible InternCash accumulated.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Payment channel",
        text: "Certification payments are not currently processed inside the attendance portal. Follow only the official payment instructions communicated by the programme team. Keep the transaction reference and payment confirmation for your records.",
      },
      {
        type: "paragraph",
        text: "Payment of a certification processing charge does not guarantee or influence stipend eligibility or PPO selection. These decisions are made independently under their respective evaluation processes.",
      },
    ],
  },

  {
    id: "refund",
    number: "07",
    category: "PAYMENTS",
    title: "Refund & payment dispute policy",
    subtitle: "How certification-charge payments are treated",
    icon: BadgeIndianRupee,
    blocks: [
      {
        type: "paragraph",
        text: "Any certification processing charge must be communicated with its purpose and applicable amount before payment. Participants should follow the official payment instructions and retain the transaction reference, receipt or payment confirmation.",
      },
      {
        type: "list",
        title: "Refund principles",
        items: [
          {
            label: "Processing initiated",
            text: "Once certificate-processing work has been initiated, the processing charge is generally non-refundable because the administrative service has commenced.",
          },
          {
            label: "Certificate issued",
            text: "Once a digital certificate has been issued, the processing charge is generally non-refundable.",
          },
          {
            label: "Incorrect or duplicate payment",
            text: "A payment collected in error or a duplicate transaction should be reported to the programme team for verification and appropriate correction.",
          },
          {
            label: "Legal requirements",
            text: "Nothing in this policy is intended to exclude a refund, remedy or right that cannot lawfully be excluded under applicable law.",
          },
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Please verify before paying",
        text: "Check the amount, purpose, payment destination and instructions before completing a transaction. Do not rely on unofficial payment requests or personal messages that cannot be verified through the official programme channel.",
      },
      {
        type: "paragraph",
        text: "For a payment dispute, contact the official programme administrator with your Intern ID, payment date, transaction reference and a brief description of the issue. Do not post bank credentials, passwords, OTPs or complete payment-account details in a public group.",
      },
    ],
  },

  {
    id: "stipend",
    number: "08",
    category: "PERFORMANCE-BASED OPPORTUNITY",
    title: "Stipend policy",
    subtitle: "Eligibility, evaluation criteria and no-guarantee conditions",
    icon: Award,
    blocks: [
      {
        type: "callout",
        tone: "green",
        title: "Maximum performance-based stipend: ₹6,000",
        text: "The internship stipend is strictly performance-based, up to ₹6,000. It is not guaranteed for every intern. Participation in the programme, attendance completion, project submission or completion of the internship duration does not automatically create stipend eligibility.",
      },
      {
        type: "paragraph",
        text: "Stipend eligibility is determined through a final performance evaluation based on the intern's overall contribution and whether the assigned project requirements have been successfully fulfilled.",
      },
      {
        type: "ordered",
        title: "Evaluation criteria",
        items: [
          "Requirement Compliance: Following the project document, instructions, specifications and functional requirements accurately.",
          "Quality of Work: Code, design or content quality, accuracy, usability, structure and overall execution.",
          "Technical/Professional Standards: Following appropriate practices, maintaining organized work and delivering at the expected professional standard.",
          "Originality & Authenticity: Submission of genuine work and demonstrable individual contribution.",
          "Timeliness: Meeting assigned deadlines and maintaining consistent progress.",
          "Consistency: Regularly working on the assigned project rather than completing work only immediately before the deadline.",
          "Responsiveness: Taking required instructions, feedback, corrections and guidance seriously.",
          "Revision & Improvement: Properly implementing feedback and resolving identified issues.",
          "Problem-Solving: Ability to understand requirements, identify issues and independently work towards solutions.",
          "Professional Conduct: Communication, discipline, responsibility and adherence to internship guidelines.",
          "Final Deliverable: Overall completeness and readiness of the submitted project.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "No automatic stipend guarantee",
        text: "There is no guaranteed minimum number of stipend recipients. It is possible that no intern qualifies, only one intern qualifies, two or three qualify, several qualify, or another number qualify. The number of recipients and the amount awarded depend entirely on the final evaluation.",
      },
      {
        type: "paragraph",
        text: "An intern who does not meet the required performance standards will not qualify for the performance-based stipend. Project submission is not the same as qualification, and stipend eligibility cannot be claimed solely on the basis of participation, attendance, project submission or internship completion.",
      },
      {
        type: "paragraph",
        text: "Once the final stipend evaluation has been completed and its result has been officially communicated, the evaluation will be treated as final under the programme's stated process.",
      },
    ],
  },

  {
    id: "ppo",
    number: "09",
    category: "HIRING OPPORTUNITY",
    title: "PPO policy",
    subtitle: "Pre-Placement Offer consideration and business requirements",
    icon: BriefcaseBusiness,
    blocks: [
      {
        type: "callout",
        tone: "green",
        title: "A PPO is not guaranteed",
        text: "Successful completion of the internship does not automatically guarantee a Pre-Placement Offer. A PPO may be considered for selected interns based on individual performance and the company's hiring and business requirements at the relevant time.",
      },
      {
        type: "list",
        title: "PPO consideration may include",
        items: [
          {
            label: "Overall performance",
            text: "The intern's complete performance during the internship.",
          },
          {
            label: "Quality and consistency",
            text: "The quality of work and consistency of contributions.",
          },
          {
            label: "Professional capabilities",
            text: "Technical and professional skills relevant to the work.",
          },
          {
            label: "Ownership and responsibility",
            text: "Ability to take responsibility for assigned work and deliverables.",
          },
          {
            label: "Problem-solving",
            text: "Ability to identify challenges and work towards effective solutions.",
          },
          {
            label: "Professional conduct",
            text: "Communication, reliability, discipline and teamwork.",
          },
          {
            label: "Company contribution",
            text: "Contribution to company projects and operational requirements.",
          },
          {
            label: "Hiring requirements",
            text: "Available positions, workforce requirements, business needs and the company's current hiring plans.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "A PPO may be offered only to selected candidates. Even a high-performing intern should not consider a PPO automatic unless an official offer has been issued by the company.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Certification payments do not affect PPO decisions",
        text: "Payment of a certification processing fee does not improve, guarantee or influence PPO selection. PPO consideration is separate from certification processing and is based on performance and business requirements.",
      },
    ],
  },

  {
    id: "privacy",
    number: "10",
    category: "DATA & PRIVACY",
    title: "Privacy policy",
    subtitle: "What information is collected and how it is used",
    icon: ShieldCheck,
    blocks: [
      {
        type: "paragraph",
        text: "VELoop Rewards uses participant information to operate the internship portal, verify internship eligibility, manage programme participation and maintain accurate administrative records. Information should be collected and used only for relevant programme and platform purposes.",
      },
      {
        type: "list",
        title: "Information that may be collected",
        items: [
          {
            label: "Identity and contact details",
            text: "Name, verified email address, Intern ID and WhatsApp contact number.",
          },
          {
            label: "Internship details",
            text: "Domain, group name, group code, internship dates and offer-letter verification details.",
          },
          {
            label: "Attendance information",
            text: "Session dates, session status, submission timestamps, corrections and attendance history.",
          },
          {
            label: "Project information",
            text: "Assigned tasks, submitted project links or files, evaluation details, feedback and review records.",
          },
          {
            label: "InternCash information",
            text: "Eligible credits, adjustments, transaction entries and related records.",
          },
          {
            label: "Certification and payment information",
            text: "Certification application status and, where necessary, payment references, receipts, UPI details or payment confirmation supplied for reconciliation.",
          },
        ],
      },
      {
        type: "list",
        title: "Why this information is used",
        items: [
          {
            label: "Account and eligibility verification",
            text: "To verify accounts and match intern registration information against applicable offer-letter records.",
          },
          {
            label: "Programme administration",
            text: "To manage groups, internship dates, assignments and participant communication.",
          },
          {
            label: "Attendance and rewards",
            text: "To record sessions, calculate eligible InternCash and maintain transaction history.",
          },
          {
            label: "Evaluation",
            text: "To support project, stipend, participation and applicable certification evaluation.",
          },
          {
            label: "Certification and payments",
            text: "To verify completion requirements, calculate adjustments and reconcile processing charges.",
          },
          {
            label: "Security and dispute handling",
            text: "To review account misuse, correct records and respond to programme-related disputes.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Access to participant records is intended to be role-based and limited to authorized personnel who require the information for programme administration. Information may also be processed by service providers used to operate necessary platform functions, such as authentication, offer verification, hosting and communications.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Your information and correction requests",
        text: "If your name, email, Intern ID, group, attendance or other programme information is inaccurate, contact your official programme administrator with the relevant details. Requests to correct or delete information will be reviewed, subject to verification and any record-retention obligations that apply.",
      },
      {
        type: "paragraph",
        text: "Do not share your password, OTP, authentication token, private payment details or other sensitive account information with another participant or in a public WhatsApp group. The programme team should not need your password or OTP to review an attendance or certification query.",
      },
    ],
  },

  {
    id: "security",
    number: "11",
    category: "ACCOUNT PROTECTION",
    title: "Account & session security",
    subtitle: "Keeping your account and personal information safe",
    icon: LockKeyhole,
    blocks: [
      {
        type: "list",
        title: "Security responsibilities",
        items: [
          {
            label: "Protect your credentials",
            text: "Keep your password and one-time verification codes private.",
          },
          {
            label: "Use your own device",
            text: "Avoid signing in on untrusted or shared computers whenever possible.",
          },
          {
            label: "Sign out",
            text: "Always sign out after using the portal on a shared device.",
          },
          {
            label: "Keep devices updated",
            text: "Use an updated browser and operating system.",
          },
          {
            label: "Report suspicious activity",
            text: "Notify the programme administrator if you notice an unfamiliar login, incorrect account activity or unexpected record changes.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "The portal uses role-based access controls for programme information. No online system can be guaranteed to be completely risk-free, so participants should also follow good device, browser and account-security practices.",
      },
    ],
  },

  {
    id: "cookies",
    number: "12",
    category: "BROWSER STORAGE",
    title: "Cookies & local storage policy",
    subtitle: "How browser storage supports your signed-in session",
    icon: Cookie,
    blocks: [
      {
        type: "paragraph",
        text: "The current portal uses browser local storage to retain the signed-in authentication token so that your account session can be maintained between page visits. This is browser storage and should not be described as a conventional cookie where no cookie is actually being set.",
      },
      {
        type: "list",
        title: "What you should know",
        items: [
          {
            label: "Session continuity",
            text: "Local storage helps the portal recognize your signed-in session when you return.",
          },
          {
            label: "Shared devices",
            text: "Sign out after using a shared or public computer.",
          },
          {
            label: "Browser settings",
            text: "Clearing browser storage may sign you out and require you to authenticate again.",
          },
          {
            label: "Third-party technologies",
            text: "Any additional analytics, advertising or third-party tracking technologies should be disclosed separately if introduced.",
          },
        ],
      },
    ],
  },

  {
    id: "support",
    number: "13",
    category: "HELP & COMMUNICATION",
    title: "Support, complaints & policy updates",
    subtitle: "How to raise questions and request clarification",
    icon: LifeBuoy,
    blocks: [
      {
        type: "paragraph",
        text: "For account verification, attendance approval, group assignment, InternCash adjustments, project evaluation, certification processing or stipend-related questions, participants should contact their internship group administrator through the official WhatsApp group.",
      },
      {
        type: "list",
        title: "When contacting support, include",
        items: [
          {
            label: "Your identification",
            text: "Your name and Intern ID.",
          },
          {
            label: "Relevant section",
            text: "The page, date, attendance session or policy involved.",
          },
          {
            label: "Issue description",
            text: "A clear explanation of the issue and the action you need reviewed.",
          },
          {
            label: "Supporting evidence",
            text: "Relevant screenshots, transaction references or project details, after removing unnecessary sensitive information.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "VELoop Rewards may update portal instructions, programme schedules and these policies when operational requirements change. Material changes should be communicated through an appropriate official programme channel. Participants should review updated terms and notices when they are published.",
      },
      {
        type: "callout",
        tone: "green",
        title: "Need help?",
        text: "Contact your internship group administrator through the official VELoop Rewards WhatsApp group. Do not post passwords, OTPs or complete bank-account details while requesting assistance.",
      },
    ],
  },
];

/* ============================================================
   POLICY CONTENT BLOCKS
============================================================ */

function PolicyBlock({ block }) {
  if (block.type === "paragraph") {
    return <p className={styles.paragraph}>{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <div className={styles.contentBlock}>
        {block.title && <h4>{block.title}</h4>}

        <ul className={styles.detailList}>
          {block.items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              <span className={styles.listCheck}>
                <CheckCircle2 size={16} />
              </span>

              <div>
                <strong>{item.label}</strong>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === "ordered" || block.type === "steps") {
    return (
      <div className={styles.contentBlock}>
        {block.title && <h4>{block.title}</h4>}

        <ol className={styles.orderedList}>
          {block.items.map((item, index) => (
            <li key={index}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className={styles.contentBlock}>
        {block.title && <h4>{block.title}</h4>}

        <div className={styles.tableWrap}>
          <table className={styles.policyTable}>
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {block.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div
        className={`${styles.callout} ${
          block.tone === "warning"
            ? styles.warning
            : block.tone === "info"
              ? styles.info
              : styles.green
        }`}
      >
        <span className={styles.calloutIcon}>
          {block.tone === "warning" ? (
            <AlertTriangle size={19} />
          ) : block.tone === "info" ? (
            <Info size={19} />
          ) : (
            <ShieldCheck size={19} />
          )}
        </span>

        <div>
          <strong>{block.title}</strong>
          <p>{block.text}</p>
        </div>
      </div>
    );
  }

  if (block.type === "device") {
    return (
      <div className={styles.deviceCard}>
        <span className={styles.deviceIcon}>
          <Monitor size={23} />
        </span>

        <div>
          <h4>{block.title}</h4>
          <p>{block.text}</p>
        </div>
      </div>
    );
  }

  return null;
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function PublicPolicies() {
  const brand = import.meta.env.VITE_BRAND_NAME || "VELoop Rewards";
  const location = useLocation();

  const [expandedSections, setExpandedSections] = useState([
    "overview",
    "attendance",
    "certification",
    "stipend",
  ]);

  const [activeSection, setActiveSection] = useState(() => {
    const id = location.hash.replace("#", "");

    return policySections.some((section) => section.id === id)
      ? id
      : "overview";
  });

  // Mobile policy navigation drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allExpanded = expandedSections.length === policySections.length;

  const toggleSection = (id) => {
    setExpandedSections((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleAll = () => {
    setExpandedSections(
      allExpanded ? [] : policySections.map((section) => section.id),
    );
  };

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (!id) return;

    const exists = policySections.some((section) => section.id === id);
    if (!exists) return;

    setActiveSection(id);

    setExpandedSections((current) =>
      current.includes(id) ? current : [...current, id],
    );

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  /* Close mobile navigation on Escape or desktop resize */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1300) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* Automatically highlight the currently visible policy */
  useEffect(() => {
    const scrollContainer = document.querySelector(`.${styles.mainScroll}`);

    if (!scrollContainer) return;

    const sections = policySections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        root: scrollContainer,
        rootMargin: "-18% 0px -68% 0px",
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <header className={styles.header}>
        <Link className={styles.backLink} to="/login">
          <span className={styles.backIcon}>
            <ArrowLeft size={16} />
          </span>
          {/* <span>Back to sign in</span> */}
          <Link
            className={`${styles.brand} ms-2`}
            to="/login"
            aria-label={brand}
          >
            <span className={styles.brandLogo}>
              <img src="/LOGO.jpeg" alt="" />
            </span>

            <span className={styles.brandText}>
              <strong>{brand}</strong>
              <small>PEOPLE & PROGRAMMES</small>
            </span>
          </Link>
        </Link>

        <div className={styles.headerTrust}>
          <ShieldCheck size={15} />
          <span>Official policy centre</span>
        </div>

        {/* MOBILE POLICY MENU BUTTON */}
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label={mobileMenuOpen ? "Close policy menu" : "Open policy menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="policy-navigation"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* ======================================================
          FIXED SIDEBAR + INDEPENDENT MAIN SCROLL
      ====================================================== */}

      <div className={styles.appBody}>
        {/* MOBILE MENU BACKDROP */}
        {mobileMenuOpen && (
          <button
            type="button"
            className={styles.mobileMenuBackdrop}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close policy navigation"
          />
        )}

        {/* FIXED LEFT SIDEBAR */}
        <aside
          id="policy-navigation"
          className={`${styles.navigation} ${
            mobileMenuOpen ? styles.navigationOpen : ""
          }`}
        >
          <div className={styles.navigationTop}>
            <span className={styles.sidebarEyebrow}>POLICY GUIDE</span>
            <strong>Quick navigation</strong>
            <p>Choose a topic to explore the programme rules.</p>
          </div>

          <nav className={styles.navigationLinks} aria-label="Policy contents">
            {policySections.map((section) => {
              const Icon = section.icon;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  title={section.title}
                  aria-label={section.title}
                  className={
                    activeSection === section.id ? styles.navigationActive : ""
                  }
                  aria-current={
                    activeSection === section.id ? "location" : undefined
                  }
                  onClick={() => {
                    setMobileMenuOpen(false);

                    setActiveSection(section.id);

                    setExpandedSections((current) =>
                      current.includes(section.id)
                        ? current
                        : [...current, section.id],
                    );
                  }}
                >
                  <span className={styles.navigationIcon}>
                    <Icon size={17} />
                  </span>

                  <span className={styles.navigationLabel}>
                    {section.title}
                  </span>

                  <ArrowUpRight size={13} className={styles.navigationArrow} />
                </a>
              );
            })}
          </nav>

          <div className={styles.navigationHelp}>
            <span className={styles.helpIcon}>
              <LifeBuoy size={18} />
            </span>

            <strong>Need clarification?</strong>

            <p>
              Contact your official internship group administrator for
              programme-related questions.
            </p>

            <span className={styles.helpStatus}>
              <i />
              Programme support
            </span>
          </div>
        </aside>

        {/* INDEPENDENTLY SCROLLABLE MAIN PAGE */}
        <div className={styles.mainScroll}>
          <div className={styles.mainInner}>
            {/* HERO */}
            <section className={styles.hero}>
              <div className={styles.heroDecoration} />
              <div className={styles.heroDecorationTwo} />

              <div className={styles.heroContent}>
                <div className={styles.heroEyebrow}>
                  <ShieldCheck size={16} />
                  TRANSPARENCY · ACCOUNTABILITY · TRUST
                </div>

                <h1>
                  Clear policies.
                  <br />
                  <span>Confident participation.</span>
                </h1>

                <p>
                  Understand how the VELoop Rewards internship programme works,
                  how your information is handled, how InternCash is calculated,
                  and what to expect from certification, stipend and PPO
                  decisions.
                </p>

                <div className={styles.heroActions}>
                  <a href="#policy-sections" className={styles.primaryAction}>
                    Explore all policies
                    <ArrowUpRight size={16} />
                  </a>

                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={toggleAll}
                  >
                    {allExpanded
                      ? "Collapse all sections"
                      : "Expand all sections"}

                    {allExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.heroShield}>
                <span className={styles.shieldCircle}>
                  <ShieldCheck size={47} strokeWidth={1.6} />
                </span>
                <span className={styles.shieldCaption}>Your trust matters</span>
              </div>

              <div className={styles.heroBottom}>
                <span>
                  <i className={styles.onlineDot} />
                  Official programme information
                </span>

                <span>Last updated: 2 November 2026</span>
              </div>
            </section>

            {/* KEY FACT CARDS */}
            <section
              className={styles.highlights}
              aria-label="Important programme facts"
            >
              <article className={styles.highlightCard}>
                <span className={styles.highlightIcon}>
                  <Award size={20} />
                </span>

                <div>
                  <strong>Up to ₹6,000</strong>
                  <span>Performance-based stipend</span>
                </div>
              </article>

              <article className={styles.highlightCard}>
                <span className={styles.highlightIcon}>
                  <CalendarDays size={20} />
                </span>

                <div>
                  <strong>2 sessions</strong>
                  <span>Per working day</span>
                </div>
              </article>

              <article className={styles.highlightCard}>
                <span className={styles.highlightIcon}>
                  <WalletCards size={20} />
                </span>

                <div>
                  <strong>2 IC = ₹1</strong>
                  <span>InternCash conversion</span>
                </div>
              </article>

              <article
                className={`${styles.highlightCard} ${styles.feeHighlight}`}
              >
                <span className={styles.highlightIcon}>
                  <ReceiptText size={20} />
                </span>

                <div>
                  <strong>Fee required</strong>
                  <span>For applicable certification processing</span>
                </div>
              </article>
            </section>

            {/* IMPORTANT NOTICE */}
            <section className={styles.importantNotice}>
              <div className={styles.noticeIcon}>
                <AlertTriangle size={21} />
              </div>

              <div>
                <h2>Important: Understand these separate processes</h2>
                <p>
                  Internship participation, attendance, InternCash adjustments,
                  certification processing, stipend evaluation and PPO selection
                  are separate matters. A certification payment does not
                  guarantee a stipend or PPO, and certification will not proceed
                  until the applicable processing charge is paid and verified.
                </p>
              </div>
            </section>

            {/* POLICY CONTENT */}
            <section className={styles.policyContent} id="policy-sections">
              <div className={styles.contentHeading}>
                <div>
                  <span>THE DETAILS</span>
                  <h2>Programme policies & guidelines</h2>
                  <p>
                    Read the sections relevant to your participation and
                    responsibilities.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.expandAllButton}
                  onClick={toggleAll}
                >
                  {allExpanded ? "Collapse all" : "Expand all"}

                  {allExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              <div className={styles.sectionList}>
                {policySections.map((section) => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections.includes(section.id);

                  return (
                    <section
                      key={section.id}
                      id={section.id}
                      className={`${styles.policyCard} ${
                        isExpanded ? styles.policyCardOpen : ""
                      }`}
                    >
                      <button
                        type="button"
                        className={styles.policyCardHeader}
                        onClick={() => toggleSection(section.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`${section.id}-content`}
                      >
                        <span className={styles.sectionNumber}>
                          {section.number}
                        </span>

                        <span className={styles.sectionIcon}>
                          <Icon size={20} />
                        </span>

                        <span className={styles.sectionHeading}>
                          <small>{section.category}</small>
                          <strong>{section.title}</strong>
                          <span>{section.subtitle}</span>
                        </span>

                        <span className={styles.toggleIcon}>
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          className={styles.policyCardBody}
                          id={`${section.id}-content`}
                        >
                          {section.blocks.map((block, index) => (
                            <PolicyBlock
                              block={block}
                              key={`${section.id}-${index}`}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>

            {/* FINAL NOTICE */}
            <section className={styles.finalNotice}>
              <div className={styles.finalIcon}>
                <CheckCircle2 size={23} />
              </div>

              <div>
                <h2>Our commitment to clarity</h2>
                <p>
                  We aim to communicate programme expectations, applicable
                  charges and evaluation requirements clearly. Participants
                  should review their offer letter, official instructions and
                  these policies before taking action.
                </p>
              </div>
            </section>
          </div>
          {/* FOOTER */}
          <footer className={styles.footer}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>
                <img src="/LOGO.jpeg" alt="VELoop LOGO" />
              </span>

              <span>
                <strong>{brand}</strong>
                <small>Built around learning and opportunity</small>
              </span>
            </div>

            <div className={styles.footerLinks}>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#refund">Refunds</a>
              <Link to="/login">Sign in</Link>
            </div>

            <p>
              © {new Date().getFullYear()} {brand}. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
