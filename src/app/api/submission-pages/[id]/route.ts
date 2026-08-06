import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storedFileResponse } from "@/lib/file-response";

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
  });
  if (!page)
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  return storedFileResponse(request, page.url, page.name);
}
