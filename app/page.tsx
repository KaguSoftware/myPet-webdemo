"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import PetAvatar from "@/components/PetAvatar";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { Chevron, Chip, CoinPill, Group, Row, SectionHeader } from "@/components/ui";
import { ACTIONS, ActionType, CARE_PLANS } from "@/lib/data";
import { dueLabel, level, levelProgress, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

export default function Home() {
  const { state, logAction } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [justLogged, setJustLogged] = useState<ActionType | null>(null);

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
  const fedPct = Math.min(100, Math.round((fedCount / fedTarget) * 100));

  const nextReminder = state.reminders
    .filter((r) => !r.done && r.petId === pet.id)
    .sort((a, b) => a.due - b.due)[0];

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;

  return (
    <div className="px-4">
      <Header title="Home" subtitle={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${me?.name}`} trailing={<CoinPill amount={state.coins} />} />

      {/* Pet hero card */}
      <div className="rounded-sheet bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)]">
        <div className="flex items-center gap-4">
          <PetAvatar pet={pet} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-bold tracking-[-0.01em] text-label">{pet.name}</h2>
            <p className="text-[14px] font-medium text-label-2">{pet.breed}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>{pet.ageYears} yrs</Chip>
              <Chip>{pet.weightKg} kg</Chip>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-label-2">Meals today</p>
            <p className="text-[13px] font-semibold text-label">
              {fedCount} <span className="text-label-3">of {fedTarget}</span>
            </p>
          </div>
          <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-fill">
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
                className={`h-[7px] rounded-full transition-all duration-300 ${
                  i === petIndex ? "w-5 bg-label" : "w-[7px] bg-[oklch(0.22_0.01_264/0.18)]"
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
              className="flex flex-col items-start gap-2.5 rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform duration-150 active:scale-[0.96]"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${flash ? "bg-green text-white" : `${a.bg} ${a.tint}`}`}>
                {flash ? <Icon name="check" size={18} strokeWidth={2.4} className="animate-pop" /> : <Icon name={a.icon} size={19} />}
              </span>
              <span className="text-[13px] font-semibold text-label">{ACTIONS[type].label}</span>
            </button>
          );
        })}
      </div>

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
