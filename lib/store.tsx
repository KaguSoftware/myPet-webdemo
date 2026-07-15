"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACTIONS, ActionType, ADMIN_ROLE, Activity, AppState, CosmeticSlot, Med, Member, Pet, Reminder, VET, cosmetic, dailyGramTarget, dailyTarget } from "./data";

// Verb used in alert copy for each loggable action that can carry a /plan daily target.
export const ALERT_VERB: Partial<Record<ActionType, string>> = {
  fed: "eating",
  water: "drinking",
  litter: "using the litter box",
  walk: "going for walks",
};

// Basic-needs actions that get a "hasn't happened in a while" warning, keyed
// by how long a pet can go without them — separate from the /plan-driven
// over/under-target health alerts. `hours` only has an entry for the
// species the check applies to (litter is cat-only, walk is dog-only; fed
// and water apply to both, with cats needing them sooner than dogs).
type CareAlertKind = "fed" | "water" | "litter" | "walk";
const CARE_ALERT_CONFIG: Record<CareAlertKind, { verb: string; noun: string; emoji: string; hours: Partial<Record<Pet["species"], number>> }> = {
  fed: { verb: "feed", noun: "food", emoji: "🍖", hours: { cat: 8, dog: 12 } },
  water: { verb: "give water to", noun: "water", emoji: "💧", hours: { cat: 8, dog: 12 } },
  litter: { verb: "clean the litter box for", noun: "a clean litter box", emoji: "🧹", hours: { cat: 24 } },
  walk: { verb: "take for a walk", noun: "a walk", emoji: "🦮", hours: { dog: 12 } },
};

function sameCalendarDay(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function startOfDayMs(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Consecutive local calendar days — ending today or yesterday — that have at
// least one logged activity. The streak is derived from real history so the
// headline number always agrees with the StreakCalendarSheet's lit days.
function computeStreak(activities: { ts: number }[]): number {
  if (activities.length === 0) return 0;
  const days = new Set(activities.map((a) => startOfDayMs(a.ts)));
  const DAY = 86_400_000;
  const today = startOfDayMs(Date.now());
  let cursor: number;
  if (days.has(today)) cursor = today;
  else if (days.has(today - DAY)) cursor = today - DAY;
  else return 0; // last activity was >1 day ago → streak broken
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor -= DAY;
  }
  return count;
}

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  body?: string;
  /** Optional inline action (e.g. "Undo") rendered as a button inside the toast. */
  action?: { label: string; onClick: () => void };
}

interface Store {
  state: AppState;
  hydrated: boolean;
  userEmail: string | null;
  toast: (emoji: string, title: string, body?: string) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  stopNotifications: () => void;
  logAction: (petId: string, type: ActionType, grams?: number) => boolean;
  switchMember: (id: string) => void;
  setPremium: (on: boolean) => void;
  buyCosmetic: (petId: string, cosmeticId: string) => void;
  toggleEquip: (petId: string, cosmeticId: string) => void;
  addReminder: (r: Omit<Reminder, "id" | "done" | "source">) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addPet: (input: {
    name: string;
    species: "cat" | "dog";
    breed: string;
    sex?: "male" | "female";
    ageYears: number;
    weightKg: number;
    cupGrams: number;
  }) => void;
  editPet: (petId: string, patch: { name: string; breed: string; ageYears: number; weightKg: number; cupGrams: number }) => void;
  deletePet: (petId: string) => void;
  addWeight: (petId: string, kg: number) => void;
  addMember: (name: string, role: string) => void;
  editMember: (memberId: string, patch: { name: string; role: string }) => void;
  removeMember: (memberId: string) => void;
  bookVetById: (vetId: string) => void;
  unbookVetById: (vetId: string) => void;
  restockSupply: (petId: string, supplyId: string) => void;
  useSupply: (petId: string, supplyId: string) => void;
  addMed: (petId: string, name: string, dosage?: string, frequency?: string) => void;
  deleteMed: (petId: string, medId: string) => void;
  setSeenWelcome: (seen: boolean) => void;
  setUnits: (units: "kg" | "lb") => void;
  /** Set, change, or remove (pass null) the family password. Verifies `currentPassword` against the stored hash first if one is already set — returns false and toasts on mismatch. */
  setFamilyPassword: (newPassword: string | null, currentPassword?: string) => Promise<boolean>;
  verifyFamilyPassword: (input: string) => Promise<boolean>;
  /** Join an existing household by its Family ID (household UUID). Reloads on success. */
  joinHousehold: (familyId: string) => Promise<boolean>;
  /** Switch which household is shown on-screen (for users in more than one). */
  setActiveHousehold: (householdId: string) => Promise<void>;
  setNotificationPref: (key: "notifyCareReminders" | "notifyFamilyActivity" | "notifyVetSuggestions", on: boolean) => void;
  signOut: () => void;
}

const Ctx = createContext<Store | null>(null);

const EMPTY_STATE: AppState = {
  currentMemberId: "",
  premium: false,
  coins: 0,
  xp: 0,
  streak: 0,
  pets: [],
  members: [],
  activities: [],
  reminders: [],
  bookedVet: false,
  bookedVetIds: [],
  seenWelcome: true,
  units: "kg",
  familyId: "",
  familyPasswordSet: false,
  households: [],
  activeHouseholdId: "",
};

/** SHA-256 hex digest — used to avoid storing the family password in plaintext. */
async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type SupabaseClient = ReturnType<typeof createClient>;

const NOTIF_PREF_DB_COLUMN = {
  notifyCareReminders: "notify_care_reminders",
  notifyFamilyActivity: "notify_family_activity",
  notifyVetSuggestions: "notify_vet_suggestions",
} as const;

const MEMBER_GRADIENTS: [string, string][] = [
  ["oklch(0.62 0.16 258)", "oklch(0.5 0.18 280)"],
  ["oklch(0.68 0.15 350)", "oklch(0.56 0.17 20)"],
  ["oklch(0.66 0.13 165)", "oklch(0.54 0.13 200)"],
  ["oklch(0.72 0.14 85)", "oklch(0.62 0.16 50)"],
  ["oklch(0.6 0.13 200)", "oklch(0.48 0.13 240)"],
  ["oklch(0.64 0.14 150)", "oklch(0.5 0.13 175)"],
];

/**
 * Fallback for when the on-signup DB trigger didn't create a household (seen
 * in practice — the trigger firing under GoTrue's auth.users insert isn't
 * fully reliable). Mirrors supabase/migrations/0001_init.sql's seed so a
 * user never lands on a permanently empty app.
 */
function describeErr(e: { code?: string; message?: string; details?: string; hint?: string } | null | undefined) {
  if (!e) return null;
  const parts = [e.code, e.message, e.details, e.hint].filter((x) => x && x.length > 0);
  return parts.length ? parts.join(" | ") : null;
}

async function bootstrapHousehold(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  errRef: { current: string | null }
) {
  const { data: household, error: hErr } = await supabase
    .from("households")
    .insert({ owner_id: userId, name: `${name}'s household`, coins: 340, xp: 260, streak: 4, units: "kg" })
    .select()
    .single();
  if (hErr || !household) {
    if (hErr?.code === "23505") {
      // Unique owner_id race: the on-signup DB trigger already created this
      // user's household between our select and this insert. Fetch it.
      const { data: existing, error: reselectErr } = await supabase
        .from("households")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();
      if (existing) return existing;
      console.error("[petpal] bootstrap household reselect after race failed:", describeErr(reselectErr) ?? reselectErr);
      errRef.current = describeErr(reselectErr) ?? "reselect after race returned no row";
      return null;
    }
    console.error("[petpal] bootstrap household insert failed:", describeErr(hErr) ?? hErr);
    errRef.current = describeErr(hErr) ?? "insert returned no row (no error object)";
    return null;
  }

  const { data: members } = await supabase
    .from("members")
    .insert([
      { household_id: household.id, name, emoji: "🧑‍💻", role: ADMIN_ROLE, gradient_from: "oklch(0.62 0.16 258)", gradient_to: "oklch(0.5 0.18 280)" },
      { household_id: household.id, name: "Mom", emoji: "👩‍🦰", role: "Admin", gradient_from: "oklch(0.68 0.15 350)", gradient_to: "oklch(0.56 0.17 20)" },
      { household_id: household.id, name: "Dad", emoji: "👨‍🦳", role: "Member", gradient_from: "oklch(0.66 0.13 165)", gradient_to: "oklch(0.54 0.13 200)" },
      { household_id: household.id, name: "Sara", emoji: "👧", role: "Member", gradient_from: "oklch(0.72 0.14 85)", gradient_to: "oklch(0.62 0.16 50)" },
    ])
    .select();
  const [you, mom, dad, sara] = members ?? [];
  if (you) {
    await supabase.from("households").update({ current_member_id: you.id }).eq("id", household.id);
    // Link the owner's auth user to their "You" card and mark this the active
    // household. The on_household_created trigger already created the owner
    // household_members row; here we just fill in member_id + user_profiles.
    await supabase.from("household_members").update({ member_id: you.id }).eq("household_id", household.id).eq("user_id", userId);
    await supabase.from("user_profiles").upsert({ user_id: userId, active_household_id: household.id });
  }

  const now = Date.now();
  const H = 3_600_000;
  const D = 24 * H;
  const W = 7 * D;

  const { data: pets } = await supabase
    .from("pets")
    .insert([
      {
        household_id: household.id,
        name: "Mozart",
        species: "cat",
        breed: "British Shorthair",
        sex: "male",
        emoji: "🐱",
        age_years: 10 / 12,
        weight_kg: 5.1,
        owned: ["bowtie", "glasses"],
        equipped: { neck: "bowtie" },
        gradient_from: "oklch(0.72 0.008 260)",
        gradient_to: "oklch(0.5 0.01 260)",
      },
      {
        household_id: household.id,
        name: "Biscuit",
        species: "dog",
        breed: "Golden Retriever",
        emoji: "🐶",
        age_years: 2,
        weight_kg: 29.5,
        owned: ["cap"],
        equipped: { head: "cap" },
        gradient_from: "oklch(0.74 0.13 75)",
        gradient_to: "oklch(0.6 0.15 45)",
      },
    ])
    .select();
  const [cat, dog] = pets ?? [];

  if (cat && dog) {
    await supabase.from("weights").insert([
      { pet_id: cat.id, ts: now - 24 * W, kg: 2.8 },
      { pet_id: cat.id, ts: now - 20 * W, kg: 3.4 },
      { pet_id: cat.id, ts: now - 16 * W, kg: 3.9 },
      { pet_id: cat.id, ts: now - 12 * W, kg: 4.3 },
      { pet_id: cat.id, ts: now - 8 * W, kg: 4.6 },
      { pet_id: cat.id, ts: now - 4 * W, kg: 4.9 },
      { pet_id: cat.id, ts: now, kg: 5.1 },
      { pet_id: dog.id, ts: now - 24 * W, kg: 24.0 },
      { pet_id: dog.id, ts: now - 20 * W, kg: 25.8 },
      { pet_id: dog.id, ts: now - 16 * W, kg: 27.0 },
      { pet_id: dog.id, ts: now - 12 * W, kg: 28.1 },
      { pet_id: dog.id, ts: now - 8 * W, kg: 28.9 },
      { pet_id: dog.id, ts: now - 4 * W, kg: 29.2 },
      { pet_id: dog.id, ts: now, kg: 29.5 },
    ]);

    await supabase.from("supplies").insert([
      { pet_id: cat.id, supply_key: "food", name: "Dry food", icon: "bowl", level: 62 },
      { pet_id: cat.id, supply_key: "litter", name: "Litter", icon: "broom", level: 18 },
      { pet_id: cat.id, supply_key: "treats", name: "Dental treats", icon: "star", level: 80 },
      { pet_id: dog.id, supply_key: "food", name: "Kibble", icon: "bowl", level: 45 },
      { pet_id: dog.id, supply_key: "poopbags", name: "Poop bags", icon: "broom", level: 12 },
      { pet_id: dog.id, supply_key: "treats", name: "Training treats", icon: "star", level: 70 },
    ]);

    await supabase.from("meds").insert([
      { pet_id: cat.id, name: "Flea treatment", dosage: "1 pipette", frequency: "Monthly" },
    ]);

    if (you && mom && dad && sara) {
      await supabase.from("activities").insert([
        { household_id: household.id, pet_id: cat.id, member_id: mom.id, type: "fed", ts: now - 3 * H },
        { household_id: household.id, pet_id: dog.id, member_id: dad.id, type: "walk", ts: now - 4 * H },
        { household_id: household.id, pet_id: cat.id, member_id: sara.id, type: "water", ts: now - 6 * H },
        { household_id: household.id, pet_id: dog.id, member_id: you.id, type: "fed", ts: now - 7 * H },
        { household_id: household.id, pet_id: cat.id, member_id: you.id, type: "litter", ts: now - 26 * H },
        { household_id: household.id, pet_id: dog.id, member_id: mom.id, type: "groomed", ts: now - 30 * H },
        { household_id: household.id, pet_id: cat.id, member_id: dad.id, type: "fed", ts: now - 28 * H },
        { household_id: household.id, pet_id: dog.id, member_id: sara.id, type: "walk", ts: now - 32 * H },
        { household_id: household.id, pet_id: cat.id, member_id: mom.id, type: "meds", ts: now - 2 * D - 5 * H },
        { household_id: household.id, pet_id: cat.id, member_id: you.id, type: "vet", ts: now - 12 * D, note: "Regular checkup — all healthy!" },
      ]);
    }

    await supabase.from("reminders").insert([
      { household_id: household.id, pet_id: cat.id, title: "Flea treatment", emoji: "💊", due: now + 1 * D, done: false, source: "manual" },
      { household_id: household.id, pet_id: dog.id, title: "Buy more kibble", emoji: "🛒", due: now + 2 * D, done: false, source: "manual" },
      { household_id: household.id, pet_id: cat.id, title: "Full litter change", emoji: "🧹", due: now + 3 * D, done: false, source: "manual" },
      { household_id: household.id, pet_id: dog.id, title: "Bath day", emoji: "🛁", due: now + 5 * D, done: false, source: "manual" },
    ]);
  }

  return household;
}

type PetRow = {
  id: string;
  name: string;
  species: "cat" | "dog";
  breed: string;
  sex: "male" | "female" | null;
  emoji: string;
  age_years: number;
  weight_kg: number;
  owned: string[];
  equipped: Partial<Record<CosmeticSlot, string>>;
  gradient_from: string;
  gradient_to: string;
  cup_grams: number | null;
  weights?: { ts: number; kg: number; created_at?: string }[];
  supplies?: { supply_key: string; name: string; icon: string; level: number }[];
  meds?: { id: string; name: string; dosage: string | null; frequency: string | null }[];
};

// One nested query (household + every child table via FK embedding) instead
// of the household round trip, a 5-query Promise.all, then a weights/supplies
// Promise.all — cuts household load from ~4 sequential round trips to 1.
//
// `members` needs an explicit FK hint (`!members_household_id_fkey`): there
// are two FK paths between households and members — households.current_member_id
// -> members.id, and members.household_id -> households.id — so PostgREST
// can't infer which one to embed through and errors with PGRST201 (ambiguous
// embed) without it.
const HOUSEHOLD_SELECT = `
  *,
  members!members_household_id_fkey(*),
  pets(*, weights(*), supplies(*), meds(*)),
  activities(*),
  reminders(*),
  booked_vets(vet_id)
`;

type HouseholdRow = {
  id: string;
  name: string;
  current_member_id: string | null;
  premium: boolean;
  coins: number;
  xp: number;
  streak: number;
  seen_welcome: boolean;
  units: "kg" | "lb";
  last_seen_at: number | null;
  family_password_hash: string | null;
  members: {
    id: string;
    name: string;
    emoji: string;
    role: string;
    gradient_from: string;
    gradient_to: string;
    created_at: string;
    notify_care_reminders: boolean;
    notify_family_activity: boolean;
    notify_vet_suggestions: boolean;
  }[];
  pets: (PetRow & { created_at: string })[];
  activities: { id: string; pet_id: string; member_id: string; type: ActionType; ts: number; note: string | null; grams: number | null }[];
  reminders: { id: string; pet_id: string; title: string; emoji: string; due: number; done: boolean; source: "manual" | "plan"; alert: boolean | null; vet_id: string | null; alert_kind: string | null }[];
  booked_vets: { vet_id: string }[];
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const householdIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Authoritative coins/xp for DB writes, mutated synchronously inside
  // logAction/buyCosmetic so two rapid taps can't both compute from the same
  // stale render and lose an increment. Reset from the server in load().
  const rewardsRef = useRef({ coins: state.coins, xp: state.xp });
  const notifiedActivityIdsRef = useRef<Set<string>>(new Set());
  // setTimeout ids for the staggered "what everyone else did" toast batch
  // (see notifyRecentActivity below) — lets stopNotifications cancel any
  // still-queued toasts from that batch in one shot.
  const pendingNotificationTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const hid = () => householdIdRef.current;
  // The signed-in member currently "active" in the UI — notification prefs
  // are per-member, not per-household, so gating checks read off of this.
  const currentMember = () => stateRef.current.members.find((m) => m.id === stateRef.current.currentMemberId);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // One-time stop: cancels any still-queued toasts from the current activity
  // batch and clears what's on screen. Not a persisted preference — the ids
  // behind the cancelled toasts are already marked notified (added in
  // notifyRecentActivity before scheduling), so they simply never show.
  const stopNotifications = useCallback(() => {
    pendingNotificationTimeoutsRef.current.forEach((id) => clearTimeout(id));
    pendingNotificationTimeoutsRef.current.clear();
    setToasts([]);
  }, []);

  const toast = useCallback(
    (emoji: string, title: string, body?: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((t) => [...t.slice(-2), { id, emoji, title, body }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast]
  );

  // Fire-and-forget Supabase writes are optimistic — the UI already updated.
  // persist() only does work on a real error: it rolls the touched slice back
  // and tells the user, so a rejected write can't silently desync until reload.
  const persist = useCallback(
    (
      ops: PromiseLike<{ error: unknown }> | PromiseLike<{ error: unknown }>[],
      o: { rollback: () => void; message: string }
    ) => {
      const all = Array.isArray(ops) ? ops : [ops];
      Promise.all(all).then((results) => {
        const failed = results.find((r) => r && r.error);
        if (!failed) return;
        console.error("[petpal] write failed:", failed.error);
        o.rollback();
        toast("⚠️", o.message, "That change didn't save — reverted");
      });
    },
    [toast]
  );

  // Forgiveness for one-tap destructive deletes: remove from the UI now, but
  // defer the DB delete for a grace window so "Undo" is a pure local restore
  // that never touched the database. If the window elapses (or the app closes)
  // the delete commits — the right outcome for an unconfirmed tap.
  const undoableDelete = useCallback(
    (o: { remove: () => void; restore: () => void; commit: () => void; message: string; graceMs?: number }) => {
      const grace = o.graceMs ?? 5000;
      let committed = false;
      o.remove();
      const timer = setTimeout(() => {
        committed = true;
        o.commit();
      }, grace);
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((t) => [
        ...t.slice(-2),
        {
          id,
          emoji: "🗑️",
          title: o.message,
          body: "Tap Undo to restore",
          action: {
            label: "Undo",
            onClick: () => {
              clearTimeout(timer);
              dismissToast(id);
              if (!committed) o.restore();
            },
          },
        },
      ]);
      setTimeout(() => dismissToast(id), grace);
    },
    [dismissToast]
  );

  // Coins/XP/streak share one households row. Writing an absolute value on every
  // tap makes rapid taps race at the DB — concurrent UPDATEs commit out of order
  // and an earlier value can win (observed: 4 quick logs persisted as +1).
  // rewardsRef already holds the authoritative running total, so we debounce a
  // single write of the latest values: rapid taps collapse to one correct write.
  // No RPC/migration needed, and correct for this single-owner-per-household app.
  const countersTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncCounters = useCallback(() => {
    const h = hid();
    if (!h) return;
    if (countersTimerRef.current) clearTimeout(countersTimerRef.current);
    countersTimerRef.current = setTimeout(() => {
      countersTimerRef.current = null;
      supabase
        .from("households")
        .update({ coins: rewardsRef.current.coins, xp: rewardsRef.current.xp, streak: stateRef.current.streak })
        .eq("id", h)
        .then(({ error }) => {
          if (error) {
            console.error("[petpal] counter sync failed:", error);
            toast("⚠️", "Progress didn't save", "Coins and XP may reset on reload — try again");
          }
        });
    }, 250);
  }, [supabase, toast]);
  useEffect(
    () => () => {
      if (countersTimerRef.current) clearTimeout(countersTimerRef.current);
    },
    []
  );

  // Toast the given member about what everyone *else* logged in the last 16h
  // — never their own actions. Used both on login/reload and on switching
  // which family member is "active". A ref-backed id set keeps re-runs
  // within the same session (e.g. flipping between members) from replaying
  // the same toast twice.
  const notifyRecentActivity = useCallback(
    (forMemberId: string, activitiesList: Activity[], petsList: Pet[], membersList: Member[]) => {
      const cutoff = Date.now() - 16 * 60 * 60 * 1000;
      const recent = activitiesList
        .filter((a) => a.ts >= cutoff && a.memberId !== forMemberId && !notifiedActivityIdsRef.current.has(`${forMemberId}:${a.id}`))
        .sort((a, b) => a.ts - b.ts);
      recent.forEach((a, i) => {
        notifiedActivityIdsRef.current.add(`${forMemberId}:${a.id}`);
        const pet = petsList.find((p) => p.id === a.petId);
        const member = membersList.find((m) => m.id === a.memberId);
        if (!pet || !member) return;
        const action = ACTIONS[a.type];
        const time = new Date(a.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const timeoutId = setTimeout(() => {
          pendingNotificationTimeoutsRef.current.delete(timeoutId);
          const recipient = stateRef.current.members.find((mm) => mm.id === forMemberId);
          if (recipient?.notifyFamilyActivity ?? true) {
            toast(action.emoji, `${member.name} ${action.verb} ${pet.name}`, `${time} · ${timeAgo(a.ts)}`);
          }
        }, i * 1400);
        pendingNotificationTimeoutsRef.current.add(timeoutId);
      });
    },
    [toast]
  );

  // Toasts a summary of any outstanding Log care warnings (basic-needs
  // alerts like "hasn't been fed", and /plan over/under-target health
  // alerts) — run on login/reload and whenever a family member switches
  // accounts, so whoever's looking at the app is nudged toward the pet(s)
  // that need attention. A ref-backed flag per reminder id keeps this from
  // re-toasting the same still-outstanding warning on every switch.
  const notifiedWarningIdsRef = useRef<Set<string>>(new Set());
  const notifyCareWarnings = useCallback(
    (forMemberId: string, remindersList: Reminder[], petsList: Pet[]) => {
      const active = remindersList.filter((r) => r.alert && !r.done && !notifiedWarningIdsRef.current.has(`${forMemberId}:${r.id}`));
      if (active.length === 0) return;
      active.forEach((r) => notifiedWarningIdsRef.current.add(`${forMemberId}:${r.id}`));
      // Gate on the member being switched TO (passed in), not currentMember()
      // — stateRef.current.currentMemberId still lags a render behind on switch.
      const recipient = stateRef.current.members.find((m) => m.id === forMemberId);
      const allowed = active.filter((r) => (r.vetId ? (recipient?.notifyVetSuggestions ?? true) : (recipient?.notifyCareReminders ?? true)));
      if (allowed.length === 0) return;
      const timeoutId = setTimeout(() => {
        pendingNotificationTimeoutsRef.current.delete(timeoutId);
        if (allowed.length === 1) {
          const pet = petsList.find((p) => p.id === allowed[0].petId);
          toast("🚨", allowed[0].title, pet ? `${pet.name} needs attention` : undefined);
        } else {
          const petNames = Array.from(new Set(allowed.map((r) => petsList.find((p) => p.id === r.petId)?.name).filter((n): n is string => !!n)));
          toast("🚨", `${allowed.length} care warnings need attention`, petNames.join(", "));
        }
      }, 400);
      pendingNotificationTimeoutsRef.current.add(timeoutId);
    },
    [toast]
  );

  // Raises a care-plan health alert: an auto-generated reminder (with a
  // suggested vet) plus a toast, at most once per pet per day. Used both for
  // a same-day over-target spike (from logAction) and a once-a-day check for
  // the previous day's under-target activity (from the load() catch-up
  // below). Works for any pet/action where /plan (or its species default)
  // defines a daily target.
  const raiseFeedingAlert = useCallback(
    (pet: Pet, type: ActionType, kind: "over" | "under", remindersSnapshot: Reminder[], ts: number) => {
      const h = hid();
      if (!h) return;
      const already = remindersSnapshot.some((r) => r.alert && r.petId === pet.id && !r.done && sameCalendarDay(r.due, ts));
      if (already) return;
      const what = ALERT_VERB[type];
      const verb = kind === "over" ? `${what} way more than usual` : `${what} far less than usual`;
      const title = `${pet.name} is ${verb} today — worth a vet visit`;
      const id = crypto.randomUUID();
      const vetId = VET.id;
      const reminder: Reminder = { id, petId: pet.id, title, emoji: "🩺", due: ts, done: false, source: "manual", alert: true, vetId };
      setState((prev) => ({ ...prev, reminders: [...prev.reminders, reminder] }));
      supabase
        .from("reminders")
        .insert({ id, household_id: h, pet_id: pet.id, title, emoji: "🩺", due: ts, done: false, source: "manual", alert: true, vet_id: vetId })
        .then(({ error }) => {
          // Roll the optimistic alert back out if it didn't persist, so the
          // in-memory reminders don't silently diverge from the DB.
          if (error) {
            console.error("[petpal] health alert insert failed:", error);
            setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }));
          }
        });
      if (currentMember()?.notifyVetSuggestions ?? true) {
        toast("🚨", title, kind === "over" ? `Might be worth keeping an eye on ${pet.name}` : "Might be worth a vet check");
      }
    },
    [supabase, toast]
  );

  // Raises a "hasn't been fed / watered" warning: a basic-needs nudge
  // distinct from raiseFeedingAlert's over/under-target health alerts (no
  // vetId, so the two kinds of alert reminders can be told apart). Skips if
  // the pet already has one outstanding for this same kind (matched by
  // title, since fed and water alerts must be able to coexist for one pet).
  // Fires when the action has never been logged (last is null) or its most
  // recent occurrence is older than the kind's species threshold.
  const raiseCareAlert = useCallback(
    (kind: CareAlertKind, pet: Pet, remindersSnapshot: Reminder[], ts: number) => {
      const h = hid();
      if (!h) return;
      const { verb, noun, emoji } = CARE_ALERT_CONFIG[kind];
      const title = `Don't forget to ${verb} ${pet.name}`;
      // Match on (pet, kind) — NOT the title — so a rename doesn't orphan the
      // alert or let a duplicate for the new name coexist with the old one.
      const already = remindersSnapshot.some((r) => r.alert && !r.vetId && r.petId === pet.id && !r.done && r.alertKind === kind);
      if (already) return;
      const id = crypto.randomUUID();
      const reminder: Reminder = { id, petId: pet.id, title, emoji, due: ts, done: false, source: "manual", alert: true, alertKind: kind };
      setState((prev) => ({ ...prev, reminders: [...prev.reminders, reminder] }));
      supabase
        .from("reminders")
        .insert({ id, household_id: h, pet_id: pet.id, title, emoji, due: ts, done: false, source: "manual", alert: true, vet_id: null, alert_kind: kind })
        .then(({ error }) => {
          if (error) {
            console.error("[petpal] care alert insert failed:", error);
            setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }));
          }
        });
      if (currentMember()?.notifyCareReminders ?? true) {
        toast(emoji, title, `${pet.name} hasn't had ${noun} in a while`);
      }
    },
    [supabase, toast]
  );

  // Checks every pet's most recent activity of each care-alert kind (fed,
  // water, litter, walk) against its species threshold and raises a warning
  // for anything overdue (or never logged) — skipping kinds that don't apply
  // to that pet's species (e.g. litter for dogs, walk for cats). Run on load
  // and on a recurring timer, since these are a function of elapsed time,
  // not a user action.
  const checkCareAlerts = useCallback(
    (petsList: Pet[], activitiesList: Activity[], remindersSnapshot: Reminder[]) => {
      const now = Date.now();
      (Object.keys(CARE_ALERT_CONFIG) as CareAlertKind[]).forEach((kind) => {
        const { hours } = CARE_ALERT_CONFIG[kind];
        petsList.forEach((pet) => {
          const threshold = hours[pet.species];
          if (threshold == null) return;
          const last = activitiesList
            .filter((a) => a.petId === pet.id && a.type === kind)
            .reduce((max: number | null, a) => (max == null || a.ts > max ? a.ts : max), null);
          const hoursSince = last == null ? Infinity : (now - last) / 3600_000;
          if (hoursSince >= threshold) {
            raiseCareAlert(kind, pet, remindersSnapshot, now);
          }
        });
      });
    },
    [raiseCareAlert]
  );

  // Load the signed-in user's household from Supabase, and reload whenever
  // auth state changes. StoreProvider lives in the root layout and stays
  // mounted across the client-side nav from /login to /, so a mount-only
  // effect would only ever see the pre-login (signed-out) session — the
  // onAuthStateChange subscription is what picks up a login that happens
  // without a full page reload.
  useEffect(() => {
    let cancelled = false;
    let lastLoadedUserId: string | null = null;

    async function load() {
      // getSession() reads the already-verified local session instead of
      // making a network round trip like getUser() does — proxy.ts already
      // verified this session server-side before this page was allowed to render.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        lastLoadedUserId = null;
        userIdRef.current = null;
        if (!cancelled) {
          setUserEmail(null);
          setState(EMPTY_STATE);
          setHydrated(true);
        }
        return;
      }
      if (user.id === lastLoadedUserId) return;
      lastLoadedUserId = user.id;
      if (cancelled) return;
      userIdRef.current = user.id;
      setUserEmail(user.email ?? null);

      // Resolve which household is on-screen: the user's saved active household,
      // else any membership (prefer one they own). Membership-based RLS lets us
      // read any household the user belongs to, so a joined household loads too.
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("active_household_id")
        .eq("user_id", user.id)
        .maybeSingle<{ active_household_id: string | null }>();
      const { data: memberships } = await supabase
        .from("household_members")
        .select("household_id, role, member_id, households(id, name)")
        .eq("user_id", user.id);
      type MembershipRow = { household_id: string; role: string; member_id: string | null; households: { id: string; name: string } | null };
      const membershipList: MembershipRow[] = (memberships as MembershipRow[] | null) ?? [];
      let activeId = profile?.active_household_id ?? null;
      if (!activeId || !membershipList.some((m) => m.household_id === activeId)) {
        const owned = membershipList.find((m) => m.role === "owner");
        activeId = owned?.household_id ?? membershipList[0]?.household_id ?? null;
      }

      // Single nested query for household + members/pets/weights/supplies/
      // activities/reminders/booked_vets in one round trip.
      let household: HouseholdRow | null = null;
      let householdErr: { code?: string; message?: string; details?: string; hint?: string } | null = null;
      if (activeId) {
        const res = await supabase.from("households").select(HOUSEHOLD_SELECT).eq("id", activeId).maybeSingle<HouseholdRow>();
        household = res.data;
        householdErr = res.error;
      }
      if (householdErr) console.error("[petpal] household fetch failed:", describeErr(householdErr) ?? householdErr);

      let finalHousehold = household;
      const bootstrapErrRef = { current: describeErr(householdErr) };
      if (!finalHousehold) {
        const bootstrapped = await bootstrapHousehold(
          supabase,
          user.id,
          (user.user_metadata as { name?: string } | null)?.name || "You",
          bootstrapErrRef
        );
        // bootstrapHousehold only inserts the bare household row (plus its
        // seed children separately) — refetch nested so the shape matches.
        finalHousehold = bootstrapped
          ? (
              await supabase
                .from("households")
                .select(HOUSEHOLD_SELECT)
                .eq("id", bootstrapped.id)
                .maybeSingle<HouseholdRow>()
            ).data
          : null;
      }
      if (!finalHousehold || cancelled) {
        setHydrated(true);
        if (!finalHousehold) {
          toast("⚠️", "Couldn't set up your household", bootstrapErrRef.current ?? "unknown error — check console");
        }
        return;
      }
      const h = finalHousehold;
      householdIdRef.current = h.id;

      const members = [...(h.members ?? [])].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      const petRows = [...(h.pets ?? [])].sort((a: PetRow & { created_at: string }, b: PetRow & { created_at: string }) =>
        a.created_at < b.created_at ? -1 : 1
      );
      const activities = [...(h.activities ?? [])].sort((a, b) => Number(b.ts) - Number(a.ts));
      const reminders = [...(h.reminders ?? [])].sort((a, b) => Number(a.due) - Number(b.due));
      const bookedVets = h.booked_vets ?? [];

      const pets: Pet[] = petRows.map((p: PetRow) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        sex: p.sex ?? undefined,
        emoji: p.emoji,
        ageYears: p.age_years,
        weightKg: p.weight_kg,
        owned: p.owned,
        equipped: p.equipped,
        gradient: [p.gradient_from, p.gradient_to],
        cupGrams: p.cup_grams ?? (p.species === "cat" ? 60 : 120),
        weights: [...(p.weights ?? [])]
          .sort((a, b) => Number(a.ts) - Number(b.ts))
          .map((w) => ({ ts: Number(w.ts), kg: Number(w.kg) })),
        supplies: (p.supplies ?? []).map((s) => ({ id: s.supply_key, name: s.name, icon: s.icon, level: s.level })),
        meds: (p.meds ?? []).map((m) => ({ id: m.id, name: m.name, dosage: m.dosage ?? undefined, frequency: m.frequency ?? undefined })),
      }));

      if (cancelled) return;
      const mappedMembers = members.map((m) => ({
        id: m.id,
        name: m.name,
        emoji: m.emoji,
        role: m.role,
        gradient: [m.gradient_from, m.gradient_to] as [string, string],
        notifyCareReminders: m.notify_care_reminders,
        notifyFamilyActivity: m.notify_family_activity,
        notifyVetSuggestions: m.notify_vet_suggestions,
      }));
      const activityList: Activity[] = activities.map((a) => ({
        id: a.id,
        petId: a.pet_id,
        memberId: a.member_id,
        type: a.type,
        ts: Number(a.ts),
        note: a.note ?? undefined,
        grams: a.grams ?? undefined,
      }));
      // Per-user "view as": prefer the current user's own linked member card,
      // then the household's shared pointer, then the first member. This keeps
      // one user's member switch from dictating what other members see.
      const myMembership = membershipList.find((m) => m.household_id === h.id);
      const currentMemberId =
        (myMembership?.member_id && members.some((m) => m.id === myMembership.member_id) ? myMembership.member_id : null) ??
        h.current_member_id ??
        members[0]?.id ??
        "";
      // Households for the switcher — from memberships, or synthesize from the
      // loaded household when the fallback bootstrap path ran (no membership rows
      // were read before the household existed).
      const householdsList =
        membershipList.length > 0
          ? membershipList.map((m) => ({ id: m.household_id, name: m.households?.name ?? "Household" }))
          : [{ id: h.id, name: h.name }];
      const reminderList: Reminder[] = reminders.map((r) => ({
        id: r.id,
        petId: r.pet_id,
        title: r.title,
        emoji: r.emoji,
        due: Number(r.due),
        done: r.done,
        source: r.source,
        alert: r.alert ?? false,
        vetId: r.vet_id ?? undefined,
        alertKind: r.alert_kind ?? undefined,
      }));
      // Derive the streak from real history so the headline always matches the
      // calendar's lit days; persist it back if the stored value drifted.
      const computedStreak = computeStreak(activityList);
      rewardsRef.current = { coins: h.coins, xp: h.xp };
      setState({
        currentMemberId,
        premium: h.premium,
        coins: h.coins,
        xp: h.xp,
        streak: computedStreak,
        pets,
        members: mappedMembers,
        activities: activityList,
        reminders: reminderList,
        bookedVet: bookedVets.length > 0,
        bookedVetIds: bookedVets.map((b) => b.vet_id),
        seenWelcome: h.seen_welcome,
        units: h.units,
        familyId: h.id,
        familyPasswordSet: !!h.family_password_hash,
        households: householdsList,
        activeHouseholdId: h.id,
      });
      setHydrated(true);
      if (computedStreak !== h.streak) {
        supabase.from("households").update({ streak: computedStreak }).eq("id", h.id).then();
      }

      // Catch the signed-in member up on what everyone *else* logged in the
      // last 16h — never their own actions.
      notifyRecentActivity(currentMemberId, activityList, pets, mappedMembers);

      // Once-a-day check: was a pet at or under half its /plan daily target
      // for any tracked action yesterday? Real-time under-detection isn't
      // meaningful mid-day, so this runs once per load, right after the
      // catch-up above. Covers both species — whatever /plan (or its
      // species default) defines a target for.
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      pets.forEach((p) => {
        // Feeding is judged on grams (from the portion picker), not tap count.
        // Only activities logged through the picker carry `grams` — skip the
        // check entirely if yesterday has no gram data to judge against.
        const gramTarget = dailyGramTarget(p);
        const gramsYesterday = activityList.filter(
          (a) => a.petId === p.id && a.type === "fed" && sameCalendarDay(a.ts, yesterday) && a.grams != null
        );
        if (gramTarget && gramsYesterday.length > 0) {
          const gramsTotal = gramsYesterday.reduce((sum, a) => sum + (a.grams ?? 0), 0);
          if (gramsTotal > 0 && gramsTotal <= gramTarget * 0.5) {
            raiseFeedingAlert(p, "fed", "under", reminderList, yesterday);
          }
        }
        (["water", "litter", "walk"] as const).forEach((type) => {
          const target = dailyTarget(p.species, p.breed, type);
          if (!target) return;
          const count = activityList.filter((a) => a.petId === p.id && a.type === type && sameCalendarDay(a.ts, yesterday)).length;
          if (count > 0 && count <= target * 0.5) {
            raiseFeedingAlert(p, type, "under", reminderList, yesterday);
          }
        });
      });

      // Basic-needs check: any pet overdue against its species' feeding or
      // water window (see CARE_ALERT_CONFIG) gets a warning right away on load.
      checkCareAlerts(pets, activityList, reminderList);

      // Signing in surfaces any already-outstanding warnings too, not just
      // ones raised by the checks above.
      notifyCareWarnings(currentMemberId, reminderList, pets);

      supabase.from("households").update({ last_seen_at: Date.now() }).eq("id", h.id).then();
    }

    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    // "Hasn't been fed/watered" is a function of elapsed time, not a user
    // action, so it needs to be re-checked periodically while the app stays
    // open — not just once at load.
    const careAlertTimer = setInterval(() => {
      checkCareAlerts(stateRef.current.pets, stateRef.current.activities, stateRef.current.reminders);
    }, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearInterval(careAlertTimer);
    };
  }, [supabase, toast, notifyRecentActivity, raiseFeedingAlert, checkCareAlerts, notifyCareWarnings]);

  const logAction = useCallback(
    (petId: string, type: ActionType, grams?: number): boolean => {
      const h = hid();
      if (!h) return false;
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      if (!pet) return false;
      if (type === "meds" && pet.meds.length === 0) {
        toast("🙂", "No meds", `${pet.name} isn't on any medication right now`);
        return false;
      }

      const id = crypto.randomUUID();
      const ts = Date.now();
      const memberId = stateRef.current.currentMemberId;
      // Logging litter (cats) or a walk (dogs) drains the sanitation supply,
      // matched by icon rather than a hardcoded id — seed cats use "litter",
      // generated pets use "sanitation", dogs use "poopbags", all icon "broom".
      const litterSupply =
        type === "litter" || type === "walk" ? pet.supplies.find((s) => s.icon === "broom") : undefined;
      const litterLevel = litterSupply ? Math.max(0, litterSupply.level - 15) : null;
      // Feeding through the portion picker drains the food supply (icon
      // "bowl") proportionally to the portion — a full cup drains 10%.
      const foodSupply = type === "fed" && grams != null ? pet.supplies.find((s) => s.icon === "bowl") : undefined;
      const foodLevel = foodSupply ? Math.max(0, foodSupply.level - 10 * (grams! / pet.cupGrams)) : null;

      // Coins/XP via the synchronous shadow ref so rapid taps each build on the
      // previous increment instead of the same stale render value.
      const oldXp = rewardsRef.current.xp;
      const newCoins = rewardsRef.current.coins + 5;
      const newXp = oldXp + 10;
      rewardsRef.current = { coins: newCoins, xp: newXp };
      const leveledUp = level(newXp) > level(oldXp);

      const newActivity: Activity = { id, petId, memberId, type, ts, grams };
      const newStreak = computeStreak([newActivity, ...stateRef.current.activities]);

      // Snapshot for rollback if the DB rejects the write.
      const before = {
        coins: stateRef.current.coins,
        xp: stateRef.current.xp,
        streak: stateRef.current.streak,
        activities: stateRef.current.activities,
        pets: stateRef.current.pets,
      };

      setState((prev) => ({
        ...prev,
        coins: prev.coins + 5,
        xp: prev.xp + 10,
        streak: newStreak,
        activities: [newActivity, ...prev.activities],
        pets: prev.pets.map((p) => {
          if (p.id !== petId) return p;
          if (litterSupply && litterLevel != null) {
            return { ...p, supplies: p.supplies.map((s) => (s.id === litterSupply.id ? { ...s, level: litterLevel } : s)) };
          }
          if (foodSupply && foodLevel != null) {
            return { ...p, supplies: p.supplies.map((s) => (s.id === foodSupply.id ? { ...s, level: foodLevel } : s)) };
          }
          return p;
        }),
      }));

      const time = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const gramsNote = type === "fed" && grams != null ? `${Math.round(grams)} g · ` : "";
      toast(ACTIONS[type].emoji, `${pet.name} — ${ACTIONS[type].label.toLowerCase()} at ${time}`, `Family notified 📣 · ${gramsNote}+5 coins · +10 XP`);
      if (leveledUp) toast("⭐", `Level ${level(newXp)} reached!`, "Nice — keep the daily care going");
      if (newStreak > before.streak) toast("🔥", `${newStreak}-day streak!`, "You're on a roll — keep it going");

      // Persist the activity (+ any supply drain) per-row; on failure roll the
      // whole slice back. Coins/xp/streak go through the debounced syncCounters
      // so rapid taps can't race at the DB.
      const ops: PromiseLike<{ error: unknown }>[] = [
        supabase.from("activities").insert({ id, household_id: h, pet_id: petId, member_id: memberId, type, ts, grams: grams ?? null }),
      ];
      if (litterSupply && litterLevel != null) {
        ops.push(supabase.from("supplies").update({ level: litterLevel }).eq("pet_id", petId).eq("supply_key", litterSupply.id));
      }
      if (foodSupply && foodLevel != null) {
        ops.push(supabase.from("supplies").update({ level: foodLevel }).eq("pet_id", petId).eq("supply_key", foodSupply.id));
      }
      persist(ops, {
        rollback: () => {
          rewardsRef.current = { coins: before.coins, xp: before.xp };
          setState((prev) => ({ ...prev, coins: before.coins, xp: before.xp, streak: before.streak, activities: before.activities, pets: before.pets }));
          syncCounters();
        },
        message: "Couldn't log that care action",
      });
      syncCounters();

      // Logging fed/water/litter/walk resolves that kind's outstanding
      // "hasn't happened in a while" warning for this pet (matched by
      // (pet, kind), same as raiseCareAlert — survives a rename).
      if (type === "fed" || type === "water" || type === "litter" || type === "walk") {
        const careAlerts = stateRef.current.reminders.filter(
          (r) => r.alert && !r.vetId && r.petId === petId && !r.done && r.alertKind === type
        );
        if (careAlerts.length > 0) {
          setState((prev) => ({
            ...prev,
            reminders: prev.reminders.map((r) => (careAlerts.some((a) => a.id === r.id) ? { ...r, done: true } : r)),
          }));
          careAlerts.forEach((r) => supabase.from("reminders").update({ done: true }).eq("id", r.id).then());
        }
      }

      // Over-target check: raise a health alert and suggest a vet visit.
      // Feeding is judged on grams fed today vs the pet's daily gram target;
      // every other tracked action is judged on raw tap count vs its /plan
      // (or species-default) daily target.
      if (type === "fed" && grams != null) {
        const gramTarget = dailyGramTarget(pet);
        if (gramTarget) {
          const gramsToday =
            stateRef.current.activities
              .filter((a) => a.petId === petId && a.type === "fed" && sameCalendarDay(a.ts, ts))
              .reduce((sum, a) => sum + (a.grams ?? 0), 0) + grams;
          if (gramsToday >= gramTarget * 2) {
            raiseFeedingAlert(pet, "fed", "over", stateRef.current.reminders, ts);
          }
        }
      } else {
        const target = dailyTarget(pet.species, pet.breed, type);
        if (target) {
          const todayCount =
            stateRef.current.activities.filter((a) => a.petId === petId && a.type === type && sameCalendarDay(a.ts, ts)).length + 1;
          if (todayCount >= target * 2) {
            raiseFeedingAlert(pet, type, "over", stateRef.current.reminders, ts);
          }
        }
      }

      return true;
    },
    [supabase, toast, persist, syncCounters, raiseFeedingAlert]
  );

  const switchMember = useCallback(
    (id: string) => {
      const prevId = stateRef.current.currentMemberId;
      setState((p) => ({ ...p, currentMemberId: id }));
      notifyRecentActivity(id, stateRef.current.activities, stateRef.current.pets, stateRef.current.members);
      notifyCareWarnings(id, stateRef.current.reminders, stateRef.current.pets);
      const h = hid();
      const uid = userIdRef.current;
      // Persist "view as" on the current user's OWN membership row, not the
      // shared households.current_member_id — so one member switching doesn't
      // change what the other members of a shared household see.
      if (h && uid)
        persist(supabase.from("household_members").update({ member_id: id }).eq("household_id", h).eq("user_id", uid), {
          rollback: () => setState((p) => ({ ...p, currentMemberId: prevId })),
          message: "Couldn't switch member",
        });
    },
    [supabase, persist, notifyRecentActivity, notifyCareWarnings]
  );

  const setPremium = useCallback(
    (on: boolean) => {
      const prev = stateRef.current.premium;
      setState((p) => ({ ...p, premium: on }));
      const h = hid();
      if (h)
        persist(supabase.from("households").update({ premium: on }).eq("id", h), {
          rollback: () => setState((p) => ({ ...p, premium: prev })),
          message: "Couldn't update PetPal+",
        });
    },
    [supabase, persist]
  );

  const buyCosmetic = useCallback(
    (petId: string, cosmeticId: string) => {
      const item = cosmetic(cosmeticId);
      if (!item) return;
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      if (!pet) return;
      if (pet.owned.includes(cosmeticId)) return; // already owned — never double-charge
      if (rewardsRef.current.coins < item.price) {
        toast("🪙", "Not enough coins", `${item.name} costs ${item.price} coins`);
        return;
      }
      const owned = [...pet.owned, cosmeticId];
      const equipped = { ...pet.equipped, [item.slot]: cosmeticId };
      const newCoins = rewardsRef.current.coins - item.price;
      rewardsRef.current = { ...rewardsRef.current, coins: newCoins };
      const before = { coins: stateRef.current.coins, owned: pet.owned, equipped: pet.equipped };
      setState((prev) => ({
        ...prev,
        coins: prev.coins - item.price,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, owned, equipped } : p)),
      }));
      const h = hid();
      if (!h) return;
      persist(supabase.from("pets").update({ owned, equipped }).eq("id", petId), {
        rollback: () => {
          rewardsRef.current = { ...rewardsRef.current, coins: before.coins };
          setState((prev) => ({
            ...prev,
            coins: before.coins,
            pets: prev.pets.map((p) => (p.id === petId ? { ...p, owned: before.owned, equipped: before.equipped } : p)),
          }));
          syncCounters();
        },
        message: "Purchase didn't go through",
      });
      syncCounters();
    },
    [supabase, toast, persist, syncCounters]
  );

  const toggleEquip = useCallback(
    (petId: string, cosmeticId: string) => {
      const item = cosmetic(cosmeticId);
      if (!item) return;
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      if (!pet) return;
      const prevEquipped = pet.equipped;
      const equipped = { ...pet.equipped };
      if (equipped[item.slot] === cosmeticId) delete equipped[item.slot];
      else equipped[item.slot as CosmeticSlot] = cosmeticId;
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, equipped } : p)),
      }));
      persist(supabase.from("pets").update({ equipped }).eq("id", petId), {
        rollback: () => setState((prev) => ({ ...prev, pets: prev.pets.map((p) => (p.id === petId ? { ...p, equipped: prevEquipped } : p)) })),
        message: "Couldn't update outfit",
      });
    },
    [supabase, persist]
  );

  const addReminder = useCallback(
    (r: Omit<Reminder, "id" | "done" | "source">) => {
      const h = hid();
      if (!h) return;
      const id = crypto.randomUUID();
      setState((prev) => ({
        ...prev,
        reminders: [...prev.reminders, { ...r, id, done: false, source: "manual" }],
      }));
      persist(
        supabase.from("reminders").insert({
          id,
          household_id: h,
          pet_id: r.petId,
          title: r.title,
          emoji: r.emoji,
          due: r.due,
          done: false,
          source: "manual",
          alert: r.alert ?? false,
          vet_id: r.vetId ?? null,
        }),
        {
          rollback: () => setState((prev) => ({ ...prev, reminders: prev.reminders.filter((x) => x.id !== id) })),
          message: "Reminder wasn't saved",
        }
      );
    },
    [supabase, persist]
  );

  const toggleReminder = useCallback(
    (id: string) => {
      const r = stateRef.current.reminders.find((x) => x.id === id);
      if (!r) return;
      const done = !r.done;
      setState((prev) => ({
        ...prev,
        reminders: prev.reminders.map((x) => (x.id === id ? { ...x, done } : x)),
      }));
      persist(supabase.from("reminders").update({ done }).eq("id", id), {
        rollback: () => setState((prev) => ({ ...prev, reminders: prev.reminders.map((x) => (x.id === id ? { ...x, done: !done } : x)) })),
        message: "Couldn't update reminder",
      });
    },
    [supabase, persist]
  );

  const deleteReminder = useCallback(
    (id: string) => {
      const removed = stateRef.current.reminders.find((r) => r.id === id);
      if (!removed) return;
      undoableDelete({
        remove: () => setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) })),
        restore: () =>
          setState((prev) => (prev.reminders.some((r) => r.id === id) ? prev : { ...prev, reminders: [...prev.reminders, removed] })),
        commit: () => supabase.from("reminders").delete().eq("id", id).then(),
        message: "Reminder deleted",
      });
    },
    [supabase, undoableDelete]
  );

  const addPet = useCallback(
    (input: {
      name: string;
      species: "cat" | "dog";
      breed: string;
      sex?: "male" | "female";
      ageYears: number;
      weightKg: number;
      cupGrams: number;
    }) => {
      const { name, species, breed, sex, ageYears, weightKg, cupGrams } = input;
      const h = hid();
      if (!h) {
        console.error("[petpal] addPet called before household loaded");
        toast("⚠️", "Couldn't add pet", "Your household hasn't finished loading — try again in a moment");
        return;
      }
      const id = crypto.randomUUID();
      const gradient: [string, string] =
        species === "cat"
          ? ["oklch(0.66 0.13 165)", "oklch(0.52 0.14 200)"]
          : ["oklch(0.68 0.15 350)", "oklch(0.55 0.17 20)"];
      // Supply keys follow the seed convention (cat → "litter", dog →
      // "poopbags") so new and seeded pets are consistent. logAction still
      // drains sanitation by icon ("broom"), so the exact key never matters
      // for draining, but keeping them aligned keeps id-keyed restock/use tidy.
      const supplies = [
        { id: "food", name: species === "cat" ? "Dry food" : "Kibble", icon: "bowl", level: 100 },
        { id: species === "cat" ? "litter" : "poopbags", name: species === "cat" ? "Litter" : "Poop bags", icon: "broom", level: 100 },
        { id: "treats", name: "Treats", icon: "star", level: 100 },
      ];
      const weights = [{ ts: Date.now(), kg: weightKg }];
      setState((prev) => ({
        ...prev,
        pets: [
          ...prev.pets,
          { id, name, species, breed, sex, emoji: species === "cat" ? "🐱" : "🐶", ageYears, weightKg, owned: [], equipped: {}, gradient, weights, supplies, meds: [], cupGrams },
        ],
      }));
      const rollback = () => setState((prev) => ({ ...prev, pets: prev.pets.filter((p) => p.id !== id) }));
      // All three inserts are awaited together; a failure of ANY of them rolls
      // the optimistic pet back out and warns, so we never leave a pet with no
      // supplies/weights silently persisted (the old code ignored those errors).
      (async () => {
        const { error: petError } = await supabase.from("pets").insert({
          id,
          household_id: h,
          name,
          species,
          breed,
          sex: sex ?? null,
          emoji: species === "cat" ? "🐱" : "🐶",
          age_years: ageYears,
          weight_kg: weightKg,
          owned: [],
          equipped: {},
          gradient_from: gradient[0],
          gradient_to: gradient[1],
          cup_grams: cupGrams,
        });
        if (petError) {
          console.error("[petpal] pet insert failed:", petError);
          toast("⚠️", `${name} wasn't saved`, "It'll disappear on reload — please try again");
          rollback();
          return;
        }
        const [{ error: weightError }, { error: supplyError }] = await Promise.all([
          supabase.from("weights").insert({ pet_id: id, ts: weights[0].ts, kg: weightKg }),
          supabase.from("supplies").insert(supplies.map((s) => ({ pet_id: id, supply_key: s.id, name: s.name, icon: s.icon, level: s.level }))),
        ]);
        if (weightError || supplyError) {
          console.error("[petpal] pet setup insert failed:", weightError ?? supplyError);
          toast("⚠️", `${name} wasn't saved`, "Setup didn't finish — please try again");
          // Undo the pet too so the partial row doesn't linger without supplies.
          await supabase.from("pets").delete().eq("id", id);
          rollback();
          return;
        }
        toast("🐾", `${name} joined the family`, "Care tracking is ready");
      })();
    },
    [supabase, toast]
  );

  const editPet = useCallback(
    (petId: string, patch: { name: string; breed: string; ageYears: number; weightKg: number; cupGrams: number }) => {
      const prev = stateRef.current.pets.find((p) => p.id === petId);
      // If the weight changed, append a history point (and persist it) so the
      // weight chart never diverges from weightKg — previously editing weight
      // here bypassed the weights table entirely.
      const weightChanged = prev != null && patch.weightKg !== prev.weightKg;
      const ts = Date.now();
      setState((s) => ({
        ...s,
        pets: s.pets.map((p) =>
          p.id === petId
            ? { ...p, ...patch, weights: weightChanged ? [...p.weights, { ts, kg: patch.weightKg }] : p.weights }
            : p
        ),
      }));
      const ops: PromiseLike<{ error: unknown }>[] = [
        supabase
          .from("pets")
          .update({ name: patch.name, breed: patch.breed, age_years: patch.ageYears, weight_kg: patch.weightKg, cup_grams: patch.cupGrams })
          .eq("id", petId),
      ];
      if (weightChanged) ops.push(supabase.from("weights").insert({ pet_id: petId, ts, kg: patch.weightKg }));
      persist(ops, {
        rollback: () => prev && setState((s) => ({ ...s, pets: s.pets.map((p) => (p.id === petId ? prev : p)) })),
        message: "Couldn't save pet changes",
      });
    },
    [supabase, persist]
  );

  const deletePet = useCallback(
    (petId: string) => {
      const removed = stateRef.current.pets.find((p) => p.id === petId);
      setState((prev) => ({ ...prev, pets: prev.pets.filter((p) => p.id !== petId) }));
      if (!removed) return;
      persist(supabase.from("pets").delete().eq("id", petId), {
        rollback: () => setState((prev) => (prev.pets.some((p) => p.id === petId) ? prev : { ...prev, pets: [...prev.pets, removed] })),
        message: "Couldn't delete pet",
      });
    },
    [supabase, persist]
  );

  const addWeight = useCallback(
    (petId: string, kg: number) => {
      const ts = Date.now();
      const prev = stateRef.current.pets.find((p) => p.id === petId);
      setState((s) => ({
        ...s,
        pets: s.pets.map((p) =>
          p.id === petId ? { ...p, weightKg: kg, weights: [...p.weights, { ts, kg }] } : p
        ),
      }));
      persist(
        [
          supabase.from("weights").insert({ pet_id: petId, ts, kg }),
          supabase.from("pets").update({ weight_kg: kg }).eq("id", petId),
        ],
        {
          rollback: () => prev && setState((s) => ({ ...s, pets: s.pets.map((p) => (p.id === petId ? prev : p)) })),
          message: "Couldn't save weight",
        }
      );
    },
    [supabase, persist]
  );

  const addMember = useCallback(
    (name: string, role: string) => {
      const h = hid();
      if (!h) {
        toast("⚠️", "Couldn't add member", "Your household hasn't finished loading — try again in a moment");
        return;
      }
      const id = crypto.randomUUID();
      const emoji = "🧑";
      const gradient = MEMBER_GRADIENTS[stateRef.current.members.length % MEMBER_GRADIENTS.length];
      setState((prev) => ({
        ...prev,
        members: [
          ...prev.members,
          { id, name, emoji, role, gradient, notifyCareReminders: true, notifyFamilyActivity: true, notifyVetSuggestions: true },
        ],
      }));
      supabase
        .from("members")
        .insert({ id, household_id: h, name, emoji, role, gradient_from: gradient[0], gradient_to: gradient[1] })
        .then(({ error }) => {
          if (error) {
            console.error("[petpal] member insert failed:", error);
            toast("⚠️", `${name} wasn't saved`, "It'll disappear on reload — please try again");
            setState((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== id) }));
            return;
          }
          toast("👤", `${name} joined the household`, "");
        });
    },
    [supabase, toast]
  );

  const editMember = useCallback(
    (memberId: string, patch: { name: string; role: string }) => {
      const prev = stateRef.current.members.find((m) => m.id === memberId);
      setState((s) => ({
        ...s,
        members: s.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
      }));
      persist(supabase.from("members").update({ name: patch.name, role: patch.role }).eq("id", memberId), {
        rollback: () => prev && setState((s) => ({ ...s, members: s.members.map((m) => (m.id === memberId ? prev : m)) })),
        message: "Couldn't save member changes",
      });
    },
    [supabase, persist]
  );

  const removeMember = useCallback(
    (memberId: string) => {
      if (stateRef.current.members.length <= 1) {
        toast("⚠️", "Can't remove the last member", "A household needs at least one member");
        return;
      }
      const before = {
        members: stateRef.current.members,
        activities: stateRef.current.activities,
        currentMemberId: stateRef.current.currentMemberId,
      };
      const wasCurrent = stateRef.current.currentMemberId === memberId;
      const fallbackId = stateRef.current.members.find((m) => m.id !== memberId)?.id;
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        activities: prev.activities.filter((a) => a.memberId !== memberId),
        currentMemberId: wasCurrent && fallbackId ? fallbackId : prev.currentMemberId,
      }));
      const h = hid();
      const ops: PromiseLike<{ error: unknown }>[] = [supabase.from("members").delete().eq("id", memberId)];
      if (h && wasCurrent && fallbackId) {
        ops.push(supabase.from("households").update({ current_member_id: fallbackId }).eq("id", h));
      }
      persist(ops, {
        rollback: () =>
          setState((prev) => ({ ...prev, members: before.members, activities: before.activities, currentMemberId: before.currentMemberId })),
        message: "Couldn't remove member",
      });
    },
    [supabase, toast, persist]
  );

  const bookVetById = useCallback(
    (vetId: string) => {
      const h = hid();
      if (!h) return;
      const before = { bookedVet: stateRef.current.bookedVet, bookedVetIds: stateRef.current.bookedVetIds };
      setState((p) => ({
        ...p,
        bookedVet: true,
        bookedVetIds: p.bookedVetIds.includes(vetId) ? p.bookedVetIds : [...p.bookedVetIds, vetId],
      }));
      persist(supabase.from("booked_vets").upsert({ household_id: h, vet_id: vetId }), {
        rollback: () => setState((p) => ({ ...p, bookedVet: before.bookedVet, bookedVetIds: before.bookedVetIds })),
        message: "Couldn't request the vet visit",
      });
    },
    [supabase, persist]
  );

  const unbookVetById = useCallback(
    (vetId: string) => {
      const h = hid();
      if (!h) return;
      const before = { bookedVet: stateRef.current.bookedVet, bookedVetIds: stateRef.current.bookedVetIds };
      const remaining = before.bookedVetIds.filter((id) => id !== vetId);
      setState((p) => ({ ...p, bookedVet: remaining.length > 0, bookedVetIds: remaining }));
      persist(supabase.from("booked_vets").delete().eq("household_id", h).eq("vet_id", vetId), {
        rollback: () => setState((p) => ({ ...p, bookedVet: before.bookedVet, bookedVetIds: before.bookedVetIds })),
        message: "Couldn't cancel the vet request",
      });
    },
    [supabase, persist]
  );

  const restockSupply = useCallback(
    (petId: string, supplyId: string) => {
      const prevLevel = stateRef.current.pets.find((p) => p.id === petId)?.supplies.find((s) => s.id === supplyId)?.level;
      setState((s) => ({
        ...s,
        pets: s.pets.map((p) =>
          p.id === petId ? { ...p, supplies: p.supplies.map((sp) => (sp.id === supplyId ? { ...sp, level: 100 } : sp)) } : p
        ),
      }));
      persist(supabase.from("supplies").update({ level: 100 }).eq("pet_id", petId).eq("supply_key", supplyId), {
        rollback: () =>
          prevLevel != null &&
          setState((s) => ({
            ...s,
            pets: s.pets.map((p) =>
              p.id === petId ? { ...p, supplies: p.supplies.map((sp) => (sp.id === supplyId ? { ...sp, level: prevLevel } : sp)) } : p
            ),
          })),
        message: "Couldn't restock",
      });
    },
    [supabase, persist]
  );

  const useSupply = useCallback(
    (petId: string, supplyId: string) => {
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      const supply = pet?.supplies.find((s) => s.id === supplyId);
      const prevLevel = supply?.level;
      const level = Math.max(0, (supply?.level ?? 0) - 15);
      setState((s) => ({
        ...s,
        pets: s.pets.map((p) =>
          p.id === petId ? { ...p, supplies: p.supplies.map((sp) => (sp.id === supplyId ? { ...sp, level } : sp)) } : p
        ),
      }));
      persist(supabase.from("supplies").update({ level }).eq("pet_id", petId).eq("supply_key", supplyId), {
        rollback: () =>
          prevLevel != null &&
          setState((s) => ({
            ...s,
            pets: s.pets.map((p) =>
              p.id === petId ? { ...p, supplies: p.supplies.map((sp) => (sp.id === supplyId ? { ...sp, level: prevLevel } : sp)) } : p
            ),
          })),
        message: "Couldn't update supply",
      });
    },
    [supabase, persist]
  );

  const addMed = useCallback(
    (petId: string, name: string, dosage?: string, frequency?: string) => {
      const id = crypto.randomUUID();
      const med: Med = { id, name, dosage, frequency };
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, meds: [...p.meds, med] } : p)),
      }));
      persist(supabase.from("meds").insert({ id, pet_id: petId, name, dosage: dosage ?? null, frequency: frequency ?? null }), {
        rollback: () =>
          setState((prev) => ({ ...prev, pets: prev.pets.map((p) => (p.id === petId ? { ...p, meds: p.meds.filter((m) => m.id !== id) } : p)) })),
        message: `Couldn't save ${name}`,
      });
    },
    [supabase, persist]
  );

  const deleteMed = useCallback(
    (petId: string, medId: string) => {
      const removed = stateRef.current.pets.find((p) => p.id === petId)?.meds.find((m) => m.id === medId);
      if (!removed) return;
      undoableDelete({
        remove: () =>
          setState((prev) => ({ ...prev, pets: prev.pets.map((p) => (p.id === petId ? { ...p, meds: p.meds.filter((m) => m.id !== medId) } : p)) })),
        restore: () =>
          setState((prev) => ({
            ...prev,
            pets: prev.pets.map((p) => (p.id === petId && !p.meds.some((m) => m.id === medId) ? { ...p, meds: [...p.meds, removed] } : p)),
          })),
        commit: () => supabase.from("meds").delete().eq("id", medId).then(),
        message: `${removed.name} removed`,
      });
    },
    [supabase, undoableDelete]
  );

  const setSeenWelcome = useCallback(
    (seen: boolean) => {
      setState((p) => ({ ...p, seenWelcome: seen }));
      const h = hid();
      // No rollback here: reverting would re-open the intro overlay mid-session.
      // A failed write just means the intro may replay on next load — harmless.
      if (h)
        supabase
          .from("households")
          .update({ seen_welcome: seen })
          .eq("id", h)
          .then(({ error }) => {
            if (error) console.error("[petpal] seen_welcome update failed:", error);
          });
    },
    [supabase]
  );

  const setUnits = useCallback(
    (units: "kg" | "lb") => {
      const prev = stateRef.current.units;
      setState((p) => ({ ...p, units }));
      const h = hid();
      if (h)
        persist(supabase.from("households").update({ units }).eq("id", h), {
          rollback: () => setState((p) => ({ ...p, units: prev })),
          message: "Couldn't change units",
        });
    },
    [supabase, persist]
  );

  const setFamilyPassword = useCallback(
    async (newPassword: string | null, currentPassword?: string) => {
      const h = hid();
      if (!h) return false;
      if (stateRef.current.familyPasswordSet) {
        const { data } = await supabase.from("households").select("family_password_hash").eq("id", h).single();
        const storedHash = data?.family_password_hash ?? null;
        const providedHash = currentPassword ? await sha256Hex(currentPassword) : null;
        if (!storedHash || storedHash !== providedHash) {
          toast("🔒", "Incorrect current password", "");
          return false;
        }
      }
      const newHash = newPassword ? await sha256Hex(newPassword) : null;
      const { error } = await supabase.from("households").update({ family_password_hash: newHash }).eq("id", h);
      if (error) {
        toast("⚠️", "Couldn't update the family password", "");
        return false;
      }
      setState((prev) => ({ ...prev, familyPasswordSet: !!newHash }));
      toast(newHash ? "🔒" : "🔓", newHash ? "Family password set" : "Family password removed", "");
      return true;
    },
    [supabase, toast]
  );

  // Checks a typed family password against the stored hash. Used by the Family
  // section's lock gate on shared devices. Returns true if it matches (or if no
  // password is set, i.e. nothing to protect).
  const verifyFamilyPassword = useCallback(
    async (input: string) => {
      const h = hid();
      if (!h) return false;
      if (!stateRef.current.familyPasswordSet) return true;
      const { data } = await supabase.from("households").select("family_password_hash").eq("id", h).single();
      const storedHash = data?.family_password_hash ?? null;
      if (!storedHash) return true;
      return storedHash === (await sha256Hex(input));
    },
    [supabase]
  );

  const joinHousehold = useCallback(
    async (familyId: string) => {
      const target = familyId.trim();
      if (!target) return false;
      const { error } = await supabase.rpc("join_household", { target });
      if (error) {
        const notFound = (error as { code?: string }).code === "P0002" || /not found/i.test(error.message ?? "");
        toast(
          "⚠️",
          notFound ? "Couldn't find that household" : "Couldn't join household",
          notFound ? "Check the Family ID and try again" : "Please try again"
        );
        return false;
      }
      toast("🏡", "Joined household", "Loading it now…");
      // Full reload so the store re-hydrates against the newly-active household.
      window.location.reload();
      return true;
    },
    [supabase, toast]
  );

  const setActiveHousehold = useCallback(
    async (householdId: string) => {
      const uid = userIdRef.current;
      if (!uid || householdId === stateRef.current.activeHouseholdId) return;
      const { error } = await supabase.from("user_profiles").upsert({ user_id: uid, active_household_id: householdId });
      if (error) {
        toast("⚠️", "Couldn't switch household", "Please try again");
        return;
      }
      window.location.reload();
    },
    [supabase, toast]
  );

  const setNotificationPref = useCallback(
    (key: keyof typeof NOTIF_PREF_DB_COLUMN, on: boolean) => {
      const memberId = stateRef.current.currentMemberId;
      const prev = stateRef.current.members.find((m) => m.id === memberId)?.[key];
      setState((p) => ({
        ...p,
        members: p.members.map((m) => (m.id === memberId ? { ...m, [key]: on } : m)),
      }));
      if (memberId)
        persist(supabase.from("members").update({ [NOTIF_PREF_DB_COLUMN[key]]: on }).eq("id", memberId), {
          rollback: () =>
            prev != null && setState((p) => ({ ...p, members: p.members.map((m) => (m.id === memberId ? { ...m, [key]: prev } : m)) })),
          message: "Couldn't update notifications",
        });
    },
    [supabase, persist]
  );

  const signOut = useCallback(() => {
    supabase.auth.signOut().then(() => window.location.assign("/login"));
  }, [supabase]);

  return (
    <Ctx.Provider
      value={{
        state,
        hydrated,
        userEmail,
        toasts,
        toast,
        dismissToast,
        stopNotifications,
        logAction,
        switchMember,
        setPremium,
        buyCosmetic,
        toggleEquip,
        addReminder,
        toggleReminder,
        deleteReminder,
        addPet,
        editPet,
        deletePet,
        addWeight,
        addMember,
        editMember,
        removeMember,
        bookVetById,
        unbookVetById,
        restockSupply,
        useSupply,
        addMed,
        deleteMed,
        setSeenWelcome,
        setUnits,
        setFamilyPassword,
        verifyFamilyPassword,
        joinHousehold,
        setActiveHousehold,
        setNotificationPref,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

// Level curve gets incrementally harder: the XP cost of each level step grows
// with the level (step n→n+1 costs 100*n XP), so `xpForLevel` is the
// triangular-number cumulative total needed to have reached a given level.
export const xpForLevel = (n: number) => (100 * (n - 1) * n) / 2;
export const levelStepXp = (n: number) => 100 * n;
export const level = (xp: number) => {
  let n = 1;
  while (xpForLevel(n + 1) <= xp) n++;
  return n;
};
export const levelProgress = (xp: number) => xp - xpForLevel(level(xp));

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function dueLabel(ts: number) {
  const days = Math.round((ts - Date.now()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
