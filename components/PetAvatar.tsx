"use client";

import { Pet, cosmetic } from "@/lib/data";
import PetFace from "./PetFace";

const SIZES = {
  sm: { px: 40, face: 34, badge: "text-[11px] h-[18px] min-w-[18px] -bottom-0.5 -right-0.5" },
  md: { px: 56, face: 48, badge: "text-[13px] h-[22px] min-w-[22px] -bottom-0.5 -right-0.5" },
  lg: { px: 84, face: 72, badge: "text-[17px] h-[28px] min-w-[28px] -bottom-1 -right-1" },
  xl: { px: 116, face: 100, badge: "text-[20px] h-[34px] min-w-[34px] -bottom-1 -right-1" },
};

export default function PetAvatar({
  pet,
  size = "md",
  showCosmetics = true,
}: {
  pet: Pet;
  size?: keyof typeof SIZES;
  showCosmetics?: boolean;
}) {
  const s = SIZES[size];
  const equipped = Object.values(pet.equipped)
    .map((id) => cosmetic(id!))
    .filter(Boolean);

  return (
    <div className="relative shrink-0 select-none" style={{ width: s.px, height: s.px }} aria-label={`${pet.name} the ${pet.breed}`}>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-2px_6px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.1)]"
        style={{ background: `linear-gradient(150deg, ${pet.gradient[0]}, ${pet.gradient[1]})` }}
      >
        <PetFace species={pet.species} size={s.face} />
      </div>
      {showCosmetics && equipped.length > 0 && (
        <span
          className={`absolute flex items-center justify-center gap-px rounded-full bg-card px-1 shadow-[0_1px_4px_rgba(0,0,0,0.15)] ring-1 ring-sep ${s.badge}`}
        >
          {equipped.slice(0, 2).map((c) => (
            <span key={c!.id} className="leading-none">{c!.emoji}</span>
          ))}
        </span>
      )}
    </div>
  );
}

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
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
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
