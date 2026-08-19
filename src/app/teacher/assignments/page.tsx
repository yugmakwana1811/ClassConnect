import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  Plus,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatDate, relativeDue } from "@/lib/utils";
import { assignmentStatusLabel } from "@/lib/workflow-status";
export default async function Assignments() {
  const user = await requireUser("TEACHER");
  const list = await db.assignment.findMany({
    where: { class: { teacherId: user.teacherProfile!.id } },
    select: {
      id: true,
      title: true,
      type: true,
      maxMarks: true,
      dueAt: true,
      status: true,
      class: { select: { name: true, subject: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const published = list.filter((a) => a.status === "PUBLISHED").length;
  const due = list.filter(
    (a) => a.status === "PUBLISHED" && a.dueAt >= new Date(),
  ).length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Assignments and tests"
        title="Plan, publish, collect"
        description="Manage homework, tests, worksheets, question papers, and practice in one place."
        action={
          <Link className="btn btn-primary" href="/teacher/assignments/new">
            <Plus size={16} /> Create assignment
          </Link>
        }
      />
      <div className="grid-auto" style={{ marginBottom: "1rem" }}>
        <StatCard label="All work" value={list.length} icon={ClipboardList} />
        <StatCard
          label="Published"
          value={published}
          icon={FileCheck2}
          tone="coral"
        />
        <StatCard
          label="Currently open"
          value={due}
          icon={Clock3}
          tone="gold"
        />
      </div>
      {list.length ? (
        <div
          className="card table-wrap"
          role="region"
          aria-label="Assignment list"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Class</th>
                <th>Deadline</th>
                <th>Submissions</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <div className="hint">
                      {a.type} · {a.maxMarks} marks
                    </div>
                  </td>
                  <td>
                    {a.class.name}
                    <div className="hint">{a.class.subject}</div>
                  </td>
                  <td>
                    {formatDate(a.dueAt)}
                    <div className="hint">{relativeDue(a.dueAt)}</div>
                  </td>
                  <td>{a._count.submissions}</td>
                  <td>
                    <span
                      className={`badge ${a.status === "PUBLISHED" ? "badge-teal" : a.status === "CLOSED" ? "badge-coral" : ""}`}
                    >
                      {assignmentStatusLabel(a.status)}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/teacher/assignments/${a.id}`}
                      aria-label={`Open ${a.title}`}
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
          title="No assigned work yet"
          description="Create a draft, attach a question paper if needed, and publish it when you are ready."
          action={
            <Link className="btn btn-primary" href="/teacher/assignments/new">
              Create assignment
            </Link>
          }
        />
      )}
    </div>
  );
}
