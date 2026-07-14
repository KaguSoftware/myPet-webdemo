"use client";

import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { Icon } from "./Icons";
import { useStore } from "@/lib/store";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function StreakCalendarSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const activeDays = useMemo(() => {
    const set = new Set<string>();
    for (const a of state.activities) {
      const d = new Date(a.ts);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    return set;
  }, [state.activities]);

  const today = new Date();
  const isCurrentMonth = calendarMonth.y === today.getFullYear() && calendarMonth.m === today.getMonth();
  const calendarCells = useMemo(() => {
    const { y, m } = calendarMonth;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWeekday = new Date(y, m, 1).getDay();
    const cells: ({ day: number; active: boolean; isToday: boolean; isFuture: boolean } | null)[] = Array(firstWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(y, m, day);
      cells.push({
        day,
        active: activeDays.has(`${y}-${m}-${day}`),
        isToday: date.toDateString() === today.toDateString(),
        isFuture: date > today,
      });
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth, activeDays]);

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="flex items-center gap-1.5 text-[20px] font-bold tracking-[-0.01em] text-label">
        <Icon name="flame" size={19} className="text-orange" /> {state.streak}-day streak
      </h2>
      <p className="mt-0.5 text-[13px] text-label-2">Days with logged care show up lit — keep it going</p>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setCalendarMonth((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-fill transition-transform active:scale-90"
        >
          <Icon name="chevron-left" size={14} />
        </button>
        <p className="text-[15px] font-bold text-label">
          {MONTH_NAMES[calendarMonth.m]} {calendarMonth.y}
        </p>
        <button
          onClick={() => setCalendarMonth((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
          aria-label="Next month"
          disabled={isCurrentMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-fill transition-transform active:scale-90 disabled:opacity-30"
        >
          <Icon name="chevron-right" size={14} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i} className="text-[11px] font-semibold text-label-3">
            {d}
          </span>
        ))}
        {calendarCells.map((cell, i) =>
          cell ? (
            <div key={i} className="flex items-center justify-center">
              <div
                role="img"
                aria-label={`${MONTH_NAMES[calendarMonth.m]} ${cell.day}${cell.isToday ? ", today" : ""} — ${
                  cell.active ? "care logged" : cell.isFuture ? "upcoming" : "no care logged"
                }`}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${
                  cell.active
                    ? "bg-orange text-white"
                    : cell.isToday
                      ? "text-label ring-2 ring-accent"
                      : cell.isFuture
                        ? "text-label-3/50"
                        : "text-label-2"
                }`}
              >
                {cell.active ? <Icon name="flame" size={14} /> : cell.day}
              </div>
            </div>
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </Sheet>
  );
}
