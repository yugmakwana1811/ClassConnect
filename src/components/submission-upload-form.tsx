"use client";

import { upload } from "@vercel/blob/client";
import { LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { submitWorkAction } from "@/app/actions";
import { submissionUploadPrefix } from "@/lib/submission-path";
import { UploadField } from "./upload-field";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function SubmissionUploadForm({
  assignmentId,
  userId,
}: {
  assignmentId: string;
  userId: string;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!files.length)
      return setError("Upload at least one answer-page image.");
    if (files.length > 20) return setError("Upload no more than 20 pages.");
    const invalid = files.find(
      (file) => !ALLOWED.has(file.type) || !file.size || file.size > MAX_SIZE,
    );
    if (invalid)
      return setError(
        `${invalid.name} must be a JPG, PNG, or WebP image no larger than 10 MB.`,
      );
    const form = event.currentTarget;
    const note = new FormData(form).get("note")?.toString() ?? "";
    setPending(true);
    try {
      const pages = [];
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading page ${index + 1} of ${files.length}…`);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const blob = await upload(
          `${submissionUploadPrefix(assignmentId, userId)}${safeName}`,
          file,
          {
            access: "private",
            handleUploadUrl: "/api/uploads",
            clientPayload: JSON.stringify({ assignmentId }),
          },
        );
        pages.push({ url: blob.url, name: file.name, pageNumber: index + 1 });
      }
      setProgress("Finalizing submission…");
      const data = new FormData();
      data.set("assignmentId", assignmentId);
      data.set("note", note);
      data.set("pagesJson", JSON.stringify(pages));
      const result = await submitWorkAction(data);
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        setProgress("");
        return;
      }
      router.replace(
        `/student/assignments/${assignmentId}?success=${encodeURIComponent("Submission received")}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The upload could not be completed. Please try again.",
      );
      setPending(false);
      setProgress("");
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}
    >
      <UploadField onFilesChange={setFiles} disabled={pending} />
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {progress && (
        <div className="alert alert-success" aria-live="polite">
          {progress}
        </div>
      )}
      <label>
        <span className="label">
          Note to teacher <span className="hint">(optional)</span>
        </span>
        <textarea
          className="field"
          name="note"
          maxLength={500}
          disabled={pending}
          placeholder="Mention a page order detail or technical issue—never include sensitive information."
        />
      </label>
      <label
        style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}
      >
        <input type="checkbox" required disabled={pending} />
        <span className="hint">
          I checked that every page is readable, in order, and ready for final
          submission.
        </span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}{" "}
        {pending ? progress || "Uploading…" : "Submit final answer pages"}
      </button>
    </form>
  );
}
