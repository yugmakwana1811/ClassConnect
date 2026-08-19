import { Download, FileText, Trash2, UploadCloud } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { deleteResourceAction, uploadResourceAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { PdfActions } from "@/components/pdf-actions";
import { DEMO_GENERATED_PDF_PREFIX } from "@/lib/demo-catalog";
export default async function Resources({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ error, success }, user] = await Promise.all([
    searchParams,
    requireUser("TEACHER"),
  ]);
  const [classes, resources] = await Promise.all([
    db.classRoom.findMany({ where: { teacherId: user.teacherProfile!.id } }),
    db.resource.findMany({
      where: { class: { teacherId: user.teacherProfile!.id } },
      include: { class: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Learning library"
        title="Resources students can find"
        description="Upload question papers, notes, worksheets, references, and revision material to the right class."
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.35fr) minmax(290px,.65fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section>
          {resources.length ? (
            <div className="card">
              {resources.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: ".8rem",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 11,
                      background: "var(--teal-soft)",
                      color: "var(--teal)",
                    }}
                  >
                    <FileText size={20} />
                  </span>
                  <div>
                    <strong>{r.title}</strong>
                    <div className="hint">
                      {r.type} · {r.class.name} · {formatDate(r.createdAt)}
                    </div>
                    {r.description && (
                      <p className="hint" style={{ margin: ".35rem 0 0" }}>
                        {r.description}
                      </p>
                    )}
                    {r.url.startsWith(DEMO_GENERATED_PDF_PREFIX) ? (
                      <PdfActions
                        label={r.title}
                        studentUrl={`/api/pdfs/resource/${r.id}`}
                      />
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: ".45rem" }}>
                    <a
                      href={`/api/files/resource/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      aria-label={`Download ${r.title}`}
                    >
                      <Download size={16} />
                      <span className="hide-mobile">Open</span>
                    </a>
                    <form action={deleteResourceAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton
                        className="btn btn-danger"
                        pendingText="Deleting…"
                        confirmMessage={`Permanently delete “${r.title}” for every learner in ${r.class.name}?`}
                      >
                        <Trash2 size={15} />
                        <span className="hide-mobile">Delete</span>
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your resource shelf is empty"
              description="Upload useful material once and students can access it from their class."
            />
          )}
        </section>
        <aside className="card card-pad">
          <div className="eyebrow">Add resource</div>
          <h2
            className="display"
            style={{ fontSize: "1.7rem", margin: ".3rem 0 1rem" }}
          >
            Share learning material
          </h2>
          <form
            action={uploadResourceAction}
            style={{ display: "grid", gap: ".8rem" }}
          >
            <label>
              <span className="label">Class</span>
              <select className="field" name="classId" required>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name} · {c.subject}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Title</span>
              <input className="field" name="title" minLength={3} required />
            </label>
            <label>
              <span className="label">Type</span>
              <select className="field" name="type">
                <option>Notes</option>
                <option>Worksheet</option>
                <option>Question Paper</option>
                <option>Reference</option>
                <option>Revision</option>
              </select>
            </label>
            <label>
              <span className="label">Description</span>
              <textarea className="field" name="description" maxLength={500} />
            </label>
            <label>
              <span className="label">File</span>
              <input
                className="field"
                name="file"
                type="file"
                accept=".pdf,.txt,image/jpeg,image/png,image/webp"
                required
              />
              <span className="hint">Maximum 3 MB</span>
            </label>
            <SubmitButton pendingText="Uploading…">
              <UploadCloud size={16} /> Upload resource
            </SubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
