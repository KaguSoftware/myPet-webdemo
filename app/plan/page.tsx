"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import Paywall from "@/components/Paywall";
import EmptyState from "@/components/EmptyState";
import EditStatSheet from "@/components/EditStatSheet";
import { ACTION_ICON, Icon, IconName } from "@/components/Icons";
import { AccentButton, Chevron, Group, IconCircle, Row, SectionHeader, Segmented } from "@/components/ui";
import { CARE_PLANS, Pet, formatAge, formatWeight, weightFeedingEntry } from "@/lib/data";
import { useStore } from "@/lib/store";

type CustomTargetKey = keyof NonNullable<Pet["customPlan"]>;

const CUSTOM_TARGET_FIELDS: Record<"cat" | "dog", { key: CustomTargetKey; title: string; subtitle: string; icon: IconName }[]> = {
  cat: [
    { key: "fedPerDay", title: "Feeding", subtitle: "Meals per day", icon: "bowl" },
    { key: "fedGrams", title: "Food amount", subtitle: "Total grams per day", icon: "box" },
    { key: "waterPerDay", title: "Fresh water", subtitle: "Refreshes per day", icon: "drop" },
    { key: "litterPerDay", title: "Litter", subtitle: "Scoops per day", icon: "broom" },
  ],
  dog: [
    { key: "fedPerDay", title: "Feeding", subtitle: "Meals per day", icon: "bowl" },
    { key: "fedGrams", title: "Food amount", subtitle: "Total grams per day", icon: "box" },
    { key: "waterPerDay", title: "Fresh water", subtitle: "Refreshes per day", icon: "drop" },
    { key: "walkPerDay", title: "Walks", subtitle: "Walks per day", icon: "paw" },
  ],
};

const GENERIC_ICON: Record<string, IconName> = {
  "⚖️": "arrow-up",
  "🪥": "sparkles",
  "🛁": "drop",
  "👂": "bell",
  "🧶": "yarn",
  "🐾": "clipper",
  "🛡️": "shield",
  "🚪": "door",
  "💊": "pill",
};

export default function PlanPage() {
  const router = useRouter();
  const { state, hydrated, editPet, toast } = useStore();
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<CustomTargetKey | null>(null);

  if (!hydrated) return <PageLoading title="Care Plan" />;

  // Reminders are a free feature — surface them from the Care tab in both the
  // premium plan view and the (otherwise paywalled) free view.
  const remindersRow = (
    <Group className="mt-3">
      <Row
        onClick={() => router.push("/reminders")}
        leading={<IconCircle icon="bell" tint="text-accent" bg="bg-accent-soft" />}
        title="Reminders"
        subtitle="Tasks & alerts the whole family sees"
        trailing={<Chevron />}
      />
      <Row
        onClick={() => router.push("/vets")}
        leading={<IconCircle icon="cross" tint="text-green" bg="bg-green-soft" />}
        title="Find a vet"
        subtitle="Browse clinics near you"
        trailing={<Chevron />}
      />
    </Group>
  );

  const pet = state.pets.find((p) => p.id === petId) ?? state.pets[0];
  if (!pet) {
    return (
      <div className="flex h-full flex-col px-4">
        <Header title="Care Plan" bell />
        {remindersRow}
        <div className="mt-3">
          <EmptyState
            icon="paw"
            title="No pets yet"
            body="Add a pet to see its care plan and daily checklist here."
            cta="Add a pet"
            onCta={() => router.push("/pets")}
          />
        </div>
      </div>
    );
  }
  const plan = CARE_PLANS[pet.breed];
  const feedingGuide = weightFeedingEntry(pet);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays = state.activities.filter((a) => a.petId === pet.id && a.ts >= startOfDay.getTime());

  if (!state.premium) {
    return (
      <div className="flex h-full flex-col px-4">
        <Header title="Care Plan" bell />
        {remindersRow}
        <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon name="lock" size={34} />
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
      <Header title="Care Plan" subtitle={`Vet-built for ${pet.breed}s`} bell />

      {state.pets.length > 1 && (
        <Segmented
          options={state.pets.map((p) => ({ value: p.id, label: p.name }))}
          value={pet.id}
          onChange={setPetId}
        />
      )}

      {remindersRow}

      {plan ? (
        <>
          {feedingGuide && (
            <>
              <SectionHeader>Weight & feeding guide</SectionHeader>
              <p className="mb-3 px-1 text-[13px] leading-relaxed text-label-2">
                Based on {formatAge(pet.ageYears)} ({feedingGuide.ageLabel.toLowerCase()} stage){pet.sex ? `, ${pet.sex}` : ""}. Updates automatically as {pet.name} ages.
              </p>
              <Group>
                <div className="grid grid-cols-3 gap-2 px-4 py-3.5 text-center">
                  <div>
                    <p className="text-[11px] font-medium text-label-2">Ideal weight</p>
                    <p className="text-[14px] font-semibold text-label">
                      {formatWeight(feedingGuide.weightKgRange[0], state.units)}–{formatWeight(feedingGuide.weightKgRange[1], state.units)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-label-2">Calories/day</p>
                    <p className="text-[14px] font-semibold text-label">{feedingGuide.calorieRange[0]}–{feedingGuide.calorieRange[1]} kcal</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-label-2">Dry kibble</p>
                    <p className="text-[14px] font-semibold text-label">~{feedingGuide.kibbleGramsRange[0]}–{feedingGuide.kibbleGramsRange[1]} g</p>
                  </div>
                </div>
              </Group>
            </>
          )}

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
                          <Icon name="check" size={18} />
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
        <>
          <SectionHeader>Today</SectionHeader>
          <p className="mb-3 px-1 text-[13px] leading-relaxed text-label-2">
            {pet.breed} isn&apos;t on our vet-built breed list yet — set your own daily targets below and PetPal will track
            against them.
          </p>
          <Group>
            {CUSTOM_TARGET_FIELDS[pet.species].map((f) => {
              const value = pet.customPlan?.[f.key];
              return (
                <Row
                  key={f.key}
                  onClick={() => setEditingTarget(f.key)}
                  leading={<IconCircle icon={f.icon} tint="text-accent" bg="bg-accent-soft" />}
                  title={f.title}
                  subtitle={value != null ? f.subtitle : `${f.subtitle} — not set`}
                  trailing={
                    <span className={`text-[13px] font-semibold ${value != null ? "text-label" : "text-label-3"}`}>
                      {value != null ? value : "Set"}
                    </span>
                  }
                />
              );
            })}
          </Group>
        </>
      )}

      {!plan &&
        CUSTOM_TARGET_FIELDS[pet.species].map((f) => (
          <EditStatSheet
            key={f.key}
            open={editingTarget === f.key}
            onClose={() => setEditingTarget(null)}
            title={`${pet.name}'s ${f.title.toLowerCase()} target`}
            label={f.subtitle}
            initialValue={pet.customPlan?.[f.key]}
            onSave={(value) => {
              editPet(pet.id, {
                name: pet.name,
                breed: pet.breed,
                ageYears: pet.ageYears,
                weightKg: pet.weightKg,
                cupGrams: pet.cupGrams,
                customPlan: { ...pet.customPlan, [f.key]: value },
              });
              toast("📋", `${f.title} target updated`, `${value} ${f.subtitle.toLowerCase()}`);
            }}
          />
        ))}
    </div>
  );
}
