import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PasswordField } from "@/components/password-field";
import { loginAction } from "@/app/actions";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-main">
        <div className="auth-main-bar">
          <Logo />
          <Link href="/" className="auth-back-link">
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
        <div className="auth-form-wrap">
          <div className="eyebrow">Welcome back</div>
          <h1 className="display auth-title">Open your workspace</h1>
          <p className="auth-description">
            Sign in to your protected teacher, student, or parent workspace.
          </p>
          <Alert error={error} />
          <form action={loginAction} className="auth-form">
            <label>
              <span className="label">Email address</span>
              <input
                className="field"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
            <SubmitButton pendingText="Opening workspace…">
              Sign in securely
            </SubmitButton>
          </form>
          <details className="auth-preview">
            <summary>
              Expo preview accounts
            </summary>
            <div
              className="grid-auto"
              style={{
                marginTop: ".8rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              }}
            >
              <div
                className="card"
                style={{ padding: ".8rem", background: "var(--teal-soft)" }}
              >
                <GraduationCap size={18} color="var(--teal)" />
                <strong
                  style={{
                    display: "block",
                    fontSize: ".8rem",
                    marginTop: ".3rem",
                  }}
                >
                  Teacher preview
                </strong>
                <small className="hint">teacher@edugrade.ai</small>
              </div>
              <div
                className="card"
                style={{ padding: ".8rem", background: "var(--indigo-soft)" }}
              >
                <ShieldCheck size={18} color="var(--coral)" />
                <strong
                  style={{
                    display: "block",
                    fontSize: ".8rem",
                    marginTop: ".3rem",
                  }}
                >
                  Student preview
                </strong>
                <small className="hint">student@edugrade.ai</small>
              </div>
              <div
                className="card"
                style={{ padding: ".8rem", background: "var(--gold-soft)" }}
              >
                <HeartHandshake size={18} color="var(--gold)" />
                <strong
                  style={{
                    display: "block",
                    fontSize: ".8rem",
                    marginTop: ".3rem",
                  }}
                >
                  Parent preview
                </strong>
                <small className="hint">parent@edugrade.ai</small>
              </div>
              <small className="hint" style={{ gridColumn: "1 / -1" }}>
                Preview password: EduGrade@123
              </small>
            </div>
          </details>
          <p className="hint auth-footnote">
            New to ClassConnect?{" "}
            <Link
              href="/register"
              style={{ color: "var(--teal)", fontWeight: 800 }}
            >
              Create a teacher, student, or parent account
            </Link>
          </p>
          <p className="hint auth-footnote auth-security-copy">
            Authentication uses hashed passwords, rate limiting, database
            sessions, and HTTP-only cookies.
          </p>
        </div>
      </section>
      <aside className="auth-aside">
        <div className="auth-aside-index">01 / ACCESS</div>
        <div>
          <div className="eyebrow">Connected classroom platform</div>
          <h2 className="display">One secure entry point for the whole teaching cycle.</h2>
          <div className="auth-benefits">
            {[
              "Plan and create editable teaching material",
              "Collect and review handwritten work",
              "Publish teacher-approved feedback and insights",
            ].map((item) => (
              <div key={item}>
                <CheckCircle2 size={17} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <small>Secure role-based access · Teacher-controlled AI</small>
      </aside>
    </main>
  );
}
