"use client";

/**
 * ApexStrategy Enterprise — Results View
 * Round-end debriefing analytics:
 *   - Latest round market share pie chart
 *   - Per-segment stacked bar chart
 *   - Stock price trend across all rounds
 *   - Net profit & revenue trend
 *   - Final leaderboard (if game complete)
 *   - Per-team round summary
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Medal,
  Crown,
  Award,
  Layers,
  Zap,
} from "lucide-react";
import { useGame } from "@/context/GameContext";
import { useCurrency } from "@/context/CurrencyContext";
import { FinancialChart } from "@/components/charts/FinancialChart";
import { MarketShareChart } from "@/components/charts/MarketShareChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtPct, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  traditional: "Traditional",
  low_end: "Low End",
  high_end: "High End",
  performance: "Performance",
  size: "Size",
};

export function ResultsView() {
  const { state, activeTeamId, setView, processNextRound, canProcessRound } = useGame();
  const { fmtMoney, fmtPrice } = useCurrency();
  if (!state) return null;

  const latest = state.history[state.history.length - 1];
  const activeTeam = state.teams.find((t) => t.id === activeTeamId) ?? state.teams[0];
  const playerResult = latest?.teamResults.find((r) => r.teamId === activeTeam.id);

  // Build leaderboard sorted by stock price
  const leaderboard = [...state.teams]
    .map((team) => {
      const result = latest?.teamResults.find((r) => r.teamId === team.id);
      const prevResult = state.history[state.history.length - 2]?.teamResults.find(
        (r) => r.teamId === team.id
      );
      return { team, result, prevResult };
    })
    .sort((a, b) => (b.result?.metrics.stockPrice ?? 0) - (a.result?.metrics.stockPrice ?? 0));

  const rankIcons = [
    <Crown key="1" className="h-4 w-4" />,
    <Medal key="2" className="h-4 w-4" />,
    <Award key="3" className="h-4 w-4" />,
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-chart-2" />
            Round {state.currentRound} Debrief
          </h1>
          <p className="text-sm text-muted-foreground">
            {state.status === "completed"
              ? `Simulation complete — final standings across ${state.maxRounds} rounds.`
              : `Latest results across all teams. ${state.maxRounds - state.currentRound} round(s) remaining.`}
          </p>
        </div>
        {canProcessRound && (
          <Button onClick={processNextRound} className="gap-2 apex-glow" size="sm">
            <Zap className="h-4 w-4" />
            Process Round {state.currentRound + 1}
          </Button>
        )}
      </motion.div>

      {/* ── Podium ── */}
      {state.history.length > 1 && (
        <Card className="apex-card mb-4 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-2" />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked by current stock price · {state.currentRound} rounds played
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {leaderboard.map(({ team, result, prevResult }, idx) => {
                const stock = result?.metrics.stockPrice ?? 0;
                const prevStock = prevResult?.metrics.stockPrice ?? stock;
                const delta = stock - prevStock;
                const isActive = team.id === activeTeam.id;
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={cn(
                      "apex-card p-4 relative overflow-hidden",
                      isActive && "ring-1 ring-primary/40"
                    )}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: team.color }}
                    />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "grid place-items-center h-7 w-7 rounded-md text-xs font-bold",
                            idx === 0 ? "bg-chart-2/20 text-chart-2" :
                            idx === 1 ? "bg-foreground/10 text-foreground" :
                            idx === 2 ? "bg-chart-3/20 text-chart-3" :
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          {idx < 3 ? rankIcons[idx] : idx + 1}
                        </div>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: team.color }}
                        />
                      </div>
                      {team.isPlayer && (
                        <Badge variant="secondary" className="text-[9px] h-4 py-0">YOU</Badge>
                      )}
                    </div>
                    <div className="text-sm font-semibold mb-1 truncate">{team.name}</div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold tabular-nums">{fmtPrice(stock)}</div>
                        <div className="text-[10px] text-muted-foreground">stock price</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            "text-xs tabular-nums font-medium",
                            delta >= 0 ? "text-chart-1" : "text-chart-3"
                          )}
                        >
                          {delta >= 0 ? "+" : "-"}{fmtPrice(Math.abs(delta))}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Δ vs prev</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground">NP</div>
                        <div
                          className={cn(
                            "font-semibold tabular-nums",
                            (result?.metrics.netProfit ?? 0) >= 0 ? "text-chart-1" : "text-chart-3"
                          )}
                        >
                          {fmtMoney(result?.metrics.netProfit ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Share</div>
                        <div className="font-semibold tabular-nums">
                          {fmtPct(result?.metrics.marketShare ?? 0)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock price trend */}
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-5" />
              Stock Price Trend
            </CardTitle>
            <CardDescription className="text-xs">All teams across all rounds</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialChart history={state.history} teams={state.teams} metric="stockPrice" height={240} />
          </CardContent>
        </Card>

        {/* Net profit trend */}
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-1" />
              Net Profit Trend
            </CardTitle>
            <CardDescription className="text-xs">All teams across all rounds</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialChart history={state.history} teams={state.teams} metric="netProfit" height={240} />
          </CardContent>
        </Card>

        {/* Market share pie (latest round) */}
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-chart-4" />
              Total Market Share — Round {state.currentRound}
            </CardTitle>
            <CardDescription className="text-xs">Units sold across all segments</CardDescription>
          </CardHeader>
          <CardContent>
            <MarketShareChart state={state} variant="pie" height={240} />
          </CardContent>
        </Card>

        {/* Per-segment stacked bar */}
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-2" />
              Segment Share Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Team dominance per segment</CardDescription>
          </CardHeader>
          <CardContent>
            <MarketShareChart state={state} variant="stacked" height={240} />
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue & ROE charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-chart-1" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialChart history={state.history} teams={state.teams} metric="revenue" height={220} />
          </CardContent>
        </Card>
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-3" />
              ROE Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialChart history={state.history} teams={state.teams} metric="roe" height={220} />
          </CardContent>
        </Card>
      </div>

      {/* ── Active team round summary ── */}
      {playerResult && (
        <Card className="apex-card mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: activeTeam.color }}
              />
              {activeTeam.name} — Round {state.currentRound} Performance
            </CardTitle>
            <CardDescription className="text-xs">
              Per-product breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto apex-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                    <th className="py-2 pr-4 font-medium">Product</th>
                    <th className="py-2 pr-4 font-medium">Segment</th>
                    <th className="py-2 pr-4 font-medium text-right">Price</th>
                    <th className="py-2 pr-4 font-medium text-right">Units Sold</th>
                    <th className="py-2 pr-4 font-medium text-right">Revenue</th>
                    <th className="py-2 pr-4 font-medium text-right">Share</th>
                    <th className="py-2 pr-4 font-medium text-right">Inventory</th>
                    <th className="py-2 pr-4 font-medium text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {playerResult.products.map((p) => (
                    <tr key={p.productId} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{p.productName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{SEGMENT_LABELS[p.segment]}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{fmtPrice(p.price)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(p.unitsSold)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{fmtMoney(p.revenue)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{fmtPct(p.marketShare)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(p.inventoryLeft)}</td>
                      <td className="py-2 pr-4 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "tabular-nums",
                            p.customerScore >= 60 ? "border-chart-1/40 text-chart-1" :
                            p.customerScore >= 40 ? "border-chart-2/40 text-chart-2" :
                            "border-chart-3/40 text-chart-3"
                          )}
                        >
                          {p.customerScore.toFixed(0)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/40">
              <StatBlock label="Net Profit" value={fmtMoney(playerResult.metrics.netProfit)} tone={playerResult.metrics.netProfit >= 0 ? "good" : "bad"} />
              <StatBlock label="Cash" value={fmtMoney(playerResult.balance.cash)} tone={playerResult.balance.cash > 1000 ? "good" : "bad"} />
              <StatBlock label="ROE" value={fmtPct(playerResult.metrics.roe)} tone={playerResult.metrics.roe >= 0 ? "good" : "bad"} />
              <StatBlock label="Bankruptcy Risk" value={fmtPct(playerResult.metrics.bankruptcyRisk, 0)} tone={playerResult.metrics.bankruptcyRisk > 50 ? "bad" : "good"} />
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setView("dashboard")}>
                Back to Dashboard
              </Button>
              {canProcessRound && (
                <Button onClick={processNextRound} size="sm" className="gap-2 apex-glow">
                  <Zap className="h-4 w-4" />
                  Process Round {state.currentRound + 1}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =====================================================
// Sub-components
// =====================================================

function StatBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "good" && "text-chart-1",
          tone === "bad" && "text-chart-3",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}
