import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { DiaTextReveal } from "@/components/dia-text-reveal";
import {
  CinematicController,
  CinematicLayers,
} from "@/components/cinematic-controller";
import { CinematicInterfaceShowcase } from "@/components/cinematic-interface-showcase";
import { FloatingTooltip } from "@/components/floating-tooltip";
import { FeatureAtlas } from "@/components/feature-atlas";
import { HoverExpand } from "@/components/hover-expand";
import { Logo } from "@/components/logo";
import { MotionAccordion } from "@/components/motion-accordion";
import { MotionNavigationMenu } from "@/components/motion-navigation-menu";
import TextMorph from "@/components/text-morph";
import ShinyText from "@/components/ShinyText";

const cycle = [
  "Plan",
  "Teach",
  "Assign",
  "Collect",
  "Evaluate",
  "Support",
  "Communicate",
  "Analyse",
];

const teachingMoments = [
  {
    label: "Plan with a strong starting point",
    sublabel: "Plan",
    image: "/marketing/teacher-planning.jpg",
    imageAlt: "Teacher planning a lesson with a tablet and notebook",
    description: "Create editable lessons, notes, questions, and revision material.",
  },
  {
    label: "Teach with the right explanation",
    sublabel: "Teach",
    image: "/marketing/classroom-teaching.jpg",
    imageAlt: "Teacher leading an engaged classroom discussion",
    description: "Adapt explanations and resources to the class in front of you.",
  },
  {
    label: "Collect work without the paper chase",
    sublabel: "Collect",
    image: "/marketing/answer-upload.jpg",
    imageAlt: "Student photographing ordered handwritten answer pages",
    description: "Students submit ordered handwritten pages from any device.",
  },
  {
    label: "Turn evidence into the next action",
    sublabel: "Analyse",
    image: "/marketing/learning-analytics.jpg",
    imageAlt: "Teacher reviewing classroom progress analytics on a laptop",
    description: "See progress patterns while keeping every decision teacher-led.",
  },
];

const frequentlyAskedQuestions = [
  {
    question: "Does EduGrade AI decide marks or final feedback?",
    answer:
      "No. AI creates editable suggestions only. Teachers review the work, decide marks, edit feedback, and explicitly publish the final result.",
  },
  {
    question: "Which classes and subjects are supported?",
    answer:
      "EduGrade supports Classes 6 through 12 with grade-aware CBSE subject catalogs, including core subjects, languages, electives, skill subjects, and internal-assessment areas.",
  },
  {
    question: "How does subject-aware AI model selection work?",
    answer:
      "EduGrade selects from a server-controlled allowlist based on the subject and task. Users cannot override the chosen model, and safe fallback content remains available if every permitted provider request fails.",
  },
  {
    question: "Can students submit handwritten answers?",
    answer:
      "Yes. Students can upload multiple answer-page images, preview the order, remove incorrect pages, complete a submission checklist, and track the submission after it is sent.",
  },
  {
    question: "Is classroom information protected by role?",
    answer:
      "Yes. Teacher and student routes are protected separately, requests are validated on the server, sessions use secure cookies, and private files are served through authenticated endpoints.",
  },
  {
    question: "Can AI-generated material be edited before use?",
    answer:
      "Always. Lesson plans, notes, explanations, questions, feedback, revision sheets, and announcements remain reviewable drafts until a teacher approves the next action.",
  },
];

export default function Home() {
  return (
    <main className="marketing cinematic-marketing" id="main-content">
      <CinematicController />
      <header className="marketing-nav cinematic-nav">
        <Logo />
        <MotionNavigationMenu />
        <div className="marketing-actions">
          <Link className="btn btn-secondary" href="/login">
            Sign in
          </Link>
          <Link className="btn btn-primary" href="/register">
            Sign Up <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section
        className="cinematic-hero-scene hero-pattern"
        data-cinematic-scene
        aria-label="EduGrade AI product introduction"
      >
        <CinematicLayers variant="blue" />
        <div className="cinematic-ghost-type" data-depth="1" aria-hidden="true">
          TEACH
        </div>
        <div className="cinematic-hero-grid">
          <div
            className="hero-copy cinematic-hero-copy"
            data-depth="4"
            data-cinematic-reveal
          >
            <div className="hero-kicker">
              <Sparkles size={14} />
              <ShinyText
                text="Classroom intelligence · Classes 6–12"
                speed={3.2}
                color="#334155"
                shineColor="#6b6de6"
                spread={105}
              />
            </div>
            <h1
              className="display hero-title cinematic-hero-title"
              aria-label="One workspace for the complete teaching cycle"
            >
              One workspace for the{" "}
              <DiaTextReveal text="complete teaching cycle." />
            </h1>
            <p>
              Plan, teach, assign, collect, evaluate, support, communicate, and
              analyse in one protected platform—while every academic decision
              remains with the teacher.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/register">
                Start teaching smarter <ArrowRight size={17} />
              </Link>
              <a className="btn btn-secondary" href="#interface">
                Experience the interface
              </a>
            </div>
            <div className="trust-note">
              <FloatingTooltip
                content="AI output remains a suggestion until a teacher reviews it."
                placement="top"
              >
                <ShieldCheck size={16} color="var(--teal)" />
              </FloatingTooltip>
              AI suggests. Teachers review, edit, and decide.
            </div>
          </div>

          <div
            className="cinematic-product-orbit"
            data-depth="3"
            data-cinematic-reveal
          >
            <div className="cinematic-signal cinematic-signal-review" data-depth="2">
              <ClipboardCheck size={16} />
              <span>
                <strong>12</strong>
                ready to review
              </span>
            </div>
            <div className="cinematic-signal cinematic-signal-ai" data-depth="2">
              <Bot size={16} />
              <span>
                <strong>Draft ready</strong>
                teacher approval required
              </span>
            </div>
            <div
              className="cinematic-signal cinematic-signal-progress"
              data-depth="5"
            >
              <BarChart3 size={16} />
              <span>
                <strong>78%</strong>
                class average
              </span>
            </div>

            <div
              className="product-stage cinematic-hero-product"
              aria-label="EduGrade teacher workspace preview"
            >
              <div className="product-window">
                <div className="window-bar">
                  <span />
                  <span />
                  <span />
                  <div className="window-title">
                    Teacher workspace · Live preview
                  </div>
                </div>
                <div className="preview-shell">
                  <div className="preview-nav">
                    <div className="preview-logo">EduGrade AI</div>
                    {[
                      "Overview",
                      "Classes",
                      "AI studio",
                      "Assignments",
                      "Review",
                      "Analytics",
                    ].map((label, index) => (
                      <span
                        className={`preview-link${index === 0 ? " active" : ""}`}
                        key={label}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="preview-content">
                    <h3>Your teaching command centre</h3>
                    <p>Four items need your attention today.</p>
                    <div className="preview-metrics">
                      <div className="preview-metric">
                        <span>Review queue</span>
                        <strong>12</strong>
                      </div>
                      <div className="preview-metric">
                        <span>Class average</span>
                        <strong>78%</strong>
                      </div>
                      <div className="preview-metric">
                        <span>Time assisted</span>
                        <strong>86m</strong>
                      </div>
                    </div>
                    <div className="preview-grid">
                      <div className="preview-panel">
                        <strong>Priority queue</strong>
                        {[
                          "Review Partnership Test responses",
                          "Publish Unit 3 assignment",
                          "Complete Class 8 attendance",
                        ].map((task) => (
                          <div className="preview-task" key={task}>
                            <i /> {task}
                          </div>
                        ))}
                      </div>
                      <div className="preview-panel">
                        <strong>Completion pulse</strong>
                        <div className="preview-chart" aria-hidden="true">
                          {[44, 62, 55, 74, 66, 82, 91].map(
                            (height, index) => (
                              <span
                                key={index}
                                style={{ height: `${height}%` }}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="hero-proof cinematic-hero-proof"
          aria-label="EduGrade platform highlights"
          data-depth="4"
        >
          <div>
            <strong>6–12</strong>
            <span>Complete CBSE class coverage</span>
          </div>
          <div>
            <strong>40+</strong>
            <span>Connected classroom capabilities</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Teacher-controlled publishing</span>
          </div>
        </div>
      </section>

      <section
        className="cinematic-cycle-scene"
        data-cinematic-scene
        aria-label="Complete teaching cycle"
      >
        <CinematicLayers variant="mist" />
        <div className="cinematic-cycle-heading" data-depth="4" data-cinematic-reveal>
          <span>One continuous classroom record</span>
          <strong>From first idea to next learning action.</strong>
        </div>
        <TextMorph
          className="cinematic-cycle-morph"
          words={cycle}
          transition={{ duration: 0.8, delay: 0.9, ease: "circInOut" }}
          color="var(--indigo)"
          font={{
            fontFamily:
              '"Inter", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: "clamp(3rem, 8vw, 7.5rem)",
            lineHeight: "1em",
            letterSpacing: "-0.055em",
            textAlign: "center",
          }}
          ariaLabel="The connected teaching cycle: plan, teach, assign, collect, evaluate, support, communicate, and analyse"
          dataDepth="2"
        />
        <div className="cycle-rail cinematic-cycle-rail" data-depth="3">
          {cycle.map((item, index) => (
            <div className="cycle-step" key={item}>
              <span>0{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section
        className="marketing-section cinematic-interface-scene"
        id="interface"
        data-cinematic-scene
        aria-label="Interactive EduGrade interface tour"
      >
        <CinematicLayers variant="teal" />
        <div className="section-inner">
          <div className="cinematic-interface-intro" data-depth="4" data-cinematic-reveal>
            <div>
              <div className="eyebrow">The complete interface system</div>
              <h2 className="display section-heading">
                Every essential classroom component, already connected.
              </h2>
            </div>
            <p>
              Explore real controls for planning, assignments, answer uploads,
              teacher review, feedback, publishing, analytics, announcements,
              and student support.
            </p>
          </div>
          <div data-cinematic-reveal>
            <CinematicInterfaceShowcase />
          </div>
        </div>
      </section>

      <section
        className="marketing-section feature-atlas-section cinematic-content-scene"
        id="features"
        data-cinematic-scene
        aria-label="Complete platform feature atlas"
      >
        <CinematicLayers variant="mist" />
        <div className="section-inner" data-depth="4">
          <div className="feature-atlas-intro" data-cinematic-reveal>
            <div>
              <div className="eyebrow">Complete capability map</div>
              <h2 className="display section-heading">
                Everything connected, without the clutter.
              </h2>
            </div>
            <p>
              Filter by workspace, then select a capability area to see what is
              included across the complete teaching cycle.
            </p>
          </div>
          <div data-cinematic-reveal>
            <FeatureAtlas />
          </div>
        </div>
      </section>

      <section
        className="marketing-section cinematic-content-scene"
        id="platform"
        data-cinematic-scene
        aria-label="Connected classroom platform"
      >
        <CinematicLayers variant="blue" />
        <div className="section-inner" data-depth="4">
          <div data-cinematic-reveal>
            <div className="eyebrow">One connected classroom</div>
          <h2 className="display section-heading">
            Less coordination overhead. More useful teaching signals.
          </h2>
          </div>
          <div className="feature-bento">
            <article
              className="feature-card feature-card-large"
              id="ai-studio"
              data-cinematic-reveal
            >
              <div className="feature-number">01 / AI STUDIO</div>
              <Bot size={32} color="var(--teal)" style={{ marginTop: "2rem" }} />
              <h3>From rough idea to teacher-ready draft.</h3>
              <p>
                Create lesson plans, explanations, notes, questions, quizzes,
                revision sheets, feedback, and announcements in a guided
                workspace. Every AI output stays editable and clearly marked as
                a suggestion.
              </p>
              <div className="approval-flow">
                <div className="approval-step">
                  <span>Drafted</span>
                  AI prepares a starting point
                </div>
                <div className="approval-step">
                  <span>Reviewed</span>
                  Teacher checks and edits
                </div>
                <div className="approval-step">
                  <span>Approved</span>
                  Teacher controls publishing
                </div>
              </div>
            </article>
            <article
              className="feature-card"
              id="answer-review"
              data-cinematic-reveal
            >
              <div className="feature-number">02 / ANSWER REVIEW</div>
              <Camera size={26} color="var(--teal)" style={{ marginTop: "1.4rem" }} />
              <h3>Handwritten work, organised.</h3>
              <p>
                Students upload ordered answer pages with previews and checks.
                Teachers review every page in context before marks or feedback
                are published.
              </p>
            </article>
            <article
              className="feature-card"
              id="learning-signals"
              data-cinematic-reveal
            >
              <div className="feature-number">03 / LEARNING SIGNALS</div>
              <BarChart3 size={26} color="var(--indigo)" style={{ marginTop: "1.4rem" }} />
              <h3>Evidence that leads to a useful next step.</h3>
              <p>
                See completion, results, attendance, topic patterns, and
                workload assistance without turning suggestions into academic
                decisions.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        className="marketing-section cinematic-content-scene"
        id="roles"
        data-cinematic-scene
        aria-label="Teacher and student workspaces"
      >
        <CinematicLayers variant="teal" />
        <div className="section-inner" data-depth="4">
          <div data-cinematic-reveal>
            <div className="eyebrow">Built for both sides of the classroom</div>
          <h2 className="display section-heading">
            A precise workspace for teachers. A clear next step for students.
          </h2>
          </div>
          <div className="role-grid">
            <article
              className="role-card role-card-teacher"
              id="teacher-workspace"
              data-cinematic-reveal
            >
              <Users size={28} color="var(--teal)" />
              <h3 className="display">Teacher command centre</h3>
              <p>
                Manage classes, create material, publish assignments, review
                submissions, track participation, and act on evidence from one
                protected workspace.
              </p>
              <Link href="/register" className="btn btn-secondary">
                Create teacher account <ArrowRight size={16} />
              </Link>
            </article>
            <article
              className="role-card role-card-student"
              id="student-workspace"
              data-cinematic-reveal
            >
              <FileText size={28} color="var(--indigo)" />
              <h3 className="display">Student learning path</h3>
              <p>
                Join classes, see upcoming work, upload answer pages, attempt
                quizzes, read published feedback, and revise with transparent
                AI support.
              </p>
              <Link href="/register" className="btn btn-primary">
                Create student account <ArrowRight size={16} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section
        className="marketing-section workflow-showcase cinematic-content-scene"
        data-cinematic-scene
        aria-label="Teaching workflow showcase"
      >
        <CinematicLayers variant="mist" />
        <div className="section-inner" data-depth="4">
          <div className="workflow-showcase-head" data-cinematic-reveal>
            <div>
              <div className="eyebrow">The workflow, not another tool</div>
              <h2 className="display section-heading">
                Built around the moments that shape a teaching day.
              </h2>
            </div>
            <p>
              Move across the complete classroom cycle without losing context,
              control, or the human judgment learning depends on.
            </p>
          </div>
          <div data-cinematic-reveal>
            <HoverExpand items={teachingMoments} />
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section-dark cinematic-content-scene"
        id="trust"
        data-cinematic-scene
        aria-label="AI safety and teacher control"
      >
        <CinematicLayers variant="blue" />
        <div className="section-inner" data-depth="4" data-cinematic-reveal>
          <div className="eyebrow" style={{ color: "var(--teal)" }}>
            Designed around teacher control
          </div>
          <h2 className="display section-heading">
            Useful AI should strengthen judgment—not replace it.
          </h2>
          <div className="grid-auto">
            {[
              [
                Sparkles,
                "Reviewable suggestions",
                "Generated content is labelled, editable, and never published automatically.",
              ],
              [
                ClipboardCheck,
                "Teacher-owned decisions",
                "Final teaching choices, evaluation, marks, and feedback remain under teacher control.",
              ],
              [
                ShieldCheck,
                "Protected workflows",
                "Role-based access, server validation, secure sessions, and private file handling protect classroom work.",
              ],
              [
                CheckCircle2,
                "Honest learning support",
                "Student assistance guides understanding and revision without claiming perfect or final answers.",
              ],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof Sparkles;
              return (
                <article key={String(title)} style={{ padding: "1rem 0" }}>
                  <I color="var(--teal)" />
                  <h3 style={{ margin: ".85rem 0 .45rem" }}>{String(title)}</h3>
                  <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                    {String(copy)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="marketing-section faq-section cinematic-content-scene"
        id="faq"
        data-cinematic-scene
        aria-label="Frequently asked questions"
      >
        <CinematicLayers variant="mist" />
        <div className="section-inner faq-layout" data-depth="4">
          <div className="faq-intro" data-cinematic-reveal>
            <div className="eyebrow">Clear answers, upfront</div>
            <h2 className="display section-heading">
              What schools, teachers, and students usually ask.
            </h2>
            <p>
              EduGrade combines practical classroom workflows with explicit
              teacher control, protected access, and honest AI boundaries.
            </p>
            <Link href="/about" className="text-link">
              Read product information & AI safety{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div data-cinematic-reveal>
            <MotionAccordion items={frequentlyAskedQuestions} />
          </div>
        </div>
      </section>

      <section
        className="marketing-section cinematic-final-scene"
        style={{ textAlign: "center" }}
        data-cinematic-scene
        aria-label="Get started with EduGrade AI"
      >
        <CinematicLayers variant="teal" />
        <div className="section-inner" data-depth="4" data-cinematic-reveal>
          <div className="eyebrow">Ready for the complete teaching cycle</div>
          <h2
            className="display section-heading"
            style={{ marginInline: "auto" }}
          >
            Smart Teaching. Faster Feedback. Better Learning.
          </h2>
          <p
            style={{
              maxWidth: 650,
              margin: "0 auto 1.6rem",
              color: "var(--muted)",
              lineHeight: 1.75,
            }}
          >
            Create a protected Class 6–12 workspace or use the seeded
            demonstration workspace to explore the full teacher-to-student
            flow.
          </p>
          <Link className="btn btn-primary" href="/login">
            Enter EduGrade AI <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="marketing-footer">
        <span>© 2026 EduGrade AI</span>
        <span>Smart Teaching. Faster Feedback. Better Learning.</span>
        <Link href="/about">Product information & AI safety</Link>
      </footer>
    </main>
  );
}
