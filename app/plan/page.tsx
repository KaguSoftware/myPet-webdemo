"use client";

import { useState } from "react";
import Paywall from "@/components/Paywall";
import PetAvatar from "@/components/PetAvatar";
import { CARE_PLANS } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function PlanPage() {
  const { state } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const pet = state.pets[Math.min(petIndex, state.pets.length - 1)];
  const plan = CARE_PLANS[pet.breed];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = state.activities.filter((a) => a.petId === pet.id && a.ts >= startOfDay.getTime());

  if (!state.premium) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="mt-4 text-2xl font-black text-ink">The Care Plan</h1>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          A vet-built, breed-specific guide: exactly how much to feed (in grams), how often to groom, when to visit
          the vet — for your exact pet. We remind you before you need to remember.
        </p>
        <div className="mt-6 w-full space-y-2 opacity-60" aria-hidden>
          {["🍖 Feeding · 65 g, 3× daily", "✂️ Brushing · 2× weekly", "🩺 Vet checkup · every 6 months"].map((t) => (
            <div key={t} className="rounded-card bg-white p-4 text-left text-sm font-bold text-ink ring-1 ring-line blur-[2px]">
              {t}
            </div>
          ))}
        </div>
        <button
          onClick={() => setPaywallOpen(true)}
          className="mt-6 w-full rounded-2xl bg-brand px-4 py-4 text-base font-black text-white shadow-lg shadow-brand/40 transition active:scale-95"
        >
          Unlock with PetPal Plus ✨
        </button>
        <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6">
      <h1 className="text-2xl font-black text-ink">Care Plan</h1>
      <p className="text-sm font-semibold text-ink-soft">Vet-built for {pet.breed}s. We do the thinking.</p>

      {state.pets.length > 1 && (
        <div className="mt-3 flex gap-2">
          {state.pets.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPetIndex(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                i === petIndex ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-line"
              }`}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      )}

      {plan ? (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-card bg-mint-soft p-4 ring-1 ring-mint/25">
            <PetAvatar pet={pet} size="sm" />
            <p className="text-xs font-bold text-ink">{plan.intro}</p>
          </div>

          <h2 className="mt-5 text-base font-black text-ink">Today&apos;s plan</h2>
          <ul className="mt-2 space-y-2">
            {plan.items
              .filter((i) => i.perDay)
              .map((item) => {
                const done = todays.filter((a) => a.type === item.action).length;
                const complete = done >= (item.perDay ?? 1);
                return (
                  <li key={item.title} className={`flex items-center gap-3 rounded-card p-3.5 ring-1 ${complete ? "bg-mint-soft ring-mint/25" : "bg-white ring-line"}`}>
                    <span className="text-xl">{complete ? "✅" : item.emoji}</span>
                    <span className="flex-1 text-sm font-extrabold text-ink">{item.title}</span>
                    <span className={`text-xs font-black ${complete ? "text-mint" : "text-ink-soft"}`}>
                      {Math.min(done, item.perDay ?? 1)}/{item.perDay} done
                    </span>
                  </li>
                );
              })}
          </ul>

          <h2 className="mt-6 text-base font-black text-ink">The full {pet.breed} guide</h2>
          <ul className="mt-2 space-y-2.5">
            {plan.items.map((item) => (
              <li key={item.title} className="rounded-card bg-white p-4 ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-ink">
                    {item.emoji} {item.title}
                  </p>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-black text-brand-deep">
                    {item.cadence}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-ink-soft">{item.detail}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-6 rounded-card bg-white p-5 text-center ring-1 ring-line">
          <span className="text-4xl">🧑‍⚕️</span>
          <p className="mt-2 text-sm font-extrabold text-ink">No plan for {pet.breed} yet</p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            Our vet partners are writing it — you&apos;ll get a notification when it&apos;s ready.
          </p>
        </div>
      )}
    </div>
  );
}
