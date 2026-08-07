import { DEMO_PDF_DOCUMENT_KEYS } from "@/lib/demo-catalog";

const SAFE_PDF_NAME = /[^a-zA-Z0-9._ -]/g;

export function sanitizePdfFilename(value: string) {
  const basename = value.replace(/\\/g, "/").split("/").at(-1) ?? "";
  const cleaned = basename
    .replace(/[\r\n\t]/g, "")
    .replace(SAFE_PDF_NAME, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 120);
  const withoutExtension = cleaned.replace(/\.pdf$/i, "").trim();
  return `${withoutExtension || "document"}.pdf`;
}

export function demoPdfFilenameAt(index: number) {
  if (!Number.isInteger(index) || index < 0)
    throw new RangeError("Demo PDF index must be a non-negative integer.");
  return index === 0 ? "Demo.pdf" : `Demo ${index}.pdf`;
}

export function pdfFilenameForDocument(key: string, fallbackTitle: string) {
  const index = DEMO_PDF_DOCUMENT_KEYS.indexOf(
    key as (typeof DEMO_PDF_DOCUMENT_KEYS)[number],
  );
  return index >= 0
    ? demoPdfFilenameAt(index)
    : sanitizePdfFilename(fallbackTitle);
}

export function pdfContentDisposition(filename: string, download: boolean) {
  const safe = sanitizePdfFilename(filename);
  const ascii = safe.replace(/[^\x20-\x7E]/g, "-").replace(/["\\]/g, "-");
  const disposition = download ? "attachment" : "inline";
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}
