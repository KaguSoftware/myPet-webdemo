"use client";

import Link from "next/link";
import { Icon } from "./Icons";
import { useStore } from "@/lib/store";

/**
 * Persistent top-right bell → the Activity notification hub. The badge counts
 * outstanding care alerts (reminders flagged `alert` and not done) — the same
 * set that drives the "N care warnings need attention" toast in the store.
 */
export default function NotificationBell() {
  const { state } = useStore();
  const count = state.reminders.filter((r) => r.alert && !r.done).length;
  return (
    <Link
      href="/activity"
      aria-label={count > 0 ? `Activity, ${count} notification${count === 1 ? "" : "s"}` : "Activity"}
      className="glass-strong relative flex h-9 w-9 items-center justify-center rounded-full text-label-2 transition-transform active:scale-90"
    >
      <Icon name="bell" size={18} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold leading-none text-white shadow-[0_1px_3px_oklch(0.2_0.01_264/0.25)]">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
