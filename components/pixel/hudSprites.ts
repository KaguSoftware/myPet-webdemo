import type { Sprite } from "./PixelSprite";

/* Tiny HUD glyphs — coin, heart, star — for the arcade counters. */
export const COIN_SPRITE: Sprite = {
  palette: { O: "#a8791d", Y: "#f5c542", H: "#fff0b8", S: "#d99f2b" },
  rows: [
    ".OOOO.",
    "OYYYYO",
    "OYHHSO",
    "OYHSSO",
    "OSSSSO",
    ".OOOO.",
  ],
};

export const HEART_SPRITE: Sprite = {
  palette: { O: "#8f1f3a", R: "#e0443f", H: "#f7a8a0" },
  rows: [
    ".OO.OO.",
    "OHRRRHO",
    "ORRRRRO",
    ".ORRRO.",
    "..ORO..",
    "...O...",
  ],
};

export const STAR_SPRITE: Sprite = {
  palette: { O: "#a8791d", Y: "#f5c542", H: "#fff0b8" },
  rows: [
    "...O...",
    "..OYO..",
    "OOYHYOO",
    ".OYYYO.",
    ".OY.YO.",
    "O.O.O.O",
  ],
};
