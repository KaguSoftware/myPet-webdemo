"use client";

import { useStore } from "@/lib/store";
import { Icon } from "./Icons";

export default function Toasts() {
  const { toasts, dismissToast, stopNotifications } = useStore();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-3 md:pt-11">
      {toasts.length > 0 && (
        <button
          onClick={stopNotifications}
          className="glass pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-label-2 animate-toast-in"
        >
          <Icon name="xmark" size={12} />
          Close notifications
        </button>
      )}
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-strong pointer-events-auto flex w-full items-center gap-3 rounded-[1.4rem] px-3.5 py-3 text-left animate-toast-in"
        >
          <span
            aria-hidden
            className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-b from-[oklch(0.62_0.19_258)] to-[oklch(0.5_0.19_262)] text-[20px] leading-none shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)]">
            {t.emoji}
          </span>
          <button onClick={() => dismissToast(t.id)} className="min-w-0 flex-1 text-left">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[14px] font-semibold text-label">{t.title}</span>
              {!t.action && <span className="shrink-0 text-[11px] font-medium text-label-3">now</span>}
            </span>
            {t.body && <span className="block truncate text-[13px] text-label-2">{t.body}</span>}
          </button>
          {t.action && (
            <button
              onClick={t.action.onClick}
              className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white transition-transform active:scale-95"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
