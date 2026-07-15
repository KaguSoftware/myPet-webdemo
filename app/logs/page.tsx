"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import Paywall from "@/components/Paywall";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import PixelSprite from "@/components/pixel/PixelSprite";
import { SMILEY_SPRITE, WARNING_SPRITE } from "@/components/pixel/hudSprites";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, Group, IconCircle, Row, SectionHeader, Segmented } from "@/components/ui";
import { ACTIONS, Activity, ActionType, CARE_PLANS, PORTIONS, VET } from "@/lib/data";
import { ALERT_VERB, timeAgo, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

const ALERT_VERB_TYPES = Object.keys(ALERT_VERB) as ActionType[];
const CARE_WARNING_EMOJI: Partial<Record<string, ActionType>> = { "🍖": "fed", "💧": "water", "🧹": "litter", "🦮": "walk" };

function dayKey(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export default function LogsPage() {
  const { state, hydrated, logAction, useSupply: consumeSupply, toast, bookVetById } = useStore();
  const [petId, setPetId] = useState("");
  const [justLogged, setJustLogged] = useState<ActionType | null>(null);
  const [feedPortionOpen, setFeedPortionOpen] = useState(false);
  const [feedFraction, setFeedFraction] = useState<(typeof PORTIONS)[number]["value"]>("1");
  const [bookOpen, setBookOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const prevDayDoneRef = useRef<{ petId: string; done: boolean } | null>(null);

  const activePetId = petId || state.pets[0]?.id || "";
  const pet = state.pets.find((p) => p.id === activePetId) ?? state.pets[0];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = useMemo(
    () => (pet ? state.activities.filter((a) => a.petId === pet.id && a.ts >= startOfDay.getTime()) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activities, pet?.id]
  );

  // "All caught up today" — fires once when the SELECTED pet's day flips to
  // complete via a log action (moved here from Home, where logging used to live).
  useEffect(() => {
    if (!pet) return;
    const plan = CARE_PLANS[pet.breed];
    const planItems = plan?.items.filter((i) => i.perDay && i.action) ?? [];
    const dayDone =
      state.premium && plan
        ? planItems.length > 0 &&
          planItems.every((item) => todays.filter((a) => a.type === item.action).length >= (item.perDay ?? 1))
        : todays.filter((a) => a.type === "fed").length >= (plan?.items.find((i) => i.action === "fed")?.perDay ?? 2);
    const prev = prevDayDoneRef.current;
    if (prev && prev.petId === pet.id && !prev.done && dayDone) {
      toast("🎉", "All caught up today!", `${pet.name}'s care is all done for today`);
    }
    prevDayDoneRef.current = { petId: pet.id, done: dayDone };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todays, pet?.id, state.premium]);

  if (!hydrated) return <PageLoading title="Logs" subtitle="Log care · everyone's notified" />;
  if (!pet) {
    return (
      <div className="px-4">
        <Header title="Logs" subtitle="Log care · everyone's notified" />
        <div className="mt-4">
          <EmptyState icon="list" title="No pets yet" body="Add a pet from Settings ▸ Family to start logging care." />
        </div>
      </div>
    );
  }

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;
  const treatsSupply = pet.supplies.find((s) => s.icon === "star");

  // Every outstanding alert type for this pet — drives the red "!" badge on the
  // matching log box (same logic that used to live on Home's care grid).
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

  // Recent family feed — the history half of this tab (moved from Activity).
  const sorted = [...state.activities].sort((a, b) => b.ts - a.ts).slice(0, 40);
  const groups: { day: string; items: Activity[] }[] = [];
  for (const a of sorted) {
    const day = dayKey(a.ts);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(a);
    else groups.push({ day, items: [a] });
  }
  const member = (id: string) => state.members.find((m) => m.id === id);
  const petById = (id: string) => state.pets.find((p) => p.id === id);
  const cat = state.pets.find((p) => p.breed === "British Shorthair") ?? state.pets[0];

  return (
    <div className="px-4">
      <Header title="Logs" subtitle="Log care · everyone's notified" />

      {state.pets.length > 1 && (
        <Segmented options={state.pets.map((p) => ({ value: p.id, label: p.name }))} value={pet.id} onChange={setPetId} />
      )}

      {/* Log care grid — the primary action of this tab */}
      <SectionHeader>Log care</SectionHeader>
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
                {flash ? <Icon name="check" size={18} className="animate-pop" /> : <Icon name={a.icon} size={19} />}
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

      {/* Recent family feed */}
      <SectionHeader>Recent</SectionHeader>
      {groups.length === 0 ? (
        <EmptyState icon="list" title="Nothing logged yet" body="Log a care action above and it shows up here for the whole family." />
      ) : (
        groups.map((g) => (
          <div key={g.day}>
            {g.day !== "Today" && <SectionHeader>{g.day}</SectionHeader>}
            <Group>
              {g.items.map((a) => {
                const m = member(a.memberId);
                const p = petById(a.petId);
                if (!m || !p) return null;
                const isYou = m.id === state.currentMemberId;
                const ai = ACTION_ICON[a.type];
                return (
                  <Row
                    key={a.id}
                    leading={
                      <span className="relative shrink-0" style={{ width: 40, height: 38 }}>
                        <InitialAvatar name={m.name} gradient={m.gradient} size={32} />
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                          <PetAvatar pet={p} size="xs" showCosmetics={false} />
                        </span>
                      </span>
                    }
                    title={
                      <>
                        <span className="font-semibold">{isYou ? "You" : m.name}</span>{" "}
                        <span className="font-normal text-label-2">{ACTIONS[a.type].verb}</span>{" "}
                        <span className="font-semibold">{p.name}</span>
                      </>
                    }
                    subtitle={a.note ?? timeAgo(a.ts)}
                    trailing={
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ai.bg} ${ai.tint}`}>
                        <Icon name={ai.icon} size={16} />
                      </span>
                    }
                  />
                );
              })}
            </Group>
          </div>
        ))
      )}

      {/* Health insight / upsell (moved from Activity) */}
      {state.premium ? (
        <>
          <SectionHeader>Health · PetPal+</SectionHeader>
          <div className="rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_6px_20px_oklch(0.55_0.19_258/0.08)] ring-1 ring-accent/15">
            <div className="flex items-start gap-3">
              <IconCircle icon="stethoscope" tint="text-accent" bg="bg-accent-soft" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-label">{cat?.name}&apos;s 6-month checkup is due next week</p>
                <p className="mt-0.5 text-[13px] leading-snug text-label-2">
                  We recommend {VET.name} at {VET.clinic} — {VET.rating} ★, {VET.distanceKm} km away.
                </p>
              </div>
            </div>
            {state.bookedVet ? (
              <p className="mt-3 flex items-center gap-2 rounded-ios bg-green-soft px-3 py-2.5 text-[13px] font-semibold text-green">
                <Icon name="check" size={15} /> Appointment requested — the clinic will confirm shortly
              </p>
            ) : (
              <AccentButton variant="tinted" className="mt-3 h-10.5! text-[15px]!" onClick={() => setBookOpen(true)}>
                <Icon name="calendar" size={17} /> Book appointment
              </AccentButton>
            )}
            <Link href="/vets" className="mt-2 flex items-center justify-center gap-1 text-[13px] font-semibold text-accent">
              Browse all vets near you <Icon name="chevron-right" size={13} />
            </Link>
          </div>
        </>
      ) : (
        <>
          <SectionHeader>Health</SectionHeader>
          <button
            onClick={() => setPaywallOpen(true)}
            className="flex w-full items-center gap-3 rounded-card bg-card p-4 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform active:scale-[0.98]"
          >
            <IconCircle icon="lock" tint="text-label-2" bg="bg-fill" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-label">Health insights live here</span>
              <span className="block text-[13px] leading-snug text-label-2">
                PetPal+ watches the calendar and flags upcoming vet visits and treatments.
              </span>
            </span>
            <Icon name="chevron-right" size={15} className="text-label-3" />
          </button>
        </>
      )}

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

      <Sheet open={bookOpen} onClose={() => setBookOpen(false)}>
        <div className="flex items-center gap-4 pt-1">
          <InitialAvatar name={VET.name.replace("Dr. ", "")} gradient={["oklch(0.6 0.13 200)", "oklch(0.48 0.13 240)"]} size={56} />
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{VET.name}</h2>
            <p className="text-[13px] font-medium text-label-2">{VET.clinic}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-label-2">
              <Icon name="star" size={13} className="text-orange" /> {VET.rating} · {VET.distanceKm} km away
            </p>
          </div>
        </div>
        <Group className="mt-5">
          <Row
            leading={<IconCircle icon="stethoscope" tint="text-accent" bg="bg-accent-soft" />}
            title={`6-month checkup — ${cat?.name}`}
            subtitle="Dental check included"
          />
          <Row
            leading={<IconCircle icon="calendar" tint="text-accent" bg="bg-accent-soft" />}
            title="Tuesday, 10:30"
            subtitle="Suggested time · can be changed"
          />
        </Group>
        <div className="mt-6">
          <AccentButton
            onClick={() => {
              bookVetById(VET.id);
              setBookOpen(false);
              toast("📅", "Appointment requested", `${VET.name} will confirm shortly`);
            }}
          >
            Request appointment
          </AccentButton>
          <p className="mt-2.5 text-center text-[12px] text-label-3">Demo — no real booking is made.</p>
        </div>
      </Sheet>

      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
