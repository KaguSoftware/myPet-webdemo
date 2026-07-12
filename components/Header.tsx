"use client";

import { useScrollTop } from "./PhoneShell";

export default function Header({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  const scrollTop = useScrollTop();
  const condensed = scrollTop > 36;

  return (
    <>
      {/* Inline glass strip — always sticky, contents fade in when condensed */}
      <div
        className={`sticky top-0 z-20 -mb-[52px] flex h-[52px] items-center justify-center transition-all duration-200 md:pt-2 ${
          condensed ? "glass-strong !border-x-0 !border-t-0" : "pointer-events-none bg-transparent"
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
      <div className="px-5 pb-2 pt-[60px] md:pt-[64px]">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {subtitle && <p className="text-[14px] font-medium text-label-2">{subtitle}</p>}
            <h1 className="truncate text-[32px] font-bold leading-tight tracking-[-0.02em] text-label">{title}</h1>
          </div>
          {trailing && <div className="mb-1 shrink-0">{trailing}</div>}
        </div>
      </div>
    </>
  );
}
