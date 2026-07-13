export type ActionType = "fed" | "water" | "litter" | "walk" | "groomed" | "meds" | "vet";

export type CosmeticSlot = "head" | "face" | "neck" | "body";

export interface Cosmetic {
  id: string;
  name: string;
  emoji: string;
  price: number;
  slot: CosmeticSlot;
}

export interface WeightPoint {
  ts: number;
  kg: number;
}

export interface Supply {
  id: string;
  name: string;
  icon: string; // IconName (kept as string to avoid a data↔icons import cycle)
  level: number; // 0-100
}

export interface Pet {
  id: string;
  name: string;
  species: "cat" | "dog";
  breed: string;
  sex?: "male" | "female";
  emoji: string;
  ageYears: number;
  weightKg: number;
  owned: string[];
  equipped: Partial<Record<CosmeticSlot, string>>;
  gradient: [string, string];
  weights: WeightPoint[];
  supplies: Supply[];
}

export interface Member {
  id: string;
  name: string;
  emoji: string;
  role: string;
  gradient: [string, string];
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
  /** Auto-generated health alert (e.g. over/under-feeding) rather than a manual/plan reminder. */
  alert?: boolean;
  /** Vet suggested alongside an alert reminder, for a "Book vet" CTA. */
  vetId?: string;
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
  bookedVetIds: string[];
  seenWelcome: boolean;
  units: "kg" | "lb";
  /** Household id, shown to the family as a shareable "Family ID". */
  familyId: string;
  /** Whether the family admin has set a password — the hash itself never reaches client state. */
  familyPasswordSet: boolean;
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

export interface Vet {
  id: string;
  name: string;
  clinic: string;
  rating: number;
  distanceKm: number;
  gradient: [string, string];
  sponsored: boolean;
  specialties: string[];
  openNow: boolean;
}

export const VETS: Vet[] = [
  {
    id: "chen",
    name: "Dr. Sarah Chen",
    clinic: "Sunny Paws Veterinary Clinic",
    rating: 4.9,
    distanceKm: 2.3,
    gradient: ["oklch(0.6 0.13 200)", "oklch(0.48 0.13 240)"],
    sponsored: true,
    specialties: ["General", "Dental", "Cats"],
    openNow: true,
  },
  {
    id: "okoro",
    name: "Dr. James Okoro",
    clinic: "Riverside Animal Hospital",
    rating: 4.8,
    distanceKm: 3.1,
    gradient: ["oklch(0.64 0.14 150)", "oklch(0.5 0.13 175)"],
    sponsored: true,
    specialties: ["Surgery", "Dogs", "Orthopedics"],
    openNow: true,
  },
  {
    id: "patel",
    name: "Dr. Anaya Patel",
    clinic: "Little Whiskers Clinic",
    rating: 4.7,
    distanceKm: 4.6,
    gradient: ["oklch(0.68 0.15 350)", "oklch(0.56 0.17 20)"],
    sponsored: false,
    specialties: ["General", "Nutrition"],
    openNow: false,
  },
  {
    id: "mueller",
    name: "Dr. Lena Müller",
    clinic: "Parkside Pet Care",
    rating: 4.6,
    distanceKm: 5.9,
    gradient: ["oklch(0.7 0.14 85)", "oklch(0.6 0.16 55)"],
    sponsored: false,
    specialties: ["Vaccination", "Exotics"],
    openNow: true,
  },
];

/** Primary suggested vet used by dashboard insight cards. */
export const VET = VETS[0];

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

const W = 7 * D;
const catWeights: WeightPoint[] = [
  { ts: now - 24 * W, kg: 120 },
  { ts: now - 20 * W, kg: 140 },
  { ts: now - 16 * W, kg: 158 },
  { ts: now - 12 * W, kg: 172 },
  { ts: now - 8 * W, kg: 185 },
  { ts: now - 4 * W, kg: 194 },
  { ts: now, kg: 200 },
];
const dogWeights: WeightPoint[] = [
  { ts: now - 24 * W, kg: 24.0 },
  { ts: now - 20 * W, kg: 25.8 },
  { ts: now - 16 * W, kg: 27.0 },
  { ts: now - 12 * W, kg: 28.1 },
  { ts: now - 8 * W, kg: 28.9 },
  { ts: now - 4 * W, kg: 29.2 },
  { ts: now, kg: 29.5 },
];

export const SEED: AppState = {
  currentMemberId: "you",
  premium: false,
  coins: 340,
  xp: 260,
  streak: 4,
  bookedVet: false,
  bookedVetIds: [],
  seenWelcome: false,
  units: "kg",
  familyId: "demo-family",
  familyPasswordSet: false,
  members: [
    { id: "you", name: "Parsa", emoji: "🧑‍💻", role: "Owner", gradient: ["oklch(0.62 0.16 258)", "oklch(0.5 0.18 280)"] },
    { id: "mom", name: "Mom", emoji: "👩‍🦰", role: "Admin", gradient: ["oklch(0.68 0.15 350)", "oklch(0.56 0.17 20)"] },
    { id: "dad", name: "Dad", emoji: "👨‍🦳", role: "Member", gradient: ["oklch(0.66 0.13 165)", "oklch(0.54 0.13 200)"] },
    { id: "sara", name: "Sara", emoji: "👧", role: "Member", gradient: ["oklch(0.72 0.14 85)", "oklch(0.62 0.16 50)"] },
  ],
  pets: [
    {
      id: "whiskers",
      name: "Mozart",
      species: "cat",
      breed: "British Shorthair",
      sex: "male",
      emoji: "🐱",
      ageYears: 10 / 12,
      weightKg: 200,
      owned: ["bowtie", "glasses"],
      equipped: { neck: "bowtie" },
      gradient: ["oklch(0.72 0.008 260)", "oklch(0.5 0.01 260)"],
      weights: catWeights,
      supplies: [
        { id: "food", name: "Dry food", icon: "bowl", level: 62 },
        { id: "litter", name: "Litter", icon: "broom", level: 18 },
        { id: "treats", name: "Dental treats", icon: "star", level: 80 },
      ],
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
      gradient: ["oklch(0.74 0.13 75)", "oklch(0.6 0.15 45)"],
      weights: dogWeights,
      supplies: [
        { id: "food", name: "Kibble", icon: "bowl", level: 45 },
        { id: "poopbags", name: "Poop bags", icon: "broom", level: 12 },
        { id: "treats", name: "Training treats", icon: "star", level: 70 },
      ],
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

/** Breed weight target ranges (kg) for the chart band. */
export const WEIGHT_TARGETS: Record<string, [number, number]> = {
  "British Shorthair": [4.5, 5.5],
  "Golden Retriever": [25, 34],
};

/** Fallback daily feeding/water targets for cats without a breed-specific care plan. */
export const DEFAULT_CAT_TARGETS: Partial<Record<ActionType, number>> = { fed: 3, water: 2 };

/** Recommended daily count for an action, from the breed's care plan if present, else the species fallback. */
export function dailyTarget(species: "cat" | "dog", breed: string, type: ActionType): number | undefined {
  const fromPlan = CARE_PLANS[breed]?.items.find((i) => i.action === type)?.perDay;
  if (fromPlan != null) return fromPlan;
  return species === "cat" ? DEFAULT_CAT_TARGETS[type] : undefined;
}

export function formatWeight(kg: number, units: "kg" | "lb"): string {
  if (units === "lb") return `${(kg * 2.20462).toFixed(1)} lb`;
  return `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
}

export function formatAge(ageYears: number): string {
  if (ageYears < 1) {
    const months = Math.round(ageYears * 12);
    return `${months} mo`;
  }
  return `${Math.round(ageYears)} yr${Math.round(ageYears) === 1 ? "" : "s"}`;
}
