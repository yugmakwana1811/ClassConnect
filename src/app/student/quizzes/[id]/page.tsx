import Link from "next/link";
import { ArrowLeft, CheckCircle2, Trophy, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { TestLockdownForm } from "@/components/test-lockdown-form";
import { PdfActions } from "@/components/pdf-actions";
export default async function QuizDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string; error?: string }>;
}) {
  const [{ id }, { attempt, error }, user] = await Promise.all([
    params,
    searchParams,
    requireUser("STUDENT"),
  ]);
  const q = await db.quiz.findFirst({
    where: {
      id,
      published: true,
      class: { enrollments: { some: { studentId: user.studentProfile!.id } } },
    },
    include: { class: true, questions: { orderBy: { order: "asc" } } },
  });
  if (!q) notFound();
  const result = attempt
    ? await db.quizAttempt.findFirst({
        where: {
          id: attempt,
          quizId: q.id,
          studentId: user.studentProfile!.id,
        },
      })
    : null;
  const answers = (result?.answers ?? {}) as Record<string, string>;
  const total = q.questions.reduce((n, x) => n + x.marks, 0);
  return (
    <div className="page test-page" style={{ maxWidth: 900 }}>
      <Link
        href="/student/quizzes"
        className="hint test-page-exit"
        style={{
          display: "inline-flex",
          gap: 5,
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> All quizzes
      </Link>
      <PageHeader
        eyebrow={`${q.class.name} · ${q.timeLimit ? `Suggested ${q.timeLimit} minutes` : "Self-paced"}`}
        title={q.title}
        description={
          q.description ?? "Answer every question, then submit when ready."
        }
      />
      <div className="card card-pad" style={{ marginBottom: "1rem" }}>
        <div className="eyebrow">Printable version</div>
        <PdfActions
          label={q.title}
          studentUrl={`/api/pdfs/quiz/${q.id}`}
        />
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {result ? (
        <div>
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: "1rem" }}
          >
            <Trophy size={37} color="var(--gold)" style={{ margin: "auto" }} />
            <h2
              className="display"
              style={{ fontSize: "2.4rem", margin: ".7rem 0 .2rem" }}
            >
              {Number(result.score)} / {total}
            </h2>
            <p className="hint">
              Use the explanations below to correct your thinking, then try
              again later.
            </p>
          </div>
          {q.questions.map((question, i) => {
            const correct = answers[question.id] === question.correctAnswer;
            return (
              <article
                className="card card-pad"
                key={question.id}
                style={{
                  marginBottom: ".8rem",
                  borderLeft: `4px solid ${correct ? "var(--teal)" : "var(--coral)"}`,
                }}
              >
                <div
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                >
                  {correct ? (
                    <CheckCircle2 size={20} color="var(--teal)" />
                  ) : (
                    <XCircle size={20} color="var(--coral)" />
                  )}
                  <div>
                    <strong>
                      {i + 1}. {question.prompt}
                    </strong>
                    <p className="hint">Your answer: {answers[question.id]}</p>
                    {!correct && (
                      <p style={{ fontSize: ".85rem" }}>
                        Correct answer:{" "}
                        <strong>{question.correctAnswer}</strong>
                      </p>
                    )}
                    <p className="hint" style={{ lineHeight: 1.5 }}>
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          <Link className="btn btn-secondary" href={`/student/quizzes/${q.id}`}>
            Try again
          </Link>
        </div>
      ) : (
        <TestLockdownForm
          quizId={q.id}
          questions={q.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            options: Array.isArray(question.options)
              ? question.options.filter(
                  (option): option is string => typeof option === "string",
                )
              : [],
          }))}
        />
      )}
    </div>
  );
}
