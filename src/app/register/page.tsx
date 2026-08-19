import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/ui";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell auth-shell-register">
      <section className="auth-main">
        <div className="auth-main-bar">
          <Logo />
          <Link href="/login" className="auth-back-link">
            <ArrowLeft size={15} /> Sign in
          </Link>
        </div>
        <div className="auth-form-wrap auth-form-wrap-wide">
          <div className="eyebrow">Create account</div>
          <h1 className="display auth-title">Build your ClassConnect workspace</h1>
          <p className="auth-description">
            Choose your role carefully. It controls which classroom data and
            actions your account can access.
          </p>
          <Alert error={error} />
          <RegisterForm />
          <p
            className="hint"
            style={{ textAlign: "center", marginTop: "1.2rem" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--teal)", fontWeight: 800 }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
      <aside className="auth-aside">
        <div className="auth-aside-index">02 / CREATE</div>
        <div>
          <div className="eyebrow">Your secure workspace</div>
          <h2 className="display">Keep teaching, learning, and family support connected.</h2>
          <div className="auth-benefits">
            {[
              "Role-protected teacher, student, and parent workspaces",
              "Private classroom resources and submissions",
              "Teacher-controlled AI suggestions",
            ].map((item) => (
              <div key={item}>
                <CheckCircle2 size={17} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <small>
          <ShieldCheck size={14} /> Passwords are hashed and sessions use
          HTTP-only cookies.
        </small>
      </aside>
    </main>
  );
}
