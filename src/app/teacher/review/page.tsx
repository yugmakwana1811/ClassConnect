import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Inbox,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
export default async function ReviewQueue() {
  const user = await requireUser("TEACHER");
  const [submissions, quizAttempts] = await Promise.all([
    db.submission.findMany({
      where: {
        assignment: { class: { teacherId: user.teacherProfile!.id } },
        status: { not: "DRAFT" },
      },
      include: {
        assignment: { include: { class: true, attachments: true } },
        student: { include: { user: true } },
        pages: true,
        result: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    db.quizAttempt.findMany({
      where: { quiz: { class: { teacherId: user.teacherProfile!.id } } },
      include: {
        quiz: {
          include: {
            class: true,
            questions: { select: { marks: true } },
          },
        },
        student: { include: { user: true } },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ]);
  const pending = submissions.filter((s) => s.status === "SUBMITTED").length;
  const checked = submissions.filter((s) =>
    ["REVIEWED", "PUBLISHED"].includes(s.status),
  ).length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Assessment review"
        title="Review real classroom work"
        description="Open submitted test, assignment and worksheet files for teacher feedback, then use auto-graded quiz attempts as supporting evidence."
      />
      <div className="grid-auto" style={{ marginBottom: "1rem" }}>
        <StatCard
          label="Pending review"
          value={pending}
          icon={Clock3}
          tone="coral"
        />
        <StatCard label="Checked work" value={checked} icon={CheckCircle2} />
        <StatCard
          label="Submitted files"
          value={submissions.length}
          icon={Inbox}
          tone="gold"
        />
        <StatCard
          label="Quiz attempts"
          value={quizAttempts.length}
          icon={FileQuestion}
        />
      </div>
      {submissions.length || quizAttempts.length ? (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <section aria-labelledby="submitted-work-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Manual review</div>
                <h2 id="submitted-work-title">Submitted work files</h2>
              </div>
              <span className="badge badge-coral">
                {pending} pending
              </span>
            </div>
            {submissions.length ? (
              <div className="card table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Work</th>
                      <th>Files</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <Link
                            href={`/teacher/students/${s.student.id}`}
                            style={{ fontWeight: 800 }}
                          >
                            {s.student.user.name}
                          </Link>
                          <div className="hint">{s.student.rollNumber}</div>
                        </td>
                        <td>
                          <strong>{s.assignment.title}</strong>
                          <div className="hint">
                            {s.assignment.type} · {s.assignment.class.name}
                          </div>
                        </td>
                        <td>
                          {s.pages.length} answer page
                          {s.pages.length === 1 ? "" : "s"}
                          {s.assignment.attachments.length ? (
                            <div>
                              <a
                                className="hint"
                                href={`/api/files/assignment/${s.assignment.attachments[0].id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open question file
                              </a>
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {s.submittedAt
                            ? formatDateTime(s.submittedAt)
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={`badge ${s.status === "SUBMITTED" ? "badge-coral" : "badge-teal"}`}
                          >
                            {s.status.toLowerCase()}
                          </span>
                        </td>
                        <td>
                          {s.result
                            ? `${Number(s.result.marks)}/${s.assignment.maxMarks}`
                            : "—"}
                        </td>
                        <td>
                          <Link
                            href={`/teacher/review/${s.id}`}
                            aria-label={`Review ${s.assignment.title} from ${s.student.user.name}`}
                          >
                            <ArrowRight size={17} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No submitted files"
                description="Submitted tests, assignments and worksheets will appear here."
              />
            )}
          </section>
          <section aria-labelledby="quiz-review-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Auto-graded evidence</div>
                <h2 id="quiz-review-title">Quiz attempts</h2>
              </div>
              <span className="badge badge-teal">
                {quizAttempts.length} received
              </span>
            </div>
            {quizAttempts.length ? (
              <div className="card table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Quiz</th>
                      <th>Submitted</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizAttempts.map((attempt) => {
                      const maximum = attempt.quiz.questions.reduce(
                        (sum, question) => sum + question.marks,
                        0,
                      );
                      return (
                        <tr key={attempt.id}>
                          <td>
                            <Link
                              href={`/teacher/students/${attempt.student.id}`}
                              style={{ fontWeight: 800 }}
                            >
                              {attempt.student.user.name}
                            </Link>
                            <div className="hint">
                              {attempt.student.rollNumber}
                            </div>
                          </td>
                          <td>
                            <strong>{attempt.quiz.title}</strong>
                            <div className="hint">
                              Quiz · {attempt.quiz.class.name}
                            </div>
                          </td>
                          <td>{formatDateTime(attempt.submittedAt)}</td>
                          <td>
                            {Number(attempt.score)}/{maximum}
                          </td>
                          <td>
                            <span className="badge badge-teal">
                              auto-graded
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/teacher/quizzes/${attempt.quiz.id}`}
                              aria-label={`Open ${attempt.quiz.title}`}
                            >
                              <ArrowRight size={17} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No quiz attempts"
                description="Completed published quizzes will appear here automatically."
              />
            )}
          </section>
        </div>
      ) : (
        <EmptyState
          title="The review queue is clear"
          description="Submitted files and completed quiz attempts will appear here automatically."
        />
      )}
    </div>
  );
}
