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

type ParentDashboardStudent = {
  student_id: string;
  user_id: string;
  student_name: string;
  grade: string | null;
  relationship: string | null;
  scores: Array<{
    kind: "assignment" | "quiz";
    title: string;
    topic: string | null;
    marks: number;
    maxMarks: number;
    date: string;
  }>;
  submitted: number;
  expected_assignments: number;
  attendance_records: number;
  attendance_present: number;
  ai_searches: number;
  recent_activity: {
    action: string;
    createdAt: string;
  } | null;
};

export default async function ParentDashboard() {
  const user = await requireUser("PARENT");
  const connections = await db.$queryRaw<ParentDashboardStudent[]>`
    SELECT
      student."id" AS student_id,
      student."userId" AS user_id,
      student_user."name" AS student_name,
      student."grade",
      connection."relationship",
      (
        SELECT COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'kind', score.kind,
              'title', score.title,
              'topic', score.topic,
              'marks', score.marks,
              'maxMarks', score.max_marks,
              'date', score.score_date
            )
            ORDER BY score.score_date DESC
          ),
          '[]'::jsonb
        )
        FROM (
          SELECT
            'assignment'::text AS kind,
            assignment."title",
            assignment."topic",
            result."marks"::double precision AS marks,
            assignment."maxMarks" AS max_marks,
            COALESCE(result."publishedAt", submission."updatedAt") AS score_date
          FROM "Submission" submission
          INNER JOIN "Assignment" assignment
            ON assignment."id" = submission."assignmentId"
          INNER JOIN "Result" result
            ON result."submissionId" = submission."id"
          WHERE submission."studentId" = student."id"
            AND result."published" = true

          UNION ALL

          SELECT
            'quiz'::text AS kind,
            quiz."title",
            NULL::text AS topic,
            attempt."score"::double precision AS marks,
            COALESCE(SUM(question."marks"), 0)::int AS max_marks,
            attempt."submittedAt" AS score_date
          FROM "QuizAttempt" attempt
          INNER JOIN "Quiz" quiz ON quiz."id" = attempt."quizId"
          LEFT JOIN "QuizQuestion" question ON question."quizId" = quiz."id"
          WHERE attempt."studentId" = student."id"
          GROUP BY attempt."id", quiz."id"
        ) score
      ) AS scores,
      (
        SELECT COUNT(*)::int
        FROM "Submission" submission
        INNER JOIN "Assignment" assignment
          ON assignment."id" = submission."assignmentId"
        WHERE submission."studentId" = student."id"
          AND submission."status" <> 'DRAFT'
          AND assignment."status" <> 'DRAFT'
      ) AS submitted,
      (
        SELECT COUNT(*)::int
        FROM "Assignment" assignment
        WHERE assignment."status" <> 'DRAFT'
          AND EXISTS (
            SELECT 1
            FROM "ClassEnrollment" enrollment
            WHERE enrollment."studentId" = student."id"
              AND enrollment."classId" = assignment."classId"
          )
      ) AS expected_assignments,
      (
        SELECT COUNT(*)::int
        FROM "AttendanceRecord" attendance
        WHERE attendance."studentId" = student."id"
      ) AS attendance_records,
      (
        SELECT COUNT(*)::int
        FROM "AttendanceRecord" attendance
        WHERE attendance."studentId" = student."id"
          AND attendance."status" IN ('PRESENT', 'LATE')
      ) AS attendance_present,
      (
        SELECT COUNT(*)::int
        FROM "AIContentGeneration" generation
        WHERE generation."userId" = student."userId"
      ) AS ai_searches,
      (
        SELECT JSONB_BUILD_OBJECT(
          'action', activity."action",
          'createdAt', activity."createdAt"
        )
        FROM "ActivityLog" activity
        WHERE activity."userId" = student."userId"
          AND activity."entityType" IN (
            'AIContentGeneration',
            'Submission',
            'Result',
            'QuizAttempt',
            'ClassRoom'
          )
        ORDER BY activity."createdAt" DESC
        LIMIT 1
      ) AS recent_activity
    FROM "ParentStudent" connection
    INNER JOIN "StudentProfile" student
      ON student."id" = connection."studentId"
    INNER JOIN "User" student_user ON student_user."id" = student."userId"
    WHERE connection."parentId" = ${user.parentProfile!.id}
    ORDER BY connection."linkedAt" ASC
  `;

  const studentCards = connections.map((connection) => {
      const scores = connection.scores.map((score) => ({
        ...score,
        date: new Date(score.date),
      }));
      return {
        student: {
          id: connection.student_id,
          userId: connection.user_id,
          grade: connection.grade,
          user: { name: connection.student_name },
        },
        relationship: connection.relationship,
        aiSearches: connection.ai_searches,
        recentActivity: connection.recent_activity,
        summary: studentPerformanceSummary(
          scores,
          connection.submitted,
          connection.expected_assignments,
        ),
        attendanceRate: connection.attendance_records
          ? Math.round(
              (connection.attendance_present / connection.attendance_records) *
                100,
            )
          : null,
      };
    });

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
