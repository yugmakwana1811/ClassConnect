"use client";

import * as React from "react";

type EasePreset =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "circIn"
  | "circOut"
  | "circInOut"
  | "backIn"
  | "backOut"
  | "backInOut";

type TextMorphEase = EasePreset | readonly [number, number, number, number];

type TextMorphFont = React.CSSProperties & {
  /** Framer font controls include this non-CSS field. */
  variant?: string;
};

export type TextMorphProps = {
  words?: string | string[];
  transition?: {
    duration?: number;
    delay?: number;
    ease?: TextMorphEase;
  };
  color?: string;
  font?: TextMorphFont;
  tag?: "div" | "span" | "p" | "h2" | "h3";
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  dataDepth?: string;
};

function mapEaseToCSS(ease: TextMorphEase | undefined): string {
  if (Array.isArray(ease) && ease.length === 4) {
    return `cubic-bezier(${ease.join(",")})`;
  }

  switch (ease) {
    case "linear":
      return "linear";
    case "easeIn":
      return "ease-in";
    case "easeOut":
      return "ease-out";
    case "circIn":
      return "cubic-bezier(0.6, 0.04, 0.98, 0.335)";
    case "circOut":
      return "cubic-bezier(0.075, 0.82, 0.165, 1)";
    case "circInOut":
      return "cubic-bezier(0.785, 0.135, 0.15, 0.86)";
    case "backIn":
      return "cubic-bezier(0.6, -0.28, 0.735, 0.045)";
    case "backOut":
      return "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    case "backInOut":
      return "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    case "easeInOut":
    default:
      return "ease-in-out";
  }
}

/**
 * Morphs between words with a blurred crossfade. The longest word reserves
 * width to prevent layout shifts, while reduced-motion modes show the first
 * word as a stable representative frame.
 */
export default function TextMorph({
  words = "TEXT\nMORPH",
  transition = {
    duration: 1,
    delay: 1,
    ease: "easeInOut",
  },
  color = "#FFFFFF",
  font = {
    fontFamily:
      '"Inter", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 120,
    lineHeight: "1.2em",
    letterSpacing: "0em",
    textAlign: "center",
  },
  tag = "div",
  className,
  style,
  ariaLabel,
  dataDepth,
}: TextMorphProps) {
  const wordList = React.useMemo(
    () =>
      (Array.isArray(words) ? words : words.split(/\r?\n|,/))
        .map((word) => word.trim())
        .filter(Boolean),
    [words],
  );

  const rawId = React.useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filterId = `tm-filter-${safeId}`;
  const animationName = `tm-rotate-${safeId}`;
  const rootClass = `tm-root-${safeId}`;
  const morph = Math.max(0.1, transition.duration ?? 1);
  const hold = Math.max(0, transition.delay ?? 1);
  const slot = morph + hold;
  const count = Math.max(1, wordList.length);
  const cycle = slot * count;
  const percentage = (seconds: number) =>
    Math.min(100, (seconds / cycle) * 100).toFixed(4);
  const morphIn = percentage(morph);
  const holdEnd = percentage(morph + hold);
  const morphOut = percentage(2 * morph + hold);
  const ease = mapEaseToCSS(transition.ease);
  const Tag = tag;
  const textAlign = font.textAlign ?? "center";
  const fontStyle = Object.fromEntries(
    Object.entries(font).filter(
      ([property]) => property !== "variant" && property !== "textAlign",
    ),
  ) as React.CSSProperties;
  const longest = wordList.reduce(
    (current, word) => (word.length > current.length ? word : current),
    "",
  );
  const accessibleLabel =
    ariaLabel ?? (wordList.length ? wordList.join(", ") : "Animated text");

  const keyframes = `
@keyframes ${animationName} {
  0% {
    opacity: 0;
    filter: blur(20px);
    transform: translate(-50%, -50%) scale(0.8);
  }
  ${morphIn}% {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -50%) scale(1);
  }
  ${holdEnd}% {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -50%) scale(1);
  }
  ${morphOut}%, 100% {
    opacity: 0;
    filter: blur(20px);
    transform: translate(-50%, -50%) scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .${rootClass} [data-morph-word] {
    animation: none !important;
    filter: none !important;
    opacity: 0 !important;
    transform: translate(-50%, -50%) scale(1) !important;
  }
  .${rootClass} [data-morph-word="0"] {
    opacity: 1 !important;
  }
}

.cinematic-no-motion .${rootClass} [data-morph-word],
.cinematic-lite .${rootClass} [data-morph-word] {
  animation: none !important;
  filter: none !important;
  opacity: 0 !important;
  transform: translate(-50%, -50%) scale(1) !important;
}

.cinematic-no-motion .${rootClass} [data-morph-word="0"],
.cinematic-lite .${rootClass} [data-morph-word="0"] {
  opacity: 1 !important;
}
`;

  return (
    <Tag
      className={[rootClass, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={accessibleLabel}
      data-depth={dataDepth}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        userSelect: "none",
        ...style,
      }}
    >
      <style>{keyframes}</style>

      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <span
        aria-hidden="true"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign,
          filter: `url(#${filterId})`,
          ...fontStyle,
        }}
      >
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: 1.2,
            minHeight: "1.2em",
          }}
        >
          <span
            style={{
              visibility: "hidden",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {longest || " "}
          </span>

          {wordList.map((word, index) => (
            <span
              data-morph-word={index}
              key={`${word}-${index}`}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                opacity: 0,
                color,
                whiteSpace: "nowrap",
                animation: `${animationName} ${cycle}s ${(slot * index).toFixed(3)}s infinite ${ease}`,
                willChange: "opacity, filter, transform",
              }}
            >
              {word}
            </span>
          ))}
        </span>
      </span>
    </Tag>
  );
}
