"use client";

/**
 * ApexStrategy Enterprise — Operations View
 * Plant capacity, automation, production scheduling, plus
 * Operations-specific investments: lean manufacturing
 * (waste reduction) and supplier reliability (stockout reduction).
 *
 * Originally "Production" — renamed to Operations to reflect
 * the broader MBA Operations Management scope.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Factory,
  Cpu,
  Package,
  Gauge,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Wand2,
  Boxes,
  CheckCircle2,
  Scissors,
  Truck,
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
import { fmtNum, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  traditional: "Traditional",
  low_end: "Low End",
  high_end: "High End",
  performance: "Performance",
  size: "Size",
};

export function OperationsView() {
  const { state, activeTeamId, draftDecisions, updateProductDecision, resetDraftToDefaults, importDecisionFromAI, toast } = useGame();
  const { fmtMoney: fmtCurrency, fmtPrice: fmtCurrencyPrice } = useCurrency();

  const activeTeam = state?.teams.find((t) => t.id === activeTeamId) ?? state?.teams[0];
  const teamProducts = state?.products.filter((p) => p.teamId === activeTeam?.id) ?? [];
  const draft = (activeTeam && state) ? (draftDecisions[activeTeam.id] ?? buildDefaultDraftDecisions(state, activeTeam.id)) : null;

  const proforma = React.useMemo(
    () => (state && activeTeam && draft) ? computeLiveProforma(state, activeTeam.id, draft) : null,
    [state, activeTeam, draft]
  );

  if (!state || !activeTeam || !draft || !proforma) return null;

  // Aggregate production stats
  const totalCapacity = teamProducts.reduce((s, p) => s + p.capacity, 0);
  const totalScheduled = draft.productDecisions.reduce((s, d) => s + d.production, 0);
  const totalInventory = teamProducts.reduce((s, p) => s + p.inventory, 0);
  const totalAvailable = totalCapacity + totalInventory;
  const utilization = totalCapacity > 0 ? (totalScheduled / totalCapacity) * 100 : 0;

  // Operations investments
  const totalLean = draft.productDecisions.reduce((s, d) => s + d.leanInvestment, 0);
  const totalSupplier = draft.productDecisions.reduce((s, d) => s + d.supplierInvestment, 0);
  const totalOpsSpend = totalLean + totalSupplier;

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
            <Factory className="h-6 w-6 text-primary" />
            Operations &amp; Supply Chain
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule production, expand capacity, invest in lean manufacturing &amp; supplier reliability for {activeTeam.name}.
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
        <SummaryCard label="Total Capacity" value={fmtNum(totalCapacity)} sub={`${teamProducts.length} product lines`} icon={<Boxes className="h-4 w-4" />} color="#06b6d4" />
        <SummaryCard label="Production Scheduled" value={fmtNum(totalScheduled)} sub={`${utilization.toFixed(0)}% utilization`} icon={<Factory className="h-4 w-4" />} color={utilization > 100 ? "#ef4444" : utilization > 85 ? "#f59e0b" : "#10b981"} />
        <SummaryCard label="Inventory on Hand" value={fmtNum(totalInventory)} sub="units in warehouse" icon={<Package className="h-4 w-4" />} color="#a855f7" />
        <SummaryCard label="Ops Investment" value={fmtCurrency(totalOpsSpend)} sub={`Lean ${fmtCurrency(totalLean)} · Supplier ${fmtCurrency(totalSupplier)}`} icon={<Scissors className="h-4 w-4" />} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: per-product operations card */}
        <div className="lg:col-span-2 space-y-3">
          {teamProducts.map((p) => {
            const decision = draft.productDecisions.find((d) => d.productId === p.id)!;
            const seg = state.segments.find((s) => s.id === p.segment)!;
            const projection = proforma.productProjections.find((pr) => pr.productId === p.id);
            const available = p.capacity + p.inventory;
            const utilizationPct = p.capacity > 0 ? (decision.production / p.capacity) * 100 : 0;
            const projectedDemand = projection?.projectedUnitsSold ?? 0;
            const stockOutRisk = projection?.stockOutRisk ?? false;
            const excess = available > projectedDemand * 1.3 && projectedDemand > 0;
            const leanBoost = Math.min(0.12, decision.leanInvestment / 5000);

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
                        Capacity {fmtNum(p.capacity)} · Automation {p.automation.toFixed(1)}/10 ·
                        Inventory {fmtNum(p.inventory)}
                      </CardDescription>
                    </div>
                    {stockOutRisk ? (
                      <Badge variant="outline" className="text-chart-3 border-chart-3/40 text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Stock-Out Risk
                      </Badge>
                    ) : excess ? (
                      <Badge variant="outline" className="text-chart-2 border-chart-2/40 text-[10px]">
                        Excess Inventory
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-chart-1 border-chart-1/40 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Balanced
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Production schedule */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Factory className="h-3.5 w-3.5" />
                        Production Schedule
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="50"
                          min="0"
                          value={decision.production}
                          onChange={(e) =>
                            updateProductDecision(activeTeam.id, p.id, {
                              production: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">units</span>
                      </div>
                      <Slider
                        value={[decision.production]}
                        min={0}
                        max={Math.round(p.capacity * 1.5)}
                        step={50}
                        onValueChange={(v) =>
                          updateProductDecision(activeTeam.id, p.id, { production: v[0] })
                        }
                      />
                      {/* Utilization bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">Capacity Utilization</span>
                          <span
                            className={cn(
                              "tabular-nums font-medium",
                              utilizationPct > 100 ? "text-chart-3" :
                              utilizationPct > 85 ? "text-chart-2" : "text-chart-1"
                            )}
                          >
                            {utilizationPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              utilizationPct > 100 ? "bg-chart-3" :
                              utilizationPct > 85 ? "bg-chart-2" : "bg-chart-1"
                            )}
                            style={{ width: `${Math.min(100, utilizationPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Operations investments: Lean + Supplier */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Scissors className="h-3.5 w-3.5" />
                        Lean Manufacturing (Waste Reduction)
                      </Label>
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        value={decision.leanInvestment}
                        onChange={(e) =>
                          updateProductDecision(activeTeam.id, p.id, {
                            leanInvestment: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="tabular-nums"
                      />
                      <div className="text-[11px] text-chart-1">
                        Material waste reduction: -{(leanBoost * 100).toFixed(1)}% (max -12%)
                      </div>

                      <Label className="text-xs font-medium flex items-center gap-1.5 mt-2">
                        <Truck className="h-3.5 w-3.5" />
                        Supplier Reliability
                      </Label>
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        value={decision.supplierInvestment}
                        onChange={(e) =>
                          updateProductDecision(activeTeam.id, p.id, {
                            supplierInvestment: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="tabular-nums"
                      />
                      <div className="text-[11px] text-muted-foreground">
                        Reduces stock-out risk and quality defects
                      </div>
                    </div>
                  </div>

                  {/* Capacity & automation investments (existing) */}
                  <div className="grid sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5" />
                        Capacity Investment
                      </Label>
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        value={decision.capacityInvestment}
                        onChange={(e) =>
                          updateProductDecision(activeTeam.id, p.id, {
                            capacityInvestment: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="tabular-nums"
                      />
                      <div className="text-[11px] text-muted-foreground">
                        Adds {fmtNum(decision.capacityInvestment * 0.2)} units (₹500/unit)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5" />
                        Automation Investment
                      </Label>
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        value={decision.automationInvestment}
                        onChange={(e) =>
                          updateProductDecision(activeTeam.id, p.id, {
                            automationInvestment: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="tabular-nums"
                      />
                      <div className="text-[11px] text-muted-foreground">
                        +{(decision.automationInvestment / 4000).toFixed(2)} automation levels (₹4K/level)
                      </div>
                    </div>
                  </div>

                  {/* Production projection row */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/40 text-xs">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Available</div>
                      <div className="font-semibold tabular-nums">{fmtNum(available)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Demand</div>
                      <div className="font-semibold tabular-nums">{fmtNum(projectedDemand)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Unit Cost</div>
                      <div className="font-semibold tabular-nums">{fmtCurrencyPrice(p.unitCost)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Seg. Demand</div>
                      <div className="font-semibold tabular-nums">{fmtNum(seg.totalDemand)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right: live summary panel */}
        <div className="space-y-4">
          <Card className="apex-card sticky top-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Operations Impact
              </CardTitle>
              <CardDescription className="text-xs">
                Projected operational outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Total Scheduled" value={fmtNum(totalScheduled)} />
              <SummaryRow label="Total Available" value={fmtNum(totalAvailable)} />
              <SummaryRow
                label="Utilization"
                value={fmtPct(utilization)}
                tone={utilization > 100 ? "bad" : utilization > 85 ? "warn" : "good"}
              />
              <SummaryRow label="Lean Investment" value={fmtCurrency(totalLean)} tone="good" />
              <SummaryRow label="Supplier Investment" value={fmtCurrency(totalSupplier)} tone="good" />
              <SummaryRow
                label="Stock-Out Risk Products"
                value={`${proforma.productProjections.filter((p) => p.stockOutRisk).length} / ${teamProducts.length}`}
                tone={proforma.productProjections.some((p) => p.stockOutRisk) ? "bad" : "good"}
              />

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

              <Separator />

              {/* Capacity utilization per product */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Per-Product Utilization
                </div>
                <div className="space-y-1.5">
                  {teamProducts.map((p) => {
                    const decision = draft.productDecisions.find((d) => d.productId === p.id)!;
                    const util = p.capacity > 0 ? (decision.production / p.capacity) * 100 : 0;
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-medium">{p.name}</span>
                          <span
                            className={cn(
                              "tabular-nums",
                              util > 100 ? "text-chart-3" : util > 85 ? "text-chart-2" : "text-chart-1"
                            )}
                          >
                            {util.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              util > 100 ? "bg-chart-3" : util > 85 ? "bg-chart-2" : "bg-chart-1"
                            )}
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast("Operations decisions auto-saved", "success")}
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
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
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
      <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
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
  tone?: "good" | "bad" | "warn" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "good" && "text-chart-1",
          tone === "bad" && "text-chart-3",
          tone === "warn" && "text-chart-2",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
