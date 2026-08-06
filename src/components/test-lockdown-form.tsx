"use client";

import {
  AlertTriangle,
  Expand,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { submitQuizAction } from "@/app/actions";
import { isBlockedTestShortcut } from "@/lib/test-lockdown";
import { SubmitButton } from "./submit-button";

type TestQuestion = {
  id: string;
  options: string[];
  prompt: string;
};

type Phase = "ready" | "active" | "paused" | "submitting";

const BLOCKED_PAGE_CONTROLS =
  ".sidebar, .topbar, .mobile-nav, .skip-link, .test-page-exit";

export function TestLockdownForm({
  quizId,
  questions,
}: {
  quizId: string;
  questions: TestQuestion[];
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [error, setError] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [violations, setViolations] = useState(0);
  const sessionRunning = useRef(false);
  const submitting = useRef(false);
  const surface = useRef<HTMLDivElement>(null);

  const pauseTest = useCallback((reason: string) => {
    if (!sessionRunning.current || submitting.current) return;
    setPauseReason(reason);
    setViolations((count) => count + 1);
    setPhase("paused");
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (
      !document.fullscreenEnabled ||
      typeof document.documentElement.requestFullscreen !== "function"
    ) {
      throw new Error(
        "Secure test mode requires fullscreen support. Use an up-to-date version of Chrome, Edge, Firefox, or Safari.",
      );
    }

    if (document.fullscreenElement !== document.documentElement) {
      await document.documentElement.requestFullscreen({
        navigationUI: "hide",
      });
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    if (document.fullscreenElement !== document.documentElement) {
      throw new Error(
        "Fullscreen did not activate. Allow fullscreen for this site, then try again.",
      );
    }
  }, []);

  async function beginTest() {
    setError("");
    try {
      await enterFullscreen();
      sessionRunning.current = true;
      setPhase("active");
    } catch (caught) {
      sessionRunning.current = false;
      setError(
        caught instanceof Error
          ? caught.message
          : "Fullscreen could not be started. Check the browser permission and try again.",
      );
    }
  }

  async function resumeTest() {
    setError("");
    if (document.visibilityState !== "visible" || !document.hasFocus()) {
      setError("Return to this browser window before resuming the test.");
      return;
    }

    try {
      await enterFullscreen();
      setPauseReason("");
      setPhase("active");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Fullscreen could not be restored. Check the browser permission and try again.",
      );
    }
  }

  useEffect(() => {
    if (phase === "ready") return;

    document.documentElement.classList.add("test-lockdown-active");
    document.body.classList.add("test-lockdown-active");

    const blockedControls = Array.from(
      document.querySelectorAll<HTMLElement>(BLOCKED_PAGE_CONTROLS),
    ).map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    }));

    for (const { element } of blockedControls) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    const originalOpen = window.open;
    window.open = (() => null) as typeof window.open;

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        pauseTest("The test was paused because this tab was no longer visible.");
      }
    };
    const handleBlur = () => {
      window.setTimeout(() => {
        if (!document.hasFocus()) {
          pauseTest(
            "The test was paused because focus moved away from the test window.",
          );
        }
      }, 0);
    };
    const handleFullscreen = () => {
      if (
        sessionRunning.current &&
        document.fullscreenElement !== document.documentElement
      ) {
        pauseTest("The test was paused because fullscreen mode was exited.");
      }
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (!sessionRunning.current || !isBlockedTestShortcut(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pauseTest(
        "A browser or window shortcut was blocked. Resume to continue the test.",
      );
    };
    const handleOutsideInteraction = (event: MouseEvent) => {
      if (!sessionRunning.current) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-test-lockdown-surface]")
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pauseTest(
        "A control outside the test was blocked. Resume to continue the test.",
      );
    };
    const blockClipboardOrMenu = (event: Event) => {
      if (!sessionRunning.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!sessionRunning.current || submitting.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("click", handleOutsideInteraction, true);
    document.addEventListener("auxclick", handleOutsideInteraction, true);
    document.addEventListener("contextmenu", blockClipboardOrMenu, true);
    document.addEventListener("copy", blockClipboardOrMenu, true);
    document.addEventListener("cut", blockClipboardOrMenu, true);
    document.addEventListener("paste", blockClipboardOrMenu, true);
    document.addEventListener("dragstart", blockClipboardOrMenu, true);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.documentElement.classList.remove("test-lockdown-active");
      document.body.classList.remove("test-lockdown-active");
      window.open = originalOpen;
      for (const { element, ariaHidden, inert } of blockedControls) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("click", handleOutsideInteraction, true);
      document.removeEventListener("auxclick", handleOutsideInteraction, true);
      document.removeEventListener("contextmenu", blockClipboardOrMenu, true);
      document.removeEventListener("copy", blockClipboardOrMenu, true);
      document.removeEventListener("cut", blockClipboardOrMenu, true);
      document.removeEventListener("paste", blockClipboardOrMenu, true);
      document.removeEventListener("dragstart", blockClipboardOrMenu, true);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pauseTest, phase]);

  useEffect(
    () => () => {
      sessionRunning.current = false;
      submitting.current = false;
      if (document.fullscreenElement === document.documentElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    },
    [],
  );

  if (phase === "ready") {
    return (
      <section className="card card-pad test-lockdown-intro">
        <span className="test-lockdown-icon" aria-hidden="true">
          <LockKeyhole size={24} />
        </span>
        <div>
          <div className="eyebrow">Secure test mode</div>
          <h2 className="display">Begin in fullscreen</h2>
          <p className="hint">
            Starting hides the student navigation and blocks new-tab, new-window,
            refresh, print, and browser-navigation shortcuts. If this test loses
            focus, becomes hidden, or exits fullscreen, answering pauses until
            you return.
          </p>
          <ul className="test-lockdown-checklist">
            <li>Close unrelated tabs and applications before starting.</li>
            <li>Stay in fullscreen until your answers are submitted.</li>
            <li>
              Use the test controls only; ordinary keyboard navigation remains
              available.
            </li>
          </ul>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn btn-primary" type="button" onClick={beginTest}>
            <Expand size={17} /> Enter fullscreen and begin
          </button>
        </div>
      </section>
    );
  }

  return (
    <div
      className="test-lockdown-surface"
      data-test-lockdown-surface
      ref={surface}
    >
      <div className="test-lockdown-status" role="status">
        <span>
          <ShieldCheck size={17} /> Secure test mode active
        </span>
        <span>
          {questions.length} questions
          {violations > 0 ? ` · ${violations} interruption${violations === 1 ? "" : "s"}` : ""}
        </span>
      </div>

      <form
        action={submitQuizAction}
        aria-hidden={phase === "paused"}
        inert={phase === "paused"}
        onSubmit={() => {
          submitting.current = true;
          sessionRunning.current = false;
          setPhase("submitting");
          if (document.fullscreenElement === document.documentElement) {
            void document.exitFullscreen().catch(() => undefined);
          }
        }}
      >
        <input type="hidden" name="quizId" value={quizId} />
        <input
          type="hidden"
          name="lockdownViolations"
          value={violations}
        />
        {questions.map((question, index) => (
          <fieldset
            className="card card-pad"
            key={question.id}
            disabled={phase === "paused"}
            style={{ margin: "0 0 .8rem", border: "1px solid var(--line)" }}
          >
            <legend style={{ fontWeight: 850, padding: "0 .4rem" }}>
              {index + 1}. {question.prompt}
            </legend>
            <div
              style={{ display: "grid", gap: ".55rem", marginTop: ".7rem" }}
            >
              {question.options.map((option) => (
                <label className="test-answer-option" key={option}>
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    value={option}
                    required
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <SubmitButton pendingText="Checking answers…">
          Submit test answers
        </SubmitButton>
      </form>

      {phase === "paused" && (
        <div
          className="test-lockdown-pause"
          role="dialog"
          aria-modal="true"
          aria-labelledby="test-paused-title"
        >
          <div className="test-lockdown-pause-card">
            <AlertTriangle size={30} aria-hidden="true" />
            <h2 id="test-paused-title" className="display">
              Test paused
            </h2>
            <p>{pauseReason}</p>
            <p className="hint">
              Your selected answers are still here. Return to this window and
              fullscreen mode to continue.
            </p>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="btn btn-primary"
              type="button"
              onClick={resumeTest}
            >
              <Expand size={17} /> Return to test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
