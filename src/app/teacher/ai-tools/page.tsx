import {
  Bot,
  Check,
  FileQuestion,
  Lightbulb,
  Megaphone,
  NotebookPen,
  PencilLine,
  Presentation,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveGeneratedContentAction } from "@/app/actions";
import { Alert, PageHeader, SafetyNote } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { GradeSubjectFields } from "@/components/education-selects";
import {
  AIStreamSubmitButton,
  AIStreamingForm,
  AIStreamingOutput,
  AIStreamingProvider,
} from "@/components/ai-streaming";
import Typewriter from "@/components/typewriter";

const tools = [
  {
    type: "LESSON_PLAN",
    label: "Lesson plan",
    icon: Presentation,
    copy: "Outcomes, flow, checks and differentiation",
  },
  {
    type: "EXPLANATION",
    label: "Explanation",
    icon: Lightbulb,
    copy: "Clear, age-appropriate concept teaching",
  },
  {
    type: "NOTES",
    label: "Notes",
    icon: NotebookPen,
    copy: "Structured summaries and recall cues",
  },
  {
    type: "QUESTIONS",
    label: "Questions",
    icon: FileQuestion,
    copy: "CBSE-style, varied cognitive demand",
  },
  {
    type: "QUIZ",
    label: "Quiz",
    icon: Check,
    copy: "Quick checks with explanations",
  },
  {
    type: "REVISION_SHEET",
    label: "Revision sheet",
    icon: ScrollText,
    copy: "Focused retrieval and practice",
  },
  {
    type: "ANNOUNCEMENT",
    label: "Announcement",
    icon: Megaphone,
    copy: "Warm, concise class communication",
  },
];
export default async function AITools({
  searchParams,
}: {
  searchParams: Promise<{
    generation?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const [{ generation, error, success }, user] = await Promise.all([
    searchParams,
    requireUser("TEACHER"),
  ]);
  const output = generation
    ? await db.aIContentGeneration.findFirst({
        where: { id: generation, userId: user.id },
      })
    : null;
  const recent = await db.aIContentGeneration.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return (
    <div className="page">
      <PageHeader
        eyebrow="AI teaching studio"
        title="Start with a thoughtful draft"
        description="Generate a teaching suggestion, shape it with your expertise, and approve only when it is right for your class."
      />
      <Alert error={error} success={success} />
      <SafetyNote />
      <AIStreamingProvider key={generation ?? "new"}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(310px,.75fr) minmax(0,1.25fr)",
            gap: "1rem",
            marginTop: "1rem",
            alignItems: "start",
          }}
        >
        <aside className="card card-pad">
          <div className="eyebrow">Generate</div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Choose your teaching tool
          </h2>
          <AIStreamingForm
            redirectPath="/teacher/ai-tools"
            style={{ display: "grid", gap: ".9rem" }}
          >
            <label>
              <span className="label">Tool</span>
              <select className="field" name="type" defaultValue="LESSON_PLAN">
                {tools.map((t) => (
                  <option value={t.type} key={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Topic</span>
              <input
                className="field"
                name="topic"
                required
                minLength={3}
                placeholder="e.g. Valuation of goodwill"
              />
            </label>
            <GradeSubjectFields
              defaultGrade="12"
              defaultSubject={user.teacherProfile?.subject ?? ""}
            />
            <label>
              <span className="label">
                Context <span className="hint">(optional)</span>
              </span>
              <textarea
                className="field"
                name="details"
                maxLength={1000}
                placeholder="Learning needs, duration, or chapter focus—without names or personal data"
              />
            </label>
            <AIStreamSubmitButton pendingText="Creating suggestion…">
              <Sparkles size={16} /> Generate editable draft
            </AIStreamSubmitButton>
            <p className="hint" style={{ margin: 0 }}>
              EduGrade securely prepares a subject-aware draft for review.
            </p>
          </AIStreamingForm>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: ".5rem",
              marginTop: "1.2rem",
            }}
          >
            {tools.slice(0, 6).map(({ label, icon: Icon, copy }) => (
              <div
                key={label}
                style={{
                  padding: ".7rem",
                  border: "1px solid var(--line)",
                  borderRadius: 9,
                }}
              >
                <Icon size={16} color="var(--teal)" />
                <strong
                  style={{
                    display: "block",
                    fontSize: ".72rem",
                    margin: ".3rem 0",
                  }}
                >
                  {label}
                </strong>
                <small className="hint">{copy}</small>
              </div>
            ))}
          </div>
        </aside>
        <section>
          <AIStreamingOutput>
            {output ? (
            <div className="card card-pad">
              <div>
                <span className="badge badge-coral">
                  <Bot size={13} /> AI suggestion
                </span>
                <h2
                  className="display"
                  style={{ fontSize: "1.9rem", margin: ".6rem 0 .3rem" }}
                >
                  Review and refine
                </h2>
              </div>
              {output.provider === "deterministic-fallback" && (
                <p className="hint" role="status">
                  Live AI was unavailable, so EduGrade created an editable safe
                  fallback.
                </p>
              )}
              <form action={saveGeneratedContentAction}>
                <input type="hidden" name="id" value={output.id} />
                <label>
                  <span className="label">Editable content</span>
                  <textarea
                    className="field"
                    name="output"
                    defaultValue={output.output}
                    required
                    style={{ minHeight: 470, lineHeight: 1.6 }}
                  />
                </label>
                <label
                  style={{
                    display: "flex",
                    gap: ".6rem",
                    alignItems: "flex-start",
                    margin: "1rem 0",
                  }}
                >
                  <input
                    type="checkbox"
                    name="approved"
                    defaultChecked={output.approved}
                  />
                  <span>
                    <strong style={{ display: "block", fontSize: ".84rem" }}>
                      I reviewed this suggestion
                    </strong>
                    <span className="hint">
                      Approval records your review; publishing or assigning
                      remains a separate teacher action.
                    </span>
                  </span>
                </label>
                <SubmitButton>
                  <PencilLine size={16} /> Save my edits
                </SubmitButton>
              </form>
            </div>
            ) : (
            <div
              className="card card-pad"
              style={{
                minHeight: 520,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ maxWidth: 430 }}>
                <span
                  style={{
                    width: 58,
                    height: 58,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 16,
                    background: "var(--teal-soft)",
                    color: "var(--teal)",
                    margin: "auto",
                  }}
                >
                  <Sparkles />
                </span>
                <Typewriter
                  prefix="Build "
                  texts={[
                    "lesson plans",
                    "explanations",
                    "question sets",
                    "quizzes",
                  ]}
                  color="var(--ink)"
                  typedColor="var(--teal)"
                  cursorColor="var(--coral)"
                  font={{
                    fontFamily:
                      '"Inter", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
                    fontSize: "clamp(2rem, 5vw, 3.8rem)",
                    fontWeight: 400,
                    lineHeight: "1.08em",
                    letterSpacing: "-0.035em",
                    textAlign: "center",
                  }}
                  style={{ minHeight: 145, marginTop: ".8rem" }}
                />
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  Choose a tool and add enough classroom context for a useful
                  starting point. Nothing is published automatically.
                </p>
              </div>
            </div>
            )}
          </AIStreamingOutput>
          <div className="card card-pad" style={{ marginTop: "1rem" }}>
            <div className="eyebrow">Recent generations</div>
            {recent.length ? (
              recent.map((g) => (
                <a
                  href={`/teacher/ai-tools?generation=${g.id}`}
                  key={g.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: ".7rem 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span style={{ fontWeight: 750, fontSize: ".84rem" }}>
                    {g.type.replaceAll("_", " ").toLowerCase()}
                  </span>
                  <span className={`badge ${g.approved ? "badge-teal" : ""}`}>
                    {g.approved ? "reviewed" : "draft"}
                  </span>
                </a>
              ))
            ) : (
              <p className="hint">No drafts yet.</p>
            )}
          </div>
        </section>
        </div>
      </AIStreamingProvider>
    </div>
  );
}
