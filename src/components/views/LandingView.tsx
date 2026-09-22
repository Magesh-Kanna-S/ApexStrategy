"use client";

/**
 * ApexStrategy Enterprise — Landing View
 * Executive landing page with:
 *   - Hero section with brand & tagline
 *   - New Game setup (game name, max rounds)
 *   - Load Game list (from localStorage)
 *   - Feature highlights
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Rocket,
  History,
  Trash2,
  ArrowRight,
  Zap,
  TrendingUp,
  Cpu,
  ShieldCheck,
  PlayCircle,
  Linkedin,
  Globe,
  Crown,
} from "lucide-react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LandingView() {
  const { savedGames, newGame, loadGame, deleteGame } = useGame();
  const [gameName, setGameName] = React.useState("Apex Q4 Strategy");
  const [maxRounds, setMaxRounds] = React.useState("8");

  const handleCreate = () => {
    newGame(gameName, parseInt(maxRounds, 10));
  };

  return (
    <div className="min-h-screen apex-hero-bg">
      <div className="apex-grid min-h-screen">
        {/* ── Top brand bar ── */}
        <div className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-sm">
                  ApexStrategy <span className="text-primary">Enterprise</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Corporate Simulation Suite
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Zero-Setup · Client-Side
            </Badge>
          </div>
        </div>

        {/* ── Hero ── */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 bg-muted/60 border-border/60">
              <Zap className="h-3 w-3 mr-1 text-chart-2" />
              Enterprise Strategy · Multi-Currency · AI Competitors
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              Run Your Enterprise.
              <br />
              <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-4 bg-clip-text text-transparent">
                Master the Market.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              A modern, multi-department corporate business simulation platform with reactive
              live proformas, multi-currency financials (INR / USD), AI competitors, and a
              sleek financial-terminal UI. Pure browser-based strategy — no setup required.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {[
              { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Live Proformas" },
              { icon: <Cpu className="h-3.5 w-3.5" />, label: "Weighted Demand Engine" },
              { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Auto-Save to LocalStorage" },
              { icon: <Zap className="h-3.5 w-3.5" />, label: "AI Competitors" },
            ].map((f) => (
              <Badge key={f.label} variant="outline" className="gap-1.5 px-3 py-1.5">
                {f.icon}
                {f.label}
              </Badge>
            ))}
          </motion.div>
        </section>

        {/* ── Game setup grid ── */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid md:grid-cols-2 gap-6">
            {/* ── New Game card ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card className="apex-card apex-card-hover h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="grid place-items-center h-10 w-10 rounded-lg bg-primary/15 text-primary">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">New Game</CardTitle>
                      <CardDescription>Launch a fresh simulation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-name" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Game Name
                    </Label>
                    <Input
                      id="game-name"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      placeholder="e.g. Apex Q4 Strategy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rounds" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Number of Rounds
                    </Label>
                    <Select value={maxRounds} onValueChange={setMaxRounds}>
                      <SelectTrigger id="rounds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 rounds — Quick Match</SelectItem>
                        <SelectItem value="6">6 rounds — Standard</SelectItem>
                        <SelectItem value="8">8 rounds — Full Course (recommended)</SelectItem>
                        <SelectItem value="12">12 rounds — Marathon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-3">
                      You will compete against 3 AI-driven companies across 5 market segments.
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleCreate}
                    className="w-full gap-2 apex-glow"
                    size="lg"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Launch Simulation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* ── Load Game card ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Card className="apex-card h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="grid place-items-center h-10 w-10 rounded-lg bg-chart-4/15 text-chart-4">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Load Game</CardTitle>
                      <CardDescription>Resume a saved simulation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedGames.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="grid place-items-center h-12 w-12 rounded-full bg-muted mb-3">
                        <History className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">No saved games yet</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Start your first simulation — it will auto-save to your browser
                        so you can return anytime.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto apex-scroll">
                      {savedGames.map((g) => {
                        const lastRound = g.history[g.history.length - 1];
                        const playerTeam = g.teams.find((t) => t.isPlayer);
                        const playerResult = lastRound?.teamResults.find(
                          (r) => r.teamId === playerTeam?.id
                        );
                        return (
                          <div
                            key={g.gameId}
                            className="group flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card/50 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                          >
                            <div
                              className="h-10 w-1 rounded-full"
                              style={{ background: playerTeam?.color ?? "var(--primary)" }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm truncate">
                                  {g.gameName}
                                </span>
                                <Badge variant="outline" className="text-[9px] h-4 py-0">
                                  R{g.currentRound}/{g.maxRounds}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {g.status === "completed" ? (
                                  <span className="text-chart-2">Completed</span>
                                ) : (
                                  <span>In progress</span>
                                )}
                                {playerResult && (
                                  <span>
                                    {" · Stock "}
                                    <span className="tabular-nums text-foreground">
                                      ${playerResult.metrics.stockPrice.toFixed(2)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadGame(g.gameId)}
                                className="h-8 px-2"
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteGame(g.gameId)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── How it works ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">How it works</h2>
              <p className="text-sm text-muted-foreground">
                Four departments. Five segments. Eight rounds to glory.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <TrendingUp className="h-5 w-5" />, title: "1. Make Decisions", desc: "Set prices, R&D, marketing, and production across your portfolio." },
                { icon: <Zap className="h-5 w-5" />, title: "2. Watch Live Proformas", desc: "See financial impact instantly as you tweak any input field." },
                { icon: <PlayCircle className="h-5 w-5" />, title: "3. Process Round", desc: "Engine computes demand, P&L, balance sheet, and stock price." },
                { icon: <TrendingUp className="h-5 w-5" />, title: "4. Review & Iterate", desc: "Read alerts, study charts, and refine for the next round." },
              ].map((s) => (
                <div
                  key={s.title}
                  className="apex-card p-5"
                >
                  <div className="grid place-items-center h-10 w-10 rounded-lg bg-primary/15 text-primary mb-3">
                    {s.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Footer with creator credits ── */}
        <footer className="border-t border-border/40 mt-12">
          <div className="mx-auto max-w-6xl px-6 py-10">
            {/* Creator card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-xl"
            >
              <div className="apex-card apex-card-hover relative overflow-hidden p-5 sm:p-6 border-border/60">
                {/* Accent strip */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-chart-1 to-chart-4" />

                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-chart-1 text-white shadow-lg shadow-primary/30">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-chart-1 border-2 border-background grid place-items-center">
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-11" />
                      </svg>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Creator &amp; Designer
                    </span>
                    <b className="block text-lg font-semibold tracking-tight mt-0.5">
                      Magesh Kanna S
                    </b>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <a
                        href="https://www.linkedin.com/in/magesh-kanna-s/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/20 hover:border-primary/50 transition-colors"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                      <a
                        href="https://magesh-kanna-s.github.io/portfolio/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-chart-1 bg-chart-1/10 border border-chart-1/30 px-3 py-1.5 rounded-lg hover:bg-chart-1/20 hover:border-chart-1/50 transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Portfolio
                      </a>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground leading-relaxed">
                  Concept, system architecture &amp; interface design of{" "}
                  <span className="font-semibold text-foreground">ApexStrategy Enterprise</span>.
                </div>
              </div>
            </motion.div>

            {/* Footer text */}
            <div className="mt-8 text-center text-xs text-muted-foreground">
              <p className="mb-1">
                ApexStrategy Enterprise · Multi-department corporate business simulation
              </p>
              <p className="opacity-70">
                Client-side engine · Saves to your browser&apos;s LocalStorage · No setup required
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
