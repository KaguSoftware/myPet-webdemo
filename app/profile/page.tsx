"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Paywall from "@/components/Paywall";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, ConfirmRow, Group, Row, SectionHeader } from "@/components/ui";
import { Member, Pet, formatAge, formatWeight, isAdminRole } from "@/lib/data";
import { level, useStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const {
    state,
    hydrated,
    switchMember,
    setPremium,
    editPet,
    deletePet,
    addMember,
    editMember,
    removeMember,
    setFamilyPassword,
    signOut,
    toast,
  } = useStore();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const currentMember = state.members.find((m) => m.id === state.currentMemberId);
  const isAdmin = !!currentMember && isAdminRole(currentMember.role);

  const [familyPwOpen, setFamilyPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");

  const closeFamilyPw = () => {
    setFamilyPwOpen(false);
    setCurrentPw("");
    setNewPw("");
    setPwError("");
  };

  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editPetName, setEditPetName] = useState("");
  const [editPetBreed, setEditPetBreed] = useState("");
  const [editPetAge, setEditPetAge] = useState("");
  const [editPetWeight, setEditPetWeight] = useState("");

  const openEditPet = (p: Pet) => {
    setEditingPet(p);
    setEditPetName(p.name);
    setEditPetBreed(p.breed);
    setEditPetAge(String(p.ageYears));
    setEditPetWeight(String(p.weightKg));
  };

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Member");

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberRole, setEditMemberRole] = useState("");

  const openEditMember = (m: Member) => {
    setEditingMember(m);
    setEditMemberName(m.name);
    setEditMemberRole(m.role);
  };

  return (
    <div className="px-4">
      <Header
        title="Family"
        subtitle={`${state.members.length} member${state.members.length === 1 ? "" : "s"}`}
        trailing={
          <Link
            href="/settings"
            aria-label="Settings"
            className="glass-strong flex h-9 w-9 items-center justify-center rounded-full text-label-2 transition-transform active:scale-90"
          >
            <Icon name="gear" size={18} />
          </Link>
        }
      />

      {/* Plus banner */}
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
              <span className="block text-[13px] font-medium text-white/80">
                Vet-built plans · smart reminders · booking
              </span>
            </span>
            <Icon name="chevron-right" size={16} strokeWidth={2.4} className="text-white/70" />
          </div>
        </button>
      )}

      {/* Members */}
      <SectionHeader
        trailing={
          <button onClick={() => setAddMemberOpen(true)} className="text-[13px] font-semibold text-accent">
            Add member
          </button>
        }
      >
        Members
      </SectionHeader>
      <Group>
        {state.members.map((m) => {
          const active = m.id === state.currentMemberId;
          return (
            <Row
              key={m.id}
              onClick={() => {
                if (!active) {
                  switchMember(m.id);
                  toast("👤", `Viewing as ${m.name}`, "Actions will be logged as them");
                }
              }}
              leading={<InitialAvatar name={m.name} gradient={m.gradient} size={38} />}
              title={m.name}
              subtitle={m.role}
              trailing={
                <span className="flex items-center gap-3">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditMember(m);
                    }}
                    className="text-[13px] font-semibold text-accent"
                  >
                    Edit
                  </span>
                  {active ? (
                    <Icon name="check" size={18} strokeWidth={2.4} className="text-accent" />
                  ) : (
                    <span className="text-[13px] font-medium text-label-3">Switch</span>
                  )}
                </span>
              }
            />
          );
        })}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">Tap a member to view the demo as them, or Edit to manage them.</p>

      {/* Family ID + admin password — admin role only */}
      {isAdmin && (
        <>
          <SectionHeader>Family</SectionHeader>
          <Group>
            <Row
              leading={
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
                  <Icon name="people" size={18} />
                </span>
              }
              title="Family ID"
              subtitle={state.familyId ? `${state.familyId.slice(0, 8)}…` : "Loading…"}
              trailing={
                <button
                  onClick={() => {
                    if (!state.familyId) return;
                    navigator.clipboard.writeText(state.familyId);
                    toast("📋", "Family ID copied", "");
                  }}
                  className="text-[13px] font-semibold text-accent"
                >
                  Copy
                </button>
              }
            />
            <Row
              onClick={() => setFamilyPwOpen(true)}
              leading={
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
                  <Icon name="lock" size={18} />
                </span>
              }
              title="Family password"
              subtitle={state.familyPasswordSet ? "Set — tap to change" : "Not set — tap to add one"}
              trailing={<Icon name="chevron-right" size={15} className="text-label-3" />}
            />
          </Group>
          <p className="mt-1.5 px-1 text-[12px] text-label-3">
            Share the Family ID so others can find this household. Only admins can see this and lock it with a password.
          </p>
        </>
      )}

      {/* Pets */}
      <SectionHeader>Pets</SectionHeader>
      <Group>
        {state.pets.map((p) => (
          <Row
            key={p.id}
            onClick={() => openEditPet(p)}
            leading={<PetAvatar pet={p} size="sm" />}
            title={p.name}
            subtitle={`${p.breed} · ${formatAge(p.ageYears)} · ${formatWeight(p.weightKg, state.units)}`}
            trailing={
              <span className="flex items-center gap-3">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pet/${p.id}`);
                  }}
                  className="text-[13px] font-semibold text-accent"
                >
                  View
                </span>
                <Icon name="chevron-right" size={15} className="text-label-3" />
              </span>
            }
          />
        ))}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">Tap a pet to edit it, or View for full details.</p>

      {/* About + reset */}
      <SectionHeader>Demo</SectionHeader>
      <Group>
        <Row
          leading={
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
              <Icon name="star" size={18} />
            </span>
          }
          title={`Level ${level(state.xp)} · ${state.streak}-day streak`}
          subtitle="Synced to your account"
        />
        <Row destructive onClick={signOut} title="Sign out" />
      </Group>

      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} />

      <Sheet open={editingPet !== null} onClose={() => setEditingPet(null)}>
        {editingPet && (
          <>
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Edit {editingPet.name}</h2>

            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Name</p>
            <input
              value={editPetName}
              onChange={(e) => setEditPetName(e.target.value)}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />

            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Breed</p>
            <input
              value={editPetBreed}
              onChange={(e) => setEditPetBreed(e.target.value)}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Age (years)</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editPetAge}
                  onChange={(e) => setEditPetAge(e.target.value)}
                  className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
                />
              </div>
              <div className="flex-1">
                <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Weight (kg)</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editPetWeight}
                  onChange={(e) => setEditPetWeight(e.target.value)}
                  className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
                />
              </div>
            </div>

            <div className="mt-7">
              <AccentButton
                disabled={!editPetName.trim() || !editPetBreed.trim()}
                onClick={() => {
                  editPet(editingPet.id, {
                    name: editPetName.trim(),
                    breed: editPetBreed.trim(),
                    ageYears: Number(editPetAge) || editingPet.ageYears,
                    weightKg: Number(editPetWeight) || editingPet.weightKg,
                    cupGrams: editingPet.cupGrams,
                  });
                  toast("🐾", `${editPetName.trim()} updated`, "");
                  setEditingPet(null);
                }}
              >
                Save changes
              </AccentButton>
            </div>

            <Group className="mt-3">
              <ConfirmRow
                label="Delete pet"
                confirmLabel="Tap again to delete"
                onConfirm={() => {
                  const name = editingPet.name;
                  deletePet(editingPet.id);
                  setEditingPet(null);
                  toast("👋", `${name} was removed`, "");
                }}
              />
            </Group>
          </>
        )}
      </Sheet>

      <Sheet open={familyPwOpen} onClose={closeFamilyPw}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">
          {state.familyPasswordSet ? "Change family password" : "Set a family password"}
        </h2>
        <p className="mt-1 text-[13px] text-label-3">Protects the Family section on shared devices — not a full account login.</p>

        {state.familyPasswordSet && (
          <>
            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Current password</p>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />
          </>
        )}

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">New password</p>
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="At least 4 characters"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />
        {pwError && <p className="mt-2 px-1 text-[13px] font-medium text-red-500">{pwError}</p>}

        <div className="mt-7">
          <AccentButton
            disabled={newPw.trim().length < 4 || (state.familyPasswordSet && !currentPw)}
            onClick={async () => {
              setPwError("");
              const ok = await setFamilyPassword(newPw.trim(), currentPw || undefined);
              if (ok) closeFamilyPw();
              else setPwError("That current password isn't right — try again.");
            }}
          >
            {state.familyPasswordSet ? "Update password" : "Set password"}
          </AccentButton>
        </div>

        {state.familyPasswordSet && (
          <Group className="mt-3">
            <ConfirmRow
              label="Remove password"
              confirmLabel="Tap again to remove"
              onConfirm={async () => {
                setPwError("");
                const ok = await setFamilyPassword(null, currentPw || undefined);
                if (ok) closeFamilyPw();
                else setPwError("That current password isn't right — try again.");
              }}
            />
          </Group>
        )}
      </Sheet>

      <Sheet open={addMemberOpen} onClose={() => setAddMemberOpen(false)}>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Add a member</h2>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Name</p>
        <input
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          placeholder="e.g. Alex"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Role</p>
        <input
          value={newMemberRole}
          onChange={(e) => setNewMemberRole(e.target.value)}
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
        />

        <div className="mt-7">
          <AccentButton
            disabled={!newMemberName.trim() || !hydrated}
            onClick={() => {
              addMember(newMemberName.trim(), newMemberRole.trim() || "Member");
              setAddMemberOpen(false);
              setNewMemberName("");
              setNewMemberRole("Member");
            }}
          >
            {hydrated ? "Add to family" : "Loading…"}
          </AccentButton>
        </div>
      </Sheet>

      <Sheet open={editingMember !== null} onClose={() => setEditingMember(null)}>
        {editingMember && (
          <>
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Edit {editingMember.name}</h2>

            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Name</p>
            <input
              value={editMemberName}
              onChange={(e) => setEditMemberName(e.target.value)}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />

            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Role</p>
            <input
              value={editMemberRole}
              onChange={(e) => setEditMemberRole(e.target.value)}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />

            <div className="mt-7">
              <AccentButton
                disabled={!editMemberName.trim()}
                onClick={() => {
                  editMember(editingMember.id, { name: editMemberName.trim(), role: editMemberRole.trim() || "Member" });
                  toast("👤", `${editMemberName.trim()} updated`, "");
                  setEditingMember(null);
                }}
              >
                Save changes
              </AccentButton>
            </div>

            {state.members.length > 1 && (
              <Group className="mt-3">
                <ConfirmRow
                  label="Remove member"
                  confirmLabel="Tap again — also deletes their activity history"
                  onConfirm={() => {
                    const name = editingMember.name;
                    removeMember(editingMember.id);
                    setEditingMember(null);
                    toast("👋", `${name} was removed`, "");
                  }}
                />
              </Group>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}
