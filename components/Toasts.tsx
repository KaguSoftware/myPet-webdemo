"use client";

import { useStore } from "@/lib/store";

// Severity is derived from the emoji each toast already carries (no call-site
// changes): alerts/errors read red, celebrations/confirmations read green, and
// everything else stays the neutral indigo. Keeps the emoji glyph on top.
const TILE_BY_SEVERITY: Record<"alert" | "success" | "info", string> = {
  alert: "bg-linear-to-b from-[oklch(0.62_0.2_25)] to-[oklch(0.52_0.2_28)]",
  success: "bg-linear-to-b from-[oklch(0.66_0.16_155)] to-[oklch(0.55_0.16_158)]",
  info: "bg-linear-to-b from-[oklch(0.62_0.19_258)] to-[oklch(0.5_0.19_262)]",
};
const ALERT_EMOJI = new Set(["🚨", "⚠️"]);
const SUCCESS_EMOJI = new Set(["✅", "⭐", "🎉", "🔥"]);
function severityOf(emoji: string): "alert" | "success" | "info" {
  if (ALERT_EMOJI.has(emoji)) return "alert";
  if (SUCCESS_EMOJI.has(emoji)) return "success";
  return "info";
}

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-50 flex w-full max-w-82.5 flex-col items-end gap-2 px-3 pt-4 md:pt-13">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-strong pointer-events-auto flex w-full items-center gap-2.5 rounded-[1.4rem] px-3 py-2.5 text-left animate-toast-in"
        >
          <span
            aria-hidden
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[17px] leading-none text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)] ${TILE_BY_SEVERITY[severityOf(t.emoji)]}`}
          >
            {t.emoji}
          </span>
          <button onClick={() => dismissToast(t.id)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[14px] font-semibold text-label">{t.title}</span>
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
