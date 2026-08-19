import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { deleteQuizAction, publishQuizAction } from "@/app/quiz-actions";
import { PdfActions } from "@/components/pdf-actions";

export default async function TeacherQuizDetail({
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
  const quiz = await db.quiz.findFirst({
    where: { id, class: { teacherId: user.teacherProfile!.id } },
    include: {
      class: true,
      questions: { orderBy: { order: "asc" } },
      attempts: {
        include: { student: { include: { user: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!quiz) notFound();
  const totalMarks = quiz.questions.reduce(
    (sum, question) => sum + question.marks,
    0,
  );
  return (
    <div className="page">
      <Link
        href="/teacher/quizzes"
        className="hint"
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
        eyebrow={`${quiz.class.name} · ${quiz.timeLimit ? `Suggested ${quiz.timeLimit} minutes` : "Self-paced"}`}
        title={quiz.title}
        description={quiz.description ?? "Teacher-created concept check."}
        action={
          quiz.published ? (
            <span className="badge badge-teal">
              <CheckCircle2 size={14} /> Published
            </span>
          ) : (
            <form action={publishQuizAction}>
              <input type="hidden" name="id" value={quiz.id} />
              <SubmitButton
                pendingText="Publishing…"
                confirmMessage="Publish this quiz now? Enrolled learners will immediately be able to attempt it."
              >
                <Send size={16} /> Publish quiz
              </SubmitButton>
            </form>
          )
        }
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.2fr) minmax(280px,.8fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section style={{ display: "grid", gap: ".8rem" }}>
          {quiz.questions.map((question, index) => (
            <article className="card card-pad" key={question.id}>
              <div className="eyebrow">
                Question {index + 1} · {question.marks} mark
                {question.marks === 1 ? "" : "s"}
              </div>
              <h2 style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                {question.prompt}
              </h2>
              <ol type="A" style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                {(question.options as string[]).map((option) => (
                  <li
                    key={option}
                    style={{
                      color:
                        option === question.correctAnswer
                          ? "var(--teal)"
                          : undefined,
                      fontWeight:
                        option === question.correctAnswer ? 800 : undefined,
                    }}
                  >
                    {option}
                  </li>
                ))}
              </ol>
              <p className="hint">
                <strong>Explanation:</strong> {question.explanation}
              </p>
            </article>
          ))}
        </section>
        <aside style={{ display: "grid", gap: "1rem" }}>
          <section className="card card-pad">
            <div className="eyebrow">Quiz summary</div>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: ".7rem",
                fontSize: ".85rem",
              }}
            >
              <dt className="hint">Questions</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>
                {quiz.questions.length}
              </dd>
              <dt className="hint">Maximum marks</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>{totalMarks}</dd>
              <dt className="hint">Attempts</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>
                {quiz.attempts.length}
              </dd>
            </dl>
            {!quiz.published && (
              <form action={deleteQuizAction} style={{ marginTop: "1rem" }}>
                <input type="hidden" name="id" value={quiz.id} />
                <SubmitButton
                  className="btn btn-danger"
                  pendingText="Deleting…"
                  confirmMessage="Permanently delete this unpublished quiz draft? This cannot be undone."
                >
                  <Trash2 size={15} /> Delete draft
                </SubmitButton>
              </form>
            )}
            <PdfActions
              label={quiz.title}
              studentUrl={`/api/pdfs/quiz/${quiz.id}`}
              teacherUrl={`/api/pdfs/quiz/${quiz.id}?variant=teacher`}
            />
          </section>
          <section className="card card-pad">
            <div className="eyebrow">Recent attempts</div>
            {quiz.attempts.length ? (
              quiz.attempts.slice(0, 8).map((attempt) => (
                <div
                  key={attempt.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: ".7rem 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <strong style={{ fontSize: ".83rem" }}>
                    {attempt.student.user.name}
                  </strong>
                  <span>
                    {Number(attempt.score)}/{totalMarks}
                  </span>
                </div>
              ))
            ) : (
              <p className="hint">Attempts will appear after publication.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
