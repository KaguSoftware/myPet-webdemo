"use client";

import Header from "./Header";

/**
 * Hydration placeholder for tab pages. Only Home + Welcome gated on `hydrated`
 * before; every other tab briefly rendered its EMPTY state ("No activity yet",
 * "0 members", "All clear") during the initial DB load, telling the user they
 * had nothing when they actually did. This renders the page's real Header plus
 * a few pulsing skeleton rows so the chrome doesn't pop and no false empty
 * state ever shows.
 */
export default function PageLoading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4">
      <Header title={title} subtitle={subtitle} />
      <div className="mt-3 space-y-2.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-17 animate-pulse rounded-card bg-card opacity-60" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
