"use client";

import { WeightPoint, formatWeight } from "@/lib/data";

/**
 * Small pixel-style weight chart: stepped blocky line over gridlines, with an
 * optional target-range band. SVG so it stays crisp; deliberately chunky to
 * match the pixel theme. Not interactive (demo).
 */
export default function PixelChart({
  points,
  target,
  units,
  height = 120,
}: {
  points: WeightPoint[];
  target?: [number, number];
  units: "kg" | "lb";
  height?: number;
}) {
  if (points.length < 2) return null;

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

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-pixel text-[10px] text-label">{formatWeight(last.kg, units)}</span>
        <span className={`text-[12px] font-semibold ${delta >= 0 ? "text-orange" : "text-green"}`}>
          {delta >= 0 ? "▲" : "▼"} {formatWeight(Math.abs(delta), units)} over 6 mo
        </span>
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
      {target && (
        <p className="mt-2 text-[12px] text-label-2">
          Healthy range: <span className="font-semibold text-green">{formatWeight(target[0], units)}–{formatWeight(target[1], units)}</span>
        </p>
      )}
    </div>
  );
}
