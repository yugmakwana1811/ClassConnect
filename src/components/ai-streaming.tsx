"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
  type ReactNode,
} from "react";

type StreamState = {
  text: string;
  pending: boolean;
  error?: string;
};

type AIStreamingContextValue = {
  stream: StreamState | null;
  start: () => void;
  append: (text: string) => void;
  fail: (message: string) => void;
};

const AIStreamingContext = createContext<AIStreamingContextValue | null>(null);

function useAIStreaming() {
  const context = useContext(AIStreamingContext);
  if (!context)
    throw new Error("AI streaming components must be inside a provider.");
  return context;
}

export function AIStreamingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [stream, setStream] = useState<StreamState | null>(null);

  return (
    <AIStreamingContext.Provider
      value={{
        stream,
        start: () => setStream({ text: "", pending: true }),
        append: (text) =>
          setStream((current) =>
            current
              ? { ...current, text: current.text + text }
              : { text, pending: true },
          ),
        fail: (message) =>
          setStream((current) => ({
            text: current?.text ?? "",
            pending: false,
            error: message,
          })),
      }}
    >
      {children}
    </AIStreamingContext.Provider>
  );
}

export function AIStreamingForm({
  children,
  redirectPath,
  style,
}: {
  children: ReactNode;
  redirectPath: string;
  style?: CSSProperties;
}) {
  const router = useRouter();
  const { start, append, fail } = useAIStreaming();
  const [pending, setPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    start();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Unable to generate content.");
      }
      if (!response.body) throw new Error("The AI response did not stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let generationId: string | null = null;

      const processLine = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as
          | { type: "chunk"; text: string }
          | { type: "complete"; generationId: string }
          | { type: "error"; message: string };
        if (event.type === "chunk") append(event.text);
        else if (event.type === "complete") generationId = event.generationId;
        else throw new Error(event.message);
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        lines.forEach(processLine);
        if (done) break;
      }
      if (buffer.trim()) processLine(buffer);
      if (!generationId) throw new Error("The AI response ended unexpectedly.");

      router.replace(
        `${redirectPath}?generation=${encodeURIComponent(generationId)}`,
      );
      router.refresh();
    } catch (error) {
      if (controller.signal.aborted) return;
      fail(
        error instanceof Error
          ? error.message
          : "Unable to generate content. Please try again.",
      );
    } finally {
      abortRef.current = null;
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={pending} style={style}>
      {children}
    </form>
  );
}

export function AIStreamSubmitButton({
  children,
  pendingText,
}: {
  children: ReactNode;
  pendingText: string;
}) {
  const { stream } = useAIStreaming();
  const pending = Boolean(stream?.pending);
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={pending}
      aria-disabled={pending}
      style={{ opacity: pending ? 0.7 : 1 }}
    >
      {pending && <LoaderCircle size={17} className="animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}

export function AIStreamingOutput({ children }: { children: ReactNode }) {
  const { stream } = useAIStreaming();
  if (!stream) return <>{children}</>;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "grid", gap: ".9rem" }}
    >
      <div className="eyebrow">
        {stream.pending ? "Generating response…" : "Generation stopped"}
      </div>
      {stream.error ? (
        <p className="alert alert-error" role="alert">
          {stream.error}
        </p>
      ) : null}
      <pre
        style={{
          minHeight: 360,
          margin: 0,
          whiteSpace: "pre-wrap",
          font: "inherit",
          lineHeight: 1.65,
        }}
      >
        {stream.text || "Preparing your AI-assisted suggestion…"}
        {stream.pending ? "▌" : ""}
      </pre>
    </div>
  );
}
