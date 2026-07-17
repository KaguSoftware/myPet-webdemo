"use client";

import { useState } from "react";
import BackBar from "@/components/BackBar";
import PageLoading from "@/components/PageLoading";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Group, IconCircle, Row, SectionHeader } from "@/components/ui";
import { dueLabel, useStore } from "@/lib/store";

export default function RemindersPage() {
  const { state, hydrated, addReminder, toggleReminder, deleteReminder, toast } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [petId, setPetId] = useState("");
  const [days, setDays] = useState(1);

  if (!hydrated) return <PageLoading title="Reminders" compact />;

  // Default to the first pet until the user explicitly picks one — the raw
  // useState initializer ran while the store was still empty, so petId can't
  // seed itself from state.pets.
  const activePetId = petId || state.pets[0]?.id || "";
  const upcoming = state.reminders.filter((r) => !r.done).sort((a, b) => a.due - b.due);
  const done = state.reminders.filter((r) => r.done);
  const petOf = (id: string) => state.pets.find((p) => p.id === id);

  // One calm row per reminder — alerts get red title text only (the red wall,
  // dedupe, and book-vet actions live on /activity).
  const renderRow = (r: (typeof state.reminders)[number]) => {
    const pet = petOf(r.petId);
    const isAlert = r.alert && !r.done;
    return (
      <Row
        key={r.id}
        leading={
          <button
            onClick={() => {
              toggleReminder(r.id);
              if (!r.done) toast("✅", `Done: ${r.title}`, "Marked complete for the family");
              else toast("↩️", `Reopened: ${r.title}`, "Marked as not done");
            }}
            aria-label={r.done ? "Mark as not done" : "Mark as done"}
            className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200 active:scale-90 ${
              r.done ? "border-accent bg-accent text-white" : "border-[oklch(0.22_0.01_264/0.25)] bg-transparent"
            }`}
          >
            {r.done && <Icon name="check" size={14} />}
          </button>
        }
        title={
          <span className={r.done ? "text-label-3 line-through" : isAlert ? "text-red" : undefined}>{r.title}</span>
        }
        subtitle={`${pet ? `${pet.name} · ` : ""}${r.done ? "completed" : dueLabel(r.due)}`}
        trailing={
          <button
            onClick={() => deleteReminder(r.id)}
            aria-label={`Delete ${r.title}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-3 transition-colors active:bg-fill active:text-red"
          >
            <Icon name="xmark" size={15} />
          </button>
        }
      />
    );
  };

  return (
    <div className="px-4">
      <BackBar
        title="Reminders"
        trailing={
          <button
            onClick={() => setAddOpen(true)}
            aria-label="Add reminder"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-[0_3px_10px_oklch(0.55_0.19_258/0.35)] transition-transform active:scale-90"
          >
            <Icon name="plus" size={17} />
          </button>
        }
      />

      <SectionHeader>Upcoming</SectionHeader>
      <Group flush>
        {upcoming.length > 0 ? (
          upcoming.map(renderRow)
        ) : (
          <div className="flex flex-col items-center px-6 py-9 text-center">
            <IconCircle icon="check" tint="text-green" bg="bg-green-soft" size={48} iconSize={22} />
            <p className="mt-3 text-[15px] font-semibold text-label">All clear</p>
            <p className="mt-0.5 text-[13px] text-label-2">Add a reminder and the whole family sees it.</p>
          </div>
        )}
      </Group>

      {done.length > 0 && (
        <>
          <SectionHeader>Completed</SectionHeader>
          <Group flush>{done.map(renderRow)}</Group>
        </>
      )}

      <Sheet
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setTitle("");
        }}
      >
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-label">New reminder</h2>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Task</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Buy litter, flea treatment…"
          className="w-full rounded-ios bg-card px-4 py-3.5 text-[16px] font-medium text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.04)] outline-none ring-1 ring-transparent transition-shadow placeholder:text-label-3 focus:ring-accent/60"
        />

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Pet</p>
        <div className="flex gap-2">
          {state.pets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPetId(p.id)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-all ${
                activePetId === p.id ? "bg-accent text-white" : "bg-card text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <p className="mt-5 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-label-2">Due</p>
        <div className="flex flex-wrap gap-2">
          {[
            { d: 0, label: "Today" },
            { d: 1, label: "Tomorrow" },
            { d: 3, label: "In 3 days" },
            { d: 7, label: "Next week" },
          ].map((o) => (
            <button
              key={o.d}
              onClick={() => setDays(o.d)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-all ${
                days === o.d ? "bg-accent text-white" : "bg-card text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-7">
          <AccentButton
            disabled={!title.trim() || !activePetId}
            onClick={() => {
              addReminder({ petId: activePetId, title: title.trim(), emoji: "📝", due: Date.now() + days * 86_400_000 });
              setAddOpen(false);
              setTitle("");
              toast("⏰", "Reminder added", "Visible to the whole family");
            }}
          >
            Add reminder
          </AccentButton>
        </div>
      </Sheet>
    </div>
  );
}
