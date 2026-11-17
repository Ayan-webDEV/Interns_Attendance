/**
 * Masks an email address for the LOR PDF.
 *
 * Example:
 * ayan@gmail.com -> ay********@gmail.com
 */
export function maskLOREmail(email) {
  const value = String(email || "").trim();

  const [username, domain] = value.split("@");

  if (!username || !domain || value.split("@").length !== 2) {
    return "—";
  }

  const visible = username.length <= 2 ? username[0] : username.slice(0, 2);

  const hiddenLength = Math.max(3, username.length - visible.length);

  return `${visible}${"*".repeat(hiddenLength)}@${domain}`;
}

/**
 * Validates an email address.
 */
export function isValidLOREmail(email) {
  const value = String(email || "").trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Normalizes intern details before PDF generation.
 */
export function normalizeLORIntern(intern, index) {
  const normalized = {
    name: String(intern?.name || "").trim(),
    internId: String(intern?.internId || "").trim(),
    email: String(intern?.email || "")
      .trim()
      .toLowerCase(),
    domain: String(intern?.domain || "").trim(),
  };

  const labels = {
    name: "Full name",
    internId: "Intern ID",
    email: "Email address",
    domain: "Internship domain",
  };

  for (const [key, label] of Object.entries(labels)) {
    if (!normalized[key]) {
      throw new Error(`${label} is required for Intern ${index + 1}.`);
    }
  }

  if (!isValidLOREmail(normalized.email)) {
    throw new Error(
      `Please enter a valid email address for Intern ${index + 1}.`,
    );
  }

  return normalized;
}

/**
 * Creates a safe filename from the group/batch name.
 */
export function createLORFilename(groupName) {
  const safeName = String(groupName || "VELoop-LOR-List")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  return `LOR-List-${safeName || "VELoop"}.pdf`;
}

/**
 * Validates the selected LOR template and intern count.
 */
export function validateLORPayload(payload, templateConfig) {
  if (!templateConfig) {
    throw new Error("Please select a valid LOR template.");
  }

  const groupName = String(payload?.groupName || "").trim();

  if (!groupName) {
    throw new Error("Group / batch name is required.");
  }

  if (!Array.isArray(payload?.interns)) {
    throw new Error("Intern details must be provided as a list.");
  }

  if (payload.interns.length !== templateConfig.internCount) {
    throw new Error(
      `This template requires exactly ${templateConfig.internCount} interns.`,
    );
  }

  const interns = payload.interns.map((intern, index) =>
    normalizeLORIntern(intern, index),
  );

  return {
    groupName,
    interns,
  };
}
