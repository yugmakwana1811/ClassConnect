"use client";

import { usePathname } from "next/navigation";

export function MotionPageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="route-motion" key={pathname}>
      {children}
    </div>
  );
}
