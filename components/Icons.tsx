import type { ActionType } from "@/lib/data";

export type IconName =
  | "home" | "bell" | "heart-text" | "bag" | "people"
  | "plus" | "chevron-right" | "chevron-left" | "check" | "xmark"
  | "bowl" | "drop" | "broom" | "paw" | "scissors" | "pill" | "stethoscope"
  | "calendar" | "clock" | "lock" | "star" | "coin" | "sparkles" | "flame" | "arrow-up"
  | "chart" | "box" | "gear" | "cross" | "refresh" | "pin" | "cube"
  | "list" | "eye" | "person"
  | "yarn" | "clipper" | "shield" | "door"
  | "syringe" | "repeat" | "share" | "gift"
  | "alert" | "trash" | "scale";

/*
 * Clean stroke icon set (SF Symbols / Lucide register): 24×24 grid,
 * stroke="currentColor", strokeWidth 2, round caps and joins. The pixel-art
 * language is reserved for the pets and their world (sprites, cosmetics);
 * UI chrome uses these neutral icons. Small filled dots use fill="currentColor"
 * with stroke="none" on the element itself.
 */
const P: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 9.5 9-7 9 7V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9 21v-8h6v8" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8.5a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 14.5 6 8.5" />
      <path d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  "heart-text": (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
  ),
  bag: (
    <>
      <path d="M6 2.5 3.5 6v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V6L18 2.5Z" />
      <path d="M3.5 6h17" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M2.5 20.5v-1a5.5 5.5 0 0 1 5.5-5.5h2a5.5 5.5 0 0 1 5.5 5.5v1" />
      <path d="M16 4.3a3.5 3.5 0 0 1 0 6.4" />
      <path d="M18.5 14.3a5.5 5.5 0 0 1 3 4.9v1.3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  check: <path d="m4 12.5 5.5 5.5L20 6.5" />,
  xmark: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  bowl: (
    <>
      <path d="M4 12.5h16" />
      <path d="M4.5 12.5a7.5 7.5 0 0 0 15 0" />
      <circle cx="9" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  drop: (
    <path d="M12 21.5a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5-2 1.6-3 3.5-3 5.5a7 7 0 0 0 7 7Z" />
  ),
  broom: (
    <>
      <path d="m19.5 3.5-7.8 7.8" />
      <path d="M11.7 11.3a4.6 4.6 0 0 0-6.5 0L3.5 13l7.5 7.5 1.7-1.7a4.6 4.6 0 0 0 0-6.5Z" />
      <path d="m7 15.5-2 2" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="8.5" r="1.8" />
      <circle cx="12" cy="6.5" r="1.8" />
      <circle cx="17" cy="8.5" r="1.8" />
      <path d="M12 11.5c-2.9 0-5.3 2.1-5.3 4.6 0 1.7 1.3 3 3 3 .9 0 1.6-.4 2.3-.4s1.4.4 2.3.4c1.7 0 3-1.3 3-3 0-2.5-2.4-4.6-5.3-4.6Z" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="2.7" />
      <circle cx="6" cy="18" r="2.7" />
      <path d="M8.2 8.2 20 20" />
      <path d="M20 4 8.2 15.8" />
    </>
  ),
  pill: (
    <>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3H4a1 1 0 0 0-1 1v5a6 6 0 0 0 12 0V4a1 1 0 0 0-1-1h-1" />
      <path d="M9 15v2a5.5 5.5 0 0 0 11 0v-3" />
      <circle cx="20" cy="11.5" r="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M8 2.5v4" />
      <path d="M16 2.5v4" />
      <path d="M3.5 10h17" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9Z" />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 4.5 12.7 9 17 10.5 12.7 12 11 16.5 9.3 12 5 10.5 9.3 9Z" />
      <path d="M18.5 15.5v5" />
      <path d="M16 18h5" />
    </>
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
  ),
  "arrow-up": (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v15a2 2 0 0 0 2 2h15" />
      <path d="m7.5 14 4-4.5 3 3 5-5.5" />
    </>
  ),
  box: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <path d="M5 9v9.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M10 13.5h4" />
    </>
  ),
  gear: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  cross: <path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5Z" />,
  refresh: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" />
      <path d="M3.5 3.5v5h5" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10.5c0 5.5-8 11.5-8 11.5s-8-6-8-11.5a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10.5" r="3" />
    </>
  ),
  cube: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  list: (
    <>
      <path d="M8.5 6h12" />
      <path d="M8.5 12h12" />
      <path d="M8.5 18h12" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20.5a7 7 0 0 1 14 0" />
    </>
  ),
  yarn: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M4.6 9.2c3.9.4 7.3 2.3 9.9 6.3" />
      <path d="M6.6 17.2c2.3-3 6-4.6 10.3-4.1" />
    </>
  ),
  clipper: (
    <>
      <path d="M4 16.5 14.5 6a2.47 2.47 0 0 1 3.5 3.5L7.5 20H4Z" />
      <path d="m14 8.5 3.5 3.5" />
      <path d="M17.5 15.5 20 18" />
    </>
  ),
  shield: (
    <path d="M12 2.5 19.5 5v6c0 4.8-3.2 8.9-7.5 10.5C7.7 19.9 4.5 15.8 4.5 11V5Z" />
  ),
  door: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V4.5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 4.5V21" />
      <circle cx="14.8" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.9 17.9A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6.5h17" />
      <path d="M19 6.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5" />
      <path d="M8.5 6.5V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  scale: (
    <>
      <circle cx="12" cy="5.5" r="3" />
      <path d="M7 8.5a2 2 0 0 0-1.9 1.4l-2.5 9A2 2 0 0 0 4.5 21.5h15a2 2 0 0 0 1.9-2.6l-2.5-9A2 2 0 0 0 17 8.5Z" />
    </>
  ),
  syringe: (
    <>
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v12" />
      <path d="m8 6.5 4-4 4 4" />
      <path d="M7.5 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5a2 2 0 0 0-2-2h-1.5" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M12 8v13" />
      <path d="M12 8H8.5a2.25 2.25 0 1 1 0-4.5C11 3.5 12 8 12 8Z" />
      <path d="M12 8h3.5a2.25 2.25 0 1 0 0-4.5C13 3.5 12 8 12 8Z" />
    </>
  ),
};

export function Icon({
  name,
  size = 22,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {P[name]}
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
