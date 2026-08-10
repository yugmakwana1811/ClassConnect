"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FloatingTooltip } from "./floating-tooltip";

export function AppNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  const pathname = usePathname();
  const isOverview = href === "/teacher" || href === "/student";
  const active = isOverview ? pathname === href : pathname.startsWith(href);

  const link = (
    <Link
      className="nav-link"
      href={href}
      // Dashboard pages are data-heavy server components. Eagerly
      // prefetching every nav destination makes the browser request and
      // render all of them just because they are visible in the sidebar.
      // Navigate on demand so the active page stays responsive and the
      // server does not do work the user may never request.
      prefetch={false}
      aria-label={label}
      aria-current={active ? "page" : undefined}
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
