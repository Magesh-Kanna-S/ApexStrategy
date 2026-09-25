"use client";

/**
 * ApexStrategy Enterprise — Navigation
 * Top header navbar with:
 *   - Brand logo
 *   - Tab switcher for all views
 *   - Round countdown / progress
 *   - Active-team switcher
 *   - Process Next Round CTA
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  Compass,
  FlaskConical,
  Megaphone,
  Factory,
  Users,
  Landmark,
  Trophy,
  PlayCircle,
  ChevronDown,
  CheckCircle2,
  Coins,
  Home,
  LogOut,
} from "lucide-react";
import { useGame } from "@/context/GameContext";
import { useCurrency, CURRENCIES } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import type { CurrencyCode } from "@/context/CurrencyContext";
import type { ViewId } from "@/types/game";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "strategy", label: "Strategy", icon: <Compass className="h-4 w-4" /> },
  { id: "rnd", label: "R&D", icon: <FlaskConical className="h-4 w-4" /> },
  { id: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
  { id: "operations", label: "Operations", icon: <Factory className="h-4 w-4" /> },
  { id: "hr", label: "HR", icon: <Users className="h-4 w-4" /> },
  { id: "finance", label: "Finance", icon: <Landmark className="h-4 w-4" /> },
  { id: "results", label: "Results", icon: <Trophy className="h-4 w-4" /> },
];

export function Navigation() {
  const {
    state,
    view,
    setView,
    goHome,
    activeTeamId,
    setActiveTeamId,
    processNextRound,
    canProcessRound,
  } = useGame();
  const { currency, setCurrency, ratesLive } = useCurrency();
  const { user, signOut } = useAuth();

  if (!state) return null;

  const round = state.currentRound;
  const maxRounds = state.maxRounds;
  const progressPct = (round / maxRounds) * 100;
  const activeTeam = state.teams.find((t) => t.id === activeTeamId) ?? state.teams[0];
  const currencyInfo = CURRENCIES[currency];
  const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 lg:px-6">
        {/* ── Row 1: brand + round indicator + team + CTA ── */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand + Home button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <Building2 className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-chart-1 apex-live-dot" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-semibold text-sm tracking-tight">
                  ApexStrategy <span className="text-primary">Enterprise</span>
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Corporate Simulation
                </span>
              </div>
            </button>
            {/* Home button — exits current game and returns to landing */}
            <Button
              variant="ghost"
              size="sm"
              onClick={goHome}
              className="gap-1.5 ml-1"
              title="Back to home"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>

          {/* Round indicator (center, desktop only) */}
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted/50 border border-border/60">
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Round
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {round} <span className="text-muted-foreground font-normal">/ {maxRounds}</span>
              </span>
            </div>
            <div className="relative h-2 w-32 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-chart-1"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <AnimatePresence mode="wait">
              {state.status === "completed" ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 border-chart-2/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Badge variant="outline" className="border-chart-1/30 text-chart-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-chart-1 mr-1 apex-live-dot" />
                    Active
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: currency switcher + team switcher + process round */}
          <div className="flex items-center gap-2">
            {/* Currency switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="font-semibold">{currencyInfo.symbol}</span>
                  <span className="hidden lg:inline text-[11px] text-muted-foreground">{currency}</span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      ratesLive ? "bg-chart-1 apex-live-dot" : "bg-chart-2"
                    )}
                    title={ratesLive ? "Live exchange rates" : "Using fallback rates"}
                  />
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs">
                  Display Currency {ratesLive ? "· Live rates" : "· Fallback rates"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                  const info = CURRENCIES[code];
                  return (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => setCurrency(code)}
                      className="gap-2 cursor-pointer"
                    >
                      <span className="font-semibold w-5">{info.symbol}</span>
                      <span className="flex-1">
                        <span className="font-medium">{code}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{info.name}</span>
                      </span>
                      {code === currency && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
                  Rates fetched live from open.er-api.com · cached 1 hour.
                  Engine math always in INR.
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{activeTeam.name}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: activeTeam.color }} />
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Switch Team View</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {state.teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => setActiveTeamId(team.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: team.color }}
                    />
                    <span className="flex-1">{team.name}</span>
                    {team.isPlayer && (
                      <Badge variant="secondary" className="text-[9px] py-0 h-4">
                        YOU
                      </Badge>
                    )}
                    {team.id === activeTeamId && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={processNextRound}
              disabled={!canProcessRound}
              size="sm"
              className="gap-2 apex-glow"
            >
              <PlayCircle className="h-4 w-4" />
              <span className="hidden sm:inline">
                {state.status === "completed" ? "Game Complete" : "Process Next Round"}
              </span>
              <span className="sm:hidden">Next</span>
            </Button>

            {/* User avatar + logout */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="grid place-items-center h-9 w-9 rounded-full text-white font-bold text-sm shadow-md transition-transform hover:scale-105"
                  style={{ background: user?.avatarColor ?? "var(--primary)" }}
                  title={user?.name ? `Signed in as ${user.name}` : "Account"}
                >
                  {userInitial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground text-sm">{user?.name ?? "User"}</span>
                    <span className="text-muted-foreground font-normal">{user?.email ?? ""}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={goHome}
                  className="gap-2 cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5" />
                  Back to Home
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={signOut}
                  className="gap-2 cursor-pointer text-chart-3 focus:text-chart-3"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Row 2: tab nav ── */}
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto apex-scroll">
          {NAV_ITEMS.map((item) => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
