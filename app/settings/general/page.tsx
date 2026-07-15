"use client";

import BackBar from "@/components/BackBar";
import Header from "@/components/Header";
import PageLoading from "@/components/PageLoading";
import { Group, IconCircle, Row, SectionHeader, Segmented } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function GeneralSettingsPage() {
  const { state, hydrated, setUnits, setNotificationPref, toast } = useStore();
  const currentMember = state.members.find((m) => m.id === state.currentMemberId);

  if (!hydrated) return <PageLoading title="General" />;

  return (
    <div className="px-4">
      <Header title="General" />
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

      <div className="h-4" />
    </div>
  );
}
