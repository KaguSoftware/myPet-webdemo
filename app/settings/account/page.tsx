"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackBar from "@/components/BackBar";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import LevelStagesSheet from "@/components/LevelStagesSheet";
import StreakCalendarSheet from "@/components/StreakCalendarSheet";
import Sheet from "@/components/Sheet";
import { InitialAvatar } from "@/components/PetAvatar";
import { Icon } from "@/components/Icons";
import { AccentButton, Chevron, ConfirmRow, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { level, useStore } from "@/lib/store";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { state, hydrated, signOut, setSeenWelcome, userEmail, toast } = useStore();
  const [levelSheetOpen, setLevelSheetOpen] = useState(false);
  const [streakSheetOpen, setStreakSheetOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!hydrated) return <PageLoading title="Account" />;

  const currentMember = state.members.find((m) => m.id === state.currentMemberId);

  const inputClass =
    "h-12.5 w-full rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent";

  async function changePassword() {
    setFormError(null);
    if (newPw.length < 6) return setFormError("Password must be at least 6 characters.");
    if (newPw !== confirmPw) return setFormError("Passwords don't match.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: newPw });
    setBusy(false);
    if (error) return setFormError(friendlyAuthError(error.message));
    setPwOpen(false);
    setNewPw("");
    setConfirmPw("");
    toast("🔒", "Password updated", "Use it next time you log in");
  }

  async function changeEmail() {
    setFormError(null);
    if (!newEmail.trim()) return setFormError("Enter a new email.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ email: newEmail.trim() });
    setBusy(false);
    if (error) return setFormError(friendlyAuthError(error.message));
    setEmailOpen(false);
    setNewEmail("");
    toast("📧", "Confirm your new email", "We sent a link to finish the change");
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDeleting(false);
        toast("⚠️", "Couldn't delete account", body.error ?? "Please try again");
        return;
      }
      window.location.assign("/login");
    } catch {
      setDeleting(false);
      toast("⚠️", "Couldn't delete account", "Please try again");
    }
  }

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

      <SectionHeader>Security</SectionHeader>
      <Group>
        <Row
          onClick={() => {
            setFormError(null);
            setPwOpen(true);
          }}
          leading={<IconCircle icon="lock" tint="text-label-2" bg="bg-fill" />}
          title="Change password"
          trailing={<Chevron />}
        />
        <Row
          onClick={() => {
            setFormError(null);
            setEmailOpen(true);
          }}
          leading={<IconCircle icon="person" tint="text-label-2" bg="bg-fill" />}
          title="Change email"
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

      <SectionHeader>Danger zone</SectionHeader>
      <Group>
        <ConfirmRow
          label={deleting ? "Deleting…" : "Delete account"}
          confirmLabel="Tap again to permanently delete"
          onConfirm={deleteAccount}
        />
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">
        Permanently deletes your account and the whole household — pets, activity, everything. This can&apos;t be undone.
      </p>

      <div className="h-4" />

      <Sheet
        open={pwOpen}
        onClose={() => {
          setPwOpen(false);
          setNewPw("");
          setConfirmPw("");
          setFormError(null);
        }}
      >
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Change password</h2>
        <div className="mt-5 flex flex-col gap-3">
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className={inputClass}
          />
          {formError && <p className="text-[13px] text-red">{formError}</p>}
          <AccentButton disabled={busy} onClick={changePassword}>
            {busy ? "Saving…" : "Update password"}
          </AccentButton>
        </div>
      </Sheet>

      <Sheet
        open={emailOpen}
        onClose={() => {
          setEmailOpen(false);
          setNewEmail("");
          setFormError(null);
        }}
      >
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Change email</h2>
        <p className="mt-1 text-[13px] text-label-3">
          We&apos;ll email a confirmation link to the new address before the change takes effect.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="New email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={inputClass}
          />
          {formError && <p className="text-[13px] text-red">{formError}</p>}
          <AccentButton disabled={busy} onClick={changeEmail}>
            {busy ? "Sending…" : "Send confirmation"}
          </AccentButton>
        </div>
      </Sheet>

      <LevelStagesSheet open={levelSheetOpen} onClose={() => setLevelSheetOpen(false)} />
      <StreakCalendarSheet open={streakSheetOpen} onClose={() => setStreakSheetOpen(false)} />
    </div>
  );
}
