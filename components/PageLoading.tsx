"use client";

import BackBar from "./BackBar";
import Header from "./Header";

/**
 * Hydration placeholder for tab pages. Only Home + Welcome gated on `hydrated`
 * before; every other tab briefly rendered its EMPTY state ("No activity yet",
 * "0 members", "All clear") during the initial DB load, telling the user they
 * had nothing when they actually did. This renders the page's real Header plus
 * a few pulsing skeleton rows so the chrome doesn't pop and no false empty
 * state ever shows.
 */
export default function PageLoading({
  title,
  subtitle,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  /** Pushed pages render a BackBar instead of the large-title Header — match it. */
  compact?: boolean;
}) {
  return (
    <div className="px-4">
      {compact ? <BackBar title={title} /> : <Header title={title} subtitle={subtitle} />}
      <div className="mt-3 space-y-2.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-17 animate-pulse rounded-card bg-card opacity-60" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
