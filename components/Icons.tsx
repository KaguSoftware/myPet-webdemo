import type { ActionType } from "@/lib/data";

export type IconName =
  | "home" | "bell" | "heart-text" | "bag" | "people"
  | "plus" | "chevron-right" | "chevron-left" | "check" | "xmark"
  | "bowl" | "drop" | "broom" | "paw" | "scissors" | "pill" | "stethoscope"
  | "calendar" | "clock" | "lock" | "star" | "coin" | "sparkles" | "flame" | "arrow-up"
  | "chart" | "box" | "gear" | "cross" | "refresh" | "pin" | "cube"
  | "list" | "eye" | "person";

/*
 * Pixel-art icon set. Each icon is a grid of strings; "X" = filled (currentColor),
 * "." / space = transparent. Rendered as run-length-merged <rect> blocks with
 * crispEdges so they match the pixel pets. Most are 9×9; a few are wider/taller.
 */
const G: Record<IconName, string[]> = {
  home: [
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXXXXXXX",
    ".XX...XX.",
    ".XX.X.XX.",
    ".XX.X.XX.",
    ".XXXXXXX.",
  ],
  bell: [
    "....X....",
    "...XXX...",
    "..XXXXX..",
    "..XXXXX..",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXXXXXXX",
    ".........",
    "....X....",
  ],
  "heart-text": [
    ".........",
    ".XX...XX.",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    "....X....",
  ],
  bag: [
    ".........",
    "..XX.XX..",
    "..XX.XX..",
    ".XXXXXXX.",
    ".XXXXXXX.",
    ".XXXXXXX.",
    ".XXXXXXX.",
    ".XXXXXXX.",
    "..XXXXX..",
  ],
  people: [
    "..X...X..",
    ".XXX.XXX.",
    ".XXX.XXX.",
    "..X...X..",
    ".........",
    ".XXX.XXX.",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
  ],
  plus: [
    ".........",
    "....X....",
    "....X....",
    "....X....",
    ".XXXXXXX.",
    "....X....",
    "....X....",
    "....X....",
    ".........",
  ],
  "chevron-right": [
    "...X.....",
    "...XX....",
    "....XX...",
    ".....XX..",
    "......XX.",
    ".....XX..",
    "....XX...",
    "...XX....",
    "...X.....",
  ],
  check: [
    ".........",
    ".......XX",
    "......XX.",
    ".X...XX..",
    ".XX.XX...",
    "..XXX....",
    "...X.....",
    ".........",
    ".........",
  ],
  xmark: [
    ".........",
    ".XX...XX.",
    "..XX.XX..",
    "...XXX...",
    "....X....",
    "...XXX...",
    "..XX.XX..",
    ".XX...XX.",
    ".........",
  ],
  bowl: [
    ".........",
    ".........",
    "..X.X.X..",
    "..X.X.X..",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    ".........",
  ],
  drop: [
    "....X....",
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XXXXXXX.",
    ".XXXXXXX.",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
  ],
  broom: [
    "......XX.",
    ".....XX..",
    "....XX...",
    "...XX....",
    "..XXX....",
    ".XXXXX...",
    ".XXXXX...",
    "XX.XX.X..",
    "X..X..X..",
  ],
  paw: [
    ".XX...XX.",
    ".XX...XX.",
    ".........",
    "XX.XX.XX.",
    "XX.XX.XX.",
    ".........",
    "..XXXXX..",
    ".XXXXXXX.",
    ".XXXXXXX.",
  ],
  scissors: [
    "XX.....X.",
    "XX....XX.",
    ".XX..XX..",
    "..XXXX...",
    "...XX....",
    "..XXXX...",
    ".XX..XX..",
    "XX....XX.",
    "XX.....X.",
  ],
  pill: [
    ".......XX",
    "......XXX",
    ".....XXXX",
    "....XXXX.",
    "...XXXX..",
    "..XXXX...",
    "XXXX.....",
    "XXX......",
    "XX.......",
  ],
  stethoscope: [
    "XX.....XX",
    "XX.....XX",
    ".X.....X.",
    ".X.....X.",
    "..XXXXX..",
    "....X....",
    "....X..XX",
    "....XX.XX",
    ".....XX..",
  ],
  calendar: [
    "..X...X..",
    "..X...X..",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "X.X.X.X.X",
    "X.......X",
    "X.X.X.X.X",
    "X.......X",
    "XXXXXXXXX",
  ],
  clock: [
    "..XXXXX..",
    ".X..X..X.",
    "X...X...X",
    "X...X...X",
    "X...XXX.X",
    "X.......X",
    "X.......X",
    ".X.....X.",
    "..XXXXX..",
  ],
  lock: [
    "..XXXXX..",
    ".XX...XX.",
    ".XX...XX.",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "XXX.X.XXX",
    "XXX.X.XXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
  ],
  star: [
    "....X....",
    "....X....",
    "...XXX...",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "..XX.XX..",
    ".XX...XX.",
    ".X.....X.",
  ],
  coin: [
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXX.XXXX",
    "XXX.X.XXX",
    "XXX.X.XXX",
    "XXX.X.XXX",
    "XXXX.XXXX",
    ".XXXXXXX.",
    "..XXXXX..",
  ],
  sparkles: [
    "....X....",
    "..X.X.X..",
    "...XXX...",
    ".XXXXXXX.",
    "...XXX...",
    "..X.X.X..",
    "....X..XX",
    ".......XX",
    ".........",
  ],
  flame: [
    "....X....",
    "...XX....",
    "..XXX....",
    "..XXXX...",
    ".XX.XXX..",
    ".XX..XX..",
    "XX.X..XX.",
    "XX.XX.XX.",
    ".XXXXXX..",
  ],
  "arrow-up": [
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XX.X.XX.",
    "X..XXX..X",
    "....X....",
    "....X....",
    "....X....",
    ".........",
  ],
  "chevron-left": [
    ".....X...",
    "....XX...",
    "...XX....",
    "..XX.....",
    ".XX......",
    "..XX.....",
    "...XX....",
    "....XX...",
    ".....X...",
  ],
  chart: [
    "X........",
    "X........",
    "X....XX..",
    "X..XX.XX.",
    "X.XX...XX",
    "XXX......",
    "X........",
    "X........",
    "XXXXXXXXX",
  ],
  box: [
    ".XXXXXXX.",
    "XXXXXXXXX",
    "XX.....XX",
    "XX.XXX.XX",
    "XX.....XX",
    "XX.....XX",
    "XX.....XX",
    "XXXXXXXXX",
    ".XXXXXXX.",
  ],
  gear: [
    "...XXX...",
    "X..XXX..X",
    "XXX.X.XXX",
    "XX.....XX",
    "X..XXX..X",
    "XX.....XX",
    "XXX.X.XXX",
    "X..XXX..X",
    "...XXX...",
  ],
  cross: [
    "...XXX...",
    "...XXX...",
    "...XXX...",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "...XXX...",
    "...XXX...",
    "...XXX...",
  ],
  refresh: [
    "..XXXXX..",
    ".XX...XX.",
    "XX.....X.",
    "XX....XXX",
    "XX.....X.",
    "XX.....X.",
    ".XX...XX.",
    "..XXXXX..",
    ".........",
  ],
  pin: [
    "..XXXXX..",
    ".XX...XX.",
    "XX.....XX",
    "XX.XXX.XX",
    "XX.....XX",
    ".XX...XX.",
    "..XX.XX..",
    "...XXX...",
    "....X....",
  ],
  cube: [
    "..XXXXX..",
    ".XX.X.XX.",
    "XX..X..XX",
    "X...X...X",
    "XXXXXXXXX",
    "X...X...X",
    "XX..X..XX",
    ".XX.X.XX.",
    "..XXXXX..",
  ],
  list: [
    ".........",
    ".XX.XXXXX",
    ".XX.XXXXX",
    ".........",
    ".XX.XXXXX",
    ".XX.XXXXX",
    ".........",
    ".XX.XXXXX",
    ".XX.XXXXX",
  ],
  eye: [
    ".........",
    ".........",
    "..XXXXX..",
    ".XX...XX.",
    ".X..X..X.",
    ".XX...XX.",
    "..XXXXX..",
    ".........",
    ".........",
  ],
  person: [
    "...XXX...",
    "..XXXXX..",
    "..XXXXX..",
    "...XXX...",
    ".........",
    ".XXXXXXX.",
    "XXXXXXXXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
  ],
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
  const rows = G[name];
  const h = rows.length;
  const w = rows[0].length;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    let x = 0;
    while (x < w) {
      if (row[x] !== "X") {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < w && row[x + run] === "X") run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} />);
      x += run;
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${w} ${h}`}
      fill="currentColor"
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {rects}
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
