/**
 * Tiny pixel-art renderer. A sprite is an array of equal-length strings (rows);
 * each character maps to a color via `palette` (space / "." = transparent).
 * Rendered as SVG <rect> blocks so it stays razor-sharp at any size and needs
 * no image assets. Author sprites by hand in the *.sprite.ts files.
 */
export type Sprite = { rows: string[]; palette: Record<string, string> };

export default function PixelSprite({
  sprite,
  size,
  className = "",
  style,
}: {
  sprite: Sprite;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const h = sprite.rows.length;
  const w = sprite.rows[0]?.length ?? 0;
  const rects: React.ReactNode[] = [];

  for (let y = 0; y < h; y++) {
    const row = sprite.rows[y];
    let x = 0;
    while (x < w) {
      const ch = row[x];
      const color = sprite.palette[ch];
      if (!color || ch === " " || ch === ".") {
        x++;
        continue;
      }
      // Run-length merge horizontally to cut rect count.
      let run = 1;
      while (x + run < w && row[x + run] === ch) run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={color} />);
      x += run;
    }
  }

  return (
    <svg
      width={size}
      height={(size / w) * h}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden
    >
      {rects}
    </svg>
  );
}
