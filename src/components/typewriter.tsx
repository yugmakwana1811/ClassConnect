"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

type TypewriterTiming = {
  /** Per-character typing speed in seconds. */
  duration?: number;
  /** Hold time before deletion starts, in seconds. */
  delay?: number;
};

type TypewriterFont = React.CSSProperties & {
  /** Framer font controls include this non-CSS field. */
  variant?: string;
};

export type TypewriterProps = {
  texts: string[];
  prefix?: string;
  ease?: TypewriterTiming;
  deleteSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  hideCursorOnType?: boolean;
  cursorChar?: string;
  cursorAnimationVariants?: Variants;
  font?: TypewriterFont;
  color?: string;
  typedColor?: string;
  cursorColor?: string;
  className?: string;
  style?: React.CSSProperties;
};

const DEFAULT_CURSOR_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.01,
      repeat: Infinity,
      repeatDelay: 0.4,
      repeatType: "reverse",
    },
  },
};

/**
 * Types a list of phrases one character at a time. The component preserves a
 * stable server render, cleans up every timer, and shows a completed phrase
 * when the visitor has requested reduced motion.
 */
export default function Typewriter({
  texts,
  prefix = "",
  ease = { duration: 0.07, delay: 1.5 },
  deleteSpeed = 0.1,
  loop = true,
  showCursor = true,
  hideCursorOnType = false,
  cursorChar = "_",
  cursorAnimationVariants = DEFAULT_CURSOR_VARIANTS,
  font = {
    fontFamily:
      '"Inter", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
    fontSize: 80,
    fontWeight: 400,
    lineHeight: "1.4em",
    letterSpacing: "-0.025em",
  },
  color = "#FFFFFF",
  typedColor = "#FFFFFF",
  cursorColor = "",
  className,
  style,
}: TypewriterProps) {
  const reduceMotion = useReducedMotion();
  const list = React.useMemo(
    () => texts.filter((text): text is string => typeof text === "string"),
    [texts],
  );
  const textsKey = JSON.stringify(list);
  const freshState = {
    textsKey,
    displayText: "",
    currentIndex: 0,
    currentTextIndex: 0,
    isDeleting: false,
  };
  const [typing, setTyping] = React.useState(freshState);
  const textsChanged = typing.textsKey !== textsKey;
  if (textsChanged) setTyping(freshState);
  const {
    displayText,
    currentIndex,
    currentTextIndex,
    isDeleting,
  } = textsChanged ? freshState : typing;

  const typeDelayMs = Math.max(0, (ease.duration ?? 0.07) * 1000);
  const holdMs = Math.max(0, (ease.delay ?? 1.5) * 1000);
  const deleteDelayMs = Math.max(0, deleteSpeed * 1000);
  const currentText = list[currentTextIndex] ?? "";

  React.useEffect(() => {
    if (reduceMotion || list.length === 0) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (isDeleting) {
      if (displayText.length === 0) {
        timeout = setTimeout(() => {
          setTyping((state) => ({
            ...state,
            isDeleting: false,
            currentTextIndex: (state.currentTextIndex + 1) % list.length,
            currentIndex: 0,
          }));
        }, typeDelayMs);
      } else {
        timeout = setTimeout(
          () =>
            setTyping((state) => ({
              ...state,
              displayText: state.displayText.slice(0, -1),
            })),
          deleteDelayMs,
        );
      }
    } else if (currentIndex < currentText.length) {
      timeout = setTimeout(() => {
        setTyping((state) => ({
          ...state,
          displayText: state.displayText + currentText[state.currentIndex],
          currentIndex: state.currentIndex + 1,
        }));
      }, typeDelayMs);
    } else {
      const hasNextText =
        list.length > 1 && (loop || currentTextIndex < list.length - 1);
      if (hasNextText) {
        timeout = setTimeout(
          () => setTyping((state) => ({ ...state, isDeleting: true })),
          holdMs,
        );
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [
    currentIndex,
    currentText,
    currentTextIndex,
    deleteDelayMs,
    displayText,
    holdMs,
    isDeleting,
    list.length,
    loop,
    reduceMotion,
    typeDelayMs,
  ]);

  const renderedText = reduceMotion ? (list[0] ?? "") : displayText;
  const isActivelyTyping =
    !reduceMotion &&
    list.length > 0 &&
    (isDeleting || (currentIndex > 0 && currentIndex < currentText.length));
  const cursorHidden = hideCursorOnType && isActivelyTyping;
  const resolvedCursorColor = cursorColor || typedColor;
  const textAlign = font.textAlign;
  const fontCss = Object.fromEntries(
    Object.entries(font).filter(
      ([property]) => property !== "variant" && property !== "textAlign",
    ),
  ) as React.CSSProperties;
  const accessibleText = `${prefix}${currentText || list[0] || ""}`;

  return (
    <div
      className={className}
      role="status"
      aria-label={accessibleText}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: textAlign === "center" ? "center" : "flex-start",
        textAlign,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline",
          whiteSpace: "pre-wrap",
          letterSpacing: "-0.025em",
          ...fontCss,
          color,
        }}
      >
        {prefix && <span>{prefix}</span>}
        <span style={{ color: typedColor }}>{renderedText}</span>
        {showCursor &&
          (reduceMotion ? (
            <span
              style={{
                color: resolvedCursorColor,
                marginLeft: "0.25rem",
                visibility: cursorHidden ? "hidden" : "visible",
              }}
            >
              {cursorChar}
            </span>
          ) : (
            <motion.span
              variants={cursorAnimationVariants}
              initial="initial"
              animate="animate"
              style={{
                color: resolvedCursorColor,
                marginLeft: "0.25rem",
                visibility: cursorHidden ? "hidden" : "visible",
              }}
            >
              {cursorChar}
            </motion.span>
          ))}
      </span>
    </div>
  );
}
