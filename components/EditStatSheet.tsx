"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { AccentButton } from "@/components/ui";

/** Small tap-to-edit sheet for a single numeric pet stat (weight or age). */
export default function EditStatSheet({
  open,
  onClose,
  title,
  label,
  initialValue,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  initialValue: number;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState(String(initialValue));
  // Re-sync the input whenever the sheet opens (or its target value changes
  // while open) — adjusting state during render instead of an effect avoids
  // the extra render pass a `useEffect` + `setState` would trigger.
  const [synced, setSynced] = useState({ open, initialValue });
  if (open && (synced.open !== open || synced.initialValue !== initialValue)) {
    setSynced({ open, initialValue });
    setValue(String(initialValue));
  } else if (!open && synced.open !== open) {
    setSynced({ open, initialValue });
  }

  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(parsed) && parsed > 0;

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{title}</h2>

      <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">{label}</p>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
      />

      <div className="mt-7">
        <AccentButton
          disabled={!valid}
          onClick={() => {
            onSave(parsed);
            onClose();
          }}
        >
          Save
        </AccentButton>
      </div>
    </Sheet>
  );
}
