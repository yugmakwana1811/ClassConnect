import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  FileCheck2,
  Target,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentPerformanceSummary } from "@/lib/student-insights";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { PdfActions } from "@/components/pdf-actions";

function promptField(prompt: Prisma.JsonValue, field: string) {
  if (!prompt || typeof prompt !== "object" || Array.isArray(prompt))
    return "";
  const value = (prompt as Record<string, Prisma.JsonValue>)[field];
  return typeof value === "string" ? value : "";
}

export default async function StudentInsights({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, requireUser("TEACHER")]);
  const teacherId = user.teacherProfile!.id;
  const student = await db.studentProfile.findFirst({
    where: {
      id,
      enrollments: { some: { class: { teacherId } } },
    },
    include: {
      user: { select: { name: true } },
      enrollments: {
        where: { class: { teacherId } },
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
    assignedAssessments,
    submissions,
    quizAttempts,
    attendance,
    history,
    historyCount,
  ] =
    await Promise.all([
      db.assignment.findMany({
        where: {
          status: { not: "DRAFT" },
          class: {
            teacherId,
            enrollments: { some: { studentId: student.id } },
          },
        },
        select: { id: true },
      }),
      db.submission.findMany({
        where: {
          studentId: student.id,
          assignment: { status: { not: "DRAFT" }, class: { teacherId } },
        },
        include: {
          assignment: {
            include: { class: true },
          },
          result: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.quizAttempt.findMany({
        where: {
          studentId: student.id,
          quiz: { class: { teacherId } },
        },
        include: {
          quiz: {
            include: {
              class: true,
              questions: { select: { marks: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      }),
      db.attendanceRecord.findMany({
        where: { studentId: student.id, class: { teacherId } },
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
          approved: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.aIContentGeneration.count({ where: { userId: student.userId } }),
    ]);

  const scores = [
    ...submissions
      .filter((submission) => submission.result)
      .map((submission) => ({
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
        (sum, question) => sum + question.marks,
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
    assignedAssessments.length,
  );
  const attendancePresent = attendance.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE",
  ).length;
  const attendanceRate = attendance.length
    ? Math.round((attendancePresent / attendance.length) * 100)
    : null;
  const assessmentRows = [
    ...submissions
      .filter((submission) => submission.result)
      .map((submission) => ({
        id: submission.id,
        kind: "Assignment",
        title: submission.assignment.title,
        className: submission.assignment.class.name,
        marks: Number(submission.result!.marks),
        maxMarks: submission.assignment.maxMarks,
        date: submission.result!.publishedAt ?? submission.updatedAt,
        published: submission.result!.published,
        status: submission.result!.published ? "published" : "teacher-only",
      })),
    ...quizAttempts.map((attempt) => ({
      id: attempt.id,
      kind: "Quiz",
      title: attempt.quiz.title,
      className: attempt.quiz.class.name,
      marks: Number(attempt.score),
      maxMarks: attempt.quiz.questions.reduce(
        (sum, question) => sum + question.marks,
        0,
      ),
      date: attempt.submittedAt,
      published: true,
      status: "auto-graded",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentAttendance = attendance.slice(0, 6);

  return (
    <div className="page">
      <Link
        href="/teacher/classes"
        className="hint"
        style={{
          display: "inline-flex",
          gap: ".4rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> All classes
      </Link>
      <PageHeader
        eyebrow="Student learning profile"
        title={student.user.name}
        description="Review marks, performance patterns, and AI Studio learning questions together before your next check-in."
        action={
          <Link className="btn btn-secondary" href="/teacher/review">
            <FileCheck2 size={16} /> Review submitted work
          </Link>
        }
      />
      <div className="card card-pad" style={{ marginBottom: "1rem" }}>
        <div className="eyebrow">Downloadable progress report</div>
        <PdfActions
          label={`${student.user.name} progress report`}
          studentUrl={`/api/pdfs/report/${student.id}`}
        />
      </div>

      <div className="facts-strip" aria-label="Student details">
        <div className="fact">
          <span>Roll number</span>
          <strong>{student.rollNumber ?? "—"}</strong>
        </div>
        <div className="fact">
          <span>Grade</span>
          <strong>{student.grade ?? "—"}</strong>
        </div>
        <div className="fact">
          <span>Classes with you</span>
          <strong>{student.enrollments.length}</strong>
        </div>
        <div className="fact">
          <span>AI Studio searches</span>
          <strong>{historyCount}</strong>
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
          detail={`${summary.assignmentCount} marked assignment${summary.assignmentCount === 1 ? "" : "s"}`}
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
          detail={`${submittedCount} submitted of ${assignedAssessments.length} assigned`}
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
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
              title="No marks recorded yet"
              description="Published assignment results and completed quiz attempts will appear here."
            />
          )}
          <p className="hint" style={{ marginBottom: 0 }}>
            Use this trend as a conversation starter; different assessments can
            measure different skills.
          </p>
        </section>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <section className="card card-pad">
            <div className="eyebrow">Teaching context</div>
            <h2 className="display" style={{ fontSize: "1.6rem", margin: ".3rem 0 1rem" }}>
              Topics to revisit
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
                    {topic.evidenceCount} assignment result
                    {topic.evidenceCount === 1 ? "" : "s"}
                  </div>
                </div>
              ))
            ) : (
              <p className="hint">Topic patterns appear after assignments are marked.</p>
            )}
          </section>
          <section className="card card-pad">
            <div className="eyebrow">Attendance and enrollment</div>
            <h2 className="display" style={{ fontSize: "1.6rem", margin: ".3rem 0 1rem" }}>
              Class context
            </h2>
            {student.enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/teacher/classes/${enrollment.class.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: ".6rem",
                  padding: ".7rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>
                  <strong>{enrollment.class.name}</strong>
                  <span className="hint" style={{ display: "block" }}>
                    {enrollment.class.subject} · Grade {enrollment.class.grade}
                  </span>
                </span>
                <span className="hint">Joined {formatDate(enrollment.joinedAt)}</span>
              </Link>
            ))}
            {recentAttendance.length ? (
              <div style={{ marginTop: "1rem" }}>
                <div className="hint" style={{ marginBottom: ".45rem" }}>
                  Recent attendance
                </div>
                {recentAttendance.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: ".35rem 0",
                      fontSize: ".82rem",
                    }}
                  >
                    <span>{formatDate(record.date)}</span>
                    <span className="badge badge-teal">{record.status.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <section className="card card-pad" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Marks ledger</div>
            <h2>Assessment history</h2>
          </div>
          <span className="badge badge-teal">
            {assessmentRows.length} record{assessmentRows.length === 1 ? "" : "s"}
          </span>
        </div>
        {assessmentRows.length ? (
          <div
            className="card table-wrap"
            role="region"
            aria-label="Assessment history"
            tabIndex={0}
            style={{ border: 0 }}
          >
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
                        {row.maxMarks ? `${Math.round((row.marks / row.maxMarks) * 100)}%` : "—"}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${row.published ? "badge-teal" : "badge-coral"}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No assessment records"
            description="This student has no marks or quiz attempts in your classes yet."
          />
        )}
      </section>

      <section className="card card-pad" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">AI Studio learning history</div>
            <h2>Questions and study prompts</h2>
          </div>
          <span className="badge badge-coral">
            {history.length} search{history.length === 1 ? "" : "es"}
          </span>
        </div>
        <p className="hint" style={{ maxWidth: 760 }}>
          These are the student&apos;s account-level AI Studio prompts. Use the
          topics and context to shape a careful follow-up; AI responses are
          suggestions, not evidence of mastery.
        </p>
        {history.length ? (
          <div style={{ display: "grid", gap: ".7rem" }}>
            {history.map((entry) => {
              const topic = promptField(entry.prompt, "topic");
              const subject = promptField(entry.prompt, "subject");
              const grade = promptField(entry.prompt, "grade");
              const details = promptField(entry.prompt, "details");
              return (
                <details key={entry.id} className="card" style={{ padding: "0.85rem 1rem" }}>
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
                        <strong>What they tried:</strong> {details}
                      </p>
                    ) : null}
                    <p
                      className="hint"
                      style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, marginBottom: 0 }}
                    >
                      {entry.output.slice(0, 500)}
                      {entry.output.length > 500 ? "…" : ""}
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
    </div>
  );
}
