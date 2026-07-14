"use client";

import { useState } from "react";
import { WeightPoint, formatWeight } from "@/lib/data";
import { Icon } from "@/components/Icons";

const WINDOW_SIZE = 6;

function spanText(fromTs: number, toTs: number) {
  const days = Math.round((toTs - fromTs) / 86_400_000);
  if (days < 1) return null;
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

/**
 * Small pixel-style weight chart: stepped blocky line over gridlines, with an
 * optional target-range band. SVG so it stays crisp; deliberately chunky to
 * match the pixel theme. Shows a sliding 6-point window over the full
 * history; left/right arrows shift the window one record at a time.
 */
export default function PixelChart({
  points: allPoints,
  target,
  units,
  height = 120,
  onAddWeight,
}: {
  points: WeightPoint[];
  target?: [number, number];
  units: "kg" | "lb";
  height?: number;
  onAddWeight?: () => void;
}) {
  const maxStart = Math.max(0, allPoints.length - WINDOW_SIZE);
  // Track the point count alongside the window start so that whenever a new
  // weight is logged (points array grows/shrinks), the window jumps back to
  // the newest points during render instead of getting stuck on a stale
  // spot — manual left/right navigation only changes `start`, not
  // `pointCount`, so it's unaffected.
  const [{ pointCount, start: rawStart }, setWindow] = useState({ pointCount: allPoints.length, start: maxStart });
  if (allPoints.length !== pointCount) {
    setWindow({ pointCount: allPoints.length, start: Math.max(0, allPoints.length - WINDOW_SIZE) });
  }
  const setStart = (updater: (s: number) => number) => setWindow((s) => ({ ...s, start: updater(s.start) }));
  const start = Math.min(rawStart, maxStart);
  const points = allPoints.slice(start, start + WINDOW_SIZE);

  // Too little history to draw a line — show the latest weight and a hint
  // rather than an empty box, so the section is never blank and the user can
  // confirm a logged weight was recorded.
  if (allPoints.length < 2) {
    const latest = allPoints[allPoints.length - 1];
    return (
      <div className="flex flex-col items-center py-3 text-center">
        {latest ? (
          <>
            <span className="font-pixel text-[16px] text-label">{formatWeight(latest.kg, units)}</span>
            <p className="mt-1.5 text-[12px] text-label-2">Log another weight to see the trend.</p>
          </>
        ) : (
          <p className="text-[13px] text-label-2">No weight logged yet — tap the weight chip to add one.</p>
        )}
        {(target || onAddWeight) && (
          <div className="mt-1 flex w-full items-center justify-between gap-2">
            {target ? (
              <p className="text-[12px] text-label-2">
                Healthy range: <span className="font-semibold text-green">{formatWeight(target[0], units)}–{formatWeight(target[1], units)}</span>
              </p>
            ) : <span />}
            {onAddWeight && (
              <button
                onClick={onAddWeight}
                className="flex shrink-0 items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[12px] font-semibold text-accent active:scale-95"
              >
                <Icon name="plus" size={11} /> Add
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const W = 100;
  const H = 60;
  const pad = 4;

  const kgs = points.map((p) => p.kg);
  const lo = Math.min(...kgs, target?.[0] ?? Infinity);
  const hi = Math.max(...kgs, target?.[1] ?? -Infinity);
  const span = hi - lo || 1;
  const min = lo - span * 0.15;
  const max = hi + span * 0.15;

  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (kg: number) => H - pad - ((kg - min) / (max - min)) * (H - pad * 2);

  const bandTop = target ? y(target[1]) : 0;
  const bandBot = target ? y(target[0]) : 0;

  // stepped path
  let d = `M ${x(0)} ${y(points[0].kg)}`;
  for (let i = 1; i < points.length; i++) {
    const midX = (x(i - 1) + x(i)) / 2;
    d += ` L ${midX} ${y(points[i - 1].kg)} L ${midX} ${y(points[i].kg)} L ${x(i)} ${y(points[i].kg)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.kg - first.kg;
  const spanLabel = points.length > 1 ? spanText(first.ts, last.ts) : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-pixel text-[10px] text-label">{formatWeight(last.kg, units)}</span>
        <span className={`min-w-0 truncate text-[12px] font-semibold ${delta >= 0 ? "text-orange" : "text-green"}`}>
          {delta >= 0 ? "▲" : "▼"} {formatWeight(Math.abs(delta), units)}
          {spanLabel ? ` over ${spanLabel}` : ""}
        </span>
        {maxStart > 0 && (
          <span className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setStart((s) => Math.max(0, s - 1))}
              disabled={start === 0}
              aria-label="Older weight"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-fill text-label-2 transition-transform active:scale-90 disabled:opacity-30"
            >
              <Icon name="chevron-left" size={13} />
            </button>
            <button
              onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
              disabled={start === maxStart}
              aria-label="Newer weight"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-fill text-label-2 transition-transform active:scale-90 disabled:opacity-30"
            >
              <Icon name="chevron-right" size={13} />
            </button>
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} shapeRendering="crispEdges" className="overflow-visible">
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="var(--color-sep)" strokeWidth={0.4} />
        ))}
        {/* target band */}
        {target && (
          <rect x={pad} y={bandTop} width={W - pad * 2} height={Math.max(0, bandBot - bandTop)} fill="var(--color-green-soft)" />
        )}
        {/* stepped line */}
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={1.6} strokeLinejoin="miter" />
        {/* points as pixel squares */}
        {points.map((p, i) => (
          <rect key={i} x={x(i) - 1.1} y={y(p.kg) - 1.1} width={2.2} height={2.2} fill="var(--color-accent)" />
        ))}
      </svg>
      {(target || onAddWeight) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {target ? (
            <p className="text-[12px] text-label-2">
              Healthy range: <span className="font-semibold text-green">{formatWeight(target[0], units)}–{formatWeight(target[1], units)}</span>
            </p>
          ) : <span />}
          {onAddWeight && (
            <button
              onClick={onAddWeight}
              className="flex shrink-0 items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[12px] font-semibold text-accent active:scale-95"
            >
              <Icon name="plus" size={11} /> Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}
