"use client";

import BackBar from "@/components/BackBar";
import { Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { useA11y } from "@/lib/a11y";

export default function AccessibilitySettingsPage() {
  const { reduceMotion, reduceTransparency, setReduceMotion, setReduceTransparency } = useA11y();

  const rows = [
    {
      key: "motion",
      icon: "sparkles" as const,
      label: "Reduce motion",
      hint: "Turns off the arcade wobble, coin pops and other animations.",
      on: reduceMotion,
      set: setReduceMotion,
    },
    {
      key: "transparency",
      icon: "drop" as const,
      label: "Reduce transparency",
      hint: "Makes the glass tab bar, headers and toasts solid instead of blurred.",
      on: reduceTransparency,
      set: setReduceTransparency,
    },
  ];

  return (
    <div className="px-4">
      <BackBar title="Accessibility" />

      <SectionHeader>Display</SectionHeader>
      <Group>
        {rows.map((r) => (
          <Row
            key={r.key}
            role="switch"
            ariaChecked={r.on}
            ariaLabel={r.label}
            leading={<IconCircle icon={r.icon} tint="text-accent" bg="bg-accent-soft" />}
            title={r.label}
            subtitle={r.hint}
            onClick={() => r.set(!r.on)}
            trailing={
              <span aria-hidden className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${r.on ? "justify-end bg-green" : "justify-start bg-fill"}`}>
                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </span>
            }
          />
        ))}
      </Group>
      <p className="mt-1.5 px-1 text-[12px] text-label-3">
        Saved on this device. Motion also follows your system &ldquo;Reduce Motion&rdquo; setting automatically.
      </p>

      <div className="h-4" />
    </div>
  );
}
