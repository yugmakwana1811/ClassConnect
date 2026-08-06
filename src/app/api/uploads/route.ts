import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_ANSWER_PAGE_SIZE } from "@/lib/storage";
import { submissionUploadPrefix } from "@/lib/submission-path";

const payloadSchema = z.object({ assignmentId: z.string().min(1) });
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user || user.role !== "STUDENT")
          throw new Error("Authentication required");
        let payload: unknown = null;
        try {
          payload = clientPayload ? JSON.parse(clientPayload) : null;
        } catch {
          throw new Error("Invalid upload request");
        }
        const parsed = payloadSchema.safeParse(payload);
        if (!parsed.success) throw new Error("Invalid upload request");
        const assignment = await db.assignment.findFirst({
          where: {
            id: parsed.data.assignmentId,
            status: "PUBLISHED",
            class: {
              enrollments: { some: { studentId: user.studentProfile!.id } },
            },
          },
          select: {
            id: true,
            submissions: {
              where: { studentId: user.studentProfile!.id },
              select: { status: true },
              take: 1,
            },
          },
        });
        if (!assignment) throw new Error("Assignment not found");
        if (
          assignment.submissions[0] &&
          assignment.submissions[0].status !== "DRAFT"
        )
          throw new Error("Submission is already locked");
        const expectedPrefix = submissionUploadPrefix(assignment.id, user.id);
        if (!pathname.startsWith(expectedPrefix) || pathname.includes(".."))
          throw new Error("Invalid upload path");
        return {
          allowedContentTypes: IMAGE_TYPES,
          maximumSizeInBytes: MAX_ANSWER_PAGE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            assignmentId: assignment.id,
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async () => {
        /* Finalization happens in an authenticated Server Action after metadata verification. */
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "[EduGrade] Client upload request failed",
      error instanceof Error ? error.message : "Unknown upload error",
    );
    return NextResponse.json(
      { error: "The upload could not be authorized. Refresh and try again." },
      { status: 400 },
    );
  }
}
