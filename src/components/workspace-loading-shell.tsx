"use client";

import { usePathname } from "next/navigation";

const routeNames: Array<[string, string, string]> = [
  ["/teacher/assignments", "Assignments and tests", "Plan, publish, collect"],
  ["/teacher/classes", "Class management", "Classes and cohorts"],
  ["/teacher/quizzes", "Quizzes", "Create and manage quizzes"],
  ["/teacher/review", "Review work", "Review student submissions"],
  ["/teacher/analytics", "Analytics", "Classroom performance"],
  ["/teacher/attendance", "Attendance", "Attendance register"],
  ["/teacher/announcements", "Announcements", "Class communication"],
  ["/teacher/resources", "Resources", "Teaching resources"],
  ["/teacher/ai-tools", "AI studio", "Build with AI"],
  ["/teacher", "Teacher overview", "Teaching command centre"],
  ["/student/assignments", "Assigned work", "Your assignments"],
  ["/student/quizzes", "Quizzes", "Your quizzes"],
  ["/student/results", "Results", "Marks and feedback"],
  ["/student/analytics", "Progress", "Learning progress"],
  ["/student/classes", "Classes", "Your classes"],
  ["/student/ai-help", "AI study help", "Study support"],
  ["/student", "Student overview", "Learning workspace"],
  ["/parent/students", "Student progress", "My children"],
  ["/parent", "Parent overview", "Family workspace"],
  ["/account", "Account", "Account settings"],
];

export default function WorkspaceLoadingShell() {
  const pathname = usePathname();
  const [, eyebrow, title] =
    routeNames.find(([prefix]) => pathname.startsWith(prefix)) ??
    (["/", "Workspace", "Opening module"] as const);

  return (
    <div
      className="page workspace-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="page-head workspace-loading-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="display">{title}</h1>
          <p>Opening the module now. Fresh classroom data will appear here.</p>
        </div>
        <span className="workspace-loading-action" aria-hidden="true" />
      </div>
      <div className="workspace-loading-metrics" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="workspace-loading-content" aria-hidden="true">
        <section className="card">
          <span className="workspace-loading-line workspace-loading-line-title" />
          <span className="workspace-loading-line" />
          <span className="workspace-loading-line workspace-loading-line-short" />
        </section>
        <section className="card">
          <span className="workspace-loading-line workspace-loading-line-title" />
          <span className="workspace-loading-line" />
          <span className="workspace-loading-line workspace-loading-line-short" />
        </section>
      </div>
      <span className="sr-only">Loading fresh workspace data.</span>
    </div>
  );
}
