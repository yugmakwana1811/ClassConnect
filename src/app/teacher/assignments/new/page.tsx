import { ArrowLeft, FileUp, Save } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createAssignmentAction } from "@/app/actions";
export default async function NewAssignment({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; error?: string }>;
}) {
  const [{ classId, error }, user] = await Promise.all([
    searchParams,
    requireUser("TEACHER"),
  ]);
  const classes = await db.classRoom.findMany({
    where: { teacherId: user.teacherProfile!.id },
    orderBy: { name: "asc" },
  });
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link
        href="/teacher/assignments"
        className="hint"
        style={{
          display: "inline-flex",
          gap: 5,
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={15} /> All assignments
      </Link>
      <PageHeader
        eyebrow="Create assigned work"
        title="Set clear work, once"
        description="Add the learning purpose, instructions, deadline and optional paper. Save privately or publish to students."
      />
      <Alert error={error} />
      <form
        action={createAssignmentAction}
        className="card card-pad"
        style={{ display: "grid", gap: "1rem" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <label>
            <span className="label">Class</span>
            <select
              className="field"
              name="classId"
              defaultValue={classId}
              required
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} · {c.subject}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Work type</span>
            <select className="field" name="type" defaultValue="Test">
              <option>Assignment</option>
              <option>Homework</option>
              <option>Test</option>
              <option>Worksheet</option>
              <option>Practice</option>
              <option>Project</option>
              <option>Classwork</option>
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
            required
            placeholder="Partnership Fundamentals Test"
          />
        </label>
        <label>
          <span className="label">Primary topic</span>
          <input
            className="field"
            name="topic"
            minLength={2}
            maxLength={120}
            required
            placeholder="Goodwill adjustment"
          />
          <span className="hint">
            Used to calculate evidence-based topic insights after results are
            published.
          </span>
        </label>
        <label>
          <span className="label">Learning purpose / description</span>
          <textarea
            className="field"
            name="description"
            minLength={10}
            maxLength={2000}
            required
            placeholder="What students will practise or demonstrate"
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
            placeholder="Submission format, required working, or materials allowed"
          />
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <label>
            <span className="label">Maximum marks</span>
            <input
              className="field"
              name="maxMarks"
              type="number"
              min={1}
              max={500}
              defaultValue={30}
              required
            />
          </label>
          <label>
            <span className="label">Deadline</span>
            <input
              className="field"
              name="dueAt"
              type="datetime-local"
              required
            />
          </label>
        </div>
        <label>
          <span className="label">
            <FileUp size={15} style={{ display: "inline" }} /> Question paper or
            worksheet <span className="hint">(optional)</span>
          </span>
          <input
            className="field"
            name="attachment"
            type="file"
            accept=".pdf,.txt,image/jpeg,image/png,image/webp"
          />
          <span className="hint">
            PDF, text, JPG, PNG or WebP · maximum 3 MB
          </span>
        </label>
        <label
          style={{
            display: "flex",
            gap: ".6rem",
            alignItems: "flex-start",
            padding: "1rem",
            background: "var(--teal-soft)",
            borderRadius: 10,
          }}
        >
          <input type="checkbox" name="publish" />
          <span>
            <strong style={{ display: "block", fontSize: ".85rem" }}>
              Publish now
            </strong>
            <span className="hint">
              Students will see this work immediately. Leave unchecked to save a
              private draft.
            </span>
          </span>
        </label>
        <SubmitButton
          pendingText="Saving assignment…"
          confirmWhenChecked="publish"
          confirmMessage="Create and publish this assignment now? Enrolled students will immediately see it."
        >
          <Save size={16} /> Save assignment
        </SubmitButton>
      </form>
    </div>
  );
}
