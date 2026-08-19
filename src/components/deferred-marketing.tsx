"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { MotionAccordionItem } from "./motion-accordion";
import type { HoverExpandItem } from "./hover-expand";
import type { TextMorphProps } from "./text-morph";

type DeferredModule<Props extends object> = Promise<{
  default: ComponentType<Props>;
}>;

function DeferredIsland<Props extends object>({
  load,
  props,
  fallback,
  minHeight,
}: {
  load: () => DeferredModule<Props>;
  props: Props;
  fallback: ReactNode;
  minHeight: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Component, setComponent] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let started = false;

    const startLoading = () => {
      if (started) return;
      started = true;
      void load().then(({ default: LoadedComponent }) => {
        if (!cancelled) setComponent(() => LoadedComponent);
      });
    };

    if (!("IntersectionObserver" in window)) {
      startLoading();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        startLoading();
        observer.disconnect();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(host);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [load]);

  return (
    <div ref={hostRef} style={{ minHeight }}>
      {Component ? createElement(Component, props) : fallback}
    </div>
  );
}

const loadInterfaceShowcase = () =>
  import("./cinematic-interface-showcase").then(({ CinematicInterfaceShowcase }) => ({
    default: CinematicInterfaceShowcase,
  }));

const loadFeatureAtlas = () =>
  import("./feature-atlas").then(({ FeatureAtlas }) => ({ default: FeatureAtlas }));

const loadHoverExpand = () =>
  import("./hover-expand").then(({ HoverExpand }) => ({ default: HoverExpand }));

const loadMotionAccordion = () =>
  import("./motion-accordion").then(({ MotionAccordion }) => ({
    default: MotionAccordion,
  }));

const loadTextMorph = () =>
  import("./text-morph").then(({ default: TextMorph }) => ({ default: TextMorph }));

const placeholder = (label: string) => (
  <div className="deferred-marketing-placeholder" aria-label={`Loading ${label}`} />
);

export function DeferredCinematicInterfaceShowcase() {
  return (
    <DeferredIsland
      load={loadInterfaceShowcase}
      props={{}}
      fallback={placeholder("interface tour")}
      minHeight={520}
    />
  );
}

export function DeferredFeatureAtlas() {
  return (
    <DeferredIsland
      load={loadFeatureAtlas}
      props={{}}
      fallback={placeholder("feature atlas")}
      minHeight={560}
    />
  );
}

export function DeferredHoverExpand({ items }: { items: HoverExpandItem[] }) {
  return (
    <DeferredIsland
      load={loadHoverExpand}
      props={{ items }}
      fallback={placeholder("workflow showcase")}
      minHeight={304}
    />
  );
}

export function DeferredMotionAccordion({ items }: { items: MotionAccordionItem[] }) {
  return (
    <DeferredIsland
      load={loadMotionAccordion}
      props={{ items }}
      fallback={placeholder("frequently asked questions")}
      minHeight={420}
    />
  );
}

export function DeferredTextMorph(props: TextMorphProps) {
  return (
    <DeferredIsland
      load={loadTextMorph}
      props={props}
      fallback={placeholder("teaching cycle")}
      minHeight={180}
    />
  );
}
