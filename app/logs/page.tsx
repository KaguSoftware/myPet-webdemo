"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import Sheet from "@/components/Sheet";
import PixelSprite from "@/components/pixel/PixelSprite";
import { SMILEY_SPRITE, WARNING_SPRITE } from "@/components/pixel/hudSprites";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, SectionHeader, Segmented } from "@/components/ui";
import { ACTIONS, ActionType, CARE_PLANS, PORTIONS } from "@/lib/data";
import { ALERT_VERB, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

const ALERT_VERB_TYPES = Object.keys(ALERT_VERB) as ActionType[];
const CARE_WARNING_EMOJI: Partial<Record<string, ActionType>> = { "🍖": "fed", "💧": "water", "🧹": "litter", "🦮": "walk" };

export default function LogsPage() {
  const { state, hydrated, logAction, useSupply: consumeSupply, toast } = useStore();
  const [petId, setPetId] = useState("");
  const [justLogged, setJustLogged] = useState<ActionType | null>(null);
  const [feedPortionOpen, setFeedPortionOpen] = useState(false);
  const [feedFraction, setFeedFraction] = useState<(typeof PORTIONS)[number]["value"]>("1");
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
  // complete via a log action.
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
        <Header title="Logs" subtitle="Log care · everyone's notified" bell />
        <div className="mt-4">
          <EmptyState icon="list" title="No pets yet" body="Add a pet from Settings ▸ Family to start logging care." />
        </div>
      </div>
    );
  }

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;
  const treatsSupply = pet.supplies.find((s) => s.icon === "star");

  // Every outstanding alert type for this pet — drives the red "!" badge on the
  // matching log box.
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

  return (
    <div className="px-4">
      <Header title="Logs" subtitle="Log care · everyone's notified" bell />

      {state.pets.length > 1 && (
        <Segmented options={state.pets.map((p) => ({ value: p.id, label: p.name }))} value={pet.id} onChange={setPetId} />
      )}

      {/* Log care grid — the whole point of this tab */}
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

      <p className="mt-4 px-1 text-[13px] leading-relaxed text-label-2">
        Every action is shared with the family and shows up in Activity. Tap the bell any time to see what everyone&apos;s been up to.
      </p>

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
    </div>
  );
}
