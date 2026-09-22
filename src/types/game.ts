/**
 * ApexStrategy Enterprise — Core Type System
 * =====================================================
 * All TypeScript interfaces for the simulation engine,
 * game state, decisions, financial statements, and
 * round history.
 *
 * Author: ApexStrategy Labs
 */

// =====================================================
// Product & Market Segments
// =====================================================

export type SegmentId = "traditional" | "low_end" | "high_end" | "performance" | "size";

export interface Segment {
  id: SegmentId;
  name: string;
  /** Total market demand in units for the current round */
  totalDemand: number;
  /** Annual demand growth rate (e.g. 0.10 = 10%) */
  growthRate: number;
  /** Ideal price point — drifts down each round */
  idealPrice: number;
  /** Ideal MTBF (Mean Time Before Failure) in hours */
  idealMtbf: number;
  /** Ideal positioning coordinates on the perceptual map (x,y in 0-10) */
  idealPosition: { x: number; y: number };
  /** How price-sensitive this segment is (0-1) */
  priceSensitivity: number;
}

// =====================================================
// Team / Company
// =====================================================

export interface Team {
  id: string;
  name: string;
  /** Brand color hex code */
  color: string;
  /** True if this team is controlled by the human player */
  isPlayer: boolean;
  /** True if AI-driven (competitor) */
  isAI: boolean;
  /** Difficulty for AI decision-making: easy | medium | hard */
  aiDifficulty: "easy" | "medium" | "hard";
}

// =====================================================
// Product (a team may have multiple products)
// =====================================================

export interface Product {
  id: string;
  teamId: string;
  name: string;
  segment: SegmentId;
  /** Perceived position on the perceptual map */
  position: { x: number; y: number };
  /** Mean Time Before Failure in hours */
  mtbf: number;
  /** Current age in years (advances 1 per round) */
  age: number;
  /** Unit price set by the team */
  price: number;
  /** Unit cost — calculated from R&D level, automation, material */
  unitCost: number;
  /** Material cost component */
  materialCost: number;
  /** Labor cost component (driven by automation) */
  laborCost: number;
  /** Carrying cost per unit (overhead allocation) */
  carryingCost: number;
  /** R&D investment level (0-100 scale) */
  rndLevel: number;
  /** Brand awareness 0-100 (driven by marketing spend over time) */
  awareness: number;
  /** Customer accessibility 0-100 (driven by sales force) */
  accessibility: number;
  /** Stock on hand at start of round */
  inventory: number;
  /** Production scheduled for the round */
  productionScheduled: number;
  /** Plant capacity in units (max production per round) */
  capacity: number;
  /** Automation level 1-10 (higher = lower labor cost, higher changeover cost) */
  automation: number;
}

// =====================================================
// Decisions (what a team commits to each round)
// =====================================================

export interface ProductDecision {
  productId: string;
  /** Price the team will charge per unit */
  price: number;
  /** New MTBF target — costs R&D dollars to change */
  mtbf: number;
  /** New position target — costs R&D dollars to move */
  position: { x: number; y: number };
  /** Production schedule (units to build) */
  production: number;
  /** Marketing spend for promo (in ₹000s) */
  promoBudget: number;
  /** Sales force spend (in ₹000s) */
  salesBudget: number;
  /** R&D project investment (in ₹000s) — pushes position/MTBF */
  rndInvestment: number;
  /** Automation investment (in ₹000s) — reduces labor cost */
  automationInvestment: number;
  /** Capacity investment (in ₹000s) — adds plant capacity */
  capacityInvestment: number;
  /** Operations: lean/six-sigma investment (₹000s) — reduces waste */
  leanInvestment: number;
  /** Operations: supplier reliability investment (₹000s) — reduces stockouts */
  supplierInvestment: number;
}

/**
 * Strategic decisions at the corporate level (per team per round).
 * Feeds back into segment attractiveness and long-term score.
 */
export interface StrategyDecision {
  /** Segments the team will prioritize this round (bonus attractiveness) */
  focusSegments: SegmentId[];
  /** ESG / sustainability investment (₹000s) — small long-term boost */
  esgInvestment: number;
  /** R&D pipeline investment for future products (₹000s) */
  pipelineInvestment: number;
  /** Strategic alliance tier (0 = none, 1 = basic, 2 = advanced) */
  allianceTier: number;
  /** Brand-building investment (₹000s) — boosts all products' awareness slightly */
  brandInvestment: number;
}

/**
 * HR decisions at the corporate level (per team per round).
 * Affects productivity, turnover, and unit cost.
 */
export interface HrDecision {
  /** Compensation level multiplier (1.0 = market rate, 1.1 = +10%) */
  compensationIndex: number;
  /** Training investment (₹000s) — boosts productivity */
  trainingInvestment: number;
  /** Benefits & wellness investment (₹000s) — reduces turnover */
  benefitsInvestment: number;
  /** Hiring investment (₹000s) — supports capacity expansion */
  hiringInvestment: number;
  /** Performance bonus pool (₹000s) — short-term productivity boost */
  performanceBonus: number;
}

export interface FinanceDecision {
  /** Short-term debt to issue (or repay if negative) in ₹000s */
  shortTermDebt: number;
  /** Long-term debt to issue (in ₹000s) */
  longTermDebt: number;
  /** Equity to issue (in ₹000s) */
  equityIssue: number;
  /** Dividend per share (in ₹) */
  dividendPerShare: number;
}

export interface TeamDecisions {
  teamId: string;
  round: number;
  productDecisions: ProductDecision[];
  strategy: StrategyDecision;
  hr: HrDecision;
  finance: FinanceDecision;
}

// =====================================================
// Financial Statements
// =====================================================

export interface IncomeStatement {
  revenue: number;
  costOfGoodsSold: number;
  grossMargin: number;
  rndExpense: number;
  marketingExpense: number;
  salesExpense: number;
  adminExpense: number;
  depreciation: number;
  operatingProfit: number;
  interestExpense: number;
  emergencyLoanInterest: number;
  earningsBeforeTax: number;
  tax: number;
  netProfit: number;
  /** Net profit margin (%) */
  netMargin: number;
}

export interface BalanceSheet {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  totalCurrentAssets: number;
  plantAndEquipment: number;
  accumulatedDepreciation: number;
  totalAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalLiabilities: number;
  commonStock: number;
  retainedEarnings: number;
  totalEquity: number;
}

export interface CashFlowStatement {
  operationsCash: number;
  investingCash: number;
  financingCash: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  emergencyLoan: number;
}

export interface FinancialMetrics {
  revenue: number;
  netProfit: number;
  netMargin: number;
  roe: number; // Return on Equity (%)
  roa: number; // Return on Assets (%)
  assetTurnover: number;
  marketShare: number; // (%)
  stockPrice: number;
  marketCap: number;
  emergencyLoanTaken: boolean;
  emergencyLoanAmount: number;
  bankruptcyRisk: number; // 0-100
}

// =====================================================
// Round Result (post-processing snapshot)
// =====================================================

export interface ProductRoundResult {
  productId: string;
  productName: string;
  segment: SegmentId;
  unitsSold: number;
  inventoryLeft: number;
  revenue: number;
  unitCost: number;
  price: number;
  marketShare: number; // share within segment
  customerScore: number; // composite attractiveness 0-100
  stockOut: boolean;
}

export interface TeamRoundResult {
  teamId: string;
  round: number;
  products: ProductRoundResult[];
  income: IncomeStatement;
  balance: BalanceSheet;
  cashFlow: CashFlowStatement;
  metrics: FinancialMetrics;
  alerts: GameAlert[];
}

export interface GameAlert {
  id: string;
  severity: "info" | "warning" | "critical" | "success";
  title: string;
  message: string;
  teamId?: string;
  category: "finance" | "production" | "marketing" | "rnd" | "market" | "system";
}

// =====================================================
// Round History (for charts & leaderboards)
// =====================================================

export interface RoundHistoryEntry {
  round: number;
  teamResults: TeamRoundResult[];
  segmentSnapshots: Segment[];
}

// =====================================================
// Game State
// =====================================================

export interface GameState {
  /** Active game id (used for localStorage key) */
  gameId: string;
  /** Display name of the game session */
  gameName: string;
  /** Current round number (0 = setup, 1+ = played rounds) */
  currentRound: number;
  /** Maximum rounds in the simulation */
  maxRounds: number;
  /** All teams in the game */
  teams: Team[];
  /** All products in the game */
  products: Product[];
  /** Market segments */
  segments: Segment[];
  /** Decisions keyed by `teamId_round` */
  decisions: Record<string, TeamDecisions>;
  /** Round-by-round history (round 0 = initial snapshot) */
  history: RoundHistoryEntry[];
  /** Currently selected team for display (player's team by default) */
  activeTeamId: string;
  /** Game status */
  status: "setup" | "active" | "completed";
  /** Created timestamp */
  createdAt: number;
  /** Last-updated timestamp */
  updatedAt: number;
}

// =====================================================
// View navigation (in-app routing without URL routes)
// =====================================================

export type ViewId =
  | "landing"
  | "dashboard"
  | "strategy"
  | "rnd"
  | "marketing"
  | "operations"
  | "hr"
  | "finance"
  | "results";

// =====================================================
// Engine helper exports
// =====================================================

export interface DemandCalculation {
  productId: string;
  teamId: string;
  segment: SegmentId;
  totalSegmentDemand: number;
  attractivenessScore: number; // 0-1
  demandUnits: number;
  unitsSold: number;
  stockOut: boolean;
  inventoryLeft: number;
  factors: {
    price: number;
    agePosition: number;
    qualityMtbf: number;
    marketing: number;
  };
}
