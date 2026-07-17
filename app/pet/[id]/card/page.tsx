"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BackBar from "@/components/BackBar";
import PageLoading from "@/components/PageLoading";
import PetAvatar from "@/components/PetAvatar";
import { Icon } from "@/components/Icons";
import { AccentButton } from "@/components/ui";
import { VET, VETS, formatAge, formatWeight, isAdminRole, nextAnniversary, nextBirthday } from "@/lib/data";
import { useStore } from "@/lib/store";

const DATE_FMT: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

function CardContent({ petId }: { petId: string }) {
  const { state, hydrated, toast } = useStore();
  const params = useSearchParams();
  const variant = params.get("variant") === "profile" ? "profile" : "emergency";

  if (!hydrated) return <PageLoading title="Pet card" compact />;

  const pet = state.pets.find((p) => p.id === petId);
  if (!pet) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-[15px] font-semibold text-label">Pet not found</p>
        <Link href="/" className="mt-3 text-[14px] font-semibold text-accent">Back home</Link>
      </div>
    );
  }

  const contact = state.members.find((m) => isAdminRole(m.role)) ?? state.members[0];
  const vet = VETS.find((v) => state.bookedVetIds.includes(v.id)) ?? VET;
  const sexLabel = pet.sex === "male" ? "Male" : pet.sex === "female" ? "Female" : null;
  const speciesLabel = pet.species === "cat" ? "Cat" : "Dog";

  const shareText = [
    variant === "profile" ? `Meet ${pet.name}!` : `${pet.name} — pet info card`,
    `${speciesLabel} · ${pet.breed}${sexLabel ? ` · ${sexLabel}` : ""}`,
    pet.birthDate != null
      ? `Born ${new Date(pet.birthDate).toLocaleDateString([], DATE_FMT)} (${formatAge(pet.ageYears)})`
      : `Age ${formatAge(pet.ageYears)}`,
    `Weight ${formatWeight(pet.weightKg, state.units)}`,
    pet.microchip ? `Microchip: ${pet.microchip}` : null,
    pet.allergies ? `Allergies/alerts: ${pet.allergies}` : null,
    pet.meds.length > 0 ? `Medication: ${pet.meds.map((m) => [m.name, m.dosage].filter(Boolean).join(" ")).join(", ")}` : null,
    contact ? `Family contact: ${contact.name}` : null,
    `Vet: ${vet.name}, ${vet.clinic}`,
    "— shared from PetPal",
  ]
    .filter(Boolean)
    .join("\n");

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${pet.name} — PetPal card`, text: shareText });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(shareText);
    toast("share", "Card copied as text", "Paste it anywhere — chat, email, a flyer");
  };

  const infoRow = (label: string, value: string, mono = false) => (
    <div className="flex items-baseline justify-between gap-3 border-t border-fill py-2.5 first:border-t-0">
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wider text-label-3">{label}</span>
      <span className={`min-w-0 text-right text-[14px] font-semibold text-label ${mono ? "font-mono text-[13px]" : ""}`}>{value}</span>
    </div>
  );

  return (
    <div className="px-4">
      <div className="print:hidden">
        <BackBar
          title="Pet card"
          trailing={
            <button
              onClick={share}
              aria-label="Share card"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform active:scale-90"
            >
              <Icon name="share" size={16} />
            </button>
          }
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-sheet bg-card shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)] print:shadow-none">
        <div
          className="flex flex-col items-center px-5 pb-5 pt-7"
          style={{ background: `linear-gradient(160deg, ${pet.gradient[0]}22, ${pet.gradient[1]}11)` }}
        >
          <PetAvatar pet={pet} size="xl" />
          <h1 className="mt-3 text-[26px] font-bold tracking-[-0.02em] text-label">{pet.name}</h1>
          <p className="text-[14px] font-medium text-label-2">
            {speciesLabel} · {pet.breed}
            {sexLabel ? ` · ${sexLabel}` : ""}
          </p>
          {variant === "emergency" && (
            <p className="mt-2 rounded-full bg-[oklch(0.6_0.21_25/0.08)] px-3 py-1 text-[12px] font-semibold text-red">
              Emergency &amp; ID card
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          {variant === "emergency" ? (
            <>
              {infoRow(
                "Born",
                pet.birthDate != null
                  ? `${new Date(pet.birthDate).toLocaleDateString([], DATE_FMT)} (${formatAge(pet.ageYears)})`
                  : formatAge(pet.ageYears)
              )}
              {infoRow("Weight", formatWeight(pet.weightKg, state.units))}
              {pet.microchip && infoRow("Microchip", pet.microchip, true)}
              {pet.allergies && (
                <div className="mt-2 flex items-start gap-2.5 rounded-card bg-[oklch(0.6_0.21_25/0.07)] px-3.5 py-3">
                  <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-red" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-red">Allergies &amp; alerts</p>
                    <p className="text-[14px] font-semibold leading-snug text-label">{pet.allergies}</p>
                  </div>
                </div>
              )}
              {pet.meds.length > 0 &&
                infoRow("Medication", pet.meds.map((m) => [m.name, m.dosage].filter(Boolean).join(" ")).join(", "))}
              {contact && infoRow("Family contact", contact.name)}
              {infoRow("Vet", `${vet.name} · ${vet.clinic}`)}
            </>
          ) : (
            <>
              {pet.birthDate != null
                ? infoRow("Next birthday", `Turns ${nextBirthday(pet.birthDate).turns} on ${new Date(nextBirthday(pet.birthDate).date).toLocaleDateString([], DATE_FMT)}`)
                : infoRow("Age", formatAge(pet.ageYears))}
              {infoRow("Gotcha day", new Date(nextAnniversary(pet.createdAt)).toLocaleDateString([], DATE_FMT))}
              {infoRow("In the family since", new Date(pet.createdAt).toLocaleDateString([], DATE_FMT))}
              {infoRow("Favorite things", `${pet.owned.length} accessories collected`)}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 print:hidden">
        <AccentButton onClick={share}>
          <Icon name="share" size={17} /> Share
        </AccentButton>
        <AccentButton variant="tinted" onClick={() => window.print()}>
          Print / Save as PDF
        </AccentButton>
        <Link href={variant === "emergency" ? `/pet/${pet.id}/card?variant=profile` : `/pet/${pet.id}/card`} className="block">
          <AccentButton variant="gray">{variant === "emergency" ? "Show profile card" : "Show emergency card"}</AccentButton>
        </Link>
        <p className="px-2 text-center text-[12px] leading-relaxed text-label-3">
          The emergency card is what you&apos;d hand a sitter or post if {pet.name} ever went missing — keep the microchip and
          allergy info up to date in Settings ▸ Family.
        </p>
      </div>
      <div className="h-4" />
    </div>
  );
}

export default function PetCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<PageLoading title="Pet card" compact />}>
      <CardContent petId={id} />
    </Suspense>
  );
}
