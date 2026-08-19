import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateAssignmentAction } from "@/app/actions";
import { Alert, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTimeInput } from "@/lib/utils";

export default async function EditAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }, user] = await Promise.all([
    params,
    searchParams,
    requireUser("TEACHER"),
  ]);
  const [assignment, classes] = await Promise.all([
    db.assignment.findFirst({
      where: {
        id,
        status: "DRAFT",
        class: { teacherId: user.teacherProfile!.id },
      },
    }),
    db.classRoom.findMany({
      where: { teacherId: user.teacherProfile!.id },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!assignment) notFound();
  const dueValue = formatDateTimeInput(assignment.dueAt);
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link
        href={`/teacher/assignments/${assignment.id}`}
        className="hint"
        style={{
          display: "inline-flex",
          gap: 5,
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> Back to assignment
      </Link>
      <PageHeader
        eyebrow="Edit assignment draft"
        title="Refine before publishing"
        description="Draft changes remain private. Once published, preserve the original assessment record and close it when submissions should stop."
      />
      <Alert error={error} />
      <form
        action={updateAssignmentAction}
        className="card card-pad"
        style={{ display: "grid", gap: "1rem" }}
      >
        <input type="hidden" name="id" value={assignment.id} />
        <div className="form-grid">
          <label>
            <span className="label">Class</span>
            <select
              className="field"
              name="classId"
              defaultValue={assignment.classId}
              required
            >
              {classes.map((classroom) => (
                <option value={classroom.id} key={classroom.id}>
                  {classroom.name} · {classroom.subject}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Work type</span>
            <select
              className="field"
              name="type"
              defaultValue={assignment.type}
            >
              {["Assignment", "Homework", "Test", "Worksheet", "Practice", "Project", "Classwork"].map(
                (type) => (
                  <option key={type}>{type}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <label>
          <span className="label">Title</span>
          <input
            className="field"
            name="title"
            minLength={4}
            maxLength={120}
            defaultValue={assignment.title}
            required
          />
        </label>
        <label>
          <span className="label">Primary topic</span>
          <input
            className="field"
            name="topic"
            minLength={2}
            maxLength={120}
            defaultValue={assignment.topic ?? ""}
            required
          />
        </label>
        <label>
          <span className="label">Learning purpose / description</span>
          <textarea
            className="field"
            name="description"
            minLength={10}
            maxLength={2000}
            defaultValue={assignment.description}
            required
          />
        </label>
        <label>
          <span className="label">
            Student instructions <span className="hint">(optional)</span>
          </span>
          <textarea
            className="field"
            name="instructions"
            maxLength={2000}
            defaultValue={assignment.instructions ?? ""}
          />
        </label>
        <div className="form-grid">
          <label>
            <span className="label">Maximum marks</span>
            <input
              className="field"
              name="maxMarks"
              type="number"
              min={1}
              max={500}
              defaultValue={assignment.maxMarks}
              required
            />
          </label>
          <label>
            <span className="label">Deadline</span>
            <input
              className="field"
              name="dueAt"
              type="datetime-local"
              defaultValue={dueValue}
              required
            />
          </label>
        </div>
        <SubmitButton pendingText="Saving changes…">
          <Save size={16} /> Save draft changes
        </SubmitButton>
      </form>
    </div>
  );
}
