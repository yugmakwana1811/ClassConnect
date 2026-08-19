"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MotionAccordionItem {
  question: React.ReactNode;
  answer: React.ReactNode;
}

export interface MotionAccordionProps {
  items: MotionAccordionItem[];
  gap?: number;
  className?: string;
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  itemId,
  panelId,
}: {
  item: MotionAccordionItem;
  isOpen: boolean;
  onToggle: () => void;
  itemId: string;
  panelId: string;
}) {
  return (
    <article className="motion-faq-item" data-open={isOpen}>
      <button
        className="motion-faq-trigger"
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{item.question}</span>
        <span
          className="motion-faq-icon"
          aria-hidden="true"
          data-open={isOpen}
        >
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>

      <div
        className="motion-faq-panel"
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        aria-hidden={!isOpen}
      >
        <div className="motion-faq-answer">
          {item.answer}
        </div>
      </div>
    </article>
  );
}

export function MotionAccordion({
  items,
  gap = 10,
  className,
}: MotionAccordionProps) {
  const rawId = React.useId();
  const baseId = `faq-${rawId.replace(/:/g, "")}`;
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className={cn("motion-faq", className)}>
      <div className="motion-faq-list" style={{ gap }}>
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() =>
              setOpenIndex((current) => (current === index ? null : index))
            }
            itemId={`${baseId}-trigger-${index}`}
            panelId={`${baseId}-panel-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
