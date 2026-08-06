import type { AIContentType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAIStream } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "complete"; feedbackId: string }
  | { type: "error"; message: string };

function eventLine(event: StreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Teacher access is required." }, { status: 401 });
  if (user.role !== "TEACHER")
    return Response.json({ error: "Teacher access is required." }, { status: 403 });

  let body: { submissionId?: unknown };
  try {
    body = (await request.json()) as { submissionId?: unknown };
  } catch {
    return Response.json({ error: "Check the feedback request." }, { status: 400 });
  }
  const submissionId = typeof body.submissionId === "string" ? body.submissionId : "";
  if (!submissionId)
    return Response.json({ error: "Submission not found." }, { status: 400 });

  const submission = await db.submission.findFirst({
    where: {
      id: submissionId,
      assignment: { class: { teacherId: user.teacherProfile!.id } },
    },
    include: { assignment: { include: { class: true } } },
  });
  if (!submission)
    return Response.json({ error: "Submission not found." }, { status: 404 });

  const generation = await createAIStream({
    type: "FEEDBACK" as AIContentType,
    topic: submission.assignment.topic ?? submission.assignment.title,
    subject: submission.assignment.class.subject,
    grade: submission.assignment.class.grade,
    audience: "teacher",
    details:
      "Use supportive, specific language. Do not decide marks or infer personal learner information.",
  });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let content = "";
      try {
        for await (const chunk of generation.chunks) {
          content += chunk;
          controller.enqueue(
            encoder.encode(eventLine({ type: "chunk", text: chunk })),
          );
        }
        if (content.trim().length < 10)
          throw new Error("Generated feedback was empty.");
        const feedback = await db.feedback.create({
          data: {
            submissionId,
            content,
            isAiSuggested: true,
          },
        });
        controller.enqueue(
          encoder.encode(eventLine({ type: "complete", feedbackId: feedback.id })),
        );
        controller.close();
      } catch (error) {
        console.error(
          "[EduGrade AI] Feedback stream failed",
          error instanceof Error ? error.message : "Unknown feedback error",
        );
        const streamError: StreamEvent = {
          type: "error",
          message: "Unable to generate feedback. Please try again.",
        };
        controller.enqueue(encoder.encode(eventLine(streamError)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
