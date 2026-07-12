"use client";

import { useState } from "react";
import Header from "@/components/Header";
import PixelPet, { PixelCosmetic } from "@/components/pixel/PixelPet";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { Chip, CoinPill, Group, Row, SectionHeader, Segmented } from "@/components/ui";
import { COSMETICS, Cosmetic, CosmeticSlot, Pet, cosmetic } from "@/lib/data";
import { useStore } from "@/lib/store";

/* One main slot gets a floating + button on the avatar's head; the rest live in "Other accessories" */
const MAIN_SLOTS: { slot: CosmeticSlot; label: string; hint: string; pos: string }[] = [
  { slot: "head", label: "Hat", hint: "Hats & headwear", pos: "left-1/2 -top-4 -translate-x-1/2" },
];

const OTHER_SLOTS: { slot: CosmeticSlot; hint: string }[] = [
  { slot: "face", hint: "Glasses & eyewear" },
  { slot: "neck", hint: "Collars & scarves" },
  { slot: "body", hint: "Outfits & capes" },
];

function ItemCard({
  c,
  pet,
  coins,
  onBuy,
  onToggle,
}: {
  c: Cosmetic;
  pet: Pet;
  coins: number;
  onBuy: () => void;
  onToggle: () => void;
}) {
  const owned = pet.owned.includes(c.id);
  const equipped = pet.equipped[c.slot] === c.id;
  const affordable = coins >= c.price;
  return (
    <div className="flex flex-col rounded-card bg-card p-3.5 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]">
      <div className="flex aspect-[2/1] items-center justify-center rounded-ios bg-fill">
        <PixelCosmetic id={c.id} size={44} />
      </div>
      <p className="mt-2.5 truncate text-[14px] font-semibold text-label">{c.name}</p>
      {owned ? (
        <button
          onClick={onToggle}
          className={`mt-2.5 flex h-[34px] items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
            equipped ? "bg-green-soft text-green" : "bg-fill text-label"
          }`}
        >
          {equipped && <Icon name="check" size={14} strokeWidth={2.6} />}
          {equipped ? "Wearing" : "Put on"}
        </button>
      ) : (
        <button
          disabled={!affordable}
          onClick={onBuy}
          className="mt-2.5 flex h-[34px] items-center justify-center gap-1 rounded-full bg-accent-soft text-[13px] font-semibold text-accent transition-all active:scale-95 disabled:bg-fill disabled:text-label-3"
        >
          <Icon name="coin" size={13} strokeWidth={2.2} /> {c.price}
        </button>
      )}
    </div>
  );
}

export default function PetsPage() {
  const { state, buyCosmetic, toggleEquip, toast } = useStore();
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [openSheet, setOpenSheet] = useState<CosmeticSlot | "other" | null>(null);

  const pet = state.pets.find((p) => p.id === petId) ?? state.pets[0];
  const mainMeta = MAIN_SLOTS.find((s) => s.slot === openSheet);

  const buy = (c: Cosmetic) => {
    buyCosmetic(pet.id, c.id);
    toast("🛍️", `${c.name} purchased`, `${pet.name} is wearing it now`);
  };
  const toggle = (c: Cosmetic) => {
    const wasEquipped = pet.equipped[c.slot] === c.id;
    toggleEquip(pet.id, c.id);
    if (!wasEquipped) toast("🐾", `${pet.name} is wearing the ${c.name}`, "Looking sharp");
  };

  return (
    <div className="px-4">
      <Header title="Pets" subtitle="Style your companion" trailing={<CoinPill amount={state.coins} />} />

      {state.pets.length > 1 && (
        <div className="mb-4">
          <Segmented
            options={state.pets.map((p) => ({ value: p.id, label: p.name }))}
            value={pet.id}
            onChange={setPetId}
          />
        </div>
      )}

      {/* Dressing stage */}
      <div className="overflow-hidden rounded-sheet bg-card shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)]">
        <div className="arcade-stage flex flex-col items-center px-5 pb-5 pt-2">
          <div className="relative my-8" style={{ width: 176, height: 176 }}>
            {/* Pixel pet on a soft platform shadow */}
            <div className="flex h-full w-full items-center justify-center">
              <PixelPet pet={pet} size={168} idle />
            </div>
            <span className="absolute bottom-1 left-1/2 h-3 w-24 -translate-x-1/2 rounded-[50%] bg-[oklch(0.35_0.05_288/0.18)] blur-[3px]" />

            {/* Head slot button — see-through glass "+", shows pixel hat when equipped */}
            {MAIN_SLOTS.map((s) => {
              const equippedId = pet.equipped[s.slot];
              return (
                <button
                  key={s.slot}
                  onClick={() => setOpenSheet(s.slot)}
                  aria-label={`${s.label}: ${equippedId ? cosmetic(equippedId)?.name : "empty — tap to add"}`}
                  className={`glass-strong absolute z-10 flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 active:scale-90 ${s.pos}`}
                >
                  {equippedId ? (
                    <PixelCosmetic id={equippedId} size={24} />
                  ) : (
                    <Icon name="plus" size={19} strokeWidth={2.2} className="text-label-2" />
                  )}
                </button>
              );
            })}
          </div>

          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{pet.name}</h2>
          <p className="text-[13px] font-medium text-label-2">{pet.breed}</p>
          <div className="mt-2.5 flex gap-1.5">
            <Chip>{pet.ageYears} yrs</Chip>
            <Chip>{pet.weightKg} kg</Chip>
            <Chip>{pet.owned.length} items</Chip>
          </div>

          {/* Other accessories */}
          <button
            onClick={() => setOpenSheet("other")}
            className="mt-5 flex h-[44px] w-full items-center justify-center gap-2 rounded-ios bg-fill text-[15px] font-semibold text-label transition-transform active:scale-[0.97]"
          >
            <Icon name="bag" size={17} />
            Other accessories
          </button>
        </div>
      </div>

      <p className="mt-3 px-1 text-center text-[12px] font-medium text-label-3">
        Every logged care action earns 5 coins.
      </p>

      {/* Picker sheet */}
      <Sheet open={openSheet !== null} onClose={() => setOpenSheet(null)}>
        {openSheet === "other" ? (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Other accessories</h2>
              <CoinPill amount={state.coins} />
            </div>
            <p className="mt-0.5 text-[13px] text-label-2">For {pet.name}</p>
            {OTHER_SLOTS.map((s) => (
              <div key={s.slot}>
                <SectionHeader>{s.hint}</SectionHeader>
                <div className="grid grid-cols-2 gap-2.5">
                  {COSMETICS.filter((c) => c.slot === s.slot).map((c) => (
                    <ItemCard key={c.id} c={c} pet={pet} coins={state.coins} onBuy={() => buy(c)} onToggle={() => toggle(c)} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          openSheet &&
          mainMeta && (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{mainMeta.hint}</h2>
                <CoinPill amount={state.coins} />
              </div>
              <p className="mt-0.5 text-[13px] text-label-2">
                For {pet.name} · {mainMeta.label.toLowerCase()} slot
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 pb-2">
                {COSMETICS.filter((c) => c.slot === openSheet).map((c) => (
                  <ItemCard key={c.id} c={c} pet={pet} coins={state.coins} onBuy={() => buy(c)} onToggle={() => toggle(c)} />
                ))}
              </div>
              {pet.equipped[openSheet] && (
                <Group className="mt-2">
                  <Row
                    onClick={() => toggleEquip(pet.id, pet.equipped[openSheet as CosmeticSlot]!)}
                    title={`Remove ${cosmetic(pet.equipped[openSheet as CosmeticSlot]!)?.name}`}
                    destructive
                  />
                </Group>
              )}
            </>
          )
        )}
      </Sheet>
    </div>
  );
}
