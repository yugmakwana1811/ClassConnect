"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef } from "react";
import { FloatingTooltip } from "./floating-tooltip";
import { useNavigationFeedback } from "./navigation-feedback";

export function AppNavLink({
  href,
  label,
  icon,
  eager = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  eager?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingHref } = useNavigationFeedback();
  const prefetched = useRef(false);
  const isOverview =
    href === "/teacher" || href === "/student" || href === "/parent";
  const pathActive = isOverview ? pathname === href : pathname.startsWith(href);
  const pendingActive = pendingHref
    ? isOverview
      ? pendingHref === href
      : pendingHref.startsWith(href)
    : false;
  const active = pendingHref ? pendingActive : pathActive;

  function prefetchOnIntent() {
    if (prefetched.current) return;
    prefetched.current = true;
    void router.prefetch(href);
    window.setTimeout(() => {
      prefetched.current = false;
    }, 90_000);
  }

  const link = (
    <Link
      className="nav-link"
      href={href}
      prefetch={eager ? true : null}
      onMouseEnter={prefetchOnIntent}
      onFocus={prefetchOnIntent}
      onTouchStart={prefetchOnIntent}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      data-navigation-pending={pendingHref === href ? "true" : undefined}
    >
      <span className="nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );

  return (
    <FloatingTooltip
      className="nav-floating-tooltip"
      content={label}
      placement="right"
      showWhen="(min-width: 861px) and (max-width: 1080px)"
    >
      {link}
    </FloatingTooltip>
  );
}
