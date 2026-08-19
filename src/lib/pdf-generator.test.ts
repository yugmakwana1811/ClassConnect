import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { writeFile } from "node:fs/promises";
import { generateAcademicPdf, normalizePdfText } from "./pdf-generator";

describe("academic PDF generator", () => {
  it("creates a non-empty, multipage A4 PDF with Unicode metadata", async () => {
    const bytes = await generateAcademicPdf({
      title: "Résumé and café revision – Class 12",
      documentType: "Test",
      className: "Class 12 Commerce",
      subject: "Economics",
      durationMinutes: 45,
      maxMarks: 40,
      instructions: ["Answer all questions.", "Show necessary working."],
      sections: [
        {
          heading: "Section A",
          questions: Array.from({ length: 26 }, (_, index) => ({
            prompt: `Explain the economic implication in original situation ${index + 1} and support the answer with one reason.`,
            marks: 2,
            answer: "Award one mark for the conclusion and one for a relevant reason.",
            answerLines: 3,
          })),
        },
      ],
      variant: "teacher",
    });
    if (process.env.PDF_VISUAL_OUTPUT) {
      await writeFile(process.env.PDF_VISUAL_OUTPUT, bytes);
    }
    expect(bytes.byteLength).toBeGreaterThan(5_000);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getTitle()).toBe("Résumé and café revision - Class 12");
    for (const page of pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(595.28, 1);
      expect(page.getHeight()).toBeCloseTo(841.89, 1);
    }
  });

  it("normalizes unsafe typographic characters without corrupting text", () => {
    expect(normalizePdfText("₹500 – ‘clear’ café")).toBe("Rs.500 - 'clear' café");
  });
});
