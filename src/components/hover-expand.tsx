"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HoverExpandItem {
  label: string;
  sublabel?: string;
  image: string;
  imageAlt?: string;
  description?: string;
}

export interface HoverExpandProps {
  items: HoverExpandItem[];
  collapsedHeight?: number;
  expandedHeight?: number;
  className?: string;
}

export function HoverExpand({
  items,
  collapsedHeight = 76,
  expandedHeight = 350,
  className,
}: HoverExpandProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <div className={cn("hover-expand", className)}>
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        const isMuted = activeIndex !== null && !isActive;

        return (
          <button
            className="hover-expand-item"
            type="button"
            key={item.label}
            aria-expanded={isActive}
            aria-label={`${item.label}${item.description ? `: ${item.description}` : ""}`}
            style={{
              height: isActive ? expandedHeight : collapsedHeight,
              opacity: isMuted ? 0.48 : 1,
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={(event) => {
              if (document.activeElement !== event.currentTarget) {
                setActiveIndex(null);
              }
            }}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => setActiveIndex(index)}
          >
            <span
              className="hover-expand-image"
              aria-hidden="true"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `scale(${isActive ? 1 : 1.045})`,
              }}
            >
              <Image
                src={item.image}
                alt=""
                fill
                loading={index === 0 ? "eager" : "lazy"}
                sizes="(max-width: 768px) 100vw, 1200px"
              />
              <span className="hover-expand-shade" />
            </span>

            <span className="hover-expand-content">
              <span className="hover-expand-main">
                <span
                  className="hover-expand-number"
                  style={{ color: isActive ? "#ffffff" : "var(--muted)" }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="hover-expand-label"
                  style={{ color: isActive ? "#ffffff" : "var(--ink)" }}
                >
                  {item.label}
                </span>
                {item.description ? (
                  <span
                    className="hover-expand-description"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: `translateX(${isActive ? 0 : -8}px)`,
                      transitionDelay: isActive ? "0.1s" : "0s",
                    }}
                  >
                    — {item.description}
                  </span>
                ) : null}
              </span>

              <span
                className="hover-expand-meta"
                style={{
                  color: isActive ? "rgba(255,255,255,.82)" : "var(--muted)",
                }}
              >
                {item.sublabel}
                <ArrowUpRight size={15} aria-hidden="true" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
