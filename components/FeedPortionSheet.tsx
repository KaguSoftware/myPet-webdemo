"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { AccentButton, Segmented } from "@/components/ui";
import { PORTIONS, Pet } from "@/lib/data";
import { useStore } from "@/lib/store";

/** Portion picker for logging a feeding (plus the "give a treat instead" path).
 *  Shared by /logs and the /plan Today checklist. */
export default function FeedPortionSheet({
  pet,
  open,
  onClose,
  onLogged,
}: {
  pet: Pet;
  open: boolean;
  onClose: () => void;
  /** Called after a feeding was successfully logged (not for treats). */
  onLogged?: () => void;
}) {
  const { logAction, useSupply: consumeSupply, toast } = useStore();
  const [fraction, setFraction] = useState<(typeof PORTIONS)[number]["value"]>("1");
  const treatsSupply = pet.supplies.find((s) => s.icon === "star");

  const confirmFeed = () => {
    const frac = PORTIONS.find((p) => p.value === fraction)?.frac ?? 1;
    const logged = logAction(pet.id, "fed", frac * pet.cupGrams);
    onClose();
    if (logged) onLogged?.();
  };

  const confirmTreat = () => {
    if (!treatsSupply) return;
    consumeSupply(pet.id, treatsSupply.id);
    onClose();
    toast("star", `${pet.name} got a treat`, `${treatsSupply.name} · ${Math.max(0, treatsSupply.level - 15)}% left`);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">How much food?</h2>
      <p className="mt-0.5 text-[13px] text-label-2">For {pet.name} · {pet.cupGrams} g per full cup</p>
      <div className="mt-5">
        <Segmented options={PORTIONS} value={fraction} onChange={setFraction} />
      </div>
      <div className="mt-7">
        <AccentButton onClick={confirmFeed}>Log feeding</AccentButton>
      </div>
      {treatsSupply && (
        <div className="mt-6 border-t border-fill pt-5">
          <h3 className="text-[15px] font-bold text-label">Give a treat instead?</h3>
          <p className="mt-0.5 text-[13px] text-label-2">{treatsSupply.name} · {treatsSupply.level}% left</p>
          <div className="mt-3">
            <AccentButton variant="tinted" onClick={confirmTreat}>Give treat</AccentButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}
