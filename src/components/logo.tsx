import Link from "next/link";
import { Sparkles } from "lucide-react";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand-logo${light ? " brand-logo-light" : ""}`}
    >
      <span className="brand-mark">
        <Sparkles size={19} />
      </span>
      <span className="brand-wordmark">
        ClassConnect
      </span>
    </Link>
  );
}
