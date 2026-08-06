/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck2,
  LockKeyhole,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { SubmissionUploadForm } from "@/components/submission-upload-form";
export default async function StudentAssignment({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, { error, success }, user] = await Promise.all([
    params,
    searchParams,
    requireUser("STUDENT"),
  ]);
  const a = await db.assignment.findFirst({
    where: {
      id,
      status: { in: ["PUBLISHED", "CLOSED"] },
      class: { enrollments: { some: { studentId: user.studentProfile!.id } } },
    },
    include: {
      class: true,
      attachments: true,
      submissions: {
        where: { studentId: user.studentProfile!.id },
        include: {
          pages: { orderBy: { pageNumber: "asc" } },
          result: true,
          feedback: {
            where: { approved: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  if (!a) notFound();
  const s = a.submissions[0];
  const locked = s?.status === "PUBLISHED";
  return (
    <div className="page">
      <Link
        href="/student/assignments"
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
          <span className={`badge ${s ? "badge-teal" : "badge-coral"}`}>
            {s ? s.status.toLowerCase() : "not submitted"}
          </span>
        }
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px,.7fr) minmax(0,1.3fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <aside className="card card-pad">
          <div className="eyebrow">Assignment brief</div>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: ".8rem",
              fontSize: ".85rem",
            }}
          >
            <dt className="hint">Maximum marks</dt>
            <dd style={{ margin: 0, fontWeight: 850 }}>{a.maxMarks}</dd>
            <dt className="hint">Deadline</dt>
            <dd style={{ margin: 0, fontWeight: 850 }}>
              {formatDateTime(a.dueAt)}
            </dd>
          </dl>
          {a.instructions && (
            <>
              <h3>Instructions</h3>
              <p className="hint" style={{ lineHeight: 1.6 }}>
                {a.instructions}
              </p>
            </>
          )}
          {a.attachments.map((f) => (
            <a
              href={`/api/files/assignment/${f.id}`}
              target="_blank"
              rel="noreferrer"
              key={f.id}
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: ".8rem" }}
            >
              <Download size={16} /> Open question paper
            </a>
          ))}
          <div
            style={{
              marginTop: "1.2rem",
              padding: ".8rem",
              background: "var(--gold-soft)",
              borderRadius: 10,
            }}
          >
            <strong style={{ fontSize: ".82rem" }}>Submission checklist</strong>
            <div
              className="hint"
              style={{ display: "grid", gap: ".35rem", marginTop: ".6rem" }}
            >
              <span>□ Every answer page is included</span>
              <span>□ Images are clear and well lit</span>
              <span>□ Pages are in the correct order</span>
              <span>□ Your work is your own</span>
            </div>
          </div>
        </aside>
        <section className="card card-pad">
          {locked ? (
            <div>
              <div
                style={{ display: "flex", gap: ".7rem", alignItems: "center" }}
              >
                <span
                  style={{
                    width: 42,
                    height: 42,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 11,
                    background: "var(--teal-soft)",
                    color: "var(--teal)",
                  }}
                >
                  <LockKeyhole size={19} />
                </span>
                <div>
                  <h2
                    className="display"
                    style={{ fontSize: "1.7rem", margin: 0 }}
                  >
                    Submission reviewed
                  </h2>
                  <div className="hint">
                    Your published answer pages are locked.
                  </div>
                </div>
              </div>
              <div
                className="grid-auto"
                style={{
                  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                  marginTop: "1rem",
                }}
              >
                {s.pages.map((p) => (
                  <figure key={p.id} style={{ margin: 0 }}>
                    <img
                      src={`/api/submission-pages/${p.id}`}
                      alt={`Submitted page ${p.pageNumber}`}
                      style={{
                        width: "100%",
                        aspectRatio: "3/4",
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                      }}
                    />
                    <figcaption className="hint">
                      Page {p.pageNumber}
                    </figcaption>
                  </figure>
                ))}
              </div>
              {s.result?.published && (
                <Link
                  href="/student/results"
                  className="btn btn-primary"
                  style={{ marginTop: "1rem" }}
                >
                  <FileCheck2 size={16} /> View published result
                </Link>
              )}
            </div>
          ) : s?.status === "SUBMITTED" || s?.status === "REVIEWED" ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <CheckCircle2
                size={43}
                color="var(--teal)"
                style={{ margin: "auto" }}
              />
              <h2
                className="display"
                style={{ fontSize: "2rem", margin: "1rem 0 .4rem" }}
              >
                Your work is with your teacher
              </h2>
              <p className="hint">
                Submitted{" "}
                {s.submittedAt ? formatDateTime(s.submittedAt) : "recently"}.
                You can return here to track its status.
              </p>
              <div
                className="grid-auto"
                style={{
                  gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                  marginTop: "1rem",
                }}
              >
                {s.pages.map((p) => (
                  <img
                    key={p.id}
                    src={`/api/submission-pages/${p.id}`}
                    alt={`Submitted page ${p.pageNumber}`}
                    style={{
                      width: "100%",
                      aspectRatio: "3/4",
                      objectFit: "cover",
                      borderRadius: 9,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : a.status === "CLOSED" ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <LockKeyhole
                size={43}
                color="var(--muted)"
                style={{ margin: "auto" }}
              />
              <h2
                className="display"
                style={{ fontSize: "2rem", margin: "1rem 0 .4rem" }}
              >
                Submissions are closed
              </h2>
              <p className="hint">
                You can still read the assignment brief and attached paper, but
                this class is no longer accepting answer pages for this work.
              </p>
            </div>
          ) : (
            <div>
              <div className="eyebrow">Photo submission</div>
              <h2
                className="display"
                style={{ fontSize: "1.8rem", margin: ".3rem 0 .5rem" }}
              >
                Upload your answer pages
              </h2>
              <p className="hint" style={{ lineHeight: 1.5 }}>
                Preview every page before submitting. Your teacher will see the
                pages in the order shown.
              </p>
              <SubmissionUploadForm assignmentId={a.id} userId={user.id} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
