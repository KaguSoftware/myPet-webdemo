"use client";

import { useState } from "react";
import { InitialAvatar } from "./PetAvatar";
import PixelPet from "./pixel/PixelPet";
import { Icon, IconName } from "./Icons";
import { AccentButton } from "./ui";
import { useStore } from "@/lib/store";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "bell", title: "Log care together", body: "Feed, walk, clean — everyone in the family gets notified instantly." },
  { icon: "heart-text", title: "Vet-built care plans", body: "Breed-specific guidance so you always know what your pet needs." },
  { icon: "bag", title: "Dress up & play", body: "Earn coins caring for your pet, then spoil them with pixel outfits." },
];

export default function Welcome() {
  const { state, hydrated, setSeenWelcome } = useStore();
  const [step, setStep] = useState(0);

  if (!hydrated || state.seenWelcome || state.pets.length === 0) return null;

  const finish = () => setSeenWelcome(true);
  const [catPet, dogPet] = state.pets;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg md:rounded-[2.7rem]">
      <div className="arcade-stage flex flex-1 flex-col items-center justify-center px-7 text-center">
        {step === 0 && (
          <>
            <div className="flex items-end gap-3">
              <PixelPet pet={catPet} size={92} idle />
              {dogPet && <PixelPet pet={dogPet} size={92} idle />}
            </div>
            <h1 className="font-pixel mt-8 text-[20px] leading-relaxed text-label">PetPal</h1>
            <p className="mt-3 max-w-[280px] text-[15px] leading-relaxed text-label-2">
              The family hub for taking care of your pets — together. Let&apos;s take a quick look.
            </p>
          </>
        )}

        {step === 1 && (
          <div className="w-full max-w-[320px]">
            <h2 className="text-[24px] font-bold tracking-[-0.02em] text-label">What you can do</h2>
            <div className="mt-6 space-y-4 text-left">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-label">{f.title}</p>
                    <p className="text-[13px] leading-snug text-label-2">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-[320px]">
            <h2 className="text-[24px] font-bold tracking-[-0.02em] text-label">Meet the family</h2>
            <p className="mt-2 text-[14px] text-label-2">These are the family members on your account.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {state.members.map((m) => (
                <div key={m.id} className="glass flex items-center gap-2.5 rounded-card p-3">
                  <InitialAvatar name={m.name} gradient={m.gradient} size={36} />
                  <div className="min-w-0 text-left">
                    <p className="truncate text-[14px] font-semibold text-label">{m.name}</p>
                    <p className="truncate text-[12px] text-label-2">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-label-3">Switch between them anytime from the Family tab.</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-7 pb-9">
        <div className="mb-4 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-[7px] rounded-full transition-all ${i === step ? "w-5 bg-accent" : "w-[7px] bg-[oklch(0.22_0.01_264/0.18)]"}`} />
          ))}
        </div>
        <AccentButton onClick={() => (step < 2 ? setStep(step + 1) : finish())}>
          {step < 2 ? "Next" : "Start exploring"}
        </AccentButton>
        {step < 2 && (
          <button onClick={finish} className="mt-3 w-full text-center text-[14px] font-semibold text-label-2">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
