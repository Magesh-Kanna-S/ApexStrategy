"use client";

/**
 * ApexStrategy Enterprise — Strategy View
 * Set corporate direction: focus segments, ESG investment,
 * R&D pipeline, strategic alliances, brand-building.
 *
 * These decisions feed into the engine by giving a focus-
 * segment bonus (+8% attractiveness) and ESG/alliance boosts.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Target,
  Sprout,
  GitBranch,
  Sparkles,
  RotateCcw,
  Wand2,
  TrendingUp,
  Building2,
  Crown,
} from "lucide-react";
import { useGame, buildDefaultDraftDecisions } from "@/context/GameContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { computeLiveProforma } from "@/engine/simulationEngine";
import { fmtMoney, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SegmentId } from "@/types/game";

const SEGMENT_LABELS: Record<string, string> = {
  traditional: "Traditional",
  low_end: "Low End",
  high_end: "High End",
  performance: "Performance",
  size: "Size",
};

const ALL_SEGMENTS: SegmentId[] = ["traditional", "low_end", "high_end", "performance", "size"];

export function StrategyView() {
  const { state, activeTeamId, draftDecisions, updateStrategyDecision, resetDraftToDefaults, importDecisionFromAI, toast } = useGame();
  const { fmtMoney: fmtCurrency } = useCurrency();

  const activeTeam = state?.teams.find((t) => t.id === activeTeamId) ?? state?.teams[0];
  const draft = (activeTeam && state) ? (draftDecisions[activeTeam.id] ?? buildDefaultDraftDecisions(state, activeTeam.id)) : null;

  const proforma = React.useMemo(
    () => (state && activeTeam && draft) ? computeLiveProforma(state, activeTeam.id, draft) : null,
    [state, activeTeam, draft]
  );

  if (!state || !activeTeam || !draft || !proforma) return null;

  const strat = draft.strategy;
  const totalStrategySpend =
    strat.esgInvestment + strat.pipelineInvestment + strat.brandInvestment + strat.allianceTier * 200;

  const toggleFocusSegment = (seg: SegmentId) => {
    const current = strat.focusSegments;
    const newList = current.includes(seg)
      ? current.filter((s) => s !== seg)
      : [...current, seg];
    updateStrategyDecision(activeTeam.id, { focusSegments: newList });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            Corporate Strategy
          </h1>
          <p className="text-sm text-muted-foreground">
            Set strategic direction for {activeTeam.name}. Focus segments get +8% attractiveness boost.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => resetDraftToDefaults(activeTeam.id)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => importDecisionFromAI(activeTeam.id)}>
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            AI Suggest
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Strategy Spend" value={fmtCurrency(totalStrategySpend)} icon={<Compass className="h-4 w-4" />} color="#a855f7" />
        <SummaryCard label="Focus Segments" value={`${strat.focusSegments.length} / 5`} icon={<Target className="h-4 w-4" />} color="#10b981" />
        <SummaryCard label="Alliance Tier" value={strat.allianceTier === 0 ? "None" : strat.allianceTier === 1 ? "Basic" : "Advanced"} icon={<GitBranch className="h-4 w-4" />} color="#06b6d4" />
        <SummaryCard label="Attractiveness Boost" value={`+${(8 * strat.focusSegments.length + strat.allianceTier * 1.5).toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Strategy decisions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Focus segments */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Strategic Focus Segments
              </CardTitle>
              <CardDescription className="text-xs">
                Select up to 3 segments to prioritize. Each focused segment gets +8% attractiveness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ALL_SEGMENTS.map((seg) => {
                  const isFocused = strat.focusSegments.includes(seg);
                  const segData = state.segments.find((s) => s.id === seg)!;
                  return (
                    <button
                      key={seg}
                      onClick={() => toggleFocusSegment(seg)}
                      disabled={!isFocused && strat.focusSegments.length >= 3}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all",
                        isFocused
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/60 bg-card/50 hover:border-primary/30 text-muted-foreground hover:text-foreground",
                        !isFocused && strat.focusSegments.length >= 3 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-70">
                        {SEGMENT_LABELS[seg]}
                      </span>
                      <span className="text-xs font-semibold tabular-nums">
                        {fmtNumShort(segData.totalDemand)}
                      </span>
                      <span className="text-[9px] opacity-60">units demand</span>
                      {isFocused && (
                        <Badge variant="outline" className="text-[9px] mt-1 border-primary/40 text-primary">
                          +8% boost
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Investment decisions */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-chart-5" />
                Strategic Investments
              </CardTitle>
              <CardDescription className="text-xs">
                Long-term investments that build competitive moats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup
                  label="ESG / Sustainability Investment"
                  hint="₹000s · Small long-term attractiveness boost (max +4%)"
                  icon={<Sprout className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={strat.esgInvestment}
                    onChange={(e) => updateStrategyDecision(activeTeam.id, { esgInvestment: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[strat.esgInvestment]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateStrategyDecision(activeTeam.id, { esgInvestment: v[0] })}
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Current boost: +{(Math.min(0.04, strat.esgInvestment / 25000) * 100).toFixed(2)}%
                  </div>
                </FieldGroup>

                <FieldGroup
                  label="R&D Pipeline Investment"
                  hint="₹000s · Funds next-generation product development"
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={strat.pipelineInvestment}
                    onChange={(e) => updateStrategyDecision(activeTeam.id, { pipelineInvestment: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[strat.pipelineInvestment]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateStrategyDecision(activeTeam.id, { pipelineInvestment: v[0] })}
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Counts as R&D expense on P&L
                  </div>
                </FieldGroup>

                <FieldGroup
                  label="Brand-Building Investment"
                  hint="₹000s · Lifts awareness for all products"
                  icon={<Building2 className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={strat.brandInvestment}
                    onChange={(e) => updateStrategyDecision(activeTeam.id, { brandInvestment: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[strat.brandInvestment]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateStrategyDecision(activeTeam.id, { brandInvestment: v[0] })}
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Effective promo boost: {fmtCurrency(strat.brandInvestment / 5)}
                  </div>
                </FieldGroup>

                <FieldGroup
                  label="Strategic Alliance Tier"
                  hint="Tier 1 (₹200K) or Tier 2 (₹400K) · +1.5% / +3% boost"
                  icon={<GitBranch className="h-3.5 w-3.5" />}
                >
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => updateStrategyDecision(activeTeam.id, { allianceTier: tier })}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all",
                          strat.allianceTier === tier
                            ? "border-primary/60 bg-primary/10 text-foreground"
                            : "border-border/60 bg-card/50 hover:border-primary/30 text-muted-foreground"
                        )}
                      >
                        {tier === 0 ? <span>None</span> : tier === 1 ? (
                          <>
                            <Crown className="h-3.5 w-3.5" />
                            <span>Basic</span>
                          </>
                        ) : (
                          <>
                            <Crown className="h-3.5 w-3.5 text-chart-2" />
                            <span>Advanced</span>
                          </>
                        )}
                        <span className="text-[9px] opacity-70">
                          {tier === 0 ? "₹0" : tier === 1 ? "₹200K" : "₹400K"}
                        </span>
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: live impact panel */}
        <div className="space-y-4">
          <Card className="apex-card sticky top-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Strategy Impact
              </CardTitle>
              <CardDescription className="text-xs">
                Projected outcomes from your strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Total Strategy Spend" value={fmtCurrency(totalStrategySpend)} />
              <SummaryRow label="Focus Segment Boost" value={`+${(8 * strat.focusSegments.length).toFixed(0)}%`} tone="good" />
              <SummaryRow label="ESG Boost" value={`+${(Math.min(0.04, strat.esgInvestment / 25000) * 100).toFixed(2)}%`} tone="good" />
              <SummaryRow label="Alliance Boost" value={`+${(strat.allianceTier * 1.5).toFixed(1)}%`} tone="good" />

              <Separator />

              <SummaryRow label="Projected Revenue" value={fmtCurrency(proforma.projectedRevenue)} tone="good" />
              <SummaryRow
                label="Projected Net Profit"
                value={fmtCurrency(proforma.projectedNetProfit)}
                tone={proforma.projectedNetProfit >= 0 ? "good" : "bad"}
              />
              <SummaryRow label="Projected Margin" value={fmtPct(proforma.projectedMargin)} />
              <SummaryRow
                label="Projected Cash"
                value={fmtCurrency(proforma.projectedCash)}
                tone={proforma.projectedCash > 1000 ? "good" : "bad"}
              />
              <SummaryRow label="Projected ROE" value={fmtPct(proforma.projectedRoe)} />

              <Separator />

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast("Strategy decisions auto-saved", "success")}
              >
                Decisions auto-saved
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Sub-components
// =====================================================

function FieldGroup({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {children}
      {hint && (
        <div className="text-[11px] text-muted-foreground leading-relaxed">{hint}</div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="apex-card relative p-4 apex-stat-bar"
      style={{ ["--stat-color" as string]: color }}
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
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "good" && "text-chart-1",
          tone === "bad" && "text-chart-3",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function fmtNumShort(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
