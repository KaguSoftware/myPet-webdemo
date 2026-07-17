"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import FeedPortionSheet from "@/components/FeedPortionSheet";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import PetAvatar from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, Chevron, Group, Row, SectionHeader, Segmented } from "@/components/ui";
import { ACTIONS, ActionType, CARE_PLANS } from "@/lib/data";
import { ALERT_VERB, useStore } from "@/lib/store";

const CAT_ACTIONS: ActionType[] = ["fed", "water", "litter", "groomed", "meds", "vet"];
const DOG_ACTIONS: ActionType[] = ["fed", "water", "walk", "groomed", "meds", "vet"];

const ALERT_VERB_TYPES = Object.keys(ALERT_VERB) as ActionType[];
const CARE_WARNING_EMOJI: Partial<Record<string, ActionType>> = { "🍖": "fed", "💧": "water", "🧹": "litter", "🦮": "walk" };

export default function LogsPage() {
  const { state, hydrated, logAction, addVetVisit, toast } = useStore();
  const router = useRouter();
  const [petId, setPetId] = useState("");
  const [justLogged, setJustLogged] = useState<ActionType | null>(null);
  const [feedPortionOpen, setFeedPortionOpen] = useState(false);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [retroOpen, setRetroOpen] = useState(false);
  const [retroType, setRetroType] = useState<ActionType | null>(null);
  const [retroDay, setRetroDay] = useState<"today" | "yesterday">("today");
  const [retroTime, setRetroTime] = useState("");
  const [vetDetailOpen, setVetDetailOpen] = useState(false);
  const [vetReason, setVetReason] = useState("");
  const [vetClinic, setVetClinic] = useState("");
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
      toast("star", "All caught up today!", `${pet.name}'s care is all done for today`);
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
          <EmptyState
            icon="list"
            title="No pets yet"
            body="Add your first pet to start logging care."
            cta="Add a pet"
            onCta={() => router.push("/pets")}
          />
        </div>
      </div>
    );
  }

  const actions = pet.species === "cat" ? CAT_ACTIONS : DOG_ACTIONS;

  // Timestamp for the retro-log sheet — null while incomplete or in the future.
  const retroTs = () => {
    if (!retroTime) return null;
    const d = new Date();
    if (retroDay === "yesterday") d.setDate(d.getDate() - 1);
    const [hh, mm] = retroTime.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    d.setHours(hh, mm, 0, 0);
    const ts = d.getTime();
    return ts > Date.now() ? null : ts;
  };

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

  return (
    <div className="px-4">
      <Header title="Logs" subtitle="Log care · everyone's notified" bell />

      {state.pets.length > 1 && (
        <button
          type="button"
          onClick={() => setPetPickerOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 px-1"
        >
          <span className="text-[18px] font-semibold text-label">{pet.name}</span>
          <Chevron />
        </button>
      )}

      <Sheet open={petPickerOpen} onClose={() => setPetPickerOpen(false)} ariaLabel="Switch pet">
        <h2 className="mb-3 px-1 text-[20px] font-bold tracking-[-0.01em] text-label">Switch pet</h2>
        <Group>
          {state.pets.map((p) => (
            <Row
              key={p.id}
              onClick={() => {
                setPetId(p.id);
                setPetPickerOpen(false);
              }}
              leading={<PetAvatar pet={p} size="sm" />}
              title={p.name}
              subtitle={p.breed}
              trailing={p.id === pet.id ? <Icon name="check" size={18} className="text-accent" /> : undefined}
            />
          ))}
        </Group>
      </Sheet>

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
                  // A vet tap naturally produces a health-history record — offer
                  // the details right away, skippable.
                  if (type === "vet") {
                    setVetReason("");
                    setVetClinic("");
                    setVetDetailOpen(true);
                  }
                }
              }}
              className="relative flex flex-col items-start gap-2.5 rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] transition-transform duration-150 active:scale-[0.96]"
            >
              {flash && (
                <span className="animate-coin-pop pointer-events-none absolute right-2 top-1 z-10 text-[12px] font-bold text-orange">
                  +5
                </span>
              )}
              {warning && (
                <span className="pointer-events-none absolute right-2 top-2 z-10 text-red" aria-label={`${ACTIONS[type].label} warning`}>
                  <Icon name="alert" size={14} />
                </span>
              )}
              <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${flash ? "bg-green text-white" : `${a.bg} ${a.tint}`}`}>
                {flash ? <Icon name="check" size={18} className="animate-pop" /> : <Icon name={a.icon} size={19} />}
              </span>
              <span className="flex items-center gap-1 text-[13px] font-semibold text-label">
                {type === "meds" && pet.meds.length === 0 ? "No meds" : ACTIONS[type].label}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          setRetroType(null);
          setRetroDay("today");
          setRetroTime("");
          setRetroOpen(true);
        }}
        className="mt-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-accent"
      >
        <Icon name="clock" size={13} /> Forgot to log something earlier?
      </button>

      <p className="mt-3 px-1 text-[13px] leading-relaxed text-label-2">
        Every action is shared with the family and shows up in Activity. Tap the bell any time to see what everyone&apos;s been up to.
      </p>

      <Sheet open={retroOpen} onClose={() => setRetroOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Log an earlier action</h2>
        <p className="mt-0.5 text-[13px] text-label-2">For {pet.name} — backfill something you forgot</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">What happened</p>
        <div className="flex flex-wrap gap-2">
          {actions
            .filter((t) => !(t === "meds" && pet.meds.length === 0))
            .map((type) => {
              const a = ACTION_ICON[type];
              const active = retroType === type;
              return (
                <button
                  key={type}
                  onClick={() => setRetroType(type)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-semibold transition-all ${
                    active ? "bg-accent text-white" : "bg-card text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]"
                  }`}
                >
                  <Icon name={a.icon} size={14} /> {ACTIONS[type].label}
                </button>
              );
            })}
        </div>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">When</p>
        <Segmented
          options={[
            { value: "today", label: "Earlier today" },
            { value: "yesterday", label: "Yesterday" },
          ]}
          value={retroDay}
          onChange={setRetroDay}
        />
        <input
          type="time"
          value={retroTime}
          onChange={(e) => setRetroTime(e.target.value)}
          className="mt-2.5 w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!retroType || !retroTime}
            onClick={() => {
              const ts = retroTs();
              if (!retroType) return;
              if (ts == null) {
                toast("alert", "That time hasn't happened yet", "Pick a time in the past");
                return;
              }
              if (logAction(pet.id, retroType, undefined, ts)) setRetroOpen(false);
            }}
          >
            Log it
          </AccentButton>
        </div>
      </Sheet>

      <Sheet open={vetDetailOpen} onClose={() => setVetDetailOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Add visit details?</h2>
        <p className="mt-0.5 text-[13px] text-label-2">Saved to {pet.name}&apos;s health history — skip if it was nothing</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Reason</p>
        <input
          value={vetReason}
          onChange={(e) => setVetReason(e.target.value)}
          placeholder="e.g. Annual checkup, vaccination…"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Vet or clinic (optional)</p>
        <input
          value={vetClinic}
          onChange={(e) => setVetClinic(e.target.value)}
          placeholder="e.g. Dr. Weber, Happy Paws Clinic"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <div className="mt-7 flex flex-col gap-2.5">
          <AccentButton
            disabled={!vetReason.trim() && !vetClinic.trim()}
            onClick={() => {
              addVetVisit(pet.id, { ts: Date.now(), reason: vetReason.trim() || undefined, vetName: vetClinic.trim() || undefined });
              setVetDetailOpen(false);
              toast("stethoscope", "Visit saved", `${pet.name}'s health history updated`);
            }}
          >
            Save details
          </AccentButton>
          <AccentButton variant="gray" onClick={() => setVetDetailOpen(false)}>
            Skip
          </AccentButton>
        </div>
      </Sheet>

      <FeedPortionSheet
        pet={pet}
        open={feedPortionOpen}
        onClose={() => setFeedPortionOpen(false)}
        onLogged={() => {
          setJustLogged("fed");
          setTimeout(() => setJustLogged(null), 700);
        }}
      />
    </div>
  );
}
