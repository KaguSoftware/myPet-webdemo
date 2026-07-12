"use client";

import { useStore } from "@/lib/store";
import { Icon, IconName } from "./Icons";
import Sheet from "./Sheet";
import { AccentButton } from "./ui";

const PERKS: { icon: IconName; title: string; body: string }[] = [
  { icon: "heart-text", title: "Vet-built care plans", body: "Breed-specific feeding, grooming and health schedules." },
  { icon: "bell", title: "Smart reminders", body: "We watch the calendar so you don't have to." },
  { icon: "calendar", title: "Vet booking", body: "One-tap appointment requests with trusted local vets." },
  { icon: "arrow-up", title: "Health insights", body: "Weight tracking and early warning signs." },
];

export default function Paywall({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setPremium, toast } = useStore();
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="flex h-[64px] w-[64px] items-center justify-center rounded-[16px] bg-gradient-to-b from-[oklch(0.62_0.19_258)] to-[oklch(0.48_0.19_262)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_oklch(0.55_0.19_258/0.35)]">
          <Icon name="sparkles" size={32} />
        </span>
        <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-label">PetPal+</h2>
        <p className="mt-1 max-w-[280px] text-[14px] leading-relaxed text-label-2">
          A vet in your pocket. We tell you what your pet needs — before you have to think about it.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {PERKS.map((p) => (
          <div key={p.title} className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon name={p.icon} size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-label">{p.title}</p>
              <p className="text-[13px] leading-snug text-label-2">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <AccentButton
          onClick={() => {
            setPremium(true);
            onClose();
            toast("✨", "Welcome to PetPal+", "Care plans and smart reminders unlocked");
          }}
        >
          Try free for 1 month
        </AccentButton>
        <p className="mt-2.5 text-center text-[12px] leading-relaxed text-label-3">
          Then $4.99/month. Cancel anytime.
          <br />
          Demo — unlocks instantly, no payment.
        </p>
      </div>
    </Sheet>
  );
}
