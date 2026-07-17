"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import PetAvatar from "@/components/PetAvatar";
import EditStatSheet from "@/components/EditStatSheet";
import { Icon } from "@/components/Icons";
import { Chevron, Chip, Group, Row } from "@/components/ui";
import { dailyTarget, formatAge, formatWeight, kgToUnit, unitToKg, weightUnitLabel } from "@/lib/data";
import { dueLabel, useStore } from "@/lib/store";

export default function Home() {
  const { state, hydrated, addWeight, editPet, toast } = useStore();
  const router = useRouter();
  const [petIndex, setPetIndex] = useState(0);
  const [editingStat, setEditingStat] = useState<"weight" | "age" | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);

  const changePet = (dir: 1 | -1) =>
    setPetIndex((i) => Math.min(state.pets.length - 1, Math.max(0, i + dir)));

  const pet = state.pets[Math.min(petIndex, state.pets.length - 1)] as (typeof state.pets)[number] | undefined;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = useMemo(
    () => (pet ? state.activities.filter((a) => a.petId === pet.id && a.ts >= startOfDay.getTime()) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activities, pet?.id]
  );

  if (!hydrated || !pet) {
    return (
      <div className="px-4">
        <Header title="Home" />
        {hydrated ? (
          <div className="mt-4">
            <EmptyState
              icon="paw"
              title="No pets yet"
              body="Add your first pet to start tracking their care together."
              cta="Add a pet"
              onCta={() => router.push("/pets")}
            />
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-[14px] text-label-2">Loading your household…</p>
          </div>
        )}
      </div>
    );
  }

  const me = state.members.find((m) => m.id === state.currentMemberId);
  // Use the canonical daily target (breed plan → species default) so a
  // plan-less cat targets 3 meals here, matching the rest of the app, not a
  // hardcoded 2.
  const fedTarget = dailyTarget(pet, "fed") ?? 2;
  const fedCount = todays.filter((a) => a.type === "fed").length;
  const fedPct = Math.min(100, Math.round((fedCount / fedTarget) * 100));

  // Household-wide outstanding alerts, deduped by pet+title (the data can hold
  // duplicates) — Home shows one calm summary line, the details live on /activity.
  const alertCount = new Set(
    state.reminders.filter((r) => r.alert && !r.done).map((r) => `${r.petId}|${r.title}`)
  ).size;

  const nextReminder = state.reminders
    .filter((r) => !r.done && r.petId === pet.id)
    .sort((a, b) => a.due - b.due)[0];

  return (
    <div className="px-4">
      <Header
        title="Home"
        subtitle={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${me?.name}`}
        bell
      />

      {/* Pet hero card */}
      <div
        className="rounded-sheet bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)] touch-pan-y select-none"
        onPointerDown={(e) => {
          if (state.pets.length > 1) swipeStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = swipeStart.current;
          swipeStart.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          // horizontal swipe only; ignore taps and vertical scrolls
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            didSwipe.current = true;
            changePet(dx < 0 ? 1 : -1);
          }
        }}
      >
        <Link
          href={`/pet/${pet.id}`}
          onClick={(e) => {
            if (didSwipe.current) {
              e.preventDefault();
              didSwipe.current = false;
            }
          }}
          className="flex items-center gap-4 transition-transform active:scale-[0.99]"
        >
          <PetAvatar pet={pet} size="lg" idle />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1 text-[22px] font-bold tracking-[-0.01em] text-label">
              {pet.name}
              <Icon name="chevron-right" size={14} className="text-label-3" />
            </h2>
            <p className="text-[14px] font-medium text-label-2">{pet.breed}</p>
          </div>
        </Link>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button onClick={() => setEditingStat("age")} aria-label="Edit age" className="transition-transform active:scale-95">
            <Chip>
              {formatAge(pet.ageYears)}
              <Icon name="chevron-right" size={9} className="text-label-3" />
            </Chip>
          </button>
          <button onClick={() => setEditingStat("weight")} aria-label="Edit weight" className="transition-transform active:scale-95">
            <Chip>
              {formatWeight(pet.weightKg, state.units)}
              <Icon name="chevron-right" size={9} className="text-label-3" />
            </Chip>
          </button>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-label-2">Meals today</p>
            <p className="text-[13px] font-semibold text-label">
              {fedCount} <span className="text-label-3">of {fedTarget}</span>
            </p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fedPct >= 100 ? "bg-green" : "bg-accent"}`}
              style={{ width: `${fedPct}%` }}
            />
          </div>
        </div>
        {state.pets.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {state.pets.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPetIndex(i)}
                aria-label={`Show ${p.name}`}
                className={`h-1.75 rounded-full transition-all duration-300 ${
                  i === petIndex ? "w-5 bg-label" : "w-1.75 bg-[oklch(0.22_0.01_264/0.18)]"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* One calm entry point for everything that needs attention */}
      {alertCount > 0 && (
        <Link
          href="/activity"
          className="mt-3 flex items-center gap-3 rounded-card bg-[oklch(0.6_0.21_25/0.06)] px-4 py-3.5 transition-transform active:scale-[0.98]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red text-white">
            <Icon name="bell" size={16} />
          </span>
          <span className="min-w-0 flex-1 text-[15px] font-semibold text-red">
            {alertCount} thing{alertCount === 1 ? "" : "s"} need{alertCount === 1 ? "s" : ""} attention
          </span>
          <Icon name="chevron-right" size={15} className="text-red/70" />
        </Link>
      )}

      {/* Next up */}
      <Group className="mt-8">
        <Link href="/reminders" className="block">
          <Row
            leading={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name="clock" size={19} />
              </span>
            }
            title={nextReminder ? nextReminder.title : "No upcoming reminders"}
            subtitle={
              nextReminder
                ? `${pet.name} · due ${dueLabel(nextReminder.due)}`
                : "Tap to add one for the family"
            }
            trailing={<Chevron />}
          />
        </Link>
      </Group>

      <EditStatSheet
        open={editingStat === "weight"}
        onClose={() => setEditingStat(null)}
        title={`${pet.name}'s weight`}
        label={`Weight (${weightUnitLabel(state.units)})`}
        initialValue={kgToUnit(pet.weightKg, state.units)}
        onSave={(v) => {
          const kg = unitToKg(v, state.units);
          addWeight(pet.id, kg);
          toast("scale", `${pet.name}'s weight updated`, formatWeight(kg, state.units));
        }}
      />
      <EditStatSheet
        open={editingStat === "age"}
        onClose={() => setEditingStat(null)}
        title={`${pet.name}'s age`}
        label="Age (years)"
        initialValue={pet.ageYears}
        onSave={(ageYears) => {
          editPet(pet.id, { name: pet.name, breed: pet.breed, ageYears, weightKg: pet.weightKg, cupGrams: pet.cupGrams });
          toast("calendar", `${pet.name}'s age updated`, formatAge(ageYears));
        }}
      />
    </div>
  );
}
