"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { VET } from "@/lib/data";
import { dueLabel, useStore } from "@/lib/store";

export default function RemindersPage() {
  const { state, addReminder, toggleReminder, deleteReminder, toast } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [petId, setPetId] = useState(state.pets[0]?.id ?? "");
  const [days, setDays] = useState(1);

  const sorted = [...state.reminders].sort((a, b) => Number(a.done) - Number(b.done) || a.due - b.due);
  const petOf = (id: string) => state.pets.find((p) => p.id === id);

  return (
    <div className="px-5 pt-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Reminders</h1>
          <p className="text-sm font-semibold text-ink-soft">So nothing gets forgotten.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-full bg-brand px-4 py-2.5 text-sm font-black text-white shadow-md shadow-brand/40 transition active:scale-90"
        >
          + Add
        </button>
      </div>

      {state.premium && (
        <div className="mt-4 rounded-card bg-mint-soft p-4 ring-1 ring-mint/25">
          <p className="text-xs font-black uppercase tracking-wide text-mint">Smart reminder · PetPal Plus</p>
          <p className="mt-1 text-sm font-extrabold text-ink">
            🩺 In a week, Whiskers is due for a 6-month vet checkup
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            From the British Shorthair care plan. We suggest {VET.name} — book from the Activity tab.
          </p>
        </div>
      )}

      <ul className="mt-4 space-y-2.5">
        {sorted.map((r) => {
          const pet = petOf(r.petId);
          return (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-card p-3.5 ring-1 ${
                r.done ? "bg-white/60 ring-line opacity-60" : "bg-white ring-line"
              }`}
            >
              <button
                onClick={() => {
                  toggleReminder(r.id);
                  if (!r.done) toast("✅", `Done: ${r.title}`, "Nice work, pet parent!");
                }}
                aria-label={r.done ? "Mark as not done" : "Mark as done"}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm transition active:scale-90 ${
                  r.done ? "border-mint bg-mint text-white" : "border-line bg-white"
                }`}
              >
                {r.done ? "✓" : ""}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-extrabold text-ink ${r.done ? "line-through" : ""}`}>
                  {r.emoji} {r.title}
                </p>
                <p className="text-xs font-semibold text-ink-soft">
                  {pet ? `${pet.emoji} ${pet.name} · ` : ""}
                  {r.done ? "done" : dueLabel(r.due)}
                </p>
              </div>
              <button
                onClick={() => deleteReminder(r.id)}
                aria-label={`Delete ${r.title}`}
                className="shrink-0 rounded-full px-2 py-1 text-ink-soft transition hover:text-berry active:scale-90"
              >
                ✕
              </button>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="rounded-card bg-white p-6 text-center ring-1 ring-line">
            <span className="text-4xl">🌤️</span>
            <p className="mt-2 text-sm font-extrabold text-ink">All clear!</p>
            <p className="text-xs font-semibold text-ink-soft">Add a reminder so the whole family sees it.</p>
          </li>
        )}
      </ul>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-xl font-black text-ink">New reminder</h2>
        <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-soft" htmlFor="rem-title">
          What needs doing?
        </label>
        <input
          id="rem-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Buy litter, flea treatment…"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink placeholder:text-ink-soft/70 focus:border-brand focus:outline-none"
        />
        <p className="mt-4 text-xs font-black uppercase tracking-wide text-ink-soft">For which pet?</p>
        <div className="mt-1.5 flex gap-2">
          {state.pets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPetId(p.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                petId === p.id ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-line"
              }`}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-wide text-ink-soft">When?</p>
        <div className="mt-1.5 flex gap-2">
          {[
            { d: 0, label: "Today" },
            { d: 1, label: "Tomorrow" },
            { d: 3, label: "In 3 days" },
            { d: 7, label: "Next week" },
          ].map((o) => (
            <button
              key={o.d}
              onClick={() => setDays(o.d)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                days === o.d ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-line"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button
          disabled={!title.trim() || !petId}
          onClick={() => {
            addReminder({ petId, title: title.trim(), emoji: "📝", due: Date.now() + days * 86_400_000 });
            setAddOpen(false);
            setTitle("");
            toast("⏰", "Reminder added", "The whole family can see it");
          }}
          className="mt-6 w-full rounded-2xl bg-brand px-4 py-4 text-base font-black text-white shadow-lg shadow-brand/40 transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          Add reminder
        </button>
      </Sheet>
    </div>
  );
}
