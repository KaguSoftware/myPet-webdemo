"use client";

import { useRouter } from "next/navigation";
import BackBar from "@/components/BackBar";
import Header from "@/components/Header";
import { Icon } from "@/components/Icons";
import { Group, IconCircle, Row, SectionHeader, Segmented } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const router = useRouter();
  const { state, setUnits, setSeenWelcome, signOut, setPremium, setNotificationPref, toast, userEmail } = useStore();
  const currentMember = state.members.find((m) => m.id === state.currentMemberId);

  return (
    <div className="px-4">
      <Header title="Settings" />

      <BackBar />

      <SectionHeader>Units</SectionHeader>
      <Group>
        <div className="flex items-center gap-3 px-4 py-3">
          <IconCircle icon="arrow-up" tint="text-accent" bg="bg-accent-soft" />
          <span className="flex-1 text-[16px] font-medium text-label">Weight units</span>
          <div className="w-28">
            <Segmented
              options={[
                { value: "kg", label: "kg" },
                { value: "lb", label: "lb" },
              ]}
              value={state.units}
              onChange={(u) => {
                setUnits(u);
                toast("⚖️", `Weights now shown in ${u === "kg" ? "kilograms" : "pounds"}`, "");
              }}
            />
          </div>
        </div>
      </Group>

      <SectionHeader>Membership</SectionHeader>
      <Group>
        <Row
          leading={<IconCircle icon="sparkles" tint="text-accent" bg="bg-accent-soft" />}
          title="PetPal+"
          subtitle={state.premium ? "Active" : "Not subscribed"}
          trailing={
            <button
              onClick={() => {
                setPremium(!state.premium);
                toast("✨", state.premium ? "PetPal+ turned off" : "PetPal+ activated", "");
              }}
              className="rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-label transition-transform active:scale-95"
            >
              {state.premium ? "Turn off" : "Enable"}
            </button>
          }
        />
      </Group>

      <SectionHeader>Notifications</SectionHeader>
      <Group>
        {[
          { key: "notifyCareReminders" as const, label: "Care reminders" },
          { key: "notifyFamilyActivity" as const, label: "Family activity" },
          { key: "notifyVetSuggestions" as const, label: "Vet suggestions" },
        ].map((n) => {
          const on = currentMember ? currentMember[n.key] : true;
          return (
            <Row
              key={n.key}
              role="switch"
              ariaChecked={!!on}
              ariaLabel={n.label}
              leading={<IconCircle icon="bell" tint="text-label-2" bg="bg-fill" />}
              title={n.label}
              onClick={() => {
                if (!currentMember) return;
                setNotificationPref(n.key, !on);
                toast("🔔", `${n.label} turned ${on ? "off" : "on"}`, "");
              }}
              trailing={
                <span aria-hidden className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${on ? "justify-end bg-green" : "justify-start bg-fill"}`}>
                  <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                </span>
              }
            />
          );
        })}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">
        {currentMember ? `Just for ${currentMember.name} — other family members set their own.` : "Set per family member."} Reminders you&apos;ve already
        added still appear in Care.
      </p>

      <SectionHeader>Account</SectionHeader>
      <Group>
        {userEmail && <Row leading={<IconCircle icon="bell" tint="text-label-2" bg="bg-fill" />} title={userEmail} subtitle="Signed in" />}
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
    </div>
  );
}
