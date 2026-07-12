"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Chip, Group, IconCircle, Row } from "@/components/ui";
import { VETS, Vet } from "@/lib/data";
import { useStore } from "@/lib/store";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-orange">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={11} className={i < Math.round(rating) ? "text-orange" : "text-label-3 opacity-40"} />
      ))}
    </span>
  );
}

export default function VetsPage() {
  const router = useRouter();
  const { state, bookVetById, toast } = useStore();
  const [selected, setSelected] = useState<Vet | null>(null);

  const cat = state.pets.find((p) => p.breed === "British Shorthair") ?? state.pets[0];

  return (
    <div className="px-4">
      <Header title="Find a Vet" subtitle="Trusted clinics near you" />

      <div className="glass sticky top-0 z-10 -mx-4 mb-3 flex items-center gap-2 px-4 py-2.5">
        <button onClick={() => router.back()} aria-label="Back" className="flex items-center text-accent">
          <Icon name="chevron-left" size={18} />
          <span className="text-[16px] font-semibold">Back</span>
        </button>
      </div>

      <div className="space-y-3 pb-4">
        {VETS.map((v) => {
          const booked = state.bookedVetIds.includes(v.id);
          return (
            <div
              key={v.id}
              className={`rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05)] ${v.sponsored ? "ring-1 ring-accent/20" : ""}`}
            >
              {v.sponsored && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  <Icon name="sparkles" size={10} /> Sponsored
                </span>
              )}
              <div className="flex items-start gap-3">
                <InitialAvatar name={v.name.replace("Dr. ", "")} gradient={v.gradient} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-label">{v.name}</p>
                  <p className="text-[13px] font-medium text-label-2">{v.clinic}</p>
                  <div className="mt-1 flex items-center gap-2 text-[12px] font-medium text-label-2">
                    <Stars rating={v.rating} /> {v.rating}
                    <span className="flex items-center gap-0.5">
                      <Icon name="pin" size={11} className="text-label-3" /> {v.distanceKm} km
                    </span>
                    <span className={v.openNow ? "text-green" : "text-label-3"}>{v.openNow ? "Open" : "Closed"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {v.specialties.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
              <button
                onClick={() => setSelected(v)}
                disabled={booked}
                className="mt-3 flex h-[42px] w-full items-center justify-center gap-2 rounded-ios bg-accent text-[15px] font-semibold text-white shadow-[0_4px_14px_oklch(0.55_0.19_258/0.3)] transition-transform active:scale-[0.97] disabled:bg-green-soft disabled:text-green disabled:shadow-none"
              >
                {booked ? (
                  <>
                    <Icon name="check" size={15} /> Requested
                  </>
                ) : (
                  <>
                    <Icon name="calendar" size={15} /> Book appointment
                  </>
                )}
              </button>
            </div>
          );
        })}
        <p className="px-1 pt-1 text-center text-[11px] text-label-3">
          Sponsored clinics pay to appear here — that&apos;s how PetPal stays free.
        </p>
      </div>

      <Sheet open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="flex items-center gap-4 pt-1">
              <InitialAvatar name={selected.name.replace("Dr. ", "")} gradient={selected.gradient} size={56} />
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{selected.name}</h2>
                <p className="text-[13px] font-medium text-label-2">{selected.clinic}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-label-2">
                  <Stars rating={selected.rating} /> {selected.rating} · {selected.distanceKm} km
                </p>
              </div>
            </div>
            <Group className="mt-5">
              <Row leading={<IconCircle icon="cross" tint="text-accent" bg="bg-accent-soft" />} title={`Checkup — ${cat?.name}`} subtitle="General wellness visit" />
              <Row leading={<IconCircle icon="calendar" tint="text-accent" bg="bg-accent-soft" />} title="Next Tuesday, 10:30" subtitle="Suggested time · can be changed" />
            </Group>
            <div className="mt-6">
              <AccentButton
                onClick={() => {
                  bookVetById(selected.id);
                  toast("📅", "Appointment requested", `${selected.name} will confirm shortly`);
                  setSelected(null);
                }}
              >
                Request appointment
              </AccentButton>
              <p className="mt-2.5 text-center text-[12px] text-label-3">Demo — no real booking is made.</p>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
