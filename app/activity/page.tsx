"use client";

import { useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import Paywall from "@/components/Paywall";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { ACTIONS, Activity, VET } from "@/lib/data";
import { timeAgo, useStore } from "@/lib/store";

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
  const { state, bookVet, toast } = useStore();
  const [bookOpen, setBookOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const sorted = [...state.activities].sort((a, b) => b.ts - a.ts).slice(0, 40);
  const groups: { day: string; items: Activity[] }[] = [];
  for (const a of sorted) {
    const day = dayKey(a.ts);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(a);
    else groups.push({ day, items: [a] });
  }

  const cat = state.pets.find((p) => p.breed === "British Shorthair") ?? state.pets[0];
  const member = (id: string) => state.members.find((m) => m.id === id);
  const pet = (id: string) => state.pets.find((p) => p.id === id);

  return (
    <div className="px-4">
      <Header title="Activity" subtitle="The family feed" />

      {/* Insight */}
      {state.premium ? (
        <div className="rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_6px_20px_oklch(0.55_0.19_258/0.08)] ring-1 ring-accent/15">
          <div className="flex items-start gap-3">
            <IconCircle icon="stethoscope" tint="text-accent" bg="bg-accent-soft" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-accent">Health insight · PetPal+</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-label">
                {cat?.name}&apos;s 6-month checkup is due next week
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-label-2">
                We recommend {VET.name} at {VET.clinic} — {VET.rating} ★, {VET.distanceKm} km away.
              </p>
            </div>
          </div>
          {state.bookedVet ? (
            <p className="mt-3 flex items-center gap-2 rounded-ios bg-green-soft px-3 py-2.5 text-[13px] font-semibold text-green">
              <Icon name="check" size={15} strokeWidth={2.4} /> Appointment requested — the clinic will confirm shortly
            </p>
          ) : (
            <AccentButton variant="tinted" className="mt-3 !h-[42px] !text-[15px]" onClick={() => setBookOpen(true)}>
              <Icon name="calendar" size={17} /> Book appointment
            </AccentButton>
          )}
          <Link href="/vets" className="mt-2 flex items-center justify-center gap-1 text-[13px] font-semibold text-accent">
            Browse all vets near you <Icon name="chevron-right" size={13} />
          </Link>
        </div>
      ) : (
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
          <Icon name="chevron-right" size={15} strokeWidth={2.4} className="text-label-3" />
        </button>
      )}

      {/* Feed */}
      {groups.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon="bell"
            title="No activity yet"
            body="Log some care from the Home tab and it'll show up here for the whole family."
          />
        </div>
      )}
      {groups.map((g) => (
        <div key={g.day}>
          <SectionHeader>{g.day}</SectionHeader>
          <Group>
            {g.items.map((a) => {
              const m = member(a.memberId);
              const p = pet(a.petId);
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
      ))}

      {/* Booking sheet */}
      <Sheet open={bookOpen} onClose={() => setBookOpen(false)}>
        <div className="flex items-center gap-4 pt-1">
          <InitialAvatar name={VET.name.replace("Dr. ", "")} gradient={["oklch(0.6 0.13 200)", "oklch(0.48 0.13 240)"]} size={56} />
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{VET.name}</h2>
            <p className="text-[13px] font-medium text-label-2">{VET.clinic}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-label-2">
              <Icon name="star" size={13} filled className="text-orange" /> {VET.rating} · {VET.distanceKm} km away
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
              bookVet();
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
