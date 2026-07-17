"use client";

import { useState } from "react";
import Link from "next/link";
import BackBar from "@/components/BackBar";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import Paywall from "@/components/Paywall";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { ACTIONS, Activity, VET, VETS } from "@/lib/data";
import { dueLabel, timeAgo, useStore } from "@/lib/store";

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

export default function ActivityPage() {
  const { state, hydrated, bookVetById, toast } = useStore();
  const [bookOpen, setBookOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (!hydrated) return <PageLoading title="Activity" compact />;

  const member = (id: string) => state.members.find((m) => m.id === id);
  const petById = (id: string) => state.pets.find((p) => p.id === id);
  const cat = state.pets.find((p) => p.breed === "British Shorthair") ?? state.pets[0];

  // Needs attention — the outstanding care alerts (same set the bell badges),
  // deduped (the data can hold identical entries) and grouped per pet so a bad
  // day reads as one calm block per pet instead of a wall of red cards.
  const seenAlert = new Set<string>();
  const alerts = state.reminders
    .filter((r) => r.alert && !r.done)
    .sort((a, b) => a.due - b.due)
    .filter((r) => {
      const key = `${r.petId}|${r.title}`;
      if (seenAlert.has(key)) return false;
      seenAlert.add(key);
      return true;
    });
  const alertGroups = state.pets
    .map((p) => ({ pet: p, items: alerts.filter((r) => r.petId === p.id) }))
    .filter((g) => g.items.length > 0);

  // Family feed
  const sorted = [...state.activities].sort((a, b) => b.ts - a.ts).slice(0, 40);
  const groups: { day: string; items: Activity[] }[] = [];
  for (const a of sorted) {
    const day = dayKey(a.ts);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(a);
    else groups.push({ day, items: [a] });
  }

  return (
    <div className="px-4">
      <BackBar title="Activity" />

      {/* Needs attention — one group per pet, standard rows */}
      {alertGroups.length > 0 && (
        <>
          <SectionHeader>Needs attention</SectionHeader>
          <div className="flex flex-col gap-3">
            {alertGroups.map(({ pet, items }) => (
              <Group key={pet.id}>
                <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
                  <PetAvatar pet={pet} size="xs" showCosmetics={false} />
                  <span className="text-[13px] font-semibold text-label-2">{pet.name}</span>
                </div>
                {items.map((r) => {
                  const alertVet = r.vetId ? VETS.find((v) => v.id === r.vetId) ?? VET : null;
                  return (
                    <Row
                      key={r.id}
                      title={<span className="text-red">{r.title}</span>}
                      subtitle={dueLabel(r.due)}
                      trailing={
                        alertVet ? (
                          <button
                            onClick={() => {
                              bookVetById(alertVet.id);
                              toast("stethoscope", `Vet visit requested`, `${alertVet.name} will follow up about ${pet.name}`);
                            }}
                            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-red px-3 text-[13px] font-semibold text-white transition-transform active:scale-95"
                          >
                            <Icon name="cross" size={14} /> Book vet
                          </button>
                        ) : undefined
                      }
                    />
                  );
                })}
              </Group>
            ))}
          </div>
        </>
      )}

      {/* Health insight / upsell */}
      {state.premium ? (
        <>
          <SectionHeader>Health · PetPal+</SectionHeader>
          <div className="rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_6px_20px_oklch(0.55_0.2_285/0.08)] ring-1 ring-accent/15">
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
              <AccentButton variant="tinted" size="sm" className="mt-3" onClick={() => setBookOpen(true)}>
                <Icon name="calendar" size={17} /> Book appointment
              </AccentButton>
            )}
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

      {/* Reminders + vet marketplace live here now (moved off the Care tab) */}
      <Group className="mt-8">
        <Link href="/reminders" className="block">
          <Row
            leading={<IconCircle icon="bell" tint="text-accent" bg="bg-accent-soft" />}
            title="Reminders"
            subtitle="Tasks & alerts the whole family sees"
            trailing={<Icon name="chevron-right" size={15} className="text-label-3" />}
          />
        </Link>
        <Link href="/vets" className="block">
          <Row
            leading={<IconCircle icon="cross" tint="text-green" bg="bg-green-soft" />}
            title="Find a vet"
            subtitle="Browse clinics near you"
            trailing={<Icon name="chevron-right" size={15} className="text-label-3" />}
          />
        </Link>
      </Group>

      {/* Family feed */}
      <SectionHeader>Recent activity</SectionHeader>
      {groups.length === 0 ? (
        <EmptyState icon="bell" title="No activity yet" body="Log some care from the Logs tab and it'll show up here for the whole family." />
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
                return (
                  <Row
                    key={a.id}
                    leading={<InitialAvatar name={m.name} gradient={m.gradient} size={32} />}
                    title={
                      <>
                        <span className="font-semibold">{isYou ? "You" : m.name}</span>{" "}
                        <span className="font-normal text-label-2">{ACTIONS[a.type].verb}</span>{" "}
                        <span className="font-semibold">{p.name}</span>
                      </>
                    }
                    subtitle={a.note ?? timeAgo(a.ts)}
                  />
                );
              })}
            </Group>
          </div>
        ))
      )}

      {/* Booking sheet */}
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
              toast("calendar", "Appointment requested", `${VET.name} will confirm shortly`);
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
