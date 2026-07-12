"use client";

import { useState } from "react";
import Paywall from "@/components/Paywall";
import PetAvatar from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { level, useStore } from "@/lib/store";

export default function ProfilePage() {
  const { state, switchMember, setPremium, addPet, resetDemo, toast } = useStore();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog">("cat");
  const [breed, setBreed] = useState("British Shorthair");

  return (
    <div className="px-5 pt-6 pb-6">
      <h1 className="text-2xl font-black text-ink">The Family</h1>
      <p className="text-sm font-semibold text-ink-soft">Everyone pulling their weight (mostly).</p>

      {/* Premium status */}
      {state.premium ? (
        <div className="mt-4 flex items-center justify-between rounded-card bg-mint-soft p-4 ring-1 ring-mint/25">
          <div>
            <p className="text-sm font-black text-ink">✨ PetPal Plus is active</p>
            <p className="text-xs font-semibold text-ink-soft">Care plans, smart reminders & vet booking unlocked</p>
          </div>
          <button
            onClick={() => {
              setPremium(false);
              toast("👋", "Plus deactivated", "You can re-enable it anytime");
            }}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-ink ring-1 ring-line transition active:scale-90"
          >
            Turn off
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPaywallOpen(true)}
          className="mt-4 w-full rounded-card bg-brand p-4 text-left text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
        >
          <p className="text-sm font-black">✨ Upgrade to PetPal Plus</p>
          <p className="mt-0.5 text-xs font-bold text-white/85">
            Vet-built care plans + smart reminders. We do the thinking for you.
          </p>
        </button>
      )}

      {/* Members */}
      <h2 className="mt-6 text-base font-black text-ink">Members</h2>
      <p className="text-xs font-semibold text-ink-soft">Tap someone to view the demo as them.</p>
      <ul className="mt-2 space-y-2">
        {state.members.map((m) => {
          const active = m.id === state.currentMemberId;
          return (
            <li key={m.id}>
              <button
                onClick={() => {
                  switchMember(m.id);
                  if (!active) toast(m.emoji, `You're now ${m.name}`, "Actions will be logged as them");
                }}
                className={`flex w-full items-center gap-3 rounded-card p-3.5 text-left ring-1 transition active:scale-[0.98] ${
                  active ? "bg-brand-soft ring-brand/30" : "bg-white ring-line"
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-soft text-xl">
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-ink">
                    {m.name} {active && <span className="text-brand-deep">· you</span>}
                  </span>
                  <span className="block text-xs font-semibold text-ink-soft">{m.role}</span>
                </span>
                {active && <span className="text-brand-deep">✓</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Pets */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-base font-black text-ink">Pets</h2>
        <button
          onClick={() => setAddPetOpen(true)}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-ink ring-1 ring-line transition active:scale-90"
        >
          + Add pet
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {state.pets.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-card bg-white p-3.5 ring-1 ring-line">
            <PetAvatar pet={p} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-ink">{p.name}</p>
              <p className="text-xs font-semibold text-ink-soft">
                {p.breed} · {p.ageYears} yrs · {p.weightKg} kg
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Stats + reset */}
      <div className="mt-6 rounded-card bg-white p-4 ring-1 ring-line">
        <p className="text-sm font-extrabold text-ink">
          🔥 {state.streak}-day family streak · 🪙 {state.coins} coins · Level {level(state.xp)}
        </p>
        <p className="mt-1 text-xs font-semibold text-ink-soft">
          Everything in this demo is stored on your device only.
        </p>
      </div>
      <button
        onClick={resetDemo}
        className="mt-3 w-full rounded-card bg-white p-3.5 text-sm font-black text-berry ring-1 ring-line transition active:scale-[0.98]"
      >
        Reset demo data
      </button>

      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />

      <Sheet open={addPetOpen} onClose={() => setAddPetOpen(false)}>
        <h2 className="text-xl font-black text-ink">Add a pet</h2>
        <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-soft" htmlFor="pet-name">
          Name
        </label>
        <input
          id="pet-name"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="e.g. Mochi"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink placeholder:text-ink-soft/70 focus:border-brand focus:outline-none"
        />
        <p className="mt-4 text-xs font-black uppercase tracking-wide text-ink-soft">Species</p>
        <div className="mt-1.5 flex gap-2">
          {(
            [
              { s: "cat" as const, label: "🐱 Cat", defaultBreed: "British Shorthair" },
              { s: "dog" as const, label: "🐶 Dog", defaultBreed: "Golden Retriever" },
            ]
          ).map((o) => (
            <button
              key={o.s}
              onClick={() => {
                setSpecies(o.s);
                setBreed(o.defaultBreed);
              }}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                species === o.s ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-line"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-soft" htmlFor="pet-breed">
          Breed
        </label>
        <input
          id="pet-breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink focus:border-brand focus:outline-none"
        />
        <button
          disabled={!petName.trim()}
          onClick={() => {
            addPet(petName.trim(), species, breed.trim() || (species === "cat" ? "House cat" : "Good dog"));
            setAddPetOpen(false);
            setPetName("");
            toast("🐾", `${petName.trim()} joined the family!`, "Welcome to PetPal");
          }}
          className="mt-6 w-full rounded-2xl bg-brand px-4 py-4 text-base font-black text-white shadow-lg shadow-brand/40 transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          Add to family
        </button>
      </Sheet>
    </div>
  );
}
