"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Paywall from "@/components/Paywall";
import { ACTION_ICON, Icon, IconName } from "@/components/Icons";
import { AccentButton, Group, IconCircle, Row, SectionHeader, Segmented } from "@/components/ui";
import { CARE_PLANS } from "@/lib/data";
import { useStore } from "@/lib/store";

const GENERIC_ICON: Record<string, IconName> = {
  "⚖️": "arrow-up",
  "🪥": "sparkles",
  "🛁": "drop",
  "👂": "bell",
};

export default function PlanPage() {
  const { state } = useStore();
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [paywallOpen, setPaywallOpen] = useState(false);

  const pet = state.pets.find((p) => p.id === petId) ?? state.pets[0];
  const plan = CARE_PLANS[pet.breed];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = state.activities.filter((a) => a.petId === pet.id && a.ts >= startOfDay.getTime());

  if (!state.premium) {
    return (
      <div className="flex h-full flex-col px-4">
        <Header title="Care Plan" />
        <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon name="lock" size={34} strokeWidth={1.6} />
          </span>
          <h2 className="mt-5 text-[22px] font-bold tracking-[-0.01em] text-label">Your pet&apos;s complete guide</h2>
          <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-label-2">
            A vet-built, breed-specific plan: exact portions in grams, grooming cadence, vet schedule. We remind you
            before you need to remember.
          </p>
          <div className="mt-7 w-full space-y-2.5">
            {[
              { icon: "bowl" as IconName, text: "Feeding · 65 g per meal, 3× daily" },
              { icon: "scissors" as IconName, text: "Brushing · 2× weekly" },
              { icon: "stethoscope" as IconName, text: "Vet checkup · every 6 months" },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fill text-label-2">
                  <Icon name={t.icon} size={16} />
                </span>
                <span className="text-[14px] font-medium text-label-2 blur-[3px] select-none">{t.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 w-full">
            <AccentButton onClick={() => setPaywallOpen(true)}>Unlock with PetPal+</AccentButton>
          </div>
        </div>
        <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />
      </div>
    );
  }

  return (
    <div className="px-4">
      <Header title="Care Plan" subtitle={`Vet-built for ${pet.breed}s`} />

      {state.pets.length > 1 && (
        <Segmented
          options={state.pets.map((p) => ({ value: p.id, label: p.name }))}
          value={pet.id}
          onChange={setPetId}
        />
      )}

      {plan ? (
        <>
          <SectionHeader>Today</SectionHeader>
          <Group>
            {plan.items
              .filter((i) => i.perDay)
              .map((item) => {
                const done = todays.filter((a) => a.type === item.action).length;
                const target = item.perDay ?? 1;
                const complete = done >= target;
                const ai = item.action ? ACTION_ICON[item.action] : null;
                return (
                  <Row
                    key={item.title}
                    leading={
                      complete ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green text-white">
                          <Icon name="check" size={18} strokeWidth={2.4} />
                        </span>
                      ) : ai ? (
                        <IconCircle icon={ai.icon} tint={ai.tint} bg={ai.bg} />
                      ) : null
                    }
                    title={item.title}
                    subtitle={complete ? "Complete" : `${Math.min(done, target)} of ${target} done`}
                    trailing={
                      <span className={`text-[13px] font-semibold ${complete ? "text-green" : "text-label-3"}`}>
                        {Math.min(done, target)}/{target}
                      </span>
                    }
                  />
                );
              })}
          </Group>

          <SectionHeader>Full {pet.breed} guide</SectionHeader>
          <p className="mb-3 px-1 text-[13px] leading-relaxed text-label-2">{plan.intro}</p>
          <Group>
            {plan.items.map((item) => {
              const ai = item.action ? ACTION_ICON[item.action] : null;
              const icon: IconName = ai?.icon ?? GENERIC_ICON[item.emoji] ?? "heart-text";
              return (
                <div key={item.title} className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <IconCircle icon={icon} tint={ai?.tint ?? "text-label-2"} bg={ai?.bg ?? "bg-fill"} size={32} iconSize={16} />
                    <p className="flex-1 text-[15px] font-semibold text-label">{item.title}</p>
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                      {item.cadence}
                    </span>
                  </div>
                  <p className="mt-2 pl-11 text-[13px] leading-relaxed text-label-2">{item.detail}</p>
                </div>
              );
            })}
          </Group>
        </>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-card bg-card p-7 text-center shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
          <IconCircle icon="stethoscope" tint="text-accent" bg="bg-accent-soft" size={52} iconSize={26} />
          <p className="mt-3 text-[15px] font-semibold text-label">No plan for {pet.breed} yet</p>
          <p className="mt-1 text-[13px] leading-relaxed text-label-2">
            Our vet partners are writing it — we&apos;ll notify you when it&apos;s ready.
          </p>
        </div>
      )}
    </div>
  );
}
