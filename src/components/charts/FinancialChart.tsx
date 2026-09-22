"use client";

/**
 * ApexStrategy Enterprise — Financial Chart
 * Multi-line Recharts component for tracking financial
 * health (Revenue / Net Profit / Cash / Stock Price)
 * across all rounds for one or more teams.
 */

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RoundHistoryEntry, Team } from "@/types/game";

interface FinancialChartProps {
  history: RoundHistoryEntry[];
  teams: Team[];
  /** Which metric to plot */
  metric: "revenue" | "netProfit" | "cash" | "stockPrice" | "netMargin" | "roe";
  /** Which teams to include (default = all) */
  teamIds?: string[];
  height?: number;
}

const METRIC_CONFIG: Record<
  FinancialChartProps["metric"],
  { label: string; color: string; format: (v: number) => string }
> = {
  revenue: { label: "Revenue", color: "#10b981", format: (v) => `$${(v).toFixed(0)}K` },
  netProfit: { label: "Net Profit", color: "#06b6d4", format: (v) => `$${(v).toFixed(0)}K` },
  cash: { label: "Cash", color: "#f59e0b", format: (v) => `$${(v).toFixed(0)}K` },
  stockPrice: { label: "Stock Price", color: "#a855f7", format: (v) => `$${v.toFixed(2)}` },
  netMargin: { label: "Net Margin %", color: "#ec4899", format: (v) => `${v.toFixed(1)}%` },
  roe: { label: "ROE %", color: "#ef4444", format: (v) => `${v.toFixed(1)}%` },
};

export function FinancialChart({
  history,
  teams,
  metric,
  teamIds,
  height = 280,
}: FinancialChartProps) {
  const visibleTeams = teamIds
    ? teams.filter((t) => teamIds.includes(t.id))
    : teams;

  // Build the data array — one entry per round
  const data = React.useMemo(() => {
    return history.map((entry) => {
      const row: Record<string, number | string> = { round: `R${entry.round}` };
      for (const team of visibleTeams) {
        const tr = entry.teamResults.find((r) => r.teamId === team.id);
        if (!tr) continue;
        switch (metric) {
          case "revenue": row[team.name] = tr.metrics.revenue; break;
          case "netProfit": row[team.name] = tr.metrics.netProfit; break;
          case "cash": row[team.name] = tr.balance.cash; break;
          case "stockPrice": row[team.name] = tr.metrics.stockPrice; break;
          case "netMargin": row[team.name] = tr.metrics.netMargin; break;
          case "roe": row[team.name] = tr.metrics.roe; break;
        }
      }
      return row;
    });
  }, [history, visibleTeams, metric]);

  const cfg = METRIC_CONFIG[metric];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
        <XAxis
          dataKey="round"
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
          tickFormatter={(v) => cfg.format(v).replace(/\.0+/, "")}
          width={70}
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
          formatter={(value: number) => [cfg.format(value), cfg.label]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconType="circle"
        />
        {visibleTeams.map((team) => (
          <Line
            key={team.id}
            type="monotone"
            dataKey={team.name}
            stroke={team.color}
            strokeWidth={2}
            dot={{ r: 3, fill: team.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
