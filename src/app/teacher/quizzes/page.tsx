import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileQuestion,
  Plus,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, EmptyState, PageHeader, StatCard } from "@/components/ui";

export default async function TeacherQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const [{ success }, user] = await Promise.all([
    searchParams,
    requireUser("TEACHER"),
  ]);
  const quizzes = await db.quiz.findMany({
    where: { class: { teacherId: user.teacherProfile!.id } },
    include: {
      class: true,
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="page">
      <PageHeader
        eyebrow="Quiz management"
        title="Build, publish, understand"
        description="Create real quizzes for any class and use attempts as one signal alongside classroom evidence."
        action={
          <Link className="btn btn-primary" href="/teacher/quizzes/new">
            <Plus size={16} /> Create quiz
          </Link>
        }
      />
      <Alert success={success} />
      <div className="grid-auto" style={{ marginBottom: "1rem" }}>
        <StatCard
          label="All quizzes"
          value={quizzes.length}
          icon={FileQuestion}
        />
        <StatCard
          label="Published"
          value={quizzes.filter((quiz) => quiz.published).length}
          icon={CheckCircle2}
        />
        <StatCard
          label="Learner attempts"
          value={quizzes.reduce((sum, quiz) => sum + quiz._count.attempts, 0)}
          icon={Users}
          tone="coral"
        />
      </div>
      {quizzes.length ? (
        <div
          className="card table-wrap"
          role="region"
          aria-label="Quiz list"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Class</th>
                <th>Questions</th>
                <th>Attempts</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <strong>{quiz.title}</strong>
                    <div className="hint">
                      {quiz.timeLimit
                        ? `Suggested ${quiz.timeLimit} minutes`
                        : "Self-paced"}
                    </div>
                  </td>
                  <td>{quiz.class.name}</td>
                  <td>{quiz._count.questions}</td>
                  <td>{quiz._count.attempts}</td>
                  <td>
                    <span
                      className={`badge ${quiz.published ? "badge-teal" : ""}`}
                    >
                      {quiz.published ? "published" : "draft"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/teacher/quizzes/${quiz.id}`}
                      aria-label={`Open ${quiz.title}`}
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
          title="No quizzes yet"
          description="Build a question set, review every answer and explanation, then publish it to a class."
          action={
            <Link className="btn btn-primary" href="/teacher/quizzes/new">
              Create quiz
            </Link>
          }
        />
      )}
    </div>
  );
}
