import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningStreak, topicPerformance } from "@/lib/analytics";
import { PageHeader, StatCard } from "@/components/ui";
import { PdfActions } from "@/components/pdf-actions";

export default async function StudentAnalytics() {
  const user = await requireUser("STUDENT");
  const studentId = user.studentProfile!.id;
  const [assignments, submissions, attempts, activities] = await Promise.all([
    db.assignment.findMany({
      where: {
        status: { not: "DRAFT" },
        class: { enrollments: { some: { studentId } } },
      },
      select: { id: true },
    }),
    db.submission.findMany({
      where: { studentId, assignment: { status: { not: "DRAFT" } } },
      select: {
        status: true,
        updatedAt: true,
        assignment: {
          select: { maxMarks: true, topic: true, title: true },
        },
        result: { select: { marks: true, published: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
    db.quizAttempt.findMany({
      where: { studentId },
      select: {
        score: true,
        quiz: { select: { questions: { select: { marks: true } } } },
      },
    }),
    db.activityLog.findMany({
      where: { userId: user.id },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);
  const scored = submissions.filter(
    (submission) => submission.result?.published,
  );
  const scores = scored.map((submission) =>
    Math.round(
      (Number(submission.result!.marks) / submission.assignment.maxMarks) * 100,
    ),
  );
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const quizMaximum = attempts.reduce(
    (sum, attempt) =>
      sum +
      attempt.quiz.questions.reduce(
        (questionSum, question) => questionSum + question.marks,
        0,
      ),
    0,
  );
  const quizScore = attempts.reduce(
    (sum, attempt) => sum + Number(attempt.score),
    0,
  );
  const quizAccuracy = quizMaximum
    ? Math.round((quizScore / quizMaximum) * 100)
    : 0;
  const topics = topicPerformance(
    scored.map((submission) => ({
      topic: submission.assignment.topic,
      title: submission.assignment.title,
      marks: Number(submission.result!.marks),
      maxMarks: submission.assignment.maxMarks,
    })),
  );
  const weakTopic = topics[0];
  const strongTopic = topics.length > 1 ? topics.at(-1) : undefined;
  const streak = learningStreak(
    activities.map((activity) => activity.createdAt),
  );
  return (
    <div className="page">
      <PageHeader
        eyebrow="My progress"
        title="Use evidence to revise smarter"
        description="Progress is more than one mark. These patterns come from your own published results, quiz attempts, completion, and learning activity."
      />
      <div className="card card-pad" style={{ marginBottom: "1rem" }}>
        <div className="eyebrow">My progress report</div>
        <PdfActions
          label="My progress report"
          studentUrl={`/api/pdfs/report/${studentId}`}
        />
      </div>
      <div className="grid-auto">
        <StatCard
          label="Average score"
          value={scores.length ? `${average}%` : "—"}
          detail={
            scores.length
              ? `${scores.length} published result${scores.length === 1 ? "" : "s"}`
              : "No published results"
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Completed assignments"
          value={
            submissions.filter((submission) => submission.status !== "DRAFT")
              .length
          }
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending assignments"
          value={Math.max(
            0,
            assignments.length -
              submissions.filter((submission) => submission.status !== "DRAFT")
                .length,
          )}
          icon={Clock3}
          tone="coral"
        />
        <StatCard
          label="Quiz accuracy"
          value={attempts.length ? `${quizAccuracy}%` : "—"}
          icon={Target}
          tone="gold"
        />
        <StatCard
          label="Learning streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          icon={Flame}
          tone="coral"
        />
        <StatCard
          label="Practice attempts"
          value={attempts.length}
          icon={BookOpenCheck}
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
          <div className="eyebrow">Progress trend</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Recent marks
          </h2>
          {scores.length ? (
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: "1rem",
                height: 220,
                padding: "1rem 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {scores.slice(-8).map((score, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "end",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <strong style={{ fontSize: ".8rem" }}>{score}%</strong>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 58,
                      height: `${Math.max(score, 8)}%`,
                      background:
                        index === scores.slice(-8).length - 1
                          ? "var(--teal)"
                          : "var(--chart-teal-soft)",
                      borderRadius: "8px 8px 2px 2px",
                    }}
                  />
                  <small className="hint">
                    A{Math.max(1, scores.length - 7) + index}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">
              Your trend will appear after a teacher publishes a result.
            </p>
          )}
          <p className="hint">
            Use this trend with teacher feedback; different assessments can
            measure different skills.
          </p>
        </section>
        <aside className="card card-pad">
          <div className="eyebrow">Topic map</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            What to revisit
          </h2>
          {strongTopic && (
            <div
              style={{
                padding: ".8rem",
                background: "var(--teal-soft)",
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <strong>Strong: {strongTopic.topic}</strong>
              <p className="hint">
                {strongTopic.average}% average across{" "}
                {strongTopic.evidenceCount} result
                {strongTopic.evidenceCount === 1 ? "" : "s"}.
              </p>
            </div>
          )}
          {weakTopic ? (
            <div
              style={{
                padding: ".8rem",
                background: "var(--coral-soft)",
                borderRadius: 10,
              }}
            >
              <strong>Focus: {weakTopic.topic}</strong>
              <p className="hint">
                {weakTopic.average}% average across {weakTopic.evidenceCount}{" "}
                result{weakTopic.evidenceCount === 1 ? "" : "s"}.
              </p>
            </div>
          ) : (
            <p className="hint">
              Topic insights will appear once results are published.
            </p>
          )}
          <h3 style={{ fontSize: ".9rem", marginTop: "1.3rem" }}>
            Revision suggestion
          </h3>
          <p className="hint" style={{ lineHeight: 1.6 }}>
            {weakTopic
              ? `Retry one ${weakTopic.topic} example today, correct it tomorrow, and complete a mixed question after three days.`
              : "Complete assigned work and use teacher feedback to build your first revision cycle."}
          </p>
        </aside>
      </div>
    </div>
  );
}
