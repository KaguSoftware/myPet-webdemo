"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Device-local display accessibility preferences (Reduce Motion / Reduce
 * Transparency). These are intentionally NOT part of the Supabase household
 * store: like the OS-level equivalents they belong to the *device*, not the
 * shared family data, so they persist to localStorage instead. That keeps the
 * "no localStorage for household data" rule intact while giving the settings a
 * real, persistent effect.
 *
 * Backed by useSyncExternalStore so it stays hydration-safe (server snapshot =
 * defaults) and avoids setState-in-effect. The active prefs are reflected as
 * data attributes on <html>; globals.css keys the overrides off them.
 */
export type A11yPrefs = { reduceMotion: boolean; reduceTransparency: boolean };

const KEY = "petpal.a11y";
const DEFAULT: A11yPrefs = { reduceMotion: false, reduceTransparency: false };

const listeners = new Set<() => void>();
let current: A11yPrefs = DEFAULT;
let loaded = false;

function read(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as Partial<A11yPrefs>;
    return { reduceMotion: !!p.reduceMotion, reduceTransparency: !!p.reduceTransparency };
  } catch {
    return DEFAULT;
  }
}

function getSnapshot(): A11yPrefs {
  // Lazily hydrate from localStorage on the first client read, then return the
  // cached object so the reference stays stable between updates.
  if (!loaded && typeof window !== "undefined") {
    current = read();
    loaded = true;
  }
  return current;
}

function getServerSnapshot(): A11yPrefs {
  return DEFAULT;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function set(next: Partial<A11yPrefs>): void {
  current = { ...getSnapshot(), ...next };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // storage may be unavailable (private mode) — prefs just won't persist
  }
  listeners.forEach((l) => l());
}

export function useA11y() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    reduceMotion: prefs.reduceMotion,
    reduceTransparency: prefs.reduceTransparency,
    setReduceMotion: (v: boolean) => set({ reduceMotion: v }),
    setReduceTransparency: (v: boolean) => set({ reduceTransparency: v }),
  };
}

/** Mount once high in the tree: reflects the active prefs onto <html>. */
export function AccessibilityProvider({ children }: { children?: React.ReactNode }) {
  const { reduceMotion, reduceTransparency } = useA11y();
  useEffect(() => {
    const el = document.documentElement;
    el.toggleAttribute("data-reduce-motion", reduceMotion);
    el.toggleAttribute("data-reduce-transparency", reduceTransparency);
  }, [reduceMotion, reduceTransparency]);
  return <>{children}</>;
}
