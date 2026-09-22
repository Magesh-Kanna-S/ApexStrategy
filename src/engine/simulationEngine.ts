/**
 * ApexStrategy Enterprise — Simulation Engine
 * =====================================================
 * Client-side business simulation math. Runs entirely in
 * the browser. No server, no DB. Uses a weighted-attractiveness
 * demand model with full financial statements and integrated
 * Strategy, R&D, Marketing, Operations, HR, and Finance modules.
 *
 *  ┌────────────────────────────────────────────────┐
 *  │  DEMAND MODEL (weighted attractiveness)        │
 *  │  ──────────────────────────────────────────────│
 *  │   Price            35%   (lower price → ↑)     │
 *  │   Age/Positioning  25%   (closer to ideal → ↑) │
 *  │   R&D / MTBF       20%   (better quality → ↑)  │
 *  │   Marketing        20%   (awareness × access)   │
 *  └────────────────────────────────────────────────┘
 *
 *  Financials: Income Statement, Balance Sheet, Cash
 *  Flow, ROE, ROA, stock price = f(EPS, growth, risk).
 *  Emergency loan triggers automatically when cash<0.
 *
 *  All money values are in ₹000s unless noted.
 *  Author: ApexStrategy Labs
 */

import type {
  CashFlowStatement,
  DemandCalculation,
  FinanceDecision,
  FinancialMetrics,
  GameAlert,
  IncomeStatement,
  BalanceSheet,
  Product,
  ProductDecision,
  ProductRoundResult,
  RoundHistoryEntry,
  Segment,
  SegmentId,
  Team,
  TeamDecisions,
  TeamRoundResult,
  GameState,
} from "@/types/game";

// =====================================================
// Constants
// =====================================================

const TAX_RATE = 0.25; // 25% corporate tax
const EMERGENCY_LOAN_RATE = 0.225; // 22.5% penalty APR
const SHORT_TERM_RATE = 0.08; // 8% short-term APR
const LONG_TERM_RATE = 0.10; // 10% long-term APR
const INTEREST_INCOME_RATE = 0.04; // 4% on positive cash
const DEPRECIATION_YEARS = 15; // 15-year straight-line
const ADMIN_EXPENSE_BASE = 1500; // $1.5M admin baseline
const CARRYING_COST_PER_UNIT = 0.5; // $500/unit inventory carrying
const A_R_DAYS = 30; // accounts receivable days
const A_P_DAYS = 30; // accounts payable days
const SHARES_OUTSTANDING = 2000; // 2M shares outstanding
const BASE_MATERIAL_COST = 4.0; // $4,000 baseline material
const BASE_LABOR_COST = 6.0; // $6,000 baseline labor at automation=1

// Perceptual map drift per round (segments shift their ideal over time)
const POSITION_DRIFT = 0.7;

// =====================================================
// Seeding helpers
// =====================================================

export const SEGMENT_DEFAULTS: Record<SegmentId, Omit<Segment, "totalDemand" | "idealPrice" | "idealPosition" | "idealMtbf"> & {
  totalDemand: number;
  idealPrice: number;
  idealPosition: { x: number; y: number };
  idealMtbf: number;
}> = {
  traditional: {
    id: "traditional",
    name: "Traditional",
    totalDemand: 7000,
    growthRate: 0.095,
    idealPrice: 28,
    idealMtbf: 19000,
    idealPosition: { x: 5.0, y: 5.0 },
    priceSensitivity: 0.65,
  },
  low_end: {
    id: "low_end",
    name: "Low End",
    totalDemand: 11000,
    growthRate: 0.115,
    idealPrice: 21,
    idealMtbf: 12000,
    idealPosition: { x: 2.5, y: 2.5 },
    priceSensitivity: 0.85,
  },
  high_end: {
    id: "high_end",
    name: "High End",
    totalDemand: 5500,
    growthRate: 0.16,
    idealPrice: 38,
    idealMtbf: 26000,
    idealPosition: { x: 7.5, y: 7.5 },
    priceSensitivity: 0.45,
  },
  performance: {
    id: "performance",
    name: "Performance",
    totalDemand: 3500,
    growthRate: 0.22,
    idealPrice: 33,
    idealMtbf: 28000,
    idealPosition: { x: 9.0, y: 5.0 },
    priceSensitivity: 0.5,
  },
  size: {
    id: "size",
    name: "Size",
    totalDemand: 3500,
    growthRate: 0.18,
    idealPrice: 31,
    idealMtbf: 23000,
    idealPosition: { x: 5.0, y: 9.0 },
    priceSensitivity: 0.55,
  },
};

const TEAM_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899"];

// =====================================================
// Game Initialization (Round 0 snapshot)
// =====================================================

export function createDefaultTeams(): Team[] {
  return [
    {
      id: "team-apex",
      name: "Bharat Apex Industries",
      color: TEAM_COLORS[0],
      isPlayer: true,
      isAI: false,
      aiDifficulty: "medium",
    },
    {
      id: "team-vanguard",
      name: "Vanguard Maharaj Pvt Ltd",
      color: TEAM_COLORS[1],
      isPlayer: false,
      isAI: true,
      aiDifficulty: "medium",
    },
    {
      id: "team-helios",
      name: "Helios Bharat Systems",
      color: TEAM_COLORS[2],
      isPlayer: false,
      isAI: true,
      aiDifficulty: "medium",
    },
    {
      id: "team-novus",
      name: "Novus Dynamics India",
      color: TEAM_COLORS[3],
      isPlayer: false,
      isAI: true,
      aiDifficulty: "medium",
    },
  ];
}

export function createDefaultSegments(): Segment[] {
  return Object.values(SEGMENT_DEFAULTS).map((s) => ({ ...s }));
}

/**
 * Each team gets 1 product per segment (5 total).
 * Starts with sensible Round-0 defaults so the user can
 * immediately process Round 1 with zero setup.
 */
export function createDefaultProducts(teams: Team[]): Product[] {
  const products: Product[] = [];
  const segmentList = Object.values(SEGMENT_DEFAULTS);

  for (const team of teams) {
    for (const seg of segmentList) {
      // Use first letters of first two words for a brand-like prefix
      const words = team.name.split(/\s+/).filter(Boolean);
      const productPrefix = (words[0]?.[0] ?? "X") + (words[1]?.[0] ?? "X") + (words[2]?.[0] ?? "X");
      const productLetter = seg.id === "traditional" ? "T"
        : seg.id === "low_end" ? "L"
        : seg.id === "high_end" ? "H"
        : seg.id === "performance" ? "P"
        : "S";

      const automation = seg.id === "low_end" ? 6 : seg.id === "traditional" ? 5 : 3;
      const laborCost = BASE_LABOR_COST / (1 + (automation - 1) * 0.15);
      const materialCost = BASE_MATERIAL_COST + (seg.id === "high_end" ? 1.5 : seg.id === "performance" ? 2 : seg.id === "size" ? 1 : 0);
      const carryingCost = CARRYING_COST_PER_UNIT;

      products.push({
        id: `${team.id}-${seg.id}`,
        teamId: team.id,
        name: `${productPrefix}-${productLetter}`,
        segment: seg.id,
        position: { ...seg.idealPosition },
        mtbf: seg.idealMtbf,
        age: seg.id === "traditional" ? 1.5 : seg.id === "low_end" ? 2.0 : 0.5,
        price: seg.idealPrice,
        unitCost: materialCost + laborCost + carryingCost,
        materialCost,
        laborCost,
        carryingCost,
        rndLevel: 30,
        awareness: seg.id === "traditional" ? 45 : seg.id === "low_end" ? 35 : 25,
        accessibility: seg.id === "traditional" ? 50 : 40,
        inventory: 400,
        productionScheduled: 0,
        capacity: 1800,
        automation,
      });
    }
  }
  return products;
}

/**
 * Builds the initial Round 0 history entry — the snapshot
 * of the world before any decisions are processed.
 */
export function createRound0Snapshot(state: GameState): RoundHistoryEntry {
  const teamResults: TeamRoundResult[] = state.teams.map((team) => {
    const teamProducts = state.products.filter((p) => p.teamId === team.id);
    const revenue = teamProducts.reduce((s, p) => s + p.inventory * p.price, 0) * 0.0;
    const inventory = teamProducts.reduce((s, p) => s + p.inventory * p.unitCost, 0);

    const income: IncomeStatement = {
      revenue: 0,
      costOfGoodsSold: 0,
      grossMargin: 0,
      rndExpense: 0,
      marketingExpense: 0,
      salesExpense: 0,
      adminExpense: 0,
      depreciation: 0,
      operatingProfit: 0,
      interestExpense: 0,
      emergencyLoanInterest: 0,
      earningsBeforeTax: 0,
      tax: 0,
      netProfit: 0,
      netMargin: 0,
    };

    const balance: BalanceSheet = {
      cash: 8000,
      accountsReceivable: 0,
      inventory,
      totalCurrentAssets: 8000 + inventory,
      plantAndEquipment: 18000,
      accumulatedDepreciation: 0,
      totalAssets: 8000 + inventory + 18000,
      accountsPayable: 0,
      shortTermDebt: 0,
      longTermDebt: 6000,
      totalLiabilities: 6000,
      commonStock: 10000,
      retainedEarnings: 0,
      totalEquity: 10000 + (8000 + inventory + 18000 - 6000 - 10000),
    };

    const cashFlow: CashFlowStatement = {
      operationsCash: 0,
      investingCash: 0,
      financingCash: 0,
      netCashFlow: 0,
      beginningCash: 8000,
      endingCash: 8000,
      emergencyLoan: 0,
    };

    const metrics: FinancialMetrics = {
      revenue: 0,
      netProfit: 0,
      netMargin: 0,
      roe: 0,
      roa: 0,
      assetTurnover: 0,
      marketShare: 0,
      stockPrice: 25.0,
      marketCap: 25.0 * SHARES_OUTSTANDING,
      emergencyLoanTaken: false,
      emergencyLoanAmount: 0,
      bankruptcyRisk: 5,
    };

    const productResults: ProductRoundResult[] = teamProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      segment: p.segment,
      unitsSold: 0,
      inventoryLeft: p.inventory,
      revenue: 0,
      unitCost: p.unitCost,
      price: p.price,
      marketShare: 0,
      customerScore: 50,
      stockOut: false,
    }));

    return {
      teamId: team.id,
      round: 0,
      products: productResults,
      income,
      balance,
      cashFlow,
      metrics,
      alerts: [{
        id: `welcome-${team.id}`,
        severity: "info",
        title: "Welcome to ApexStrategy Enterprise",
        message: "Make decisions across R&D, Marketing, Production, and Finance, then process the next round.",
        teamId: team.id,
        category: "system",
      }],
    };
  });

  return {
    round: 0,
    teamResults,
    segmentSnapshots: state.segments.map((s) => ({ ...s })),
  };
}

// =====================================================
// Demand Calculation
// =====================================================

/**
 * Compute the attractiveness score (0-1) of a product within
 * its segment based on the weighted formula:
 *   Price (35%) + Age/Positioning (25%) + R&D/MTBF (20%) + Marketing (20%)
 *
 * Optional Strategy decision applies a focus-segment bonus (+10% per
 * focused segment) and brand-investment awareness lift.
 */
export function computeAttractiveness(
  product: Product,
  segment: Segment,
  decision: ProductDecision | undefined,
  strategy?: { focusSegments?: SegmentId[]; brandInvestment?: number; esgInvestment?: number; allianceTier?: number }
): { score: number; factors: DemandCalculation["factors"] } {
  const price = decision?.price ?? product.price;
  const mtbf = decision?.mtbf ?? product.mtbf;
  const position = decision?.position ?? product.position;
  let promoBudget = decision?.promoBudget ?? 0;
  const salesBudget = decision?.salesBudget ?? 0;

  // Strategy: brand investment adds to effective promo budget (lifts awareness)
  if (strategy?.brandInvestment) {
    promoBudget += strategy.brandInvestment / 5; // brand investment counts 20% as much as direct promo
  }

  // ── Price factor (35%) ───────────────────────────
  // Lower price → higher score. Score decays quadratically
  // from ideal price; we cap decay at 0%.
  const priceRatio = segment.idealPrice / Math.max(price, 1);
  const priceFactor = clamp01(priceRatio * 0.95 + 0.05); // small floor
  const priceScore = priceFactor * segment.priceSensitivity + priceFactor * (1 - segment.priceSensitivity) * 0.85;

  // ── Age / Positioning factor (25%) ───────────────
  // Distance from ideal position on perceptual map.
  const dist = Math.sqrt(
    Math.pow(position.x - segment.idealPosition.x, 2) +
    Math.pow(position.y - segment.idealPosition.y, 2)
  );
  // age penalty: ideal age depends on segment
  const idealAge =
    segment.id === "low_end" ? 3.0 :
    segment.id === "traditional" ? 1.5 :
    segment.id === "high_end" ? 0.5 :
    segment.id === "performance" ? 0.7 : 0.7;
  const ageGap = Math.abs(product.age - idealAge);
  const posScore = clamp01(1 - dist / 6) * 0.7 + clamp01(1 - ageGap / 4) * 0.3;

  // ── R&D / MTBF factor (20%) ──────────────────────
  const mtbfGap = Math.abs(mtbf - segment.idealMtbf);
  const mtbfScore = clamp01(1 - mtbfGap / 12000) * 0.6 + (product.rndLevel / 100) * 0.4;

  // ── Marketing factor (20%) ───────────────────────
  // Promo → awareness, Sales → accessibility.
  const projectedAwareness = clamp(
    product.awareness * 0.65 + Math.sqrt(promoBudget / 3) * 18,
    0, 100
  );
  const projectedAccessibility = clamp(
    product.accessibility * 0.65 + Math.sqrt(salesBudget / 2) * 20,
    0, 100
  );
  const marketingScore = (projectedAwareness / 100) * 0.5 + (projectedAccessibility / 100) * 0.5;

  let score =
    priceScore * 0.35 +
    posScore * 0.25 +
    mtbfScore * 0.20 +
    marketingScore * 0.20;

  // Strategy: focus-segment bonus (+8% per focused segment, capped)
  if (strategy?.focusSegments?.includes(segment.id)) {
    score = score * 1.08;
  }
  // Strategy: ESG investment gives small long-term boost to score
  if (strategy?.esgInvestment) {
    score = score * (1 + Math.min(0.04, strategy.esgInvestment / 25000));
  }
  // Strategy: alliance tier gives small boost
  if (strategy?.allianceTier) {
    score = score * (1 + strategy.allianceTier * 0.015);
  }

  return {
    score: clamp01(score),
    factors: {
      price: priceScore,
      agePosition: posScore,
      qualityMtbf: mtbfScore,
      marketing: marketingScore,
    },
  };
}

/**
 * Distribute a segment's demand across all competing products
 * proportional to their attractiveness scores. If total
 * attractiveness is 0, distribute evenly.
 */
export function computeDemandForSegment(
  segment: Segment,
  competingProducts: { product: Product; decision?: ProductDecision; strategy?: { focusSegments?: SegmentId[]; brandInvestment?: number; esgInvestment?: number; allianceTier?: number } }[]
): DemandCalculation[] {
  const results = competingProducts.map(({ product, decision, strategy }) => {
    const { score, factors } = computeAttractiveness(product, segment, decision, strategy);
    return { product, decision, score, factors };
  });

  const totalScore = results.reduce((s, r) => s + r.score, 0) || 1;

  return results.map((r) => {
    const share = r.score / totalScore;
    const demandUnits = Math.round(segment.totalDemand * share);
    // Available = production scheduled + starting inventory
    const availableUnits =
      (r.decision?.production ?? r.product.productionScheduled) + r.product.inventory;
    const unitsSold = Math.min(demandUnits, availableUnits);
    const stockOut = demandUnits > availableUnits && demandUnits > 0;
    const inventoryLeft = Math.max(0, availableUnits - unitsSold);

    return {
      productId: r.product.id,
      teamId: r.product.teamId,
      segment: r.product.segment,
      totalSegmentDemand: segment.totalDemand,
      attractivenessScore: r.score,
      demandUnits,
      unitsSold,
      stockOut,
      inventoryLeft,
      factors: r.factors,
    };
  });
}

// =====================================================
// Cost & Unit-Cost Calculation
// =====================================================

/**
 * Recompute unit cost given an R&D investment, automation level, and
 * (optionally) HR and Operations decisions.
 *
 *   - Higher automation → lower labor cost (but harder to retool).
 *   - Higher R&D level → small material efficiency boost.
 *   - Higher HR compensation/training → productivity boost (lower unit cost).
 *   - Higher Operations lean investment → waste reduction (lower unit cost).
 *
 * The HR and Operations params are optional to preserve backward compatibility
 * with the simpler per-product preview path.
 */
export function computeUnitCost(
  product: Product,
  decision?: ProductDecision,
  hr?: { compensationIndex?: number; trainingInvestment?: number; performanceBonus?: number },
  ops?: { leanInvestment?: number; supplierInvestment?: number }
): number {
  // R&D investment subtly improves material efficiency at high levels
  const efficiencyBoost = Math.min(0.15, (product.rndLevel / 100) * 0.15);
  const materialCost = product.materialCost * (1 - efficiencyBoost);
  let laborCost = BASE_LABOR_COST / (1 + (product.automation - 1) * 0.15);

  // HR effects: higher compensation = higher cost, but training & bonuses
  // boost productivity (reducing effective labor cost)
  if (hr) {
    const compPenalty = (hr.compensationIndex ?? 1) - 1; // +10% comp = +10% labor cost
    const trainingBoost = Math.min(0.15, (hr.trainingInvestment ?? 0) / 4000); // up to -15%
    const bonusBoost = Math.min(0.08, (hr.performanceBonus ?? 0) / 4000); // up to -8%
    laborCost = laborCost * (1 + compPenalty) * (1 - trainingBoost - bonusBoost);
  }

  // Operations: lean investment reduces waste (effectively material cost)
  let wasteAdjustedMaterial = materialCost;
  if (ops) {
    const leanReduction = Math.min(0.12, (ops.leanInvestment ?? 0) / 5000); // up to -12%
    wasteAdjustedMaterial = materialCost * (1 - leanReduction);
  }

  const carryingCost = CARRYING_COST_PER_UNIT;
  return wasteAdjustedMaterial + laborCost + carryingCost;
}

// =====================================================
// Round Processing — the heart of the engine
// =====================================================

/**
 * Process a single round of the simulation.
 *
 * Steps:
 *   1. Advance segments (drift perceptual map, grow demand)
 *   2. For each team, gather decisions (or auto-generate for AI)
 *   3. Compute demand for each segment
 *   4. Compute production, sales, revenue, COGS
 *   5. Compute operating expenses (R&D, marketing, admin, depreciation)
 *   6. Compute interest & emergency loans
 *   7. Build income statement, balance sheet, cash flow
 *   8. Compute financial metrics (ROE, stock price, etc.)
 *   9. Append RoundHistoryEntry
 *  10. Advance product ages, awareness decay, etc.
 */
export function processRound(state: GameState, allDecisions: TeamDecisions[]): GameState {
  // Clone state immutably
  const newState: GameState = JSON.parse(JSON.stringify(state));
  const round = newState.currentRound + 1;
  newState.currentRound = round;
  newState.updatedAt = Date.now();

  // 1. Advance segments
  newState.segments = newState.segments.map((seg) => ({
    ...seg,
    totalDemand: Math.round(seg.totalDemand * (1 + seg.growthRate)),
    idealPrice: round > 1 ? seg.idealPrice * 0.985 : seg.idealPrice,
    idealPosition: {
      x: clamp(seg.idealPosition.x + POSITION_DRIFT * 0.3, 0, 10),
      y: clamp(seg.idealPosition.y + POSITION_DRIFT * 0.3, 0, 10),
    },
  }));

  // 2. For each team, ensure we have decisions
  const decisionsByTeam = new Map<string, TeamDecisions>();
  for (const team of newState.teams) {
    const explicit = allDecisions.find((d) => d.teamId === team.id);
    if (explicit) {
      decisionsByTeam.set(team.id, explicit);
    } else if (team.isAI) {
      decisionsByTeam.set(team.id, generateAIDecisions(team, round, newState));
    }
  }

  // 3. Compute demand per segment across all teams
  const segmentDemandResults = new Map<SegmentId, DemandCalculation[]>();
  for (const seg of newState.segments) {
    const competing: { product: Product; decision?: ProductDecision; strategy?: { focusSegments?: SegmentId[]; brandInvestment?: number; esgInvestment?: number; allianceTier?: number } }[] = [];
    for (const team of newState.teams) {
      const teamProducts = newState.products.filter(
        (p) => p.teamId === team.id && p.segment === seg.id
      );
      const td = decisionsByTeam.get(team.id);
      for (const p of teamProducts) {
        const pd = td?.productDecisions.find((d) => d.productId === p.id);
        competing.push({ product: p, decision: pd, strategy: td?.strategy });
      }
    }
    segmentDemandResults.set(seg.id, computeDemandForSegment(seg, competing));
  }

  // 4-8. Per-team financial computation
  const teamResults: TeamRoundResult[] = newState.teams.map((team) => {
    const td = decisionsByTeam.get(team.id);
    return computeTeamRoundResult(team, td, newState, segmentDemandResults);
  });

  // 9. Append round history
  const historyEntry: RoundHistoryEntry = {
    round,
    teamResults,
    segmentSnapshots: newState.segments.map((s) => ({ ...s })),
  };
  newState.history = [...newState.history, historyEntry];

  // 10. Advance product state for next round
  newState.products = newState.products.map((p) => {
    const td = decisionsByTeam.get(p.teamId);
    const pd = td?.productDecisions.find((d) => d.productId === p.id);
    const demand = segmentDemandResults.get(p.segment)?.find((d) => d.productId === p.id);
    const inventoryLeft = demand?.inventoryLeft ?? p.inventory;

    // Update product state
    const newAge = p.age + 1;
    const newAwareness = clamp(
      (p.awareness * 0.65) + Math.sqrt((pd?.promoBudget ?? 0) / 3) * 18,
      0, 100
    );
    const newAccessibility = clamp(
      (p.accessibility * 0.65) + Math.sqrt((pd?.salesBudget ?? 0) / 2) * 20,
      0, 100
    );

    // R&D investment increases rndLevel (capped at 100)
    const newRndLevel = clamp(p.rndLevel + (pd?.rndInvestment ?? 0) / 50, 0, 100);

    // Automation investment increases automation level (capped at 10)
    const automationGain = (pd?.automationInvestment ?? 0) / 4000; // $4M = +1 automation
    const newAutomation = clamp(p.automation + automationGain, 1, 10);

    // Capacity investment: $0.5M = +100 units
    const newCapacity = p.capacity + (pd?.capacityInvestment ?? 0) * 0.2;

    // Position updates based on R&D investment (move toward target)
    let newPosition = p.position;
    let newMtbf = p.mtbf;
    if (pd && pd.rndInvestment > 0) {
      const moveDistance = Math.min(2, pd.rndInvestment / 500);
      const dx = pd.position.x - p.position.x;
      const dy = pd.position.y - p.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        newPosition = {
          x: p.position.x + (dx / dist) * Math.min(moveDistance, dist),
          y: p.position.y + (dy / dist) * Math.min(moveDistance, dist),
        };
      }
      newMtbf = clamp(pd.mtbf, 5000, 35000);
    }

    const newUnitCost = computeUnitCost(
      { ...p, automation: newAutomation, rndLevel: newRndLevel },
      pd
    );

    return {
      ...p,
      age: newAge,
      awareness: newAwareness,
      accessibility: newAccessibility,
      rndLevel: newRndLevel,
      automation: newAutomation,
      capacity: newCapacity,
      position: newPosition,
      mtbf: newMtbf,
      unitCost: newUnitCost,
      materialCost: p.materialCost * (1 - Math.min(0.15, (newRndLevel / 100) * 0.15)),
      laborCost: BASE_LABOR_COST / (1 + (newAutomation - 1) * 0.15),
      inventory: inventoryLeft,
      productionScheduled: pd?.production ?? 0,
      price: pd?.price ?? p.price,
    };
  });

  // Store decisions in state
  for (const td of decisionsByTeam.values()) {
    newState.decisions[`${td.teamId}_${round}`] = td;
  }

  // Mark game complete if we've hit maxRounds
  if (round >= newState.maxRounds) {
    newState.status = "completed";
  }

  return newState;
}

// =====================================================
// Team-level round result computation
// =====================================================

function computeTeamRoundResult(
  team: Team,
  decisions: TeamDecisions | undefined,
  state: GameState,
  segmentDemandResults: Map<SegmentId, DemandCalculation[]>
): TeamRoundResult {
  const teamProducts = state.products.filter((p) => p.teamId === team.id);
  const alerts: GameAlert[] = [];

  // Pull prior balance sheet for carry-forward
  const prevRound = state.currentRound;
  const prevHistory = state.history[state.history.length - 1];
  const prevResult = prevHistory?.teamResults.find((r) => r.teamId === team.id);
  const prevBalance = prevResult?.balance ?? {
    cash: 8000,
    accountsReceivable: 0,
    inventory: teamProducts.reduce((s, p) => s + p.inventory * p.unitCost, 0),
    totalCurrentAssets: 8000 + teamProducts.reduce((s, p) => s + p.inventory * p.unitCost, 0),
    plantAndEquipment: 18000,
    accumulatedDepreciation: 0,
    totalAssets: 8000 + teamProducts.reduce((s, p) => s + p.inventory * p.unitCost, 0) + 18000,
    accountsPayable: 0,
    shortTermDebt: 0,
    longTermDebt: 6000,
    totalLiabilities: 6000,
    commonStock: 10000,
    retainedEarnings: 0,
    totalEquity: 10000 + (8000 + teamProducts.reduce((s, p) => s + p.inventory * p.unitCost, 0) + 18000 - 6000 - 10000),
  };

  // ── Per-product sales & COGS ─────────────────────
  const productResults: ProductRoundResult[] = teamProducts.map((p) => {
    const pd = decisions?.productDecisions.find((d) => d.productId === p.id);
    const demand = segmentDemandResults.get(p.segment)?.find((d) => d.productId === p.id);
    const unitsSold = demand?.unitsSold ?? 0;
    const revenue = unitsSold * (pd?.price ?? p.price);
    // Pass HR + Operations decisions to unit cost so productivity
    // and lean benefits flow through to COGS.
    const unitCost = computeUnitCost(p, pd, decisions?.hr, pd);
    const segment = state.segments.find((s) => s.id === p.segment)!;
    const segmentShare = (unitsSold / Math.max(segment.totalDemand, 1)) * 100;
    const customerScore = (demand?.attractivenessScore ?? 0) * 100;

    return {
      productId: p.id,
      productName: p.name,
      segment: p.segment,
      unitsSold,
      inventoryLeft: demand?.inventoryLeft ?? p.inventory,
      revenue,
      unitCost,
      price: pd?.price ?? p.price,
      marketShare: segmentShare,
      customerScore,
      stockOut: demand?.stockOut ?? false,
    };
  });

  const totalRevenue = productResults.reduce((s, r) => s + r.revenue, 0);
  const totalCOGS = productResults.reduce((s, r) => s + r.unitsSold * r.unitCost, 0);
  const grossMargin = totalRevenue - totalCOGS;

  // ── Operating expenses ───────────────────────────
  // R&D, Marketing, Sales (per-product) + Strategy + HR + Operations overhead
  const rndExpense = (decisions?.productDecisions ?? []).reduce(
    (s, d) => s + d.rndInvestment + d.automationInvestment * 0.5 + d.capacityInvestment * 0.1,
    0
  ) + (decisions?.strategy?.pipelineInvestment ?? 0);
  const marketingExpense = (decisions?.productDecisions ?? []).reduce(
    (s, d) => s + d.promoBudget,
    0
  ) + (decisions?.strategy?.brandInvestment ?? 0);
  const salesExpense = (decisions?.productDecisions ?? []).reduce(
    (s, d) => s + d.salesBudget,
    0
  );
  // Operations expenses: lean + supplier reliability investments
  const operationsExpense = (decisions?.productDecisions ?? []).reduce(
    (s, d) => s + d.leanInvestment + d.supplierInvestment,
    0
  );
  // HR expenses: training + benefits + hiring + performance bonus + compensation uplift
  const hrExpense = (decisions?.hr
    ? (decisions.hr.trainingInvestment
      + decisions.hr.benefitsInvestment
      + decisions.hr.hiringInvestment
      + decisions.hr.performanceBonus
      // Compensation uplift applies to base labor cost (approximated as 60% of COGS)
      + Math.max(0, (decisions.hr.compensationIndex - 1) * totalCOGS * 0.6)
    )
    : 0
  );
  // Strategy expenses: ESG + alliance fees
  const strategyExpense = (decisions?.strategy
    ? decisions.strategy.esgInvestment + decisions.strategy.allianceTier * 200
    : 0
  );
  const adminExpense = ADMIN_EXPENSE_BASE + totalRevenue * 0.02;

  // Depreciation: 1/15 of plant+equipment per year, plus automation/capacity additions
  const newInvestment = (decisions?.productDecisions ?? []).reduce(
    (s, d) => s + d.automationInvestment + d.capacityInvestment,
    0
  );
  const plantBase = prevBalance.plantAndEquipment + newInvestment;
  const depreciation = plantBase / DEPRECIATION_YEARS;

  const operatingProfit = grossMargin - rndExpense - marketingExpense - salesExpense - adminExpense - depreciation - operationsExpense - hrExpense - strategyExpense;

  // ── Interest & emergency loan ────────────────────
  const interestExpense =
    prevBalance.shortTermDebt * SHORT_TERM_RATE +
    prevBalance.longTermDebt * LONG_TERM_RATE;
  const interestIncome = prevBalance.cash > 0 ? prevBalance.cash * INTEREST_INCOME_RATE : 0;
  const netInterest = interestExpense - interestIncome;

  // Pre-tax income
  const earningsBeforeTax = operatingProfit - netInterest;
  const tax = Math.max(0, earningsBeforeTax) * TAX_RATE;
  let netProfit = earningsBeforeTax - tax;

  // ── Cash flow & emergency loan ───────────────────
  const ar = totalRevenue * (A_R_DAYS / 360);
  const ap = totalCOGS * (A_P_DAYS / 360);
  const inventoryValue = productResults.reduce((s, r) => s + r.inventoryLeft * r.unitCost, 0);

  // Operating cash flow (simplified)
  const operationsCash =
    netProfit + depreciation - (ar - (prevBalance.accountsReceivable || 0)) +
    (ap - (prevBalance.accountsPayable || 0)) -
    (inventoryValue - prevBalance.inventory);

  // Investing cash (capex)
  const investingCash = -newInvestment;

  // Financing cash
  const fin = decisions?.finance ?? { shortTermDebt: 0, longTermDebt: 0, equityIssue: 0, dividendPerShare: 0 };
  const dividendPayout = fin.dividendPerShare * SHARES_OUTSTANDING;
  const financingCash =
    fin.shortTermDebt + fin.longTermDebt + fin.equityIssue - dividendPayout;

  let netCashFlow = operationsCash + investingCash + financingCash;
  let beginningCash = prevBalance.cash;
  let endingCash = beginningCash + netCashFlow;

  // Emergency loan if ending cash < 0
  let emergencyLoan = 0;
  let emergencyLoanInterest = 0;
  if (endingCash < 0) {
    emergencyLoan = Math.abs(endingCash);
    emergencyLoanInterest = emergencyLoan * EMERGENCY_LOAN_RATE;
    endingCash = 0; // loan brings cash to zero
    // Recompute netProfit after emergency interest
    netProfit = netProfit - emergencyLoanInterest;
    alerts.push({
      id: `emergency-${team.id}-${state.currentRound + 1}`,
      severity: "critical",
      title: "Emergency Loan Triggered",
      message: `Cash shortfall of ₹${emergencyLoan.toFixed(0)}K. Big Al's Emergency Loan issued at ${(EMERGENCY_LOAN_RATE * 100).toFixed(1)}% APR. Review your production schedule and finance decisions.`,
      teamId: team.id,
      category: "finance",
    });
  }

  // ── Build statements ─────────────────────────────
  const income: IncomeStatement = {
    revenue: totalRevenue,
    costOfGoodsSold: totalCOGS,
    grossMargin,
    rndExpense,
    marketingExpense,
    salesExpense,
    adminExpense,
    depreciation,
    operatingProfit,
    interestExpense: netInterest,
    emergencyLoanInterest,
    earningsBeforeTax,
    tax,
    netProfit,
    netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
  };

  const plantAndEquipment = plantBase;
  const accumulatedDepreciation = prevBalance.accumulatedDepreciation + depreciation;
  const totalAssets = endingCash + ar + inventoryValue + (plantAndEquipment - accumulatedDepreciation);

  const newShortTermDebt = prevBalance.shortTermDebt + fin.shortTermDebt;
  const newLongTermDebt = prevBalance.longTermDebt + fin.longTermDebt;
  const newCommonStock = prevBalance.commonStock + fin.equityIssue;
  const newRetainedEarnings = (prevBalance.retainedEarnings || 0) + netProfit - dividendPayout;

  const balance: BalanceSheet = {
    cash: endingCash,
    accountsReceivable: ar,
    inventory: inventoryValue,
    totalCurrentAssets: endingCash + ar + inventoryValue,
    plantAndEquipment,
    accumulatedDepreciation,
    totalAssets,
    accountsPayable: ap,
    shortTermDebt: newShortTermDebt,
    longTermDebt: newLongTermDebt,
    totalLiabilities: ap + newShortTermDebt + newLongTermDebt + emergencyLoan,
    commonStock: newCommonStock,
    retainedEarnings: newRetainedEarnings,
    totalEquity: newCommonStock + newRetainedEarnings,
  };

  const cashFlow: CashFlowStatement = {
    operationsCash,
    investingCash,
    financingCash,
    netCashFlow,
    beginningCash,
    endingCash,
    emergencyLoan,
  };

  // ── Metrics ──────────────────────────────────────
  const totalEquity = balance.totalEquity;
  const roe = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
  const roa = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
  const assetTurnover = totalAssets > 0 ? totalRevenue / totalAssets : 0;

  // Total team market share across all segments
  const teamShare =
    productResults.reduce((s, r) => {
      const seg = state.segments.find((sg) => sg.id === r.segment)!;
      return s + (r.unitsSold / Math.max(seg.totalDemand, 1));
    }, 0) / Math.max(productResults.length, 1) * 100;

  // Stock price: based on EPS, growth, and risk
  const eps = netProfit / SHARES_OUTSTANDING;
  const prevNetProfit = prevResult?.income.netProfit ?? 0;
  const growth = prevNetProfit > 0 ? (netProfit - prevNetProfit) / Math.abs(prevNetProfit) : 0;
  const prevStock = prevResult?.metrics.stockPrice ?? 25;
  // PE ratio: 12 + 8 * growth (clamped 0..2)
  const pe = 12 + 8 * clamp(growth, -0.5, 2);
  const bankruptcyRisk = clamp(
    (emergencyLoan > 0 ? 30 : 0) +
    (balance.totalLiabilities / Math.max(totalAssets, 1)) * 40 +
    (netProfit < 0 ? 25 : 0) +
    (roa < 0 ? 15 : 0),
    0, 100
  );
  const riskDiscount = 1 - bankruptcyRisk / 200;
  const newStockPrice = clamp(
    Math.max(5, eps * pe * riskDiscount + (prevStock * 0.3)),
    1, 500
  );
  const marketCap = newStockPrice * SHARES_OUTSTANDING;

  const metrics: FinancialMetrics = {
    revenue: totalRevenue,
    netProfit,
    netMargin: income.netMargin,
    roe,
    roa,
    assetTurnover,
    marketShare: teamShare,
    stockPrice: newStockPrice,
    marketCap,
    emergencyLoanTaken: emergencyLoan > 0,
    emergencyLoanAmount: emergencyLoan,
    bankruptcyRisk,
  };

  // ── Alerts ───────────────────────────────────────
  if (operatingProfit < 0) {
    alerts.push({
      id: `op-loss-${team.id}-${state.currentRound + 1}`,
      severity: "warning",
      title: "Operating Loss",
      message: `Operating profit is negative (₹${operatingProfit.toFixed(0)}K). Review pricing and production costs.`,
      teamId: team.id,
      category: "finance",
    });
  }
  for (const pr of productResults) {
    if (pr.stockOut) {
      alerts.push({
        id: `stockout-${pr.productId}-${state.currentRound + 1}`,
        severity: "warning",
        title: `Stock Out: ${pr.productName}`,
        message: `${pr.productName} could have sold more units. Increase production next round.`,
        teamId: team.id,
        category: "production",
      });
    }
    if (pr.inventoryLeft > pr.unitsSold * 1.5 && pr.unitsSold > 0) {
      alerts.push({
        id: `overstock-${pr.productId}-${state.currentRound + 1}`,
        severity: "info",
        title: `Excess Inventory: ${pr.productName}`,
        message: `${pr.productName} has ${pr.inventoryLeft} units left in inventory. Reduce production next round.`,
        teamId: team.id,
        category: "production",
      });
    }
  }
  if (metrics.bankruptcyRisk > 60) {
    alerts.push({
      id: `bankruptcy-${team.id}-${state.currentRound + 1}`,
      severity: "critical",
      title: "High Bankruptcy Risk",
      message: `Bankruptcy risk score is ${metrics.bankruptcyRisk.toFixed(0)}/100. Issue equity or cut costs immediately.`,
      teamId: team.id,
      category: "finance",
    });
  }
  if (roe > 25) {
    alerts.push({
      id: `strong-roe-${team.id}-${state.currentRound + 1}`,
      severity: "success",
      title: "Strong ROE Performance",
      message: `ROE of ${roe.toFixed(1)}% is outperforming the market. Consider a dividend increase.`,
      teamId: team.id,
      category: "finance",
    });
  }
  void prevRound;

  return {
    teamId: team.id,
    round: state.currentRound + 1,
    products: productResults,
    income,
    balance,
    cashFlow,
    metrics,
    alerts,
  };
}

// =====================================================
// AI Decision Generator
// =====================================================

/**
 * Generates a sensible default decision set for AI-controlled
 * teams. Difficulty drives how aggressive / well-tuned the
 * decisions are. Includes Strategy, HR, and Operations decisions.
 */
export function generateAIDecisions(
  team: Team,
  _round: number,
  state: GameState
): TeamDecisions {
  const teamProducts = state.products.filter((p) => p.teamId === team.id);
  const difficultyFactor = team.aiDifficulty === "hard" ? 1.0 : team.aiDifficulty === "medium" ? 0.75 : 0.5;

  const productDecisions: ProductDecision[] = teamProducts.map((p) => {
    const seg = state.segments.find((s) => s.id === p.segment)!;
    // Move toward ideal position based on difficulty
    const targetPos = {
      x: seg.idealPosition.x + (1 - difficultyFactor) * (Math.random() - 0.5),
      y: seg.idealPosition.y + (1 - difficultyFactor) * (Math.random() - 0.5),
    };

    // Price: aggressive teams price slightly below ideal
    const price = seg.idealPrice * (1 - 0.05 * difficultyFactor + (Math.random() - 0.5) * 0.05);

    // Production: target ~80% of segment demand / num competitors with buffer
    const numCompetitors = state.teams.length;
    const targetShare = 1 / numCompetitors * (0.8 + 0.4 * difficultyFactor);
    const productionTarget = Math.round(seg.totalDemand * targetShare);
    const production = Math.min(productionTarget, p.capacity);

    // Budgets scale with difficulty
    const promoBudget = 1500 * difficultyFactor + Math.random() * 500;
    const salesBudget = 1200 * difficultyFactor + Math.random() * 400;
    const rndInvestment = (p.age > 2 ? 1200 : 600) * difficultyFactor;
    const automationInvestment = (p.segment === "low_end" || p.segment === "traditional" ? 800 : 200) * difficultyFactor;
    const capacityInvestment = production > p.capacity ? (production - p.capacity) * 0.5 : 0;
    // Operations: hard AI invests more in lean & supplier reliability
    const leanInvestment = (p.segment === "low_end" || p.segment === "traditional" ? 400 : 200) * difficultyFactor;
    const supplierInvestment = 300 * difficultyFactor;

    return {
      productId: p.id,
      price: Math.round(price * 10) / 10,
      mtbf: seg.idealMtbf,
      position: targetPos,
      production,
      promoBudget: Math.round(promoBudget),
      salesBudget: Math.round(salesBudget),
      rndInvestment: Math.round(rndInvestment),
      automationInvestment: Math.round(automationInvestment),
      capacityInvestment: Math.round(capacityInvestment),
      leanInvestment: Math.round(leanInvestment),
      supplierInvestment: Math.round(supplierInvestment),
    };
  });

  // Strategy: hard AI focuses on 2-3 segments and invests in ESG/brand
  const allSegs: SegmentId[] = ["traditional", "low_end", "high_end", "performance", "size"];
  const focusCount = team.aiDifficulty === "hard" ? 3 : team.aiDifficulty === "medium" ? 2 : 1;
  const focusSegments = [...allSegs].sort(() => Math.random() - 0.5).slice(0, focusCount);
  const strategy = {
    focusSegments,
    esgInvestment: Math.round(500 * difficultyFactor),
    pipelineInvestment: Math.round(800 * difficultyFactor),
    allianceTier: team.aiDifficulty === "hard" ? 2 : 1,
    brandInvestment: Math.round(600 * difficultyFactor),
  };

  // HR: hard AI pays above market and invests in training
  const hr = {
    compensationIndex: 1.0 + 0.05 * difficultyFactor + Math.random() * 0.05,
    trainingInvestment: Math.round(700 * difficultyFactor),
    benefitsInvestment: Math.round(400 * difficultyFactor),
    hiringInvestment: Math.round(300 * difficultyFactor),
    performanceBonus: Math.round(500 * difficultyFactor),
  };

  const finance: FinanceDecision = {
    shortTermDebt: 0,
    longTermDebt: 0,
    equityIssue: 0,
    dividendPerShare: team.aiDifficulty === "hard" ? 0.5 : 0,
  };

  return {
    teamId: team.id,
    round: _round,
    productDecisions,
    strategy,
    hr,
    finance,
  };
}

// =====================================================
// Live Proforma (preview before submission)
// =====================================================

/**
 * Computes a *projected* financial snapshot for a team given
 * the current draft decisions. Used by the live proforma
 * calculator on R&D / Marketing / Production / Finance tabs
 * so players see instant feedback before processing a round.
 *
 * This is a simplified projection — it shares math with the
 * full processRound but does NOT mutate state.
 */
export function computeLiveProforma(
  state: GameState,
  teamId: string,
  draftDecisions: TeamDecisions
): {
  projectedRevenue: number;
  projectedNetProfit: number;
  projectedCash: number;
  projectedMargin: number;
  projectedRoe: number;
  projectedStockPrice: number;
  emergencyLoanRisk: number;
  productProjections: {
    productId: string;
    productName: string;
    projectedUnitsSold: number;
    projectedRevenue: number;
    projectedGrossMargin: number;
    stockOutRisk: boolean;
  }[];
} {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) {
    return {
      projectedRevenue: 0,
      projectedNetProfit: 0,
      projectedCash: 0,
      projectedMargin: 0,
      projectedRoe: 0,
      projectedStockPrice: 0,
      emergencyLoanRisk: 0,
      productProjections: [],
    };
  }

  const teamProducts = state.products.filter((p) => p.teamId === teamId);
  const prevHistory = state.history[state.history.length - 1];
  const prevResult = prevHistory?.teamResults.find((r) => r.teamId === teamId);
  const prevBalance = prevResult?.balance;

  // For each product, compute projected units sold via demand model
  // against current competitors (using their last decisions or defaults).
  const productProjections = teamProducts.map((p) => {
    const seg = state.segments.find((s) => s.id === p.segment)!;
    const pd = draftDecisions.productDecisions.find((d) => d.productId === p.id);

    // Gather all competitors (including this product) using last-known decisions
    const competitors: { product: Product; decision?: ProductDecision; strategy?: { focusSegments?: SegmentId[]; brandInvestment?: number; esgInvestment?: number; allianceTier?: number } }[] = [];
    for (const otherP of state.products.filter((pr) => pr.segment === seg.id)) {
      if (otherP.id === p.id) {
        competitors.push({ product: otherP, decision: pd, strategy: draftDecisions.strategy });
      } else {
        // Use last known decision for competitors
        const lastDec = state.decisions[`${otherP.teamId}_${state.currentRound}`];
        const otherPd = lastDec?.productDecisions.find((d) => d.productId === otherP.id);
        competitors.push({ product: otherP, decision: otherPd, strategy: lastDec?.strategy });
      }
    }
    const demandResults = computeDemandForSegment(seg, competitors);
    const myDemand = demandResults.find((d) => d.productId === p.id)!;

    const price = pd?.price ?? p.price;
    const unitCost = computeUnitCost(p, pd, draftDecisions.hr, pd);
    const revenue = myDemand.unitsSold * price;
    const grossMargin = revenue - myDemand.unitsSold * unitCost;

    return {
      productId: p.id,
      productName: p.name,
      projectedUnitsSold: myDemand.unitsSold,
      projectedRevenue: revenue,
      projectedGrossMargin: grossMargin,
      stockOutRisk: myDemand.stockOut,
    };
  });

  const totalRevenue = productProjections.reduce((s, r) => s + r.projectedRevenue, 0);
  const totalCOGS = productProjections.reduce(
    (s, r) => s + r.projectedUnitsSold * computeUnitCost(
      teamProducts.find((p) => p.id === r.productId)!,
      draftDecisions.productDecisions.find((d) => d.productId === r.productId),
      draftDecisions.hr,
      draftDecisions.productDecisions.find((d) => d.productId === r.productId)
    ),
    0
  );
  const grossMargin = totalRevenue - totalCOGS;

  const rndExpense = draftDecisions.productDecisions.reduce(
    (s, d) => s + d.rndInvestment + d.automationInvestment * 0.5 + d.capacityInvestment * 0.1,
    0
  ) + (draftDecisions.strategy?.pipelineInvestment ?? 0);
  const marketingExpense = draftDecisions.productDecisions.reduce((s, d) => s + d.promoBudget, 0)
    + (draftDecisions.strategy?.brandInvestment ?? 0);
  const salesExpense = draftDecisions.productDecisions.reduce((s, d) => s + d.salesBudget, 0);
  const operationsExpense = draftDecisions.productDecisions.reduce(
    (s, d) => s + d.leanInvestment + d.supplierInvestment,
    0
  );
  const hrExpense = draftDecisions.hr
    ? (draftDecisions.hr.trainingInvestment
      + draftDecisions.hr.benefitsInvestment
      + draftDecisions.hr.hiringInvestment
      + draftDecisions.hr.performanceBonus
      + Math.max(0, (draftDecisions.hr.compensationIndex - 1) * totalCOGS * 0.6)
    )
    : 0;
  const strategyExpense = draftDecisions.strategy
    ? draftDecisions.strategy.esgInvestment + draftDecisions.strategy.allianceTier * 200
    : 0;
  const adminExpense = ADMIN_EXPENSE_BASE + totalRevenue * 0.02;
  const newInvestment = draftDecisions.productDecisions.reduce(
    (s, d) => s + d.automationInvestment + d.capacityInvestment,
    0
  );
  const plantBase = (prevBalance?.plantAndEquipment ?? 18000) + newInvestment;
  const depreciation = plantBase / DEPRECIATION_YEARS;

  const operatingProfit = grossMargin - rndExpense - marketingExpense - salesExpense - adminExpense - depreciation - operationsExpense - hrExpense - strategyExpense;

  const shortTermDebt = prevBalance?.shortTermDebt ?? 0;
  const longTermDebt = prevBalance?.longTermDebt ?? 6000;
  const cash = prevBalance?.cash ?? 8000;

  const interestExpense = shortTermDebt * SHORT_TERM_RATE + longTermDebt * LONG_TERM_RATE;
  const interestIncome = cash > 0 ? cash * INTEREST_INCOME_RATE : 0;

  const ebt = operatingProfit - (interestExpense - interestIncome);
  const tax = Math.max(0, ebt) * TAX_RATE;
  const netProfit = ebt - tax;

  const fin = draftDecisions.finance;
  const dividendPayout = fin.dividendPerShare * SHARES_OUTSTANDING;
  const operationsCash = netProfit + depreciation;
  const investingCash = -newInvestment;
  const financingCash = fin.shortTermDebt + fin.longTermDebt + fin.equityIssue - dividendPayout;
  const projectedCash = cash + operationsCash + investingCash + financingCash;

  const totalEquity = (prevBalance?.totalEquity ?? 10000) + netProfit - dividendPayout + fin.equityIssue;
  const totalAssets = Math.max(projectedCash, 0) + (prevBalance?.inventory ?? 0) + plantBase - depreciation;

  const roe = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const eps = netProfit / SHARES_OUTSTANDING;
  const prevNetProfit = prevResult?.income.netProfit ?? 0;
  const growth = prevNetProfit > 0 ? (netProfit - prevNetProfit) / Math.abs(prevNetProfit) : 0;
  const pe = 12 + 8 * clamp(growth, -0.5, 2);
  const prevStock = prevResult?.metrics.stockPrice ?? 25;
  const stockPrice = clamp(
    Math.max(5, eps * pe + prevStock * 0.3),
    1, 500
  );

  const emergencyLoanRisk = projectedCash < 0 ? 100 : projectedCash < 1000 ? 60 : projectedCash < 3000 ? 30 : 5;

  return {
    projectedRevenue: totalRevenue,
    projectedNetProfit: netProfit,
    projectedCash: projectedCash,
    projectedMargin: margin,
    projectedRoe: roe,
    projectedStockPrice: stockPrice,
    emergencyLoanRisk,
    productProjections,
  };
}

// =====================================================
// Utility helpers
// =====================================================

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

// =====================================================
// Shares outstanding export
// =====================================================
export const SIM_SHARES_OUTSTANDING = SHARES_OUTSTANDING;
export const SIM_EMERGENCY_LOAN_RATE = EMERGENCY_LOAN_RATE;
