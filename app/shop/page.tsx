"use client";

import { useState } from "react";
import Header from "@/components/Header";
import PetAvatar from "@/components/PetAvatar";
import { Icon } from "@/components/Icons";
import { CoinPill, SectionHeader, Segmented } from "@/components/ui";
import { COSMETICS, cosmetic } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function ShopPage() {
  const { state, buyCosmetic, toggleEquip, toast } = useStore();
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");

  const pet = state.pets.find((p) => p.id === petId) ?? state.pets[0];
  const equippedNames = Object.values(pet.equipped)
    .map((id) => cosmetic(id!)?.name)
    .filter(Boolean);

  return (
    <div className="px-4">
      <Header title="Boutique" subtitle="Earned by caring" trailing={<CoinPill amount={state.coins} />} />

      {/* Dressing room */}
      <div className="rounded-sheet bg-card p-5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)]">
        <div className="flex items-center gap-4">
          <PetAvatar pet={pet} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{pet.name}</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-label-2">
              {equippedNames.length > 0 ? `Wearing: ${equippedNames.join(", ")}` : "Nothing equipped yet"}
            </p>
          </div>
        </div>
        {state.pets.length > 1 && (
          <div className="mt-4">
            <Segmented
              options={state.pets.map((p) => ({ value: p.id, label: p.name }))}
              value={pet.id}
              onChange={setPetId}
            />
          </div>
        )}
      </div>

      <SectionHeader>Accessories</SectionHeader>
      <div className="grid grid-cols-2 gap-2.5 pb-2">
        {COSMETICS.map((c) => {
          const owned = pet.owned.includes(c.id);
          const equipped = pet.equipped[c.slot] === c.id;
          const affordable = state.coins >= c.price;
          return (
            <div key={c.id} className="flex flex-col rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
              <div className="flex aspect-[2/1] items-center justify-center rounded-ios bg-fill text-[40px]">
                {c.emoji}
              </div>
              <p className="mt-2.5 truncate text-[14px] font-semibold text-label">{c.name}</p>
              <p className="text-[12px] font-medium capitalize text-label-3">{c.slot}</p>
              {owned ? (
                <button
                  onClick={() => {
                    toggleEquip(pet.id, c.id);
                    if (!equipped) toast("🛍️", `${pet.name} is wearing the ${c.name}`, "Looking sharp");
                  }}
                  className={`mt-2.5 flex h-[34px] items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                    equipped ? "bg-green-soft text-green" : "bg-fill text-label"
                  }`}
                >
                  {equipped && <Icon name="check" size={14} strokeWidth={2.6} />}
                  {equipped ? "Equipped" : "Equip"}
                </button>
              ) : (
                <button
                  disabled={!affordable}
                  onClick={() => {
                    buyCosmetic(pet.id, c.id);
                    toast("🛍️", `${c.name} purchased`, `${pet.name} is wearing it now`);
                  }}
                  className="mt-2.5 flex h-[34px] items-center justify-center gap-1 rounded-full bg-accent-soft text-[13px] font-semibold text-accent transition-all active:scale-95 disabled:bg-fill disabled:text-label-3"
                >
                  <Icon name="coin" size={13} strokeWidth={2.2} /> {c.price}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="pb-2 text-center text-[12px] font-medium text-label-3">
        Every logged care action earns 5 coins.
      </p>
    </div>
  );
}
