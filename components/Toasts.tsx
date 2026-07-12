"use client";

import { useStore } from "@/lib/store";

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col items-center gap-2 px-4 pt-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 text-left shadow-lg shadow-ink/10 backdrop-blur animate-toast-in"
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-ink">{t.title}</span>
            {t.body && <span className="block truncate text-xs font-semibold text-ink-soft">{t.body}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
