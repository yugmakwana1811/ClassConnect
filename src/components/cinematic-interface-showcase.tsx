"use client";

import Image from "next/image";
import {
  BarChart3,
  Bell,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Send,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

const tourTabs = [
  { id: "plan", label: "Plan & create", icon: Sparkles },
  { id: "collect", label: "Assign & collect", icon: UploadCloud },
  { id: "review", label: "Review & publish", icon: ClipboardCheck },
  { id: "analyse", label: "Analyse & support", icon: BarChart3 },
] as const;

type TourTab = (typeof tourTabs)[number]["id"];

export function CinematicInterfaceShowcase() {
  const [activeTab, setActiveTab] = useState<TourTab>("plan");
  const [draftReady, setDraftReady] = useState(false);
  const [pageCount, setPageCount] = useState(2);
  const [feedback, setFeedback] = useState("");
  const [published, setPublished] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tourTabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + tourTabs.length) % tourTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tourTabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    setActiveTab(tourTabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="cinematic-ui-window" data-depth="3">
      <div className="cinematic-ui-window-bar">
        <span className="cinematic-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Interactive product tour</span>
        <span className="cinematic-live-chip">
          <i aria-hidden="true" /> Live interface
        </span>
      </div>

      <div className="cinematic-ui-shell">
        <aside className="cinematic-ui-sidebar" aria-label="Tour navigation">
          <div className="cinematic-ui-brand">
            <Sparkles size={16} aria-hidden="true" />
            ClassConnect
          </div>
          {[
            [LayoutDashboard, "Overview"],
            [Users, "Classes"],
            [Bot, "AI studio"],
            [FileText, "Assignments"],
            [GraduationCap, "Results"],
          ].map(([Icon, label], index) => {
            const MenuIcon = Icon as typeof LayoutDashboard;
            return (
              <span
                className={`cinematic-ui-nav-item${index === 2 ? " active" : ""}`}
                key={String(label)}
              >
                <MenuIcon size={15} aria-hidden="true" />
                {String(label)}
              </span>
            );
          })}
        </aside>

        <div className="cinematic-ui-main">
          <div className="cinematic-ui-topbar">
            <div>
              <strong>Class 12 Commerce</strong>
              <small>Accountancy · Teacher workspace</small>
            </div>
            <div className="cinematic-topbar-actions">
              <span className="cinematic-status-dot">
                <i aria-hidden="true" /> Protected
              </span>
              <span aria-label="Announcements available">
                <Bell size={16} />
              </span>
            </div>
          </div>

          <div
            className="cinematic-tour-tabs"
            role="tablist"
            aria-label="Explore the ClassConnect workflow"
          >
            {tourTabs.map(({ id, label, icon: Icon }, index) => (
              <button
                key={id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`cinematic-tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls="cinematic-tour-panel"
                tabIndex={activeTab === id ? 0 : -1}
                onClick={() => setActiveTab(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div
            className="cinematic-tour-panel"
            id="cinematic-tour-panel"
            role="tabpanel"
            aria-labelledby={`cinematic-tab-${activeTab}`}
            key={activeTab}
          >
            {activeTab === "plan" ? (
              <div className="cinematic-plan-grid">
                <section className="cinematic-demo-card">
                  <div className="cinematic-demo-card-head">
                    <div>
                      <small>AI LESSON BUILDER</small>
                      <h3>Partnership fundamentals</h3>
                    </div>
                    <span className="badge badge-teal">Editable draft</span>
                  </div>
                  <div className="cinematic-form-grid">
                    <label>
                      <span>Class</span>
                      <select defaultValue="12">
                        <option value="12">Class 12</option>
                        <option value="11">Class 11</option>
                      </select>
                    </label>
                    <label>
                      <span>Subject</span>
                      <select defaultValue="accountancy">
                        <option value="accountancy">Accountancy</option>
                        <option value="business">Business Studies</option>
                      </select>
                    </label>
                    <label className="cinematic-form-wide">
                      <span>Learning objective</span>
                      <input
                        defaultValue="Explain partnership deeds with a worked example"
                      />
                    </label>
                  </div>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => setDraftReady(true)}
                  >
                    <Sparkles size={15} /> Generate editable lesson
                  </button>
                </section>
                <aside className="cinematic-suggestion-card" aria-live="polite">
                  <div className="cinematic-suggestion-icon">
                    <Bot size={19} />
                  </div>
                  <small>{draftReady ? "DRAFT READY" : "AI SUGGESTION"}</small>
                  <h3>
                    {draftReady
                      ? "A reviewable lesson is ready."
                      : "A teacher-approved starting point."}
                  </h3>
                  {[
                    "Learning outcomes",
                    "Worked classroom example",
                    "Differentiated questions",
                    "Exit-ticket check",
                  ].map((item) => (
                    <span key={item}>
                      <Check size={14} /> {item}
                    </span>
                  ))}
                </aside>
              </div>
            ) : null}

            {activeTab === "collect" ? (
              <div className="cinematic-collect-grid">
                <section className="cinematic-demo-card">
                  <div className="cinematic-demo-card-head">
                    <div>
                      <small>ASSIGNMENT</small>
                      <h3>Partnership Fundamentals Test</h3>
                    </div>
                    <span className="badge">30 marks</span>
                  </div>
                  <div className="cinematic-assignment-meta">
                    <span>Due Friday, 4:00 PM</span>
                    <span>Class 12 Commerce</span>
                    <span>Question paper attached</span>
                  </div>
                  <div className="cinematic-upload-zone">
                    <Camera size={24} aria-hidden="true" />
                    <div>
                      <strong>Upload handwritten answer pages</strong>
                      <small>JPG, PNG or WEBP · ordered automatically</small>
                    </div>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setPageCount((count) => Math.min(count + 1, 3))}
                    >
                      Add page
                    </button>
                  </div>
                </section>
                <aside className="cinematic-pages-card">
                  <div className="cinematic-demo-card-head">
                    <div>
                      <small>SUBMISSION PREVIEW</small>
                      <h3>{pageCount} answer pages</h3>
                    </div>
                    <span className="badge badge-teal">Ready</span>
                  </div>
                  <div className="cinematic-page-thumbs">
                    {Array.from({ length: pageCount }).map((_, index) => (
                      <Image
                        key={index}
                        src={`/demo/answer-page-${index % 2 === 0 ? "1" : "2"}.svg`}
                        width={116}
                        height={150}
                        alt={`Preview of answer page ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="cinematic-checklist">
                    <span>
                      <CheckCircle2 size={14} /> All pages are readable
                    </span>
                    <span>
                      <CheckCircle2 size={14} /> Page order confirmed
                    </span>
                  </div>
                </aside>
              </div>
            ) : null}

            {activeTab === "review" ? (
              <div className="cinematic-review-grid">
                <section className="cinematic-answer-viewer">
                  <div className="cinematic-demo-card-head">
                    <div>
                      <small>STUDENT SUBMISSION</small>
                      <h3>Arjun Mehta · Page 1 of 2</h3>
                    </div>
                    <span className="badge">Submitted</span>
                  </div>
                  <Image
                    src="/demo/answer-page-1.svg"
                    width={360}
                    height={460}
                    alt="Handwritten accountancy answer under teacher review"
                  />
                </section>
                <section className="cinematic-review-form">
                  <div className="cinematic-demo-card-head">
                    <div>
                      <small>TEACHER REVIEW</small>
                      <h3>Marks and feedback</h3>
                    </div>
                    <span className={`badge${published ? " badge-teal" : ""}`}>
                      {published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <label>
                    <span>Marks awarded</span>
                    <input type="number" defaultValue={24} min={0} max={30} />
                    <small>out of 30</small>
                  </label>
                  <label>
                    <span>Teacher feedback</span>
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      placeholder="Write or generate an editable feedback suggestion"
                    />
                  </label>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      setFeedback(
                        "Strong understanding of the partnership deed. Recheck the interest-on-capital calculation in Question 3.",
                      )
                    }
                  >
                    <Sparkles size={15} /> Suggest feedback
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => setPublished(true)}
                  >
                    <Send size={15} /> {published ? "Result published" : "Publish result"}
                  </button>
                  <p className="cinematic-control-note" aria-live="polite">
                    AI suggestions remain editable. Final marks and feedback stay
                    under teacher control.
                  </p>
                </section>
              </div>
            ) : null}

            {activeTab === "analyse" ? (
              <div className="cinematic-analytics-grid">
                <div className="cinematic-analytics-metrics">
                  {[
                    ["Class average", "78%"],
                    ["Completion", "92%"],
                    ["Quiz accuracy", "84%"],
                    ["Time assisted", "86m"],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </article>
                  ))}
                </div>
                <section className="cinematic-chart-card">
                  <div className="cinematic-demo-card-head">
                    <div>
                      <small>PROGRESS TREND</small>
                      <h3>Class performance</h3>
                    </div>
                    <BarChart3 size={18} />
                  </div>
                  <div className="cinematic-chart" aria-label="Scores trend upward">
                    {[45, 58, 52, 67, 72, 69, 78, 84].map((height, index) => (
                      <span
                        key={index}
                        style={{ "--chart-height": `${height}%` } as CSSProperties}
                      >
                        <i />
                      </span>
                    ))}
                  </div>
                </section>
                <aside className="cinematic-insight-stack">
                  <article>
                    <span className="cinematic-insight-icon">
                      <GraduationCap size={17} />
                    </span>
                    <div>
                      <small>TOPIC TO REVISIT</small>
                      <strong>Interest on capital</strong>
                      <p>6 students would benefit from a short worked example.</p>
                    </div>
                  </article>
                  <article>
                    <span className="cinematic-insight-icon">
                      <Megaphone size={17} />
                    </span>
                    <div>
                      <small>ANNOUNCEMENT READY</small>
                      <strong>Revision clinic · Wednesday</strong>
                      <p>Editable reminder prepared for teacher approval.</p>
                    </div>
                  </article>
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
