"use client";

import { useMemo } from "react";
import Sheet from "./Sheet";
import { Chip, Group, IconCircle, Row } from "./ui";
import { level, levelProgress, levelStepXp, useStore } from "@/lib/store";

export default function LevelStagesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore();
  const currentLevel = level(state.xp);
  const levelStages = useMemo(
    () =>
      Array.from({ length: Math.max(currentLevel + 5, 10) }, (_, i) => {
        const n = i + 1;
        return {
          n,
          stepXp: levelStepXp(n),
          status: n < currentLevel ? ("done" as const) : n === currentLevel ? ("current" as const) : ("locked" as const),
        };
      }),
    [currentLevel]
  );

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">Level stages</h2>
      <p className="mt-0.5 text-[13px] text-label-2">Earn XP by logging care — each stage takes more XP than the last</p>
      <Group className="mt-4">
        {levelStages.map((s) => (
          <Row
            key={s.n}
            leading={
              <IconCircle
                icon={s.status === "locked" ? "lock" : s.status === "done" ? "check" : "star"}
                tint={s.status === "locked" ? "text-label-2" : s.status === "done" ? "text-green" : "text-accent"}
                bg={s.status === "locked" ? "bg-fill" : s.status === "done" ? "bg-green-soft" : "bg-accent-soft"}
              />
            }
            title={`Level ${s.n}`}
            subtitle={s.status === "current" ? `${levelProgress(state.xp)}/${s.stepXp} XP` : `${s.stepXp} XP required`}
            trailing={s.status === "current" ? <Chip>Current</Chip> : undefined}
          />
        ))}
      </Group>
    </Sheet>
  );
}
