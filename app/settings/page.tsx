"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import Paywall from "@/components/Paywall";
import { Icon } from "@/components/Icons";
import { Chevron, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, hydrated, setPremium, toast } = useStore();
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (!hydrated) return <PageLoading title="Settings" />;

  const petCount = state.pets.length;
  const memberCount = state.members.length;

  return (
    <div className="px-4">
      <Header title="Settings" />

      {/* PetPal+ status / upgrade */}
      {state.premium ? (
        <Group>
          <Row
            leading={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-b from-[oklch(0.62_0.19_258)] to-[oklch(0.48_0.19_262)] text-white">
                <Icon name="sparkles" size={18} />
              </span>
            }
            title="PetPal+ is active"
            subtitle="Care plans, smart reminders & vet booking"
            trailing={
              <button
                onClick={() => {
                  setPremium(false);
                  toast("👋", "PetPal+ deactivated", "You can re-enable it anytime");
                }}
                className="rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-label transition-transform active:scale-95"
              >
                Turn off
              </button>
            }
          />
        </Group>
      ) : (
        <button
          onClick={() => setPaywallOpen(true)}
          className="w-full rounded-card bg-linear-to-br from-[oklch(0.6_0.19_258)] to-[oklch(0.45_0.19_268)] p-4 text-left shadow-[0_8px_24px_oklch(0.55_0.19_258/0.3)] transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.4)]">
              <Icon name="sparkles" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-white">Upgrade to PetPal+</span>
              <span className="block text-[13px] font-medium text-white/80">Vet-built plans · smart reminders · booking</span>
            </span>
            <Icon name="chevron-right" size={16} className="text-white/70" />
          </div>
        </button>
      )}

      <SectionHeader>Settings</SectionHeader>
      <Group>
        <Link href="/settings/family" className="block">
          <Row
            leading={<IconCircle icon="people" tint="text-accent" bg="bg-accent-soft" />}
            title="Family"
            subtitle={`${memberCount} member${memberCount === 1 ? "" : "s"} · ${petCount} pet${petCount === 1 ? "" : "s"}`}
            trailing={<Chevron />}
          />
        </Link>
        <Link href="/settings/general" className="block">
          <Row
            leading={<IconCircle icon="gear" tint="text-label-2" bg="bg-fill" />}
            title="General"
            subtitle="Units & notifications"
            trailing={<Chevron />}
          />
        </Link>
        <Link href="/settings/accessibility" className="block">
          <Row
            leading={<IconCircle icon="eye" tint="text-green" bg="bg-green-soft" />}
            title="Accessibility"
            subtitle="Motion & transparency"
            trailing={<Chevron />}
          />
        </Link>
        <Link href="/settings/account" className="block">
          <Row
            leading={<IconCircle icon="person" tint="text-orange" bg="bg-orange-soft" />}
            title="Account"
            subtitle="Sign-in, progress & intro"
            trailing={<Chevron />}
          />
        </Link>
      </Group>

      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
