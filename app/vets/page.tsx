"use client";

import { useState } from "react";
import BackBar from "@/components/BackBar";
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
  const { state, bookVetById, unbookVetById, toast } = useStore();
  const [selected, setSelected] = useState<Vet | null>(null);

  const cat = state.pets.find((p) => p.breed === "British Shorthair") ?? state.pets[0];

  return (
    <div className="px-4">
      <BackBar title="Find a Vet" />

      <div className="space-y-3 pb-4">
        {VETS.map((v) => {
          const booked = state.bookedVetIds.includes(v.id);
          return (
            <div
              key={v.id}
              className={`flex items-center gap-3 rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05)] ${v.sponsored ? "ring-1 ring-accent/20" : ""}`}
            >
              <InitialAvatar name={v.name.replace("Dr. ", "")} gradient={v.gradient} size={46} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[16px] font-bold text-label">
                  <span className="truncate">{v.name}</span>
                  {v.sponsored && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                      Ad
                    </span>
                  )}
                </p>
                <p className="truncate text-[13px] font-medium text-label-2">{v.clinic}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-label-2">
                  <Icon name="star" size={11} className="text-orange" /> {v.rating} · {v.distanceKm} km ·{" "}
                  <span className={v.openNow ? "text-green" : "text-label-3"}>{v.openNow ? "Open" : "Closed"}</span>
                </p>
              </div>
              {booked ? (
                <button
                  onClick={() => {
                    unbookVetById(v.id);
                    toast("↩️", "Request cancelled", `Cancelled your visit with ${v.name}`);
                  }}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-green-soft px-3.5 text-[13px] font-semibold text-green transition-transform active:scale-95"
                >
                  <Icon name="check" size={14} /> Requested
                </button>
              ) : (
                <button
                  onClick={() => setSelected(v)}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-white shadow-[0_3px_10px_oklch(0.55_0.19_258/0.3)] transition-transform active:scale-95"
                >
                  Book
                </button>
              )}
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
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.specialties.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
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
