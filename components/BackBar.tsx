"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

/** Sticky glass back bar shared by pushed detail screens (settings, vets, pet detail). */
export default function BackBar() {
  const router = useRouter();
  return (
    <div className="glass-strong sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-2 px-4 py-2.5">
      <button onClick={() => router.back()} aria-label="Back" className="flex items-center text-accent">
        <Icon name="chevron-left" size={18} />
        <span className="text-[16px] font-semibold">Back</span>
      </button>
    </div>
  );
}
