"use client";

import { useEffect, useRef, useState } from "react";
import { Pet } from "@/lib/data";
import PixelSprite from "./PixelSprite";
import { CAT_BODY_SPRITE, DOG_BODY_SPRITE } from "./petBodySprites";
import { CAT_FUR, DOG_FUR, furSprite } from "./petSprites";

/**
 * "Fake 3D" pet: the pixel sprite lives on a CSS 3D-transformed card. Dragging
 * (mouse or touch) rotates it in perspective; a layered shadow/plate sells the
 * depth. On release the pose is held ~2.5s, then springs back to front-facing.
 * Respects prefers-reduced-motion (no tilt, instant reset).
 */
const HOLD_MS = 2500;
const MAX_DEG = 32;

export default function Pet3D({ pet, size }: { pet: Pet; size: number }) {
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  // Lazy init reads the media query once (guarded for SSR); the effect below
  // only subscribes to later changes, so we never setState synchronously in it.
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const start = useRef<{ px: number; py: number; rx: number; ry: number } | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const point = (e: React.PointerEvent) => ({ px: e.clientX, py: e.clientY });

  const onDown = (e: React.PointerEvent) => {
    if (reduced) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    window.clearTimeout(holdTimer.current);
    const { px, py } = point(e);
    start.current = { px, py, rx: rot.x, ry: rot.y };
    setDragging(true);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging || !start.current) return;
    const { px, py } = point(e);
    const dy = (px - start.current.px) / (size / (MAX_DEG * 2));
    const dx = (start.current.py - py) / (size / (MAX_DEG * 2));
    setRot({
      x: Math.max(-MAX_DEG, Math.min(MAX_DEG, start.current.rx + dx)),
      y: Math.max(-MAX_DEG * 2, Math.min(MAX_DEG * 2, start.current.ry + dy)),
    });
  };

  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    start.current = null;
    // Hold the pose, then spring back to front.
    holdTimer.current = window.setTimeout(() => setRot({ x: 0, y: 0 }), HOLD_MS);
  };

  return (
    <div
      className="relative touch-none select-none"
      style={{ width: size, height: size, perspective: size * 3 }}
    >
      {/* ground shadow reacts to tilt */}
      <span
        className="absolute left-1/2 bottom-0 h-3 -translate-x-1/2 rounded-[50%] bg-[oklch(0.35_0.05_288/0.22)] blur-[3px]"
        style={{ width: size * 0.6, transform: `translateX(-50%) translateY(${Math.abs(rot.x) * 0.2}px) scaleX(${1 - Math.abs(rot.y) / 180})` }}
      />
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="flex h-full w-full items-center justify-center"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transition: dragging ? "none" : "transform 0.7s cubic-bezier(0.34, 1.3, 0.44, 1)",
          cursor: dragging ? "grabbing" : "grab",
        }}
      >
        {/* back plate gives the sprite thickness as it turns */}
        <span
          className="absolute inset-[12%] rounded-2xl bg-[oklch(0.4_0.05_288/0.25)]"
          style={{ transform: "translateZ(-14px)" }}
        />
        {pet.species === "cat" ? (
          <PixelSprite sprite={furSprite(CAT_BODY_SPRITE, CAT_FUR.body, CAT_FUR.shade)} size={size * 0.55} className="pixelated" />
        ) : (
          <PixelSprite sprite={furSprite(DOG_BODY_SPRITE, DOG_FUR.body, DOG_FUR.shade)} size={size * 0.55} className="pixelated" />
        )}
      </div>
    </div>
  );
}
