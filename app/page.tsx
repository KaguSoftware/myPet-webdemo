"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import PetAvatar from "@/components/PetAvatar";
import EditStatSheet from "@/components/EditStatSheet";
import Sheet from "@/components/Sheet";
import LevelStagesSheet from "@/components/LevelStagesSheet";
import StreakCalendarSheet from "@/components/StreakCalendarSheet";
import PixelSprite from "@/components/pixel/PixelSprite";
import { SMILEY_SPRITE, WARNING_SPRITE } from "@/components/pixel/hudSprites";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, Chevron, Chip, CoinPill, Group, Row, SectionHeader, Segmented } from "@/components/ui";
import { ACTIONS, ActionType, CARE_PLANS, PORTIONS, VET, VETS, formatAge, formatWeight } from "@/lib/data";
import { ALERT_VERB, dueLabel, level, levelProgress, levelStepXp, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

// Action types with an ALERT_VERB, for matching a health alert's title
// (e.g. "...is eating way more than usual...") back to the action it's about.
const ALERT_VERB_TYPES = Object.keys(ALERT_VERB) as ActionType[];

// Reverse lookup from a care-alert reminder's emoji back to its action type
// — the "hasn't happened in a while" warnings raised by lib/store.tsx reuse
// each action's own emoji (fed 🍖, water 💧, litter 🧹, walk 🦮), which is
// what lets the Log care boxes below flag themselves without any extra data.
const CARE_WARNING_EMOJI: Partial<Record<string, ActionType>> = { "🍖": "fed", "💧": "water", "🧹": "litter", "🦮": "walk" };

export default function Home() {
  const { state, hydrated, logAction, restockSupply, useSupply: consumeSupply, addWeight, editPet, toast, bookVetById } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [justLogged, setJustLogged] = useState<ActionType | null>(null);
  const [editingStat, setEditingStat] = useState<"weight" | "age" | null>(null);
  const [feedPortionOpen, setFeedPortionOpen] = useState(false);
  const [feedFraction, setFeedFraction] = useState<(typeof PORTIONS)[number]["value"]>("1");
  const [levelSheetOpen, setLevelSheetOpen] = useState(false);
  const [streakSheetOpen, setStreakSheetOpen] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);

  const currentLevel = level(state.xp);

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
  // Every outstanding alert type for this pet, by action — drives the red
  // "!" badge on the matching Log care box. Covers both kinds of alert
  // reminder: basic-needs warnings (no vetId, matched by emoji) and the
  // /plan over/under-target health alerts that suggest a vet (vetId set,
  // matched by which ALERT_VERB shows up in the title) — those also flag
  // the Vet box itself, since they're the ones suggesting a vet visit.
  const careWarnings = new Set(
    state.reminders
      .filter((r) => r.alert && !r.done && r.petId === pet.id)
      .flatMap((r): ActionType[] => {
        if (!r.vetId) {
          const t = CARE_WARNING_EMOJI[r.emoji];
          return t ? [t] : [];
        }
        const t = ALERT_VERB_TYPES.find((t) => r.title.includes(ALERT_VERB[t]!));
        return t ? [t, "vet"] : ["vet"];
      })
  );

  const nextReminder = state.reminders
    .filter((r) => !r.done && r.petId === pet.id)
    .sort((a, b) => a.due - b.due)[0];

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;

  const treatsSupply = pet.supplies.find((s) => s.icon === "star");

  const confirmFeed = () => {
    const frac = PORTIONS.find((p) => p.value === feedFraction)?.frac ?? 1;
    const logged = logAction(pet.id, "fed", frac * pet.cupGrams);
    setFeedPortionOpen(false);
    if (logged) {
      setJustLogged("fed");
      setTimeout(() => setJustLogged(null), 700);
    }
  };

  const confirmTreat = () => {
    if (!treatsSupply) return;
    consumeSupply(pet.id, treatsSupply.id);
    setFeedPortionOpen(false);
    toast("🦴", `${pet.name} got a treat`, `${treatsSupply.name} · ${Math.max(0, treatsSupply.level - 15)}% left`);
  };

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
            {petAlerts.map((r) => {
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

      {/* Stats strip */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setStreakSheetOpen(true)}
          className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform active:scale-95"
        >
          <Icon name="flame" size={18} className="text-orange" />
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

      {/* Quick actions */}
      <SectionHeader>Log care · family gets notified</SectionHeader>
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((type) => {
          const a = ACTION_ICON[type];
          const flash = justLogged === type;
          const warning = !flash && careWarnings.has(type);
          return (
            <button
              key={type}
              onClick={() => {
                if (type === "fed") {
                  setFeedPortionOpen(true);
                  return;
                }
                if (logAction(pet.id, type)) {
                  setJustLogged(type);
                  setTimeout(() => setJustLogged(null), 700);
                }
              }}
              className="relative flex flex-col items-start gap-2.5 rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform duration-150 active:scale-[0.96]"
            >
              {flash && (
                <span className="font-pixel animate-coin-pop pointer-events-none absolute right-2 top-1 z-10 text-[9px] text-orange">
                  +5
                </span>
              )}
              {warning && (
                <span className="pointer-events-none absolute right-2 top-2 z-10" aria-label={`${ACTIONS[type].label} warning`}>
                  <PixelSprite sprite={WARNING_SPRITE} size={12} className="pixelated" />
                </span>
              )}
              <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${flash ? "bg-green text-white" : `${a.bg} ${a.tint}`}`}>
                {flash ? <Icon name="check" size={18} strokeWidth={2.4} className="animate-pop" /> : <Icon name={a.icon} size={19} />}
              </span>
              <span className="flex items-center gap-1 text-[13px] font-semibold text-label">
                {type === "meds" && pet.meds.length === 0 ? (
                  <>
                    No meds
                    <PixelSprite sprite={SMILEY_SPRITE} size={13} className="pixelated" />
                  </>
                ) : (
                  ACTIONS[type].label
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick shortcuts to the deeper features */}
      <SectionHeader>Manage</SectionHeader>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { href: `/pet/${pet.id}`, icon: "box" as const, label: "Supplies", tint: "text-accent", bg: "bg-accent-soft" },
          { href: "/vets", icon: "cross" as const, label: "Find a Vet", tint: "text-green", bg: "bg-green-soft" },
          { href: `/pet/${pet.id}`, icon: "chart" as const, label: "Weight", tint: "text-orange", bg: "bg-orange-soft" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex flex-col items-start gap-2.5 rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform duration-150 active:scale-[0.96]"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${s.bg} ${s.tint}`}>
              <Icon name={s.icon} size={19} />
            </span>
            <span className="text-[13px] font-semibold text-label">{s.label}</span>
          </Link>
        ))}
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

      {/* Premium: today's care plan on the dashboard */}
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
                    onClick={
                      complete
                        ? undefined
                        : () => {
                            if (item.action === "fed") {
                              setFeedPortionOpen(true);
                              return;
                            }
                            if (logAction(pet.id, item.action!)) {
                              setJustLogged(item.action!);
                              setTimeout(() => setJustLogged(null), 700);
                            }
                          }
                    }
                    leading={
                      complete ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green text-white">
                          <Icon name="check" size={18} strokeWidth={2.4} />
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
        label="Weight (kg)"
        initialValue={pet.weightKg}
        onSave={(kg) => {
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

      <Sheet open={feedPortionOpen} onClose={() => setFeedPortionOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">How much food?</h2>
        <p className="mt-0.5 text-[13px] text-label-2">For {pet.name} · {pet.cupGrams} g per full cup</p>
        <div className="mt-5">
          <Segmented options={PORTIONS} value={feedFraction} onChange={setFeedFraction} />
        </div>
        <div className="mt-7">
          <AccentButton onClick={confirmFeed}>Log feeding</AccentButton>
        </div>
        {treatsSupply && (
          <div className="mt-6 border-t border-fill pt-5">
            <h3 className="text-[15px] font-bold text-label">Give a treat instead?</h3>
            <p className="mt-0.5 text-[13px] text-label-2">{treatsSupply.name} · {treatsSupply.level}% left</p>
            <div className="mt-3">
              <AccentButton variant="tinted" onClick={confirmTreat}>Give treat</AccentButton>
            </div>
          </div>
        )}
      </Sheet>

      <LevelStagesSheet open={levelSheetOpen} onClose={() => setLevelSheetOpen(false)} />
      <StreakCalendarSheet open={streakSheetOpen} onClose={() => setStreakSheetOpen(false)} />
    </div>
  );
}
