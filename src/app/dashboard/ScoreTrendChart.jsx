"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function TelemetryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#22252C] bg-[#0A0B0D]/95 px-3 py-2 text-xs shadow-xl">
      <p className="tabular-telemetry text-[11px] font-semibold text-[#F3F4F6]">
        {point.fullDate}
      </p>
      {point.score !== null ? (
        <div className="mt-1 space-y-0.5 font-mono text-[11px]">
          <p className="text-emerald-400">
            SCORE: <span className="font-bold text-[#F3F4F6]">{point.score}/100</span>
          </p>
          <p className="text-sky-400">
            MOOD: <span className="text-[#D1D5DB]">{point.mood}</span>
          </p>
        </div>
      ) : (
        <p className="mt-1 font-mono text-[10px] text-[#5C6270]">UNLOGGED</p>
      )}
    </div>
  );
}

export default function ScoreTrendChart({ data }) {
  const hasAnyScore = data.some((d) => d.score !== null);

  if (!hasAnyScore) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[#22252C] bg-[#0A0B0D]/50 p-4 text-center">
        <p className="font-mono text-xs text-[#8E95A2]">NO_SCORE_HISTORY</p>
        <p className="mt-1 font-mono text-[11px] text-[#5C6270]">
          LOG_CHECKLIST + JOURNAL_ENTRY TO POPULATE
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient id="emeraldTelemetryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1B1E24"
            vertical={false}
          />

          <XAxis
            dataKey="shortDate"
            stroke="#5C6270"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            style={{ fontFamily: "var(--font-mono)" }}
          />

          <YAxis
            domain={[0, 100]}
            stroke="#5C6270"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            style={{ fontFamily: "var(--font-mono)" }}
          />

          <Tooltip content={<TelemetryTooltip />} />

          <Area
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#emeraldTelemetryFill)"
            connectNulls
            dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: "#34d399",
              stroke: "#0A0B0D",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}