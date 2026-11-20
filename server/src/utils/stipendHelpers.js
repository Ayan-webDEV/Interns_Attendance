/**
 * VELoop Rewards — Stipend List Helpers
 *
 * Utility functions exclusively for stipend-list generation.
 * Does not modify or depend on the LOR generator.
 */

const ALLOWED_INTERN_COUNTS = [2, 3];

const ALLOWED_DOMAINS = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "UI/UX Design",
  "Graphic Design",
  "App Development",
  "Data Analytics",
  "Digital Marketing",
  "Content Writing",
];

/**
 * Return today's date in Indian Standard Time.
 *
 * Example: 20 November 2026
 */
export function getStipendReleaseDate() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

/**
 * Normalize an intern object before PDF generation.
 */
export function normalizeStipendIntern(intern = {}) {
  return {
    name: String(intern.name || "").trim(),
    internId: String(intern.internId || intern.internID || "").trim(),
    email: String(intern.email || "").trim(),
    domain: String(intern.domain || "").trim(),
  };
}

/**
 * Validate one intern's information.
 */
export function validateStipendIntern(intern, index = 0) {
  const number = index + 1;
  const normalized = normalizeStipendIntern(intern);

  if (!normalized.name) {
    return `Enter the full name of Intern ${number}.`;
  }

  if (normalized.name.length > 100) {
    return `Intern ${number}'s name cannot exceed 100 characters.`;
  }

  if (!normalized.internId) {
    return `Enter the intern ID of Intern ${number}.`;
  }

  if (normalized.internId.length > 50) {
    return `Intern ${number}'s ID cannot exceed 50 characters.`;
  }

  if (!normalized.domain) {
    return `Select the internship domain of Intern ${number}.`;
  }

  if (!ALLOWED_DOMAINS.includes(normalized.domain)) {
    return `Invalid internship domain for Intern ${number}.`;
  }

  if (
    normalized.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)
  ) {
    return `Enter a valid email address for Intern ${number}.`;
  }

  return "";
}

/**
 * Validate the complete stipend generation request.
 *
 * Expected payload:
 * {
 *   template: "2" | "3",
 *   groupName: "Batch Name",
 *   interns: [...]
 * }
 */
export function validateStipendPayload(payload = {}) {
  const template = String(payload.template || "");
  const groupName = String(payload.groupName || "").trim();
  const interns = payload.interns;

  const internCount = Number(template);

  if (!ALLOWED_INTERN_COUNTS.includes(internCount)) {
    return {
      valid: false,
      message: "Choose a valid stipend template: 2 or 3 interns.",
    };
  }

  if (!groupName) {
    return {
      valid: false,
      message: "Enter the group or batch name.",
    };
  }

  if (groupName.length > 90) {
    return {
      valid: false,
      message: "Group or batch name cannot exceed 90 characters.",
    };
  }

  if (!Array.isArray(interns)) {
    return {
      valid: false,
      message: "Intern information must be provided as a list.",
    };
  }

  if (interns.length !== internCount) {
    return {
      valid: false,
      message: `The selected template requires exactly ${internCount} interns.`,
    };
  }

  const normalizedInterns = interns.map(normalizeStipendIntern);

  for (let index = 0; index < normalizedInterns.length; index += 1) {
    const error = validateStipendIntern(normalizedInterns[index], index);

    if (error) {
      return {
        valid: false,
        message: error,
      };
    }
  }

  // Prevent duplicate intern IDs in the same stipend list.
  const internIds = normalizedInterns.map((intern) =>
    intern.internId.toLowerCase(),
  );

  if (new Set(internIds).size !== internIds.length) {
    return {
      valid: false,
      message: "Duplicate intern IDs are not allowed.",
    };
  }

  return {
    valid: true,
    data: {
      template,
      groupName,
      interns: normalizedInterns,
      releaseDate: getStipendReleaseDate(),
    },
  };
}

/**
 * Create a safe filename for the downloaded PDF.
 */
export function createStipendPdfFilename(groupName, template) {
  const safeGroupName = String(groupName || "VELoop")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  const safeTemplate = ALLOWED_INTERN_COUNTS.includes(Number(template))
    ? `${template}-Interns`
    : "Stipend-List";

  return `Stipend-List-${safeGroupName || "VELoop"}-${safeTemplate}.pdf`;
}
