"use client";

import { use, useState } from "react";
import Link from "next/link";
import BackBar from "@/components/BackBar";
import Meds from "@/components/Meds";
import PageLoading from "@/components/PageLoading";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import PixelChart from "@/components/pixel/PixelChart";
import EditStatSheet from "@/components/EditStatSheet";
import Sheet from "@/components/Sheet";
import { ACTION_ICON, Icon } from "@/components/Icons";
import { AccentButton, Chip, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { ACTIONS, CARE_PLANS, formatAge, formatWeight, kgToUnit, nextAnniversary, nextBirthday, unitToKg, weightFeedingEntry, weightTargetRange, weightUnitLabel } from "@/lib/data";
import { timeAgo, useStore } from "@/lib/store";

const DATE_FMT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

// Module-level so the render-purity lint doesn't flag a direct Date.now() call
// in JSX (same pattern as dueLabel/timeAgo in the store).
function isPast(ts: number) {
  return ts < Date.now();
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, hydrated, restockSupply, addWeight, deleteWeight, editPet, addVaccination, deleteVaccination, addVetVisit, deleteVetVisit, toast } = useStore();
  const [scrollTop] = useState(0); // header handled inline here (nested route, simple sticky)
  const [editing, setEditing] = useState<"weight" | "age" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [bfWeight, setBfWeight] = useState("");
  const [bfDate, setBfDate] = useState("");
  const [vaccOpen, setVaccOpen] = useState(false);
  const [vaccName, setVaccName] = useState("");
  const [vaccGiven, setVaccGiven] = useState("");
  const [vaccNext, setVaccNext] = useState("");
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitVet, setVisitVet] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [birthdayStr, setBirthdayStr] = useState("");

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
          <button
            onClick={() => {
              // With a birth date on file, age is derived — edit the date instead.
              if (pet.birthDate != null) {
                setBirthdayStr(new Date(pet.birthDate).toISOString().slice(0, 10));
                setBirthdayOpen(true);
              } else setEditing("age");
            }}
            aria-label="Edit age"
            className="transition-transform active:scale-95"
          >
            <Chip>
              {formatAge(pet.ageYears)}
              <Icon name="chevron-right" size={9} className="text-label-3" />
            </Chip>
          </button>
          <button onClick={() => setEditing("weight")} aria-label="Edit weight" className="transition-transform active:scale-95">
            <Chip>
              {formatWeight(pet.weightKg, state.units)}
              <Icon name="chevron-right" size={9} className="text-label-3" />
            </Chip>
          </button>
          {pet.sex && <Chip>{pet.sex === "male" ? "Male" : "Female"}</Chip>}
          <Chip>{pet.owned.length} items</Chip>
        </div>
        <div className="mt-4 flex w-full max-w-80 gap-2">
          <Link href="/pets" className="min-w-0 flex-1">
            <AccentButton variant="tinted" size="sm">
              <Icon name="sparkles" size={16} /> Dress up
            </AccentButton>
          </Link>
          <Link href={`/pet/${pet.id}/card`} className="min-w-0 flex-1">
            <AccentButton variant="tinted" size="sm">
              <Icon name="shield" size={16} /> Pet card
            </AccentButton>
          </Link>
        </div>
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
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-between border-t border-fill pt-3"
        >
          <span className="text-[13px] font-semibold text-label-2">History · {pet.weights.length} entries</span>
          <Icon name="chevron-right" size={13} className={`text-label-3 transition-transform ${historyOpen ? "rotate-90" : ""}`} />
        </button>
        {historyOpen && (
          <div className="mt-1">
            {[...pet.weights]
              .sort((a, b) => b.ts - a.ts)
              .slice(0, 10)
              .map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-label-2">
                    {new Date(w.ts).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span className="text-[13px] font-semibold text-label">{formatWeight(w.kg, state.units)}</span>
                    <button
                      onClick={() => deleteWeight(pet.id, w.id)}
                      aria-label={`Delete weight entry from ${new Date(w.ts).toLocaleDateString()}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-label-3 transition-colors active:bg-fill active:text-red"
                    >
                      <Icon name="xmark" size={13} />
                    </button>
                  </span>
                </div>
              ))}
            <button
              type="button"
              onClick={() => {
                setBfWeight("");
                setBfDate("");
                setBackfillOpen(true);
              }}
              className="mt-1 flex items-center gap-1.5 py-1 text-[13px] font-semibold text-accent"
            >
              <Icon name="plus" size={13} /> Add for a past date
            </button>
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

      {/* Vaccinations */}
      <SectionHeader
        trailing={
          <button
            onClick={() => {
              setVaccName("");
              setVaccGiven("");
              setVaccNext("");
              setVaccOpen(true);
            }}
            className="text-[13px] font-semibold text-accent"
          >
            Add
          </button>
        }
      >
        Vaccinations
      </SectionHeader>
      <Group>
        {pet.vaccinations.length === 0 ? (
          <Row
            leading={<IconCircle icon="syringe" tint="text-label-2" bg="bg-fill" />}
            title={<span className="text-label-2">No vaccinations on file</span>}
            subtitle="Add records to get reminded before boosters are due"
          />
        ) : (
          pet.vaccinations.map((v) => {
            const overdue = v.nextDue != null && isPast(v.nextDue);
            return (
              <Row
                key={v.id}
                leading={<IconCircle icon="syringe" tint={overdue ? "text-red" : "text-accent"} bg={overdue ? "bg-[oklch(0.6_0.21_25/0.1)]" : "bg-accent-soft"} />}
                title={v.name}
                subtitle={
                  <span className={overdue ? "font-semibold text-red" : undefined}>
                    Given {new Date(v.dateGiven).toLocaleDateString([], DATE_FMT)}
                    {v.nextDue != null &&
                      ` · ${overdue ? "was due" : "next"} ${new Date(v.nextDue).toLocaleDateString([], DATE_FMT)}`}
                  </span>
                }
                trailing={
                  <button
                    onClick={() => deleteVaccination(pet.id, v.id)}
                    aria-label={`Delete ${v.name}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-3 transition-colors active:bg-fill active:text-red"
                  >
                    <Icon name="xmark" size={15} />
                  </button>
                }
              />
            );
          })
        )}
      </Group>

      {/* Vet visits */}
      <SectionHeader
        trailing={
          <button
            onClick={() => {
              setVisitDate("");
              setVisitVet("");
              setVisitReason("");
              setVisitOpen(true);
            }}
            className="text-[13px] font-semibold text-accent"
          >
            Log visit
          </button>
        }
      >
        Vet visits
      </SectionHeader>
      <Group>
        {pet.vetVisits.length === 0 ? (
          <Row
            leading={<IconCircle icon="stethoscope" tint="text-label-2" bg="bg-fill" />}
            title={<span className="text-label-2">No visits on record</span>}
            subtitle="Logged visits build the health history vets ask about"
          />
        ) : (
          pet.vetVisits.slice(0, 5).map((v) => (
            <Row
              key={v.id}
              leading={<IconCircle icon="stethoscope" tint="text-[oklch(0.55_0.14_200)]" bg="bg-[oklch(0.55_0.14_200/0.1)]" />}
              title={v.reason || "Vet visit"}
              subtitle={`${v.vetName ? `${v.vetName} · ` : ""}${new Date(v.ts).toLocaleDateString([], DATE_FMT)}`}
              trailing={
                <button
                  onClick={() => deleteVetVisit(pet.id, v.id)}
                  aria-label="Delete vet visit"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-3 transition-colors active:bg-fill active:text-red"
                >
                  <Icon name="xmark" size={15} />
                </button>
              }
            />
          ))
        )}
      </Group>

      {/* Milestones */}
      <SectionHeader>Milestones</SectionHeader>
      <Group>
        {pet.birthDate != null ? (
          <Row
            leading={<IconCircle icon="gift" tint="text-orange" bg="bg-orange-soft" />}
            title={`Turns ${nextBirthday(pet.birthDate).turns} on ${new Date(nextBirthday(pet.birthDate).date).toLocaleDateString([], DATE_FMT)}`}
            subtitle={`Born ${new Date(pet.birthDate).toLocaleDateString([], DATE_FMT)}`}
          />
        ) : (
          <Row
            onClick={() => {
              setBirthdayStr("");
              setBirthdayOpen(true);
            }}
            leading={<IconCircle icon="gift" tint="text-label-2" bg="bg-fill" />}
            title="Add a birth date"
            subtitle="Unlocks birthday milestones and age-accurate feeding guides"
            trailing={<Icon name="chevron-right" size={15} className="text-label-3" />}
          />
        )}
        <Row
          leading={<IconCircle icon="heart-text" tint="text-accent" bg="bg-accent-soft" />}
          title={`Gotcha day — ${new Date(nextAnniversary(pet.createdAt)).toLocaleDateString([], DATE_FMT)}`}
          subtitle={`In the family since ${new Date(pet.createdAt).toLocaleDateString([], DATE_FMT)}`}
        />
      </Group>

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
      <Sheet open={vaccOpen} onClose={() => setVaccOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Add vaccination</h2>
        <p className="mt-0.5 text-[13px] text-label-2">For {pet.name} — from the vaccine booklet or vet record</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Vaccine</p>
        <input
          value={vaccName}
          onChange={(e) => setVaccName(e.target.value)}
          placeholder="e.g. Rabies, FVRCP, DHPP…"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Date given</p>
        <input
          type="date"
          value={vaccGiven}
          onChange={(e) => setVaccGiven(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Next due (optional)</p>
        <input
          type="date"
          value={vaccNext}
          onChange={(e) => setVaccNext(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />
        <p className="mt-1.5 px-1 text-[12px] text-label-3">With a next-due date, a reminder is created for the family automatically.</p>

        <div className="mt-7">
          <AccentButton
            disabled={!vaccName.trim() || !vaccGiven}
            onClick={() => {
              const dateGiven = new Date(`${vaccGiven}T12:00:00`).getTime();
              const nextDue = vaccNext ? new Date(`${vaccNext}T12:00:00`).getTime() : undefined;
              addVaccination(pet.id, { name: vaccName.trim(), dateGiven, nextDue });
              setVaccOpen(false);
              toast("syringe", "Vaccination saved", nextDue != null ? "We'll remind you before it's due again" : vaccName.trim());
            }}
          >
            Save vaccination
          </AccentButton>
        </div>
      </Sheet>

      <Sheet open={visitOpen} onClose={() => setVisitOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Log a vet visit</h2>
        <p className="mt-0.5 text-[13px] text-label-2">Builds {pet.name}&apos;s health history</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Date</p>
        <input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Reason (optional)</p>
        <input
          value={visitReason}
          onChange={(e) => setVisitReason(e.target.value)}
          placeholder="e.g. Annual checkup, limping, dental…"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Vet or clinic (optional)</p>
        <input
          value={visitVet}
          onChange={(e) => setVisitVet(e.target.value)}
          placeholder="e.g. Dr. Weber, Happy Paws Clinic"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!visitDate}
            onClick={() => {
              const ts = new Date(`${visitDate}T12:00:00`).getTime();
              if (ts > Date.now()) {
                toast("alert", "That date is in the future", "Pick today or an earlier date");
                return;
              }
              addVetVisit(pet.id, { ts, vetName: visitVet.trim() || undefined, reason: visitReason.trim() || undefined });
              setVisitOpen(false);
              toast("stethoscope", "Vet visit logged", visitReason.trim() || new Date(ts).toLocaleDateString([], DATE_FMT));
            }}
          >
            Save visit
          </AccentButton>
        </div>
      </Sheet>

      <Sheet open={birthdayOpen} onClose={() => setBirthdayOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{pet.name}&apos;s birth date</h2>
        <p className="mt-0.5 text-[13px] text-label-2">Age updates automatically from now on</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Born</p>
        <input
          type="date"
          value={birthdayStr}
          onChange={(e) => setBirthdayStr(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!birthdayStr}
            onClick={() => {
              const birthDate = new Date(`${birthdayStr}T12:00:00`).getTime();
              if (birthDate > Date.now()) {
                toast("alert", "That date is in the future", "Pick the actual birth date");
                return;
              }
              editPet(pet.id, {
                name: pet.name,
                breed: pet.breed,
                ageYears: pet.ageYears,
                weightKg: pet.weightKg,
                cupGrams: pet.cupGrams,
                birthDate,
              });
              setBirthdayOpen(false);
              toast("gift", "Birth date saved", `Born ${new Date(birthDate).toLocaleDateString([], DATE_FMT)}`);
            }}
          >
            Save
          </AccentButton>
        </div>
      </Sheet>

      <Sheet open={backfillOpen} onClose={() => setBackfillOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Past weight entry</h2>
        <p className="mt-0.5 text-[13px] text-label-2">For {pet.name} — from an old vet note or memory</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">
          Weight ({weightUnitLabel(state.units)})
        </p>
        <input
          type="number"
          inputMode="decimal"
          value={bfWeight}
          onChange={(e) => setBfWeight(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Date</p>
        <input
          type="date"
          value={bfDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setBfDate(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!bfDate || bfWeight.trim() === "" || !Number.isFinite(Number(bfWeight)) || Number(bfWeight) <= 0}
            onClick={() => {
              const kg = unitToKg(Number(bfWeight), state.units);
              const ts = new Date(`${bfDate}T12:00:00`).getTime();
              if (ts > Date.now()) {
                toast("alert", "That date is in the future", "Pick today or an earlier date");
                return;
              }
              addWeight(pet.id, kg, ts);
              setBackfillOpen(false);
              toast("scale", "Weight entry added", `${formatWeight(kg, state.units)} · ${new Date(ts).toLocaleDateString()}`);
            }}
          >
            Add entry
          </AccentButton>
        </div>
      </Sheet>

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
