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

export interface Med {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
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
  meds: Med[];
  /** Grams in one full cup of food — used to size the Fed portion picker. */
  cupGrams: number;
}

export interface Member {
  id: string;
  name: string;
  emoji: string;
  role: string;
  gradient: [string, string];
  /** /settings → Notifications toggles — per-member, not shared by the household. Mutes a category of simulated toast without touching the underlying reminders/alerts. */
  notifyCareReminders: boolean;
  notifyFamilyActivity: boolean;
  notifyVetSuggestions: boolean;
}

// The only role that carries functionality: it grants access to the
// Family ID + password section on the Family tab. Every other role is
// free-text and purely cosmetic.
export const ADMIN_ROLE = "Admin";
// Roles that grant admin access (Family ID + password). The signup DB trigger
// seeds the account owner as "Owner" while the client-side bootstrap uses
// "Admin", so both must count as admin — otherwise a real signup can't manage
// its own Family ID.
const ADMIN_ROLES = new Set(["admin", "owner"]);
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.has(role.trim().toLowerCase());
}

export interface Activity {
  id: string;
  petId: string;
  memberId: string;
  type: ActionType;
  ts: number;
  note?: string;
  /** Grams fed — set only for "fed" activities logged through the portion picker. */
  grams?: number;
}

/** Portion choices offered by the Fed picker, as a fraction of one full cup. */
export const PORTIONS: { value: "0.25" | "0.5" | "0.75" | "1"; label: string; frac: number }[] = [
  { value: "0.25", label: "¼ cup", frac: 0.25 },
  { value: "0.5", label: "½ cup", frac: 0.5 },
  { value: "0.75", label: "¾ cup", frac: 0.75 },
  { value: "1", label: "1 cup", frac: 1 },
];

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
  /** Care-warning kind (fed/water/litter/walk) for stable raise/resolve
   * matching that survives a pet rename. Only set on care-warning reminders. */
  alertKind?: string;
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
  /** Every household this user belongs to (for the household switcher). */
  households: { id: string; name: string }[];
  /** The household currently loaded on-screen (one of `households`). */
  activeHouseholdId: string;
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
  /** Structured daily gram target for feeding items (alongside the prose in `detail`). */
  perDayGrams?: number;
}

export const CARE_PLANS: Record<string, { intro: string; items: PlanItem[] }> = {
  "British Shorthair": {
    intro:
      "Vet-built plan for an adult British Shorthair. This breed loves food and gains weight easily, so portion control is everything.",
    items: [
      { emoji: "🍖", title: "Feeding", detail: "65 g dry food per meal, 3 meals a day (195 g total). No free-feeding — this breed overeats.", cadence: "3× daily", perDay: 3, action: "fed", perDayGrams: 195 },
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
      { emoji: "🍖", title: "Feeding", detail: "180 g kibble per meal, 2 meals a day. Add joint supplement (glucosamine) to breakfast.", cadence: "2× daily", perDay: 2, action: "fed", perDayGrams: 360 },
      { emoji: "🦮", title: "Exercise", detail: "Minimum 2 walks a day, 30–45 min each. One should include off-leash play or fetch.", cadence: "2× daily", perDay: 2, action: "walk" },
      { emoji: "💧", title: "Fresh water", detail: "Large bowl, refresh twice daily — more after exercise in warm weather.", cadence: "2× daily", perDay: 2, action: "water" },
      { emoji: "✂️", title: "Brushing", detail: "Heavy shedder — brush 3× a week with an undercoat rake.", cadence: "3× weekly", action: "groomed" },
      { emoji: "🛁", title: "Bath", detail: "Every 6–8 weeks with oatmeal shampoo. More often if they find mud (they will).", cadence: "6–8 weeks" },
      { emoji: "🩺", title: "Vet checkup", detail: "Annual checkup + hip screening. Goldens are prone to hip dysplasia.", cadence: "Yearly", action: "vet" },
      { emoji: "👂", title: "Ear check", detail: "Floppy ears trap moisture — check and wipe weekly to prevent infections.", cadence: "Weekly" },
    ],
  },
};

export function cosmetic(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}

/** Breed weight target ranges (kg) for the chart band. */
export const WEIGHT_TARGETS: Record<string, [number, number]> = {
  "British Shorthair": [4.5, 5.5],
  "Golden Retriever": [25, 34],
};

/** Fallback daily targets per species for pets without a breed-specific care plan. */
export const DEFAULT_TARGETS: Record<"cat" | "dog", Partial<Record<ActionType, number>>> = {
  cat: { fed: 3, water: 2, litter: 1 },
  dog: { fed: 2, water: 2, walk: 2 },
};

/** Recommended daily count for an action, from the breed's care plan if present, else the species fallback. */
export function dailyTarget(species: "cat" | "dog", breed: string, type: ActionType): number | undefined {
  const fromPlan = CARE_PLANS[breed]?.items.find((i) => i.action === type)?.perDay;
  if (fromPlan != null) return fromPlan;
  return DEFAULT_TARGETS[species][type];
}

/** Recommended daily grams of food, from the breed's care plan if present, else the pet's own cup size × its species-fallback meal count. */
export function dailyGramTarget(pet: Pet): number | undefined {
  const fromPlan = CARE_PLANS[pet.breed]?.items.find((i) => i.action === "fed")?.perDayGrams;
  if (fromPlan != null) return fromPlan;
  const meals = dailyTarget(pet.species, pet.breed, "fed");
  return meals != null ? meals * pet.cupGrams : undefined;
}

/** Pounds per kilogram — shared by every weight display/input conversion. */
export const LB_PER_KG = 2.20462;

/** The unit suffix shown in editor labels, e.g. "Weight (kg)" vs "Weight (lb)". */
export function weightUnitLabel(units: "kg" | "lb"): string {
  return units;
}

/** Convert a stored kg value into the user's display unit (lb rounded to 1 dp). */
export function kgToUnit(kg: number, units: "kg" | "lb"): number {
  return units === "lb" ? Math.round(kg * LB_PER_KG * 10) / 10 : kg;
}

/** Convert a value the user typed in their display unit back into stored kg. */
export function unitToKg(value: number, units: "kg" | "lb"): number {
  return units === "lb" ? value / LB_PER_KG : value;
}

export function formatWeight(kg: number, units: "kg" | "lb"): string {
  if (units === "lb") return `${(kg * LB_PER_KG).toFixed(1)} lb`;
  return `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
}

export function formatAge(ageYears: number): string {
  if (ageYears < 1) {
    const months = Math.round(ageYears * 12);
    return `${months} mo`;
  }
  return `${Math.round(ageYears)} yr${Math.round(ageYears) === 1 ? "" : "s"}`;
}
