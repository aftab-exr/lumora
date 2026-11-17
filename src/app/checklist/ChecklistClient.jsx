"use client";

import { useState, useOptimistic, useTransition } from "react";
import {
  Dumbbell,
  Briefcase,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Zap,
} from "lucide-react";
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  applyRoutineTemplate,
} from "@/app/actions/checklistActions";

const CATEGORIES = [
  {
    key: "GYM",
    code: "GYM",
    label: "Gym & Training",
    icon: Dumbbell,
    accent: "text-emerald-400",
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  {
    key: "WORK",
    code: "WORK",
    label: "Core Tasks",
    icon: Briefcase,
    accent: "text-sky-400",
    pill: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
  {
    key: "HABIT",
    code: "HABIT",
    label: "Daily Habits",
    icon: Sparkles,
    accent: "text-amber-400",
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
];

const TEMPLATES = [
  { key: "push_gym", label: "PUSH_GYM" },
  { key: "deep_work", label: "DEEP_WORK" },
  { key: "morning_habits", label: "MORNING_HABITS" },
];

export default function ChecklistClient({ initialTasks }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("GYM");
  const [isPending, startTransition] = useTransition();

  const [optimisticTasks, dispatchOptimistic] = useOptimistic(
    initialTasks,
    (current, action) => {
      switch (action.type) {
        case "TOGGLE":
          return current.map((t) =>
            t.id === action.id ? { ...t, is_completed: !t.is_completed } : t
          );
        case "DELETE":
          return current.filter((t) => t.id !== action.id);
        case "ADD":
          return [
            ...current,
            {
              id: `temp-${Date.now()}`,
              title: action.title,
              category: action.category,
              is_completed: false,
            },
          ];
        default:
          return current;
      }
    }
  );

  const completedCount = optimisticTasks.filter((t) => t.is_completed).length;
  const totalCount = optimisticTasks.length;
  const completionPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function handleAdd(e) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    setTitle("");

    startTransition(async () => {
      dispatchOptimistic({ type: "ADD", title: clean, category });
      await addChecklistItem({ title: clean, category });
    });
  }

  function handleToggle(task) {
    startTransition(async () => {
      dispatchOptimistic({ type: "TOGGLE", id: task.id });
      await toggleChecklistItem(task.id, !task.is_completed);
    });
  }

  function handleDelete(taskId) {
    startTransition(async () => {
      dispatchOptimistic({ type: "DELETE", id: taskId });
      await deleteChecklistItem(taskId);
    });
  }

  function handleTemplate(templateKey) {
    startTransition(async () => {
      await applyRoutineTemplate(templateKey);
    });
  }

  return (
    <div className="space-y-3">
      {/* Top Bento Control & Telemetry Row */}
      <div className="grid gap-3 lg:grid-cols-12">
        {/* Execution Telemetry Tile (4 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-[#22252C] bg-[#111317] p-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
              EXECUTION_RATE
            </span>
            <span className="tabular-telemetry rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              50% SCORE WEIGHT
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="tabular-telemetry text-3xl font-bold tracking-tight text-[#F3F4F6]">
              {completionPct}%
            </span>
            <span className="tabular-telemetry text-xs text-[#8E95A2]">
              {completedCount}/{totalCount} DONE
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1C1F26]">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Add Item + Routine Presets Tile (8 cols) */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#22252C] bg-[#111317] p-4 lg:col-span-8">
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Task category"
              className="rounded-lg border border-[#22252C] bg-[#0A0B0D] px-3 py-2 font-mono text-xs text-[#F3F4F6] focus:border-[#3E4452] focus:outline-none"
            >
              <option value="GYM">GYM</option>
              <option value="WORK">WORK</option>
              <option value="HABIT">HABIT</option>
            </select>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New workout set, task, or habit..."
              className="flex-1 rounded-lg border border-[#22252C] bg-[#0A0B0D] px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#5C6270] focus:border-[#3E4452] focus:outline-none"
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F3F4F6] px-4 py-2 text-xs font-semibold text-[#0A0B0D] transition hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#1B1E24] pt-2.5">
            <span className="mr-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
              <Zap className="h-3 w-3 text-amber-400" />
              PRESETS
            </span>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                disabled={isPending}
                onClick={() => handleTemplate(tpl.key)}
                className="rounded border border-[#22252C] bg-[#0A0B0D] px-2.5 py-1 font-mono text-[11px] text-[#8E95A2] transition hover:border-[#3E4452] hover:text-[#F3F4F6] disabled:opacity-50"
              >
                + {tpl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Column Bento Task Lists */}
      <div className="grid gap-3 md:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const items = optimisticTasks.filter((t) => t.category === cat.key);
          const doneCount = items.filter((t) => t.is_completed).length;

          return (
            <section
              key={cat.key}
              className="flex flex-col rounded-xl border border-[#22252C] bg-[#111317] p-4"
            >
              <div className="flex items-center justify-between border-b border-[#1B1E24] pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${cat.accent}`} />
                  <h2 className="text-xs font-semibold text-[#F3F4F6]">
                    {cat.label}
                  </h2>
                </div>
                <span
                  className={`tabular-telemetry rounded border px-1.5 py-0.5 text-[10px] font-medium ${cat.pill}`}
                >
                  {doneCount}/{items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8 font-mono text-[11px] text-[#5C6270]">
                  EMPTY_QUEUE
                </div>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {items.map((task) => (
                    <li
                      key={task.id}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-[#1B1E24] bg-[#0D0F12] px-3 py-2 transition hover:border-[#2C313C]"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        className="flex flex-1 items-center gap-2.5 text-left"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                            task.is_completed
                              ? "border-emerald-400 bg-emerald-400 text-[#0A0B0D]"
                              : "border-[#353B47] bg-transparent"
                          }`}
                        >
                          {task.is_completed && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </span>
                        <span
                          className={`text-xs leading-snug ${
                            task.is_completed
                              ? "text-[#5C6270] line-through"
                              : "text-[#E5E7EB]"
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        aria-label="Delete item"
                        className="text-[#5C6270] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}