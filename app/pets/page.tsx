"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import PixelPet, { PixelCosmetic } from "@/components/pixel/PixelPet";
import Pet3D from "@/components/pixel/Pet3D";
import Sheet from "@/components/Sheet";
import EditStatSheet from "@/components/EditStatSheet";
import Meds from "@/components/Meds";
import { Icon } from "@/components/Icons";
import { AccentButton, Chevron, Chip, CoinPill, Group, Row, SectionHeader, Segmented } from "@/components/ui";
import { COSMETICS, Cosmetic, CosmeticSlot, Pet, cosmetic, formatAge, formatWeight } from "@/lib/data";
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
      <div className="flex aspect-2/1 items-center justify-center rounded-ios bg-fill">
        <PixelCosmetic id={c.id} size={44} />
      </div>
      <p className="mt-2.5 truncate text-[14px] font-semibold text-label">{c.name}</p>
      {owned ? (
        <button
          onClick={onToggle}
          className={`mt-2.5 flex h-8.5 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
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
          className="mt-2.5 flex h-8.5 items-center justify-center gap-1 rounded-full bg-accent-soft text-[13px] font-semibold text-accent transition-all active:scale-95 disabled:bg-fill disabled:text-label-3"
        >
          <Icon name="coin" size={13} strokeWidth={2.2} /> {c.price}
        </button>
      )}
    </div>
  );
}

export default function PetsPage() {
  return (
    <Suspense>
      <PetsPageContent />
    </Suspense>
  );
}

function PetsPageContent() {
  const { state, hydrated, buyCosmetic, toggleEquip, addPet, addWeight, editPet, toast } = useStore();
  const searchParams = useSearchParams();
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [openSheet, setOpenSheet] = useState<CosmeticSlot | "other" | null>(() =>
    searchParams.get("shop") === "1" ? "other" : null
  );
  const [threeD, setThreeD] = useState(false);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog">("cat");
  const [breed, setBreed] = useState("British Shorthair");
  const [editingStat, setEditingStat] = useState<"weight" | "age" | "cupGrams" | null>(null);
  const [namesRef, setNamesRef] = useState<HTMLDivElement | null>(null);

  const pet = state.pets.find((p) => p.id === petId) ?? state.pets[0];
  const mainMeta = MAIN_SLOTS.find((s) => s.slot === openSheet);

  if (!hydrated) return <PageLoading title="Pets" subtitle="Style your companion" />;

  const addPetSheet = (
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
          disabled={!petName.trim() || !hydrated}
          onClick={() => {
            addPet(petName.trim(), species, breed.trim() || (species === "cat" ? "House cat" : "Mixed breed"));
            setAddPetOpen(false);
            setPetName("");
          }}
        >
          {hydrated ? "Add to family" : "Loading…"}
        </AccentButton>
      </div>
    </Sheet>
  );

  if (!pet) {
    return (
      <div className="px-4">
        <Header
          title="Pets"
          subtitle="Style your companion"
          trailing={
            <button
              onClick={() => setAddPetOpen(true)}
              className="glass-strong flex h-9 items-center gap-1 rounded-full pl-2.5 pr-3.5 text-[13px] font-semibold text-label-2 transition-transform active:scale-90"
            >
              <Icon name="plus" size={16} strokeWidth={2.4} />
              Add pet
            </button>
          }
        />
        {addPetSheet}
      </div>
    );
  }

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
      <Header
        title="Pets"
        subtitle="Style your companion"
        trailing={
          <span className="flex items-center gap-2">
            <button
              onClick={() => setAddPetOpen(true)}
              className="glass-strong flex h-9 items-center gap-1 rounded-full pl-2.5 pr-3.5 text-[13px] font-semibold text-label-2 transition-transform active:scale-90"
            >
              <Icon name="plus" size={16} strokeWidth={2.4} />
              Add pet
            </button>
            <CoinPill amount={state.coins} />
          </span>
        }
      />

      {state.pets.length > 1 && (
        <div className="mb-4 flex items-center gap-1.5">
          {state.pets.length > 4 && (
            <button
              onClick={() => namesRef?.scrollBy({ left: -namesRef.clientWidth, behavior: "smooth" })}
              aria-label="Previous pets"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fill text-label-2 transition-transform active:scale-90"
            >
              <Icon name="chevron-left" size={15} />
            </button>
          )}
          <Segmented
            options={state.pets.map((p) => ({ value: p.id, label: p.name }))}
            value={pet.id}
            onChange={setPetId}
            scrollable
            containerRef={setNamesRef}
          />
          {state.pets.length > 4 && (
            <button
              onClick={() => namesRef?.scrollBy({ left: namesRef.clientWidth, behavior: "smooth" })}
              aria-label="Next pets"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fill text-label-2 transition-transform active:scale-90"
            >
              <Icon name="chevron-right" size={15} />
            </button>
          )}
        </div>
      )}

      {/* Dressing stage */}
      <div className="relative overflow-hidden rounded-sheet bg-card shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)]">
        {/* 3D toggle — liquid glass */}
        <button
          onClick={() => setThreeD((v) => !v)}
          aria-pressed={threeD}
          className={`glass-strong absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-transform active:scale-95 ${threeD ? "text-accent" : "text-label-2"}`}
        >
          <Icon name="cube" size={15} />
          <span className="font-pixel text-[8px]">3D</span>
        </button>

        <div className="arcade-stage flex flex-col items-center px-5 pb-5 pt-2">
          <div className="relative my-8" style={{ width: 176, height: 176 }}>
            {threeD ? (
              <Pet3D pet={pet} size={176} />
            ) : (
              <>
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
              </>
            )}
          </div>

          {threeD && (
            <p className="font-pixel -mt-4 mb-2 text-[8px] text-label-3">drag to spin · springs back</p>
          )}

          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">{pet.name}</h2>
          <p className="text-[13px] font-medium text-label-2">{pet.breed}</p>
          <div className="mt-2.5 flex gap-1.5">
            <button onClick={() => setEditingStat("age")}>
              <Chip>{formatAge(pet.ageYears)}</Chip>
            </button>
            <button onClick={() => setEditingStat("weight")}>
              <Chip>{formatWeight(pet.weightKg, state.units)}</Chip>
            </button>
            <Chip>{pet.owned.length} items</Chip>
          </div>

          {/* Other accessories */}
          <button
            onClick={() => setOpenSheet("other")}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-ios bg-fill text-[15px] font-semibold text-label transition-transform active:scale-[0.97]"
          >
            <Icon name="bag" size={17} />
            Other accessories
          </button>
        </div>
      </div>

      <p className="mt-3 px-1 text-center text-[12px] font-medium text-label-3">
        Every logged care action earns 5 coins.
      </p>

      <Meds pet={pet} />

      <SectionHeader>Food portion</SectionHeader>
      <Group>
        <Row
          onClick={() => setEditingStat("cupGrams")}
          leading={
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange">
              <Icon name="box" size={18} />
            </span>
          }
          title="Cup size"
          subtitle={`${pet.cupGrams} g per full cup`}
          trailing={<Chevron />}
        />
      </Group>

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

      {addPetSheet}

      <EditStatSheet
        open={editingStat === "weight"}
        onClose={() => setEditingStat(null)}
        title={`${pet.name}'s weight`}
        label="Weight (kg)"
        initialValue={pet.weightKg}
        onSave={(kg) => {
          addWeight(pet.id, kg);
          toast("⚖️", `${pet.name}'s weight updated`, formatWeight(kg, state.units));
        }}
      />
      <EditStatSheet
        open={editingStat === "age"}
        onClose={() => setEditingStat(null)}
        title={`${pet.name}'s age`}
        label="Age (years)"
        initialValue={pet.ageYears}
        onSave={(ageYears) => {
          editPet(pet.id, { name: pet.name, breed: pet.breed, ageYears, weightKg: pet.weightKg, cupGrams: pet.cupGrams });
          toast("🎂", `${pet.name}'s age updated`, formatAge(ageYears));
        }}
      />
      <EditStatSheet
        open={editingStat === "cupGrams"}
        onClose={() => setEditingStat(null)}
        title={`${pet.name}'s food portion`}
        label="Grams per full cup"
        initialValue={pet.cupGrams}
        onSave={(cupGrams) => {
          editPet(pet.id, { name: pet.name, breed: pet.breed, ageYears: pet.ageYears, weightKg: pet.weightKg, cupGrams });
          toast("🥣", `${pet.name}'s cup size updated`, `${cupGrams} g per full cup`);
        }}
      />
    </div>
  );
}
