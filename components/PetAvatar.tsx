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
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.1)]"
        style={{ background: `linear-gradient(150deg, ${pet.gradient[0]}, ${pet.gradient[1]})` }}
      >
        <PixelPet pet={pet} size={s.sprite} idle={idle} showCosmetics={showCosmetics} />
      </div>
    </div>
  );
}

/**
 * Member avatar in the pixel style: a rounded-pixel tile with the initial set
 * in the arcade font and a subtle inner pixel frame, to read clearly as an
 * avatar (distinct from the round pet sprites) while matching the theme.
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
      className="font-pixel flex shrink-0 items-center justify-center rounded-[28%] text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.15)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})`,
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
