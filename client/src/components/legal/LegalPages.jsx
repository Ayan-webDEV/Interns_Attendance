import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { CalendarCheck, Wallet } from "lucide-react";
import {
  X,
  ShieldCheck,
  FileText,
  CreditCard,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

const pages = {
  "terms-and-conditions": {
    title: "Terms & Conditions",
    icon: FileText,
    sections: [
      [
        "Using the portal",
        "The VELoop Intern Attendance Portal is provided to registered interns and authorized administrators for internship onboarding, attendance requests, InternCash records, group notices and certification status. Use only your own account and accurate information.",
      ],
      [
        "Attendance and approvals",
        "Submitting an attendance request does not mean it has been approved. Only an approval recorded by an authorized administrator counts toward attendance rewards. The portal’s waiting timer is not proof of physical presence or work completed. Do not submit false information or attempt to bypass session rules.",
      ],
      [
        "InternCash",
        "InternCash is an internal reward ledger for this program. The displayed rupee equivalent is informational only and does not make InternCash cash, a bank balance, a withdrawal facility or a promise of cash redemption. Corrections may be made for duplicate, erroneous or fraudulent entries, with an audit trail.",
      ],
      [
        "Account security",
        "Keep your password and Google account secure. Do not share invitation links outside their intended group. Contact an authorized administrator if you suspect unauthorized access.",
      ],
      [
        "Service availability",
        "The portal may be updated or temporarily unavailable for maintenance. The team will take reasonable steps to preserve records, but users should report discrepancies promptly.",
      ],
      [
        "Changes and contact",
        "Policies may be updated when the program changes. The current version shown in this portal applies. Contact the authorized VELoop internship administrator for questions or corrections.",
      ],
    ],
  },

  "privacy-policy": {
    title: "Privacy Policy",
    icon: ShieldCheck,
    sections: [
      [
        "Information collected",
        "The portal may store your name, intern ID, verified email, WhatsApp number, group details, internship dates and domain, account authentication identifiers, attendance requests and approvals, InternCash ledger entries, promo-code redemption history and notification read status.",
      ],
      [
        "Why information is used",
        "Information is used to verify offer-letter eligibility, manage internship groups, operate attendance windows, approve attendance, maintain reward records, send notices and provide certification status.",
      ],
      [
        "Offer-letter verification",
        "During registration, the attendance backend sends the submitted intern ID, name and verified email to the protected VELoop Offer Letter Generator verification API. The generator compares these values with its existing record and returns the fields required for onboarding. The integration uses a server-to-server secret; that secret is not exposed to your browser.",
      ],
      [
        "Access and security",
        "Access is limited by account role. Passwords are stored as hashes and sensitive integration credentials belong in server environment variables. No online system can guarantee absolute security; report suspected misuse to the administrators.",
      ],
      [
        "Retention and archives",
        "Attendance, approval and wallet records may be retained for program administration and dispute resolution. Completed group exports may be stored in an archive before live group records are deleted. Archived data can contain personal information and must be handled securely.",
      ],
      [
        "Your requests",
        "You may request correction of inaccurate information by contacting an authorized administrator. Requests may need identity verification and may be limited by recordkeeping obligations.",
      ],
    ],
  },

  "refund-policy": {
    title: "Refund Policy",
    icon: RotateCcw,
    sections: [
      [
        "Current portal status",
        "This attendance portal does not currently collect payments or process refunds. Do not treat InternCash or attendance rewards as payment for a service. Any future certification payment must use an official payment process with a receipt.",
      ],
      [
        "If a certification payment is introduced",
        "Before paying, the applicant must be shown the exact fee, service scope, expected processing steps and refund conditions. Duplicate payments and payments for a service that could not be initiated due to a verified system failure should be reviewed for refund.",
      ],
      [
        "Processing already completed",
        "Where a certificate has been correctly prepared and delivered after the applicant approved the fee and submitted the required details, the processing service may be non-refundable except where applicable law requires otherwise. A request will not be rejected solely because of a portal error.",
      ],
      [
        "How to request review",
        "Keep the transaction reference and contact the official administrator with the payment date, amount and issue. The administrator should acknowledge the request and communicate the decision and expected timeline. This policy does not remove rights available under applicable law.",
      ],
    ],
  },

  "certification-processing-charges": {
    title: "Certification Processing Charges",
    icon: CreditCard,
    sections: [
      [
        "What the fee covers",
        "If a certification processing fee is applicable to your program, it covers administrative review of eligibility and records, validation of the intern’s details, certificate preparation and quality checks, certificate ID/record entry where applicable, and delivery or support related to the issued document. It is not a payment to obtain attendance approval or to alter attendance records.",
      ],
      [
        "Fee disclosure",
        "The fee currently communicated for India is ₹89 and for international applicants USD 0.75, where applicable. The amount and currency must be clearly displayed before payment; if the fee changes or taxes/payment-provider charges apply, the final amount must be disclosed before the applicant confirms. Do not pay based only on an informal message.",
      ],
      [
        "No guarantee of eligibility",
        "A fee does not guarantee a certificate. Eligibility requirements, completion status and required records must still be met. If an application is ineligible, the administrator should explain the reason and apply the refund policy stated before payment.",
      ],
      [
        "No hidden charges",
        "Any optional document, letter, delivery or additional service must be itemized separately before payment. If a Letter of Recommendation is offered as an optional paid service, its separately communicated processing fee (previously communicated as ₹29 for India) must be displayed before payment. No extra amount should be requested without clear disclosure and a receipt.",
      ],
      [
        "Portal limitation",
        "The current attendance release does not process certification payments. These terms explain the intended disclosure policy; a fee should be collected only through an official, documented payment process after eligibility and the final amount are shown.",
      ],
    ],
  },
};

const footerLinks = [
  {
    slug: "terms-and-conditions",
    label: "Terms & Conditions",
  },
  {
    slug: "privacy-policy",
    label: "Privacy Policy",
  },
  {
    slug: "refund-policy",
    label: "Refund Policy",
  },
  {
    slug: "certification-processing-charges",
    label: "Certification Charges",
  },
];

function getPolicyUrl(slug) {
  return `/policies/${slug}`;
}

function getLinkState(location) {
  /*
   * When moving between policy pages, preserve the original page
   * from which the user opened the policy section.
   */
  if (location.pathname.startsWith("/policies/")) {
    return {
      from: location.state?.from || "/",
    };
  }

  return {
    from: location.pathname + location.search,
  };
}

export function LegalRoutePage({ onClose }) {
  const { page } = useParams();

  if (!pages[page]) {
    return <Navigate to={getPolicyUrl("terms-and-conditions")} replace />;
  }

  return <LegalPage page={page} onClose={onClose} />;
}

export function LegalPage({ page, onClose }) {
  const location = useLocation();
  const current = pages[page] || pages["terms-and-conditions"];
  const Icon = current.icon;
  const linkState = getLinkState(location);

  return (
    <div className="legal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="legal-modal"
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="legal-header">
          <div className="legal-brand">
            <span className="brand-mark">V</span>

            <div>
              <b>VELoop Policies</b>
              <small>Clear terms. Transparent processing.</small>
            </div>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close policy"
          >
            <X />
          </button>
        </header>

        <nav className="legal-tabs" aria-label="Policy pages">
          {footerLinks.map(({ slug, label }) => (
            <Link
              key={slug}
              to={getPolicyUrl(slug)}
              state={linkState}
              className={` ${page === slug ? "active" : ""}`}
              aria-current={page === slug ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="legal-content">
          <div className="legal-title">
            <Icon size={24} />

            <div>
              <h2>{current.title}</h2>
              <p>
                Last reviewed: 18 October 2026 · Please read before using the
                service.
              </p>
            </div>
          </div>

          {current.sections.map(([title, body]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </section>
          ))}

          <div className="legal-note">
            <ShieldCheck size={18} />

            <span>
              We aim to keep policies clear and avoid undisclosed charges. For
              legal compliance, these policies should be reviewed against the
              final operating process before public launch.
            </span>
          </div>
        </div>

        <footer className="legal-footer">
          <span>VELoop Rewards · Official Intern Portal</span>

          <a href="https://velooprewards.in" target="_blank" rel="noreferrer">
            Official website <ExternalLink size={13} />
          </a>
        </footer>
      </section>
    </div>
  );
}

export function LegalFooter() {
  const location = useLocation();
  const linkState = getLinkState(location);

  return (
    <footer className="relative mt-24 w-full overflow-hidden border-t border-[#D0E1D8] bg-[#E5F0E9] text-[#40584D] shadow-[0_-5px_20px_rgba(37,76,57,0.035)]">
      {/* Thin brand accent */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-[#B8DCC9] via-[#26966B] to-[#B8DCC9]"
      />

      <div className="mx-auto w-full max-w-screen-2xl px-5 sm:px-8 lg:px-10">
        {/* Brand and description */}
        <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-10">
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-xl border border-[#D5E5DC] bg-white p-1.5 shadow-[0_3px_10px_rgba(34,77,56,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(34,77,56,0.14)]">
              <img
                src="/LOGO.jpeg"
                alt="VELoop Rewards logo"
                loading="lazy"
                className="size-11 rounded-lg object-cover"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-[15px] font-extrabold tracking-tight text-[#203C30]">
                VELoop Rewards
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#62796D]">
                Official Intern Attendance Portal
              </p>

              <p className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#398263]">
                <span className="size-1.5 rounded-full bg-[#26966B]" />
                Transparency · Accountability · Trust
              </p>
            </div>
          </div>

          <p className="max-w-md text-[13px] leading-7 text-[#536C60] md:text-right">
            Your dedicated workspace for internship attendance, reward records,
            and essential intern services.
          </p>
        </div>

        {/* Footer navigation */}
        <div className="flex flex-col gap-4 border-t border-[#CADDD1] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] leading-5 text-[#647A6E]">
            <span>© {new Date().getFullYear()} </span>
            <span className="font-bold text-[#365A47]">VELoop Rewards</span>
            <span className="mx-2 text-[#A2B9AA]">·</span>
            <span>All rights reserved.</span>
          </div>

          <nav
            aria-label="Footer policy links"
            className="flex flex-wrap items-center gap-1.5"
          >
            {footerLinks.map(({ slug, label }) => (
              <Link
                key={slug}
                to={getPolicyUrl(slug)}
                state={linkState}
                className="group relative inline-flex min-h-9 items-center rounded-lg px-3 text-[11px] font-semibold text-[#536D60] transition-all duration-200 hover:bg-white hover:text-[#137A53] hover:shadow-[0_2px_8px_rgba(32,83,55,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26966B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E5F0E9] active:scale-[0.98]"
              >
                {label}
                <span className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-[#26966B] transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
