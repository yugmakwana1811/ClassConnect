import "server-only";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_SCHOOL } from "@/lib/demo-catalog";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN_X = 52;
const TOP = 58;
const BOTTOM = 54;
const CONTENT_WIDTH = A4.width - MARGIN_X * 2;
const NAVY = rgb(0.08, 0.13, 0.22);
const TEAL = rgb(0.02, 0.45, 0.43);
const CORAL = rgb(0.91, 0.33, 0.25);
const GOLD = rgb(0.88, 0.62, 0.16);
const MUTED = rgb(0.33, 0.38, 0.45);
const LINE = rgb(0.83, 0.85, 0.88);
const PALE = rgb(0.96, 0.97, 0.98);

export type PdfQuestion = {
  prompt: string;
  marks: number;
  options?: string[];
  answer?: string;
  explanation?: string;
  answerLines?: number;
};

export type PdfSection = {
  heading: string;
  body?: string[];
  questions?: PdfQuestion[];
};

export type AcademicPdfDocument = {
  title: string;
  subtitle?: string;
  documentType: string;
  school?: string;
  className: string;
  subject: string;
  topic?: string;
  date?: string;
  dueDate?: string;
  durationMinutes?: number;
  maxMarks?: number;
  estimatedMinutes?: number;
  objective?: string;
  instructions?: string[];
  sections: PdfSection[];
  rubric?: string[];
  teacherNote?: string;
  variant: "student" | "teacher";
};

type FontPair = { regular: PDFFont; bold: PDFFont };
type DrawState = {
  pdf: PDFDocument;
  fonts: FontPair;
  page: PDFPage;
  y: number;
  title: string;
  variant: AcademicPdfDocument["variant"];
};

let fontBytesPromise: Promise<{ regular: Uint8Array; bold: Uint8Array }> | null = null;

function loadFontBytes() {
  fontBytesPromise ??= Promise.all([
    readFile(
      path.join(
        process.cwd(),
        "node_modules/@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf",
      ),
    ),
    readFile(
      path.join(
        process.cwd(),
        "node_modules/@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf",
      ),
    ),
  ]).then(([regular, bold]) => ({
    regular: new Uint8Array(regular),
    bold: new Uint8Array(bold),
  }));
  return fontBytesPromise;
}

export function normalizePdfText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/₹/g, "Rs.")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = normalizePdfText(text).split(/\r?\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const words = paragraph.trim().split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
        continue;
      }
      let fragment = "";
      for (const character of word) {
        const next = fragment + character;
        if (font.widthOfTextAtSize(next, size) > maxWidth && fragment) {
          lines.push(fragment);
          fragment = character;
        } else fragment = next;
      }
      line = fragment;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function addPage(state: DrawState) {
  const page = state.pdf.addPage([A4.width, A4.height]);
  page.drawText("EDUGRADE", {
    x: MARGIN_X,
    y: A4.height - 35,
    size: 9,
    font: state.fonts.bold,
    color: TEAL,
  });
  page.drawText(state.variant === "teacher" ? "TEACHER VERSION" : "STUDENT VERSION", {
    x: A4.width - MARGIN_X - 92,
    y: A4.height - 35,
    size: 7.5,
    font: state.fonts.bold,
    color: state.variant === "teacher" ? CORAL : MUTED,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: A4.height - 43 },
    end: { x: A4.width - MARGIN_X, y: A4.height - 43 },
    thickness: 0.7,
    color: LINE,
  });
  state.page = page;
  state.y = A4.height - TOP;
}

function ensureSpace(state: DrawState, height: number) {
  if (state.y - height < BOTTOM) addPage(state);
}

function drawWrapped(
  state: DrawState,
  text: string,
  options: {
    x?: number;
    width?: number;
    size?: number;
    lineHeight?: number;
    font?: PDFFont;
    color?: ReturnType<typeof rgb>;
    gapAfter?: number;
  } = {},
) {
  const x = options.x ?? MARGIN_X;
  const width = options.width ?? CONTENT_WIDTH;
  const size = options.size ?? 10;
  const lineHeight = options.lineHeight ?? size * 1.42;
  const font = options.font ?? state.fonts.regular;
  const lines = wrapText(text, font, size, width);
  for (const line of lines) {
    ensureSpace(state, lineHeight);
    if (line)
      state.page.drawText(line, {
        x,
        y: state.y - size,
        size,
        font,
        color: options.color ?? NAVY,
      });
    state.y -= lineHeight;
  }
  state.y -= options.gapAfter ?? 3;
  return lines.length * lineHeight;
}

function drawRule(state: DrawState, color = LINE) {
  ensureSpace(state, 14);
  state.y -= 5;
  state.page.drawLine({
    start: { x: MARGIN_X, y: state.y },
    end: { x: A4.width - MARGIN_X, y: state.y },
    thickness: 0.8,
    color,
  });
  state.y -= 9;
}

function drawSectionHeading(state: DrawState, heading: string) {
  ensureSpace(state, 34);
  state.page.drawRectangle({
    x: MARGIN_X,
    y: state.y - 24,
    width: CONTENT_WIDTH,
    height: 24,
    color: PALE,
    borderColor: LINE,
    borderWidth: 0.6,
  });
  state.page.drawText(normalizePdfText(heading).toUpperCase(), {
    x: MARGIN_X + 10,
    y: state.y - 16,
    size: 9,
    font: state.fonts.bold,
    color: TEAL,
  });
  state.y -= 34;
}

function drawQuestion(state: DrawState, question: PdfQuestion, number: number) {
  const promptLines = wrapText(
    `${number}. ${question.prompt}`,
    state.fonts.regular,
    10.2,
    CONTENT_WIDTH - 42,
  );
  const estimated = promptLines.length * 15 + (question.options?.length ?? 0) * 16 + 30;
  ensureSpace(state, Math.min(estimated, 210));
  const startingY = state.y;
  drawWrapped(state, `${number}. ${question.prompt}`, {
    width: CONTENT_WIDTH - 42,
    size: 10.2,
    lineHeight: 15,
    gapAfter: 4,
  });
  state.page.drawText(`[${question.marks}]`, {
    x: A4.width - MARGIN_X - 28,
    y: startingY - 10,
    size: 9,
    font: state.fonts.bold,
    color: MUTED,
  });
  if (question.options)
    question.options.forEach((option, optionIndex) =>
      drawWrapped(state, `${String.fromCharCode(65 + optionIndex)}. ${option}`, {
        x: MARGIN_X + 18,
        width: CONTENT_WIDTH - 28,
        size: 9.5,
        lineHeight: 14,
        gapAfter: 0,
      }),
    );
  if (state.variant === "teacher" && question.answer) {
    ensureSpace(state, 28);
    state.page.drawRectangle({
      x: MARGIN_X + 12,
      y: state.y - 4,
      width: CONTENT_WIDTH - 24,
      height: 2,
      color: GOLD,
    });
    state.y -= 11;
    drawWrapped(state, `Answer / marking guidance: ${question.answer}`, {
      x: MARGIN_X + 12,
      width: CONTENT_WIDTH - 24,
      size: 8.7,
      lineHeight: 13,
      color: MUTED,
      gapAfter: 4,
    });
    if (question.explanation)
      drawWrapped(state, `Explanation: ${question.explanation}`, {
        x: MARGIN_X + 12,
        width: CONTENT_WIDTH - 24,
        size: 8.5,
        lineHeight: 12.5,
        color: MUTED,
      });
  } else if (!question.options) {
    const lines = Math.max(1, Math.min(6, question.answerLines ?? Math.ceil(question.marks / 2)));
    for (let line = 0; line < lines; line += 1) {
      ensureSpace(state, 16);
      state.y -= 12;
      state.page.drawLine({
        start: { x: MARGIN_X + 12, y: state.y },
        end: { x: A4.width - MARGIN_X - 12, y: state.y },
        thickness: 0.45,
        color: LINE,
      });
    }
    state.y -= 4;
  }
  state.y -= 8;
}

function drawFooter(page: PDFPage, fonts: FontPair, title: string, pageNumber: number, pageCount: number) {
  page.drawLine({
    start: { x: MARGIN_X, y: 38 },
    end: { x: A4.width - MARGIN_X, y: 38 },
    thickness: 0.55,
    color: LINE,
  });
  const shortTitle = normalizePdfText(title).slice(0, 62);
  page.drawText(shortTitle, {
    x: MARGIN_X,
    y: 23,
    size: 7.2,
    font: fonts.regular,
    color: MUTED,
  });
  const label = `Page ${pageNumber} of ${pageCount}`;
  page.drawText(label, {
    x: A4.width - MARGIN_X - fonts.regular.widthOfTextAtSize(label, 7.2),
    y: 23,
    size: 7.2,
    font: fonts.regular,
    color: MUTED,
  });
}

export async function generateAcademicPdf(document: AcademicPdfDocument) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const bytes = await loadFontBytes();
  const fonts: FontPair = {
    regular: await pdf.embedFont(bytes.regular, { subset: true }),
    bold: await pdf.embedFont(bytes.bold, { subset: true }),
  };
  pdf.setTitle(normalizePdfText(document.title));
  pdf.setAuthor("EduGrade");
  pdf.setSubject(normalizePdfText(`${document.documentType} - ${document.subject}`));
  pdf.setCreator("EduGrade protected PDF service");

  const state = {
    pdf,
    fonts,
    page: pdf.addPage([A4.width, A4.height]),
    y: A4.height - TOP,
    title: document.title,
    variant: document.variant,
  } satisfies DrawState;
  addPage(state);
  pdf.removePage(0);

  state.page.drawRectangle({
    x: MARGIN_X,
    y: state.y - 36,
    width: 6,
    height: 36,
    color: TEAL,
  });
  state.page.drawText("EDUGRADE", {
    x: MARGIN_X + 18,
    y: state.y - 13,
    size: 11,
    font: fonts.bold,
    color: TEAL,
  });
  state.page.drawText(normalizePdfText(document.documentType).toUpperCase(), {
    x: MARGIN_X + 18,
    y: state.y - 29,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
  state.y -= 54;

  drawWrapped(state, document.title, {
    size: 23,
    lineHeight: 28,
    font: fonts.bold,
    color: NAVY,
    gapAfter: 4,
  });
  if (document.subtitle)
    drawWrapped(state, document.subtitle, {
      size: 10.5,
      lineHeight: 15,
      color: MUTED,
      gapAfter: 10,
    });

  const detailRows = [
    ["School", document.school ?? DEMO_SCHOOL],
    ["Class", document.className],
    ["Subject", document.subject],
    ...(document.topic ? [["Topic", document.topic]] : []),
    ...(document.date ? [["Issue date", document.date]] : []),
    ...(document.dueDate ? [["Due date", document.dueDate]] : []),
    ...(document.durationMinutes ? [["Time", `${document.durationMinutes} Minutes`]] : []),
    ...(document.estimatedMinutes ? [["Estimated time", `${document.estimatedMinutes} Minutes`]] : []),
    ...(typeof document.maxMarks === "number" ? [["Maximum marks", String(document.maxMarks)]] : []),
  ];
  const columnWidth = CONTENT_WIDTH / 2;
  for (let index = 0; index < detailRows.length; index += 2) {
    ensureSpace(state, 37);
    for (let column = 0; column < 2; column += 1) {
      const row = detailRows[index + column];
      if (!row) continue;
      const x = MARGIN_X + column * columnWidth;
      state.page.drawText(normalizePdfText(row[0]).toUpperCase(), {
        x,
        y: state.y - 8,
        size: 6.8,
        font: fonts.bold,
        color: MUTED,
      });
      const value = wrapText(row[1], fonts.bold, 9.3, columnWidth - 18)[0] ?? "";
      state.page.drawText(value, {
        x,
        y: state.y - 23,
        size: 9.3,
        font: fonts.bold,
        color: NAVY,
      });
    }
    state.y -= 37;
  }
  drawRule(state, TEAL);

  if (document.objective) {
    drawSectionHeading(state, "Learning objective");
    drawWrapped(state, document.objective, { size: 9.7, lineHeight: 14.5, gapAfter: 8 });
  }
  if (document.instructions?.length) {
    drawSectionHeading(state, "General instructions");
    document.instructions.forEach((instruction, index) =>
      drawWrapped(state, `${index + 1}. ${instruction}`, {
        x: MARGIN_X + 5,
        width: CONTENT_WIDTH - 10,
        size: 9.5,
        lineHeight: 14,
        gapAfter: 1,
      }),
    );
    state.y -= 7;
  }

  let questionNumber = 1;
  for (const section of document.sections) {
    drawSectionHeading(state, section.heading);
    section.body?.forEach((item) =>
      drawWrapped(state, `- ${item}`, {
        x: MARGIN_X + 5,
        width: CONTENT_WIDTH - 10,
        size: 9.6,
        lineHeight: 14.2,
        gapAfter: 2,
      }),
    );
    section.questions?.forEach((question) => {
      drawQuestion(state, question, questionNumber);
      questionNumber += 1;
    });
  }

  if (document.rubric?.length) {
    drawSectionHeading(state, "Rubric / marking guide");
    document.rubric.forEach((item) =>
      drawWrapped(state, `- ${item}`, { size: 9.4, lineHeight: 14, gapAfter: 1 }),
    );
  }
  if (document.teacherNote && document.variant === "teacher") {
    drawSectionHeading(state, "Teacher note");
    drawWrapped(state, document.teacherNote, { size: 9.4, lineHeight: 14, color: MUTED });
  }

  const pages = pdf.getPages();
  pages.forEach((page, index) =>
    drawFooter(page, fonts, document.title, index + 1, pages.length),
  );
  return pdf.save({ useObjectStreams: true });
}
