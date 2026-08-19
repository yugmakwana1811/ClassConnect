"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AIFeedbackStream({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (pending) return;
    setPending(true);
    setText("");
    setError(null);
    try {
      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Unable to generate feedback.");
      }
      if (!response.body) throw new Error("The feedback response did not stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;
      const processLine = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as
          | { type: "chunk"; text: string }
          | { type: "complete"; feedbackId: string }
          | { type: "error"; message: string };
        if (event.type === "chunk") setText((current) => current + event.text);
        else if (event.type === "complete") completed = true;
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
      if (!completed) throw new Error("The feedback response ended unexpectedly.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to generate feedback. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: ".75rem" }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={generate}
        disabled={pending}
        aria-disabled={pending}
      >
        {pending ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        {pending ? "Drafting feedback…" : "Generate suggestion"}
      </button>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}
      {pending || text ? (
        <pre
          role="status"
          aria-live="polite"
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            font: "inherit",
            lineHeight: 1.55,
          }}
        >
          {text || "Preparing feedback…"}
          {pending ? "▌" : ""}
        </pre>
      ) : null}
    </div>
  );
}
