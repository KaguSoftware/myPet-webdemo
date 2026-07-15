"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import PetAvatar from "@/components/PetAvatar";
import EditStatSheet from "@/components/EditStatSheet";
import LevelStagesSheet from "@/components/LevelStagesSheet";
import StreakCalendarSheet from "@/components/StreakCalendarSheet";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { Chevron, Chip, CoinPill, Group, Row, SectionHeader } from "@/components/ui";
import { CARE_PLANS, VET, VETS, formatAge, formatWeight, kgToUnit, unitToKg, weightUnitLabel } from "@/lib/data";
import { dueLabel, level, levelProgress, levelStepXp, useStore } from "@/lib/store";

export default function Home() {
  const { state, hydrated, restockSupply, addWeight, editPet, toast, bookVetById } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [editingStat, setEditingStat] = useState<"weight" | "age" | null>(null);
  const [levelSheetOpen, setLevelSheetOpen] = useState(false);
  const [streakSheetOpen, setStreakSheetOpen] = useState(false);
  const [justLeveled, setJustLeveled] = useState(false);
  const [justStreaked, setJustStreaked] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);

  const currentLevel = level(state.xp);
  const prevLevelRef = useRef(currentLevel);
  const prevStreakRef = useRef(state.streak);

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

  // Level-up: bounce the hero pet when the level crosses up (the ⭐ toast fires from the store).
  useEffect(() => {
    if (currentLevel > prevLevelRef.current) {
      setJustLeveled(true);
      const t = setTimeout(() => setJustLeveled(false), 950);
      prevLevelRef.current = currentLevel;
      return () => clearTimeout(t);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Streak-up: pop the flame when the streak grows (the 🔥 toast fires from the store).
  useEffect(() => {
    if (state.streak > prevStreakRef.current) {
      setJustStreaked(true);
      const t = setTimeout(() => setJustStreaked(false), 700);
      prevStreakRef.current = state.streak;
      return () => clearTimeout(t);
    }
    prevStreakRef.current = state.streak;
  }, [state.streak]);

  if (!hydrated || !pet) {
    return (
      <div className="px-4">
        <Header title="Home" />
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-[14px] text-label-2">{hydrated ? "No pets yet." : "Loading your household…"}</p>
        </div>
      </div>
    );
  }

  const me = state.members.find((m) => m.id === state.currentMemberId);
  const lowSupplies = pet.supplies.filter((s) => s.level < 20);
  const plan = CARE_PLANS[pet.breed];
  const fedTarget = plan?.items.find((i) => i.action === "fed")?.perDay ?? 2;
  const fedCount = todays.filter((a) => a.type === "fed").length;
  const fedPct = Math.min(100, Math.round((fedCount / fedTarget) * 100));
  const petAlerts = state.reminders.filter((r) => r.alert && !r.done && r.petId === pet.id);
  const logHint = pet.species === "cat" ? "Fed, water, litter & more" : "Fed, water, walk & more";

  const nextReminder = state.reminders
    .filter((r) => !r.done && r.petId === pet.id)
    .sort((a, b) => a.due - b.due)[0];

  return (
    <div className="px-4">
      <Header
        title="Home"
        subtitle={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${me?.name}`}
        trailing={
          <Link href="/pets?shop=1" aria-label="Open shop">
            <CoinPill amount={state.coins} />
          </Link>
        }
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
          <div className={justLeveled ? "animate-levelup" : ""}>
            <PetAvatar pet={pet} size="lg" idle />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1 text-[22px] font-bold tracking-[-0.01em] text-label">
              {pet.name}
              <Icon name="chevron-right" size={14} className="text-label-3" />
            </h2>
            <p className="text-[14px] font-medium text-label-2">{pet.breed}</p>
          </div>
        </Link>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button onClick={() => setEditingStat("age")}>
            <Chip>{formatAge(pet.ageYears)}</Chip>
          </button>
          <button onClick={() => setEditingStat("weight")}>
            <Chip>{formatWeight(pet.weightKg, state.units)}</Chip>
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
        {petAlerts.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {/* Cap at 3 so an alert-heavy day doesn't bury the rest of Home. */}
            {petAlerts.slice(0, 3).map((r) => {
              const alertVet = r.vetId ? VETS.find((v) => v.id === r.vetId) ?? VET : null;
              return (
                <div key={r.id} className="rounded-card bg-[oklch(0.6_0.21_25/0.06)] p-3">
                  <p className="text-[14px] font-semibold leading-snug text-red">{r.title}</p>
                  {alertVet && (
                    <button
                      onClick={() => {
                        bookVetById(alertVet.id);
                        toast("🩺", `Vet visit requested`, `${alertVet.name} will follow up about ${pet.name}`);
                      }}
                      className="mt-2 flex h-8 w-fit items-center gap-1.5 rounded-full bg-red px-3 text-[13px] font-semibold text-white transition-transform active:scale-95"
                    >
                      <Icon name="cross" size={14} /> Book vet — {alertVet.name}
                    </button>
                  )}
                </div>
              );
            })}
            {petAlerts.length > 3 && (
              <Link
                href="/reminders"
                className="flex items-center justify-center gap-1 rounded-card bg-[oklch(0.6_0.21_25/0.06)] p-2.5 text-[13px] font-semibold text-red transition-transform active:scale-[0.98]"
              >
                View all {petAlerts.length} alerts <Icon name="chevron-right" size={13} />
              </Link>
            )}
          </div>
        )}
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

      {/* Primary action — logging now lives on its own tab to keep Home light */}
      <Link
        href="/logs"
        className="mt-3 flex items-center gap-3 rounded-card bg-accent p-4 text-white shadow-[0_8px_24px_oklch(0.55_0.19_258/0.3)] transition-transform active:scale-[0.98]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)]">
          <Icon name="plus" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold">Log care</span>
          <span className="block truncate text-[13px] font-medium text-white/80">{logHint} · family gets notified</span>
        </span>
        <Icon name="chevron-right" size={18} className="text-white/70" />
      </Link>

      {/* Stats strip */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setStreakSheetOpen(true)}
          className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform active:scale-95"
        >
          <span className={`inline-flex ${justStreaked ? "animate-coin-bump" : ""}`}>
            <Icon name="flame" size={18} className="text-orange" />
          </span>
          <div>
            <p className="text-[15px] font-bold leading-none text-label">{state.streak}</p>
            <p className="mt-0.5 text-[11px] font-medium text-label-2">day streak</p>
          </div>
        </button>
        <button
          onClick={() => setLevelSheetOpen(true)}
          className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform active:scale-95"
        >
          <Icon name="star" size={18} className="text-accent" />
          <div>
            <p className="text-[15px] font-bold leading-none text-label">Lv {currentLevel}</p>
            <p className="mt-0.5 text-[11px] font-medium text-label-2">{levelProgress(state.xp)}/{levelStepXp(currentLevel)} XP</p>
          </div>
        </button>
        <Link
          href="/pets?shop=1"
          aria-label="Open shop"
          className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform active:scale-95"
        >
          <Icon name="coin" size={18} className="text-[oklch(0.55_0.13_60)]" />
          <div>
            <p className="text-[15px] font-bold leading-none text-label">{state.coins}</p>
            <p className="mt-0.5 text-[11px] font-medium text-label-2">coins</p>
          </div>
        </Link>
      </div>

      {/* Supplies running low */}
      {lowSupplies.length > 0 && (
        <>
          <SectionHeader
            trailing={
              <Link href={`/pet/${pet.id}`} className="text-[13px] font-semibold text-accent">
                Manage
              </Link>
            }
          >
            Running low
          </SectionHeader>
          <Group>
            {lowSupplies.map((s) => (
              <Row
                key={s.id}
                leading={
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[oklch(0.6_0.21_25/0.1)] text-red">
                    <Icon name="box" size={18} />
                  </span>
                }
                title={s.name}
                subtitle={`${s.level}% left · for ${pet.name}`}
                trailing={
                  <button
                    onClick={() => {
                      restockSupply(pet.id, s.id);
                      toast("📦", `${s.name} restocked`, "Back to 100%");
                    }}
                    className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent transition-transform active:scale-95"
                  >
                    <Icon name="refresh" size={12} /> Restock
                  </button>
                }
              />
            ))}
          </Group>
        </>
      )}

      {/* Premium: today's care plan on the dashboard — glanceable status, tap Care to complete */}
      {state.premium && plan && (
        <>
          <SectionHeader
            trailing={
              <Link href="/plan" className="text-[13px] font-semibold text-accent">
                Full plan
              </Link>
            }
          >
            Today&apos;s plan · PetPal+
          </SectionHeader>
          <Group>
            {plan.items
              .filter((i) => i.perDay && i.action)
              .map((item) => {
                const target = item.perDay ?? 1;
                const done = todays.filter((a) => a.type === item.action).length;
                const complete = done >= target;
                const ai = ACTION_ICON[item.action!];
                return (
                  <Row
                    key={item.title}
                    leading={
                      complete ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green text-white">
                          <Icon name="check" size={18} />
                        </span>
                      ) : (
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ai.bg} ${ai.tint}`}>
                          <Icon name={ai.icon} size={19} />
                        </span>
                      )
                    }
                    title={item.title}
                    subtitle={complete ? "Complete for today" : item.detail.split(".")[0]}
                    trailing={
                      <span className={`text-[13px] font-semibold ${complete ? "text-green" : "text-label-3"}`}>
                        {Math.min(done, target)}/{target}
                      </span>
                    }
                  />
                );
              })}
          </Group>
        </>
      )}

      {/* Next up */}
      <SectionHeader>Next up</SectionHeader>
      <Group>
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
          toast("⚖️", `${pet.name}'s weight updated`, formatWeight(kg, state.units));
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
          toast("🎂", `${pet.name}'s age updated`, formatAge(ageYears));
        }}
      />

      <LevelStagesSheet open={levelSheetOpen} onClose={() => setLevelSheetOpen(false)} />
      <StreakCalendarSheet open={streakSheetOpen} onClose={() => setStreakSheetOpen(false)} />
    </div>
  );
}
