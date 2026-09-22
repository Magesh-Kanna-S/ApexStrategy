"use client";

/**
 * ApexStrategy Enterprise — HR View
 * Manage human capital: compensation, training, benefits,
 * hiring, performance bonuses. Affects productivity, turnover,
 * and unit cost.
 *
 * Math: training reduces unit cost (productivity boost),
 * compensation increases labor cost, performance bonus gives
 * short-term productivity lift, benefits reduce turnover cost.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  GraduationCap,
  HeartHandshake,
  UserPlus,
  Award,
  RotateCcw,
  Wand2,
  TrendingUp,
  Gauge,
  AlertTriangle,
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
import { computeLiveProforma, computeUnitCost } from "@/engine/simulationEngine";
import { fmtMoney, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HrView() {
  const { state, activeTeamId, draftDecisions, updateHrDecision, resetDraftToDefaults, importDecisionFromAI, toast } = useGame();
  const { fmtMoney: fmtCurrency } = useCurrency();

  const activeTeam = state?.teams.find((t) => t.id === activeTeamId) ?? state?.teams[0];
  const draft = (activeTeam && state) ? (draftDecisions[activeTeam.id] ?? buildDefaultDraftDecisions(state, activeTeam.id)) : null;

  const proforma = React.useMemo(
    () => (state && activeTeam && draft) ? computeLiveProforma(state, activeTeam.id, draft) : null,
    [state, activeTeam, draft]
  );

  if (!state || !activeTeam || !draft || !proforma) return null;

  const hr = draft.hr;
  const teamProducts = state.products.filter((p) => p.teamId === activeTeam.id);

  // HR total spend (excluding compensation uplift which is embedded in COGS)
  const hrDirectSpend =
    hr.trainingInvestment + hr.benefitsInvestment + hr.hiringInvestment + hr.performanceBonus;

  // Productivity boost: training + bonus
  const trainingBoost = Math.min(0.15, hr.trainingInvestment / 4000);
  const bonusBoost = Math.min(0.08, hr.performanceBonus / 4000);
  const totalProductivityBoost = (trainingBoost + bonusBoost) * 100;

  // Compensation uplift impact (added to labor cost)
  const compUpliftPct = ((hr.compensationIndex - 1) * 100);

  // Estimate turnover risk
  const benefitsImpact = Math.min(0.20, hr.benefitsInvestment / 3000); // up to 20% reduction
  const compImpact = Math.max(0, (hr.compensationIndex - 1) * 0.5); // higher comp reduces turnover
  const turnoverRisk = Math.max(5, 25 - benefitsImpact * 25 - compImpact * 20);

  // Sample unit cost comparison (first product)
  const sampleProduct = teamProducts[0];
  const sampleDecision = draft.productDecisions.find((d) => d.productId === sampleProduct?.id);
  const baseUnitCost = sampleProduct ? computeUnitCost(sampleProduct, sampleDecision) : 0;
  const withHrUnitCost = sampleProduct ? computeUnitCost(sampleProduct, sampleDecision, hr, sampleDecision) : 0;
  const unitCostSavings = baseUnitCost - withHrUnitCost;

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
            <Users className="h-6 w-6 text-primary" />
            Human Resources
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage talent for {activeTeam.name}. Training boosts productivity; benefits cut turnover.
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
        <SummaryCard label="HR Direct Spend" value={fmtCurrency(hrDirectSpend)} icon={<Wallet className="h-4 w-4" />} color="#a855f7" />
        <SummaryCard label="Productivity Boost" value={`+${totalProductivityBoost.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} color="#10b981" />
        <SummaryCard label="Compensation Index" value={hr.compensationIndex.toFixed(2)} sub={`${compUpliftPct >= 0 ? "+" : ""}${compUpliftPct.toFixed(1)}% vs market`} icon={<Gauge className="h-4 w-4" />} color="#06b6d4" />
        <SummaryCard label="Turnover Risk" value={`${turnoverRisk.toFixed(0)}%`} icon={<AlertTriangle className="h-4 w-4" />} color={turnoverRisk > 18 ? "#ef4444" : turnoverRisk > 12 ? "#f59e0b" : "#10b981"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: HR decisions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Compensation */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                Compensation Policy
              </CardTitle>
              <CardDescription className="text-xs">
                Pay above market to attract &amp; retain talent — but it raises your labor cost.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-[1fr_2fr] gap-4 items-center">
                <div>
                  <Label className="text-xs font-medium mb-2 block">
                    Compensation Index
                  </Label>
                  <div className="text-3xl font-bold tabular-nums mb-1">
                    {hr.compensationIndex.toFixed(2)}
                  </div>
                  <div className={cn(
                    "text-xs",
                    compUpliftPct > 0 ? "text-chart-3" : compUpliftPct < 0 ? "text-chart-1" : "text-muted-foreground"
                  )}>
                    {compUpliftPct > 0 ? "+" : ""}{compUpliftPct.toFixed(1)}% vs market rate
                  </div>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[hr.compensationIndex * 100]}
                    min={80}
                    max={130}
                    step={1}
                    onValueChange={(v) => updateHrDecision(activeTeam.id, { compensationIndex: v[0] / 100 })}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0.80 (20% below)</span>
                    <span>1.00 (market)</span>
                    <span>1.30 (30% above)</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button size="sm" variant="outline" onClick={() => updateHrDecision(activeTeam.id, { compensationIndex: 0.95 })}>
                      Below Market
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateHrDecision(activeTeam.id, { compensationIndex: 1.0 })}>
                      Market
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateHrDecision(activeTeam.id, { compensationIndex: 1.1 })}>
                      Above Market
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment decisions */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-chart-5" />
                HR Investments
              </CardTitle>
              <CardDescription className="text-xs">
                Training, benefits, hiring, and performance bonuses — all in ₹000s.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup
                  label="Training Investment"
                  hint="₹000s · Boosts productivity (max -15% unit cost)"
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={hr.trainingInvestment}
                    onChange={(e) => updateHrDecision(activeTeam.id, { trainingInvestment: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[hr.trainingInvestment]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateHrDecision(activeTeam.id, { trainingInvestment: v[0] })}
                  />
                  <div className="text-[11px] text-chart-1 mt-1">
                    Productivity: +{(trainingBoost * 100).toFixed(1)}%
                  </div>
                </FieldGroup>

                <FieldGroup
                  label="Benefits & Wellness"
                  hint="₹000s · Reduces turnover risk (max -20%)"
                  icon={<HeartHandshake className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={hr.benefitsInvestment}
                    onChange={(e) => updateHrDecision(activeTeam.id, { benefitsInvestment: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[hr.benefitsInvestment]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateHrDecision(activeTeam.id, { benefitsInvestment: v[0] })}
                  />
                  <div className="text-[11px] text-chart-1 mt-1">
                    Turnover reduction: -{(benefitsImpact * 100).toFixed(1)}%
                  </div>
                </FieldGroup>

                <FieldGroup
                  label="Hiring Investment"
                  hint="₹000s · Supports capacity expansion"
                  icon={<UserPlus className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={hr.hiringInvestment}
                    onChange={(e) => updateHrDecision(activeTeam.id, { hiringInvestment: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[hr.hiringInvestment]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateHrDecision(activeTeam.id, { hiringInvestment: v[0] })}
                  />
                </FieldGroup>

                <FieldGroup
                  label="Performance Bonus Pool"
                  hint="₹000s · Short-term productivity boost (max -8% unit cost)"
                  icon={<Award className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={hr.performanceBonus}
                    onChange={(e) => updateHrDecision(activeTeam.id, { performanceBonus: parseInt(e.target.value, 10) || 0 })}
                    className="tabular-nums"
                  />
                  <Slider
                    value={[hr.performanceBonus]}
                    min={0}
                    max={5000}
                    step={100}
                    onValueChange={(v) => updateHrDecision(activeTeam.id, { performanceBonus: v[0] })}
                  />
                  <div className="text-[11px] text-chart-1 mt-1">
                    Bonus boost: +{(bonusBoost * 100).toFixed(1)}%
                  </div>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* Unit cost impact card */}
          {sampleProduct && (
            <Card className="apex-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-chart-4" />
                  Unit Cost Impact — {sampleProduct.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Sample product showing HR&apos;s effect on production cost
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Without HR</div>
                    <div className="text-lg font-bold tabular-nums">{fmtCurrency(baseUnitCost * 1000)}</div>
                    <div className="text-[10px] text-muted-foreground">per unit</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">With HR</div>
                    <div className="text-lg font-bold tabular-nums">{fmtCurrency(withHrUnitCost * 1000)}</div>
                    <div className="text-[10px] text-muted-foreground">per unit</div>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border",
                    unitCostSavings > 0 ? "bg-chart-1/10 border-chart-1/30" : "bg-chart-3/10 border-chart-3/30"
                  )}>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Savings</div>
                    <div className={cn(
                      "text-lg font-bold tabular-nums",
                      unitCostSavings > 0 ? "text-chart-1" : "text-chart-3"
                    )}>
                      {fmtCurrency(unitCostSavings * 1000)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">per unit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: live impact panel */}
        <div className="space-y-4">
          <Card className="apex-card sticky top-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                HR Impact
              </CardTitle>
              <CardDescription className="text-xs">
                Projected outcomes from your HR policy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="HR Direct Spend" value={fmtCurrency(hrDirectSpend)} />
              <SummaryRow label="Productivity Boost" value={`+${totalProductivityBoost.toFixed(1)}%`} tone="good" />
              <SummaryRow label="Turnover Risk" value={`${turnoverRisk.toFixed(0)}%`} tone={turnoverRisk > 18 ? "bad" : "good"} />

              <Separator />

              <SummaryRow label="Projected Revenue" value={fmtCurrency(proforma.projectedRevenue)} tone="good" />
              <SummaryRow
                label="Projected Net Profit"
                value={fmtCurrency(proforma.projectedNetProfit)}
                tone={proforma.projectedNetProfit >= 0 ? "good" : "bad"}
              />
              <SummaryRow
                label="Projected Cash"
                value={fmtCurrency(proforma.projectedCash)}
                tone={proforma.projectedCash > 1000 ? "good" : "bad"}
              />
              <SummaryRow label="Projected Margin" value={fmtPct(proforma.projectedMargin)} />

              {totalProductivityBoost > 5 && (
                <div className="text-[11px] text-chart-1 leading-relaxed p-2 rounded bg-chart-1/5 border border-chart-1/20">
                  Strong productivity boost. Training &amp; bonuses are cutting your unit costs — that
                  compounds across all your products.
                </div>
              )}

              <Separator />

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast("HR decisions auto-saved", "success")}
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
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
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
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
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
