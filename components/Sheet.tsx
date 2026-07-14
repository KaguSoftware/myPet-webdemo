"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Sheet({
  open,
  onClose,
  children,
  ariaLabel = "Dialog",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose in a ref so the focus-trap effect only re-runs when
  // `open` flips (call sites pass fresh inline arrows every render).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    // Remember the trigger so we can hand focus back when the sheet closes.
    const trigger = document.activeElement as HTMLElement | null;
    panel.focus();

    // Lock the PhoneShell scroller behind the sheet.
    const scroller = panel.closest("main") as HTMLElement | null;
    const prevOverflow = scroller?.style.overflow ?? "";
    if (scroller) scroller.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === firstEl || active === panel) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (scroller) scroller.style.overflow = prevOverflow;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end md:rounded-[2.7rem] md:overflow-hidden">
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0.15_0.01_264/0.35)] backdrop-blur-[2px] animate-fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className="relative max-h-[88%] overflow-y-auto rounded-t-sheet bg-bg px-5 pb-9 pt-2.5 shadow-[0_-8px_40px_rgba(0,0,0,0.18)] outline-none animate-sheet-in scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto mb-4 h-1.25 w-9 rounded-full bg-[oklch(0.22_0.01_264/0.18)]" aria-hidden />
        {children}
      </div>
    </div>
  );
}
