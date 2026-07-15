"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackBar from "@/components/BackBar";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import LevelStagesSheet from "@/components/LevelStagesSheet";
import StreakCalendarSheet from "@/components/StreakCalendarSheet";
import { InitialAvatar } from "@/components/PetAvatar";
import { Icon } from "@/components/Icons";
import { Chevron, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { level, useStore } from "@/lib/store";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { state, hydrated, signOut, setSeenWelcome, userEmail } = useStore();
  const [levelSheetOpen, setLevelSheetOpen] = useState(false);
  const [streakSheetOpen, setStreakSheetOpen] = useState(false);

  if (!hydrated) return <PageLoading title="Account" />;

  const currentMember = state.members.find((m) => m.id === state.currentMemberId);

  return (
    <div className="px-4">
      <Header title="Account" />
      <BackBar />

      <SectionHeader>Signed in</SectionHeader>
      <Group>
        {userEmail && (
          <Row leading={<IconCircle icon="person" tint="text-label-2" bg="bg-fill" />} title={userEmail} subtitle="Account email" />
        )}
        {currentMember && (
          <Row
            leading={<InitialAvatar name={currentMember.name} gradient={currentMember.gradient} size={36} />}
            title={`Viewing as ${currentMember.name}`}
            subtitle={`${currentMember.role} · switch in Family`}
          />
        )}
      </Group>

      <SectionHeader>Progress</SectionHeader>
      <Group>
        <Row
          onClick={() => setLevelSheetOpen(true)}
          leading={<IconCircle icon="star" tint="text-accent" bg="bg-accent-soft" />}
          title={`Level ${level(state.xp)}`}
          subtitle="Synced to your account"
          trailing={<Chevron />}
        />
        <Row
          onClick={() => setStreakSheetOpen(true)}
          leading={<IconCircle icon="flame" tint="text-orange" bg="bg-orange-soft" />}
          title={`${state.streak}-day streak`}
          subtitle="Synced to your account"
          trailing={<Chevron />}
        />
      </Group>

      <SectionHeader>App</SectionHeader>
      <Group>
        <Row
          leading={<IconCircle icon="sparkles" tint="text-label-2" bg="bg-fill" />}
          title="Replay intro"
          onClick={() => {
            setSeenWelcome(false);
            router.push("/");
          }}
          trailing={<Icon name="chevron-right" size={15} className="text-label-3" />}
        />
        <Row destructive onClick={signOut} title="Sign out" />
      </Group>

      <div className="h-4" />

      <LevelStagesSheet open={levelSheetOpen} onClose={() => setLevelSheetOpen(false)} />
      <StreakCalendarSheet open={streakSheetOpen} onClose={() => setStreakSheetOpen(false)} />
    </div>
  );
}
