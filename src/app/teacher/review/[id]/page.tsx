/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, PageHeader, SafetyNote } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { saveReviewAction } from "@/app/actions";
import { ReviewSubmit } from "@/components/review-submit";
import { AIFeedbackStream } from "@/components/ai-feedback-stream";
export default async function ReviewDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, { error, success }, user] = await Promise.all([
    params,
    searchParams,
    requireUser("TEACHER"),
  ]);
  const s = await db.submission.findFirst({
    where: {
      id,
      assignment: { class: { teacherId: user.teacherProfile!.id } },
    },
    include: {
      assignment: { include: { class: true } },
      student: { include: { user: true } },
      pages: { orderBy: { pageNumber: "asc" } },
      feedback: { orderBy: { createdAt: "desc" } },
      result: true,
    },
  });
  if (!s) notFound();
  const suggestion = s.feedback.find((f) => f.isAiSuggested && !f.approved);
  const finalFeedback = s.feedback.find((f) => f.approved);
  return (
    <div className="page">
      <Link
        href="/teacher/review"
        className="hint"
        style={{
          display: "inline-flex",
          gap: 5,
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> Review queue
      </Link>
      <PageHeader
        eyebrow={`${s.assignment.class.name} · ${s.assignment.title}`}
        title={`Review ${s.student.user.name}`}
        description={`${s.pages.length} answer pages · submitted ${s.submittedAt ? formatDateTime(s.submittedAt) : "as a draft"}`}
        action={
          <span
            className={`badge ${s.status === "SUBMITTED" ? "badge-coral" : "badge-teal"}`}
          >
            {s.status.toLowerCase()}
          </span>
        }
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.35fr) minmax(340px,.65fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section>
          <div
            className="grid-auto"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            }}
          >
            {s.pages.map((p) => (
              <figure
                className="card"
                key={p.id}
                style={{ padding: ".6rem", margin: 0 }}
              >
                <a
                  href={`/api/submission-pages/${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={`/api/submission-pages/${p.id}`}
                    alt={`Handwritten answer page ${p.pageNumber}`}
                    style={{
                      display: "block",
                      width: "100%",
                      aspectRatio: "3/4",
                      objectFit: "contain",
                      background: "var(--surface-subtle)",
                      borderRadius: 10,
                    }}
                  />
                </a>
                <figcaption
                  className="hint"
                  style={{ padding: ".6rem .3rem .2rem" }}
                >
                  Page {p.pageNumber} · {p.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
        <aside
          style={{ display: "grid", gap: "1rem", position: "sticky", top: 90 }}
        >
          <SafetyNote />
          <div className="card card-pad">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div className="eyebrow">AI-assisted feedback</div>
                <h2
                  className="display"
                  style={{ fontSize: "1.65rem", margin: ".3rem 0" }}
                >
                  Draft, then decide
                </h2>
              </div>
              <Sparkles color="var(--coral)" />
            </div>
            {suggestion ? (
              <p className="hint">
                A suggestion is ready below. Read the actual work and edit it
                before approval.
              </p>
            ) : (
              <AIFeedbackStream key="new" submissionId={s.id} />
            )}
            <form
              action={saveReviewAction}
              style={{ display: "grid", gap: ".9rem", marginTop: "1rem" }}
            >
              <input type="hidden" name="submissionId" value={s.id} />
              <label>
                <span className="label">Marks awarded</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <input
                    className="field"
                    name="marks"
                    type="number"
                    min={0}
                    max={s.assignment.maxMarks}
                    step="0.5"
                    required
                    defaultValue={s.result ? Number(s.result.marks) : ""}
                  />
                  <strong>/ {s.assignment.maxMarks}</strong>
                </div>
              </label>
              <label>
                <span className="label">Feedback to student</span>
                <textarea
                  className="field"
                  name="feedback"
                  minLength={10}
                  maxLength={3000}
                  required
                  defaultValue={
                    suggestion?.content ?? finalFeedback?.content ?? ""
                  }
                  style={{ minHeight: 280, lineHeight: 1.55 }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  gap: ".6rem",
                  alignItems: "flex-start",
                  padding: ".8rem",
                  background: "var(--surface-subtle)",
                  borderRadius: 10,
                }}
              >
                <input
                  type="checkbox"
                  name="publish"
                  defaultChecked={s.result?.published}
                />
                <span>
                  <strong style={{ display: "block", fontSize: ".82rem" }}>
                    Publish result to student
                  </strong>
                  <span className="hint">
                    If unchecked, the review stays private. Publishing requires
                    confirmation.
                  </span>
                </span>
              </label>
              <ReviewSubmit />
            </form>
          </div>
          {s.result?.published && (
            <div className="alert alert-success">
              <CheckCircle2
                size={16}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              This result is visible to the student.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
