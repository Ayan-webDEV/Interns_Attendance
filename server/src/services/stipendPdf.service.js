import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import { getStipendTemplateConfig } from "../config/stipendTemplates.js";
import { validateStipendPayload } from "../utils/stipendHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.resolve(__dirname, "../../templates");
const FONT_DIR = path.resolve(__dirname, "../../fonts");

const FONT_FILES = {
  regular: "Poppins-Regular-Subset.ttf",
  bold: "Poppins-Bold-Subset.ttf",
  fallbackRegular: "Fallback-Regular.ttf",
  fallbackBold: "Fallback-Bold.ttf",
};

async function readFont(filename) {
  return fs.readFile(path.join(FONT_DIR, filename));
}

function canEncodeText(font, text) {
  try {
    font.encodeText(String(text ?? ""));
    return true;
  } catch {
    return false;
  }
}

function selectFont(text, fonts, bold = false) {
  // Prefer the full Unicode fallback font.
  // The Poppins subset fonts do not contain every required character.
  const fallback = bold ? fonts.fallbackBold : fonts.fallbackRegular;

  const primary = bold ? fonts.bold : fonts.regular;

  if (canEncodeText(fallback, text)) {
    return fallback;
  }

  if (canEncodeText(primary, text)) {
    return primary;
  }

  throw new Error(`No embedded font supports the following text: ${text}`);
}

function getFittedFontSize(font, text, maxWidth, preferredSize) {
  let fontSize = preferredSize;

  while (
    fontSize > 5 &&
    font.widthOfTextAtSize(String(text), fontSize) > maxWidth
  ) {
    fontSize -= 0.25;
  }

  return fontSize;
}

/**
 * Draws text directly onto the existing PDF.
 *
 * IMPORTANT:
 * This function does not draw any background rectangle,
 * white mask, or replacement shape.
 *
 * `top` and `height` are measured from the top of the PDF page.
 */

function drawField(page, field, value, fonts, options = {}) {
  if (!field || value === undefined || value === null) {
    return;
  }

  const text = String(value).trim();

  if (!text) {
    return;
  }

  const font = selectFont(text, fonts, options.bold || false);

  const preferredSize = field.fontSize || options.fontSize || 9;

  const fontSize = getFittedFontSize(font, text, field.width, preferredSize);

  const textWidth = font.widthOfTextAtSize(text, fontSize);

  let x = field.x;

  if (options.align === "center") {
    x += Math.max(0, (field.width - textWidth) / 2);
  } else if (options.align === "right") {
    x += Math.max(0, field.width - textWidth);
  }

  const fieldHeight = field.height || 17;
  const textHeight = font.heightAtSize(fontSize);

  // Vertically center the text within the configured field.
  const verticalOffset = Math.max(0, (fieldHeight - textHeight) / 2);

  const baselineY = page.getHeight() - field.top - verticalOffset - textHeight;

  // Draw directly onto the PDF.
  // No white rectangle, background mask, or replacement shape.
  page.drawText(text, {
    x,
    y: baselineY,
    size: fontSize,
    font,
    color: options.color || rgb(0.12, 0.16, 0.25),
    maxWidth: field.width,
    lineHeight: fontSize,
  });
}

async function loadFonts(pdfDoc) {
  const [regularBytes, boldBytes, fallbackRegularBytes, fallbackBoldBytes] =
    await Promise.all([
      readFont(FONT_FILES.regular),
      readFont(FONT_FILES.bold),
      readFont(FONT_FILES.fallbackRegular),
      readFont(FONT_FILES.fallbackBold),
    ]);

  pdfDoc.registerFontkit(fontkit);

  const [regular, bold, fallbackRegular, fallbackBold] = await Promise.all([
    pdfDoc.embedFont(regularBytes, { subset: true }),
    pdfDoc.embedFont(boldBytes, { subset: true }),
    pdfDoc.embedFont(fallbackRegularBytes, { subset: true }),
    pdfDoc.embedFont(fallbackBoldBytes, { subset: true }),
  ]);

  return {
    regular,
    bold,
    fallbackRegular,
    fallbackBold,
  };
}

function drawInternRows(page, rows, interns, fonts) {
  interns.forEach((intern, index) => {
    const row = rows[index];

    if (!row) {
      throw new Error(`Missing PDF row configuration for Intern ${index + 1}.`);
    }

    // The original PDF already contains the serial numbers.
    // Do not draw another serial number.

    drawField(page, row.name, intern.name, fonts);

    drawField(page, row.internId, intern.internId, fonts);

    drawField(page, row.domain, intern.domain, fonts);

    // APPROVED is already printed in the original template.
  });
}

export async function generateStipendPdf(payload = {}) {
  const validation = validateStipendPayload(payload);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const data = validation.data;

  const config = getStipendTemplateConfig(data.template);

  const templatePath = path.join(TEMPLATE_DIR, config.fileName);

  const templateBytes = await fs.readFile(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);

  const pages = pdfDoc.getPages();

  if (pages.length !== 4) {
    throw new Error(
      `Invalid stipend template. Expected 4 pages but found ${pages.length}.`,
    );
  }

  const fonts = await loadFonts(pdfDoc);

  const { page1, page2, page3, page4 } = config.pages;

  // ---------------------------------------------------------
  // PAGE 1: Official notice
  // ---------------------------------------------------------

  drawField(pages[page1.index], page1.fields.batchName, data.groupName, fonts);

  drawField(
    pages[page1.index],
    page1.fields.releaseDate,
    data.releaseDate,
    fonts,
  );

  // ---------------------------------------------------------
  // PAGE 2: Final approved stipend list
  // ---------------------------------------------------------

  drawInternRows(pages[page2.index], page2.rows, data.interns, fonts);

  drawField(pages[page2.index], page2.fields.batchName, data.groupName, fonts);

  drawField(
    pages[page2.index],
    page2.fields.releaseDate,
    data.releaseDate,
    fonts,
  );

  // ---------------------------------------------------------
  // PAGE 3: Evaluation criteria
  // ---------------------------------------------------------

  drawField(pages[page3.index], page3.fields.batchName, data.groupName, fonts);

  drawField(
    pages[page3.index],
    page3.fields.releaseDate,
    data.releaseDate,
    fonts,
  );

  // ---------------------------------------------------------
  // PAGE 4: Stipend release information
  // ---------------------------------------------------------

  drawField(pages[page4.index], page4.fields.batchName, data.groupName, fonts);

  const pdfBytes = await pdfDoc.save();

  return {
    pdfBytes,
    groupName: data.groupName,
    releaseDate: data.releaseDate,
    template: data.template,
    internCount: data.interns.length,
    generatedAt: new Date().toISOString(),
    interns: data.interns,
  };
}
