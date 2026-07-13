"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Paywall from "@/components/Paywall";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Group, Row, SectionHeader } from "@/components/ui";
import { formatAge, formatWeight } from "@/lib/data";
import { level, useStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const { state, switchMember, setPremium, addPet, resetDemo, toast } = useStore();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog">("cat");
  const [breed, setBreed] = useState("British Shorthair");

  return (
    <div className="px-4">
      <Header
        title="Family"
        subtitle="The Mansouri household"
        trailing={
          <Link
            href="/settings"
            aria-label="Settings"
            className="glass-strong flex h-9 w-9 items-center justify-center rounded-full text-label-2 transition-transform active:scale-90"
          >
            <Icon name="gear" size={18} />
          </Link>
        }
      />

      {/* Plus banner */}
      {state.premium ? (
        <Group>
          <Row
            leading={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[oklch(0.62_0.19_258)] to-[oklch(0.48_0.19_262)] text-white">
                <Icon name="sparkles" size={18} />
              </span>
            }
            title="PetPal+ is active"
            subtitle="Care plans, smart reminders & vet booking"
            trailing={
              <button
                onClick={() => {
                  setPremium(false);
                  toast("👋", "PetPal+ deactivated", "You can re-enable it anytime");
                }}
                className="rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-label transition-transform active:scale-95"
              >
                Turn off
              </button>
            }
          />
        </Group>
      ) : (
        <button
          onClick={() => setPaywallOpen(true)}
          className="w-full rounded-card bg-gradient-to-br from-[oklch(0.6_0.19_258)] to-[oklch(0.45_0.19_268)] p-4 text-left shadow-[0_8px_24px_oklch(0.55_0.19_258/0.3)] transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)]">
              <Icon name="sparkles" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-white">Upgrade to PetPal+</span>
              <span className="block text-[13px] font-medium text-white/80">
                Vet-built plans · smart reminders · booking
              </span>
            </span>
            <Icon name="chevron-right" size={16} strokeWidth={2.4} className="text-white/70" />
          </div>
        </button>
      )}

      {/* Members */}
      <SectionHeader>Members</SectionHeader>
      <Group>
        {state.members.map((m) => {
          const active = m.id === state.currentMemberId;
          return (
            <Row
              key={m.id}
              onClick={() => {
                if (!active) {
                  switchMember(m.id);
                  toast("👤", `Viewing as ${m.name}`, "Actions will be logged as them");
                }
              }}
              leading={<InitialAvatar name={m.name} gradient={m.gradient} size={38} />}
              title={m.name}
              subtitle={m.role}
              trailing={
                active ? (
                  <Icon name="check" size={18} strokeWidth={2.4} className="text-accent" />
                ) : (
                  <span className="text-[13px] font-medium text-label-3">Switch</span>
                )
              }
            />
          );
        })}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">Tap a member to view the demo as them.</p>

      {/* Pets */}
      <SectionHeader
        trailing={
          <button onClick={() => setAddPetOpen(true)} className="text-[13px] font-semibold text-accent">
            Add pet
          </button>
        }
      >
        Pets
      </SectionHeader>
      <Group>
        {state.pets.map((p) => (
          <Row
            key={p.id}
            onClick={() => router.push(`/pet/${p.id}`)}
            leading={<PetAvatar pet={p} size="sm" />}
            title={p.name}
            subtitle={`${p.breed} · ${formatAge(p.ageYears)} · ${formatWeight(p.weightKg, state.units)}`}
            trailing={<Icon name="chevron-right" size={15} className="text-label-3" />}
          />
        ))}
      </Group>

      {/* About + reset */}
      <SectionHeader>Demo</SectionHeader>
      <Group>
        <Row
          leading={
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
              <Icon name="star" size={18} />
            </span>
          }
          title={`Level ${level(state.xp)} · ${state.streak}-day streak`}
          subtitle="All data is stored on this device only"
        />
        <Row destructive onClick={resetDemo} title="Reset demo data" />
      </Group>

      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />

      <Sheet open={addPetOpen} onClose={() => setAddPetOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Add a pet</h2>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Name</p>
        <input
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="e.g. Mochi"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Species</p>
        <div className="flex gap-2">
          {(
            [
              { s: "cat" as const, label: "Cat", defaultBreed: "British Shorthair" },
              { s: "dog" as const, label: "Dog", defaultBreed: "Golden Retriever" },
            ]
          ).map((o) => (
            <button
              key={o.s}
              onClick={() => {
                setSpecies(o.s);
                setBreed(o.defaultBreed);
              }}
              className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
                species === o.s ? "bg-accent text-white" : "bg-card text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Breed</p>
        <input
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!petName.trim()}
            onClick={() => {
              addPet(petName.trim(), species, breed.trim() || (species === "cat" ? "House cat" : "Mixed breed"));
              setAddPetOpen(false);
              setPetName("");
              toast("🐾", `${petName.trim()} joined the family`, "Care tracking is ready");
            }}
          >
            Add to family
          </AccentButton>
        </div>
      </Sheet>
    </div>
  );
}
