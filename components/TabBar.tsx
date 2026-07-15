"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "./Icons";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/plan", label: "Care", icon: "heart-text" },
  { href: "/logs", label: "Logs", icon: "list" },
  { href: "/pets", label: "Pets", icon: "paw" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

/** Pushed detail routes keep their parent tab lit (order = most specific first). */
const SUBROUTE_PARENT: [prefix: string, parent: string][] = [
  ["/reminders", "/plan"],
  ["/vets", "/logs"],
  ["/settings", "/settings"],
  ["/pet/", "/"],
];

export default function TabBar() {
  const pathname = usePathname();
  // Exact tab match, else fall back to the parent tab for a pushed sub-route.
  const activeHref =
    TABS.find((t) => t.href === pathname)?.href ??
    SUBROUTE_PARENT.find(([prefix]) => pathname.startsWith(prefix))?.[1];
  return (
    <nav className="absolute inset-x-4 bottom-[max(env(safe-area-inset-bottom),0.9rem)] z-20">
      <div className="glass-strong flex items-stretch justify-around rounded-[2rem] px-2 py-1.5">
        {TABS.map((t) => {
          const active = t.href === activeHref;
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
