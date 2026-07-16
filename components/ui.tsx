"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, IconName } from "./Icons";
import PixelSprite from "./pixel/PixelSprite";
import { COIN_SPRITE } from "./pixel/hudSprites";

/* Inset grouped list container (iOS Settings style) */
export function Group({ children, className = "", flush = false }: { children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-card bg-card shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] ${flush ? "hairline hairline-flush" : "hairline"} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  children,
  trailing,
  className = "",
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-7 mb-2 flex items-end justify-between px-1 ${className}`}>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.03em] text-label-2">{children}</h2>
      {trailing}
    </div>
  );
}

export function IconCircle({
  icon,
  tint,
  bg,
  size = 36,
  iconSize = 19,
}: {
  icon: IconName;
  tint: string;
  bg: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${bg} ${tint}`}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={iconSize} />
    </span>
  );
}

export function Row({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  destructive = false,
  role,
  ariaChecked,
  ariaLabel,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  /** When set (e.g. "switch"), the row button carries these ARIA semantics. */
  role?: React.AriaRole;
  ariaChecked?: boolean;
  ariaLabel?: string;
}) {
  const inner = (
    <>
      {leading}
      <span className="min-w-0 flex-1 py-0.5">
        <span className={`block truncate text-[16px] leading-snug font-medium ${destructive ? "text-red" : "text-label"}`}>
          {title}
        </span>
        {subtitle && <span className="block truncate text-[13px] font-normal text-label-2">{subtitle}</span>}
      </span>
      {trailing}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-2.5 text-left min-h-[52px]";
  if (onClick)
    return (
      <button
        onClick={onClick}
        role={role}
        aria-checked={ariaChecked}
        aria-label={ariaLabel}
        className={`${cls} transition-colors active:bg-fill`}
      >
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

/** Destructive Row that needs a second tap to confirm — arms for `armMs`, then reverts. */
export function ConfirmRow({
  label,
  confirmLabel,
  onConfirm,
  armMs = 3000,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  armMs?: number;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Row
      destructive
      title={armed ? confirmLabel : label}
      onClick={() => {
        if (armed) {
          window.clearTimeout(timer.current);
          setArmed(false);
          onConfirm();
          return;
        }
        setArmed(true);
        timer.current = window.setTimeout(() => setArmed(false), armMs);
      }}
    />
  );
}

export function Chevron({ className = "" }: { className?: string }) {
  return <Icon name="chevron-right" size={15} className={`text-label-3 transition-transform ${className}`} />;
}

export function AccentButton({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "tinted" | "gray";
  className?: string;
}) {
  const styles = {
    primary: "bg-accent text-white shadow-[0_4px_14px_oklch(0.55_0.19_258/0.3)]",
    tinted: "bg-accent-soft text-accent",
    gray: "bg-fill text-label",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-ios text-[17px] font-semibold transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium text-label-2 ${className}`}>
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
  containerRef,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  scrollable?: boolean;
  containerRef?: (el: HTMLDivElement | null) => void;
}) {
  const overflowing = scrollable && options.length > 4;
  return (
    <div
      ref={containerRef}
      className={`flex rounded-[10px] bg-fill p-0.5 ${
        overflowing ? "overflow-x-auto flex-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden" : ""
      }`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[8.5px] px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
            overflowing ? "basis-1/4 shrink-0" : "flex-1"
          } ${value === o.value ? "bg-card text-label shadow-[0_1px_4px_oklch(0.2_0.01_264/0.12)]" : "text-label-2"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CoinPill({ amount }: { amount: number }) {
  // Bump whenever the balance INCREASES — one place gives coin-earn feedback for
  // every source (log care, treat, restock, plan rows), not just the Home grid.
  // Spending (a decrease) doesn't bump.
  const prev = useRef(amount);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (amount > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prev.current = amount;
      return () => clearTimeout(t);
    }
    prev.current = amount;
  }, [amount]);
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full bg-orange-soft px-2.5 py-1.5 text-[oklch(0.5_0.13_60)] ${bump ? "animate-coin-bump" : ""}`}
    >
      <PixelSprite sprite={COIN_SPRITE} size={13} className="pixelated" />
      <span className="font-pixel text-[10px]">{amount.toLocaleString()}</span>
    </span>
  );
}
