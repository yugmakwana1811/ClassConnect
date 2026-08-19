"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
> & {
  label: string;
  hint?: ReactNode;
};

export function PasswordField({
  label,
  hint,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const actionLabel = visible
    ? `Hide ${label.toLowerCase()}`
    : `Show ${label.toLowerCase()}`;

  return (
    <div className="password-field">
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <div className="password-field-control">
        <input
          {...inputProps}
          id={inputId}
          className="field"
          type={visible ? "text" : "password"}
        />
        <button
          type="button"
          className="password-visibility-button"
          aria-label={actionLabel}
          aria-controls={inputId}
          aria-pressed={visible}
          title={actionLabel}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}
