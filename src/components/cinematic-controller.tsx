"use client";

import { useEffect } from "react";

const depthFactors: Record<string, number> = {
  "0": 0.1,
  "1": 0.25,
  "2": 0.5,
  "3": 0.8,
  "4": 1,
  "5": 1.2,
};

export function CinematicController() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("cinematic-ready");
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const useLiteMode = coarsePointer || reducedMotion;

    root.classList.toggle("cinematic-no-motion", reducedMotion);
    root.classList.toggle("cinematic-lite", useLiteMode);

    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-cinematic-reveal]"),
    );
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-cinematic-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    revealElements.forEach((element) => revealObserver.observe(element));

    if (useLiteMode) {
      document
        .querySelectorAll<HTMLElement>("[data-depth]")
        .forEach((layer) => layer.style.removeProperty("--depth-shift"));
      return () => revealObserver.disconnect();
    }

    const activeScenes = new Set<HTMLElement>();
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const scene = entry.target as HTMLElement;
          if (entry.isIntersecting) activeScenes.add(scene);
          else activeScenes.delete(scene);
        });
      },
      { rootMargin: "20% 0px" },
    );

    document
      .querySelectorAll<HTMLElement>("[data-cinematic-scene]")
      .forEach((scene) => sceneObserver.observe(scene));

    let animationFrame = 0;

    function updateDepth() {
      animationFrame = 0;
      const viewportHeight = window.innerHeight;

      activeScenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        const progress =
          (viewportHeight - rect.top) / (viewportHeight + rect.height) - 0.5;

        scene.querySelectorAll<HTMLElement>("[data-depth]").forEach((layer) => {
          const factor = depthFactors[layer.dataset.depth ?? "4"] ?? 1;
          const shift = Math.max(-36, Math.min(36, progress * 44 * factor));
          layer.style.setProperty("--depth-shift", `${shift.toFixed(2)}px`);
        });
      });
    }

    function requestDepthUpdate() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateDepth);
    }

    updateDepth();
    window.addEventListener("scroll", requestDepthUpdate, { passive: true });
    window.addEventListener("resize", requestDepthUpdate);

    return () => {
      revealObserver.disconnect();
      sceneObserver.disconnect();
      window.removeEventListener("scroll", requestDepthUpdate);
      window.removeEventListener("resize", requestDepthUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}

export function CinematicLayers({
  variant = "blue",
}: {
  variant?: "blue" | "teal" | "mist";
}) {
  return (
    <div className={`cinematic-layers cinematic-layers-${variant}`} aria-hidden="true">
      <div className="cinematic-layer cinematic-depth-0" data-depth="0" />
      <div className="cinematic-layer cinematic-depth-1" data-depth="1" />
      <div className="cinematic-layer cinematic-depth-2" data-depth="2">
        <span className="cinematic-orb cinematic-orb-one" />
        <span className="cinematic-orb cinematic-orb-two" />
      </div>
    </div>
  );
}
