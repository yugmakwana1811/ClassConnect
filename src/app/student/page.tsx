import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Flame,
  GraduationCap,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningStreak, topicPerformance } from "@/lib/analytics";
import { PageHeader, StatCard } from "@/components/ui";
import { formatDate, relativeDue } from "@/lib/utils";

type StudentDashboardData = {
  enrollments_count: number;
  pending_count: number;
  completed_count: number;
  next_assignments: Array<{
    id: string;
    title: string;
    maxMarks: number;
    dueAt: string;
    className: string;
  }>;
  published_results: Array<{
    title: string;
    topic: string | null;
    marks: number;
    maxMarks: number;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    className: string;
  }>;
  activity_dates: string[];
};

export default async function StudentDashboard() {
  const user = await requireUser("STUDENT");
  const studentId = user.studentProfile!.id;
  const [dashboard] = await db.$queryRaw<StudentDashboardData[]>`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM "ClassEnrollment" enrollment
        WHERE enrollment."studentId" = ${studentId}
      ) AS enrollments_count,
      (
        SELECT COUNT(*)::int
        FROM "Assignment" assignment
        WHERE assignment."status" = 'PUBLISHED'
          AND EXISTS (
            SELECT 1
            FROM "ClassEnrollment" enrollment
            WHERE enrollment."studentId" = ${studentId}
              AND enrollment."classId" = assignment."classId"
          )
          AND NOT EXISTS (
            SELECT 1
            FROM "Submission" submission
            WHERE submission."studentId" = ${studentId}
              AND submission."assignmentId" = assignment."id"
              AND submission."status" <> 'DRAFT'
          )
      ) AS pending_count,
      (
        SELECT COUNT(*)::int
        FROM "Submission" submission
        WHERE submission."studentId" = ${studentId}
          AND submission."status" <> 'DRAFT'
      ) AS completed_count,
      (
        SELECT COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', pending."id",
              'title', pending."title",
              'maxMarks', pending."maxMarks",
              'dueAt', pending."dueAt",
              'className', pending.class_name
            )
            ORDER BY pending."dueAt" ASC
          ),
          '[]'::jsonb
        )
        FROM (
          SELECT
            assignment."id",
            assignment."title",
            assignment."maxMarks",
            assignment."dueAt",
            classroom."name" AS class_name
          FROM "Assignment" assignment
          INNER JOIN "ClassRoom" classroom
            ON classroom."id" = assignment."classId"
          WHERE assignment."status" = 'PUBLISHED'
            AND EXISTS (
              SELECT 1
              FROM "ClassEnrollment" enrollment
              WHERE enrollment."studentId" = ${studentId}
                AND enrollment."classId" = assignment."classId"
            )
            AND NOT EXISTS (
              SELECT 1
              FROM "Submission" submission
              WHERE submission."studentId" = ${studentId}
                AND submission."assignmentId" = assignment."id"
                AND submission."status" <> 'DRAFT'
            )
          ORDER BY assignment."dueAt" ASC
          LIMIT 5
        ) pending
      ) AS next_assignments,
      (
        SELECT COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'title', result_rows."title",
              'topic', result_rows."topic",
              'marks', result_rows.marks,
              'maxMarks', result_rows."maxMarks"
            )
            ORDER BY result_rows."updatedAt" DESC
          ),
          '[]'::jsonb
        )
        FROM (
          SELECT
            assignment."title",
            assignment."topic",
            result."marks"::double precision AS marks,
            assignment."maxMarks",
            submission."updatedAt"
          FROM "Submission" submission
          INNER JOIN "Assignment" assignment
            ON assignment."id" = submission."assignmentId"
          INNER JOIN "Result" result
            ON result."submissionId" = submission."id"
          WHERE submission."studentId" = ${studentId}
            AND result."published" = true
        ) result_rows
      ) AS published_results,
      (
        SELECT COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', recent."id",
              'title', recent."title",
              'className', recent.class_name
            )
            ORDER BY recent."publishedAt" DESC
          ),
          '[]'::jsonb
        )
        FROM (
          SELECT
            announcement."id",
            announcement."title",
            announcement."publishedAt",
            classroom."name" AS class_name
          FROM "Announcement" announcement
          INNER JOIN "ClassRoom" classroom
            ON classroom."id" = announcement."classId"
          WHERE EXISTS (
            SELECT 1
            FROM "ClassEnrollment" enrollment
            WHERE enrollment."studentId" = ${studentId}
              AND enrollment."classId" = announcement."classId"
          )
          ORDER BY announcement."publishedAt" DESC
          LIMIT 2
        ) recent
      ) AS announcements,
      (
        SELECT COALESCE(
          JSONB_AGG(activity."createdAt" ORDER BY activity."createdAt" DESC),
          '[]'::jsonb
        )
        FROM (
          SELECT log."createdAt"
          FROM "ActivityLog" log
          WHERE log."userId" = ${user.id}
          ORDER BY log."createdAt" DESC
          LIMIT 120
        ) activity
      ) AS activity_dates
  `;
  const data = dashboard ?? {
    enrollments_count: 0,
    pending_count: 0,
    completed_count: 0,
    next_assignments: [],
    published_results: [],
    announcements: [],
    activity_dates: [],
  };
  const pending = data.next_assignments.map((assignment) => ({
    ...assignment,
    dueAt: new Date(assignment.dueAt),
  }));
  const results = data.published_results;
  const recent = results[0];
  const average = results.length
    ? Math.round(
        results.reduce(
          (sum, submission) =>
            sum +
            (submission.marks / submission.maxMarks) * 100,
          0,
        ) / results.length,
      )
    : 0;
  const topics = topicPerformance(
    results.map((submission) => ({
      topic: submission.topic,
      title: submission.title,
      marks: submission.marks,
      maxMarks: submission.maxMarks,
    })),
  );
  const weakTopic = topics[0];
  const streak = learningStreak(
    data.activity_dates.map((date) => new Date(date)),
  );
  return (
    <div className="page">
      <PageHeader
        eyebrow="Student overview"
        title="Learn with a clear next step"
        description="See what is due, submit work with confidence, and use teacher-published feedback to guide revision."
        action={
          <Link className="btn btn-primary" href="/student/ai-help" prefetch={false}>
            <Sparkles size={16} /> Ask study assistant
          </Link>
        }
      />
      <div className="metric-strip">
        <StatCard
          label="Pending work"
          value={data.pending_count}
          detail={pending[0] ? relativeDue(pending[0].dueAt) : "Nothing due"}
          icon={Clock3}
          tone="coral"
        />
        <StatCard
          label="Recent mark"
          value={
            recent
              ? `${recent.marks}/${recent.maxMarks}`
              : "—"
          }
          detail={recent?.title ?? "No published result"}
          icon={GraduationCap}
          tone="gold"
        />
        <StatCard
          label="Average"
          value={results.length ? `${average}%` : "—"}
          icon={BookOpenCheck}
        />
        <StatCard
          label="Learning streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          detail={streak ? "Keep the rhythm" : "Start with one learning action"}
          icon={Flame}
          tone="coral"
        />
      </div>
      <div className="facts-strip" aria-label="Supporting student metrics">
        <div className="fact">
          <span>Joined classes</span>
          <strong>{data.enrollments_count}</strong>
        </div>
        <div className="fact">
          <span>Completed work</span>
          <strong>{data.completed_count}</strong>
        </div>
        <div className="fact">
          <span>Published results</span>
          <strong>{results.length}</strong>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="card card-pad">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Now & next</div>
              <h2>Your next deadlines</h2>
            </div>
            <Clock3 color="var(--indigo)" />
          </div>
          {pending.length ? (
            pending.slice(0, 5).map((assignment) => (
              <Link
                key={assignment.id}
                href={`/student/assignments/${assignment.id}`}
                prefetch={false}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: ".9rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <strong>{assignment.title}</strong>
                  <div className="hint">
                    {assignment.className} · {assignment.maxMarks} marks
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-coral">
                    {relativeDue(assignment.dueAt)}
                  </span>
                  <div className="hint" style={{ marginTop: 4 }}>
                    {formatDate(assignment.dueAt)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div
              style={{
                padding: "1rem",
                background: "var(--teal-soft)",
                borderRadius: 10,
              }}
            >
              <strong>You’re up to date.</strong>
              <p className="hint" style={{ marginBottom: 0 }}>
                Use this time for a short retrieval practice session.
              </p>
            </div>
          )}
          <Link
            href="/student/assignments"
            prefetch={false}
              style={{
                display: "inline-flex",
                gap: 5,
                alignItems: "center",
                color: "var(--indigo)",
              fontWeight: 800,
              fontSize: ".82rem",
              marginTop: "1rem",
            }}
          >
            View all assigned work <ArrowRight size={15} />
          </Link>
        </section>
        <aside style={{ display: "grid", gap: "1rem" }}>
          <section className="card card-pad recommendation-box">
            <div className="eyebrow">Study tip</div>
            <h2 style={{ fontSize: "1.35rem", margin: ".4rem 0 .5rem" }}>
              {weakTopic
                ? `Revisit ${weakTopic.topic}`
                : "Build your first evidence trail"}
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              {weakTopic
                ? `Your published results currently average ${weakTopic.average}% for this topic. Redo one example without notes, compare it with feedback, then explain the corrected step aloud.`
                : "Complete assigned work and quizzes. Once results are published, ClassConnect will identify topics worth revisiting without making final learning decisions for you."}
            </p>
            <Link
              href="/student/ai-help"
              prefetch={false}
              style={{
                color: "var(--indigo)",
                fontWeight: 800,
                fontSize: ".82rem",
              }}
            >
              Build a revision plan
            </Link>
          </section>
          <section className="card card-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Megaphone size={18} color="var(--coral)" />
              <div className="eyebrow">Announcements</div>
            </div>
            {data.announcements.length ? (
              data.announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  style={{
                    padding: ".8rem 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <strong style={{ fontSize: ".84rem" }}>
                    {announcement.title}
                  </strong>
                  <div className="hint">{announcement.className}</div>
                </div>
              ))
            ) : (
              <p className="hint">No announcements yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
