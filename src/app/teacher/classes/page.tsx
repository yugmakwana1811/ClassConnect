import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  createClassAction,
  deleteClassAction,
  renameClassAction,
} from "@/app/actions";
import { GradeSubjectFields } from "@/components/education-selects";

export default async function TeacherClasses({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const user = await requireUser("TEACHER");
  const classes = await db.classRoom.findMany({
    where: { teacherId: user.teacherProfile!.id },
    select: {
      id: true,
      name: true,
      grade: true,
      subject: true,
      code: true,
      _count: {
        select: {
          enrollments: true,
          assignments: true,
          quizzes: true,
          resources: true,
          announcements: true,
          attendance: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="page">
      <PageHeader
        eyebrow="Class management"
        title="Classes and cohorts"
        description="Create teaching spaces, share class codes, and see each cohort at a glance."
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.45fr) minmax(290px,.7fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section>
          {classes.length ? (
            <div className="grid-auto">
              {classes.map((c) => {
                const relatedRecords =
                  c._count.enrollments +
                  c._count.assignments +
                  c._count.quizzes +
                  c._count.resources +
                  c._count.announcements +
                  c._count.attendance;
                return (
                  <article className="card class-card" key={c.id}>
                    <div className="class-card-topbar">
                      <span className="badge badge-teal">Class {c.grade}</span>
                      <details className="class-card-options class-card-delete-options class-card-delete-top">
                        <summary className="btn btn-danger">
                          <Trash2 size={15} /> Delete class
                        </summary>
                        <div className="class-card-options-panel">
                          <form
                            action={deleteClassAction}
                            className="class-card-delete"
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <label>
                              <span className="label">
                                Type <strong>{c.name}</strong> to delete
                              </span>
                              <input
                                className="field"
                                name="confirmName"
                                autoComplete="off"
                                required
                              />
                            </label>
                            <p className="hint">
                              Permanently removes this class and{" "}
                              {relatedRecords
                                ? `${relatedRecords} linked classroom record${relatedRecords === 1 ? "" : "s"}`
                                : "its class code"}
                              , including all enrolled students. This cannot be
                              undone.
                            </p>
                            <SubmitButton
                              className="btn btn-danger"
                              pendingText="Deleting class…"
                              confirmMessage={`Permanently delete “${c.name}” and all of its student, assessment, resource, announcement, and attendance data? This cannot be undone.`}
                            >
                              <Trash2 size={15} /> Permanently delete class
                            </SubmitButton>
                          </form>
                        </div>
                      </details>
                    </div>
                    <Link
                      href={`/teacher/classes/${c.id}`}
                      className="class-card-main"
                    >
                      <div className="class-card-open-cue">
                        <span className="hint">Open class</span>
                        <ArrowRight size={18} color="var(--muted)" />
                      </div>
                      <h2
                        className="display"
                        style={{ fontSize: "1.65rem", margin: ".5rem 0 .2rem" }}
                      >
                        {c.name}
                      </h2>
                      <p style={{ color: "var(--muted)", margin: 0 }}>
                        {c.subject}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          marginTop: "1rem",
                          fontSize: ".8rem",
                        }}
                      >
                        <span>
                          <Users
                            size={14}
                            style={{ display: "inline", verticalAlign: "middle" }}
                          />{" "}
                          {c._count.enrollments} students
                        </span>
                        <span>{c._count.assignments} assignments</span>
                      </div>
                      <div className="class-card-code">
                        <span className="hint">Class code</span>
                        <strong>{c.code}</strong>
                      </div>
                    </Link>
                    <div className="class-card-actions">
                      <Link
                        href={`/teacher/classes/${c.id}`}
                        className="btn btn-secondary"
                      >
                        <ArrowRight size={15} /> Open
                      </Link>
                      <Link
                        href={`/teacher/assignments/new?classId=${c.id}`}
                        className="btn btn-secondary"
                      >
                        <FilePlus2 size={15} /> New assignment
                      </Link>
                      <details className="class-card-options">
                        <summary className="btn btn-secondary">
                          <Pencil size={15} /> Rename class
                        </summary>
                        <div className="class-card-options-panel">
                          <form
                            action={renameClassAction}
                            className="class-card-rename"
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <label>
                              <span className="label">Rename class</span>
                              <input
                                className="field"
                                name="name"
                                defaultValue={c.name}
                                minLength={3}
                                maxLength={80}
                                required
                              />
                            </label>
                            <SubmitButton pendingText="Renaming…">
                              <Pencil size={15} /> Rename
                            </SubmitButton>
                          </form>
                        </div>
                      </details>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Create your first class"
              description="Every assignment, resource, quiz and announcement starts with a class."
            />
          )}
        </section>
        <aside className="card card-pad">
          <div className="eyebrow">New class</div>
          <h2
            className="display"
            style={{ fontSize: "1.7rem", margin: ".3rem 0 1rem" }}
          >
            Set up a teaching space
          </h2>
          <form
            action={createClassAction}
            style={{ display: "grid", gap: ".85rem" }}
          >
            <label>
              <span className="label">Class name</span>
              <input
                className="field"
                name="name"
                placeholder="Class 11 Commerce"
                minLength={3}
                required
              />
            </label>
            <GradeSubjectFields
              defaultGrade="11"
              gradeLabel="Grade"
            />
            <label>
              <span className="label">
                Description <span className="hint">(optional)</span>
              </span>
              <textarea
                className="field"
                name="description"
                maxLength={300}
                placeholder="Topics, section, or classroom note"
              />
            </label>
            <SubmitButton>
              <Plus size={16} /> Create class
            </SubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
