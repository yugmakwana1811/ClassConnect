"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
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
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <div
        className="card card-pad"
        style={{ maxWidth: 540, textAlign: "center" }}
      >
        <AlertTriangle
          size={38}
          color="var(--coral)"
          style={{ margin: "auto" }}
        />
        <h1
          className="display"
          style={{ fontSize: "2.5rem", margin: "1rem 0 .5rem" }}
        >
          ClassConnect couldn’t load this page.
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          The request did not complete. Try again once; if it continues, return
          to the home page and share the reference below with support.
        </p>
        {error.digest && <p className="hint">Reference: {error.digest}</p>}
        <div
          style={{
            display: "flex",
            gap: ".6rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-primary" onClick={unstable_retry}>
            Try again
          </button>
          <Link className="btn btn-secondary" href="/">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
