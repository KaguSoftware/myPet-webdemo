/**
 * Cute-but-credible cat/dog face, drawn on a 100×100 canvas so it scales
 * cleanly at any avatar size. Colors use currentColor (white on the gradient)
 * with a translucent darker tone for the muzzle/inner-ear depth.
 */
export default function PetFace({ species, size = 56 }: { species: "cat" | "dog"; size?: number }) {
  const shade = "rgba(0,0,0,0.14)";
  const line = "rgba(0,0,0,0.32)";
  const cheek = "rgba(255,255,255,0.9)";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
      {species === "cat" ? (
        <>
          {/* ears */}
          <path d="M24 40 L20 16 L42 30 Z" fill="currentColor" />
          <path d="M76 40 L80 16 L58 30 Z" fill="currentColor" />
          <path d="M26 34 L24 22 L36 30 Z" fill={shade} />
          <path d="M74 34 L76 22 L64 30 Z" fill={shade} />
          {/* head */}
          <ellipse cx="50" cy="54" rx="30" ry="27" fill="currentColor" />
          {/* eyes */}
          <ellipse cx="39" cy="52" rx="4" ry="5" fill={line} />
          <ellipse cx="61" cy="52" rx="4" ry="5" fill={line} />
          {/* nose */}
          <path d="M50 60 l3.2 3.2 a2 2 0 0 1 -1.4 3.4 h-3.6 a2 2 0 0 1 -1.4 -3.4 Z" fill={line} />
          {/* mouth */}
          <path d="M50 66 v3 M50 69 q-4 3 -8 1 M50 69 q4 3 8 1" stroke={line} strokeWidth="1.6" strokeLinecap="round" />
          {/* whiskers */}
          <path d="M30 58 h-14 M31 62 l-13 3 M70 58 h14 M69 62 l13 3" stroke="rgba(0,0,0,0.16)" strokeWidth="1.4" strokeLinecap="round" />
          {/* cheeks */}
          <circle cx="33" cy="61" r="3" fill={cheek} opacity="0.25" />
          <circle cx="67" cy="61" r="3" fill={cheek} opacity="0.25" />
        </>
      ) : (
        <>
          {/* floppy ears */}
          <path d="M22 40 C10 34 10 60 20 68 C28 62 28 46 30 42 Z" fill={shade} />
          <path d="M78 40 C90 34 90 60 80 68 C72 62 72 46 70 42 Z" fill={shade} />
          {/* head */}
          <ellipse cx="50" cy="52" rx="29" ry="26" fill="currentColor" />
          {/* muzzle */}
          <ellipse cx="50" cy="64" rx="16" ry="13" fill="rgba(255,255,255,0.16)" />
          {/* eyes */}
          <ellipse cx="40" cy="48" rx="4" ry="4.6" fill={line} />
          <ellipse cx="60" cy="48" rx="4" ry="4.6" fill={line} />
          {/* nose */}
          <ellipse cx="50" cy="60" rx="5" ry="4" fill={line} />
          {/* mouth */}
          <path d="M50 64 v4 M50 68 q-5 4 -9 1 M50 68 q5 4 9 1" stroke={line} strokeWidth="1.7" strokeLinecap="round" fill="none" />
          {/* cheeks */}
          <circle cx="34" cy="58" r="3.2" fill={cheek} opacity="0.22" />
          <circle cx="66" cy="58" r="3.2" fill={cheek} opacity="0.22" />
        </>
      )}
    </svg>
  );
}
