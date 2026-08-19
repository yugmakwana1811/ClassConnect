import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  buildProtectedPdf,
  PdfAccessError,
  ProtectedPdfKind,
} from "@/lib/pdf-document-service";
import { pdfContentDisposition } from "@/lib/pdf-filenames";

const PDF_KINDS = new Set<ProtectedPdfKind>([
  "assignment",
  "quiz",
  "resource",
  "submission",
  "report",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  const { kind, id } = await params;
  if (!PDF_KINDS.has(kind as ProtectedPdfKind))
    return NextResponse.json({ error: "Unknown PDF type" }, { status: 400 });
  const requestedVariant =
    request.nextUrl.searchParams.get("variant") === "teacher"
      ? "teacher"
      : "student";
  try {
    const result = await buildProtectedPdf(
      kind as ProtectedPdfKind,
      id,
      {
        id: user.id,
        role: user.role,
        teacherProfileId: user.teacherProfile?.id,
        studentProfileId: user.studentProfile?.id,
        parentProfileId: user.parentProfile?.id,
      },
      requestedVariant,
    );
    const headers = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": pdfContentDisposition(
        result.filename,
        request.nextUrl.searchParams.get("download") === "1",
      ),
      "Content-Length": String(result.bytes.byteLength),
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'; sandbox",
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    });
    return new Response(new Uint8Array(result.bytes), { headers });
  } catch (error) {
    if (error instanceof PdfAccessError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error(
      "[ClassConnect] Protected PDF generation failed",
      error instanceof Error ? error.message : "Unknown PDF error",
    );
    return NextResponse.json(
      { error: "The PDF could not be generated. Try again." },
      { status: 500 },
    );
  }
}
