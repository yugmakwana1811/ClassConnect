import Link from "next/link";
import {
  ChevronRight,
  HeartHandshake,
  KeyRound,
  MailCheck,
  RefreshCw,
  UserRound,
  UserX,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { GradeSelect } from "@/components/education-selects";
import { updateAccountAction } from "@/app/account-actions";
import {
  regenerateParentAccessCodeAction,
  revokeParentAccessAction,
} from "@/app/parent-actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ error, success }, user] = await Promise.all([
    searchParams,
    requireUser(),
  ]);
  const parentConnections =
    user.role === "STUDENT"
      ? await db.parentStudent.findMany({
          where: { studentId: user.studentProfile!.id },
          include: { parent: { include: { user: true } } },
          orderBy: { linkedAt: "asc" },
        })
      : [];
  const profile =
    user.role === "TEACHER"
      ? user.teacherProfile
      : user.role === "STUDENT"
        ? user.studentProfile
        : user.parentProfile;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Account settings"
        title="Your profile and security"
        description="Keep your professional or learner details current and protect access to classroom data."
      />
      <Alert error={error} success={success} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.1fr) minmax(300px,.9fr)",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section className="card card-pad">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <UserRound size={18} color="var(--teal)" />
            <div className="eyebrow">Profile</div>
          </div>
          <h2
            className="display"
            style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
          >
            Account details
          </h2>
          <form
            action={updateAccountAction}
            style={{ display: "grid", gap: ".85rem" }}
          >
            <label>
              <span className="label">Full name</span>
              <input
                className="field"
                name="name"
                defaultValue={user.name}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              <span className="label">Email address</span>
              <input className="field" value={user.email} disabled />
              <span className="hint">
                Use the secure email-change form. Your current password verifies
                account control.
              </span>
            </label>
            <label>
              <span className="label">
                School <span className="hint">(optional)</span>
              </span>
              <input
                className="field"
                name="school"
                defaultValue={profile?.school ?? ""}
                maxLength={120}
              />
            </label>
            {user.role === "TEACHER" ? (
              <label>
                <span className="label">
                  Primary subject <span className="hint">(optional)</span>
                </span>
                <input
                  className="field"
                  name="subject"
                  defaultValue={user.teacherProfile?.subject ?? ""}
                  maxLength={80}
                />
              </label>
            ) : user.role === "STUDENT" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: ".7rem",
                }}
              >
                <label>
                  <span className="label">Grade</span>
                  <GradeSelect
                    defaultValue={user.studentProfile?.grade ?? ""}
                  />
                </label>
                <label>
                  <span className="label">Roll number</span>
                  <input
                    className="field"
                    name="rollNumber"
                    defaultValue={user.studentProfile?.rollNumber ?? ""}
                    maxLength={30}
                  />
                </label>
              </div>
            ) : (
              <div
                className="hint"
                style={{
                  padding: ".8rem",
                  borderRadius: 10,
                  background: "var(--teal-soft)",
                }}
              >
                Student connections and family access are managed from the
                parent workspace.
              </div>
            )}
            <SubmitButton pendingText="Saving profile…">
              Save profile
            </SubmitButton>
          </form>
        </section>
        <aside style={{ display: "grid", gap: "1rem" }}>
          {user.role === "STUDENT" ? (
            <section className="card card-pad">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <HeartHandshake size={18} color="var(--teal)" />
                <div className="eyebrow">Parent access</div>
              </div>
              <h2
                className="display"
                style={{ fontSize: "1.8rem", margin: ".3rem 0 .6rem" }}
              >
                Connect your family
              </h2>
              <p className="hint" style={{ lineHeight: 1.55 }}>
                Share your sign-in email and this private code only with a
                parent or guardian you trust.
              </p>
              <div
                style={{
                  padding: ".8rem",
                  borderRadius: 10,
                  background: "var(--teal-soft)",
                  letterSpacing: ".14em",
                  fontWeight: 900,
                  textAlign: "center",
                }}
              >
                {user.studentProfile!.parentAccessCode}
              </div>
              <form
                action={regenerateParentAccessCodeAction}
                style={{ marginTop: ".7rem" }}
              >
                <SubmitButton
                  className="btn btn-secondary"
                  pendingText="Generating…"
                  confirmMessage="Generate a new parent access code? The current code will stop working, but existing parent connections will remain."
                >
                  <RefreshCw size={15} /> Generate a new code
                </SubmitButton>
              </form>
              <div style={{ marginTop: "1rem" }}>
                <strong style={{ fontSize: ".82rem" }}>
                  Connected parents and guardians
                </strong>
                {parentConnections.length ? (
                  parentConnections.map((connection) => (
                    <div
                      key={connection.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: ".6rem",
                        padding: ".65rem 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span>
                        <strong style={{ fontSize: ".82rem" }}>
                          {connection.parent.user.name}
                        </strong>
                        <span className="hint" style={{ display: "block" }}>
                          {connection.relationship || "Parent or guardian"}
                        </span>
                      </span>
                      <form action={revokeParentAccessAction}>
                        <input type="hidden" name="id" value={connection.id} />
                        <SubmitButton
                          className="btn btn-danger"
                          pendingText="Revoking…"
                          confirmMessage={`Remove access for ${connection.parent.user.name}?`}
                        >
                          <UserX size={14} /> Revoke
                        </SubmitButton>
                      </form>
                    </div>
                  ))
                ) : (
                  <p className="hint">No parent accounts are connected yet.</p>
                )}
              </div>
            </section>
          ) : null}
          <Link
            href="/account/email"
            className="card card-pad"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <MailCheck size={18} color="var(--teal)" />
              <div className="eyebrow">Sign-in email</div>
            </div>
            <h2
              className="display"
              style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
            >
              Change email address
            </h2>
            <p
              style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}
            >
              Open a dedicated dashboard to verify your password and update the
              email used to sign in.
            </p>
            <span
              className="btn btn-secondary"
              style={{ marginTop: "1rem", width: "fit-content" }}
            >
              Change Email <ChevronRight size={16} />
            </span>
          </Link>
          <Link
            href="/account/password"
            className="card card-pad"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <KeyRound size={18} color="var(--coral)" />
              <div className="eyebrow">Security</div>
            </div>
            <h2
              className="display"
              style={{ fontSize: "1.8rem", margin: ".3rem 0 1rem" }}
            >
              Change password
            </h2>
            <p
              style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}
            >
              Open a separate security dashboard to choose a new password and
              protect your active sessions.
            </p>
            <span
              className="btn btn-secondary"
              style={{ marginTop: "1rem", width: "fit-content" }}
            >
              Change Password <ChevronRight size={16} />
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
