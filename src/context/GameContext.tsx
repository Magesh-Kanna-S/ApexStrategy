"use client";

/**
 * ApexStrategy Enterprise — Game Context
 * =====================================================
 * Central state store for the simulation. Handles:
 *   - Game creation, loading, and deletion
 *   - Multi-round progression
 *   - Decision drafting & persistence per round
 *   - Auto-sync to window.localStorage
 *   - View navigation (in-app routing without URL routes)
 *   - Team switching for spectator / instructor mode
 *
 * All money values in $000s.
 */

import * as React from "react";
import type {
  GameState,
  Team,
  TeamDecisions,
  ViewId,
  ProductDecision,
  FinanceDecision,
} from "@/types/game";
import {
  createDefaultProducts,
  createDefaultSegments,
  createDefaultTeams,
  createRound0Snapshot,
  processRound,
  generateAIDecisions,
} from "@/engine/simulationEngine";

const STORAGE_KEY = "apexstrategy:games:v1";
const ACTIVE_KEY = "apexstrategy:active:v1";

// =====================================================
// Default draft decisions (sensible Round-1 starting point)
// =====================================================

export function buildDefaultDraftDecisions(state: GameState, teamId: string): TeamDecisions {
  const teamProducts = state.products.filter((p) => p.teamId === teamId);
  const productDecisions: ProductDecision[] = teamProducts.map((p) => {
    const seg = state.segments.find((s) => s.id === p.segment)!;
    const targetShare = 1 / state.teams.length;
    const productionTarget = Math.round(seg.totalDemand * targetShare * 0.85);
    return {
      productId: p.id,
      price: p.price,
      mtbf: p.mtbf,
      position: { ...p.position },
      production: Math.min(productionTarget, p.capacity),
      promoBudget: 1200,
      salesBudget: 1000,
      rndInvestment: p.age > 1.5 ? 800 : 400,
      automationInvestment: 0,
      capacityInvestment: 0,
    };
  });

  const finance: FinanceDecision = {
    shortTermDebt: 0,
    longTermDebt: 0,
    equityIssue: 0,
    dividendPerShare: 0,
  };

  return {
    teamId,
    round: state.currentRound + 1,
    productDecisions,
    finance,
  };
}

// =====================================================
// Create a fresh game
// =====================================================

function createNewGameState(gameName: string, maxRounds: number = 8): GameState {
  const teams = createDefaultTeams();
  const segments = createDefaultSegments();
  const products = createDefaultProducts(teams);

  const state: GameState = {
    gameId: `game-${Date.now()}`,
    gameName,
    currentRound: 0,
    maxRounds,
    teams,
    products,
    segments,
    decisions: {},
    history: [],
    activeTeamId: teams[0].id,
    status: "setup",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Seed Round 0 snapshot
  state.history.push(createRound0Snapshot(state));
  return state;
}

// =====================================================
// Context shape
// =====================================================

interface GameContextValue {
  // ── Game state ──────────────────────────────────
  state: GameState | null;
  isLoaded: boolean;

  // ── View navigation ─────────────────────────────
  view: ViewId;
  setView: (v: ViewId) => void;

  // ── Saved games ─────────────────────────────────
  savedGames: GameState[];
  newGame: (name: string, maxRounds?: number) => void;
  loadGame: (gameId: string) => void;
  deleteGame: (gameId: string) => void;
  resetGame: () => void;

  // ── Decision drafting ───────────────────────────
  draftDecisions: Record<string, TeamDecisions>; // keyed by teamId
  updateProductDecision: (teamId: string, productId: string, patch: Partial<ProductDecision>) => void;
  updateFinanceDecision: (teamId: string, patch: Partial<FinanceDecision>) => void;
  resetDraftToDefaults: (teamId: string) => void;
  importDecisionFromAI: (teamId: string) => void;

  // ── Round processing ────────────────────────────
  processNextRound: () => void;
  canProcessRound: boolean;

  // ── Team switching ──────────────────────────────
  activeTeamId: string;
  setActiveTeamId: (id: string) => void;

  // ── Toast notifications ─────────────────────────
  toast: (msg: string, type?: "default" | "success" | "error" | "warning") => void;
}

const GameContext = React.createContext<GameContextValue | undefined>(undefined);

// =====================================================
// Provider
// =====================================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<GameState | null>(null);
  const [savedGames, setSavedGames] = React.useState<GameState[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [view, setView] = React.useState<ViewId>("landing");
  const [draftDecisions, setDraftDecisions] = React.useState<Record<string, TeamDecisions>>({});
  const [activeTeamId, setActiveTeamId] = React.useState<string>("");

  // ── Toast helper (uses sonner via window if available) ─────
  const toast = React.useCallback(
    (msg: string, type: "default" | "success" | "error" | "warning" = "default") => {
      if (typeof window !== "undefined") {
        // Lazy import to keep bundle clean
        import("sonner").then((s) => {
          if (type === "success") s.toast.success(msg);
          else if (type === "error") s.toast.error(msg);
          else if (type === "warning") s.toast.warning(msg);
          else s.toast(msg);
        });
      }
    },
    []
  );

  // ── Load saved games from localStorage on mount ────────────
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: GameState[] = raw ? JSON.parse(raw) : [];
      setSavedGames(parsed);

      const activeId = window.localStorage.getItem(ACTIVE_KEY);
      if (activeId) {
        const active = parsed.find((g) => g.gameId === activeId);
        if (active) {
          setState(active);
          setActiveTeamId(active.activeTeamId);
          setView("dashboard");
        }
      }
    } catch (e) {
      console.error("Failed to load saved games:", e);
    }
    setIsLoaded(true);
  }, []);

  // ── Persist state to localStorage whenever it changes ─────
  // NOTE: We intentionally only depend on `state` here, not on
  // `savedGames`, because we update savedGames *inside* this effect.
  // Adding it to the deps would cause an infinite update loop.
  const savedGamesRef = React.useRef<GameState[]>([]);
  savedGamesRef.current = savedGames;

  React.useEffect(() => {
    if (!state) return;
    try {
      const updated = { ...state, updatedAt: Date.now() };
      const others = savedGamesRef.current.filter((g) => g.gameId !== state.gameId);
      const newList = [updated, ...others];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      window.localStorage.setItem(ACTIVE_KEY, state.gameId);
      setSavedGames(newList);
    } catch (e) {
      console.error("Failed to persist state:", e);
    }
  }, [state]);

  // ── Game lifecycle ─────────────────────────────────────────
  const newGame = React.useCallback((name: string, maxRounds: number = 8) => {
    const fresh = createNewGameState(name || "New ApexStrategy Game", maxRounds);
    setState(fresh);
    setActiveTeamId(fresh.activeTeamId);
    // Initialize draft decisions for all teams
    const drafts: Record<string, TeamDecisions> = {};
    for (const t of fresh.teams) {
      drafts[t.id] = buildDefaultDraftDecisions(fresh, t.id);
    }
    setDraftDecisions(drafts);
    setView("dashboard");
    toast(`Game "${fresh.gameName}" created`, "success");
  }, [toast]);

  const loadGame = React.useCallback((gameId: string) => {
    const target = savedGames.find((g) => g.gameId === gameId);
    if (target) {
      setState(target);
      setActiveTeamId(target.activeTeamId);
      // Rebuild drafts from last known decisions if available
      const drafts: Record<string, TeamDecisions> = {};
      for (const t of target.teams) {
        const existing = target.decisions[`${t.id}_${target.currentRound + 1}`];
        drafts[t.id] = existing ?? buildDefaultDraftDecisions(target, t.id);
      }
      setDraftDecisions(drafts);
      setView("dashboard");
      toast(`Loaded "${target.gameName}"`, "success");
    }
  }, [savedGames, toast]);

  const deleteGame = React.useCallback((gameId: string) => {
    setSavedGames((prev) => {
      const next = prev.filter((g) => g.gameId !== gameId);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (state?.gameId === gameId) {
      setState(null);
      setView("landing");
    }
    toast("Game deleted", "default");
  }, [state, toast]);

  const resetGame = React.useCallback(() => {
    setState(null);
    setDraftDecisions({});
    setView("landing");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVE_KEY);
    }
  }, []);

  // ── Decision drafting ──────────────────────────────────────
  const updateProductDecision = React.useCallback(
    (teamId: string, productId: string, patch: Partial<ProductDecision>) => {
      setDraftDecisions((prev) => {
        const teamDraft = prev[teamId];
        if (!teamDraft) return prev;
        const updated: TeamDecisions = {
          ...teamDraft,
          productDecisions: teamDraft.productDecisions.map((d) =>
            d.productId === productId ? { ...d, ...patch } : d
          ),
        };
        return { ...prev, [teamId]: updated };
      });
    },
    []
  );

  const updateFinanceDecision = React.useCallback(
    (teamId: string, patch: Partial<FinanceDecision>) => {
      setDraftDecisions((prev) => {
        const teamDraft = prev[teamId];
        if (!teamDraft) return prev;
        return {
          ...prev,
          [teamId]: {
            ...teamDraft,
            finance: { ...teamDraft.finance, ...patch },
          },
        };
      });
    },
    []
  );

  const resetDraftToDefaults = React.useCallback(
    (teamId: string) => {
      if (!state) return;
      setDraftDecisions((prev) => ({
        ...prev,
        [teamId]: buildDefaultDraftDecisions(state, teamId),
      }));
      toast("Decisions reset to defaults", "default");
    },
    [state, toast]
  );

  const importDecisionFromAI = React.useCallback(
    (teamId: string) => {
      if (!state) return;
      const team = state.teams.find((t) => t.id === teamId);
      if (!team) return;
      const aiDec = generateAIDecisions(team, state.currentRound + 1, state);
      setDraftDecisions((prev) => ({ ...prev, [teamId]: aiDec }));
      toast("Auto-filled decisions with AI strategy", "success");
    },
    [state, toast]
  );

  // ── Round processing ───────────────────────────────────────
  const processNextRound = React.useCallback(() => {
    if (!state) return;
    if (state.status === "completed") {
      toast("Game already completed", "warning");
      return;
    }

    // Gather all decisions: player draft + AI-generated
    const allDecisions: TeamDecisions[] = state.teams.map((team) => {
      if (team.isAI) {
        // Always regenerate AI decisions (they evolve with state)
        return generateAIDecisions(team, state.currentRound + 1, state);
      }
      // Player team — use draft, fall back to defaults
      return draftDecisions[team.id] ?? buildDefaultDraftDecisions(state, team.id);
    });

    try {
      const newState = processRound(state, allDecisions);
      setState(newState);

      // Reset drafts for next round
      const nextDrafts: Record<string, TeamDecisions> = {};
      for (const t of newState.teams) {
        if (!t.isAI) {
          nextDrafts[t.id] = buildDefaultDraftDecisions(newState, t.id);
        }
      }
      setDraftDecisions(nextDrafts);

      const round = newState.currentRound;
      if (newState.status === "completed") {
        toast(`Game complete! Final round ${round} processed.`, "success");
        setView("results");
      } else {
        toast(`Round ${round} processed — view results in the Results tab.`, "success");
      }
    } catch (e) {
      console.error("Round processing failed:", e);
      toast("Failed to process round. Check console for details.", "error");
    }
  }, [state, draftDecisions, toast]);

  // Auto-update active team when state changes
  React.useEffect(() => {
    if (state && !state.teams.find((t) => t.id === activeTeamId)) {
      setActiveTeamId(state.teams[0]?.id ?? "");
    }
  }, [state, activeTeamId]);

  const value: GameContextValue = {
    state,
    isLoaded,
    view,
    setView,
    savedGames,
    newGame,
    loadGame,
    deleteGame,
    resetGame,
    draftDecisions,
    updateProductDecision,
    updateFinanceDecision,
    resetDraftToDefaults,
    importDecisionFromAI,
    processNextRound,
    canProcessRound: !!state && state.status !== "completed",
    activeTeamId: activeTeamId || state?.activeTeamId || "",
    setActiveTeamId,
    toast,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// =====================================================
// Hook
// =====================================================

export function useGame(): GameContextValue {
  const ctx = React.useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
}
