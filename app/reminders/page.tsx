"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sheet from "@/components/Sheet";
import { Icon } from "@/components/Icons";
import { AccentButton, Group, IconCircle, SectionHeader } from "@/components/ui";
import { VET } from "@/lib/data";
import { dueLabel, useStore } from "@/lib/store";

export default function RemindersPage() {
  const { state, addReminder, toggleReminder, deleteReminder, toast } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [days, setDays] = useState(1);

  const upcoming = state.reminders.filter((r) => !r.done).sort((a, b) => a.due - b.due);
  const done = state.reminders.filter((r) => r.done);
  const petOf = (id: string) => state.pets.find((p) => p.id === id);

  const renderRow = (r: (typeof state.reminders)[number]) => {
    const pet = petOf(r.petId);
    return (
      <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 min-h-[52px]">
        <button
          onClick={() => {
            toggleReminder(r.id);
            if (!r.done) toast("✅", `Done: ${r.title}`, "Marked complete for the family");
          }}
          aria-label={r.done ? "Mark as not done" : "Mark as done"}
          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200 active:scale-90 ${
            r.done ? "border-accent bg-accent text-white" : "border-[oklch(0.22_0.01_264/0.25)] bg-transparent"
          }`}
        >
          {r.done && <Icon name="check" size={14} strokeWidth={2.6} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[16px] font-medium ${r.done ? "text-label-3 line-through" : "text-label"}`}>
            {r.title}
          </p>
          <p className="text-[13px] text-label-2">
            {pet ? `${pet.name} · ` : ""}
            {r.done ? "completed" : dueLabel(r.due)}
          </p>
        </div>
        <button
          onClick={() => deleteReminder(r.id)}
          aria-label={`Delete ${r.title}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-3 transition-colors active:bg-fill active:text-red"
        >
          <Icon name="xmark" size={15} strokeWidth={2.2} />
        </button>
      </div>
    );
  };

  return (
    <div className="px-4">
      <Header
        title="Reminders"
        trailing={
          <button
            onClick={() => setAddOpen(true)}
            aria-label="Add reminder"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-[0_3px_10px_oklch(0.55_0.19_258/0.35)] transition-transform active:scale-90"
          >
            <Icon name="plus" size={19} strokeWidth={2.2} />
          </button>
        }
      />

      {state.premium && (
        <div className="rounded-card bg-card p-4 shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05)] ring-1 ring-accent/15">
          <div className="flex items-start gap-3">
            <IconCircle icon="stethoscope" tint="text-accent" bg="bg-accent-soft" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Smart reminder · PetPal+</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-label">
                Whiskers&apos; 6-month vet checkup — in one week
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-label-2">
                From the British Shorthair care plan. We suggest {VET.name} — book from Activity.
              </p>
            </div>
          </div>
        </div>
      )}

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

      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
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
                petId === p.id ? "bg-accent text-white" : "bg-card text-label shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)]"
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
            disabled={!title.trim() || !petId}
            onClick={() => {
              addReminder({ petId, title: title.trim(), emoji: "📝", due: Date.now() + days * 86_400_000 });
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
