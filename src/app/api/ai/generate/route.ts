import type { AIContentType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAIStream } from "@/lib/ai";
import { aiSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "complete"; generationId: string }
  | { type: "error"; message: string };

function eventLine(event: StreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Your session has expired." }, { status: 401 });
  if (user.role === "PARENT")
    return Response.json(
      { error: "AI generation is not available in the parent workspace." },
      { status: 403 },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Check the generation request." }, { status: 400 });
  }

  const parsed = aiSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check your prompt." },
      { status: 400 },
    );

  if (
    user.role === "STUDENT" &&
    !["DOUBT_HELP", "REVISION_HELP", "EXPLANATION"].includes(parsed.data.type)
  )
    return Response.json(
      { error: "That tool is available to teachers only." },
      { status: 403 },
    );

  const input = {
    ...parsed.data,
    type: parsed.data.type as AIContentType,
    audience: user.role === "STUDENT" ? ("student" as const) : ("teacher" as const),
  };
  const generation = await createAIStream(input);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let output = "";
      try {
        for await (const chunk of generation.chunks) {
          output += chunk;
          controller.enqueue(
            encoder.encode(eventLine({ type: "chunk", text: chunk })),
          );
        }

        if (output.trim().length < 10)
          throw new Error("Generated content was empty.");

        const record = await db.aIContentGeneration.create({
          data: {
            userId: user.id,
            type: input.type,
            prompt: {
              topic: input.topic,
              subject: input.subject,
              grade: input.grade,
              details: input.details,
            },
            output,
            provider: await generation.provider,
          },
        });
        await db.activityLog.create({
          data: {
            userId: user.id,
            action: "Generated AI suggestion",
            entityType: "AIContentGeneration",
            entityId: record.id,
          },
        });
        controller.enqueue(
          encoder.encode(
            eventLine({ type: "complete", generationId: record.id }),
          ),
        );
        controller.close();
      } catch (error) {
        console.error(
          "[EduGrade AI] Generation stream failed",
          error instanceof Error ? error.message : "Unknown generation error",
        );
        const streamError: StreamEvent = {
          type: "error",
          message: "Unable to generate content. Please try again.",
        };
        controller.enqueue(
          encoder.encode(eventLine(streamError)),
        );
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
