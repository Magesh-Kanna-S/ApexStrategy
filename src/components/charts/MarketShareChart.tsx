"use client";

/**
 * ApexStrategy Enterprise — Market Share Chart
 * Interactive breakdown of segment dominance per round.
 * Renders a stacked bar chart showing each team's share
 * of each segment for the most recent round.
 *
 * Two variants:
 *   - "stacked": per-segment stacked bar (team share within each segment)
 *   - "pie": doughnut chart of total units sold across all segments
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
  /** If "pie" renders a doughnut of total team share; if "stacked" renders per-segment stacked bars */
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

// Label renderer props from Recharts Pie
interface PieLabelProps {
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  value?: number;
  name?: string;
  index?: number;
}

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
              backgroundColor: "rgb(17 24 39)",
              border: "1px solid rgb(55 65 81)",
              borderRadius: "0.5rem",
              color: "rgb(243 244 246)",
              fontSize: 12,
              boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.4)",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "rgb(156 163 175)", fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: "rgb(243 244 246)" }}
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

  // ── Pie (doughnut) variant: total team share across all segments ──
  const pieData = state.teams.map((team) => {
    const tr = entry.teamResults.find((r) => r.teamId === team.id);
    const totalSold = tr?.products.reduce((s, p) => s + p.unitsSold, 0) ?? 0;
    return {
      name: team.name,
      value: totalSold,
      color: team.color,
    };
  });

  const grandTotal = pieData.reduce((s, d) => s + d.value, 0) || 1;

  // Custom label renderer — positions text at the computed x/y from Recharts
  const renderLabel = (props: PieLabelProps) => {
    const { x, y, name, percent, value } = props;
    // Skip label if the slice is too small (< 3%)
    if (!percent || percent < 0.03) return null;
    // Skip if no units sold
    if (!value || value === 0) return null;

    const pct = (percent * 100).toFixed(1);
    const labelX = x ?? 0;
    const labelY = y ?? 0;

    return (
      <text
        x={labelX}
        y={labelY}
        fill="rgb(243 244 246)"
        fontSize={11}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ textShadow: "0 1px 4px rgb(0 0 0 / 0.8), 0 0 8px rgb(0 0 0 / 0.6)" }}
      >
        {`${pct}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          label={renderLabel}
          labelLine={false}
          isAnimationActive={true}
          animationDuration={600}
        >
          {pieData.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="var(--background)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "rgb(17 24 39)",
            border: "1px solid rgb(55 65 81)",
            borderRadius: "0.5rem",
            color: "rgb(243 244 246)",
            fontSize: 12,
            boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.4)",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "rgb(156 163 175)", fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: "rgb(243 244 246)" }}
          formatter={(value: number, name: string) => {
            const pct = ((value / grandTotal) * 100).toFixed(1);
            return [`${value.toLocaleString()} units (${pct}%)`, name];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconType="circle"
          formatter={(value: string) => {
            // Find the matching pie data to show percentage alongside the name
            const item = pieData.find((d) => d.name === value);
            if (item && grandTotal > 0) {
              const pct = ((item.value / grandTotal) * 100).toFixed(1);
              return `${value} — ${pct}%`;
            }
            return value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
