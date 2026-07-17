"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

/**
 * Sticky glass top bar for pushed detail screens (settings sub-pages, vets,
 * reminders, activity, pet detail). This is the ONE piece of chrome those
 * pages render — they don't stack a large-title <Header> on top of it.
 */
export default function BackBar({ title, trailing }: { title?: string; trailing?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="glass-strong sticky top-0 z-20 -mx-4 mb-4 grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2.5">
      <button onClick={() => router.back()} aria-label="Back" className="flex items-center justify-self-start text-accent">
        <Icon name="chevron-left" size={18} />
        <span className="text-[16px] font-semibold">Back</span>
      </button>
      {title ? <h1 className="truncate text-[17px] font-semibold text-label">{title}</h1> : <span />}
      <span className="flex items-center justify-self-end">{trailing}</span>
    </div>
  );
}
