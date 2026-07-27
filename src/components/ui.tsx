import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1
          className="display"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            lineHeight: 1.02,
            margin: ".3rem 0 .5rem",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              color: "var(--muted)",
              maxWidth: 680,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "teal",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "teal" | "coral" | "gold";
}) {
  const colors = {
    teal: ["var(--teal-soft)", "var(--teal)"],
    coral: ["var(--indigo-soft)", "var(--indigo)"],
    gold: ["var(--gold-soft)", "var(--gold)"],
  }[tone];
  return (
    <article className="card stat">
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <span
          style={{ color: "var(--muted)", fontWeight: 750, fontSize: ".82rem" }}
        >
          {label}
        </span>
        <span
          style={{
            width: 34,
            height: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 9,
            background: colors[0],
            color: colors[1],
          }}
        >
          <Icon size={18} />
        </span>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        {detail && (
          <div className="hint" style={{ marginTop: ".4rem" }}>
            {detail}
          </div>
        )}
      </div>
    </article>
  );
}
export function Alert({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  return (
    <div
      className={cn("alert", error ? "alert-error" : "alert-success")}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      style={{
        display: "flex",
        gap: ".6rem",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{error || success}</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="card card-pad"
      style={{ textAlign: "center", paddingBlock: "3rem" }}
    >
      <span
        style={{
          width: 50,
          height: 50,
          display: "grid",
          placeItems: "center",
          borderRadius: 14,
          background: "var(--teal-soft)",
          color: "var(--teal)",
          margin: "0 auto 1rem",
        }}
      >
        <Inbox />
      </span>
      <h3 style={{ margin: "0 0 .4rem" }}>{title}</h3>
      <p
        style={{ color: "var(--muted)", margin: "0 auto 1rem", maxWidth: 480 }}
      >
        {description}
      </p>
      {action}
    </div>
  );
}
export function SafetyNote({ student = false }: { student?: boolean }) {
  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid var(--warning-line)",
        borderLeft: "3px solid var(--gold)",
        borderRadius: 10,
        background: "var(--gold-soft)",
        fontSize: ".82rem",
        color: "var(--warning-ink)",
        lineHeight: 1.55,
      }}
    >
      <strong>{student ? "Learn with support" : "Teacher control"}:</strong> AI
      output is a suggestion, may contain errors, and must be reviewed.{" "}
      {student
        ? "Use it to understand—not to replace your own work—and ask your teacher when unsure."
        : "Final teaching decisions, evaluation, marks, and published feedback remain with the teacher."}{" "}
      Do not enter names, contact details, answer-sheet images, or other personal
      or confidential information into AI prompts.
    </div>
  );
}
