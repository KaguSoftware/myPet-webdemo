import type { Sprite } from "./PixelSprite";

/*
 * 16×16 pet faces. Palette:
 *   . transparent   O dark outline   B body/fur   S shade   W muzzle/light
 *   e eye           n nose/mouth     p pink (ears/tongue)
 * Body colors are placeholders; per-pet tint is applied by recoloring `B`/`S`
 * at render time via spriteWithFur().
 */
export const CAT_SPRITE: Sprite = {
  palette: { O: "#2b2b3a", B: "#f4a63c", S: "#d9822b", W: "#fff3dd", e: "#2b2b3a", n: "#7a3b2e", p: "#f3a5b8" },
  rows: [
    "................",
    ".OO........OO...",
    ".OBO......OBO...",
    ".OBBO....OBBO...",
    ".OBpBOOOOBpBO...",
    ".OBBBBBBBBBBBO..",
    "OBBBBBBBBBBBBBO.",
    "OBBeBBBBBBeBBBO.",
    "OBBBBBBBBBBBBBO.",
    "OBBBBBWWWWBBBBO.",
    "OBBSBWWnnWWBSBO.",
    "OBBBBWWppWWBBBO.",
    ".OBBBWWWWWWBBBO.",
    ".OBBBBBBBBBBBBO.",
    "..OBBBBBBBBBBO..",
    "...OOOOOOOOOO...",
  ],
};

export const DOG_SPRITE: Sprite = {
  palette: { O: "#2b2b3a", B: "#e9b872", S: "#c98f4a", W: "#fff3dd", e: "#2b2b3a", n: "#3a2a22", p: "#f3a5b8" },
  rows: [
    "................",
    ".OOO......OOO...",
    "OSSSO....OSSSO..",
    "OSSSSOOOOSSSSO..",
    "OSSBBBBBBBBSSO..",
    ".OBBBBBBBBBBO...",
    "OBBBBBBBBBBBBO..",
    "OBBeBBBBBBeBBO..",
    "OBBBBBBBBBBBBO..",
    "OBBBBWWWWWWBBBO.",
    "OBBBWWWnnWWWBBO.",
    ".OBBWWnnnnWWBO..",
    ".OBBWWppppWWBO..",
    "..OBBWWWWWWBO...",
    "...OBBBBBBBO....",
    "....OOOOOOO.....",
  ],
};

/** Recolor the base fur (B/S) to a pet's own tone while keeping outlines/eyes. */
export function furSprite(base: Sprite, body: string, shade: string): Sprite {
  return { ...base, palette: { ...base.palette, B: body, S: shade } };
}

/** Solid fur tones per species keep the pixel look readable on any bg. */
export const CAT_FUR = { body: "#f4a63c", shade: "#d9822b" };
export const DOG_FUR = { body: "#e9b872", shade: "#c98f4a" };
