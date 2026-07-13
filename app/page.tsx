"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import PetAvatar from "@/components/PetAvatar";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { Chevron, Chip, CoinPill, Group, Row, SectionHeader } from "@/components/ui";
import { ACTIONS, ActionType, CARE_PLANS, formatAge, formatWeight } from "@/lib/data";
import { dueLabel, level, levelProgress, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

export default function Home() {
  const { state, hydrated, logAction, restockSupply, toast } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [justLogged, setJustLogged] = useState<ActionType | null>(null);
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

  const nextReminder = state.reminders
    .filter((r) => !r.done && r.petId === pet.id)
    .sort((a, b) => a.due - b.due)[0];

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;

  return (
    <div className="px-4">
      <Header title="Home" subtitle={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${me?.name}`} trailing={<CoinPill amount={state.coins} />} />

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
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>{formatAge(pet.ageYears)}</Chip>
              <Chip>{formatWeight(pet.weightKg, state.units)}</Chip>
            </div>
          </div>
        </Link>
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

      {/* Stats strip */}
      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
          <Icon name="flame" size={18} className="text-orange" />
          <div>
            <p className="text-[15px] font-bold leading-none text-label">{state.streak}</p>
            <p className="mt-0.5 text-[11px] font-medium text-label-2">day streak</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
          <Icon name="star" size={18} className="text-accent" />
          <div>
            <p className="text-[15px] font-bold leading-none text-label">Lv {level(state.xp)}</p>
            <p className="mt-0.5 text-[11px] font-medium text-label-2">{levelProgress(state.xp)}/100 XP</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-card bg-card px-3.5 py-3 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
          <Icon name="coin" size={18} className="text-[oklch(0.55_0.13_60)]" />
          <div>
            <p className="text-[15px] font-bold leading-none text-label">{state.coins}</p>
            <p className="mt-0.5 text-[11px] font-medium text-label-2">coins</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <SectionHeader>Log care · family gets notified</SectionHeader>
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((type) => {
          const a = ACTION_ICON[type];
          const flash = justLogged === type;
          return (
            <button
              key={type}
              onClick={() => {
                logAction(pet.id, type);
                setJustLogged(type);
                setTimeout(() => setJustLogged(null), 700);
              }}
              className="relative flex flex-col items-start gap-2.5 rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform duration-150 active:scale-[0.96]"
            >
              {flash && (
                <span className="font-pixel animate-coin-pop pointer-events-none absolute right-2 top-1 z-10 text-[9px] text-orange">
                  +5
                </span>
              )}
              <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${flash ? "bg-green text-white" : `${a.bg} ${a.tint}`}`}>
                {flash ? <Icon name="check" size={18} strokeWidth={2.4} className="animate-pop" /> : <Icon name={a.icon} size={19} />}
              </span>
              <span className="text-[13px] font-semibold text-label">{ACTIONS[type].label}</span>
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
                            logAction(pet.id, item.action!);
                            setJustLogged(item.action!);
                            setTimeout(() => setJustLogged(null), 700);
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
    </div>
  );
}
