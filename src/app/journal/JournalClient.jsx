"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, CheckSquare, Loader2, AlertCircle } from "lucide-react";
import { saveAndScoreJournal } from "@/app/actions/journalActions";

export default function JournalClient({ initialEntry, checklistStats }) {
  const [content, setContent] = useState(initialEntry?.content || "");
  const [entry, setEntry] = useState(initialEntry);
  const [breakdown, setBreakdown] = useState(
    initialEntry
      ? {
          checklistPct: checklistStats.completionPct,
          reflectionScore: Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (initialEntry.final_daily_score -
                  0.5 * checklistStats.completionPct) /
                  0.5
              )
            )
          ),
          finalScore: initialEntry.final_daily_score,
        }
      : null
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const result = await saveAndScoreJournal(content);

      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }

      if (result?.success) {
        setEntry(result.entry);
        setBreakdown(result.breakdown);
      }
    });
  }

  const sentimentValue =
    entry?.sentiment_score !== undefined && entry?.sentiment_score !== null
      ? Number(entry.sentiment_score)
      : null;

  const sentimentFormatted =
    sentimentValue !== null
      ? `${sentimentValue >= 0 ? "+" : ""}${sentimentValue.toFixed(2)}`
      : "--";

  const readyChecklistPts = Math.round(0.5 * checklistStats.completionPct);

  return (
    <div className="grid gap-3 lg:grid-cols-12">
      {/* Left Bento Editor Panel (7 cols) */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-between rounded-xl border border-[#22252C] bg-[#111317] p-4 lg:col-span-7"
      >
        <div>
          <div className="flex items-center justify-between border-b border-[#1B1E24] pb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
              DAILY_REFLECTION_LOG
            </span>

            <Link
              href="/checklist"
              className="tabular-telemetry inline-flex items-center gap-1.5 rounded border border-[#22252C] bg-[#0A0B0D] px-2.5 py-1 text-[11px] text-[#8E95A2] transition hover:border-[#3E4452] hover:text-[#F3F4F6]"
            >
              <CheckSquare className="h-3 w-3 text-emerald-400" />
              TASKS {checklistStats.completedTasks}/{checklistStats.totalTasks}{" "}
              ({checklistStats.completionPct}%)
            </Link>
          </div>

          <textarea
            rows={13}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Log training output, work execution, energy levels, and key reflections..."
            className="mt-3 w-full resize-none rounded-lg border border-[#1B1E24] bg-[#0A0B0D] p-4 font-sans text-sm leading-relaxed text-[#F3F4F6] placeholder-[#5C6270] focus:border-[#3E4452] focus:outline-none"
          />

          {errorMsg && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#1B1E24] pt-3">
          <span className="tabular-telemetry text-[11px] text-[#5C6270]">
            {content.trim().length} CHARS
          </span>

          <button
            type="submit"
            disabled={isPending || content.trim().length < 10}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F4F6] px-4 py-2 text-xs font-semibold text-[#0A0B0D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scoring...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {entry ? "Re-Score Entry" : "Analyze & Score"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Right Bento Telemetry Stack (5 cols) */}
      <div className="flex flex-col gap-3 lg:col-span-5">
        {entry ? (
          <>
            {/* Composite Score Card */}
            <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
                  COMPOSITE_DAILY_SCORE
                </span>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                  VERIFIED
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="tabular-telemetry text-4xl font-bold tracking-tight text-[#F3F4F6]">
                  {entry.final_daily_score}
                </span>
                <span className="tabular-telemetry text-sm text-[#5C6270]">
                  / 100
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1C1F26]">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${entry.final_daily_score}%` }}
                />
              </div>
            </div>

            {/* Mood & Sentiment 2-Up Bento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                  MOOD_LABEL
                </span>
                <p className="mt-2 font-mono text-base font-semibold text-emerald-400">
                  {entry.mood_label}
                </p>
              </div>

              <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                  POLARITY_INDEX
                </span>
                <p
                  className={`tabular-telemetry mt-2 text-base font-semibold ${
                    sentimentValue >= 0 ? "text-sky-400" : "text-rose-400"
                  }`}
                >
                  {sentimentFormatted}
                </p>
              </div>
            </div>

            {/* 50/50 Formula Telemetry */}
            {breakdown && (
              <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                  WEIGHTED_BREAKDOWN
                </span>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#1B1E24] pb-1.5">
                    <span className="text-[#8E95A2]">
                      Checklist ({checklistStats.completionPct}%)
                    </span>
                    <span className="tabular-telemetry font-medium text-[#F3F4F6]">
                      +{Math.round(0.5 * checklistStats.completionPct)} PTS
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E95A2]">
                      AI Reflection ({breakdown.reflectionScore}%)
                    </span>
                    <span className="tabular-telemetry font-medium text-[#F3F4F6]">
                      +{Math.round(0.5 * breakdown.reflectionScore)} PTS
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gemini Insight Tile */}
            <div className="flex-1 rounded-xl border border-[#22252C] bg-[#111317] p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-sky-400">
                AI_SYNTHESIS
              </span>
              <p className="mt-2 text-xs leading-relaxed text-[#D1D5DB]">
                {entry.ai_insight}
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col justify-between rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C6270]">
                SCORE_STANDBY
              </span>
              <span className="tabular-telemetry rounded border border-[#22252C] bg-[#0A0B0D] px-2 py-0.5 text-[10px] text-[#8E95A2]">
                +{readyChecklistPts} PTS QUEUED
              </span>
            </div>

            <div className="my-auto py-8 text-center">
              <p className="font-mono text-xs text-[#8E95A2]">
                NO_ENTRY_SCORED_TODAY
              </p>
              <p className="mt-1.5 text-xs text-[#5C6270]">
                Submit at least 10 characters to compute today&apos;s mood and
                0–100 score.
              </p>
            </div>

            <div className="border-t border-[#1B1E24] pt-2.5 font-mono text-[10px] text-[#5C6270]">
              FORMULA: (0.5 × TASKS) + (0.5 × GEMINI_REFLECTION)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}