"use client";

import { useStore } from "@/lib/store";
import { Icon } from "./Icons";

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-3 md:pt-11">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="glass-strong pointer-events-auto flex w-full items-center gap-3 rounded-[1.4rem] px-3.5 py-3 text-left animate-toast-in"
        >
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[oklch(0.62_0.19_258)] to-[oklch(0.5_0.19_262)] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)]">
            <Icon name="paw" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[14px] font-semibold text-label">{t.title}</span>
              <span className="shrink-0 text-[11px] font-medium text-label-3">now</span>
            </span>
            {t.body && <span className="block truncate text-[13px] text-label-2">{t.body}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
