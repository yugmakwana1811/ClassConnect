import { describe, expect, it } from "vitest";
import {
  demoPdfFilenameAt,
  pdfContentDisposition,
  pdfFilenameForDocument,
  sanitizePdfFilename,
} from "./pdf-filenames";
import { DEMO_ASSIGNMENTS } from "./demo-catalog";

describe("PDF filename service", () => {
  it("uses the exact deterministic Demo sequence", () => {
    expect([0, 1, 2, 3, 4, 5].map(demoPdfFilenameAt)).toEqual([
      "Demo.pdf",
      "Demo 1.pdf",
      "Demo 2.pdf",
      "Demo 3.pdf",
      "Demo 4.pdf",
      "Demo 5.pdf",
    ]);
    expect(
      pdfFilenameForDocument(
        `assignment:${DEMO_ASSIGNMENTS[0].id}`,
        DEMO_ASSIGNMENTS[0].title,
      ),
    ).toBe("Demo.pdf");
  });

  it("sanitizes traversal and response-header characters", () => {
    expect(sanitizePdfFilename("../../marks\r\nInjected: yes.pdf")).toBe(
      "marksInjected- yes.pdf",
    );
    const disposition = pdfContentDisposition("../Teacher key.pdf", true);
    expect(disposition).toContain('attachment; filename="Teacher key.pdf"');
    expect(disposition).not.toContain("../");
    expect(disposition).not.toContain("\r");
  });
});
