"use client";

const EMOJI = ["🎉", "⭐", "💖", "🐾", "✨"];

export default function Confetti({ burst }: { burst: number }) {
  if (!burst) return null;
  return (
    <div key={burst} className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 90 + (i % 4) * 35;
        return (
          <span
            key={i}
            className="confetti-piece absolute left-1/2 top-1/3 text-xl"
            style={{
              ["--cx" as string]: `${Math.cos(angle) * dist}px`,
              ["--cy" as string]: `${Math.sin(angle) * dist + 60}px`,
            }}
          >
            {EMOJI[i % EMOJI.length]}
          </span>
        );
      })}
    </div>
  );
}
