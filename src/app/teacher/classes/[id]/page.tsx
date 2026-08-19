import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Copy,
  FileText,
  Plus,
  RefreshCw,
  Save,
  UserMinus,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  regenerateClassCodeAction,
  removeEnrollmentAction,
  updateClassAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { GradeSubjectFields } from "@/components/education-selects";
export default async function ClassDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, { error, success }] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireUser("TEACHER");
  const c = await db.classRoom.findFirst({
    where: { id, teacherId: user.teacherProfile!.id },
    include: {
      enrollments: { include: { student: { include: { user: true } } } },
      assignments: { orderBy: { dueAt: "asc" }, take: 6 },
      announcements: { orderBy: { publishedAt: "desc" }, take: 3 },
      resources: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!c) notFound();
  return (
    <div className="page">
      <Link
        href="/teacher/classes"
        className="hint"
        style={{
          display: "inline-flex",
          gap: ".4rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> All classes
      </Link>
      <PageHeader
        eyebrow={`${c.subject} · Class ${c.grade}`}
        title={c.name}
        description={c.description ?? "Your connected class workspace."}
        action={
          <Link
            href={`/teacher/assignments/new?classId=${c.id}`}
            className="btn btn-primary"
          >
            <Plus size={16} /> New assignment
          </Link>
        }
      />
      <Alert error={error} success={success} />
      <div className="grid-auto">
        <StatCard
          label="Enrolled students"
          value={c.enrollments.length}
          icon={Users}
        />
        <StatCard
          label="Assignments"
          value={c.assignments.length}
          icon={FileText}
          tone="coral"
        />
        <StatCard
          label="Resources"
          value={c.resources.length}
          icon={BookOpen}
        />
        <StatCard
          label="Class code"
          value={c.code}
          detail="Share with students"
          icon={Copy}
          tone="gold"
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
          <div className="eyebrow">Assigned work</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Class timeline
          </h2>
          {c.assignments.length ? (
            c.assignments.map((a) => (
              <Link
                key={a.id}
                href={`/teacher/assignments/${a.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: ".85rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <strong>{a.title}</strong>
                  <div className="hint">
                    {a.type} · {a.maxMarks} marks
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className={`badge ${a.status === "PUBLISHED" ? "badge-teal" : ""}`}
                  >
                    {a.status.toLowerCase()}
                  </span>
                  <div className="hint" style={{ marginTop: ".3rem" }}>
                    {formatDate(a.dueAt)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="No work assigned"
              description="Create a real assignment, test, worksheet or practice activity."
            />
          )}
        </section>
        <aside style={{ display: "grid", gap: "1rem" }}>
          <section className="card card-pad">
            <div className="eyebrow">Enrolled learners</div>
            <h2
              className="display"
              style={{ fontSize: "1.6rem", margin: ".3rem 0 1rem" }}
            >
              Class list
            </h2>
            {c.enrollments.length ? (
              c.enrollments.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: ".7rem 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <strong style={{ fontSize: ".85rem" }}>
                    {e.student.user.name}
                  </strong>
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      alignItems: "center",
                    }}
                  >
                    <span className="hint">{e.student.rollNumber ?? "—"}</span>
                    <Link
                      href={`/teacher/students/${e.student.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: ".75rem", padding: ".45rem .6rem" }}
                    >
                      View progress
                    </Link>
                    <form action={removeEnrollmentAction}>
                      <input type="hidden" name="classId" value={c.id} />
                      <input type="hidden" name="enrollmentId" value={e.id} />
                      <SubmitButton
                        className="btn btn-danger"
                        pendingText="Removing…"
                        confirmMessage={`Remove ${e.student.user.name} from this class? Their existing submitted work remains in the assessment record.`}
                      >
                        <UserMinus size={14} /> Remove
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="hint">
                Share code <strong>{c.code}</strong> to enroll students.
              </p>
            )}
          </section>
          <section className="card card-pad">
            <div className="eyebrow">Latest notice</div>
            {c.announcements[0] ? (
              <>
                <h3>{c.announcements[0].title}</h3>
                <p className="hint" style={{ lineHeight: 1.55 }}>
                  {c.announcements[0].content}
                </p>
                <Link
                  href="/teacher/announcements"
                  style={{
                    color: "var(--teal)",
                    fontWeight: 800,
                    fontSize: ".82rem",
                  }}
                >
                  Manage announcements
                </Link>
              </>
            ) : (
              <p className="hint">No announcements yet.</p>
            )}
          </section>
          <section className="card card-pad">
            <div className="eyebrow">Manage class</div>
            <h2
              className="display"
              style={{ fontSize: "1.6rem", margin: ".3rem 0 1rem" }}
            >
              Details and enrollment code
            </h2>
            <form
              action={updateClassAction}
              style={{ display: "grid", gap: ".7rem" }}
            >
              <input type="hidden" name="id" value={c.id} />
              <label>
                <span className="label">Class name</span>
                <input
                  className="field"
                  name="name"
                  defaultValue={c.name}
                  minLength={3}
                  maxLength={80}
                  required
                />
              </label>
              <div className="form-grid">
                <GradeSubjectFields
                  defaultGrade={c.grade}
                  defaultSubject={c.subject}
                  gradeLabel="Grade"
                />
              </div>
              <label>
                <span className="label">Description</span>
                <textarea
                  className="field"
                  name="description"
                  defaultValue={c.description ?? ""}
                  maxLength={300}
                />
              </label>
              <SubmitButton pendingText="Saving class…">
                <Save size={15} /> Save class details
              </SubmitButton>
            </form>
            <form
              action={regenerateClassCodeAction}
              style={{ marginTop: ".8rem" }}
            >
              <input type="hidden" name="id" value={c.id} />
              <SubmitButton
                className="btn btn-secondary"
                pendingText="Generating…"
                confirmMessage="Generate a new class code? The current code will stop working immediately, but enrolled students stay in the class."
              >
                <RefreshCw size={15} /> Regenerate class code
              </SubmitButton>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
