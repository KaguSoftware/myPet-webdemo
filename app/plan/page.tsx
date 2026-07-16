"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import Paywall from "@/components/Paywall";
import EmptyState from "@/components/EmptyState";
import EditStatSheet from "@/components/EditStatSheet";
import EditTextSheet from "@/components/EditTextSheet";
import PetAvatar from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { ACTION_ICON, Icon, IconName } from "@/components/Icons";
import { AccentButton, Chevron, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { CARE_PLANS, Pet, formatWeight, weightFeedingEntry } from "@/lib/data";
import { useStore } from "@/lib/store";

type CustomTargetKey = Exclude<keyof NonNullable<Pet["customPlan"]>, "cadences">;

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

/* The non-daily "other" care activities a custom breed still gets — mirrors the
 * grooming/health/vet items in the vet-built CARE_PLANS. Each has a default
 * cadence the family can edit (stored per-pet in customPlan.cadences[id]). */
type OtherCareField = { id: string; title: string; detail: string; cadence: string; icon: IconName };
const OTHER_CARE_FIELDS: Record<"cat" | "dog", OtherCareField[]> = {
  cat: [
    { id: "grooming", title: "Brushing / grooming", detail: "Regular brushing to manage shedding and prevent matting.", cadence: "Weekly", icon: "scissors" },
    { id: "nails", title: "Nail trimming", detail: "Clip nails to prevent overgrowth and snagging.", cadence: "Every 2-4 weeks", icon: "clipper" },
    { id: "dental", title: "Dental care", detail: "Teeth cleaning, water additives, or dental treats.", cadence: "3-7× weekly", icon: "sparkles" },
    { id: "weight", title: "Weight check", detail: "Routine monitoring to catch weight gain early.", cadence: "1-2× monthly", icon: "arrow-up" },
    { id: "parasite", title: "Parasite preventative", detail: "Routine flea, tick, and worm prevention.", cadence: "Monthly", icon: "shield" },
    { id: "vet", title: "Vet checkup", detail: "Wellness exams and vaccinations.", cadence: "Yearly", icon: "stethoscope" },
    { id: "meds", title: "Medication tracking", detail: "Log any medication prescribed by the vet.", cadence: "As prescribed", icon: "pill" },
  ],
  dog: [
    { id: "grooming", title: "Brushing / grooming", detail: "Regular brushing to manage shedding and prevent matting.", cadence: "1-2× weekly", icon: "scissors" },
    { id: "bathing", title: "Bathing", detail: "Occasional baths, or after muddy play.", cadence: "Every 6-8 weeks", icon: "drop" },
    { id: "ears", title: "Ear cleaning", detail: "Clean ears to prevent moisture buildup and infection.", cadence: "Weekly", icon: "bell" },
    { id: "nails", title: "Nail trimming", detail: "Clip nails to maintain proper paw structure.", cadence: "Every 3-4 weeks", icon: "clipper" },
    { id: "dental", title: "Dental care", detail: "Teeth brushing or dental chews to prevent tartar.", cadence: "3-7× weekly", icon: "sparkles" },
    { id: "weight", title: "Weight check", detail: "Routine monitoring to catch weight gain early.", cadence: "1-2× monthly", icon: "arrow-up" },
    { id: "parasite", title: "Parasite preventative", detail: "Routine heartworm, flea, and tick prevention.", cadence: "Monthly", icon: "shield" },
    { id: "vet", title: "Vet checkup", detail: "Wellness exams and vaccinations.", cadence: "Yearly", icon: "stethoscope" },
    { id: "meds", title: "Medication tracking", detail: "Log any medication prescribed by the vet.", cadence: "Daily or as prescribed", icon: "pill" },
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

type GuideGroupKey = "daily" | "weekly" | "vet";

const GUIDE_GROUPS: { key: GuideGroupKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "vet", label: "Vet controlled" },
];

// Every PlanItem title used across CARE_PLANS maps to one of the three cadence groups.
const GUIDE_GROUP_BY_TITLE: Record<string, GuideGroupKey> = {
  "Feeding": "daily",
  "Fresh water": "daily",
  "Litter box maintenance": "daily",
  "Play & mental stimulation": "daily",
  "Potty breaks": "daily",
  "Exercise & play": "daily",
  "Exercise & training": "daily",
  "Walks": "daily",
  "Brushing / grooming": "weekly",
  "Brushing / wrinkle cleaning": "weekly",
  "Ear cleaning": "weekly",
  "Bathing": "weekly",
  "Nail trimming": "weekly",
  "Dental care": "vet",
  "Weight check": "vet",
  "Parasite preventative": "vet",
  "Vet checkup": "vet",
  "Medication tracking": "vet",
};

export default function PlanPage() {
  const router = useRouter();
  const { state, hydrated, editPet, toast } = useStore();
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<CustomTargetKey | null>(null);
  const [editingCadence, setEditingCadence] = useState<string | null>(null);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<GuideGroupKey>>(new Set());

  const toggleItem = (title: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const toggleGroup = (key: GuideGroupKey) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
      <Header title="Care Plan" subtitle={`Vet-Built ${pet.breed}`} bell />

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

      {remindersRow}

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

      {plan ? (
        <>
          {feedingGuide && (
            <>
              <SectionHeader>Weight & feeding guide</SectionHeader>
              <p className="mb-3 px-1 text-[13px] leading-relaxed text-label-2">
                Updates automatically as {pet.name} ages.
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

          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="mt-5 flex w-full items-center justify-between px-1"
          >
            <SectionHeader className="mb-0">Click for full {pet.breed} guide</SectionHeader>
            <Chevron className={guideOpen ? "rotate-90" : ""} />
          </button>
          {guideOpen && (
            <p className="mb-3 px-1 text-[13px] leading-relaxed text-label-2">{plan.intro}</p>
          )}
          {GUIDE_GROUPS.map((group) => {
            const items = plan.items.filter((item) => (GUIDE_GROUP_BY_TITLE[item.title] ?? "vet") === group.key);
            if (items.length === 0) return null;
            const isGroupOpen = openGroups.has(group.key);
            return (
              <div key={group.key} className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between rounded-card bg-card px-4 py-3.5 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] hairline"
                >
                  <span className="text-[15px] font-semibold text-label">{group.label}</span>
                  <Chevron className={isGroupOpen ? "rotate-90" : ""} />
                </button>
                {isGroupOpen && (
                  <Group className="mt-2">
                    {items.map((item) => {
                      const ai = item.action ? ACTION_ICON[item.action] : null;
                      const icon: IconName = ai?.icon ?? GENERIC_ICON[item.emoji] ?? "heart-text";
                      const isOpen = openItems.has(item.title);
                      return (
                        <div key={item.title} className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => toggleItem(item.title)}
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <IconCircle icon={icon} tint={ai?.tint ?? "text-label-2"} bg={ai?.bg ?? "bg-fill"} size={32} iconSize={16} />
                            <p className="flex-1 text-[15px] font-semibold text-label">{item.title}</p>
                            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                              {item.cadence}
                            </span>
                            <Chevron className={isOpen ? "rotate-90" : ""} />
                          </button>
                          {isOpen && (
                            <p className="mt-2 pl-11 text-[13px] leading-relaxed text-label-2">{item.detail}</p>
                          )}
                        </div>
                      );
                    })}
                  </Group>
                )}
              </div>
            );
          })}
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

          <SectionHeader>Grooming, health & vet</SectionHeader>
          <p className="mb-3 px-1 text-[13px] leading-relaxed text-label-2">
            The rest of {pet.name}&apos;s routine. Tap any activity to set how often it should happen.
          </p>
          <Group>
            {OTHER_CARE_FIELDS[pet.species].map((f) => {
              const cadence = pet.customPlan?.cadences?.[f.id] ?? f.cadence;
              return (
                <Row
                  key={f.id}
                  onClick={() => setEditingCadence(f.id)}
                  leading={<IconCircle icon={f.icon} tint="text-accent" bg="bg-accent-soft" />}
                  title={f.title}
                  subtitle={f.detail}
                  trailing={
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                      {cadence}
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

      {!plan &&
        OTHER_CARE_FIELDS[pet.species].map((f) => (
          <EditTextSheet
            key={f.id}
            open={editingCadence === f.id}
            onClose={() => setEditingCadence(null)}
            title={`${f.title} frequency`}
            label="How often"
            placeholder={f.cadence}
            initialValue={pet.customPlan?.cadences?.[f.id] ?? f.cadence}
            onSave={(value) => {
              editPet(pet.id, {
                name: pet.name,
                breed: pet.breed,
                ageYears: pet.ageYears,
                weightKg: pet.weightKg,
                cupGrams: pet.cupGrams,
                customPlan: {
                  ...pet.customPlan,
                  cadences: { ...pet.customPlan?.cadences, [f.id]: value },
                },
              });
              toast("📋", `${f.title} updated`, value);
            }}
          />
        ))}
    </div>
  );
}
