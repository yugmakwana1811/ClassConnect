"use client";

import { useState } from "react";
import { GraduationCap, UserRound } from "lucide-react";
import { registerAction } from "@/app/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { GradeSelect } from "@/components/education-selects";
import { PasswordField } from "@/components/password-field";

export function RegisterForm() {
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  return (
    <form action={registerAction} style={{ display: "grid", gap: ".9rem" }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">I am joining as</legend>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: ".6rem",
          }}
        >
          {(["TEACHER", "STUDENT"] as const).map((option) => {
            const Icon = option === "TEACHER" ? GraduationCap : UserRound;
            return (
              <label
                key={option}
                className="card"
                style={{
                  padding: ".8rem",
                  cursor: "pointer",
                  borderColor: role === option ? "var(--teal)" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                  style={{ marginRight: ".45rem" }}
                />
                <Icon
                  size={16}
                  style={{ verticalAlign: "middle", marginRight: ".35rem" }}
                />
                <strong>{option === "TEACHER" ? "Teacher" : "Student"}</strong>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: ".7rem",
        }}
      >
        <label>
          <span className="label">Full name</span>
          <input
            className="field"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          <span className="label">
            School <span className="hint">(optional)</span>
          </span>
          <input
            className="field"
            name="school"
            autoComplete="organization"
            maxLength={120}
          />
        </label>
      </div>
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
      {role === "TEACHER" ? (
        <label>
          <span className="label">
            Primary subject <span className="hint">(optional)</span>
          </span>
          <input
            className="field"
            name="subject"
            maxLength={80}
            placeholder="Accountancy"
          />
        </label>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: ".7rem",
          }}
        >
          <label>
            <span className="label">Grade</span>
            <GradeSelect />
          </label>
          <label>
            <span className="label">
              Roll number <span className="hint">(optional)</span>
            </span>
            <input className="field" name="rollNumber" maxLength={30} />
          </label>
        </div>
      )}
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        minLength={10}
        maxLength={128}
        pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,}"
        title="Use 10+ characters with uppercase, lowercase, number, and special character"
        hint="10+ characters with uppercase, lowercase, number, and symbol."
        required
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        minLength={10}
        maxLength={128}
        required
      />
      <SubmitButton pendingText="Creating secure account…">
        Create my account
      </SubmitButton>
    </form>
  );
}
