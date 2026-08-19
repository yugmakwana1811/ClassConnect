import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Inbox,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { groupReviewItemsByAssignment } from "@/lib/review-groups";
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
  const assignmentGroups = groupReviewItemsByAssignment(submissions);
  const firstPendingGroup = assignmentGroups.findIndex((group) =>
    group.submissions.some((submission) => submission.status === "SUBMITTED"),
  );
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
              <div className="review-assignment-list">
                {assignmentGroups.map((group, groupIndex) => {
                  const assignment = group.submissions[0].assignment;
                  const groupPending = group.submissions.filter(
                    (submission) => submission.status === "SUBMITTED",
                  ).length;
                  const groupReviewed = group.submissions.length - groupPending;
                  const shouldOpen =
                    groupIndex ===
                    (firstPendingGroup === -1 ? 0 : firstPendingGroup);

                  return (
                    <details
                      className="review-assignment-group"
                      key={group.assignmentId}
                      open={shouldOpen}
                    >
                      <summary className="review-assignment-summary">
                        <span className="review-assignment-icon" aria-hidden="true">
                          <ClipboardCheck size={20} />
                        </span>
                        <span className="review-assignment-heading">
                          <strong>{assignment.title}</strong>
                          <span>
                            {assignment.type} · {assignment.class.name}
                          </span>
                        </span>
                        <span className="review-assignment-counts">
                          <span className="badge badge-coral">
                            {groupPending} pending
                          </span>
                          <span className="badge badge-teal">
                            {groupReviewed} checked
                          </span>
                          <span className="badge">
                            {group.submissions.length} submission
                            {group.submissions.length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <ChevronDown
                          className="review-assignment-chevron"
                          size={20}
                          aria-hidden="true"
                        />
                      </summary>

                      <div className="review-assignment-body">
                        <div className="review-assignment-actions">
                          <span className="hint">
                            Select a student to review their submitted work.
                          </span>
                          <div>
                            {assignment.attachments.length ? (
                              <a
                                className="btn btn-secondary"
                                href={`/api/files/assignment/${assignment.attachments[0].id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open question file
                              </a>
                            ) : null}
                            <Link
                              className="btn btn-secondary"
                              href={`/teacher/assignments/${assignment.id}`}
                            >
                              Assignment details
                            </Link>
                          </div>
                        </div>

                        <div
                          className="table-wrap"
                          role="region"
                          aria-label={`Submissions for ${assignment.title}`}
                          tabIndex={0}
                        >
                          <table>
                            <thead>
                              <tr>
                                <th>Student</th>
                                <th>Answer pages</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Score</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.submissions.map((submission) => (
                                <tr key={submission.id}>
                                  <td>
                                    <Link
                                      href={`/teacher/students/${submission.student.id}`}
                                      style={{ fontWeight: 800 }}
                                    >
                                      {submission.student.user.name}
                                    </Link>
                                    <div className="hint">
                                      {submission.student.rollNumber}
                                    </div>
                                  </td>
                                  <td>
                                    {submission.pages.length} answer page
                                    {submission.pages.length === 1 ? "" : "s"}
                                  </td>
                                  <td>
                                    {submission.submittedAt
                                      ? formatDateTime(submission.submittedAt)
                                      : "—"}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${submission.status === "SUBMITTED" ? "badge-coral" : "badge-teal"}`}
                                    >
                                      {submission.status.toLowerCase()}
                                    </span>
                                  </td>
                                  <td>
                                    {submission.result
                                      ? `${Number(submission.result.marks)}/${assignment.maxMarks}`
                                      : "—"}
                                  </td>
                                  <td>
                                    <Link
                                      className="review-assignment-open"
                                      href={`/teacher/review/${submission.id}`}
                                      aria-label={`Review ${assignment.title} from ${submission.student.user.name}`}
                                    >
                                      <ArrowRight size={17} />
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>
                  );
                })}
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
              <div
                className="card table-wrap"
                role="region"
                aria-label="Quiz attempts"
                tabIndex={0}
              >
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
