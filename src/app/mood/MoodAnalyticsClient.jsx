"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";

const MOOD_COLORS = {
  Energized: "#10b981",
  Focused: "#38bdf8",
  Calm: "#2dd4bf",
  Grateful: "#34d399",
  Neutral: "#8E95A2",
  Tired: "#fbbf24",
  Stressed: "#fb923c",
  Anxious: "#f43f5e",
};

function getMoodColor(moodLabel) {
  return MOOD_COLORS[moodLabel] || "#38bdf8";
}

function DistributionTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#22252C] bg-[#0A0B0D]/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-mono text-[11px] font-semibold text-[#F3F4F6]">
        {item.mood.toUpperCase()}
      </p>
      <p className="tabular-telemetry mt-1 text-[11px] text-[#8E95A2]">
        DAYS: <span className="font-bold text-[#F3F4F6]">{item.count}</span>
      </p>
      <p className="tabular-telemetry text-[11px] text-[#8E95A2]">
        AVG_POLARITY:{" "}
        <span className="font-bold text-emerald-400">
          {item.avgSentiment >= 0 ? "+" : ""}
          {item.avgSentiment.toFixed(2)}
        </span>
      </p>
    </div>
  );
}

function CorrelationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const cohort = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#22252C] bg-[#0A0B0D]/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-mono text-[11px] font-semibold text-[#F3F4F6]">
        {cohort.label} ({cohort.days}d)
      </p>
      <p className="tabular-telemetry mt-1 text-[11px] text-emerald-400">
        POLARITY:{" "}
        <span className="font-bold text-[#F3F4F6]">
          {cohort.avgSentiment >= 0 ? "+" : ""}
          {cohort.avgSentiment.toFixed(2)}
        </span>
      </p>
      <p className="tabular-telemetry text-[11px] text-sky-400">
        SCORE:{" "}
        <span className="font-bold text-[#F3F4F6]">
          {cohort.avgDailyScore}/100
        </span>
      </p>
    </div>
  );
}

export default function MoodAnalyticsClient({
  moodDistribution,
  correlationData,
}) {
  if (!moodDistribution.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#22252C] bg-[#111317] p-6 text-center">
        <p className="font-mono text-xs text-[#8E95A2]">INSUFFICIENT_TELEMETRY</p>
        <p className="mt-1 font-mono text-[11px] text-[#5C6270]">
          LOG_JOURNAL_AND_GYM_TASKS TO COMPUTE CORRELATIONS
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Chart 1: 30-Day Emotion Distribution */}
      <section className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[#1B1E24] pb-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
            30D_EMOTION_DISTRIBUTION
          </span>
          <span className="font-mono text-[10px] text-[#5C6270]">COUNT</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={moodDistribution}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1B1E24"
                vertical={false}
              />
              <XAxis
                dataKey="mood"
                stroke="#8E95A2"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <YAxis
                allowDecimals={false}
                stroke="#5C6270"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <Tooltip
                content={<DistributionTooltip />}
                cursor={{ fill: "#1B1E24", opacity: 0.5 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={42}>
                {moodDistribution.map((entry) => (
                  <Cell key={entry.mood} fill={getMoodColor(entry.mood)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Gym vs. Non-Gym Correlation */}
      <section className="rounded-xl border border-[#22252C] bg-[#111317] p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[#1B1E24] pb-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#8E95A2]">
            GYM_VS_REST_CORRELATION
          </span>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-[#8E95A2]">
              <span className="h-2 w-2 rounded-xs bg-emerald-500" />
              POLARITY
            </span>
            <span className="flex items-center gap-1 text-[#8E95A2]">
              <span className="h-2 w-2 rounded-xs bg-sky-400" />
              SCORE
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={correlationData}
              margin={{ top: 8, right: -14, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1B1E24"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#8E95A2"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <YAxis
                yAxisId="sentiment"
                domain={[-1, 1]}
                stroke="#10b981"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <YAxis
                yAxisId="score"
                orientation="right"
                domain={[0, 100]}
                stroke="#38bdf8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <ReferenceLine
                yAxisId="sentiment"
                y={0}
                stroke="#22252C"
                strokeDasharray="3 3"
              />
              <Tooltip
                content={<CorrelationTooltip />}
                cursor={{ fill: "#1B1E24", opacity: 0.5 }}
              />
              <Bar
                yAxisId="sentiment"
                dataKey="avgSentiment"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Bar
                yAxisId="score"
                dataKey="avgDailyScore"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}