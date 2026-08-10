import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Medal,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { topicPerformance } from "@/lib/analytics";
import { PageHeader, StatCard } from "@/components/ui";
import { StudentProgressGraph } from "@/components/student-progress-graph";

export default async function TeacherAnalytics() {
  const user = await requireUser("TEACHER");
  const teacherId = user.teacherProfile!.id;
  const [assignments, submissions, attendance, quizAttempts, generations] =
    await Promise.all([
      db.assignment.findMany({
        where: { status: { not: "DRAFT" }, class: { teacherId } },
        select: {
          class: { select: { _count: { select: { enrollments: true } } } },
        },
      }),
      db.submission.findMany({
        where: { assignment: { class: { teacherId } } },
        select: {
          status: true,
          result: { select: { marks: true, published: true } },
          assignment: {
            select: { maxMarks: true, topic: true, title: true },
          },
          student: { select: { id: true, user: { select: { name: true } } } },
        },
      }),
      db.attendanceRecord.findMany({
        where: { class: { teacherId } },
        select: { status: true },
      }),
      db.quizAttempt.findMany({
        where: { quiz: { class: { teacherId } } },
        select: {
          score: true,
          quiz: { select: { questions: { select: { marks: true } } } },
        },
      }),
      db.aIContentGeneration.count({ where: { userId: user.id } }),
    ]);
  const scored = submissions.filter(
    (submission) => submission.result?.published,
  );
  const percentages = scored.map(
    (submission) =>
      (Number(submission.result!.marks) / submission.assignment.maxMarks) * 100,
  );
  const average = percentages.length
    ? Math.round(
        percentages.reduce((sum, score) => sum + score, 0) / percentages.length,
      )
    : 0;
  const completed = submissions.filter(
    (submission) => submission.status !== "DRAFT",
  ).length;
  const expected = assignments.reduce(
    (sum, assignment) => sum + assignment.class._count.enrollments,
    0,
  );
  const completionRate = expected
    ? Math.round((completed / expected) * 100)
    : 0;
  const present = attendance.filter(
    (record) => record.status === "PRESENT",
  ).length;
  const attendanceRate = attendance.length
    ? Math.round((present / attendance.length) * 100)
    : 0;
  const studentsNeedingAttention = [
    ...new Map(
      scored
        .filter(
          (submission) =>
            Number(submission.result!.marks) / submission.assignment.maxMarks <
            0.6,
        )
        .map((submission) => [
          submission.student.id,
          { id: submission.student.id, name: submission.student.user.name },
        ]),
    ).values(),
  ];
  const topics = topicPerformance(
    scored.map((submission) => ({
      topic: submission.assignment.topic,
      title: submission.assignment.title,
      marks: Number(submission.result!.marks),
      maxMarks: submission.assignment.maxMarks,
    })),
  );
  const quizMaximum = quizAttempts.reduce(
    (sum, attempt) =>
      sum +
      attempt.quiz.questions.reduce(
        (inner, question) => inner + question.marks,
        0,
      ),
    0,
  );
  const quizScore = quizAttempts.reduce(
    (sum, attempt) => sum + Number(attempt.score),
    0,
  );
  const quizAccuracy = quizMaximum
    ? Math.round((quizScore / quizMaximum) * 100)
    : 0;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Teacher analytics"
        title="Signals for your next teaching move"
        description="These patterns use current classroom records. Use them to support professional judgment, and check small samples against classroom evidence."
      />
      <div className="grid-auto">
        <StatCard
          label="Class average"
          value={percentages.length ? `${average}%` : "—"}
          detail="Published results"
          icon={TrendingUp}
        />
        <StatCard
          label="Completion rate"
          value={`${completionRate}%`}
          detail={`${completed} submitted of ${expected} expected`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending submissions"
          value={
            submissions.filter(
              (submission) => submission.status === "SUBMITTED",
            ).length
          }
          icon={Clock3}
          tone="coral"
        />
        <StatCard
          label="Checked submissions"
          value={
            submissions.filter((submission) =>
              ["REVIEWED", "PUBLISHED"].includes(submission.status),
            ).length
          }
          icon={CheckCircle2}
        />
        <StatCard
          label="Highest score"
          value={
            percentages.length
              ? `${Math.round(Math.max(...percentages))}%`
              : "—"
          }
          icon={Medal}
          tone="gold"
        />
        <StatCard
          label="Lowest score"
          value={
            percentages.length
              ? `${Math.round(Math.min(...percentages))}%`
              : "—"
          }
          icon={BarChart3}
          tone="coral"
        />
        <StatCard
          label="Attendance"
          value={attendance.length ? `${attendanceRate}%` : "—"}
          detail={`${present} present records`}
          icon={Users}
        />
        <StatCard
          label="Workload saved"
          value={`${Math.round(generations * 18 + scored.length * 7)}m`}
          detail="Estimate, not measured time"
          icon={Clock3}
          tone="gold"
        />
      </div>
      <StudentProgressGraph />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <section className="card card-pad">
          <div className="eyebrow">Topic insight</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Concepts to revisit
          </h2>
          {topics.length ? (
            topics.slice(0, 5).map((topic, index) => (
              <div key={topic.topic} style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: ".83rem",
                    fontWeight: 750,
                    marginBottom: ".35rem",
                  }}
                >
                  <span>{topic.topic}</span>
                  <span>
                    {topic.average}% · {topic.evidenceCount} result
                    {topic.evidenceCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: `${topic.average}%`,
                      background: index === 0 ? "var(--coral)" : "var(--teal)",
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="hint">
              Topic insights will appear after assessed work has published
              results.
            </p>
          )}
          <p className="hint">
            Topics with fewer results are weaker evidence; combine these signals
            with observation and learner work.
          </p>
        </section>
        <section className="card card-pad">
          <div className="eyebrow">Learner attention</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Students to check in with
          </h2>
          {studentsNeedingAttention.length ? (
            studentsNeedingAttention.map((student) => (
              <div
                key={student.id}
                style={{
                  display: "flex",
                  gap: ".7rem",
                  alignItems: "center",
                  padding: ".8rem",
                  background: "var(--coral-soft)",
                  borderRadius: 10,
                  marginBottom: ".5rem",
                }}
              >
                <AlertTriangle size={18} color="var(--coral)" />
                <div>
                  <Link
                    href={`/teacher/students/${student.id}`}
                    style={{ fontWeight: 850 }}
                  >
                    {student.name}
                  </Link>
                  <div className="hint">
                    A published score is below 60%; review the work and
                    classroom context.
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "1rem",
                background: "var(--teal-soft)",
                borderRadius: 10,
              }}
            >
              <strong>No score-based flags</strong>
              <p className="hint">
                Continue using classroom observation alongside assessment data.
              </p>
            </div>
          )}
          <h3 style={{ marginTop: "1.5rem" }}>Quiz performance</h3>
          <p className="hint">
            {quizAttempts.length
              ? `${quizAttempts.length} attempts recorded · ${quizAccuracy}% overall accuracy.`
              : "No quiz attempts yet; publish a quiz for a quick concept check."}
          </p>
        </section>
      </div>
    </div>
  );
}
