import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  HeartHandshake,
  Users,
} from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentPerformanceSummary } from "@/lib/student-insights";
import { formatDateTime } from "@/lib/utils";

export default async function ParentDashboard() {
  const user = await requireUser("PARENT");
  const connections = await db.parentStudent.findMany({
    where: { parentId: user.parentProfile!.id },
    include: {
      student: {
        include: {
          user: { select: { name: true, id: true } },
          enrollments: { include: { class: true } },
          submissions: {
            include: { assignment: true, result: true },
            orderBy: { updatedAt: "desc" },
          },
          quizAttempts: {
            include: { quiz: { include: { questions: true } } },
            orderBy: { submittedAt: "desc" },
          },
          attendance: true,
        },
      },
    },
    orderBy: { linkedAt: "asc" },
  });

  const studentCards = await Promise.all(
    connections.map(async ({ student, relationship }) => {
      const [expectedAssignments, aiSearches, recentActivity] =
        await Promise.all([
          db.assignment.count({
            where: {
              status: "PUBLISHED",
              class: { enrollments: { some: { studentId: student.id } } },
            },
          }),
          db.aIContentGeneration.count({ where: { userId: student.userId } }),
          db.activityLog.findFirst({
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
          }),
        ]);
      const publishedSubmissions = student.submissions.filter(
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
        ...student.quizAttempts.map((attempt) => ({
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
      const submitted = student.submissions.filter(
        (submission) => submission.status !== "DRAFT",
      ).length;
      const attendancePresent = student.attendance.filter(
        (record) => record.status === "PRESENT" || record.status === "LATE",
      ).length;
      return {
        student,
        relationship,
        aiSearches,
        recentActivity,
        summary: studentPerformanceSummary(
          scores,
          submitted,
          expectedAssignments,
        ),
        attendanceRate: student.attendance.length
          ? Math.round((attendancePresent / student.attendance.length) * 100)
          : null,
      };
    }),
  );

  const averages = studentCards
    .map((card) => card.summary.overallAverage)
    .filter((value): value is number => value !== null);
  const familyAverage = averages.length
    ? Math.round(averages.reduce((sum, value) => sum + value, 0) / averages.length)
    : null;
  const aiSearchCount = studentCards.reduce(
    (sum, card) => sum + card.aiSearches,
    0,
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Parent overview"
        title="Your family learning dashboard"
        description="Follow marks, attendance, learning activity, and AI Studio questions from one private workspace."
        action={
          <Link className="btn btn-primary" href="/parent/students">
            <HeartHandshake size={17} /> Manage children
          </Link>
        }
      />
      <div className="metric-strip">
        <StatCard
          label="Connected students"
          value={studentCards.length}
          detail="Private family connections"
          icon={Users}
        />
        <StatCard
          label="Family average"
          value={familyAverage === null ? "—" : `${familyAverage}%`}
          detail="Published marks and quizzes"
          icon={BarChart3}
          tone="gold"
        />
        <StatCard
          label="AI Studio searches"
          value={aiSearchCount}
          detail="Learning questions and prompts"
          icon={Bot}
          tone="coral"
        />
      </div>

      {studentCards.length ? (
        <div className="grid-auto" style={{ marginTop: "1rem" }}>
          {studentCards.map((card) => (
            <article className="card card-pad" key={card.student.id}>
              <div className="panel-head">
                <div>
                  <div className="eyebrow">
                    {card.relationship || "Student"}
                  </div>
                  <h2>{card.student.user.name}</h2>
                </div>
                <span className="badge badge-teal">
                  Grade {card.student.grade || "—"}
                </span>
              </div>
              <div className="facts-strip" style={{ margin: ".8rem 0" }}>
                <div className="fact">
                  <span>Average</span>
                  <strong>
                    {card.summary.overallAverage === null
                      ? "—"
                      : `${card.summary.overallAverage}%`}
                  </strong>
                </div>
                <div className="fact">
                  <span>Completion</span>
                  <strong>
                    {card.summary.completionRate === null
                      ? "—"
                      : `${card.summary.completionRate}%`}
                  </strong>
                </div>
                <div className="fact">
                  <span>Attendance</span>
                  <strong>
                    {card.attendanceRate === null
                      ? "—"
                      : `${card.attendanceRate}%`}
                  </strong>
                </div>
              </div>
              {card.recentActivity ? (
                <div className="activity-item">
                  <span className="activity-icon">
                    <CheckCircle2 size={15} />
                  </span>
                  <div>
                    <strong style={{ display: "block", fontSize: ".83rem" }}>
                      {card.recentActivity.action}
                    </strong>
                    <small className="hint">
                      {formatDateTime(card.recentActivity.createdAt)}
                    </small>
                  </div>
                </div>
              ) : (
                <p className="hint">No learning activity recorded yet.</p>
              )}
              <Link
                href={`/parent/students/${card.student.id}`}
                style={{
                  color: "var(--indigo)",
                  fontWeight: 850,
                  display: "inline-flex",
                  gap: ".35rem",
                  alignItems: "center",
                  marginTop: ".9rem",
                }}
              >
                View complete progress <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Connect a student to begin"
          description="Ask the student for their sign-in email and private parent access code, then create a secure family connection."
          action={
            <Link className="btn btn-primary" href="/parent/students">
              Connect a student
            </Link>
          }
        />
      )}
    </div>
  );
}
