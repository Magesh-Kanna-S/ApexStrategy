"use client";

/**
 * ApexStrategy Enterprise — Market Share Chart
 * Interactive breakdown of segment dominance per round.
 * Renders a stacked bar chart showing each team's share
 * of each segment for the most recent round.
 */

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GameState } from "@/types/game";

interface MarketShareChartProps {
  state: GameState;
  /** Round to visualize (defaults to latest) */
  round?: number;
  /** If "pie" renders a pie of total team share; if "stacked" renders per-segment stacked bars */
  variant?: "pie" | "stacked";
  height?: number;
}

const SEGMENT_LABELS: Record<string, string> = {
  traditional: "Traditional",
  low_end: "Low End",
  high_end: "High End",
  performance: "Performance",
  size: "Size",
};

export function MarketShareChart({
  state,
  round,
  variant = "stacked",
  height = 280,
}: MarketShareChartProps) {
  const targetRound = round ?? state.currentRound;
  const entry = state.history.find((h) => h.round === targetRound) ?? state.history[state.history.length - 1];

  if (!entry) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data yet — process a round to see market share.
      </div>
    );
  }

  // ── Stacked variant: per-segment stacked bar ──
  if (variant === "stacked") {
    const segmentData = state.segments.map((seg) => {
      const row: Record<string, number | string> = { segment: SEGMENT_LABELS[seg.id] };
      for (const team of state.teams) {
        const tr = entry.teamResults.find((r) => r.teamId === team.id);
        const product = tr?.products.find((p) => p.segment === seg.id);
        row[team.name] = product?.marketShare ?? 0;
      }
      return row;
    });

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={segmentData} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
          <XAxis
            dataKey="segment"
            stroke="currentColor"
            strokeOpacity={0.4}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="currentColor"
            strokeOpacity={0.4}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
          {state.teams.map((team) => (
            <Bar
              key={team.id}
              dataKey={team.name}
              stackId="share"
              fill={team.color}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // ── Pie variant: total team share across all segments ──
  const pieData = state.teams.map((team) => {
    const tr = entry.teamResults.find((r) => r.teamId === team.id);
    const totalSold = tr?.products.reduce((s, p) => s + p.unitsSold, 0) ?? 0;
    return {
      name: team.name,
      value: totalSold,
      color: team.color,
    };
  });

  const total = pieData.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          label={(d: { value: number; name: string }) =>
            `${d.name}: ${((d.value / total) * 100).toFixed(1)}%`
          }
          labelLine={false}
        >
          {pieData.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="var(--background)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [`${value.toLocaleString()} units`, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
