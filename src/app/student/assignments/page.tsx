import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { submissionStatusLabel } from "@/lib/workflow-status";
export default async function StudentAssignments() {
  const user = await requireUser("STUDENT");
  const list = await db.assignment.findMany({
    where: {
      status: { in: ["PUBLISHED", "CLOSED"] },
      class: { enrollments: { some: { studentId: user.studentProfile!.id } } },
    },
    select: {
      id: true,
      title: true,
      type: true,
      maxMarks: true,
      dueAt: true,
      status: true,
      class: { select: { name: true } },
      submissions: {
        where: { studentId: user.studentProfile!.id },
        select: { status: true, submittedAt: true },
      },
    },
    orderBy: { dueAt: "asc" },
  });
  const pending = list.filter(
    (a) => a.status === "PUBLISHED" && !a.submissions.length,
  );
  const complete = list.filter((a) => a.submissions.length);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Assigned work"
        title="Everything you need to submit"
        description="Open the paper and instructions, upload answer pages in order, and track the review status."
      />
      <div className="grid-auto" style={{ marginBottom: "1rem" }}>
        <StatCard
          label="Pending"
          value={pending.length}
          icon={Clock3}
          tone="coral"
        />
        <StatCard
          label="Submitted"
          value={complete.length}
          icon={CheckCircle2}
        />
        <StatCard
          label="All assigned"
          value={list.length}
          icon={FileText}
          tone="gold"
        />
      </div>
      {list.length ? (
        <div style={{ display: "grid", gap: ".8rem" }}>
          {list.map((a) => {
            const s = a.submissions[0];
            return (
              <Link
                className="card card-pad"
                href={`/student/assignments/${a.id}`}
                key={a.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="badge">{a.type}</span>
                    <span className="hint">{a.class.name}</span>
                  </div>
                  <h2
                    className="display"
                    style={{ fontSize: "1.55rem", margin: ".55rem 0 .25rem" }}
                  >
                    {a.title}
                  </h2>
                  <p className="hint" style={{ margin: 0 }}>
                    {a.maxMarks} marks · due {formatDate(a.dueAt)}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".7rem",
                  }}
                >
                  <span className={`badge ${s ? "badge-teal" : "badge-coral"}`}>
                    {s
                      ? submissionStatusLabel(s, a.dueAt)
                      : a.status === "CLOSED"
                        ? "closed"
                        : submissionStatusLabel(null, a.dueAt)}
                  </span>
                  <ArrowRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No assigned work"
          description="Published assignments from your classes will appear here."
        />
      )}
    </div>
  );
}
