"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACTIONS, ActionType, AppState, CosmeticSlot, Pet, Reminder, cosmetic } from "./data";

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
  logAction: (petId: string, type: ActionType) => void;
  switchMember: (id: string) => void;
  setPremium: (on: boolean) => void;
  buyCosmetic: (petId: string, cosmeticId: string) => void;
  toggleEquip: (petId: string, cosmeticId: string) => void;
  addReminder: (r: Omit<Reminder, "id" | "done" | "source">) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addPet: (name: string, species: "cat" | "dog", breed: string) => void;
  bookVet: () => void;
  bookVetById: (vetId: string) => void;
  restockSupply: (petId: string, supplyId: string) => void;
  useSupply: (petId: string, supplyId: string) => void;
  setSeenWelcome: (seen: boolean) => void;
  setUnits: (units: "kg" | "lb") => void;
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
};

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Fallback for when the on-signup DB trigger didn't create a household (seen
 * in practice — the trigger firing under GoTrue's auth.users insert isn't
 * fully reliable). Mirrors supabase/migrations/0001_init.sql's seed so a
 * user never lands on a permanently empty app.
 */
async function bootstrapHousehold(supabase: SupabaseClient, userId: string, name: string) {
  const { data: household, error: hErr } = await supabase
    .from("households")
    .insert({ owner_id: userId, coins: 340, xp: 260, streak: 4, units: "kg" })
    .select()
    .single();
  if (hErr || !household) {
    console.error("[petpal] bootstrap household insert failed:", hErr);
    return null;
  }

  const { data: members } = await supabase
    .from("members")
    .insert([
      { household_id: household.id, name, emoji: "🧑‍💻", role: "Owner", gradient_from: "oklch(0.62 0.16 258)", gradient_to: "oklch(0.5 0.18 280)" },
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

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (emoji: string, title: string, body?: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((t) => [...t.slice(-2), { id, emoji, title, body }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast]
  );

  // Load the signed-in user's household from Supabase on mount.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setHydrated(true);
        return;
      }
      setUserEmail(user.email ?? null);

      let { data: household } = await supabase.from("households").select("*").eq("owner_id", user.id).single();
      if (!household) {
        household = await bootstrapHousehold(
          supabase,
          user.id,
          (user.user_metadata as { name?: string } | null)?.name || "You"
        );
      }
      if (!household || cancelled) {
        setHydrated(true);
        return;
      }
      householdIdRef.current = household.id;

      const [
        { data: members, error: membersError },
        { data: petRows, error: petsError },
        { data: activities, error: activitiesError },
        { data: reminders, error: remindersError },
        { data: bookedVets, error: bookedVetsError },
      ] = await Promise.all([
        supabase.from("members").select("*").eq("household_id", household.id).order("created_at"),
        supabase.from("pets").select("*").eq("household_id", household.id).order("created_at"),
        supabase.from("activities").select("*").eq("household_id", household.id).order("ts", { ascending: false }),
        supabase.from("reminders").select("*").eq("household_id", household.id).order("due"),
        supabase.from("booked_vets").select("vet_id").eq("household_id", household.id),
      ]);
      for (const [label, err] of [
        ["members", membersError],
        ["pets", petsError],
        ["activities", activitiesError],
        ["reminders", remindersError],
        ["booked_vets", bookedVetsError],
      ] as const) {
        if (err) console.error(`[petpal] ${label} fetch failed:`, err);
      }

      const petIds = (petRows ?? []).map((p: PetRow) => p.id);
      const [{ data: weights }, { data: supplies }] = await Promise.all([
        petIds.length
          ? supabase.from("weights").select("*").in("pet_id", petIds).order("ts")
          : Promise.resolve({ data: [] }),
        petIds.length ? supabase.from("supplies").select("*").in("pet_id", petIds) : Promise.resolve({ data: [] }),
      ]);

      const pets: Pet[] = (petRows ?? []).map((p: PetRow) => ({
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
        weights: (weights ?? []).filter((w) => w.pet_id === p.id).map((w) => ({ ts: Number(w.ts), kg: Number(w.kg) })),
        supplies: (supplies ?? [])
          .filter((s) => s.pet_id === p.id)
          .map((s) => ({ id: s.supply_key, name: s.name, icon: s.icon, level: s.level })),
      }));

      if (cancelled) return;
      setState({
        currentMemberId: household.current_member_id ?? members?.[0]?.id ?? "",
        premium: household.premium,
        coins: household.coins,
        xp: household.xp,
        streak: household.streak,
        pets,
        members: (members ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          emoji: m.emoji,
          role: m.role,
          gradient: [m.gradient_from, m.gradient_to],
        })),
        activities: (activities ?? []).map((a) => ({
          id: a.id,
          petId: a.pet_id,
          memberId: a.member_id,
          type: a.type,
          ts: Number(a.ts),
          note: a.note ?? undefined,
        })),
        reminders: (reminders ?? []).map((r) => ({
          id: r.id,
          petId: r.pet_id,
          title: r.title,
          emoji: r.emoji,
          due: Number(r.due),
          done: r.done,
          source: r.source,
        })),
        bookedVet: (bookedVets ?? []).length > 0,
        bookedVetIds: (bookedVets ?? []).map((b) => b.vet_id),
        seenWelcome: household.seen_welcome,
        units: household.units,
      });
      setHydrated(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const hid = () => householdIdRef.current;

  const logAction = useCallback(
    (petId: string, type: ActionType) => {
      const h = hid();
      if (!h) return;
      const id = crypto.randomUUID();
      const ts = Date.now();
      const memberId = stateRef.current.currentMemberId;
      setState((prev) => ({
        ...prev,
        coins: prev.coins + 5,
        xp: prev.xp + 10,
        activities: [{ id, petId, memberId, type, ts }, ...prev.activities],
      }));
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      const time = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      toast(ACTIONS[type].emoji, `${pet?.name} — ${ACTIONS[type].label.toLowerCase()} at ${time}`, "Family notified 📣 · +5 coins · +10 XP");

      supabase.from("activities").insert({ id, household_id: h, pet_id: petId, member_id: memberId, type, ts }).then();
      supabase
        .from("households")
        .update({ coins: stateRef.current.coins + 5, xp: stateRef.current.xp + 10 })
        .eq("id", h)
        .then();
    },
    [supabase, toast]
  );

  const switchMember = useCallback(
    (id: string) => {
      setState((p) => ({ ...p, currentMemberId: id }));
      const h = hid();
      if (h) supabase.from("households").update({ current_member_id: id }).eq("id", h).then();
    },
    [supabase]
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
        .insert({ id, household_id: h, pet_id: r.petId, title: r.title, emoji: r.emoji, due: r.due, done: false, source: "manual" })
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
          { id, name, species, breed, emoji: species === "cat" ? "🐱" : "🐶", ageYears: 1, weightKg, owned: [], equipped: {}, gradient, weights, supplies },
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
        logAction,
        switchMember,
        setPremium,
        buyCosmetic,
        toggleEquip,
        addReminder,
        toggleReminder,
        deleteReminder,
        addPet,
        bookVet,
        bookVetById,
        restockSupply,
        useSupply,
        setSeenWelcome,
        setUnits,
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
