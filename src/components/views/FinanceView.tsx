"use client";

/**
 * ApexStrategy Enterprise — Finance View
 * Live Proforma Income Statement, Balance Sheet, Cash Flow.
 * Issue short/long-term debt, issue equity, set dividends.
 * Shows projected cash & emergency loan risk in real time.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  Percent,
  AlertTriangle,
  RotateCcw,
  Wand2,
  FileText,
  Scale,
  Wallet,
} from "lucide-react";
import { useGame, buildDefaultDraftDecisions } from "@/context/GameContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { computeLiveProforma, SIM_SHARES_OUTSTANDING, SIM_EMERGENCY_LOAN_RATE } from "@/engine/simulationEngine";
import { fmtMoney, fmtPrice, fmtPct, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FinanceView() {
  const { state, activeTeamId, draftDecisions, updateFinanceDecision, resetDraftToDefaults, importDecisionFromAI, toast } = useGame();

  const activeTeam = state?.teams.find((t) => t.id === activeTeamId) ?? state?.teams[0];
  const draft = (activeTeam && state) ? (draftDecisions[activeTeam.id] ?? buildDefaultDraftDecisions(state, activeTeam.id)) : null;

  // Latest balance sheet for carry-forward display
  const lastEntry = state?.history[state.history.length - 1];
  const lastResult = lastEntry?.teamResults.find((r) => r.teamId === activeTeam?.id);
  const lastBalance = lastResult?.balance;
  const lastMetrics = lastResult?.metrics;

  const proforma = React.useMemo(
    () => (state && activeTeam && draft) ? computeLiveProforma(state, activeTeam.id, draft) : null,
    [state, activeTeam, draft]
  );

  if (!state || !activeTeam || !draft || !proforma) return null;

  // Projected next-round balance sheet (approximate)
  const projectedBalance = {
    cash: Math.max(0, proforma.projectedCash),
    shortTermDebt: (lastBalance?.shortTermDebt ?? 0) + draft.finance.shortTermDebt,
    longTermDebt: (lastBalance?.longTermDebt ?? 6000) + draft.finance.longTermDebt,
    commonStock: (lastBalance?.commonStock ?? 10000) + draft.finance.equityIssue,
    emergencyLoan: proforma.projectedCash < 0 ? Math.abs(proforma.projectedCash) : 0,
  };
  const projectedInterest =
    projectedBalance.shortTermDebt * 0.08 +
    projectedBalance.longTermDebt * 0.10 +
    projectedBalance.emergencyLoan * SIM_EMERGENCY_LOAN_RATE;

  // Shares & EPS
  const shares = SIM_SHARES_OUTSTANDING;
  const eps = proforma.projectedNetProfit / shares;
  const projectedDividendTotal = draft.finance.dividendPerShare * shares;
  const dividendPayoutRatio = proforma.projectedNetProfit > 0
    ? (projectedDividendTotal / proforma.projectedNetProfit) * 100
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
            <Landmark className="h-6 w-6 text-primary" />
            Finance &amp; Capital Structure
          </h1>
          <p className="text-sm text-muted-foreground">
            Live proforma statements and capital decisions for {activeTeam.name}.
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

      {/* ── Top KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Projected Cash"
          value={fmtMoney(proforma.projectedCash)}
          tone={proforma.projectedCash > 1000 ? "good" : "bad"}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Projected Net Profit"
          value={fmtMoney(proforma.projectedNetProfit)}
          tone={proforma.projectedNetProfit >= 0 ? "good" : "bad"}
          icon={<Coins className="h-4 w-4" />}
        />
        <KpiCard
          label="Projected EPS"
          value={fmtPrice(eps)}
          tone={eps >= 0 ? "good" : "bad"}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Stock Price (proj.)"
          value={fmtPrice(proforma.projectedStockPrice)}
          tone="good"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left + center: statements ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Capital decisions */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Capital Decisions
              </CardTitle>
              <CardDescription className="text-xs">
                Issue debt, raise equity, or pay dividends. All in $000s.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FieldInput
                  label="Short-Term Debt"
                  hint="Issue (+) or repay (-). 8% APR."
                  value={draft.finance.shortTermDebt}
                  onChange={(v) => updateFinanceDecision(activeTeam.id, { shortTermDebt: v })}
                />
                <FieldInput
                  label="Long-Term Debt"
                  hint="Issue new long-term bonds. 10% APR."
                  value={draft.finance.longTermDebt}
                  onChange={(v) => updateFinanceDecision(activeTeam.id, { longTermDebt: v })}
                />
                <FieldInput
                  label="Equity Issue"
                  hint="Dilutive — raises cash, no interest."
                  value={draft.finance.equityIssue}
                  onChange={(v) => updateFinanceDecision(activeTeam.id, { equityIssue: v })}
                />
                <FieldInput
                  label="Dividend / Share"
                  hint={`$ per share × ${fmtNum(shares)} shares`}
                  value={draft.finance.dividendPerShare}
                  onChange={(v) => updateFinanceDecision(activeTeam.id, { dividendPerShare: v })}
                  step={0.1}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/40">
                <Stat label="Total Dividend" value={fmtMoney(projectedDividendTotal)} />
                <Stat label="Payout Ratio" value={fmtPct(dividendPayoutRatio, 0)} />
                <Stat label="Proj. Interest Expense" value={fmtMoney(projectedInterest)} tone="bad" />
                <Stat label="Proj. Emergency Loan" value={fmtMoney(projectedBalance.emergencyLoan)} tone={projectedBalance.emergencyLoan > 0 ? "bad" : "neutral"} />
              </div>
            </CardContent>
          </Card>

          {/* Proforma Income Statement */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-4" />
                Proforma Income Statement
              </CardTitle>
              <CardDescription className="text-xs">
                Projected for next round · all values in $000s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatementRow label="Revenue" value={fmtMoney(proforma.projectedRevenue)} bold />
              <StatementRow label="Cost of Goods Sold" value={`(${fmtMoney(proforma.projectedRevenue * 0.6)})`} tone="bad" indent />
              <StatementRow
                label="Gross Margin"
                value={fmtMoney(proforma.projectedRevenue * 0.4)}
                bold
                separator
              />
              <StatementRow label="R&D Expense" value={`(${fmtMoney(draft.productDecisions.reduce((s, d) => s + d.rndInvestment + d.automationInvestment * 0.5, 0))})`} tone="bad" indent />
              <StatementRow label="Marketing Expense" value={`(${fmtMoney(draft.productDecisions.reduce((s, d) => s + d.promoBudget, 0))})`} tone="bad" indent />
              <StatementRow label="Sales Expense" value={`(${fmtMoney(draft.productDecisions.reduce((s, d) => s + d.salesBudget, 0))})`} tone="bad" indent />
              <StatementRow label="Admin & Overhead" value={`(${fmtMoney(1500 + proforma.projectedRevenue * 0.02)})`} tone="bad" indent />
              <StatementRow label="Depreciation" value={`(${fmtMoney(((lastBalance?.plantAndEquipment ?? 18000) + draft.productDecisions.reduce((s, d) => s + d.automationInvestment + d.capacityInvestment, 0)) / 15)})`} tone="bad" indent />
              <StatementRow
                label="Operating Profit"
                value={fmtMoney(proforma.projectedNetProfit + projectedInterest)}
                bold
                separator
                tone={proforma.projectedNetProfit + projectedInterest >= 0 ? "good" : "bad"}
              />
              <StatementRow label="Interest Expense" value={`(${fmtMoney(projectedInterest)})`} tone="bad" indent />
              <StatementRow label="Tax (25%)" value={`(${fmtMoney(Math.max(0, proforma.projectedNetProfit) * 0.25)})`} tone="bad" indent />
              <StatementRow
                label="Net Profit"
                value={fmtMoney(proforma.projectedNetProfit)}
                bold
                separator
                tone={proforma.projectedNetProfit >= 0 ? "good" : "bad"}
              />
              <StatementRow
                label="Net Margin"
                value={fmtPct(proforma.projectedMargin)}
                tone={proforma.projectedMargin >= 0 ? "good" : "bad"}
              />
            </CardContent>
          </Card>

          {/* Proforma Balance Sheet */}
          <Card className="apex-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-chart-3" />
                Proforma Balance Sheet
              </CardTitle>
              <CardDescription className="text-xs">
                Projected position · all values in $000s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Assets</div>
                  <StatementRow label="Cash" value={fmtMoney(projectedBalance.cash)} indent />
                  <StatementRow label="Accounts Receivable" value={fmtMoney(proforma.projectedRevenue * (30 / 360))} indent />
                  <StatementRow label="Inventory" value={fmtMoney(lastBalance?.inventory ?? 0)} indent />
                  <StatementRow label="Plant & Equipment" value={fmtMoney((lastBalance?.plantAndEquipment ?? 18000) + draft.productDecisions.reduce((s, d) => s + d.automationInvestment + d.capacityInvestment, 0))} indent />
                  <StatementRow label="Accum. Depreciation" value={`(${fmtMoney((lastBalance?.accumulatedDepreciation ?? 0) + ((lastBalance?.plantAndEquipment ?? 18000) / 15))})`} indent tone="bad" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Liabilities & Equity</div>
                  <StatementRow label="Accounts Payable" value={fmtMoney(proforma.projectedRevenue * 0.6 * (30 / 360))} indent />
                  <StatementRow label="Short-Term Debt" value={fmtMoney(projectedBalance.shortTermDebt)} indent />
                  <StatementRow label="Long-Term Debt" value={fmtMoney(projectedBalance.longTermDebt)} indent />
                  {projectedBalance.emergencyLoan > 0 && (
                    <StatementRow label="Emergency Loan" value={fmtMoney(projectedBalance.emergencyLoan)} indent tone="bad" />
                  )}
                  <StatementRow label="Common Stock" value={fmtMoney(projectedBalance.commonStock)} indent />
                  <StatementRow label="Retained Earnings" value={fmtMoney((lastBalance?.retainedEarnings ?? 0) + proforma.projectedNetProfit - projectedDividendTotal)} indent />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: live cash & risk panel ── */}
        <div className="space-y-4">
          <Card className="apex-card sticky top-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Cash &amp; Risk Monitor
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time cash projection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Big cash number */}
              <div className="text-center py-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Projected Cash
                </div>
                <div
                  className={cn(
                    "text-3xl font-bold tabular-nums",
                    proforma.projectedCash > 1000 ? "text-chart-1" :
                    proforma.projectedCash > 0 ? "text-chart-2" : "text-chart-3"
                  )}
                >
                  {fmtMoney(proforma.projectedCash)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  End of next round
                </div>
              </div>

              <Separator />

              {/* Emergency loan warning */}
              <div className={cn(
                "flex items-start gap-2 p-2.5 rounded-lg border",
                proforma.emergencyLoanRisk >= 60 ? "border-chart-3/40 bg-chart-3/10" :
                proforma.emergencyLoanRisk >= 30 ? "border-chart-2/40 bg-chart-2/10" :
                "border-chart-1/40 bg-chart-1/10"
              )}>
                <AlertTriangle className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  proforma.emergencyLoanRisk >= 60 ? "text-chart-3" :
                  proforma.emergencyLoanRisk >= 30 ? "text-chart-2" : "text-chart-1"
                )} />
                <div className="flex-1">
                  <div className="text-xs font-medium">
                    Emergency Loan Risk: {proforma.emergencyLoanRisk}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {proforma.emergencyLoanRisk >= 60
                      ? `Critical — projected to need a ${(SIM_EMERGENCY_LOAN_RATE * 100).toFixed(1)}% APR emergency loan. Cut production or issue debt now.`
                      : proforma.emergencyLoanRisk >= 30
                      ? "Elevated — cash will be tight. Consider short-term financing."
                      : "Healthy — cash position looks safe."}
                  </div>
                </div>
              </div>

              <SummaryRow
                label="Current Cash"
                value={fmtMoney(lastBalance?.cash ?? 0)}
              />
              <SummaryRow
                label="Current Short-Term Debt"
                value={fmtMoney(lastBalance?.shortTermDebt ?? 0)}
              />
              <SummaryRow
                label="Current Long-Term Debt"
                value={fmtMoney(lastBalance?.longTermDebt ?? 0)}
              />
              <SummaryRow
                label="Current Stock Price"
                value={fmtPrice(lastMetrics?.stockPrice ?? 25)}
                tone="good"
              />
              <SummaryRow
                label="Current ROE"
                value={fmtPct(lastMetrics?.roe ?? 0)}
                tone={(lastMetrics?.roe ?? 0) >= 0 ? "good" : "bad"}
              />

              <Separator />

              {/* Quick capital actions */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Quick Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const shortfall = Math.max(0, 2000 - proforma.projectedCash);
                      if (shortfall > 0) {
                        updateFinanceDecision(activeTeam.id, { shortTermDebt: shortfall });
                        toast(`Added ${fmtMoney(shortfall)} short-term debt to cover shortfall`, "success");
                      } else {
                        toast("Cash position is healthy — no action needed", "default");
                      }
                    }}
                  >
                    Cover Cash Shortfall
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateFinanceDecision(activeTeam.id, { dividendPerShare: 0 });
                      toast("Dividends cleared to conserve cash", "default");
                    }}
                  >
                    Cut Dividends
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast("Finance decisions auto-saved", "success")}
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

function KpiCard({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
  icon: React.ReactNode;
}) {
  const color = tone === "good" ? "#10b981" : tone === "bad" ? "#ef4444" : "#a855f7";
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
      <div
        className={cn(
          "text-xl font-bold tabular-nums",
          tone === "good" && "text-chart-1",
          tone === "bad" && "text-chart-3",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </div>
    </motion.div>
  );
}

function FieldInput({
  label,
  hint,
  value,
  onChange,
  step = 100,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">$000s</span>
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">{hint}</div>
    </div>
  );
}

function StatementRow({
  label,
  value,
  indent,
  bold,
  separator,
  tone = "neutral",
}: {
  label: string;
  value: string;
  indent?: boolean;
  bold?: boolean;
  separator?: boolean;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1 text-sm",
        separator && "border-t border-border/40 mt-1 pt-2",
        indent && "pl-3"
      )}
    >
      <span className={cn("text-muted-foreground", bold && "text-foreground font-medium")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold && "font-bold",
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

function Stat({
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

// Suppress unused import warning for TrendingDown
void TrendingDown;
void Percent;
