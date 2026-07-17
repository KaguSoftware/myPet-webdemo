"use client";

import { use, useState } from "react";
import Link from "next/link";
import BackBar from "@/components/BackBar";
import Meds from "@/components/Meds";
import PageLoading from "@/components/PageLoading";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import PixelChart from "@/components/pixel/PixelChart";
import EditStatSheet from "@/components/EditStatSheet";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, Chip, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { ACTIONS, CARE_PLANS, formatAge, formatWeight, kgToUnit, unitToKg, weightFeedingEntry, weightTargetRange, weightUnitLabel } from "@/lib/data";
import { timeAgo, useStore } from "@/lib/store";

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, hydrated, restockSupply, addWeight, editPet, toast } = useStore();
  const [scrollTop] = useState(0); // header handled inline here (nested route, simple sticky)
  const [editing, setEditing] = useState<"weight" | "age" | null>(null);

  if (!hydrated) return <PageLoading title="Pet" compact />;

  const pet = state.pets.find((p) => p.id === id);
  if (!pet) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-[15px] font-semibold text-label">Pet not found</p>
        <Link href="/" className="mt-3 text-[14px] font-semibold text-accent">Back home</Link>
      </div>
    );
  }

  const plan = CARE_PLANS[pet.breed];
  const target = weightTargetRange(pet);
  const feedingGuide = weightFeedingEntry(pet);
  const recent = state.activities
    .filter((a) => a.petId === pet.id)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);
  void scrollTop;

  return (
    <div className="px-4 pt-3">
      <BackBar title={pet.name} />

      {/* Hero */}
      <div className="flex flex-col items-center rounded-sheet bg-card px-5 py-6 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)]">
        <PetAvatar pet={pet} size="xl" idle />
        <h1 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-label">{pet.name}</h1>
        <p className="text-[14px] font-medium text-label-2">{pet.breed}</p>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          <button onClick={() => setEditing("age")}>
            <Chip>{formatAge(pet.ageYears)}</Chip>
          </button>
          <button onClick={() => setEditing("weight")}>
            <Chip>{formatWeight(pet.weightKg, state.units)}</Chip>
          </button>
          <Chip>{pet.owned.length} items</Chip>
        </div>
        <Link href="/pets" className="mt-4 w-full max-w-55">
          <AccentButton variant="tinted" size="sm">
            <Icon name="sparkles" size={16} /> Dress up
          </AccentButton>
        </Link>
      </div>

      {/* Weight */}
      <SectionHeader>Weight</SectionHeader>
      <div className="rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
        <PixelChart points={pet.weights} target={target} units={state.units} onAddWeight={() => setEditing("weight")} />
        {feedingGuide && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-fill pt-3 text-center">
            <div>
              <p className="text-[11px] font-medium text-label-2">Ideal weight</p>
              <p className="text-[13px] font-semibold text-label">
                {formatWeight(feedingGuide.weightKgRange[0], state.units)}–{formatWeight(feedingGuide.weightKgRange[1], state.units)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-label-2">Calories/day</p>
              <p className="text-[13px] font-semibold text-label">{feedingGuide.calorieRange[0]}–{feedingGuide.calorieRange[1]} kcal</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-label-2">Dry kibble</p>
              <p className="text-[13px] font-semibold text-label">~{feedingGuide.kibbleGramsRange[0]}–{feedingGuide.kibbleGramsRange[1]} g</p>
            </div>
          </div>
        )}
      </div>

      {/* Supplies */}
      <SectionHeader>Supplies</SectionHeader>
      <Group>
        {pet.supplies.map((s) => {
          const low = s.level < 20;
          return (
            <Row
              key={s.id}
              leading={<IconCircle icon={s.icon as never} tint={low ? "text-red" : "text-label-2"} bg={low ? "bg-[oklch(0.6_0.21_25/0.1)]" : "bg-fill"} />}
              title={s.name}
              subtitle={
                <span className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-fill align-middle">
                    <span
                      className={`block h-full rounded-full ${low ? "bg-red" : "bg-green"}`}
                      style={{ width: `${s.level}%` }}
                    />
                  </span>
                  <span className={low ? "font-semibold text-red" : ""}>{s.level}%{low ? " · low" : ""}</span>
                </span>
              }
              trailing={
                s.level < 100 ? (
                  <button
                    onClick={() => {
                      restockSupply(pet.id, s.id);
                      toast("box", `${s.name} restocked`, "Back to 100%");
                    }}
                    className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent transition-transform active:scale-95"
                  >
                    <Icon name="refresh" size={12} /> Restock
                  </button>
                ) : (
                  <span className="text-[12px] font-semibold text-green">Full</span>
                )
              }
            />
          );
        })}
      </Group>

      {/* Medications */}
      <Meds pet={pet} />

      {/* Plan summary */}
      {state.premium && plan && (
        <>
          <SectionHeader trailing={<Link href="/plan" className="text-[13px] font-semibold text-accent">Full plan</Link>}>
            Care plan
          </SectionHeader>
          <Group>
            {plan.items.slice(0, 4).map((item) => {
              const ai = item.action ? ACTION_ICON[item.action] : null;
              return (
                <Row
                  key={item.title}
                  leading={<IconCircle icon={(ai?.icon ?? "heart-text") as never} tint={ai?.tint ?? "text-label-2"} bg={ai?.bg ?? "bg-fill"} />}
                  title={item.title}
                  subtitle={item.cadence}
                />
              );
            })}
          </Group>
        </>
      )}

      {/* Recent activity */}
      <SectionHeader trailing={<Link href="/activity" className="text-[13px] font-semibold text-accent">All</Link>}>
        Recent activity
      </SectionHeader>
      <Group>
        {recent.map((a) => {
          const m = state.members.find((mm) => mm.id === a.memberId);
          const ai = ACTION_ICON[a.type];
          return (
            <Row
              key={a.id}
              leading={m ? <InitialAvatar name={m.name} gradient={m.gradient} size={34} /> : undefined}
              title={
                <>
                  <span className="font-semibold">{m?.id === state.currentMemberId ? "You" : m?.name}</span>{" "}
                  <span className="font-normal text-label-2">{ACTIONS[a.type].verb.replace(pet.name, "").trim()}</span>
                </>
              }
              subtitle={timeAgo(a.ts)}
              trailing={
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ai.bg} ${ai.tint}`}>
                  <Icon name={ai.icon} size={16} />
                </span>
              }
            />
          );
        })}
      </Group>
      <div className="h-4" />

      <EditStatSheet
        open={editing === "weight"}
        onClose={() => setEditing(null)}
        title={`${pet.name}'s weight`}
        label={`Weight (${weightUnitLabel(state.units)})`}
        initialValue={kgToUnit(pet.weightKg, state.units)}
        onSave={(v) => {
          const kg = unitToKg(v, state.units);
          addWeight(pet.id, kg);
          toast("scale", `${pet.name}'s weight updated`, formatWeight(kg, state.units));
        }}
      />
      <EditStatSheet
        open={editing === "age"}
        onClose={() => setEditing(null)}
        title={`${pet.name}'s age`}
        label="Age (years)"
        initialValue={pet.ageYears}
        onSave={(ageYears) => {
          editPet(pet.id, { name: pet.name, breed: pet.breed, ageYears, weightKg: pet.weightKg, cupGrams: pet.cupGrams });
          toast("calendar", `${pet.name}'s age updated`, formatAge(ageYears));
        }}
      />
    </div>
  );
}
