"use client";

/**
 * ApexStrategy Enterprise — Root Page
 * Wires GameProvider + Navigation + view router.
 * Uses in-app state-based view switching (no URL routes)
 * for instant client-side navigation and zero-setup.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameProvider, useGame } from "@/context/GameContext";
import { Navigation } from "@/components/Navigation";
import { LandingView } from "@/components/views/LandingView";
import { DashboardView } from "@/components/views/DashboardView";
import { RndView } from "@/components/views/RndView";
import { MarketingView } from "@/components/views/MarketingView";
import { ProductionView } from "@/components/views/ProductionView";
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
            {view === "rnd" && <RndView />}
            {view === "marketing" && <MarketingView />}
            {view === "production" && <ProductionView />}
            {view === "finance" && <FinanceView />}
            {view === "results" && <ResultsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
