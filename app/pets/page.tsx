"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import PetAvatar from "@/components/PetAvatar";
import PixelPet, { PixelCosmetic } from "@/components/pixel/PixelPet";
import Pet3D from "@/components/pixel/Pet3D";
import Sheet from "@/components/Sheet";
import EditStatSheet from "@/components/EditStatSheet";
import Meds from "@/components/Meds";
import { Icon } from "@/components/Icons";
import { AccentButton, Chevron, Chip, CoinPill, Group, Row, SectionHeader, Segmented } from "@/components/ui";
import { BREEDS_BY_SPECIES, COSMETICS, Cosmetic, CosmeticSlot, Pet, cosmetic, formatAge, formatWeight, kgToUnit, unitToKg, weightUnitLabel } from "@/lib/data";
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

/* Sensible starting weight (kg) / cup size (g) per species for the prefilled inputs. */
const SPECIES_DEFAULTS: Record<"cat" | "dog", { weightKg: number; cupGrams: number }> = {
  cat: { weightKg: 4, cupGrams: 60 },
  dog: { weightKg: 20, cupGrams: 120 },
};

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
          {equipped && <Icon name="check" size={14} />}
          {equipped ? "Wearing" : "Put on"}
        </button>
      ) : (
        <button
          disabled={!affordable}
          onClick={onBuy}
          className="mt-2.5 flex h-8.5 items-center justify-center gap-1 rounded-full bg-accent-soft text-[13px] font-semibold text-accent transition-all active:scale-95 disabled:bg-fill disabled:text-label-3"
        >
          <Icon name="coin" size={13} /> {c.price}
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
  const [breed, setBreed] = useState("");
  const [breedFocus, setBreedFocus] = useState(false);
  const [sex, setSex] = useState<"female" | "male">("female");
  const [ageInput, setAgeInput] = useState("1");
  const [weightInput, setWeightInput] = useState("");
  const [cupInput, setCupInput] = useState("");
  const [editingStat, setEditingStat] = useState<"weight" | "age" | "cupGrams" | null>(null);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [justReacted, setJustReacted] = useState(false);
  const react = () => {
    setJustReacted(true);
    setTimeout(() => setJustReacted(false), 450);
  };

  const pet = state.pets.find((p) => p.id === petId) ?? state.pets[0];
  const mainMeta = MAIN_SLOTS.find((s) => s.slot === openSheet);

  if (!hydrated) return <PageLoading title="Pets" subtitle="Style your companion" />;

  // Prefill the weight/cup inputs from the species defaults (weight shown in
  // the household's unit) so the sheet opens with reasonable numbers to tweak.
  const prefillFor = (sp: "cat" | "dog") => {
    const d = SPECIES_DEFAULTS[sp];
    setWeightInput(String(Math.round(kgToUnit(d.weightKg, state.units) * 10) / 10));
    setCupInput(String(d.cupGrams));
  };
  const openAddPet = () => {
    setSpecies("cat");
    setBreed("");
    setBreedFocus(false);
    setSex("female");
    setAgeInput("1");
    prefillFor("cat");
    setPetName("");
    setAddPetOpen(true);
  };
  const resetAddPetForm = () => {
    setPetName("");
  };

  // Resolve the typed breed against the known list case-insensitively, so a
  // match (however the user capitalised it) is saved under its canonical name
  // and picks up the vet-built CARE_PLANS entry; anything else is a custom breed.
  const breedQuery = breed.trim().toLowerCase();
  const canonicalBreed = BREEDS_BY_SPECIES[species].find((b) => b.toLowerCase() === breedQuery);
  const breedSuggestions = breedQuery
    ? BREEDS_BY_SPECIES[species].filter((b) => b.toLowerCase().includes(breedQuery) && b.toLowerCase() !== breedQuery)
    : [];
  const resolvedBreed = canonicalBreed ?? (breed.trim() || (species === "cat" ? "House cat" : "Mixed breed"));
  const parsedAge = Number(ageInput);
  const parsedWeightUnit = Number(weightInput);
  const parsedCup = Number(cupInput);
  const addPetValid =
    hydrated &&
    petName.trim().length > 0 &&
    Number.isFinite(parsedAge) &&
    parsedAge >= 0 &&
    Number.isFinite(parsedWeightUnit) &&
    parsedWeightUnit > 0 &&
    Number.isFinite(parsedCup) &&
    parsedCup > 0;

  const fieldClass =
    "w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60";
  const labelClass = "mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2";

  const addPetSheet = (
    <Sheet
      open={addPetOpen}
      onClose={() => {
        setAddPetOpen(false);
        resetAddPetForm();
      }}
    >
      <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Add a pet</h2>

      <p className={labelClass}>Name</p>
      <input
        value={petName}
        onChange={(e) => setPetName(e.target.value)}
        placeholder="e.g. Mochi"
        className={fieldClass}
      />

      <p className={labelClass}>Species</p>
      <div className="flex gap-2">
        {([
          { s: "cat" as const, label: "Cat" },
          { s: "dog" as const, label: "Dog" },
        ]).map((o) => (
          <button
            key={o.s}
            onClick={() => {
              setSpecies(o.s);
              setBreed("");
              setBreedFocus(false);
              prefillFor(o.s);
            }}
            className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
              species === o.s ? "bg-accent text-white" : "bg-card text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className={labelClass}>Breed</p>
      <div className="relative">
        <input
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          onFocus={() => setBreedFocus(true)}
          onBlur={() => setBreedFocus(false)}
          placeholder="Start typing a breed…"
          autoComplete="off"
          className={fieldClass}
        />
        {breedFocus && breedSuggestions.length > 0 && (
          <ul className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-ios bg-card py-1 shadow-[0_4px_16px_oklch(0.2_0.01_264/0.14)] ring-1 ring-black/5">
            {breedSuggestions.map((b) => (
              <li key={b}>
                <button
                  // preventDefault on mousedown keeps the input focused so the
                  // click lands before onBlur closes the dropdown.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setBreed(b);
                    setBreedFocus(false);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-[15px] font-medium text-label transition-colors active:bg-fill"
                >
                  {b}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {breed.trim().length > 0 && (
        <p className="mt-1.5 text-[12px] font-medium text-label-3">
          {canonicalBreed
            ? "This breed has a vet-built care plan."
            : "Not on the list — you'll set custom feeding/water/care targets on the Care tab."}
        </p>
      )}

      <p className={labelClass}>Sex</p>
      <Segmented
        options={[
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
        ]}
        value={sex}
        onChange={setSex}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <p className={labelClass}>Age (years)</p>
          <input
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value)}
            inputMode="decimal"
            placeholder="1"
            className={fieldClass}
          />
        </div>
        <div className="flex-1">
          <p className={labelClass}>Weight ({weightUnitLabel(state.units)})</p>
          <input
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className={fieldClass}
          />
        </div>
      </div>

      <p className={labelClass}>Cup size (grams of food per cup)</p>
      <input
        value={cupInput}
        onChange={(e) => setCupInput(e.target.value)}
        inputMode="numeric"
        placeholder="60"
        className={fieldClass}
      />

      <div className="mt-7">
        <AccentButton
          disabled={!addPetValid}
          onClick={() => {
            addPet({
              name: petName.trim(),
              species,
              breed: resolvedBreed,
              sex,
              ageYears: parsedAge,
              weightKg: unitToKg(parsedWeightUnit, state.units),
              cupGrams: Math.round(parsedCup),
            });
            setAddPetOpen(false);
            resetAddPetForm();
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
          bell
          trailing={
            <button
              onClick={openAddPet}
              className="glass-strong flex h-9 items-center gap-1 rounded-full pl-2.5 pr-3.5 text-[13px] font-semibold text-label-2 transition-transform active:scale-90"
            >
              <Icon name="plus" size={16} />
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
    react();
    toast("🛍️", `${c.name} purchased`, `${pet.name} is wearing it now`);
  };
  const toggle = (c: Cosmetic) => {
    const wasEquipped = pet.equipped[c.slot] === c.id;
    toggleEquip(pet.id, c.id);
    react();
    if (wasEquipped) toast("🐾", `Took off the ${c.name}`, `${pet.name}'s look updated`);
    else toast("🐾", `${pet.name} is wearing the ${c.name}`, "Looking sharp");
  };

  return (
    <div className="px-4">
      <Header
        title="Pets"
        subtitle="Style your companion"
        bell
        trailing={
          <span className="flex items-center gap-2">
            <button
              onClick={openAddPet}
              className="glass-strong flex h-9 items-center gap-1 rounded-full pl-2.5 pr-3.5 text-[13px] font-semibold text-label-2 transition-transform active:scale-90"
            >
              <Icon name="plus" size={16} />
              Add pet
            </button>
            <CoinPill amount={state.coins} />
          </span>
        }
      />

      {state.pets.length > 1 && (
        <button
          type="button"
          onClick={() => setPetPickerOpen(true)}
          className="mb-4 flex w-full items-center justify-center gap-1.5 px-1"
        >
          <span className="text-[18px] font-semibold text-label">{pet.name}</span>
          <Chevron />
        </button>
      )}

      <Sheet open={petPickerOpen} onClose={() => setPetPickerOpen(false)} ariaLabel="Switch pet">
        <h2 className="mb-3 px-1 text-[20px] font-bold tracking-[-0.01em] text-label">Switch pet</h2>
        <Group>
          {state.pets.map((p) => (
            <Row
              key={p.id}
              onClick={() => {
                setPetId(p.id);
                setPetPickerOpen(false);
              }}
              leading={<PetAvatar pet={p} size="sm" />}
              title={p.name}
              subtitle={p.breed}
              trailing={p.id === pet.id ? <Icon name="check" size={18} className="text-accent" /> : undefined}
            />
          ))}
        </Group>
      </Sheet>

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
                <div className={`flex h-full w-full items-center justify-center ${justReacted ? "animate-coin-bump" : ""}`}>
                  <PixelPet pet={pet} size={168} idle />
                </div>
                <span className="absolute bottom-1 left-1/2 h-3 w-24 -translate-x-1/2 rounded-[50%] bg-[oklch(0.35_0.05_288/0.18)] blur-[3px]" />
              </>
            )}

            {/* Head slot button — see-through glass "+", shows the pixel hat when
                equipped. Kept visible in 3D too so hat editing stays reachable. */}
            {MAIN_SLOTS.map((s) => {
              const equippedId = pet.equipped[s.slot];
              return (
                <button
                  key={s.slot}
                  onClick={() => setOpenSheet(s.slot)}
                  aria-label={`${s.label}: ${equippedId ? cosmetic(equippedId)?.name : "empty — tap to add"}`}
                  // In 3D the pet renders small and centered, so the top-center slot
                  // would sit on top of its (now visible) hat — tuck it into the
                  // top-left corner instead, mirroring the 3D toggle on the right.
                  className={`glass-strong absolute z-10 flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 active:scale-90 ${threeD ? "left-3 top-3" : s.pos}`}
                >
                  {equippedId ? (
                    <PixelCosmetic id={equippedId} size={24} />
                  ) : (
                    <Icon name="plus" size={19} className="text-label-2" />
                  )}
                </button>
              );
            })}
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
                    onClick={() => {
                      const c = cosmetic(pet.equipped[openSheet as CosmeticSlot]!);
                      if (c) toggle(c);
                    }}
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
        label={`Weight (${weightUnitLabel(state.units)})`}
        initialValue={kgToUnit(pet.weightKg, state.units)}
        onSave={(v) => {
          const kg = unitToKg(v, state.units);
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
