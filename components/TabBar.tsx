"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/activity", label: "Activity", emoji: "🔔" },
  { href: "/plan", label: "Care Plan", emoji: "📋" },
  { href: "/shop", label: "Shop", emoji: "🛍️" },
  { href: "/profile", label: "Family", emoji: "👨‍👩‍👧" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
      <div className="flex items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                active ? "text-brand-deep" : "text-ink-soft hover:text-ink"
              }`}
            >
              <span className={`text-xl transition-transform ${active ? "scale-110" : "opacity-70 grayscale-50"}`}>
                {t.emoji}
              </span>
              <span className={`text-[10px] leading-tight ${active ? "font-extrabold" : "font-semibold"}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
