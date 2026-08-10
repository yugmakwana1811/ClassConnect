import Link from "next/link";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { changeEmailAction } from "@/app/account-actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function ChangeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ error, success }, user] = await Promise.all([
    searchParams,
    requireUser(),
  ]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account security"
        title="Change your sign-in email"
        description="Use this dedicated dashboard to update the email address connected to your ClassConnect account."
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
            <MailCheck size={18} color="var(--teal)" />
            <div className="eyebrow">Email dashboard</div>
          </div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Verify and update
          </h2>
          <form
            action={changeEmailAction}
            style={{ display: "grid", gap: ".85rem" }}
          >
            <label>
              <span className="label">Current email address</span>
              <input className="field" value={user.email} disabled />
            </label>
            <label>
              <span className="label">New email address</span>
              <input
                className="field"
                name="newEmail"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <label>
              <span className="label">Confirm new email</span>
              <input
                className="field"
                name="confirmEmail"
                type="email"
                autoComplete="off"
                maxLength={254}
                required
              />
            </label>
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
            <SubmitButton
              pendingText="Changing email…"
              confirmMessage="Change your sign-in email and sign out every other active session?"
            >
              Change email securely
            </SubmitButton>
          </form>
        </section>
        <aside className="card card-pad">
          <ShieldCheck size={24} color="var(--teal)" />
          <h2 style={{ margin: ".7rem 0 .5rem", fontSize: "1.15rem" }}>
            What happens next?
          </h2>
          <p className="hint" style={{ lineHeight: 1.65, margin: 0 }}>
            Your current password verifies account control. After the change,
            other active sessions are signed out and the new address becomes
            your sign-in email.
          </p>
          <p className="hint" style={{ lineHeight: 1.65 }}>
            Mailbox ownership is not independently verified because outbound
            verification email is not configured.
          </p>
        </aside>
      </div>
    </div>
  );
}
