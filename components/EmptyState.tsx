"use client";

import { Icon, IconName } from "./Icons";
import { AccentButton } from "./ui";

export default function EmptyState({
  icon,
  title,
  body,
  cta,
  onCta,
}: {
  icon: IconName;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-card bg-card px-6 py-9 text-center shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fill text-label-2">
        <Icon name={icon} size={26} />
      </span>
      <p className="mt-3 text-[15px] font-semibold text-label">{title}</p>
      <p className="mt-1 max-w-[240px] text-[13px] leading-snug text-label-2">{body}</p>
      {cta && onCta && (
        <div className="mt-4 w-full max-w-[220px]">
          <AccentButton variant="tinted" onClick={onCta} className="!h-[42px] !text-[15px]">
            {cta}
          </AccentButton>
        </div>
      )}
    </div>
  );
}
