"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "./Icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/activity", label: "Activity", icon: "bell" },
  { href: "/plan", label: "Care", icon: "heart-text" },
  { href: "/pets", label: "Pets", icon: "paw" },
  { href: "/profile", label: "Family", icon: "people" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="absolute inset-x-4 bottom-[max(env(safe-area-inset-bottom),0.9rem)] z-20">
      <div className="glass-strong flex items-stretch justify-around rounded-[2rem] px-2 py-1.5">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[58px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-200 ${
                active ? "text-accent" : "text-label-2 active:text-label"
              }`}
            >
              <Icon name={t.icon} size={22} className={`transition-transform duration-200 ${active ? "scale-110" : "opacity-80"}`} />
              <span className={`font-pixel text-[8px] leading-none ${active ? "opacity-100" : "opacity-80"}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
