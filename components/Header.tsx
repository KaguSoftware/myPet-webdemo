"use client";

import { useScrollTop } from "./PhoneShell";
import NotificationBell from "./NotificationBell";

export default function Header({
  title,
  subtitle,
  trailing,
  bell = false,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  /** Show the persistent Activity bell in the top-right (top-level tab pages). */
  bell?: boolean;
}) {
  const scrollTop = useScrollTop();
  const condensed = scrollTop > 36;

  return (
    <>
      {/* Inline glass strip — always sticky, contents fade in when condensed */}
      <div
        className={`sticky top-0 z-20 -mb-13 flex h-13 items-center justify-center transition-all duration-200 md:pt-2 ${
          condensed ? "glass-strong border-x-0! border-t-0!" : "pointer-events-none bg-transparent"
        }`}
      >
        <span
          className={`text-[17px] font-semibold text-label transition-opacity duration-200 ${
            condensed ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </span>
      </div>

      {/* Large title block — scrolls away */}
      <div className="px-5 pb-2 pt-15 md:pt-16">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {subtitle && <p className="text-[14px] font-medium text-label-2">{subtitle}</p>}
            <h1 className="font-pixel truncate text-[22px] leading-tight text-label">{title}</h1>
          </div>
          {(trailing || bell) && (
            <div className="mb-1 flex shrink-0 items-center gap-2">
              {trailing}
              {bell && <NotificationBell />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
