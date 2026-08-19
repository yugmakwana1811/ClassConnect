import { Sparkles } from "lucide-react";

export function LoadingScreen({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={`loading-screen${compact ? " loading-screen-compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-glow loading-glow-one" aria-hidden="true" />
      <div className="loading-glow loading-glow-two" aria-hidden="true" />

      <div className="loading-panel">
        <div className="loading-brand" aria-hidden="true">
          <span className="loading-brand-mark">
            <Sparkles size={22} strokeWidth={2.2} />
          </span>
          <span className="loading-brand-name">
            ClassConnect
          </span>
        </div>

        <div className="loading-orbit" aria-hidden="true">
          <span className="loading-orbit-ring" />
          <span className="loading-orbit-core">
            <Sparkles size={24} strokeWidth={2} />
          </span>
          <span className="loading-orbit-dot loading-orbit-dot-one" />
          <span className="loading-orbit-dot loading-orbit-dot-two" />
        </div>

        <div className="loading-copy">
          <strong>Preparing your learning workspace</strong>
          <span>Bringing your classes, insights, and tools into focus.</span>
        </div>

        <div className="loading-progress" aria-hidden="true">
          <span />
        </div>
        <span className="sr-only">Loading ClassConnect. Please wait.</span>
      </div>
    </div>
  );
}
