"use client";

import { Pet } from "@/lib/data";
import PixelPet from "./pixel/PixelPet";

const SIZES = {
  xs: { px: 28, sprite: 24 },
  sm: { px: 40, sprite: 34 },
  md: { px: 56, sprite: 48 },
  lg: { px: 84, sprite: 74 },
  xl: { px: 116, sprite: 104 },
};

export default function PetAvatar({
  pet,
  size = "md",
  showCosmetics = true,
  idle = false,
}: {
  pet: Pet;
  size?: keyof typeof SIZES;
  showCosmetics?: boolean;
  idle?: boolean;
}) {
  const s = SIZES[size];

  return (
    <div className="relative shrink-0 select-none" style={{ width: s.px, height: s.px }} aria-label={`${pet.name} the ${pet.breed}`}>
      {/* Background disc — the gradient bubble the pet sits in */}
      <div
        className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.1)]"
        style={{ background: `linear-gradient(150deg, ${pet.gradient[0]}, ${pet.gradient[1]})` }}
      />
      {/* Unclipped pet layer — hats spill above the disc (and capes below), so the
          badge matches the full-size dress-up stage instead of slicing hats off. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <PixelPet pet={pet} size={s.sprite} idle={idle} showCosmetics={showCosmetics} />
      </div>
    </div>
  );
}

/**
 * Member avatar: a clean iOS-style gradient circle with the initial in the
 * system font — distinct from the round pixel pet sprites (people are not
 * part of the pixel pet world).
 */
export function InitialAvatar({
  name,
  gradient,
  size = 40,
}: {
  name: string;
  gradient: [string, string];
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.12)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})`,
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
