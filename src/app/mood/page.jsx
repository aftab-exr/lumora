import { redirect } from "next/navigation";
import { Dumbbell, Brain, Activity } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getServerSupabase } from "@/lib/supabase/server";
import MoodAnalyticsClient from "./MoodAnalyticsClient";

function getPastDateISO(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

export default async function MoodAnalyticsPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const thirtyDaysAgoISO = getPastDateISO(29);

  const [journalsRes, gymTasksRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select(
        "id, entry_date, mood_label, sentiment_score, final_daily_score, ai_insight"
      )
      .eq("user_id", user.id)
      .gte("entry_date", thirtyDaysAgoISO)
      .order("entry_date", { ascending: false }),
    supabase
      .from("daily_checklist")
      .select("task_date")
      .eq("user_id", user.id)
      .eq("category", "GYM")
      .eq("is_completed", true)
      .gte("task_date", thirtyDaysAgoISO),
  ]);

  const journals = journalsRes.data || [];
  const gymTasks = gymTasksRes.data || [];
  const gymCompletedDates = new Set(gymTasks.map((t) => t.task_date));

  // 1. Aggregate 30-day mood distribution
  const moodGroups = new Map();
  for (const entry of journals) {
    const label = entry.mood_label || "Neutral";
    const current = moodGroups.get(label) || {
      mood: label,
      count: 0,
      sentimentSum: 0,
    };
    current.count += 1;
    current.sentimentSum += Number(entry.sentiment_score) || 0;
    moodGroups.set(label, current);
  }

  const moodDistribution = Array.from(moodGroups.values())
    .map((g) => ({
      mood: g.mood,
      count: g.count,
      avgSentiment: Number((g.sentimentSum / g.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Partition Gym vs. Non-Gym cohorts
  const gymEntries = journals.filter((j) =>
    gymCompletedDates.has(j.entry_date)
  );
  const nonGymEntries = journals.filter(
    (j) => !gymCompletedDates.has(j.entry_date)
  );

  const gymAvgSentiment = Number(
    average(gymEntries.map((e) => Number(e.sentiment_score) || 0)).toFixed(2)
  );
  const nonGymAvgSentiment = Number(
    average(nonGymEntries.map((e) => Number(e.sentiment_score) || 0)).toFixed(2)
  );

  const gymAvgScore = Math.round(
    average(gymEntries.map((e) => e.final_daily_score || 0))
  );
  const nonGymAvgScore = Math.round(
    average(nonGymEntries.map((e) => e.final_daily_score || 0))
  );

  const hasBothCohorts = gymEntries.length > 0 && nonGymEntries.length > 0;
  const sentimentLift = hasBothCohorts
    ? Number((gymAvgSentiment - nonGymAvgSentiment).toFixed(2))
    : null;

  const correlationData = [
    {
      label: "GYM_DAYS",
      days: gymEntries.length,
      avgSentiment: gymAvgSentiment,
      avgDailyScore: gymAvgScore,
    },
    {
      label: "REST_DAYS",
      days: nonGymEntries.length,
      avgSentiment: nonGymAvgSentiment,
      avgDailyScore: nonGymAvgScore,
    },
  ];

  const overallAvgSentiment = Number(
    average(journals.map((e) => Number(e.sentiment_score) || 0)).toFixed(2)
  );

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Top 3 Correlation KPI Bento Tiles */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                AVG_POLARITY_30D
              </span>
              <Brain className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <p className="tabular-telemetry mt-2 text-2xl font-bold text-[#F3F4F6]">
              {overallAvgSentiment >= 0 ? "+" : ""}
              {overallAvgSentiment.toFixed(2)}
              <span className="ml-1.5 text-[11px] font-normal text-[#5C6270]">
                [-1.0..+1.0]
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                GYM_MOOD_DELTA
              </span>
              <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="tabular-telemetry mt-2 text-2xl font-bold text-emerald-400">
              {sentimentLift !== null
                ? `${sentimentLift >= 0 ? "+" : ""}${sentimentLift.toFixed(2)}`
                : "PENDING"}
            </p>
          </div>

          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                GYM_ACTIVE_DAYS
              </span>
              <Activity className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="tabular-telemetry mt-2 text-2xl font-bold text-[#F3F4F6]">
              {gymCompletedDates.size}
              <span className="text-xs font-normal text-[#5C6270]"> / 30d</span>
            </p>
          </div>
        </section>

        {/* Recharts Distribution & Correlation Grid */}
        <MoodAnalyticsClient
          moodDistribution={moodDistribution}
          correlationData={correlationData}
        />

        {/* Compact Telemetry Audit Log */}
        {journals.length > 0 && (
          <section className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between border-b border-[#1B1E24] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
                RECENT_MOOD_TELEMETRY_LOG
              </span>
              <span className="tabular-telemetry text-[10px] text-[#5C6270]">
                LAST {Math.min(journals.length, 10)} ENTRIES
              </span>
            </div>

            <div className="divide-y divide-[#1B1E24]">
              {journals.slice(0, 10).map((entry) => {
                const didGym = gymCompletedDates.has(entry.entry_date);
                const sentiment = Number(entry.sentiment_score) || 0;

                return (
                  <div
                    key={entry.id}
                    className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-telemetry text-xs font-semibold text-[#F3F4F6]">
                          {entry.entry_date}
                        </span>
                        <span className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-sky-400">
                          {entry.mood_label?.toUpperCase()}
                        </span>
                        {didGym && (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400">
                            <Dumbbell className="h-2.5 w-2.5" /> GYM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8E95A2]">{entry.ai_insight}</p>
                    </div>

                    <div className="tabular-telemetry flex shrink-0 items-center gap-4 text-xs">
                      <span
                        className={
                          sentiment >= 0 ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {sentiment >= 0 ? "+" : ""}
                        {sentiment.toFixed(2)}
                      </span>
                      <span className="font-semibold text-[#F3F4F6]">
                        {entry.final_daily_score}
                        <span className="text-[#5C6270]">/100</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}