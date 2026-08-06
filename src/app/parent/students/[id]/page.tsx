import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Bot,
  CalendarCheck,
  CheckCircle2,
  MessageSquareText,
  Target,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentPerformanceSummary } from "@/lib/student-insights";
import { formatDate, formatDateTime } from "@/lib/utils";

function promptField(prompt: Prisma.JsonValue, field: string) {
  if (!prompt || typeof prompt !== "object" || Array.isArray(prompt)) return "";
  const value = (prompt as Record<string, Prisma.JsonValue>)[field];
  return typeof value === "string" ? value : "";
}

export default async function ParentStudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, requireUser("PARENT")]);
  const student = await db.studentProfile.findFirst({
    where: {
      id,
      parents: { some: { parentId: user.parentProfile!.id } },
    },
    include: {
      user: { select: { name: true, id: true } },
      enrollments: {
        include: {
          class: {
            select: { id: true, name: true, subject: true, grade: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!student) notFound();

  const [
    expectedAssignments,
    submissions,
    quizAttempts,
    attendance,
    aiHistory,
    aiHistoryCount,
    activities,
    announcements,
  ] = await Promise.all([
    db.assignment.findMany({
      where: {
        status: { not: "DRAFT" },
        class: { enrollments: { some: { studentId: student.id } } },
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
        class: { select: { name: true } },
      },
      orderBy: { dueAt: "desc" },
    }),
    db.submission.findMany({
      where: {
        studentId: student.id,
        assignment: {
          status: { not: "DRAFT" },
          class: { enrollments: { some: { studentId: student.id } } },
        },
      },
      include: {
        assignment: { include: { class: true } },
        result: true,
        feedback: { where: { approved: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.quizAttempt.findMany({
      where: { studentId: student.id, quiz: { published: true } },
      include: {
        quiz: { include: { class: true, questions: { select: { marks: true } } } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    db.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: { class: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    db.aIContentGeneration.findMany({
      where: { userId: student.userId },
      select: {
        id: true,
        type: true,
        prompt: true,
        output: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.aIContentGeneration.count({ where: { userId: student.userId } }),
    db.activityLog.findMany({
      where: {
        userId: student.userId,
        entityType: {
          in: [
            "AIContentGeneration",
            "Submission",
            "QuizAttempt",
            "ClassRoom",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.announcement.findMany({
      where: { class: { enrollments: { some: { studentId: student.id } } } },
      include: {
        class: { select: { name: true } },
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
  ]);

  const publishedSubmissions = submissions.filter(
    (submission) => submission.result?.published,
  );
  const scores = [
    ...publishedSubmissions.map((submission) => ({
      kind: "assignment" as const,
      title: submission.assignment.title,
      topic: submission.assignment.topic,
      marks: Number(submission.result!.marks),
      maxMarks: submission.assignment.maxMarks,
      date: submission.result!.publishedAt ?? submission.updatedAt,
    })),
    ...quizAttempts.map((attempt) => ({
      kind: "quiz" as const,
      title: attempt.quiz.title,
      marks: Number(attempt.score),
      maxMarks: attempt.quiz.questions.reduce(
        (total, question) => total + question.marks,
        0,
      ),
      date: attempt.submittedAt,
    })),
  ];
  const submittedCount = submissions.filter(
    (submission) => submission.status !== "DRAFT",
  ).length;
  const summary = studentPerformanceSummary(
    scores,
    submittedCount,
    expectedAssignments.length,
  );
  const presentCount = attendance.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE",
  ).length;
  const attendanceRate = attendance.length
    ? Math.round((presentCount / attendance.length) * 100)
    : null;
  const assessmentRows = [
    ...publishedSubmissions.map((submission) => ({
      id: submission.id,
      kind: "Assignment",
      title: submission.assignment.title,
      className: submission.assignment.class.name,
      marks: Number(submission.result!.marks),
      maxMarks: submission.assignment.maxMarks,
      date: submission.result!.publishedAt ?? submission.updatedAt,
      status: "published",
    })),
    ...quizAttempts.map((attempt) => ({
      id: attempt.id,
      kind: "Quiz",
      title: attempt.quiz.title,
      className: attempt.quiz.class.name,
      marks: Number(attempt.score),
      maxMarks: attempt.quiz.questions.reduce(
        (total, question) => total + question.marks,
        0,
      ),
      date: attempt.submittedAt,
      status: "auto-graded",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  const feedbackItems = publishedSubmissions.filter(
    (submission) =>
      submission.result?.teacherNote || submission.feedback.length > 0,
  );

  return (
    <div className="page">
      <Link
        href="/parent/students"
        className="hint"
        style={{
          display: "inline-flex",
          gap: ".4rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> Your children
      </Link>
      <PageHeader
        eyebrow="Student progress"
        title={student.user.name}
        description="A complete family view of published results, learning activity, attendance, class updates, and AI Studio study history."
      />
      <div className="facts-strip" aria-label="Student details">
        <div className="fact">
          <span>Roll number</span>
          <strong>{student.rollNumber || "—"}</strong>
        </div>
        <div className="fact">
          <span>Grade</span>
          <strong>{student.grade || "—"}</strong>
        </div>
        <div className="fact">
          <span>Classes</span>
          <strong>{student.enrollments.length}</strong>
        </div>
        <div className="fact">
          <span>AI Studio searches</span>
          <strong>{aiHistoryCount}</strong>
        </div>
      </div>

      <div className="grid-auto" style={{ marginTop: "1rem" }}>
        <StatCard
          label="Overall average"
          value={summary.overallAverage === null ? "—" : `${summary.overallAverage}%`}
          detail={`${summary.scoredCount} graded item${summary.scoredCount === 1 ? "" : "s"}`}
          icon={BarChart3}
        />
        <StatCard
          label="Assignment average"
          value={summary.assignmentAverage === null ? "—" : `${summary.assignmentAverage}%`}
          detail={`${summary.assignmentCount} published result${summary.assignmentCount === 1 ? "" : "s"}`}
          icon={BookOpenCheck}
          tone="gold"
        />
        <StatCard
          label="Quiz accuracy"
          value={summary.quizAverage === null ? "—" : `${summary.quizAverage}%`}
          detail={`${summary.quizCount} quiz attempt${summary.quizCount === 1 ? "" : "s"}`}
          icon={Target}
          tone="coral"
        />
        <StatCard
          label="Work completion"
          value={summary.completionRate === null ? "—" : `${summary.completionRate}%`}
          detail={`${submittedCount} submitted of ${expectedAssignments.length} assigned`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Attendance"
          value={attendanceRate === null ? "—" : `${attendanceRate}%`}
          detail={`${attendance.length} attendance record${attendance.length === 1 ? "" : "s"}`}
          icon={Users}
          tone="gold"
        />
      </div>

      <div className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <section className="card card-pad">
          <div className="eyebrow">Performance trend</div>
          <h2 className="display" style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}>
            Recent assessed work
          </h2>
          {summary.trend.length ? (
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: ".8rem",
                minHeight: 220,
                padding: "1rem 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {summary.trend.map((item) => (
                <div
                  key={`${item.kind}-${item.title}-${item.date.toISOString()}`}
                  style={{
                    flex: 1,
                    height: 180,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "end",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <strong style={{ fontSize: ".78rem" }}>{item.score}%</strong>
                  <div
                    title={`${item.title}: ${item.score}%`}
                    style={{
                      width: "100%",
                      maxWidth: 58,
                      height: `${Math.max(item.score, 8)}%`,
                      background:
                        item.kind === "quiz" ? "var(--indigo)" : "var(--teal)",
                      borderRadius: "8px 8px 2px 2px",
                    }}
                  />
                  <small className="hint" style={{ maxWidth: 84, textAlign: "center" }}>
                    {item.title}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No published marks yet"
              description="Published assignment results and completed quizzes will appear here."
            />
          )}
          <p className="hint" style={{ marginBottom: 0 }}>
            Results are one signal of learning. Use them with teacher feedback
            and the student&apos;s questions when offering support.
          </p>
        </section>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <section className="card card-pad">
            <div className="eyebrow">Topics to support</div>
            <h2 className="display" style={{ fontSize: "1.6rem", margin: ".3rem 0 1rem" }}>
              Assignment patterns
            </h2>
            {summary.topics.length ? (
              summary.topics.slice(0, 5).map((topic) => (
                <div key={topic.topic} style={{ marginBottom: ".9rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: ".6rem",
                      fontSize: ".82rem",
                      fontWeight: 750,
                      marginBottom: ".35rem",
                    }}
                  >
                    <span>{topic.topic}</span>
                    <span>{topic.average}%</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${topic.average}%` }} />
                  </div>
                  <div className="hint" style={{ marginTop: ".25rem" }}>
                    {topic.evidenceCount} published result
                    {topic.evidenceCount === 1 ? "" : "s"}
                  </div>
                </div>
              ))
            ) : (
              <p className="hint">Topic patterns appear after marks are published.</p>
            )}
          </section>
          <section className="card card-pad">
            <div className="eyebrow">Classes and attendance</div>
            <h2 className="display" style={{ fontSize: "1.6rem", margin: ".3rem 0 1rem" }}>
              Learning context
            </h2>
            {student.enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                style={{ padding: ".65rem 0", borderBottom: "1px solid var(--line)" }}
              >
                <strong>{enrollment.class.name}</strong>
                <span className="hint" style={{ display: "block" }}>
                  {enrollment.class.subject} · Grade {enrollment.class.grade} ·
                  Joined {formatDate(enrollment.joinedAt)}
                </span>
              </div>
            ))}
            {attendance.slice(0, 6).map((record) => (
              <div
                key={record.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: ".6rem",
                  padding: ".4rem 0",
                  fontSize: ".82rem",
                }}
              >
                <span>
                  {formatDate(record.date)} · {record.class.name}
                </span>
                <span className="badge badge-teal">{record.status.toLowerCase()}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <section className="card card-pad" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Marks ledger</div>
            <h2>Published assessment history</h2>
          </div>
          <span className="badge badge-teal">
            {assessmentRows.length} record{assessmentRows.length === 1 ? "" : "s"}
          </span>
        </div>
        {assessmentRows.length ? (
          <div className="card table-wrap" style={{ border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Marks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assessmentRows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>
                      <strong>{row.title}</strong>
                      <div className="hint">{row.kind}</div>
                    </td>
                    <td>{row.className}</td>
                    <td>{formatDateTime(row.date)}</td>
                    <td>
                      <strong>{row.marks}/{row.maxMarks}</strong>
                      <div className="hint">
                        {row.maxMarks
                          ? `${Math.round((row.marks / row.maxMarks) * 100)}%`
                          : "—"}
                      </div>
                    </td>
                    <td><span className="badge badge-teal">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No assessment records"
            description="Published marks and completed quizzes will appear here."
          />
        )}
      </section>

      <section className="card card-pad" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Assigned work</div>
            <h2>Submission and completion status</h2>
          </div>
          <span className="badge badge-coral">
            {expectedAssignments.length} item
            {expectedAssignments.length === 1 ? "" : "s"}
          </span>
        </div>
        {expectedAssignments.length ? (
          <div className="card table-wrap" style={{ border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Class</th>
                  <th>Due</th>
                  <th>Student status</th>
                  <th>Class status</th>
                </tr>
              </thead>
              <tbody>
                {expectedAssignments.map((assignment) => {
                  const submission = submissions.find(
                    (item) => item.assignmentId === assignment.id,
                  );
                  return (
                    <tr key={assignment.id}>
                      <td><strong>{assignment.title}</strong></td>
                      <td>{assignment.class.name}</td>
                      <td>{formatDateTime(assignment.dueAt)}</td>
                      <td>
                        <span
                          className={`badge ${
                            submission && submission.status !== "DRAFT"
                              ? "badge-teal"
                              : "badge-coral"
                          }`}
                        >
                          {submission && submission.status !== "DRAFT"
                            ? submission.status.toLowerCase()
                            : "not submitted"}
                        </span>
                      </td>
                      <td>{assignment.status.toLowerCase()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No assigned work"
            description="Published and closed assignments will appear here."
          />
        )}
      </section>

      <div className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <section className="card card-pad">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Teacher feedback</div>
              <h2>Published guidance</h2>
            </div>
            <MessageSquareText color="var(--teal)" />
          </div>
          {feedbackItems.length ? (
            feedbackItems.map((submission) => (
              <div
                key={submission.id}
                style={{ padding: ".8rem 0", borderBottom: "1px solid var(--line)" }}
              >
                <strong>{submission.assignment.title}</strong>
                {submission.result?.teacherNote ? (
                  <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
                    {submission.result.teacherNote}
                  </p>
                ) : null}
                {submission.feedback.map((feedback) => (
                  <p className="hint" key={feedback.id} style={{ lineHeight: 1.55 }}>
                    {feedback.content}
                  </p>
                ))}
              </div>
            ))
          ) : (
            <p className="hint">No published teacher feedback is available yet.</p>
          )}
        </section>

        <section className="card card-pad">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Recent learning activity</div>
              <h2>Activity timeline</h2>
            </div>
            <CalendarCheck color="var(--indigo)" />
          </div>
          {activities.length ? (
            <div className="activity-list">
              {activities.map((activity) => (
                <div className="activity-item" key={activity.id}>
                  <span className="activity-icon"><CheckCircle2 size={15} /></span>
                  <div>
                    <strong style={{ display: "block", fontSize: ".83rem" }}>
                      {activity.action}
                    </strong>
                    <small className="hint">{formatDateTime(activity.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">No learning activity is recorded yet.</p>
          )}
        </section>
      </div>

      <section className="card card-pad" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">AI Studio learning history</div>
            <h2>Questions, searches, and study prompts</h2>
          </div>
          <Bot color="var(--indigo)" />
        </div>
        <p className="hint" style={{ maxWidth: 760 }}>
          Use these questions to understand where support may help. AI responses
          are study suggestions, not proof of mastery or teacher feedback.
        </p>
        {aiHistory.length ? (
          <div style={{ display: "grid", gap: ".7rem" }}>
            {aiHistory.map((entry) => {
              const topic = promptField(entry.prompt, "topic");
              const subject = promptField(entry.prompt, "subject");
              const grade = promptField(entry.prompt, "grade");
              const details = promptField(entry.prompt, "details");
              return (
                <details key={entry.id} className="card" style={{ padding: ".85rem 1rem" }}>
                  <summary style={{ cursor: "pointer", listStyle: "none" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <strong>{topic || "Untitled learning prompt"}</strong>
                        <div className="hint" style={{ marginTop: ".25rem" }}>
                          {entry.type.replaceAll("_", " ")} · {subject || "Subject not recorded"}
                          {grade ? ` · Grade ${grade}` : ""}
                        </div>
                      </div>
                      <span className="hint" style={{ whiteSpace: "nowrap" }}>
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </summary>
                  <div
                    style={{
                      marginTop: ".8rem",
                      paddingTop: ".8rem",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    {details ? (
                      <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.55 }}>
                        <strong>What they asked:</strong> {details}
                      </p>
                    ) : null}
                    <p
                      className="hint"
                      style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, marginBottom: 0 }}
                    >
                      {entry.output.slice(0, 700)}
                      {entry.output.length > 700 ? "…" : ""}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No AI Studio history"
            description="This student has not saved any AI Studio learning prompts yet."
          />
        )}
      </section>

      <section className="card card-pad" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Class updates</div>
            <h2>Recent announcements</h2>
          </div>
          <span className="badge badge-coral">
            {announcements.length} update{announcements.length === 1 ? "" : "s"}
          </span>
        </div>
        {announcements.length ? (
          <div className="grid-auto">
            {announcements.map((announcement) => (
              <article className="card card-pad" key={announcement.id}>
                <strong>{announcement.title}</strong>
                <div className="hint" style={{ margin: ".25rem 0 .6rem" }}>
                  {announcement.class.name} · {announcement.author.name} ·{" "}
                  {formatDateTime(announcement.publishedAt)}
                </div>
                <p style={{ color: "var(--muted)", lineHeight: 1.55, marginBottom: 0 }}>
                  {announcement.content}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="hint">No class announcements have been published yet.</p>
        )}
      </section>
      <p className="hint" style={{ marginTop: "1rem" }}>
        Privacy note: this parent view includes published academic information
        and learning activity only. Teacher drafts and account-security events
        are never shown.
      </p>
    </div>
  );
}
