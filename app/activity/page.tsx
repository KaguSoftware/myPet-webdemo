"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import Paywall from "@/components/Paywall";
import { ACTIONS, VET } from "@/lib/data";
import { timeAgo, useStore } from "@/lib/store";

export default function ActivityPage() {
  const { state, bookVet, toast } = useStore();
  const [bookOpen, setBookOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const items = [...state.activities].sort((a, b) => b.ts - a.ts).slice(0, 40);
  const cat = state.pets.find((p) => p.breed === "British Shorthair") ?? state.pets[0];

  const member = (id: string) => state.members.find((m) => m.id === id);
  const pet = (id: string) => state.pets.find((p) => p.id === id);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-black text-ink">Activity</h1>
      <p className="text-sm font-semibold text-ink-soft">Everything your family logs, in one feed.</p>

      {/* Premium insight card */}
      {state.premium ? (
        <div className="mt-4 rounded-card bg-mint-soft p-4 ring-1 ring-mint/25">
          <p className="text-sm font-extrabold text-ink">
            💡 {cat?.name}&apos;s 6-month checkup is due next week
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            We suggest {VET.name} at {VET.clinic} — ⭐ {VET.rating}, {VET.distanceKm} km away.
          </p>
          {state.bookedVet ? (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-mint">
              ✅ Appointment requested — {VET.name} will confirm shortly
            </p>
          ) : (
            <button
              onClick={() => setBookOpen(true)}
              className="mt-3 w-full rounded-xl bg-mint px-3 py-2.5 text-sm font-black text-white transition active:scale-95"
            >
              Book it for me 📅
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setPaywallOpen(true)}
          className="mt-4 w-full rounded-card bg-white p-4 text-left ring-1 ring-line transition active:scale-[0.98]"
        >
          <p className="text-sm font-extrabold text-ink">🔒 Health insights live here</p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            PetPal Plus watches the calendar and tells you when a vet visit, treatment or checkup is coming up.
          </p>
        </button>
      )}

      <ul className="mt-5 space-y-2.5 pb-6">
        {items.map((a) => {
          const m = member(a.memberId);
          const p = pet(a.petId);
          if (!m || !p) return null;
          const isYou = m.id === state.currentMemberId;
          return (
            <li key={a.id} className="flex items-center gap-3 rounded-card bg-white p-3.5 ring-1 ring-line">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-lg">
                {ACTIONS[a.type].emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">
                  <span className="font-black">{isYou ? "You" : m.name}</span> {ACTIONS[a.type].verb}{" "}
                  <span className="font-black">{p.name}</span>
                </p>
                {a.note && <p className="text-xs font-semibold text-ink-soft">{a.note}</p>}
              </div>
              <span className="shrink-0 text-xs font-bold text-ink-soft">{timeAgo(a.ts)}</span>
            </li>
          );
        })}
      </ul>

      <Sheet open={bookOpen} onClose={() => setBookOpen(false)}>
        <div className="text-center">
          <span className="text-5xl">{VET.emoji}</span>
          <h2 className="mt-2 text-xl font-black text-ink">{VET.name}</h2>
          <p className="text-sm font-semibold text-ink-soft">
            {VET.clinic} · ⭐ {VET.rating} · {VET.distanceKm} km away
          </p>
        </div>
        <div className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm font-bold text-ink">
          🩺 6-month checkup for {cat?.name}
          <br />
          <span className="text-xs font-semibold text-ink-soft">Suggested: next Tuesday, 10:30 — dental check included</span>
        </div>
        <button
          onClick={() => {
            bookVet();
            setBookOpen(false);
            toast("📅", "Appointment requested!", `${VET.name} will confirm shortly`);
          }}
          className="mt-5 w-full rounded-2xl bg-brand px-4 py-4 text-base font-black text-white shadow-lg shadow-brand/40 transition active:scale-95"
        >
          Request appointment
        </button>
        <p className="mt-3 text-center text-xs font-semibold text-ink-soft">Demo — no real booking is made.</p>
      </Sheet>

      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
