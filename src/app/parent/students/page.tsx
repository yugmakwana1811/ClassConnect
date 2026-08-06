import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  Link2,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  linkStudentAction,
  unlinkStudentAction,
} from "@/app/parent-actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function ParentStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ error, success }, user] = await Promise.all([
    searchParams,
    requireUser("PARENT"),
  ]);
  const connections = await db.parentStudent.findMany({
    where: { parentId: user.parentProfile!.id },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          enrollments: {
            include: { class: { select: { name: true, subject: true } } },
          },
          _count: {
            select: { submissions: true, quizAttempts: true, attendance: true },
          },
        },
      },
    },
    orderBy: { linkedAt: "asc" },
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow="Family connections"
        title="Your children"
        description="Connect each student with their private code, then open their full academic and learning activity record."
      />
      <Alert error={error} success={success} />
      <div className="dashboard-grid">
        <section className="card card-pad">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link2 size={18} color="var(--teal)" />
            <div className="eyebrow">Add a student</div>
          </div>
          <h2 className="display" style={{ fontSize: "1.8rem", margin: ".3rem 0 .6rem" }}>
            Make a secure connection
          </h2>
          <p className="hint" style={{ lineHeight: 1.55 }}>
            The student can find their access code in Account settings. The
            email and code must both match.
          </p>
          <form action={linkStudentAction} style={{ display: "grid", gap: ".8rem" }}>
            <label>
              <span className="label">Student sign-in email</span>
              <input
                className="field"
                name="studentEmail"
                type="email"
                autoComplete="email"
                placeholder="student@example.com"
                required
              />
            </label>
            <label>
              <span className="label">Parent access code</span>
              <input
                className="field"
                name="accessCode"
                minLength={10}
                maxLength={10}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="ABCD234567"
                required
              />
            </label>
            <label>
              <span className="label">
                Relationship <span className="hint">(optional)</span>
              </span>
              <input
                className="field"
                name="relationship"
                maxLength={50}
                placeholder="Parent, guardian, mother…"
              />
            </label>
            <SubmitButton pendingText="Connecting…">
              <HeartHandshake size={16} /> Connect student
            </SubmitButton>
          </form>
          <div
            style={{
              display: "flex",
              gap: ".55rem",
              padding: ".8rem",
              marginTop: "1rem",
              borderRadius: 10,
              background: "var(--teal-soft)",
              color: "var(--teal)",
              fontSize: ".8rem",
              lineHeight: 1.5,
            }}
          >
            <ShieldCheck size={18} style={{ flex: "0 0 auto" }} />
            Only explicitly connected parents can open a student record. A
            student can revoke access at any time.
          </div>
        </section>

        <section style={{ display: "grid", gap: "1rem" }}>
          {connections.length ? (
            connections.map((connection) => (
              <article className="card card-pad" key={connection.id}>
                <div className="panel-head">
                  <div>
                    <div className="eyebrow">
                      {connection.relationship || "Parent or guardian"}
                    </div>
                    <h2>{connection.student.user.name}</h2>
                    <div className="hint">
                      Grade {connection.student.grade || "—"} · Roll number{" "}
                      {connection.student.rollNumber || "—"}
                    </div>
                  </div>
                  <span className="badge badge-teal">
                    Linked {formatDate(connection.linkedAt)}
                  </span>
                </div>
                <div className="facts-strip" style={{ margin: ".9rem 0" }}>
                  <div className="fact">
                    <span>Classes</span>
                    <strong>{connection.student.enrollments.length}</strong>
                  </div>
                  <div className="fact">
                    <span>Submissions</span>
                    <strong>{connection.student._count.submissions}</strong>
                  </div>
                  <div className="fact">
                    <span>Quizzes</span>
                    <strong>{connection.student._count.quizAttempts}</strong>
                  </div>
                </div>
                {connection.student.enrollments.length ? (
                  <p className="hint">
                    {connection.student.enrollments
                      .map(
                        (enrollment) =>
                          `${enrollment.class.name} (${enrollment.class.subject})`,
                      )
                      .join(" · ")}
                  </p>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    gap: ".6rem",
                    flexWrap: "wrap",
                    marginTop: ".9rem",
                  }}
                >
                  <Link
                    className="btn btn-primary"
                    href={`/parent/students/${connection.student.id}`}
                  >
                    View complete progress <ArrowRight size={15} />
                  </Link>
                  <form action={unlinkStudentAction}>
                    <input type="hidden" name="id" value={connection.id} />
                    <SubmitButton
                      className="btn btn-danger"
                      pendingText="Removing…"
                      confirmMessage={`Remove ${connection.student.user.name} from your parent workspace?`}
                    >
                      <UserMinus size={15} /> Remove
                    </SubmitButton>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No students connected"
              description="Use the form and a student's private access code to create your first family connection."
            />
          )}
        </section>
      </div>
    </div>
  );
}
