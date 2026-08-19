import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { changePasswordAction } from "@/app/account-actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ error, success }] = await Promise.all([searchParams, requireUser()]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account security"
        title="Change your password"
        description="Use this dedicated dashboard to replace your password and secure access to your ClassConnect account."
        action={
          <Link href="/account" className="btn btn-secondary">
            <ArrowLeft size={16} /> Account settings
          </Link>
        }
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(260px,.55fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section className="card card-pad">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <KeyRound size={18} color="var(--coral)" />
            <div className="eyebrow">Password dashboard</div>
          </div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Set a new password
          </h2>
          <form
            action={changePasswordAction}
            style={{ display: "grid", gap: ".85rem" }}
          >
            <label>
              <span className="label">Current password</span>
              <input
                className="field"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                required
              />
            </label>
            <label>
              <span className="label">New password</span>
              <input
                className="field"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,}"
                required
              />
              <span className="hint">
                Use 10+ characters with uppercase, lowercase, number, and
                symbol.
              </span>
            </label>
            <label>
              <span className="label">Confirm new password</span>
              <input
                className="field"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
            </label>
            <SubmitButton
              pendingText="Securing account…"
              confirmMessage="Change your password and sign out every other active session?"
            >
              Change password
            </SubmitButton>
          </form>
        </section>
        <aside className="card card-pad">
          <ShieldCheck size={24} color="var(--teal)" />
          <h2 style={{ margin: ".7rem 0 .5rem", fontSize: "1.15rem" }}>
            Session protection
          </h2>
          <p className="hint" style={{ lineHeight: 1.65, margin: 0 }}>
            ClassConnect verifies your current password, securely hashes the new
            password, and signs out every other active session after a
            successful change.
          </p>
        </aside>
      </div>
    </div>
  );
}
