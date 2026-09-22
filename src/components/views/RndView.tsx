"use client";

/**
 * ApexStrategy Enterprise — R&D View
 * Set product specs: price, MTBF, positioning, R&D investment,
 * automation, capacity. Shows a live proforma impact panel
 * that updates instantly as the user changes any input.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Target,
  Gauge,
  MapPin,
  Sparkles,
  Cpu,
  Factory,
  RotateCcw,
  Wand2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useGame, buildDefaultDraftDecisions } from "@/context/GameContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { computeLiveProforma, computeUnitCost, SIM_EMERGENCY_LOAN_RATE } from "@/engine/simulationEngine";
import { fmtMoney, fmtPrice, fmtPct, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  traditional: "Traditional",
  low_end: "Low End",
  high_end: "High End",
  performance: "Performance",
  size: "Size",
};

export function RndView() {
  const { state, activeTeamId, draftDecisions, updateProductDecision, resetDraftToDefaults, importDecisionFromAI, toast } = useGame();

  const [selectedId, setSelectedId] = React.useState<string>("");

  const activeTeam = state?.teams.find((t) => t.id === activeTeamId) ?? state?.teams[0];
  const teamProducts = state?.products.filter((p) => p.teamId === activeTeam?.id) ?? [];
  const draft = (activeTeam && state) ? (draftDecisions[activeTeam.id] ?? buildDefaultDraftDecisions(state, activeTeam.id)) : null;

  // Live proforma for the whole team's draft
  const proforma = React.useMemo(
    () => (state && activeTeam && draft) ? computeLiveProforma(state, activeTeam.id, draft) : null,
    [state, activeTeam, draft]
  );

  if (!state || !activeTeam || !draft || !proforma) return null;

  // Resolve the selected product (fall back to first)
  const resolvedSelectedId = selectedId && teamProducts.some((p) => p.id === selectedId)
    ? selectedId
    : teamProducts[0]?.id ?? "";
  const selectedProduct = teamProducts.find((p) => p.id === resolvedSelectedId) ?? teamProducts[0];
  if (!selectedProduct) return null;
  const decision = draft.productDecisions.find((d) => d.productId === selectedProduct.id)!;
  const segment = state.segments.find((s) => s.id === selectedProduct.segment)!;

  // Per-product projected demand for the selected product
  const selectedProjection = proforma.productProjections.find(
    (p) => p.productId === selectedProduct.id
  );

  // Update helpers
  const setField = (field: keyof typeof decision, value: number | { x: number; y: number }) => {
    updateProductDecision(activeTeam.id, selectedProduct.id, { [field]: value } as any);
  };

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
            <FlaskConical className="h-6 w-6 text-primary" />
            R&amp;D &amp; Product Strategy
          </h1>
          <p className="text-sm text-muted-foreground">
            Tuning specs, price, and R&amp;D investments for {activeTeam.name}.
            Live proforma updates as you edit.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: product selector + form ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product selector tabs */}
          <div className="flex flex-wrap gap-2">
            {teamProducts.map((p) => {
              const isActive = p.id === selectedProduct.id;
              const seg = state.segments.find((s) => s.id === p.segment)!;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    isActive
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border/60 bg-card/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: activeTeam.color }}
                  />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-60">
                    {SEGMENT_LABELS[p.segment]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Spec form */}
          <Card className="apex-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {selectedProduct.name} — Specifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {SEGMENT_LABELS[selectedProduct.segment]} segment ·
                    Ideal price {fmtPrice(segment.idealPrice)} ·
                    Ideal MTBF {fmtNum(segment.idealMtbf)}h
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Age {selectedProduct.age.toFixed(1)}y
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Price */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldGroup
                  label="Unit Price"
                  hint={`Ideal: ${fmtPrice(segment.idealPrice)} · Current unit cost: ${fmtPrice(computeUnitCost(selectedProduct, decision))}`}
                  icon={<Target className="h-3.5 w-3.5" />}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={decision.price}
                      onChange={(e) => setField("price", parseFloat(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">per unit</span>
                  </div>
                  <GaugeBar
                    value={decision.price}
                    min={segment.idealPrice * 0.5}
                    max={segment.idealPrice * 1.5}
                    ideal={segment.idealPrice}
                    format={fmtPrice}
                  />
                </FieldGroup>

                {/* MTBF */}
                <FieldGroup
                  label="MTBF Target"
                  hint={`Ideal: ${fmtNum(segment.idealMtbf)}h · Higher = better quality, higher cost`}
                  icon={<Gauge className="h-3.5 w-3.5" />}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="500"
                      min="5000"
                      max="35000"
                      value={decision.mtbf}
                      onChange={(e) => setField("mtbf", parseInt(e.target.value, 10) || 0)}
                      className="tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">hours</span>
                  </div>
                  <GaugeBar
                    value={decision.mtbf}
                    min={5000}
                    max={35000}
                    ideal={segment.idealMtbf}
                    format={(v) => `${fmtNum(v)}h`}
                  />
                </FieldGroup>
              </div>

              <Separator />

              {/* Positioning map */}
              <FieldGroup
                label="Positioning (Perceptual Map)"
                hint="Move toward the segment's ideal position. R&D investment shifts your product toward target."
                icon={<MapPin className="h-3.5 w-3.5" />}
              >
                <div className="grid sm:grid-cols-[1fr_200px] gap-4 items-start">
                  <PositioningMap
                    current={selectedProduct.position}
                    target={decision.position}
                    ideal={segment.idealPosition}
                  />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Target X
                      </Label>
                      <Slider
                        value={[decision.position.x]}
                        min={0}
                        max={10}
                        step={0.1}
                        onValueChange={(v) => setField("position", { ...decision.position, x: v[0] })}
                      />
                      <div className="text-xs tabular-nums mt-1">{decision.position.x.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Target Y
                      </Label>
                      <Slider
                        value={[decision.position.y]}
                        min={0}
                        max={10}
                        step={0.1}
                        onValueChange={(v) => setField("position", { ...decision.position, y: v[0] })}
                      />
                      <div className="text-xs tabular-nums mt-1">{decision.position.y.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </FieldGroup>

              <Separator />

              {/* Investment inputs */}
              <div className="grid sm:grid-cols-3 gap-4">
                <FieldGroup
                  label="R&D Investment"
                  hint="$000s · Drives position & MTBF improvements"
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={decision.rndInvestment}
                    onChange={(e) => setField("rndInvestment", parseInt(e.target.value, 10) || 0)}
                    className="tabular-nums"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Current level: {selectedProduct.rndLevel.toFixed(0)}/100
                  </div>
                </FieldGroup>
                <FieldGroup
                  label="Automation Investment"
                  hint="$000s · Lowers labor cost long-term"
                  icon={<Cpu className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={decision.automationInvestment}
                    onChange={(e) => setField("automationInvestment", parseInt(e.target.value, 10) || 0)}
                    className="tabular-nums"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Current level: {selectedProduct.automation.toFixed(1)}/10
                  </div>
                </FieldGroup>
                <FieldGroup
                  label="Capacity Investment"
                  hint="$000s · $500 adds 100 units capacity"
                  icon={<Factory className="h-3.5 w-3.5" />}
                >
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={decision.capacityInvestment}
                    onChange={(e) => setField("capacityInvestment", parseInt(e.target.value, 10) || 0)}
                    className="tabular-nums"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Current cap: {fmtNum(selectedProduct.capacity)} units
                  </div>
                </FieldGroup>
              </div>

              {/* Production schedule (also here for convenience) */}
              <Separator />
              <FieldGroup
                label="Production Schedule"
                hint={`Capacity: ${fmtNum(selectedProduct.capacity)} units · Inventory: ${fmtNum(selectedProduct.inventory)} units`}
                icon={<Factory className="h-3.5 w-3.5" />}
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="50"
                    min="0"
                    value={decision.production}
                    onChange={(e) => setField("production", parseInt(e.target.value, 10) || 0)}
                    className="tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">units</span>
                  {decision.production > selectedProduct.capacity && (
                    <Badge variant="outline" className="text-chart-3 border-chart-3/40 text-[10px]">
                      Over capacity
                    </Badge>
                  )}
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: live proforma panel ── */}
        <div className="space-y-4">
          <Card className="apex-card sticky top-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Live Proforma
              </CardTitle>
              <CardDescription className="text-xs">
                Projected impact if you submit these decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProformaRow label="Projected Revenue" value={fmtMoney(proforma.projectedRevenue)} tone="good" />
              <ProformaRow label="Projected Net Profit" value={fmtMoney(proforma.projectedNetProfit)} tone={proforma.projectedNetProfit >= 0 ? "good" : "bad"} />
              <ProformaRow label="Projected Margin" value={fmtPct(proforma.projectedMargin)} />
              <ProformaRow label="Projected Cash" value={fmtMoney(proforma.projectedCash)} tone={proforma.projectedCash > 1000 ? "good" : "bad"} />
              <ProformaRow label="Projected ROE" value={fmtPct(proforma.projectedRoe)} />
              <ProformaRow label="Projected Stock" value={fmtPrice(proforma.projectedStockPrice)} tone="good" />

              <Separator />

              {/* Emergency loan risk */}
              <div className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg border",
                proforma.emergencyLoanRisk >= 60 ? "border-chart-3/40 bg-chart-3/10" :
                proforma.emergencyLoanRisk >= 30 ? "border-chart-2/40 bg-chart-2/10" :
                "border-chart-1/40 bg-chart-1/10"
              )}>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  proforma.emergencyLoanRisk >= 60 ? "text-chart-3" :
                  proforma.emergencyLoanRisk >= 30 ? "text-chart-2" :
                  "text-chart-1"
                )} />
                <div className="flex-1">
                  <div className="text-xs font-medium">
                    Emergency Loan Risk
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {proforma.emergencyLoanRisk >= 60 ? "Critical — cash will go negative" :
                     proforma.emergencyLoanRisk >= 30 ? "Elevated — monitor cash position" :
                     "Low — cash position looks healthy"}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "tabular-nums",
                    proforma.emergencyLoanRisk >= 60 ? "border-chart-3/40 text-chart-3" :
                    proforma.emergencyLoanRisk >= 30 ? "border-chart-2/40 text-chart-2" :
                    "border-chart-1/40 text-chart-1"
                  )}
                >
                  {proforma.emergencyLoanRisk}%
                </Badge>
              </div>

              {proforma.emergencyLoanRisk >= 60 && (
                <div className="text-[11px] text-chart-3 leading-relaxed p-2 rounded bg-chart-3/5">
                  ⚠ If cash drops below zero, Big Al&apos;s lender will issue an emergency
                  loan at {(SIM_EMERGENCY_LOAN_RATE * 100).toFixed(1)}% APR — that&apos;s
                  punitive. Consider cutting production or issuing short-term debt in Finance.
                </div>
              )}

              {/* Selected product projection */}
              <Separator />
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {selectedProduct.name} Projection
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Units Sold</div>
                    <div className="font-semibold tabular-nums">
                      {selectedProjection ? fmtNum(selectedProjection.projectedUnitsSold) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Revenue</div>
                    <div className="font-semibold tabular-nums">
                      {selectedProjection ? fmtMoney(selectedProjection.projectedRevenue) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Gross Margin</div>
                    <div className={cn(
                      "font-semibold tabular-nums",
                      (selectedProjection?.projectedGrossMargin ?? 0) >= 0 ? "text-chart-1" : "text-chart-3"
                    )}>
                      {selectedProjection ? fmtMoney(selectedProjection.projectedGrossMargin) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Stock-Out Risk</div>
                    <div className={cn(
                      "font-semibold",
                      selectedProjection?.stockOutRisk ? "text-chart-3" : "text-chart-1"
                    )}>
                      {selectedProjection?.stockOutRisk ? "Yes — under-supplied" : "No"}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast("Decisions auto-saved · Click Process Next Round to commit", "success")}
              >
                Decisions are auto-saved
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

function GaugeBar({
  value,
  min,
  max,
  ideal,
  format,
}: {
  value: number;
  min: number;
  max: number;
  ideal: number;
  format: (v: number) => string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const idealPct = Math.max(0, Math.min(100, ((ideal - min) / (max - min)) * 100));
  return (
    <div className="relative h-2 rounded-full bg-muted overflow-hidden mt-2">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 to-primary"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute inset-y-0 w-0.5 bg-chart-2"
        style={{ left: `${idealPct}%` }}
        title={`Ideal: ${format(ideal)}`}
      />
    </div>
  );
}

function PositioningMap({
  current,
  target,
  ideal,
}: {
  current: { x: number; y: number };
  target: { x: number; y: number };
  ideal: { x: number; y: number };
}) {
  // Map 0-10 coordinates to 0-100% on the chart (y is inverted)
  const toPct = (v: number) => `${(v / 10) * 100}%`;
  const toPctY = (v: number) => `${100 - (v / 10) * 100}%`;
  return (
    <div className="relative aspect-square w-full max-w-[280px] rounded-lg border border-border/60 bg-card overflow-hidden">
      {/* Grid lines */}
      {[2, 4, 6, 8].map((g) => (
        <React.Fragment key={g}>
          <div
            className="absolute h-px bg-border/40 w-full"
            style={{ top: toPctY(g) }}
          />
          <div
            className="absolute w-px bg-border/40 h-full"
            style={{ left: toPct(g) }}
          />
        </React.Fragment>
      ))}
      {/* Ideal */}
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-chart-2 bg-chart-2/30"
        style={{ left: toPct(ideal.x), top: toPctY(ideal.y) }}
        title="Segment ideal"
      />
      {/* Current */}
      <div
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/60"
        style={{ left: toPct(current.x), top: toPctY(current.y) }}
        title="Current position"
      />
      {/* Target */}
      <div
        className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-primary/30"
        style={{ left: toPct(target.x), top: toPctY(target.y) }}
        title="Target position"
      />
      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-[9px]">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-2 border border-chart-2" />
          <span className="text-muted-foreground">Ideal</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
          <span className="text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">Target</span>
        </div>
      </div>
    </div>
  );
}

function ProformaRow({
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
