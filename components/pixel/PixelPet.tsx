"use client";

import { Pet, cosmetic } from "@/lib/data";
import PixelSprite from "./PixelSprite";
import { CAT_FUR, CAT_SPRITE, DOG_FUR, DOG_SPRITE, furSprite } from "./petSprites";
import { COSMETIC_SPRITES, type CosmeticSprite } from "./cosmeticSprites";

/**
 * The pet's currently-equipped cosmetics that have a pixel sprite, in slot order.
 * Shared by PixelPet (2D badge) and Pet3D so both place cosmetics from one source.
 */
export function equippedCosmetics(pet: Pet): { id: string; cos: CosmeticSprite }[] {
  return Object.values(pet.equipped)
    .map((id) => (id ? { id, cos: COSMETIC_SPRITES[id] } : null))
    .filter((x): x is { id: string; cos: CosmeticSprite } => !!x && !!x.cos);
}

/**
 * Renders a pet as a pixel-art sprite with equipped cosmetics layered on top,
 * positioned by each cosmetic's `place` (fractions of the pet box).
 */
export default function PixelPet({
  pet,
  size,
  idle = false,
  showCosmetics = true,
}: {
  pet: Pet;
  size: number;
  idle?: boolean;
  showCosmetics?: boolean;
}) {
  const base = pet.species === "cat" ? CAT_SPRITE : DOG_SPRITE;
  const fur = pet.species === "cat" ? CAT_FUR : DOG_FUR;
  const sprite = furSprite(base, fur.body, fur.shade);

  const equipped = showCosmetics ? equippedCosmetics(pet) : [];

  return (
    <div
      className={idle ? "animate-idle" : undefined}
      style={{ position: "relative", width: size, height: size }}
    >
      <PixelSprite sprite={sprite} size={size} className="pixelated" />
      {equipped.map(({ id, cos }) => (
        <PixelSprite
          key={id}
          sprite={cos.sprite}
          size={size * cos.place.widthFrac}
          className="pixelated"
          style={{
            position: "absolute",
            left: size * cos.place.left,
            top: size * cos.place.top,
          }}
        />
      ))}
    </div>
  );
}

/** Small preview of a single cosmetic sprite for the shop grid. */
export function PixelCosmetic({ id, size }: { id: string; size: number }) {
  const cos = COSMETIC_SPRITES[id];
  const item = cosmetic(id);
  if (!cos) return <span style={{ fontSize: size * 0.7 }}>{item?.emoji}</span>;
  return <PixelSprite sprite={cos.sprite} size={size} className="pixelated" />;
}
