import { Bot, Brain, PencilLine, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateContentAction,
  saveGeneratedContentAction,
} from "@/app/actions";
import { Alert, PageHeader, SafetyNote } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { GradeSubjectFields } from "@/components/education-selects";
import { normalizeCbseGrade } from "@/lib/education";
import { aiProviderLabel } from "@/lib/ai-routing";
export default async function AIHelp({
  searchParams,
}: {
  searchParams: Promise<{
    generation?: string;
    topic?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const [{ generation, topic, error, success }, user] = await Promise.all([
    searchParams,
    requireUser("STUDENT"),
  ]);
  const output = generation
    ? await db.aIContentGeneration.findFirst({
        where: { id: generation, userId: user.id },
      })
    : null;
  return (
    <div className="page">
      <PageHeader
        eyebrow="AI learning support"
        title="Get a hint, not a shortcut"
        description="Ask for an explanation or revision plan. EduGrade guides your thinking without completing assessed work for you."
      />
      <Alert error={error} success={success} />
      <SafetyNote student />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px,.75fr) minmax(0,1.25fr)",
          gap: "1rem",
          marginTop: "1rem",
          alignItems: "start",
        }}
      >
        <aside className="card card-pad">
          <div className="eyebrow">Study assistant</div>
          <h2
            className="display"
            style={{ fontSize: "1.7rem", margin: ".3rem 0 1rem" }}
          >
            What would help?
          </h2>
          <form
            action={generateContentAction}
            style={{ display: "grid", gap: ".8rem" }}
          >
            <label>
              <span className="label">Support type</span>
              <select className="field" name="type">
                <option value="DOUBT_HELP">Help with a doubt</option>
                <option value="REVISION_HELP">Build a revision plan</option>
                <option value="EXPLANATION">Explain a concept</option>
              </select>
            </label>
            <GradeSubjectFields
              defaultGrade={normalizeCbseGrade(user.studentProfile?.grade)}
            />
            <label>
              <span className="label">Topic or question</span>
              <input
                className="field"
                name="topic"
                required
                minLength={3}
                defaultValue={topic ?? ""}
                placeholder="Why does the sacrificing ratio matter?"
              />
            </label>
            <label>
              <span className="label">
                What have you tried? <span className="hint">(optional)</span>
              </span>
              <textarea
                className="field"
                name="details"
                maxLength={1000}
                placeholder="Share your current thinking without names or personal details."
              />
            </label>
            <SubmitButton pendingText="Thinking with you…">
              <Sparkles size={16} /> Get learning support
            </SubmitButton>
            <p className="hint" style={{ margin: 0 }}>
              EduGrade selects a subject-matched model and shows which model
              created the suggestion.
            </p>
          </form>
          <div
            style={{
              marginTop: "1rem",
              padding: ".8rem",
              background: "var(--surface-subtle)",
              borderRadius: 10,
            }}
          >
            <strong style={{ fontSize: ".8rem" }}>Good learning prompts</strong>
            <ul
              className="hint"
              style={{ paddingLeft: "1rem", lineHeight: 1.7 }}
            >
              <li>Explain this with a simpler example.</li>
              <li>Give me one hint for the next step.</li>
              <li>Plan 20 minutes of revision.</li>
            </ul>
          </div>
        </aside>
        <section className="card card-pad" style={{ minHeight: 500 }}>
          {output ? (
            <>
              <span className="badge badge-coral">
                <Bot size={13} /> AI-assisted suggestion
              </span>
              <span className="hint" style={{ marginLeft: ".55rem" }}>
                {aiProviderLabel(output.provider)}
              </span>
              {output.provider === "deterministic-fallback" && (
                <p className="hint" role="status">
                  Live AI was unavailable, so EduGrade created an editable safe
                  fallback.
                </p>
              )}
              <h2
                className="display"
                style={{ fontSize: "1.9rem", margin: ".7rem 0" }}
              >
                Your learning guide
              </h2>
              <form action={saveGeneratedContentAction}>
                <input type="hidden" name="id" value={output.id} />
                <textarea
                  className="field"
                  name="output"
                  defaultValue={output.output}
                  style={{ minHeight: 360, lineHeight: 1.65 }}
                />
                <input type="hidden" name="approved" value="off" />
                <SubmitButton
                  className="btn btn-secondary"
                  pendingText="Saving notes…"
                >
                  <PencilLine size={16} /> Save my notes
                </SubmitButton>
              </form>
            </>
          ) : (
            <div
              style={{
                height: 450,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ maxWidth: 420 }}>
                <Brain
                  size={48}
                  color="var(--teal)"
                  style={{ margin: "auto" }}
                />
                <h2
                  className="display"
                  style={{ fontSize: "2rem", margin: "1rem 0 .5rem" }}
                >
                  Thinking starts with your attempt
                </h2>
                <p className="hint" style={{ lineHeight: 1.6 }}>
                  Tell the assistant where you are stuck. It will offer a
                  scaffold, explanation, or practice route—not a final assessed
                  answer.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
