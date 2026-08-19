import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storedFileResponse } from "@/lib/file-response";
import { DEMO_SUBMISSION_PAGE_PREFIX } from "@/lib/demo-catalog";
import { renderDemoSubmissionPage } from "@/lib/demo-submission-page";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
  const { id } = await params;
  const page = await db.submissionPage.findFirst({
    where: {
      id,
      submission:
        user.role === "STUDENT"
          ? { studentId: user.studentProfile!.id }
          : { assignment: { class: { teacherId: user.teacherProfile!.id } } },
    },
    include: {
      submission: {
        include: {
          assignment: { include: { class: true } },
          student: { include: { user: true } },
        },
      },
    },
  });
  if (!page)
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  if (page.url.startsWith(DEMO_SUBMISSION_PAGE_PREFIX)) {
    const svg = renderDemoSubmissionPage({
      studentName: page.submission.student.user.name,
      rollNumber: page.submission.student.rollNumber,
      assignmentTitle: page.submission.assignment.title,
      subject: page.submission.assignment.class.subject,
      note: page.submission.note,
      pageNumber: page.pageNumber,
    });
    return new Response(svg, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `inline; filename="answer-page-${page.pageNumber}.svg"`,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Type": "image/svg+xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }
  return storedFileResponse(request, page.url, page.name, page.mimeType);
}
