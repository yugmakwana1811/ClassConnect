"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type NavigationFeedbackValue = {
  pendingHref: string | null;
  beginNavigation: (href: string) => void;
};

const NavigationFeedbackContext = createContext<NavigationFeedbackValue>({
  pendingHref: null,
  beginNavigation: () => undefined,
});

function pathnameFor(href: string) {
  try {
    return new URL(href, "https://classconnect.local").pathname;
  } catch {
    return href.split("?")[0] ?? href;
  }
}

export function NavigationFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const beginNavigation = useCallback(
    (href: string) => {
      const destination = pathnameFor(href);
      setPendingHref(destination === pathname ? null : destination);
    },
    [pathname],
  );

  const activePendingHref = pendingHref === pathname ? null : pendingHref;

  useEffect(() => {
    if (!activePendingHref) return;
    const timeout = window.setTimeout(() => setPendingHref(null), 12_000);
    return () => window.clearTimeout(timeout);
  }, [activePendingHref]);

  useEffect(() => {
    function beginInternalLinkNavigation(event: MouseEvent | PointerEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download"))
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      beginNavigation(destination.pathname);
    }

    function handlePointerIntent(event: PointerEvent) {
      beginInternalLinkNavigation(event);
    }

    function handleKeyboardClick(event: MouseEvent) {
      if (event.detail !== 0) return;
      beginInternalLinkNavigation(event);
    }

    document.addEventListener("pointerdown", handlePointerIntent, true);
    document.addEventListener("click", handleKeyboardClick, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerIntent, true);
      document.removeEventListener("click", handleKeyboardClick, true);
    };
  }, [beginNavigation]);

  const value = useMemo(
    () => ({ pendingHref: activePendingHref, beginNavigation }),
    [activePendingHref, beginNavigation],
  );

  return (
    <NavigationFeedbackContext.Provider value={value}>
      {children}
      <div
        className="navigation-progress"
        data-active={activePendingHref ? "true" : "false"}
        aria-hidden="true"
      />
      <div
        className="navigation-status"
        data-active={activePendingHref ? "true" : "false"}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="navigation-status-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{activePendingHref ? "Opening workspace" : ""}</span>
      </div>
    </NavigationFeedbackContext.Provider>
  );
}

export function useNavigationFeedback() {
  return useContext(NavigationFeedbackContext);
}
