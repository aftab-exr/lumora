import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Flame,
  TrendingUp,
  CheckCircle2,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { getServerSupabase } from "@/lib/supabase/server";
import ScoreTrendChart from "./ScoreTrendChart";

function getPastDateISO(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function formatShortDate(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${month}/${day}`;
}

function getDominantMood(entries) {
  if (!entries.length) return "NONE";

  const counts = {};
  for (const entry of entries) {
    if (!entry.mood_label) continue;
    counts[entry.mood_label] = (counts[entry.mood_label] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0]?.toUpperCase() || "NEUTRAL";
}

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayISO = getPastDateISO(0);
  const sevenDaysAgoISO = getPastDateISO(6);
  const fourteenDaysAgoISO = getPastDateISO(13);

  const [profileRes, journalsRes, tasksRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("current_streak")
      .eq("id", user.id)
      .single(),
    supabase
      .from("journal_entries")
      .select("entry_date, final_daily_score, mood_label, ai_insight")
      .eq("user_id", user.id)
      .gte("entry_date", fourteenDaysAgoISO)
      .order("entry_date", { ascending: true }),
    supabase
      .from("daily_checklist")
      .select("task_date, is_completed")
      .eq("user_id", user.id)
      .gte("task_date", sevenDaysAgoISO),
  ]);

  const currentStreak = profileRes.data?.current_streak || 0;
  const journals14d = journalsRes.data || [];
  const tasks7d = tasksRes.data || [];

  // 7-Day Average Score
  const journals7d = journals14d.filter((j) => j.entry_date >= sevenDaysAgoISO);
  const sevenDayAvg =
    journals7d.length > 0
      ? Math.round(
          journals7d.reduce((sum, item) => sum + (item.final_daily_score || 0), 0) /
            journals7d.length
        )
      : 0;

  // 7-Day Checklist Execution Rate
  const completedTasks7d = tasks7d.filter((t) => t.is_completed).length;
  const taskCompletionRate =
    tasks7d.length > 0
      ? Math.round((completedTasks7d / tasks7d.length) * 100)
      : 0;

  // Today's Live Status
  const todayTasks = tasks7d.filter((t) => t.task_date === todayISO);
  const todayDone = todayTasks.filter((t) => t.is_completed).length;
  const todayEntry = journals14d.find((j) => j.entry_date === todayISO) || null;

  // Dominant Mood (14-Day Window)
  const dominantMood = getDominantMood(journals14d);

  // Continuous 14-day timeline for Recharts
  const journalByDate = new Map(
    journals14d.map((entry) => [entry.entry_date, entry])
  );

  const chartData = Array.from({ length: 14 }, (_, idx) => {
    const iso = getPastDateISO(13 - idx);
    const match = journalByDate.get(iso);
    return {
      fullDate: iso,
      shortDate: formatShortDate(iso),
      score: match ? match.final_daily_score : null,
      mood: match?.mood_label || "UNLOGGED",
    };
  });

  const latestEntry = journals14d[journals14d.length - 1] || null;

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Top 4-Tile KPI Bento Row */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                STREAK
              </span>
              <Flame className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="tabular-telemetry mt-2 text-2xl font-bold text-[#F3F4F6]">
              {currentStreak}
              <span className="ml-1 text-xs font-normal text-[#8E95A2]">d</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                AVG_SCORE_7D
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="tabular-telemetry mt-2 text-2xl font-bold text-[#F3F4F6]">
              {sevenDayAvg}
              <span className="text-xs font-normal text-[#5C6270]">/100</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                EXECUTION_7D
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <p className="tabular-telemetry mt-2 text-2xl font-bold text-[#F3F4F6]">
              {taskCompletionRate}%
            </p>
          </div>

          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C6270]">
                DOMINANT_MOOD
              </span>
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="mt-2 font-mono text-xl font-bold text-emerald-400">
              {dominantMood}
            </p>
          </div>
        </section>

        {/* Main 12-Col Bento Grid */}
        <section className="grid gap-3 lg:grid-cols-12">
          {/* 14-Day Score Trend Chart (8 cols) */}
          <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4 lg:col-span-8">
            <div className="mb-3 flex items-center justify-between border-b border-[#1B1E24] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
                  14D_PERFORMANCE_CURVE
                </span>
              </div>

              <Link
                href="/journal"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 transition hover:text-emerald-300"
              >
                LOG_ENTRY <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <ScoreTrendChart data={chartData} />
          </div>

          {/* Right Status & AI Synthesis Stack (4 cols) */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            {/* Today's Live Checkpoint */}
            <div className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
              <div className="flex items-center justify-between border-b border-[#1B1E24] pb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
                  TODAY_CHECKPOINT
                </span>
                <span className="tabular-telemetry font-mono text-[10px] text-[#5C6270]">
                  {todayISO}
                </span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E95A2]">Checklist Queue</span>
                  <Link
                    href="/checklist"
                    className="tabular-telemetry inline-flex items-center gap-1 font-medium text-[#F3F4F6] hover:text-emerald-400"
                  >
                    {todayDone}/{todayTasks.length} DONE
                    <ArrowUpRight className="h-3 w-3 text-[#5C6270]" />
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E95A2]">Daily Score</span>
                  <Link
                    href="/journal"
                    className="tabular-telemetry inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    {todayEntry
                      ? `${todayEntry.final_daily_score}/100`
                      : "PENDING"}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Latest AI Insight */}
            <div className="flex flex-1 flex-col justify-between rounded-xl border border-[#22252C] bg-[#111317] p-4">
              <div>
                <div className="flex items-center justify-between border-b border-[#1B1E24] pb-2.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-sky-400">
                    LATEST_AI_SYNTHESIS
                  </span>
                  {latestEntry && (
                    <span className="tabular-telemetry text-[10px] text-[#5C6270]">
                      {latestEntry.entry_date}
                    </span>
                  )}
                </div>

                {latestEntry ? (
                  <p className="mt-3 text-xs leading-relaxed text-[#D1D5DB]">
                    {latestEntry.ai_insight}
                  </p>
                ) : (
                  <p className="mt-3 font-mono text-[11px] text-[#5C6270]">
                    NO_INSIGHT_GENERATED
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-[#1B1E24] pt-3">
                <Link
                  href="/checklist"
                  className="flex-1 rounded-lg border border-[#22252C] bg-[#0A0B0D] py-1.5 text-center font-mono text-[11px] text-[#8E95A2] transition hover:border-[#3E4452] hover:text-[#F3F4F6]"
                >
                  TASKS
                </Link>
                <Link
                  href="/mood"
                  className="flex-1 rounded-lg border border-[#22252C] bg-[#0A0B0D] py-1.5 text-center font-mono text-[11px] text-[#8E95A2] transition hover:border-[#3E4452] hover:text-[#F3F4F6]"
                >
                  ANALYTICS
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}