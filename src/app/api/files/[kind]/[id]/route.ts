import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storedFileResponse } from "@/lib/file-response";
import { DEMO_GENERATED_PDF_PREFIX } from "@/lib/demo-catalog";

function generatedPdfRedirect(
  request: NextRequest,
  kind: "assignment" | "resource",
  entityId: string,
) {
  const target = new URL(`/api/pdfs/${kind}/${entityId}`, request.url);
  for (const key of ["variant", "download"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  if (user.role === "PARENT")
    return NextResponse.json(
      { error: "Parent file access is not available here" },
      { status: 403 },
    );
  const { kind, id } = await context.params;
  const classAccess =
    user.role === "TEACHER"
      ? { teacherId: user.teacherProfile!.id }
      : { enrollments: { some: { studentId: user.studentProfile!.id } } };
  if (kind === "assignment") {
    const file = await db.assignmentAttachment.findFirst({
      where: { id, assignment: { class: classAccess } },
    });
    return file
      ? file.url.startsWith(DEMO_GENERATED_PDF_PREFIX)
        ? generatedPdfRedirect(request, "assignment", file.assignmentId)
        : storedFileResponse(request, file.url, file.name, file.mimeType)
      : NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  if (kind === "resource") {
    const file = await db.resource.findFirst({
      where: { id, class: classAccess },
    });
    return file
      ? file.url.startsWith(DEMO_GENERATED_PDF_PREFIX)
        ? generatedPdfRedirect(request, "resource", file.id)
        : storedFileResponse(request, file.url, file.title, file.mimeType)
      : NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Unknown file type" }, { status: 400 });
}
