"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { Pet } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Meds({ pet }: { pet: Pet }) {
  const { addMed, deleteMed, toast } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");

  const reset = () => {
    setName("");
    setDosage("");
    setFrequency("");
  };

  return (
    <>
      <SectionHeader
        trailing={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 text-[13px] font-semibold text-accent"
          >
            <Icon name="plus" size={14} />
            Add med
          </button>
        }
      >
        Meds
      </SectionHeader>

      {pet.meds.length > 0 ? (
        <Group>
          {pet.meds.map((m) => (
            <Row
              key={m.id}
              leading={<IconCircle icon="pill" tint="text-red" bg="bg-[oklch(0.6_0.21_25/0.1)]" />}
              title={m.name}
              subtitle={[m.dosage, m.frequency].filter(Boolean).join(" · ") || undefined}
              trailing={
                <button
                  onClick={() => deleteMed(pet.id, m.id)}
                  aria-label={`Delete ${m.name}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-3 transition-colors active:bg-fill active:text-red"
                >
                  <Icon name="xmark" size={15} />
                </button>
              }
            />
          ))}
        </Group>
      ) : (
        <Group>
          <div className="flex flex-col items-center px-6 py-9 text-center">
            <IconCircle icon="pill" tint="text-label-2" bg="bg-fill" size={48} iconSize={22} />
            <p className="mt-3 text-[15px] font-semibold text-label">No meds yet</p>
            <p className="mt-0.5 text-[13px] text-label-2">Add {pet.name}&apos;s medications to keep track.</p>
          </div>
        </Group>
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">New med</h2>
        <p className="mt-0.5 text-[13px] text-label-2">For {pet.name}</p>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Flea treatment"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Dosage</p>
        <input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 1 pipette (optional)"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Frequency</p>
        <input
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          placeholder="e.g. Monthly (optional)"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!name.trim()}
            onClick={() => {
              addMed(pet.id, name.trim(), dosage.trim() || undefined, frequency.trim() || undefined);
              setAddOpen(false);
              reset();
              toast("💊", `${name.trim()} added`, `${pet.name}'s meds list`);
            }}
          >
            Add med
          </AccentButton>
        </div>
      </Sheet>
    </>
  );
}
