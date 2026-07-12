export type ActionType = "fed" | "water" | "litter" | "walk" | "groomed" | "meds" | "vet";

export type CosmeticSlot = "head" | "face" | "neck" | "body";

export interface Cosmetic {
  id: string;
  name: string;
  emoji: string;
  price: number;
  slot: CosmeticSlot;
}

export interface Pet {
  id: string;
  name: string;
  species: "cat" | "dog";
  breed: string;
  emoji: string;
  ageYears: number;
  weightKg: number;
  owned: string[];
  equipped: Partial<Record<CosmeticSlot, string>>;
}

export interface Member {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

export interface Activity {
  id: string;
  petId: string;
  memberId: string;
  type: ActionType;
  ts: number;
  note?: string;
}

export interface Reminder {
  id: string;
  petId: string;
  title: string;
  emoji: string;
  due: number;
  done: boolean;
  source: "manual" | "plan";
}

export interface AppState {
  currentMemberId: string;
  premium: boolean;
  coins: number;
  xp: number;
  streak: number;
  pets: Pet[];
  members: Member[];
  activities: Activity[];
  reminders: Reminder[];
  bookedVet: boolean;
}

export const ACTIONS: Record<ActionType, { label: string; emoji: string; verb: string }> = {
  fed: { label: "Fed", emoji: "🍖", verb: "fed" },
  water: { label: "Water", emoji: "💧", verb: "gave water to" },
  litter: { label: "Litter", emoji: "🧹", verb: "cleaned the litter for" },
  walk: { label: "Walk", emoji: "🦮", verb: "walked" },
  groomed: { label: "Groomed", emoji: "✂️", verb: "groomed" },
  meds: { label: "Meds", emoji: "💊", verb: "gave meds to" },
  vet: { label: "Vet", emoji: "🩺", verb: "took to the vet" },
};

export const COSMETICS: Cosmetic[] = [
  { id: "tophat", name: "Top Hat", emoji: "🎩", price: 120, slot: "head" },
  { id: "crown", name: "Royal Crown", emoji: "👑", price: 250, slot: "head" },
  { id: "cap", name: "Baseball Cap", emoji: "🧢", price: 60, slot: "head" },
  { id: "party", name: "Party Hat", emoji: "🥳", price: 80, slot: "head" },
  { id: "santa", name: "Cozy Beanie", emoji: "🎅", price: 90, slot: "head" },
  { id: "sunglasses", name: "Cool Shades", emoji: "🕶️", price: 70, slot: "face" },
  { id: "glasses", name: "Smart Glasses", emoji: "👓", price: 50, slot: "face" },
  { id: "monocle", name: "Monocle", emoji: "🧐", price: 110, slot: "face" },
  { id: "bowtie", name: "Bow Tie", emoji: "🎀", price: 45, slot: "neck" },
  { id: "scarf", name: "Winter Scarf", emoji: "🧣", price: 65, slot: "neck" },
  { id: "medal", name: "Good Pet Medal", emoji: "🏅", price: 150, slot: "neck" },
  { id: "tux", name: "Tiny Tuxedo", emoji: "🤵", price: 300, slot: "body" },
  { id: "shirt", name: "Hawaiian Shirt", emoji: "👕", price: 85, slot: "body" },
  { id: "cape", name: "Hero Cape", emoji: "🦸", price: 200, slot: "body" },
];

export const VET = {
  name: "Dr. Sarah Chen",
  clinic: "Sunny Paws Veterinary Clinic",
  rating: 4.9,
  distanceKm: 2.3,
  emoji: "👩‍⚕️",
};

export interface PlanItem {
  emoji: string;
  title: string;
  detail: string;
  cadence: string;
  perDay?: number;
  action?: ActionType;
}

export const CARE_PLANS: Record<string, { intro: string; items: PlanItem[] }> = {
  "British Shorthair": {
    intro:
      "Vet-built plan for an adult British Shorthair. This breed loves food and gains weight easily, so portion control is everything.",
    items: [
      { emoji: "🍖", title: "Feeding", detail: "65 g dry food per meal, 3 meals a day (195 g total). No free-feeding — this breed overeats.", cadence: "3× daily", perDay: 3, action: "fed" },
      { emoji: "💧", title: "Fresh water", detail: "Refresh the bowl twice a day. Shorthairs are prone to kidney issues — hydration matters.", cadence: "2× daily", perDay: 2, action: "water" },
      { emoji: "🧹", title: "Litter", detail: "Scoop daily, full change weekly with unscented clumping litter.", cadence: "Daily", perDay: 1, action: "litter" },
      { emoji: "✂️", title: "Brushing", detail: "Dense double coat — brush 2× a week, daily during spring shedding.", cadence: "2× weekly", action: "groomed" },
      { emoji: "⚖️", title: "Weight check", detail: "Target 4.5–5.5 kg. Weigh monthly; adjust portions by ±5 g per meal.", cadence: "Monthly" },
      { emoji: "🩺", title: "Vet checkup", detail: "Full checkup every 6 months incl. dental — the breed is prone to gingivitis.", cadence: "Every 6 months", action: "vet" },
      { emoji: "🪥", title: "Dental care", detail: "Dental treats 3× a week, teeth brushing if tolerated.", cadence: "3× weekly" },
    ],
  },
  "Golden Retriever": {
    intro:
      "Vet-built plan for an adult Golden Retriever. High-energy breed — exercise and joint care are the priorities.",
    items: [
      { emoji: "🍖", title: "Feeding", detail: "180 g kibble per meal, 2 meals a day. Add joint supplement (glucosamine) to breakfast.", cadence: "2× daily", perDay: 2, action: "fed" },
      { emoji: "🦮", title: "Exercise", detail: "Minimum 2 walks a day, 30–45 min each. One should include off-leash play or fetch.", cadence: "2× daily", perDay: 2, action: "walk" },
      { emoji: "💧", title: "Fresh water", detail: "Large bowl, refresh twice daily — more after exercise in warm weather.", cadence: "2× daily", perDay: 2, action: "water" },
      { emoji: "✂️", title: "Brushing", detail: "Heavy shedder — brush 3× a week with an undercoat rake.", cadence: "3× weekly", action: "groomed" },
      { emoji: "🛁", title: "Bath", detail: "Every 6–8 weeks with oatmeal shampoo. More often if they find mud (they will).", cadence: "6–8 weeks" },
      { emoji: "🩺", title: "Vet checkup", detail: "Annual checkup + hip screening. Goldens are prone to hip dysplasia.", cadence: "Yearly", action: "vet" },
      { emoji: "👂", title: "Ear check", detail: "Floppy ears trap moisture — check and wipe weekly to prevent infections.", cadence: "Weekly" },
    ],
  },
};

const now = Date.now();
const H = 3600_000;
const D = 24 * H;

export const SEED: AppState = {
  currentMemberId: "you",
  premium: false,
  coins: 340,
  xp: 260,
  streak: 4,
  bookedVet: false,
  members: [
    { id: "you", name: "Parsa", emoji: "🧑‍💻", role: "Pet parent" },
    { id: "mom", name: "Mom", emoji: "👩‍🦰", role: "Chief treat officer" },
    { id: "dad", name: "Dad", emoji: "👨‍🦳", role: "Walk specialist" },
    { id: "sara", name: "Sara", emoji: "👧", role: "Cuddle department" },
  ],
  pets: [
    {
      id: "whiskers",
      name: "Whiskers",
      species: "cat",
      breed: "British Shorthair",
      emoji: "🐱",
      ageYears: 3,
      weightKg: 4.8,
      owned: ["bowtie", "glasses"],
      equipped: { neck: "bowtie" },
    },
    {
      id: "biscuit",
      name: "Biscuit",
      species: "dog",
      breed: "Golden Retriever",
      emoji: "🐶",
      ageYears: 2,
      weightKg: 29.5,
      owned: ["cap"],
      equipped: { head: "cap" },
    },
  ],
  activities: [
    { id: "a1", petId: "whiskers", memberId: "mom", type: "fed", ts: now - 3 * H },
    { id: "a2", petId: "biscuit", memberId: "dad", type: "walk", ts: now - 4 * H },
    { id: "a3", petId: "whiskers", memberId: "sara", type: "water", ts: now - 6 * H },
    { id: "a4", petId: "biscuit", memberId: "you", type: "fed", ts: now - 7 * H },
    { id: "a5", petId: "whiskers", memberId: "you", type: "litter", ts: now - 26 * H },
    { id: "a6", petId: "biscuit", memberId: "mom", type: "groomed", ts: now - 30 * H },
    { id: "a7", petId: "whiskers", memberId: "dad", type: "fed", ts: now - 28 * H },
    { id: "a8", petId: "biscuit", memberId: "sara", type: "walk", ts: now - 32 * H },
    { id: "a9", petId: "whiskers", memberId: "mom", type: "meds", ts: now - 2 * D - 5 * H },
    { id: "a10", petId: "whiskers", memberId: "you", type: "vet", ts: now - 12 * D, note: "Regular checkup — all healthy!" },
  ],
  reminders: [
    { id: "r1", petId: "whiskers", title: "Flea treatment", emoji: "💊", due: now + 1 * D, done: false, source: "manual" },
    { id: "r2", petId: "biscuit", title: "Buy more kibble", emoji: "🛒", due: now + 2 * D, done: false, source: "manual" },
    { id: "r3", petId: "whiskers", title: "Full litter change", emoji: "🧹", due: now + 3 * D, done: false, source: "manual" },
    { id: "r4", petId: "biscuit", title: "Bath day", emoji: "🛁", due: now + 5 * D, done: false, source: "manual" },
  ],
};

export function cosmetic(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}
