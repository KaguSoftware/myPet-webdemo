"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACTIONS, ActionType, ADMIN_ROLE, Activity, AppState, CosmeticSlot, Med, Member, Pet, Reminder, VET, cosmetic, dailyGramTarget, dailyTarget } from "./data";

// Verb used in alert copy for each loggable action that can carry a /plan daily target.
const ALERT_VERB: Partial<Record<ActionType, string>> = {
  fed: "eating",
  water: "drinking",
  litter: "using the litter box",
  walk: "going for walks",
};

function sameCalendarDay(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  body?: string;
}

interface Store {
  state: AppState;
  hydrated: boolean;
  userEmail: string | null;
  toast: (emoji: string, title: string, body?: string) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  stopNotifications: () => void;
  logAction: (petId: string, type: ActionType, grams?: number) => void;
  switchMember: (id: string) => void;
  setPremium: (on: boolean) => void;
  buyCosmetic: (petId: string, cosmeticId: string) => void;
  toggleEquip: (petId: string, cosmeticId: string) => void;
  addReminder: (r: Omit<Reminder, "id" | "done" | "source">) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addPet: (name: string, species: "cat" | "dog", breed: string) => void;
  editPet: (petId: string, patch: { name: string; breed: string; ageYears: number; weightKg: number; cupGrams: number }) => void;
  deletePet: (petId: string) => void;
  addWeight: (petId: string, kg: number) => void;
  addMember: (name: string, role: string) => void;
  editMember: (memberId: string, patch: { name: string; role: string }) => void;
  removeMember: (memberId: string) => void;
  bookVet: () => void;
  bookVetById: (vetId: string) => void;
  restockSupply: (petId: string, supplyId: string) => void;
  useSupply: (petId: string, supplyId: string) => void;
  addMed: (petId: string, name: string, dosage?: string, frequency?: string) => void;
  deleteMed: (petId: string, medId: string) => void;
  setSeenWelcome: (seen: boolean) => void;
  setUnits: (units: "kg" | "lb") => void;
  /** Set, change, or remove (pass null) the family password. Verifies `currentPassword` against the stored hash first if one is already set — returns false and toasts on mismatch. */
  setFamilyPassword: (newPassword: string | null, currentPassword?: string) => Promise<boolean>;
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
};

/** SHA-256 hex digest — used to avoid storing the family password in plaintext. */
async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type SupabaseClient = ReturnType<typeof createClient>;

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
    .insert({ owner_id: userId, coins: 340, xp: 260, streak: 4, units: "kg" })
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
  if (you) await supabase.from("households").update({ current_member_id: you.id }).eq("id", household.id);

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
        weight_kg: 200,
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
      { pet_id: cat.id, ts: now - 24 * W, kg: 120 },
      { pet_id: cat.id, ts: now - 20 * W, kg: 140 },
      { pet_id: cat.id, ts: now - 16 * W, kg: 158 },
      { pet_id: cat.id, ts: now - 12 * W, kg: 172 },
      { pet_id: cat.id, ts: now - 8 * W, kg: 185 },
      { pet_id: cat.id, ts: now - 4 * W, kg: 194 },
      { pet_id: cat.id, ts: now, kg: 200 },
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
  current_member_id: string | null;
  premium: boolean;
  coins: number;
  xp: number;
  streak: number;
  seen_welcome: boolean;
  units: "kg" | "lb";
  last_seen_at: number | null;
  family_password_hash: string | null;
  members: { id: string; name: string; emoji: string; role: string; gradient_from: string; gradient_to: string; created_at: string }[];
  pets: (PetRow & { created_at: string })[];
  activities: { id: string; pet_id: string; member_id: string; type: ActionType; ts: number; note: string | null; grams: number | null }[];
  reminders: { id: string; pet_id: string; title: string; emoji: string; due: number; done: boolean; source: "manual" | "plan"; alert: boolean | null; vet_id: string | null }[];
  booked_vets: { vet_id: string }[];
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const householdIdRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const notifiedActivityIdsRef = useRef<Set<string>>(new Set());
  // setTimeout ids for the staggered "what everyone else did" toast batch
  // (see notifyRecentActivity below) — lets stopNotifications cancel any
  // still-queued toasts from that batch in one shot.
  const pendingNotificationTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const hid = () => householdIdRef.current;

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

  // Toast the given member about what everyone *else* logged in the last 16h
  // — never their own actions. Used both on login/reload and on switching
  // which family member is "active". A ref-backed id set keeps re-runs
  // within the same session (e.g. flipping between members) from replaying
  // the same toast twice.
  const notifyRecentActivity = useCallback(
    (forMemberId: string, activitiesList: Activity[], petsList: Pet[], membersList: Member[]) => {
      const cutoff = Date.now() - 16 * 60 * 60 * 1000;
      const recent = activitiesList
        .filter((a) => a.ts >= cutoff && a.memberId !== forMemberId && !notifiedActivityIdsRef.current.has(a.id))
        .sort((a, b) => a.ts - b.ts);
      recent.forEach((a, i) => {
        notifiedActivityIdsRef.current.add(a.id);
        const pet = petsList.find((p) => p.id === a.petId);
        const member = membersList.find((m) => m.id === a.memberId);
        if (!pet || !member) return;
        const action = ACTIONS[a.type];
        const time = new Date(a.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const timeoutId = setTimeout(() => {
          pendingNotificationTimeoutsRef.current.delete(timeoutId);
          toast(action.emoji, `${member.name} ${action.verb} ${pet.name}`, `${time} · ${timeAgo(a.ts)}`);
        }, i * 1400);
        pendingNotificationTimeoutsRef.current.add(timeoutId);
      });
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
        .then();
      toast("🚨", title, kind === "over" ? `Might be worth keeping an eye on ${pet.name}` : "Might be worth a vet check");
    },
    [supabase, toast]
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
      setUserEmail(user.email ?? null);

      // Single nested query for household + members/pets/weights/supplies/
      // activities/reminders/booked_vets in one round trip.
      const { data: household, error: householdErr } = await supabase
        .from("households")
        .select(HOUSEHOLD_SELECT)
        .eq("owner_id", user.id)
        .maybeSingle<HouseholdRow>();
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
      const currentMemberId = h.current_member_id ?? members[0]?.id ?? "";
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
      }));
      setState({
        currentMemberId,
        premium: h.premium,
        coins: h.coins,
        xp: h.xp,
        streak: h.streak,
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
      });
      setHydrated(true);

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

      supabase.from("households").update({ last_seen_at: Date.now() }).eq("id", h.id).then();
    }

    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, toast, notifyRecentActivity, raiseFeedingAlert]);

  const logAction = useCallback(
    (petId: string, type: ActionType, grams?: number) => {
      const h = hid();
      if (!h) return;
      const id = crypto.randomUUID();
      const ts = Date.now();
      const memberId = stateRef.current.currentMemberId;
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      // Logging litter (cats) or a walk (dogs) drains the sanitation supply,
      // matched by icon rather than a hardcoded id — seed cats use "litter",
      // generated pets use "sanitation", dogs use "poopbags", all icon "broom".
      const litterSupply =
        type === "litter" || type === "walk" ? pet?.supplies.find((s) => s.icon === "broom") : undefined;
      const litterLevel = litterSupply ? Math.max(0, litterSupply.level - 15) : null;
      // Feeding through the portion picker drains the food supply (icon
      // "bowl") proportionally to the portion — a full cup drains 10%.
      const foodSupply = type === "fed" && grams != null ? pet?.supplies.find((s) => s.icon === "bowl") : undefined;
      const foodLevel =
        foodSupply && pet ? Math.max(0, foodSupply.level - 10 * (grams! / pet.cupGrams)) : null;

      if (type === "meds" && pet?.meds.length === 0) {
        toast("🙂", "No meds", `${pet.name} isn't on any medication right now`);
        return;
      }

      setState((prev) => ({
        ...prev,
        coins: prev.coins + 5,
        xp: prev.xp + 10,
        activities: [{ id, petId, memberId, type, ts, grams }, ...prev.activities],
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
      toast(ACTIONS[type].emoji, `${pet?.name} — ${ACTIONS[type].label.toLowerCase()} at ${time}`, `Family notified 📣 · ${gramsNote}+5 coins · +10 XP`);

      supabase.from("activities").insert({ id, household_id: h, pet_id: petId, member_id: memberId, type, ts, grams: grams ?? null }).then();
      supabase
        .from("households")
        .update({ coins: stateRef.current.coins + 5, xp: stateRef.current.xp + 10 })
        .eq("id", h)
        .then();
      if (litterSupply && litterLevel != null) {
        supabase.from("supplies").update({ level: litterLevel }).eq("pet_id", petId).eq("supply_key", litterSupply.id).then();
      }
      if (foodSupply && foodLevel != null) {
        supabase.from("supplies").update({ level: foodLevel }).eq("pet_id", petId).eq("supply_key", foodSupply.id).then();
      }

      // Over-target check: raise a health alert and suggest a vet visit.
      // Feeding is judged on grams fed today vs the pet's daily gram target;
      // every other tracked action is judged on raw tap count vs its /plan
      // (or species-default) daily target.
      if (pet) {
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
      }
    },
    [supabase, toast, raiseFeedingAlert]
  );

  const switchMember = useCallback(
    (id: string) => {
      setState((p) => ({ ...p, currentMemberId: id }));
      notifyRecentActivity(id, stateRef.current.activities, stateRef.current.pets, stateRef.current.members);
      const h = hid();
      if (h) supabase.from("households").update({ current_member_id: id }).eq("id", h).then();
    },
    [supabase, notifyRecentActivity]
  );

  const setPremium = useCallback(
    (on: boolean) => {
      setState((p) => ({ ...p, premium: on }));
      const h = hid();
      if (h) supabase.from("households").update({ premium: on }).eq("id", h).then();
    },
    [supabase]
  );

  const buyCosmetic = useCallback(
    (petId: string, cosmeticId: string) => {
      const item = cosmetic(cosmeticId);
      if (!item) return;
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      if (!pet || stateRef.current.coins < item.price) return;
      const owned = [...pet.owned, cosmeticId];
      const equipped = { ...pet.equipped, [item.slot]: cosmeticId };
      const coins = stateRef.current.coins - item.price;
      setState((prev) => ({
        ...prev,
        coins,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, owned, equipped } : p)),
      }));
      const h = hid();
      if (!h) return;
      supabase.from("pets").update({ owned, equipped }).eq("id", petId).then();
      supabase.from("households").update({ coins }).eq("id", h).then();
    },
    [supabase]
  );

  const toggleEquip = useCallback(
    (petId: string, cosmeticId: string) => {
      const item = cosmetic(cosmeticId);
      if (!item) return;
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      if (!pet) return;
      const equipped = { ...pet.equipped };
      if (equipped[item.slot] === cosmeticId) delete equipped[item.slot];
      else equipped[item.slot as CosmeticSlot] = cosmeticId;
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, equipped } : p)),
      }));
      supabase.from("pets").update({ equipped }).eq("id", petId).then();
    },
    [supabase]
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
      supabase
        .from("reminders")
        .insert({
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
        })
        .then();
    },
    [supabase]
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
      supabase.from("reminders").update({ done }).eq("id", id).then();
    },
    [supabase]
  );

  const deleteReminder = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }));
      supabase.from("reminders").delete().eq("id", id).then();
    },
    [supabase]
  );

  const addPet = useCallback(
    (name: string, species: "cat" | "dog", breed: string) => {
      const h = hid();
      if (!h) {
        console.error("[petpal] addPet called before household loaded");
        toast("⚠️", "Couldn't add pet", "Your household hasn't finished loading — try again in a moment");
        return;
      }
      const id = crypto.randomUUID();
      const weightKg = species === "cat" ? 4 : 20;
      const cupGrams = species === "cat" ? 60 : 120;
      const gradient: [string, string] =
        species === "cat"
          ? ["oklch(0.66 0.13 165)", "oklch(0.52 0.14 200)"]
          : ["oklch(0.68 0.15 350)", "oklch(0.55 0.17 20)"];
      const supplies = [
        { id: "food", name: species === "cat" ? "Dry food" : "Kibble", icon: "bowl", level: 100 },
        { id: "sanitation", name: species === "cat" ? "Litter" : "Poop bags", icon: "broom", level: 100 },
        { id: "treats", name: "Treats", icon: "star", level: 100 },
      ];
      const weights = [{ ts: Date.now(), kg: weightKg }];
      setState((prev) => ({
        ...prev,
        pets: [
          ...prev.pets,
          { id, name, species, breed, emoji: species === "cat" ? "🐱" : "🐶", ageYears: 1, weightKg, owned: [], equipped: {}, gradient, weights, supplies, meds: [], cupGrams },
        ],
      }));
      supabase
        .from("pets")
        .insert({
          id,
          household_id: h,
          name,
          species,
          breed,
          emoji: species === "cat" ? "🐱" : "🐶",
          age_years: 1,
          weight_kg: weightKg,
          owned: [],
          equipped: {},
          gradient_from: gradient[0],
          gradient_to: gradient[1],
          cup_grams: cupGrams,
        })
        .then(({ error }) => {
          if (error) {
            console.error("[petpal] pet insert failed:", error);
            toast("⚠️", `${name} wasn't saved`, "It'll disappear on reload — please try again");
            setState((prev) => ({ ...prev, pets: prev.pets.filter((p) => p.id !== id) }));
            return;
          }
          supabase.from("weights").insert({ pet_id: id, ts: weights[0].ts, kg: weightKg }).then();
          supabase.from("supplies").insert(supplies.map((s) => ({ pet_id: id, supply_key: s.id, name: s.name, icon: s.icon, level: s.level }))).then();
          toast("🐾", `${name} joined the family`, "Care tracking is ready");
        });
    },
    [supabase, toast]
  );

  const editPet = useCallback(
    (petId: string, patch: { name: string; breed: string; ageYears: number; weightKg: number; cupGrams: number }) => {
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, ...patch } : p)),
      }));
      supabase
        .from("pets")
        .update({ name: patch.name, breed: patch.breed, age_years: patch.ageYears, weight_kg: patch.weightKg, cup_grams: patch.cupGrams })
        .eq("id", petId)
        .then();
    },
    [supabase]
  );

  const deletePet = useCallback(
    (petId: string) => {
      setState((prev) => ({ ...prev, pets: prev.pets.filter((p) => p.id !== petId) }));
      supabase.from("pets").delete().eq("id", petId).then();
    },
    [supabase]
  );

  const addWeight = useCallback(
    (petId: string, kg: number) => {
      const ts = Date.now();
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) =>
          p.id === petId ? { ...p, weightKg: kg, weights: [...p.weights, { ts, kg }] } : p
        ),
      }));
      supabase.from("weights").insert({ pet_id: petId, ts, kg }).then();
      supabase.from("pets").update({ weight_kg: kg }).eq("id", petId).then();
    },
    [supabase]
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
        members: [...prev.members, { id, name, emoji, role, gradient }],
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
      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
      }));
      supabase.from("members").update({ name: patch.name, role: patch.role }).eq("id", memberId).then();
    },
    [supabase]
  );

  const removeMember = useCallback(
    (memberId: string) => {
      if (stateRef.current.members.length <= 1) {
        toast("⚠️", "Can't remove the last member", "A household needs at least one member");
        return;
      }
      const wasCurrent = stateRef.current.currentMemberId === memberId;
      const fallbackId = stateRef.current.members.find((m) => m.id !== memberId)?.id;
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        activities: prev.activities.filter((a) => a.memberId !== memberId),
        currentMemberId: wasCurrent && fallbackId ? fallbackId : prev.currentMemberId,
      }));
      supabase.from("members").delete().eq("id", memberId).then();
      const h = hid();
      if (h && wasCurrent && fallbackId) {
        supabase.from("households").update({ current_member_id: fallbackId }).eq("id", h).then();
      }
    },
    [supabase, toast]
  );

  const bookVet = useCallback(() => setState((p) => ({ ...p, bookedVet: true })), []);

  const bookVetById = useCallback(
    (vetId: string) => {
      const h = hid();
      if (!h) return;
      setState((p) => ({
        ...p,
        bookedVet: true,
        bookedVetIds: p.bookedVetIds.includes(vetId) ? p.bookedVetIds : [...p.bookedVetIds, vetId],
      }));
      supabase.from("booked_vets").upsert({ household_id: h, vet_id: vetId }).then();
    },
    [supabase]
  );

  const restockSupply = useCallback(
    (petId: string, supplyId: string) => {
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) =>
          p.id === petId ? { ...p, supplies: p.supplies.map((s) => (s.id === supplyId ? { ...s, level: 100 } : s)) } : p
        ),
      }));
      supabase.from("supplies").update({ level: 100 }).eq("pet_id", petId).eq("supply_key", supplyId).then();
    },
    [supabase]
  );

  const useSupply = useCallback(
    (petId: string, supplyId: string) => {
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      const supply = pet?.supplies.find((s) => s.id === supplyId);
      const level = Math.max(0, (supply?.level ?? 0) - 15);
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) =>
          p.id === petId ? { ...p, supplies: p.supplies.map((s) => (s.id === supplyId ? { ...s, level } : s)) } : p
        ),
      }));
      supabase.from("supplies").update({ level }).eq("pet_id", petId).eq("supply_key", supplyId).then();
    },
    [supabase]
  );

  const addMed = useCallback(
    (petId: string, name: string, dosage?: string, frequency?: string) => {
      const id = crypto.randomUUID();
      const med: Med = { id, name, dosage, frequency };
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, meds: [...p.meds, med] } : p)),
      }));
      supabase.from("meds").insert({ id, pet_id: petId, name, dosage: dosage ?? null, frequency: frequency ?? null }).then();
    },
    [supabase]
  );

  const deleteMed = useCallback(
    (petId: string, medId: string) => {
      setState((prev) => ({
        ...prev,
        pets: prev.pets.map((p) => (p.id === petId ? { ...p, meds: p.meds.filter((m) => m.id !== medId) } : p)),
      }));
      supabase.from("meds").delete().eq("id", medId).then();
    },
    [supabase]
  );

  const setSeenWelcome = useCallback(
    (seen: boolean) => {
      setState((p) => ({ ...p, seenWelcome: seen }));
      const h = hid();
      if (h) supabase.from("households").update({ seen_welcome: seen }).eq("id", h).then();
    },
    [supabase]
  );

  const setUnits = useCallback(
    (units: "kg" | "lb") => {
      setState((p) => ({ ...p, units }));
      const h = hid();
      if (h) supabase.from("households").update({ units }).eq("id", h).then();
    },
    [supabase]
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
        bookVet,
        bookVetById,
        restockSupply,
        useSupply,
        addMed,
        deleteMed,
        setSeenWelcome,
        setUnits,
        setFamilyPassword,
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

export const level = (xp: number) => Math.floor(xp / 100) + 1;
export const levelProgress = (xp: number) => xp % 100;

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
