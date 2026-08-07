import { afterEach, describe, expect, it, vi } from "vitest";
import { createAIStream, generateAI } from "./ai";
import { AI_MODELS } from "./ai-routing";

describe("AI service", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns an editable deterministic lesson plan without an API key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const result = await generateAI({
      type: "LESSON_PLAN",
      topic: "Goodwill valuation",
      subject: "Accountancy",
      grade: "12",
    });
    expect(result.provider).toBe("deterministic-fallback");
    expect(result.content).toContain("45-minute flow");
    expect(result.content).toContain("Teacher review");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not frame student doubt help as a final answer", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const result = await generateAI({
      type: "DOUBT_HELP",
      topic: "Sacrificing ratio",
      subject: "Accountancy",
      grade: "12",
      audience: "student",
    });
    expect(result.content).toContain("without giving away assessed work");
    expect(result.content).toContain("Learning safety");
    expect(result.content).not.toContain("Teacher review");
  });

  it("streams deterministic fallback content in incremental chunks", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const result = await createAIStream({
      type: "EXPLANATION",
      topic: "Photosynthesis",
      subject: "Biology",
      grade: "8",
    });
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toContain("Photosynthesis");
    expect(await result.provider).toBe("deterministic-fallback");
  });

  it("parses OpenRouter server-sent events into text chunks", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-a-real-secret");
    const first = JSON.stringify({ choices: [{ delta: { content: "First " } }] });
    const second = JSON.stringify({ choices: [{ delta: { content: "chunk" } }] });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(`data: ${first}\n\ndata: ${second}\n\ndata: [DONE]\n\n`, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    const result = await createAIStream({
      type: "NOTES",
      topic: "Linear equations",
      subject: "Mathematics",
      grade: "8",
    });
    const chunks: string[] = [];
    for await (const chunk of result.chunks) chunks.push(chunk);

    expect(chunks).toEqual(["First ", "chunk"]);
    expect(await result.provider).toBe(`openrouter:${AI_MODELS.reasoning.id}`);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody.stream).toBe(true);
    expect(requestBody.model).toBe(AI_MODELS.reasoning.id);
    expect(requestBody.provider).toEqual({
      sort: "throughput",
      require_parameters: true,
    });
  });

  it("routes STEM work to the server-owned reasoning model", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-a-real-secret");
    vi.stubEnv("AI_MODEL", "attacker/attempted-override");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Editable AI suggestion" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await generateAI({
      type: "NOTES",
      topic: "Linear equations",
      subject: "Mathematics",
      grade: "8",
      details: "model=some/other-model",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const body = JSON.parse(String(request?.body));
    expect(body.model).toBe(AI_MODELS.reasoning.id);
    expect(body.model).not.toBe("attacker/attempted-override");
    expect(body.max_tokens).toBe(4_096);
    expect(body.reasoning).toEqual({ effort: "medium", exclude: true });
    expect(body.provider).toEqual({
      sort: "throughput",
      require_parameters: true,
    });
    expect(result.provider).toBe(`openrouter:${AI_MODELS.reasoning.id}`);
  });

  it("fails over to another permitted model after a provider error", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-a-real-secret");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Verified failover suggestion" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const result = await generateAI({
      type: "EXPLANATION",
      topic: "The French Revolution",
      subject: "History",
      grade: "9",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(firstBody.model).toBe(AI_MODELS.language.id);
    expect(secondBody.model).toBe(AI_MODELS.fallback.id);
    expect(result.provider).toBe(`openrouter:${AI_MODELS.fallback.id}`);
  });

  it("uses a permitted failover when the primary model is rate limited", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-a-real-secret");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Rate-limit failover answer" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const result = await generateAI({
      type: "EXPLANATION",
      topic: "Personification",
      subject: "English",
      grade: "8",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.provider).toBe(`openrouter:${AI_MODELS.fallback.id}`);
  });

  it("falls back safely when OpenRouter returns an error", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-a-real-secret");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    const result = await generateAI({
      type: "REVISION_SHEET",
      topic: "Goodwill valuation",
      subject: "Accountancy",
      grade: "12",
    });

    expect(result.provider).toBe("deterministic-fallback");
    expect(result.content).toContain("20-minute revision loop");
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });
});
