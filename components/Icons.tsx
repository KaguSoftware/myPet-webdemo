import type { ActionType } from "@/lib/data";

export type IconName =
  | "home" | "bell" | "heart-text" | "bag" | "people"
  | "plus" | "chevron-right" | "check" | "xmark"
  | "bowl" | "drop" | "broom" | "paw" | "scissors" | "pill" | "stethoscope"
  | "calendar" | "clock" | "lock" | "star" | "coin" | "sparkles" | "flame" | "arrow-up";

/* SF-Symbols-style stroke paths, 24×24 viewBox */
const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1h3.3v-5.2a2.2 2.2 0 0 1 4.4 0V20h3.3a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  bell: (
    <>
      <path d="M12 4a5.6 5.6 0 0 0-5.6 5.6c0 4.2-1.6 5.6-2.4 6.4h16c-.8-.8-2.4-2.2-2.4-6.4A5.6 5.6 0 0 0 12 4Z" />
      <path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0" />
    </>
  ),
  "heart-text": (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="M12 15.4s-3.2-1.9-3.2-4.1c0-1.2.9-2 2-2 .7 0 1.1.4 1.2.7.1-.3.5-.7 1.2-.7 1.1 0 2 .8 2 2 0 2.2-3.2 4.1-3.2 4.1Z" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 8.5h13l-.9 10.1a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5.5 8.5Z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19.5c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.6M17.3 14.9c1.8.5 3 1.9 3.4 4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-right": <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  xmark: <path d="M6 6l12 12M18 6 6 18" />,
  bowl: (
    <>
      <path d="M4 12h16a8 8 0 0 1-4.6 6.6l.3 1.4H8.3l.3-1.4A8 8 0 0 1 4 12Z" />
      <path d="M9 8.8c0-1.2 1-1.8 1-3M13.5 8.8c0-1.2 1-1.8 1-3" />
    </>
  ),
  drop: <path d="M12 3.5S6 10 6 14.2a6 6 0 0 0 12 0C18 10 12 3.5 12 3.5Z" />,
  broom: (
    <>
      <path d="m14.5 4 3 3-5.2 5.2-3-3L14.5 4Z" />
      <path d="M9.3 9.2 4.5 17c-.8 1.3.2 2.9 1.7 2.9h9.3c-1.5-2-2.2-4.5-3.2-7.7" />
      <path d="M8 16.5c1 .8 2.5 1.4 4 1.6" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="7.2" cy="9.2" rx="1.7" ry="2.2" />
      <ellipse cx="16.8" cy="9.2" rx="1.7" ry="2.2" />
      <ellipse cx="10" cy="5.8" rx="1.7" ry="2.2" />
      <ellipse cx="14" cy="5.8" rx="1.7" ry="2.2" />
      <path d="M12 12c2.6 0 4.8 2 4.8 4.2 0 1.5-1.2 2.6-2.6 2.3-.9-.2-1.5-.5-2.2-.5s-1.3.3-2.2.5c-1.4.3-2.6-.8-2.6-2.3C7.2 14 9.4 12 12 12Z" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6.5" cy="7" r="2.5" />
      <circle cx="6.5" cy="17" r="2.5" />
      <path d="M8.7 8.3 19.5 17M8.7 15.7 19.5 7" />
    </>
  ),
  pill: (
    <>
      <rect x="3.5" y="9" width="17" height="6.5" rx="3.25" transform="rotate(-35 12 12)" />
      <path d="m9 9.9 4.7 6" transform="rotate(2 12 12)" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 4.5v5a4 4 0 0 0 8 0v-5" />
      <path d="M10 13.5v2.3a4.2 4.2 0 0 0 8.4 0v-2" />
      <circle cx="18.4" cy="11.5" r="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  star: (
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.5.9-5.2-3.8-3.7 5.2-.7L12 4Z" />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.8v8.4M14.8 9.5c-.5-1-1.6-1.5-2.8-1.5-1.5 0-2.7.9-2.7 2.1 0 2.9 5.4 1.4 5.4 4.2 0 1.2-1.2 2.1-2.7 2.1-1.2 0-2.3-.5-2.8-1.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4.5 13.6 9l4.4 1.5-4.4 1.5L12 16.5 10.4 12 6 10.5 10.4 9 12 4.5Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  flame: (
    <path d="M12 3.5c.6 3-1.3 4.6-2.6 6.2C8 11.4 7 12.9 7 15a5 5 0 0 0 10 0c0-2.5-1.3-4.4-2.5-5.7-.3 1-.8 1.8-1.7 2.4.3-3.1-.5-6-.8-8.2Z" />
  ),
  "arrow-up": <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
};

export function Icon({
  name,
  size = 22,
  strokeWidth = 1.8,
  className = "",
  filled = false,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0.5 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}

export const ACTION_ICON: Record<ActionType, { icon: IconName; tint: string; bg: string }> = {
  fed: { icon: "bowl", tint: "text-orange", bg: "bg-orange-soft" },
  water: { icon: "drop", tint: "text-accent", bg: "bg-accent-soft" },
  litter: { icon: "broom", tint: "text-label-2", bg: "bg-fill" },
  walk: { icon: "paw", tint: "text-green", bg: "bg-green-soft" },
  groomed: { icon: "scissors", tint: "text-[oklch(0.6_0.16_320)]", bg: "bg-[oklch(0.6_0.16_320/0.1)]" },
  meds: { icon: "pill", tint: "text-red", bg: "bg-[oklch(0.6_0.21_25/0.1)]" },
  vet: { icon: "stethoscope", tint: "text-[oklch(0.55_0.14_200)]", bg: "bg-[oklch(0.55_0.14_200/0.1)]" },
};
