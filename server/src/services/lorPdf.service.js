import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import { getLORTemplateConfig } from "../config/lorTemplates.js";
import { getLORDate } from "../utils/lorDate.js";
import { maskLOREmail, validateLORPayload } from "../utils/lorHelpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serverRoot = path.resolve(__dirname, "../..");
const templateRoot = path.join(serverRoot, "templates");
const fontRoot = path.join(serverRoot, "fonts");

const COLORS = {
  ink: rgb(16 / 255, 24 / 255, 39 / 255),
  body: rgb(32 / 255, 43 / 255, 60 / 255),
};

function supportsText(face, text) {
  return Array.from(text).every((character) => {
    const glyph = face.glyphForCodePoint(character.codePointAt(0));
    return glyph && glyph.id !== 0;
  });
}

function chooseFont(text, preferredFont, fallbackFont, preferredFace) {
  return supportsText(preferredFace, text) ? preferredFont : fallbackFont;
}

function fitSize(font, text, startSize, maxWidth, minSize = 7) {
  let size = startSize;

  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.25;
  }

  return size;
}

function coverField(
  page,
  { x, top, width, height, text, font, size, color, baselineOffset = 8 },
) {
  const pageHeight = page.getHeight();

  page.drawRectangle({
    x,
    y: pageHeight - top - height,
    width,
    height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  const fitted = fitSize(font, text, size, width - 2, 7);

  page.drawText(text, {
    x: x + 1,
    y: pageHeight - top - height + baselineOffset,
    size: fitted,
    font,
    color,
  });
}

function replaceField(
  page,
  { x, top, width, height, text, font, size, color, minSize = 7 },
) {
  const pageHeight = page.getHeight();

  page.drawRectangle({
    x,
    y: pageHeight - top - height,
    width,
    height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  const fitted = fitSize(font, text, size, width - 2, minSize);

  const baseline =
    pageHeight - top - height + Math.max(1.2, (height - fitted) / 2) + 1.5;

  page.drawText(text, {
    x,
    y: baseline,
    size: fitted,
    font,
    color,
    maxWidth: width,
  });
}

async function readFont(filename) {
  const fontPath = path.join(fontRoot, filename);
  return fs.readFile(fontPath);
}

export async function generateLorPdf(payload) {
  const config = getLORTemplateConfig(payload?.template);

  if (!config) {
    throw new Error("Choose one of the available templates: 3, 6, or 8.");
  }

  const { groupName, interns: normalizedInterns } = validateLORPayload(
    payload,
    config,
  );

  const interns = normalizedInterns.map((intern) => ({
    ...intern,
    maskedEmail: maskLOREmail(intern.email),
  }));

  const displayDate = getLORDate();
  const generatedAt = new Date();

  // Load the original PDF template.
  const sourceBytes = await fs.readFile(path.join(templateRoot, config.file));

  const pdfDoc = await PDFDocument.load(sourceBytes);

  pdfDoc.registerFontkit(fontkit);

  // Load original fonts.
  const regularBytes = await readFont("Poppins-Regular-Subset.ttf");
  const boldBytes = await readFont("Poppins-Bold-Subset.ttf");

  const fallbackRegularBytes = await readFont("Fallback-Regular.ttf");
  const fallbackBoldBytes = await readFont("Fallback-Bold.ttf");

  const regularFont = await pdfDoc.embedFont(regularBytes, {
    subset: true,
  });

  const boldFont = await pdfDoc.embedFont(boldBytes, {
    subset: true,
  });

  const fallbackRegularFont = await pdfDoc.embedFont(fallbackRegularBytes, {
    subset: true,
  });

  const fallbackBoldFont = await pdfDoc.embedFont(fallbackBoldBytes, {
    subset: true,
  });

  const regularFace = fontkit.create(regularBytes);
  const boldFace = fontkit.create(boldBytes);

  // --------------------------------------------------
  // PAGE 1: COVER
  // --------------------------------------------------

  const cover = pdfDoc.getPage(0);

  coverField(cover, {
    x: 306,
    top: 551,
    width: 175,
    height: 18,
    text: groupName,
    font: chooseFont(groupName, regularFont, fallbackRegularFont, regularFace),
    size: 9.2,
    color: COLORS.body,
    baselineOffset: 8,
  });

  coverField(cover, {
    x: 59,
    top: 608,
    width: 115,
    height: 22,
    text: displayDate,
    font: chooseFont(
      displayDate,
      regularFont,
      fallbackRegularFont,
      regularFace,
    ),
    size: 9.2,
    color: COLORS.body,
    baselineOffset: 8.5,
  });

  // --------------------------------------------------
  // INTERN SELECTION REGISTER PAGES
  // --------------------------------------------------

  for (const registerPage of config.registerPages) {
    const page = pdfDoc.getPage(registerPage.pageIndex);

    for (let localIndex = 0; localIndex < registerPage.count; localIndex += 1) {
      const internIndex = registerPage.firstIntern + localIndex;

      const intern = interns[internIndex];
      const row = config.rows[internIndex];

      if (!intern || !row) {
        throw new Error(
          `Missing PDF row configuration for Intern ${internIndex + 1}.`,
        );
      }

      const nameText = `${String(internIndex + 1).padStart(2, "0")}   ${intern.name}`;

      // Intern name.
      replaceField(page, {
        x: 56.5,
        top: row.nameY - 1.2,
        width: 246,
        height: 18,
        text: nameText,
        font: chooseFont(nameText, boldFont, fallbackBoldFont, boldFace),
        size: 11,
        color: COLORS.ink,
        minSize: 8,
      });

      // Internship domain.
      replaceField(page, {
        x: 56.5,
        top: row.domainY - 1.2,
        width: 245,
        height: 14,
        text: intern.domain,
        font: chooseFont(
          intern.domain,
          regularFont,
          fallbackRegularFont,
          regularFace,
        ),
        size: 8.5,
        color: COLORS.body,
        minSize: 7,
      });

      // Intern ID.
      replaceField(page, {
        x: 56.5,
        top: row.idY - 1.2,
        width: 245,
        height: 14,
        text: intern.internId,
        font: chooseFont(intern.internId, boldFont, fallbackBoldFont, boldFace),
        size: 8,
        color: rgb(0, 0, 0),
        minSize: 7,
      });

      // Masked email.
      replaceField(page, {
        x: 324.5,
        top: row.emailY - 1.2,
        width: 210,
        height: 14,
        text: intern.maskedEmail,
        font: chooseFont(
          intern.maskedEmail,
          regularFont,
          fallbackRegularFont,
          regularFace,
        ),
        size: 8.5,
        color: COLORS.body,
        minSize: 7,
      });
    }
  }

  // --------------------------------------------------
  // DECLARATION PAGE DATE
  // --------------------------------------------------

  const declaration = pdfDoc.getPage(config.declarationPageIndex);

  replaceField(declaration, {
    x: 304.5,
    top: 581.4,
    width: 125,
    height: 17,
    text: displayDate,
    font: chooseFont(
      displayDate,
      regularFont,
      fallbackRegularFont,
      regularFace,
    ),
    size: 10,
    color: COLORS.body,
    minSize: 8,
  });

  // Generate final PDF bytes.
  const pdfBytes = await pdfDoc.save();

  return {
    pdfBytes,
    displayDate,
    generatedAt,
    groupName,

    interns: interns.map(({ name, internId, maskedEmail, domain }) => ({
      name,
      internId,
      maskedEmail,
      domain,
    })),
  };
}
