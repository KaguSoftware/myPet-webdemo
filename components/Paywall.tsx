"use client";

import { useStore } from "@/lib/store";
import Sheet from "./Sheet";

const PERKS = [
  { emoji: "🩺", text: "Vet-built care plan for every breed" },
  { emoji: "🔔", text: "Smart reminders — we do the thinking" },
  { emoji: "📅", text: "Vet visit scheduling & booking help" },
  { emoji: "📈", text: "Weight & health tracking insights" },
];

export default function Paywall({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setPremium, toast } = useStore();
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="text-center">
        <span className="text-5xl">✨</span>
        <h2 className="mt-2 text-2xl font-black text-ink">PetPal Plus</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          A vet in your pocket. We tell you what your pet needs, before you have to think about it.
        </p>
      </div>
      <ul className="mt-5 space-y-3">
        {PERKS.map((p) => (
          <li key={p.text} className="flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3">
            <span className="text-xl">{p.emoji}</span>
            <span className="text-sm font-bold text-ink">{p.text}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          setPremium(true);
          onClose();
          toast("✨", "Welcome to PetPal Plus!", "Care plans and smart reminders unlocked");
        }}
        className="mt-6 w-full rounded-2xl bg-brand px-4 py-4 text-base font-black text-white shadow-lg shadow-brand/40 transition active:scale-95"
      >
        Start free trial — then $4.99/mo
      </button>
      <p className="mt-3 text-center text-xs font-semibold text-ink-soft">
        Demo: this unlocks instantly, no payment. Cancel anytime.
      </p>
    </Sheet>
  );
}
