"use client";

/**
 * ApexStrategy Enterprise — Root Page
 * Wires AuthProvider + CurrencyProvider + GameProvider +
 * Navigation + view router.
 *
 * Auth gate: if no user is signed in, render the AuthView
 * (login / sign-up). Once authenticated, render the game
 * shell with in-app state-based view switching.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { GameProvider, useGame } from "@/context/GameContext";
import { Navigation } from "@/components/Navigation";
import { AuthView } from "@/components/views/AuthView";
import { LandingView } from "@/components/views/LandingView";
import { DashboardView } from "@/components/views/DashboardView";
import { RndView } from "@/components/views/RndView";
import { MarketingView } from "@/components/views/MarketingView";
import { OperationsView } from "@/components/views/OperationsView";
import { HrView } from "@/components/views/HrView";
import { StrategyView } from "@/components/views/StrategyView";
import { FinanceView } from "@/components/views/FinanceView";
import { ResultsView } from "@/components/views/ResultsView";

function GameShell() {
  const { state, view, isLoaded } = useGame();

  // Show landing when no game is active
  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            Initializing ApexStrategy
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return <LandingView />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {view === "landing" && <LandingView />}
            {view === "dashboard" && <DashboardView />}
            {view === "strategy" && <StrategyView />}
            {view === "rnd" && <RndView />}
            {view === "marketing" && <MarketingView />}
            {view === "operations" && <OperationsView />}
            {view === "hr" && <HrView />}
            {view === "finance" && <FinanceView />}
            {view === "results" && <ResultsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, isLoaded } = useAuth();

  // Loading state while session is being restored
  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            Loading session
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated → show login / sign-up
  if (!user) {
    return <AuthView />;
  }

  // Authenticated → show the game shell
  return <GameShell />;
}

export default function Home() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <GameProvider>
          <AuthGate />
        </GameProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
