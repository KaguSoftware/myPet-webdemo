"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BackBar from "@/components/BackBar";
import PageLoading from "@/components/PageLoading";
import { Icon } from "@/components/Icons";
import { AccentButton } from "@/components/ui";
import { useStore } from "@/lib/store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function JoinContent() {
  const { state, hydrated, joinHousehold } = useStore();
  const params = useSearchParams();
  const familyId = params.get("f")?.trim() ?? "";
  const [joining, setJoining] = useState(false);

  if (!hydrated) return <PageLoading title="Join" compact />;

  const valid = UUID_RE.test(familyId);
  const alreadyIn = valid && state.households.some((h) => h.id === familyId);

  return (
    <div className="px-4">
      <BackBar title="Join household" />
      <div className="mt-6 flex flex-col items-center rounded-sheet bg-card px-5 py-8 text-center shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05),0_8px_24px_oklch(0.2_0.01_264/0.05)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="people" size={26} />
        </span>
        {!valid ? (
          <>
            <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-label">This invite link isn&apos;t valid</h1>
            <p className="mt-2 max-w-70 text-[14px] leading-relaxed text-label-2">
              Ask your family member to send the invite again from Settings ▸ Family, or paste the Family ID there yourself.
            </p>
            <Link href="/settings/family" className="mt-6 w-full">
              <AccentButton variant="tinted">Open family settings</AccentButton>
            </Link>
          </>
        ) : alreadyIn ? (
          <>
            <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-label">You&apos;re already in this household</h1>
            <p className="mt-2 max-w-70 text-[14px] leading-relaxed text-label-2">
              Switch between your households any time from Settings ▸ Family.
            </p>
            <Link href="/settings/family" className="mt-6 w-full">
              <AccentButton variant="tinted">Open family settings</AccentButton>
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-label">Join this household?</h1>
            <p className="mt-2 max-w-70 text-[14px] leading-relaxed text-label-2">
              You&apos;ll see its pets, reminders, and family activity, and everything you log is shared with them. Your view
              switches to the new household right away.
            </p>
            <p className="mt-3 rounded-full bg-fill px-3 py-1 font-mono text-[12px] text-label-2">{familyId.slice(0, 8)}…</p>
            <div className="mt-6 w-full">
              <AccentButton
                disabled={joining}
                onClick={async () => {
                  setJoining(true);
                  const ok = await joinHousehold(familyId);
                  if (!ok) setJoining(false);
                }}
              >
                {joining ? "Joining…" : "Join household"}
              </AccentButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<PageLoading title="Join" compact />}>
      <JoinContent />
    </Suspense>
  );
}
