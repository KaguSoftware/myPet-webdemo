"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ACTIONS, ActionType, AppState, CosmeticSlot, Reminder, SEED, cosmetic } from "./data";

const STORAGE_KEY = "petpal-state-v3";

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  body?: string;
}

interface Store {
  state: AppState;
  hydrated: boolean;
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
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

let idCounter = 0;
const uid = () => `${Date.now().toString(36)}-${++idCounter}`;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(SEED);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...SEED, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (emoji: string, title: string, body?: string) => {
      const id = ++idCounter + Date.now();
      setToasts((t) => [...t.slice(-2), { id, emoji, title, body }]);
      setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast]
  );

  // Simulated family liveliness: another member occasionally logs care.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(() => {
      if (Math.random() > 0.5) return;
      const s = stateRef.current;
      const others = s.members.filter((m) => m.id !== s.currentMemberId);
      const member = others[Math.floor(Math.random() * others.length)];
      const pet = s.pets[Math.floor(Math.random() * s.pets.length)];
      if (!member || !pet) return;
      const pool: ActionType[] = pet.species === "cat" ? ["fed", "water", "litter"] : ["fed", "water", "walk"];
      const type = pool[Math.floor(Math.random() * pool.length)];
      setState((prev) => ({
        ...prev,
        activities: [{ id: uid(), petId: pet.id, memberId: member.id, type, ts: Date.now() }, ...prev.activities],
      }));
      toast(ACTIONS[type].emoji, `${member.name} ${ACTIONS[type].verb} ${pet.name}`, "Family notification");
    }, 40_000);
    return () => clearInterval(timer);
  }, [hydrated, toast]);

  const logAction = useCallback(
    (petId: string, type: ActionType) => {
      setState((prev) => {
        const pet = prev.pets.find((p) => p.id === petId);
        if (!pet) return prev;
        return {
          ...prev,
          coins: prev.coins + 5,
          xp: prev.xp + 10,
          activities: [
            { id: uid(), petId, memberId: prev.currentMemberId, type, ts: Date.now() },
            ...prev.activities,
          ],
        };
      });
      const pet = stateRef.current.pets.find((p) => p.id === petId);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      toast(ACTIONS[type].emoji, `${pet?.name} — ${ACTIONS[type].label.toLowerCase()} at ${time}`, "Family notified 📣 · +5 coins · +10 XP");
    },
    [toast]
  );

  const switchMember = useCallback((id: string) => setState((p) => ({ ...p, currentMemberId: id })), []);
  const setPremium = useCallback((on: boolean) => setState((p) => ({ ...p, premium: on })), []);

  const buyCosmetic = useCallback(
    (petId: string, cosmeticId: string) => {
      const item = cosmetic(cosmeticId);
      if (!item) return;
      setState((prev) => {
        if (prev.coins < item.price) return prev;
        return {
          ...prev,
          coins: prev.coins - item.price,
          pets: prev.pets.map((p) =>
            p.id === petId
              ? { ...p, owned: [...p.owned, cosmeticId], equipped: { ...p.equipped, [item.slot]: cosmeticId } }
              : p
          ),
        };
      });
    },
    []
  );

  const toggleEquip = useCallback((petId: string, cosmeticId: string) => {
    const item = cosmetic(cosmeticId);
    if (!item) return;
    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) => {
        if (p.id !== petId) return p;
        const equipped = { ...p.equipped };
        if (equipped[item.slot] === cosmeticId) delete equipped[item.slot];
        else equipped[item.slot as CosmeticSlot] = cosmeticId;
        return { ...p, equipped };
      }),
    }));
  }, []);

  const addReminder = useCallback((r: Omit<Reminder, "id" | "done" | "source">) => {
    setState((prev) => ({
      ...prev,
      reminders: [...prev.reminders, { ...r, id: uid(), done: false, source: "manual" }],
    }));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
    }));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }));
  }, []);

  const addPet = useCallback((name: string, species: "cat" | "dog", breed: string) => {
    setState((prev) => ({
      ...prev,
      pets: [
        ...prev.pets,
        {
          id: uid(),
          name,
          species,
          breed,
          emoji: species === "cat" ? "🐱" : "🐶",
          ageYears: 1,
          weightKg: species === "cat" ? 4 : 20,
          owned: [],
          equipped: {},
          gradient:
            species === "cat"
              ? (["oklch(0.66 0.13 165)", "oklch(0.52 0.14 200)"] as [string, string])
              : (["oklch(0.68 0.15 350)", "oklch(0.55 0.17 20)"] as [string, string]),
          weights: [{ ts: Date.now(), kg: species === "cat" ? 4 : 20 }],
          supplies: [
            { id: "food", name: species === "cat" ? "Dry food" : "Kibble", icon: "bowl", level: 100 },
            { id: "sanitation", name: species === "cat" ? "Litter" : "Poop bags", icon: "broom", level: 100 },
            { id: "treats", name: "Treats", icon: "star", level: 100 },
          ],
        },
      ],
    }));
  }, []);

  const bookVet = useCallback(() => setState((p) => ({ ...p, bookedVet: true })), []);

  const bookVetById = useCallback(
    (vetId: string) =>
      setState((p) => ({
        ...p,
        bookedVet: true,
        bookedVetIds: p.bookedVetIds.includes(vetId) ? p.bookedVetIds : [...p.bookedVetIds, vetId],
      })),
    []
  );

  const restockSupply = useCallback((petId: string, supplyId: string) => {
    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.id === petId
          ? { ...p, supplies: p.supplies.map((s) => (s.id === supplyId ? { ...s, level: 100 } : s)) }
          : p
      ),
    }));
  }, []);

  const useSupply = useCallback((petId: string, supplyId: string) => {
    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.id === petId
          ? { ...p, supplies: p.supplies.map((s) => (s.id === supplyId ? { ...s, level: Math.max(0, s.level - 15) } : s)) }
          : p
      ),
    }));
  }, []);

  const setSeenWelcome = useCallback((seen: boolean) => setState((p) => ({ ...p, seenWelcome: seen })), []);
  const setUnits = useCallback((units: "kg" | "lb") => setState((p) => ({ ...p, units })), []);

  const resetDemo = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.location.reload();
  }, []);

  return (
    <Ctx.Provider
      value={{
        state,
        hydrated,
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
        resetDemo,
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
