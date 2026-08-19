import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Lock,
  Pencil,
  Send,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { closeAssignmentAction, publishAssignmentAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { PdfActions } from "@/components/pdf-actions";
import { DEMO_GENERATED_PDF_PREFIX } from "@/lib/demo-catalog";
import { submissionStatusLabel } from "@/lib/workflow-status";
export default async function AssignmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, { error, success }, user] = await Promise.all([
    params,
    searchParams,
    requireUser("TEACHER"),
  ]);
  const a = await db.assignment.findFirst({
    where: { id, class: { teacherId: user.teacherProfile!.id } },
    include: {
      class: true,
      attachments: true,
      submissions: {
        include: {
          student: { include: { user: true } },
          pages: true,
          result: true,
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!a) notFound();
  return (
    <div className="page">
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
        eyebrow={`${a.type} · ${a.class.name}`}
        title={a.title}
        description={a.description}
        action={
          a.status === "DRAFT" ? (
            <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
              <Link
                className="btn btn-secondary"
                href={`/teacher/assignments/${a.id}/edit`}
              >
                <Pencil size={15} /> Edit draft
              </Link>
              <form action={publishAssignmentAction}>
                <input type="hidden" name="id" value={a.id} />
                <SubmitButton
                  pendingText="Publishing…"
                  confirmMessage="Publish this assignment now? Enrolled students will immediately see the instructions, deadline, and attached paper."
                >
                  <Send size={16} /> Publish to students
                </SubmitButton>
              </form>
            </div>
          ) : a.status === "PUBLISHED" ? (
            <form action={closeAssignmentAction}>
              <input type="hidden" name="id" value={a.id} />
              <SubmitButton
                className="btn btn-secondary"
                pendingText="Closing…"
                confirmMessage="Close this assignment? Students who have not submitted will no longer be able to upload work."
              >
                <Lock size={15} /> Close submissions
              </SubmitButton>
            </form>
          ) : (
            <span className="badge badge-teal">
              <CheckCircle2 size={14} /> {a.status.toLowerCase()}
            </span>
          )
        }
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.3fr) minmax(280px,.7fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section className="card card-pad">
          <div className="eyebrow">Student submissions</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            {a.submissions.length} received
          </h2>
          {a.submissions.length ? (
            a.submissions.map((s) => (
              <Link
                href={`/teacher/review/${s.id}`}
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <strong>{s.student.user.name}</strong>
                  <div className="hint">
                    {s.pages.length} pages ·{" "}
                    {s.submittedAt ? formatDateTime(s.submittedAt) : "Draft"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".6rem",
                  }}
                >
                  {s.result?.published && (
                    <strong>
                      {Number(s.result.marks)}/{a.maxMarks}
                    </strong>
                  )}
                  <span
                    className={`badge ${s.status === "SUBMITTED" ? "badge-coral" : "badge-teal"}`}
                  >
                    {submissionStatusLabel(s, a.dueAt)}
                  </span>
                  <Eye size={17} />
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="No submissions yet"
              description={
                a.status === "DRAFT"
                  ? "Publish the assignment before students can respond."
                  : "Student answer pages will appear here as soon as they submit."
              }
            />
          )}
        </section>
        <aside className="card card-pad">
          <div className="eyebrow">Assignment details</div>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: ".8rem",
              fontSize: ".85rem",
            }}
          >
            <dt className="hint">Maximum marks</dt>
            <dd style={{ margin: 0, fontWeight: 800 }}>{a.maxMarks}</dd>
            <dt className="hint">Topic</dt>
            <dd style={{ margin: 0, fontWeight: 800 }}>{a.topic ?? a.title}</dd>
            <dt className="hint">Deadline</dt>
            <dd style={{ margin: 0, fontWeight: 800 }}>
              {formatDateTime(a.dueAt)}
            </dd>
            <dt className="hint">Status</dt>
            <dd style={{ margin: 0 }}>{a.status.toLowerCase()}</dd>
          </dl>
          {a.instructions && (
            <>
              <h3 style={{ fontSize: ".85rem", marginTop: "1.5rem" }}>
                Student instructions
              </h3>
              <p className="hint" style={{ lineHeight: 1.6 }}>
                {a.instructions}
              </p>
            </>
          )}
          {a.attachments
            .filter((f) => !f.url.startsWith(DEMO_GENERATED_PDF_PREFIX))
            .map((f) => (
            <a
              key={f.id}
              href={`/api/files/assignment/${f.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: ".8rem" }}
            >
              <Download size={16} /> {f.name}
            </a>
          ))}
          <PdfActions
            label={a.title}
            studentUrl={`/api/pdfs/assignment/${a.id}`}
            teacherUrl={`/api/pdfs/assignment/${a.id}?variant=teacher`}
          />
        </aside>
      </div>
    </div>
  );
}
