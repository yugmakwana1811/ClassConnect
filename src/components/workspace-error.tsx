"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useEffect } from "react";

export default function WorkspaceError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page">
      <section className="card card-pad workspace-error" role="alert">
        <span className="workspace-error-icon" aria-hidden="true">
          <AlertTriangle size={24} />
        </span>
        <div>
          <div className="eyebrow">This section did not refresh</div>
          <h1 className="display">The workspace is still available.</h1>
          <p>
            Only this section failed to load. Your navigation and the rest of
            ClassConnect remain usable.
          </p>
          {error.digest && <p className="hint">Reference: {error.digest}</p>}
          <button className="btn btn-primary" onClick={unstable_retry}>
            <RotateCw size={16} /> Retry this section
          </button>
        </div>
      </section>
    </div>
  );
}
