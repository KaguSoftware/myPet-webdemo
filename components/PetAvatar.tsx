"use client";

import { Pet, cosmetic } from "@/lib/data";

const SIZES = {
  sm: { box: "h-12 w-12", pet: "text-3xl", item: "text-sm" },
  md: { box: "h-20 w-20", pet: "text-5xl", item: "text-lg" },
  lg: { box: "h-32 w-32", pet: "text-8xl", item: "text-3xl" },
};

export default function PetAvatar({ pet, size = "md" }: { pet: Pet; size?: "sm" | "md" | "lg" }) {
  const s = SIZES[size];
  const item = (slot: keyof typeof pet.equipped) => {
    const id = pet.equipped[slot];
    return id ? cosmetic(id)?.emoji : null;
  };
  return (
    <div className={`relative ${s.box} shrink-0 select-none`} aria-label={`${pet.name} the ${pet.breed}`}>
      <span className={`absolute inset-0 flex items-center justify-center ${s.pet}`}>{pet.emoji}</span>
      {item("body") && (
        <span className={`absolute -bottom-1 -right-1 ${s.item}`}>{item("body")}</span>
      )}
      {item("head") && (
        <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 -rotate-12 ${s.item}`}>{item("head")}</span>
      )}
      {item("face") && (
        <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.item}`}>{item("face")}</span>
      )}
      {item("neck") && (
        <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 ${s.item}`}>{item("neck")}</span>
      )}
    </div>
  );
}
