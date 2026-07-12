"use client";

import { useState } from "react";
import Confetti from "@/components/Confetti";
import PetAvatar from "@/components/PetAvatar";
import { COSMETICS } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function ShopPage() {
  const { state, buyCosmetic, toggleEquip, toast } = useStore();
  const [petIndex, setPetIndex] = useState(0);
  const [burst, setBurst] = useState(0);

  const pet = state.pets[Math.min(petIndex, state.pets.length - 1)];

  return (
    <div className="relative px-5 pt-6 pb-6">
      <Confetti burst={burst} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Pet Boutique</h1>
          <p className="text-sm font-semibold text-ink-soft">Earn coins by caring. Spend them on drip.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5">
          <span aria-hidden>🪙</span>
          <span className="text-sm font-black text-ink">{state.coins}</span>
        </div>
      </div>

      {/* Dressing room */}
      <section className="mt-4 rounded-card bg-berry-soft p-5 ring-1 ring-berry/15">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white p-3 shadow-sm animate-pop" key={JSON.stringify(pet.equipped)}>
            <PetAvatar pet={pet} size="lg" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-ink">{pet.name}&apos;s fit</h2>
            <p className="text-xs font-semibold text-ink-soft">
              {Object.keys(pet.equipped).length > 0
                ? "Looking absolutely iconic. Screenshot-worthy."
                : "Naked! Quick, buy something fabulous."}
            </p>
            {state.pets.length > 1 && (
              <div className="mt-2 flex gap-2">
                {state.pets.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPetIndex(i)}
                    className={`rounded-full px-3 py-1 text-xs font-black transition ${
                      i === petIndex ? "bg-berry text-white" : "bg-white text-ink ring-1 ring-line"
                    }`}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {COSMETICS.map((c) => {
          const owned = pet.owned.includes(c.id);
          const equipped = pet.equipped[c.slot] === c.id;
          const affordable = state.coins >= c.price;
          return (
            <div key={c.id} className="flex flex-col items-center rounded-card bg-white p-4 ring-1 ring-line">
              <span className="text-4xl">{c.emoji}</span>
              <p className="mt-2 text-sm font-extrabold text-ink">{c.name}</p>
              <p className="text-[11px] font-bold capitalize text-ink-soft">{c.slot}</p>
              {owned ? (
                <button
                  onClick={() => {
                    toggleEquip(pet.id, c.id);
                    if (!equipped) toast("😻", `${pet.name} is wearing the ${c.name}!`, "Share-worthy.");
                  }}
                  className={`mt-3 w-full rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 ${
                    equipped ? "bg-mint text-white" : "bg-mint-soft text-ink"
                  }`}
                >
                  {equipped ? "Wearing ✓" : "Put it on"}
                </button>
              ) : (
                <button
                  disabled={!affordable}
                  onClick={() => {
                    buyCosmetic(pet.id, c.id);
                    setBurst((b) => b + 1);
                    toast("🛍️", `Bought the ${c.name}!`, `${pet.name} is wearing it now`);
                  }}
                  className="mt-3 w-full rounded-xl bg-brand px-3 py-2 text-xs font-black text-white shadow-sm shadow-brand/40 transition active:scale-95 disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
                >
                  🪙 {c.price}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-ink-soft">
        Every logged feeding, walk or clean-up earns +5 coins 🪙
      </p>
    </div>
  );
}
