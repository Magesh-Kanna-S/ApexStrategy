"use client";

/**
 * ApexStrategy Enterprise — Marketing View
 * Allocate promo budgets (drives brand awareness) and
 * sales force budgets (drives customer accessibility)
 * across each product. Live proforma panel shows
 * projected demand lift & ROI on marketing spend.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Users,
  Radio,
  TrendingUp,
  RotateCcw,
  Wand2,
  Eye,
  Footprints,
  DollarSign,
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
import { fmtPct, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  traditional: "Traditional",
  low_end: "Low End",
  high_end: "High End",
  performance: "Performance",
  size: "Size",
};

export function MarketingView() {
  const { state, activeTeamId, draftDecisions, updateProductDecision, resetDraftToDefaults, importDecisionFromAI, toast } = useGame();
  const { fmtMoney } = useCurrency();

  const activeTeam = state?.teams.find((t) => t.id === activeTeamId) ?? state?.teams[0];
  const teamProducts = state?.products.filter((p) => p.teamId === activeTeam?.id) ?? [];
  const draft = (activeTeam && state) ? (draftDecisions[activeTeam.id] ?? buildDefaultDraftDecisions(state, activeTeam.id)) : null;

  const proforma = React.useMemo(
    () => (state && activeTeam && draft) ? computeLiveProforma(state, activeTeam.id, draft) : null,
    [state, activeTeam, draft]
  );

  if (!state || !activeTeam || !draft || !proforma) return null;

  const totalPromo = draft.productDecisions.reduce((s, d) => s + d.promoBudget, 0);
  const totalSales = draft.productDecisions.reduce((s, d) => s + d.salesBudget, 0);
  const totalMarketing = totalPromo + totalSales;
  const projectedRevenue = proforma.projectedRevenue;
  const marketingROI = totalMarketing > 0
    ? (projectedRevenue - totalMarketing) / totalMarketing
    : 0;

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
            <Megaphone className="h-6 w-6 text-primary" />
            Marketing &amp; Sales
          </h1>
          <p className="text-sm text-muted-foreground">
            Allocate promo and sales force budgets to drive awareness &amp; accessibility for {activeTeam.name}.
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

      {/* ── Top summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Total Marketing Spend"
          value={fmtMoney(totalMarketing)}
          icon={<DollarSign className="h-4 w-4" />}
          color="#f59e0b"
        />
        <SummaryCard
          label="Promo Budget"
          value={fmtMoney(totalPromo)}
          icon={<Radio className="h-4 w-4" />}
          color="#06b6d4"
        />
        <SummaryCard
          label="Sales Force"
          value={fmtMoney(totalSales)}
          icon={<Users className="h-4 w-4" />}
          color="#a855f7"
        />
        <SummaryCard
          label="Marketing ROI"
          value={`${marketingROI.toFixed(1)}x`}
          icon={<TrendingUp className="h-4 w-4" />}
          color={marketingROI >= 5 ? "#10b981" : marketingROI >= 2 ? "#f59e0b" : "#ef4444"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: per-product marketing form ── */}
        <div className="lg:col-span-2 space-y-3">
          {teamProducts.map((p) => {
            const decision = draft.productDecisions.find((d) => d.productId === p.id)!;
            const seg = state.segments.find((s) => s.id === p.segment)!;
            const projection = proforma.productProjections.find((pr) => pr.productId === p.id);

            // Projected awareness & accessibility after this round
            const projectedAwareness = Math.max(0, Math.min(100,
              p.awareness * 0.65 + Math.sqrt(decision.promoBudget / 3) * 18
            ));
            const projectedAccessibility = Math.max(0, Math.min(100,
              p.accessibility * 0.65 + Math.sqrt(decision.salesBudget / 2) * 20
            ));

            return (
              <Card key={p.id} className="apex-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: activeTeam.color }}
                        />
                        {p.name}
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {SEGMENT_LABELS[p.segment]}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Ideal price {fmtMoney(seg.idealPrice)} · Segment demand {fmtNum(seg.totalDemand)} units
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Promo Budget */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5" />
                        Promo Budget (Awareness)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="50"
                          min="0"
                          value={decision.promoBudget}
                          onChange={(e) =>
                            updateProductDecision(activeTeam.id, p.id, {
                              promoBudget: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">₹000s</span>
                      </div>
                      <Slider
                        value={[decision.promoBudget]}
                        min={0}
                        max={5000}
                        step={50}
                        onValueChange={(v) =>
                          updateProductDecision(activeTeam.id, p.id, { promoBudget: v[0] })
                        }
                      />
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          Awareness: {p.awareness.toFixed(0)} →{" "}
                          <span className="text-chart-1 font-semibold">
                            {projectedAwareness.toFixed(0)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">Max 100</span>
                      </div>
                    </div>

                    {/* Sales Force Budget */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Sales Force (Accessibility)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="50"
                          min="0"
                          value={decision.salesBudget}
                          onChange={(e) =>
                            updateProductDecision(activeTeam.id, p.id, {
                              salesBudget: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">₹000s</span>
                      </div>
                      <Slider
                        value={[decision.salesBudget]}
                        min={0}
                        max={5000}
                        step={50}
                        onValueChange={(v) =>
                          updateProductDecision(activeTeam.id, p.id, { salesBudget: v[0] })
                        }
                      />
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Footprints className="h-3 w-3" />
                          Access: {p.accessibility.toFixed(0)} →{" "}
                          <span className="text-chart-1 font-semibold">
                            {projectedAccessibility.toFixed(0)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">Max 100</span>
                      </div>
                    </div>
                  </div>

                  {projection && (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
                      <ProjectionMini label="Units Sold" value={fmtNum(projection.projectedUnitsSold)} />
                      <ProjectionMini label="Revenue" value={fmtMoney(projection.projectedRevenue)} />
                      <ProjectionMini
                        label="GM"
                        value={fmtMoney(projection.projectedGrossMargin)}
                        tone={(projection.projectedGrossMargin ?? 0) >= 0 ? "good" : "bad"}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Right: live summary panel ── */}
        <div className="space-y-4">
          <Card className="apex-card sticky top-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Marketing Impact Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Projected outcome if you submit these budgets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Total Marketing Spend" value={fmtMoney(totalMarketing)} />
              <SummaryRow label="Projected Revenue" value={fmtMoney(proforma.projectedRevenue)} tone="good" />
              <SummaryRow label="Projected Net Profit" value={fmtMoney(proforma.projectedNetProfit)} tone={proforma.projectedNetProfit >= 0 ? "good" : "bad"} />
              <SummaryRow label="Marketing % of Revenue" value={proforma.projectedRevenue > 0 ? fmtPct((totalMarketing / proforma.projectedRevenue) * 100) : "—"} />
              <SummaryRow label="Marketing ROI" value={`${marketingROI.toFixed(2)}x`} tone={marketingROI >= 3 ? "good" : "bad"} />

              <Separator />

              {/* Marketing mix chart */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Marketing Mix by Product
                </div>
                <div className="space-y-1.5">
                  {teamProducts.map((p) => {
                    const decision = draft.productDecisions.find((d) => d.productId === p.id)!;
                    const total = decision.promoBudget + decision.salesBudget;
                    const promoPct = total > 0 ? (decision.promoBudget / total) * 100 : 0;
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {fmtMoney(total)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                          <div className="bg-chart-4" style={{ width: `${promoPct}%` }} />
                          <div className="bg-chart-5" style={{ width: `${100 - promoPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 text-[10px] pt-1">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-chart-4" />
                    <span className="text-muted-foreground">Promo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-chart-5" />
                    <span className="text-muted-foreground">Sales</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast("Marketing budgets auto-saved", "success")}
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

function ProjectionMini({
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
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
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
