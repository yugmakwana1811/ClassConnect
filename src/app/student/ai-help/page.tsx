import { Bot, Brain, PencilLine, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveGeneratedContentAction } from "@/app/actions";
import { Alert, PageHeader, SafetyNote } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { GradeSubjectFields } from "@/components/education-selects";
import { normalizeCbseGrade } from "@/lib/education";
import {
  AIStreamSubmitButton,
  AIStreamingForm,
  AIStreamingOutput,
  AIStreamingProvider,
} from "@/components/ai-streaming";
import Typewriter from "@/components/typewriter";
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
      <AIStreamingProvider key={generation ?? "new"}>
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
          <AIStreamingForm
            redirectPath="/student/ai-help"
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
            <AIStreamSubmitButton pendingText="Thinking with you…">
              <Sparkles size={16} /> Get learning support
            </AIStreamSubmitButton>
            <p className="hint" style={{ margin: 0 }}>
              EduGrade prepares a subject-aware suggestion for you.
            </p>
          </AIStreamingForm>
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
          <AIStreamingOutput>
            {output ? (
            <>
              <span className="badge badge-coral">
                <Bot size={13} /> AI-assisted suggestion
              </span>
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
                <Typewriter
                  prefix="Learn with "
                  texts={[
                    "a clear example",
                    "one useful hint",
                    "a revision plan",
                  ]}
                  color="var(--ink)"
                  typedColor="var(--teal)"
                  cursorColor="var(--coral)"
                  font={{
                    fontFamily:
                      '"Inter", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    fontWeight: 400,
                    lineHeight: "1.08em",
                    letterSpacing: "-0.035em",
                    textAlign: "center",
                  }}
                  style={{ minHeight: 145, marginTop: ".8rem" }}
                />
                <p className="hint" style={{ lineHeight: 1.6 }}>
                  Tell the assistant where you are stuck. It will offer a
                  scaffold, explanation, or practice route—not a final assessed
                  answer.
                </p>
              </div>
            </div>
            )}
          </AIStreamingOutput>
        </section>
        </div>
      </AIStreamingProvider>
    </div>
  );
}
