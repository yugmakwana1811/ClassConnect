"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function MobileWorkspaceMenu({
  label,
  activeHrefs,
  children,
}: {
  label: string;
  activeHrefs: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const active = activeHrefs.some((href) => pathname.startsWith(href));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="mobile-more-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="mobile-workspace-menu"
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen(true)}
      >
        <span className="nav-icon" aria-hidden="true">
          <Menu size={19} />
        </span>
        <span>More</span>
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-workspace-menu"
        className="mobile-more-dialog"
        aria-label={`${label} navigation`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="mobile-more-sheet">
          <header>
            <div>
              <span className="eyebrow">Workspace navigation</span>
              <strong>{label} modules</strong>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </header>
          <div className="mobile-more-content">{children}</div>
        </div>
      </dialog>
    </>
  );
}
