"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Confetti from "@/components/Confetti";
import PetAvatar from "@/components/PetAvatar";
import { ACTIONS, ActionType, CARE_PLANS } from "@/lib/data";
import { dueLabel, level, levelProgress, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

export default function Home() {
  const { state, logAction } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [burst, setBurst] = useState(0);

  const pet = state.pets[Math.min(petIndex, state.pets.length - 1)];
  const me = state.members.find((m) => m.id === state.currentMemberId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = useMemo(
    () => state.activities.filter((a) => a.petId === pet.id && a.ts >= startOfDay.getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activities, pet.id]
  );
  const plan = CARE_PLANS[pet.breed];
  const fedTarget = plan?.items.find((i) => i.action === "fed")?.perDay ?? 2;
  const fedCount = todays.filter((a) => a.type === "fed").length;

  const nextReminder = state.reminders
    .filter((r) => !r.done && r.petId === pet.id)
    .sort((a, b) => a.due - b.due)[0];

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;

  return (
    <div className="relative px-5 pt-6">
      <Confetti burst={burst} />

      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink-soft">Hi {me?.name} {me?.emoji}</p>
          <h1 className="text-2xl font-black text-ink">Who&apos;s a good pet?</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5">
          <span aria-hidden>🪙</span>
          <span className="text-sm font-black text-ink">{state.coins}</span>
        </div>
      </header>

      {/* Streak + level */}
      <div className="mt-4 flex items-center gap-3 rounded-card bg-white p-3 shadow-sm ring-1 ring-line">
        <div className="flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2">
          <span aria-hidden>🔥</span>
          <span className="text-sm font-black text-brand-deep">{state.streak}-day streak</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-[11px] font-bold text-ink-soft">
            <span>Level {level(state.xp)} pet parent</span>
            <span>{levelProgress(state.xp)}/100 XP</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div
              className="h-2 rounded-full bg-mint transition-all duration-300"
              style={{ width: `${levelProgress(state.xp)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pet selector */}
      <section className="mt-5 rounded-card bg-brand p-5 text-white shadow-lg shadow-brand/30">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/20 p-2">
            <PetAvatar pet={pet} size="lg" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black">{pet.name}</h2>
            <p className="text-sm font-bold text-white/85">{pet.breed}</p>
            <p className="mt-1 text-xs font-semibold text-white/75">
              {pet.ageYears} yrs · {pet.weightKg} kg
            </p>
            <p className="mt-2 text-xs font-bold text-white/90">
              🍖 Fed {fedCount}/{fedTarget} today {fedCount >= fedTarget ? "— all done!" : ""}
            </p>
          </div>
        </div>
        {state.pets.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {state.pets.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPetIndex(i)}
                aria-label={`Show ${p.name}`}
                className={`rounded-full px-3 py-1 text-xs font-black transition ${
                  i === petIndex ? "bg-white text-brand-deep" : "bg-white/20 text-white"
                }`}
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="mt-5">
        <h3 className="text-base font-black text-ink">Log care — family gets notified</h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {actions.map((type) => (
            <button
              key={type}
              onClick={() => {
                logAction(pet.id, type);
                setBurst((b) => b + 1);
              }}
              className="flex flex-col items-center gap-1 rounded-card bg-white py-4 shadow-sm ring-1 ring-line transition active:scale-90 active:bg-brand-soft"
            >
              <span className="text-2xl">{ACTIONS[type].emoji}</span>
              <span className="text-xs font-extrabold text-ink">{ACTIONS[type].label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Next reminder */}
      <Link
        href="/reminders"
        className="mt-5 mb-6 flex items-center gap-3 rounded-card bg-sky-soft p-4 ring-1 ring-sky/20 transition active:scale-[0.98]"
      >
        <span className="text-2xl">⏰</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-ink">
            {nextReminder ? `${nextReminder.emoji} ${nextReminder.title} — ${dueLabel(nextReminder.due)}` : "No reminders coming up"}
          </span>
          <span className="block text-xs font-semibold text-ink-soft">
            {nextReminder ? `For ${pet.name} · tap to see all` : "Tap to add one"}
          </span>
        </span>
        <span className="text-ink-soft" aria-hidden>›</span>
      </Link>
    </div>
  );
}
