import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, SafetyNote, StatCard } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

type TeacherDashboardMetrics = {
  classes: number;
  students: number;
  active: number;
  pending: number;
  results_count: number;
  average: number | null;
  announcements: number;
  generations: number;
  weakest_topic: string | null;
  weakest_average: number | null;
  weakest_evidence_count: number | null;
  activities: Array<{
    id: string;
    action: string;
    createdAt: string;
  }>;
};

export default async function TeacherDashboard() {
  const user = await requireUser("TEACHER");
  const tid = user.teacherProfile!.id;
  const [metrics] = await db.$queryRaw<TeacherDashboardMetrics[]>`
      WITH published_results AS (
        SELECT
          LEAST(
            100::numeric,
            GREATEST(0::numeric, (r."marks" / NULLIF(a."maxMarks", 0)) * 100)
          ) AS percentage,
          COALESCE(NULLIF(BTRIM(a."topic"), ''), BTRIM(a."title")) AS topic
        FROM "Result" r
        INNER JOIN "Submission" s ON s."id" = r."submissionId"
        INNER JOIN "Assignment" a ON a."id" = s."assignmentId"
        INNER JOIN "ClassRoom" c ON c."id" = a."classId"
        WHERE c."teacherId" = ${tid}
          AND r."published" = true
      ),
      topic_performance AS (
        SELECT
          MIN(topic) AS topic,
          ROUND(AVG(percentage))::int AS average,
          COUNT(*)::int AS evidence_count
        FROM published_results
        WHERE topic <> ''
        GROUP BY LOWER(topic)
      ),
      weakest_topic AS (
        SELECT topic, average, evidence_count
        FROM topic_performance
        ORDER BY average ASC, evidence_count DESC
        LIMIT 1
      )
      SELECT
        (SELECT COUNT(*)::int FROM "ClassRoom" c WHERE c."teacherId" = ${tid}) AS classes,
        (
          SELECT COUNT(*)::int
          FROM "ClassEnrollment" e
          INNER JOIN "ClassRoom" c ON c."id" = e."classId"
          WHERE c."teacherId" = ${tid}
        ) AS students,
        (
          SELECT COUNT(*)::int
          FROM "Assignment" a
          INNER JOIN "ClassRoom" c ON c."id" = a."classId"
          WHERE c."teacherId" = ${tid}
            AND a."status" = 'PUBLISHED'
            AND a."dueAt" >= CURRENT_TIMESTAMP
        ) AS active,
        (
          SELECT COUNT(*)::int
          FROM "Submission" s
          INNER JOIN "Assignment" a ON a."id" = s."assignmentId"
          INNER JOIN "ClassRoom" c ON c."id" = a."classId"
          WHERE c."teacherId" = ${tid}
            AND s."status" = 'SUBMITTED'
        ) AS pending,
        (SELECT COUNT(*)::int FROM published_results) AS results_count,
        (SELECT ROUND(AVG(percentage))::int FROM published_results) AS average,
        (
          SELECT COUNT(*)::int
          FROM "Announcement" n
          INNER JOIN "ClassRoom" c ON c."id" = n."classId"
          WHERE c."teacherId" = ${tid}
        ) AS announcements,
        (
          SELECT COUNT(*)::int
          FROM "AIContentGeneration" g
          WHERE g."userId" = ${user.id}
        ) AS generations,
        (SELECT topic FROM weakest_topic) AS weakest_topic,
        (SELECT average FROM weakest_topic) AS weakest_average,
        (SELECT evidence_count FROM weakest_topic) AS weakest_evidence_count,
        (
          SELECT COALESCE(
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', recent."id",
                'action', recent."action",
                'createdAt', recent."createdAt"
              )
              ORDER BY recent."createdAt" DESC
            ),
            '[]'::jsonb
          )
          FROM (
            SELECT l."id", l."action", l."createdAt"
            FROM "ActivityLog" l
            WHERE l."userId" = ${user.id}
            ORDER BY l."createdAt" DESC
            LIMIT 6
          ) recent
        ) AS activities
    `;
  const resolvedMetrics = metrics ?? {
    classes: 0,
    students: 0,
    active: 0,
    pending: 0,
    results_count: 0,
    average: null,
    announcements: 0,
    generations: 0,
    weakest_topic: null,
    weakest_average: null,
    weakest_evidence_count: null,
    activities: [],
  };
  const saved = Math.round(
    resolvedMetrics.generations * 18 + resolvedMetrics.results_count * 7,
  );
  const weakestTopic =
    resolvedMetrics.weakest_topic &&
    resolvedMetrics.weakest_average !== null &&
    resolvedMetrics.weakest_evidence_count !== null
      ? {
          topic: resolvedMetrics.weakest_topic,
          average: resolvedMetrics.weakest_average,
          evidenceCount: resolvedMetrics.weakest_evidence_count,
        }
      : null;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Teacher overview"
        title="Your teaching command centre"
        description="See what needs attention, pick up where you left off, and keep every class moving."
        action={
          <Link className="btn btn-primary" href="/teacher/ai-tools">
            <Sparkles size={17} /> Create with AI
          </Link>
        }
      />
      <div className="metric-strip">
        <StatCard
          label="Review queue"
          value={resolvedMetrics.pending}
          detail={resolvedMetrics.pending ? "Needs your attention" : "You’re all caught up"}
          icon={Clock3}
          tone="coral"
        />
        <StatCard
          label="Open work"
          value={resolvedMetrics.active}
          detail="Published assignments"
          icon={FileCheck2}
        />
        <StatCard
          label="Class average"
          value={resolvedMetrics.results_count ? `${resolvedMetrics.average}%` : "—"}
          detail={`${resolvedMetrics.results_count} published result${resolvedMetrics.results_count === 1 ? "" : "s"}`}
          icon={GraduationCap}
        />
        <StatCard
          label="Time assisted"
          value={`${saved}m`}
          detail="Estimated workload support"
          icon={Clock3}
          tone="gold"
        />
      </div>
      <div className="facts-strip" aria-label="Supporting teacher metrics">
        <div className="fact">
          <span>Classes</span>
          <strong>{resolvedMetrics.classes}</strong>
        </div>
        <div className="fact">
          <span>Students</span>
          <strong>{resolvedMetrics.students}</strong>
        </div>
        <div className="fact">
          <span>Announcements</span>
          <strong>{resolvedMetrics.announcements}</strong>
        </div>
        <div className="fact">
          <span>AI drafts</span>
          <strong>{resolvedMetrics.generations}</strong>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="card card-pad">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Priority briefing</div>
              <h2>Your most useful next move</h2>
            </div>
            <Sparkles color="var(--indigo)" />
          </div>
          <div
            className="recommendation-box"
            style={{
              marginBottom: ".7rem",
            }}
          >
            <strong>
              {resolvedMetrics.pending > 0
                ? `Review ${resolvedMetrics.pending} submitted response${resolvedMetrics.pending > 1 ? "s" : ""}`
                : weakestTopic
                  ? `Revisit ${weakestTopic.topic}`
                  : "Create the next learning activity"}
            </strong>
            <p
              style={{
                color: "var(--teal)",
                lineHeight: 1.55,
                margin: ".35rem 0 .7rem",
              }}
            >
              {resolvedMetrics.pending > 0
                ? "Start with the oldest submissions, use AI for a draft comment, then edit before publishing."
                : weakestTopic
                  ? `Published results currently average ${weakestTopic.average}% for this topic across ${weakestTopic.evidenceCount} result${weakestTopic.evidenceCount === 1 ? "" : "s"}. Verify the need using classroom evidence before acting.`
                  : "There is not enough result evidence for a topic recommendation yet. Create a lesson resource, assignment, or quiz for your next objective."}
            </p>
            <Link
              href={resolvedMetrics.pending > 0 ? "/teacher/review" : "/teacher/ai-tools"}
              style={{
                color: "var(--indigo)",
                fontWeight: 850,
                display: "inline-flex",
                gap: ".35rem",
                alignItems: "center",
              }}
            >
              Open suggested action <ArrowRight size={15} />
            </Link>
          </div>
          <SafetyNote />
        </section>
        <section className="card card-pad">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Recent activity</div>
              <h2>Workspace ledger</h2>
            </div>
            <CheckCircle2 color="var(--teal)" />
          </div>
          <div className="activity-list">
            {resolvedMetrics.activities.length ? (
              resolvedMetrics.activities.map((a) => (
                <div key={a.id} className="activity-item">
                  <span className="activity-icon">
                    <CheckCircle2 size={15} />
                  </span>
                  <div>
                    <strong style={{ display: "block", fontSize: ".83rem" }}>
                      {a.action}
                    </strong>
                    <small className="hint">
                      {formatDateTime(a.createdAt)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="hint">
                Your recent account activity will appear here.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
