"use client";

/**
 * ApexStrategy Enterprise — Dashboard View
 * Executive Command Center: KPI scorecards, quick alerts,
 * mini-trends, and the latest round summary.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  AlertTriangle,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Building,
  Zap,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useGame } from "@/context/GameContext";
import { useCurrency } from "@/context/CurrencyContext";
import { FinancialChart } from "@/components/charts/FinancialChart";
import { MarketShareChart } from "@/components/charts/MarketShareChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtPct, fmtPrice, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GameAlert } from "@/types/game";

export function DashboardView() {
  const { state, activeTeamId, setView, processNextRound, canProcessRound } = useGame();
  const { fmtMoney, fmtPrice: fmtCurrencyPrice } = useCurrency();
  if (!state) return null;

  const activeTeam = state.teams.find((t) => t.id === activeTeamId) ?? state.teams[0];
  const latest = state.history[state.history.length - 1];
  const prev = state.history[state.history.length - 2];
  const teamResult = latest?.teamResults.find((r) => r.teamId === activeTeam.id);
  const prevResult = prev?.teamResults.find((r) => r.teamId === activeTeam.id);

  if (!teamResult || !latest) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12">
        <div className="text-center py-20">
          <div className="grid place-items-center h-16 w-16 rounded-2xl bg-primary/15 text-primary mx-auto mb-4">
            <Zap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Ready to begin</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            You&apos;re all set up. Head to R&amp;D, Marketing, Production, or Finance to
            make your decisions for Round 1, then click Process Next Round.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => setView("rnd")}>Start with R&D</Button>
            <Button variant="outline" onClick={() => setView("finance")}>
              Review Finance
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const m = teamResult.metrics;
  const prevM = prevResult?.metrics;
  const deltas = {
    revenue: prevM ? m.revenue - prevM.revenue : 0,
    netProfit: prevM ? m.netProfit - prevM.netProfit : 0,
    stockPrice: prevM ? m.stockPrice - prevM.stockPrice : 0,
    marketShare: prevM ? m.marketShare - prevM.marketShare : 0,
    roe: prevM ? m.roe - prevM.roe : 0,
  };

  // Active alerts for this team
  const teamAlerts = (teamResult.alerts ?? []).slice(0, 6);

  // Leaderboard (sorted by stock price)
  const leaderboard = [...state.teams]
    .map((t) => {
      const tr = latest.teamResults.find((r) => r.teamId === t.id);
      return { team: t, result: tr };
    })
    .sort((a, b) => (b.result?.metrics.stockPrice ?? 0) - (a.result?.metrics.stockPrice ?? 0));

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: activeTeam.color }}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeTeam.name} — Command Center
            </h1>
            {activeTeam.isPlayer && (
              <Badge variant="secondary" className="text-[10px]">YOUR TEAM</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Round {state.currentRound} of {state.maxRounds} ·
            {" "}{state.status === "completed" ? "Simulation Complete" : "Simulation Active"}
          </p>
        </div>
        {canProcessRound && (
          <Button onClick={processNextRound} size="sm" className="gap-2 apex-glow">
            <Zap className="h-4 w-4" />
            Process Round {state.currentRound + 1}
          </Button>
        )}
      </motion.div>

      {/* ── KPI scorecards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Scorecard
          label="Revenue"
          value={fmtMoney(m.revenue)}
          delta={deltas.revenue}
          deltaLabel={prevM ? fmtMoney(deltas.revenue) : "—"}
          icon={<DollarSign className="h-4 w-4" />}
          color="#10b981"
          onClick={() => setView("finance")}
        />
        <Scorecard
          label="Net Profit"
          value={fmtMoney(m.netProfit)}
          delta={deltas.netProfit}
          deltaLabel={prevM ? fmtMoney(deltas.netProfit) : "—"}
          icon={<Coins className="h-4 w-4" />}
          color={m.netProfit >= 0 ? "#06b6d4" : "#ef4444"}
          onClick={() => setView("finance")}
        />
        <Scorecard
          label="Stock Price"
          value={fmtCurrencyPrice(m.stockPrice)}
          delta={deltas.stockPrice}
          deltaLabel={prevM ? `${deltas.stockPrice >= 0 ? "+" : "-"}${fmtCurrencyPrice(Math.abs(deltas.stockPrice))}` : "—"}
          icon={<TrendingUp className="h-4 w-4" />}
          color="#a855f7"
          onClick={() => setView("results")}
        />
        <Scorecard
          label="Market Share"
          value={fmtPct(m.marketShare)}
          delta={deltas.marketShare}
          deltaLabel={prevM ? `${deltas.marketShare >= 0 ? "+" : ""}${deltas.marketShare.toFixed(1)}pp` : "—"}
          icon={<Percent className="h-4 w-4" />}
          color="#f59e0b"
          onClick={() => setView("results")}
        />
        <Scorecard
          label="ROE"
          value={fmtPct(m.roe)}
          delta={deltas.roe}
          deltaLabel={prevM ? `${deltas.roe >= 0 ? "+" : ""}${deltas.roe.toFixed(1)}pp` : "—"}
          icon={<Activity className="h-4 w-4" />}
          color={m.roe >= 0 ? "#10b981" : "#ef4444"}
          onClick={() => setView("finance")}
        />
      </div>

      {/* ── Main grid: charts + alerts + leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left col: financial trend */}
        <Card className="apex-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Financial Performance Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Revenue, net profit &amp; cash across all rounds
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setView("finance")}>
                View details
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FinancialChart
              history={state.history}
              teams={[activeTeam]}
              metric="revenue"
              height={180}
            />
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
              <MiniMetric
                label="Cash"
                value={fmtMoney(teamResult.balance.cash)}
                tone={teamResult.balance.cash > 1000 ? "good" : "bad"}
              />
              <MiniMetric
                label="Total Assets"
                value={fmtMoney(teamResult.balance.totalAssets)}
                tone="neutral"
              />
              <MiniMetric
                label="Bankruptcy Risk"
                value={fmtPct(m.bankruptcyRisk, 0)}
                tone={m.bankruptcyRisk > 50 ? "bad" : m.bankruptcyRisk > 25 ? "warn" : "good"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right col: alerts */}
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-2" />
              Alerts &amp; Notifications
            </CardTitle>
            <CardDescription className="text-xs">
              {teamAlerts.length} active for {activeTeam.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[260px] overflow-y-auto apex-scroll pr-1">
              {teamAlerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  All clear — no alerts.
                </div>
              ) : (
                teamAlerts.map((a) => <AlertItem key={a.id} alert={a} />)
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard (left col, lower) */}
        <Card className="apex-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-2" />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked by current stock price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map(({ team, result }, idx) => {
                const isActive = team.id === activeTeam.id;
                const stock = result?.metrics.stockPrice ?? 0;
                const netProfit = result?.metrics.netProfit ?? 0;
                return (
                  <div
                    key={team.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border border-transparent",
                      isActive ? "bg-accent/30 border-border/60" : "hover:bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "grid place-items-center h-7 w-7 rounded-md text-xs font-bold",
                        idx === 0 ? "bg-chart-2/20 text-chart-2" :
                        idx === 1 ? "bg-foreground/10 text-foreground" :
                        idx === 2 ? "bg-chart-3/20 text-chart-3" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: team.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{team.name}</span>
                        {team.isPlayer && (
                          <Badge variant="secondary" className="text-[9px] h-4 py-0">YOU</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        NP: {fmtMoney(netProfit)} · Share: {fmtPct(result?.metrics.marketShare ?? 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums text-sm">{fmtCurrencyPrice(stock)}</div>
                      <div className="text-[10px] text-muted-foreground">stock</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Market share pie (right col, lower) */}
        <Card className="apex-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-chart-4" />
              Market Share
            </CardTitle>
            <CardDescription className="text-xs">Units sold across all segments</CardDescription>
          </CardHeader>
          <CardContent>
            <MarketShareChart state={state} variant="pie" height={220} />
          </CardContent>
        </Card>
      </div>

      {/* ── Product portfolio snapshot ── */}
      <Card className="apex-card mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Product Portfolio — Round {state.currentRound}
          </CardTitle>
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
                {teamResult.products.map((p) => (
                  <tr key={p.productId} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-2 pr-4 font-medium">{p.productName}</td>
                    <td className="py-2 pr-4 capitalize text-muted-foreground">{p.segment.replace("_", " ")}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{fmtCurrencyPrice(p.price)}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// Sub-components
// =====================================================

function Scorecard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  const isUp = delta > 0;
  const isDown = delta < 0;
  return (
    <motion.button
      onClick={onClick}
      className="apex-card apex-card-hover relative overflow-hidden text-left p-4 apex-stat-bar"
      style={{ ["--stat-color" as string]: color }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div
          className="grid place-items-center h-6 w-6 rounded-md"
          style={{ background: `${color}22`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums tracking-tight">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        {isUp ? (
          <ArrowUpRight className="h-3 w-3 text-chart-1" />
        ) : isDown ? (
          <ArrowDownRight className="h-3 w-3 text-chart-3" />
        ) : null}
        <span
          className={cn(
            "text-[11px] tabular-nums",
            isUp ? "text-chart-1" : isDown ? "text-chart-3" : "text-muted-foreground"
          )}
        >
          {deltaLabel}
        </span>
        {isUp && <span className="text-[10px] text-muted-foreground">vs prev round</span>}
      </div>
    </motion.button>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "warn" | "neutral";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "good" && "text-chart-1",
          tone === "bad" && "text-chart-3",
          tone === "warn" && "text-chart-2",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function AlertItem({ alert }: { alert: GameAlert }) {
  const cfg = {
    info: { icon: <Info className="h-4 w-4" />, color: "text-chart-4", bg: "bg-chart-4/10" },
    success: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-chart-1", bg: "bg-chart-1/10" },
    warning: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-chart-2", bg: "bg-chart-2/10" },
    critical: { icon: <AlertCircle className="h-4 w-4" />, color: "text-chart-3", bg: "bg-chart-3/10" },
  }[alert.severity];

  return (
    <div className="flex gap-2.5 p-2.5 rounded-lg border border-border/40 bg-card/40">
      <div className={cn("grid place-items-center h-6 w-6 rounded-md shrink-0", cfg.bg, cfg.color)}>
        {cfg.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium mb-0.5">{alert.title}</div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          {alert.message}
        </div>
      </div>
    </div>
  );
}
