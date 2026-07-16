"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackBar from "@/components/BackBar";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import PetAvatar, { InitialAvatar } from "@/components/PetAvatar";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Chevron, ConfirmRow, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { Member, Pet, formatAge, formatWeight, isAdminRole, kgToUnit, unitToKg, weightUnitLabel } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function FamilySettingsPage() {
  const router = useRouter();
  const { state, hydrated, switchMember, editPet, deletePet, addMember, editMember, removeMember, setFamilyPassword, verifyFamilyPassword, joinHousehold, setActiveHousehold, toast } =
    useStore();

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [joining, setJoining] = useState(false);

  // Lock gate — component-local so it resets whenever the user leaves the page.
  const [unlocked, setUnlocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

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
  const [editPetCup, setEditPetCup] = useState("");

  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const openEditPet = (p: Pet) => {
    setEditingPet(p);
    setEditPetName(p.name);
    setEditPetBreed(p.breed);
    setEditPetAge(String(p.ageYears));
    setEditPetWeight(String(kgToUnit(p.weightKg, state.units)));
    setEditPetCup(String(p.cupGrams));
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

  if (!hydrated) return <PageLoading title="Family" />;

  // On a shared device, the Family section is protected by the household's
  // family password. Show an unlock gate until it's entered this visit.
  if (state.familyPasswordSet && !unlocked) {
    const submitUnlock = async () => {
      setUnlockError("");
      setUnlocking(true);
      const ok = await verifyFamilyPassword(unlockInput);
      setUnlocking(false);
      if (ok) {
        setUnlocked(true);
        setUnlockInput("");
      } else {
        setUnlockError("Incorrect password.");
      }
    };
    return (
      <div className="px-4">
        <Header title="Family" />
        <BackBar />
        <div className="mt-6 flex flex-col items-center rounded-card bg-card px-6 py-9 text-center shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon name="lock" size={26} />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-label">Family section locked</p>
          <p className="mt-1 max-w-60 text-[13px] leading-snug text-label-2">
            Enter the family password to manage members, pets, and household settings.
          </p>
          <input
            type="password"
            autoFocus
            value={unlockInput}
            onChange={(e) => setUnlockInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitUnlock()}
            placeholder="Family password"
            className="mt-4 h-12.5 w-full rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
          />
          {unlockError && <p className="mt-2 text-[13px] text-red">{unlockError}</p>}
          <div className="mt-3 w-full">
            <AccentButton disabled={unlocking || !unlockInput} onClick={submitUnlock}>
              {unlocking ? "Checking…" : "Unlock"}
            </AccentButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <Header title="Family" subtitle={`${state.members.length} member${state.members.length === 1 ? "" : "s"}`} />
      <BackBar />

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
            <div key={m.id} className="flex w-full items-center gap-3 px-4 py-2.5 min-h-13">
              <button
                onClick={() => {
                  if (!active) {
                    switchMember(m.id);
                    toast("👤", `Viewing as ${m.name}`, "Actions will be logged as them");
                  }
                }}
                aria-label={active ? `${m.name}, current member` : `View the demo as ${m.name}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity active:opacity-60"
              >
                <InitialAvatar name={m.name} gradient={m.gradient} size={38} />
                <span className="min-w-0 flex-1 py-0.5">
                  <span className="block truncate text-[16px] leading-snug font-medium text-label">{m.name}</span>
                  <span className="block truncate text-[13px] font-normal text-label-2">{m.role}</span>
                </span>
              </button>
              <button
                onClick={() => openEditMember(m)}
                aria-label={`Edit ${m.name}`}
                className="shrink-0 text-[13px] font-semibold text-accent transition-transform active:scale-95"
              >
                Edit
              </button>
              {active ? (
                <Icon name="check" size={18} className="text-accent" aria-hidden />
              ) : (
                <span className="text-[13px] font-medium text-label-3" aria-hidden>
                  Switch
                </span>
              )}
            </div>
          );
        })}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">Tap a member to view the demo as them, or Edit to manage them.</p>

      {/* Households the user belongs to + join another */}
      <SectionHeader>Households</SectionHeader>
      <Group>
        {state.households.map((hh) => {
          const active = hh.id === state.activeHouseholdId;
          return (
            <Row
              key={hh.id}
              onClick={active ? undefined : () => setActiveHousehold(hh.id)}
              leading={
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
                  <Icon name="people" size={18} />
                </span>
              }
              title={hh.name}
              subtitle={active ? "Current household" : "Tap to switch"}
              trailing={active ? <Icon name="check" size={18} className="text-accent" /> : <Chevron />}
            />
          );
        })}
        <Row
          onClick={() => {
            setJoinId("");
            setJoinOpen(true);
          }}
          leading={<IconCircle icon="plus" tint="text-accent" bg="bg-accent-soft" />}
          title="Join a household"
          subtitle="Enter a Family ID someone shared with you"
          trailing={<Chevron />}
        />
      </Group>

      {/* Family ID + admin password — admin role only */}
      {isAdmin && (
        <>
          <SectionHeader>Household</SectionHeader>
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
          <div key={p.id} className="flex w-full items-center gap-3 px-4 py-2.5 min-h-13">
            <button
              onClick={() => openEditPet(p)}
              aria-label={`Edit ${p.name}`}
              className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity active:opacity-60"
            >
              <PetAvatar pet={p} size="sm" />
              <span className="min-w-0 flex-1 py-0.5">
                <span className="block truncate text-[16px] leading-snug font-medium text-label">{p.name}</span>
                <span className="block truncate text-[13px] font-normal text-label-2">
                  {`${p.breed} · ${formatAge(p.ageYears)} · ${formatWeight(p.weightKg, state.units)}`}
                </span>
              </span>
            </button>
            <button
              onClick={() => router.push(`/pet/${p.id}`)}
              aria-label={`View ${p.name}'s details`}
              className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-accent transition-transform active:scale-95"
            >
              View
              <Icon name="chevron-right" size={15} className="text-label-3" aria-hidden />
            </button>
          </div>
        ))}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">Tap a pet to edit it, or View for full details.</p>

      <div className="h-4" />

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
                <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Weight ({weightUnitLabel(state.units)})</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editPetWeight}
                  onChange={(e) => setEditPetWeight(e.target.value)}
                  className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
                />
              </div>
            </div>

            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Cup size (grams of food per cup)</p>
            <input
              type="number"
              inputMode="numeric"
              value={editPetCup}
              onChange={(e) => setEditPetCup(e.target.value)}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />

            <div className="mt-7">
              <AccentButton
                disabled={!editPetName.trim() || !editPetBreed.trim()}
                onClick={() => {
                  editPet(editingPet.id, {
                    name: editPetName.trim(),
                    breed: editPetBreed.trim(),
                    ageYears: Number(editPetAge) || editingPet.ageYears,
                    weightKg: unitToKg(Number(editPetWeight) || kgToUnit(editingPet.weightKg, state.units), state.units),
                    cupGrams: Math.round(Number(editPetCup)) || editingPet.cupGrams,
                  });
                  toast("🐾", `${editPetName.trim()} updated`, "");
                  setEditingPet(null);
                }}
              >
                Save changes
              </AccentButton>
            </div>

            <Group className="mt-3">
              <Row
                destructive
                title="Delete pet"
                onClick={() => {
                  setDeletingPet(editingPet);
                  setDeleteConfirm("");
                }}
              />
            </Group>
          </>
        )}
      </Sheet>

      <Sheet
        open={deletingPet !== null}
        onClose={() => {
          setDeletingPet(null);
          setDeleteConfirm("");
        }}
      >
        {deletingPet && (
          <>
            <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Delete {deletingPet.name}?</h2>
            <p className="mt-1.5 text-[13px] text-label-3">
              This permanently removes {deletingPet.name}, along with its supplies, plan progress, and history.
              This can&apos;t be undone.
            </p>

            <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">
              Type <span className="text-label">{deletingPet.name}</span> to confirm
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={deletingPet.name}
              className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent/60"
            />

            <div className="mt-7 flex flex-col gap-2">
              <AccentButton
                disabled={deleteConfirm.trim().toLowerCase() !== deletingPet.name.trim().toLowerCase()}
                onClick={() => {
                  const name = deletingPet.name;
                  deletePet(deletingPet.id);
                  setDeletingPet(null);
                  setDeleteConfirm("");
                  setEditingPet(null);
                  toast("👋", `${name} was removed`, "");
                }}
                className="bg-red! text-white! shadow-none!"
              >
                Delete {deletingPet.name}
              </AccentButton>
              <AccentButton
                variant="gray"
                onClick={() => {
                  setDeletingPet(null);
                  setDeleteConfirm("");
                }}
              >
                Cancel
              </AccentButton>
            </div>
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
          placeholder="At least 6 characters"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />
        {pwError && <p className="mt-2 px-1 text-[13px] font-medium text-red-500">{pwError}</p>}

        <div className="mt-7">
          <AccentButton
            disabled={newPw.trim().length < 6 || (state.familyPasswordSet && !currentPw)}
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

      <Sheet
        open={joinOpen}
        onClose={() => {
          setJoinOpen(false);
          setJoinId("");
        }}
      >
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Join a household</h2>
        <p className="mt-1 text-[13px] text-label-3">
          Paste the Family ID another member shared with you. You&apos;ll be added as a member and switched to it.
        </p>
        <input
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Family ID"
          className="mt-5 w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />
        <div className="mt-7">
          <AccentButton
            disabled={!joinId.trim() || joining}
            onClick={async () => {
              setJoining(true);
              const ok = await joinHousehold(joinId.trim());
              // On success the store triggers a full reload, so this component
              // unmounts; only reset state if the join failed.
              if (!ok) setJoining(false);
            }}
          >
            {joining ? "Joining…" : "Join household"}
          </AccentButton>
        </div>
      </Sheet>
    </div>
  );
}
