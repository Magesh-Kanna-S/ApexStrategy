"use client";

/**
 * ApexStrategy Enterprise — Auth View
 * Login / Sign-up screen. Renders the brand hero on the left
 * and the auth form on the right. Doubles as the gate before
 * reaching the landing page.
 *
 * Features:
 *   - Sign in / Sign up toggle
 *   - One-click Demo Login (pre-seeded account)
 *   - Show / hide password
 *   - Creator credits footer
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Zap,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
  Linkedin,
  Globe,
  Sparkles,
} from "lucide-react";
import { useAuth, DEMO_EMAIL, DEMO_PASSWORD } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Mode = "signin" | "signup";

export function AuthView() {
  const { signIn, signUp, demoSignIn, toast } = useAuth();
  const [mode, setMode] = React.useState<Mode>("signin");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setTimeout(() => {
      const result = mode === "signin"
        ? signIn(email, password)
        : signUp(name, email, password);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error || "Something went wrong");
      } else {
        toast(mode === "signin" ? "Welcome back!" : "Account created — welcome!", "success");
      }
    }, 350);
  };

  const handleDemoLogin = () => {
    setError(null);
    setSubmitting(true);
    setTimeout(() => {
      const result = demoSignIn();
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error || "Demo login failed");
      } else {
        toast("Signed in as Demo Executive", "success");
      }
    }, 350);
  };

  const fillDemoCredentials = () => {
    setMode("signin");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
  };

  return (
    <div className="min-h-screen apex-hero-bg">
      <div className="apex-grid min-h-screen grid lg:grid-cols-2">
        {/* ── Left: brand hero ── */}
        <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border/40">
          {/* Top brand */}
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-1 text-white shadow-lg shadow-primary/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-base">
                ApexStrategy <span className="text-primary">Enterprise</span>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Corporate Simulation Suite
              </div>
            </div>
          </div>

          {/* Center hero */}
          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight mb-4"
            >
              Run Your Enterprise.
              <br />
              <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-4 bg-clip-text text-transparent">
                Master the Market.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-base text-muted-foreground leading-relaxed mb-8"
            >
              A multi-department corporate business simulation platform with reactive
              live proformas, multi-currency financials, AI competitors, and integrated
              MBA functional departments.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Live Proformas" },
                { icon: <Cpu className="h-3.5 w-3.5" />, label: "6 MBA Departments" },
                { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Multi-Currency" },
                { icon: <Zap className="h-3.5 w-3.5" />, label: "AI Competitors" },
              ].map((f) => (
                <Badge key={f.label} variant="outline" className="gap-1.5 px-3 py-1.5">
                  {f.icon}
                  {f.label}
                </Badge>
              ))}
            </motion.div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { v: "6", l: "Departments" },
              { v: "5", l: "Segments" },
              { v: "7", l: "Currencies" },
            ].map((s) => (
              <div key={s.l} className="apex-card p-3 text-center">
                <div className="text-2xl font-bold tabular-nums text-primary">{s.v}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: auth form + creator footer ── */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile brand */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-1 text-white shadow-lg shadow-primary/30">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-base">
                  ApexStrategy <span className="text-primary">Enterprise</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Corporate Simulation Suite
                </div>
              </div>
            </div>

            <div className="apex-card p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-2xl font-semibold tracking-tight mb-1">
                    {mode === "signin" ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {mode === "signin"
                      ? "Sign in to continue to your simulations."
                      : "Sign up to start running your enterprise."}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Full Name
                        </Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Magesh Kanna S"
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-9 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-chart-3 bg-chart-3/10 border border-chart-3/30 rounded-lg px-3 py-2"
                      >
                        {error}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 apex-glow"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          {mode === "signin" ? "Sign In" : "Create Account"}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* ── Demo Login divider ── */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">
                        or try instantly
                      </span>
                    </div>
                  </div>

                  {/* Demo Login button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={handleDemoLogin}
                    disabled={submitting}
                  >
                    <Sparkles className="h-4 w-4" />
                    Demo Login — Skip Sign Up
                  </Button>

                  {/* Demo credentials hint */}
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Demo credentials — <span className="font-mono text-primary">{DEMO_EMAIL}</span> / <span className="font-mono text-primary">{DEMO_PASSWORD}</span>
                      <span className="ml-1 underline">(click to fill)</span>
                    </button>
                  </div>

                  {/* Mode switch */}
                  <div className="mt-5 pt-5 border-t border-border/40 text-center text-sm">
                    {mode === "signin" ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          onClick={switchMode}
                          className="text-primary font-semibold hover:underline"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          onClick={switchMode}
                          className="text-primary font-semibold hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-4">
              Credentials are stored locally in your browser — no server, no email verification.
            </p>

            {/* ── Creator credits footer ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6"
            >
              <div className="apex-card relative overflow-hidden p-4 border-border/40">
                {/* Accent strip */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-chart-1 to-chart-4" />

                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-chart-1 text-white shadow-lg shadow-primary/30">
                      <Crown className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                      Creator &amp; Designer
                    </span>
                    <b className="block text-base font-semibold tracking-tight mt-0.5">
                      Magesh Kanna S
                    </b>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <a
                        href="https://www.linkedin.com/in/magesh-kanna-s/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-md hover:bg-primary/20 hover:border-primary/50 transition-colors"
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                      </a>
                      <a
                        href="https://magesh-kanna-s.github.io/portfolio/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-chart-1 bg-chart-1/10 border border-chart-1/30 px-2.5 py-1 rounded-md hover:bg-chart-1/20 hover:border-chart-1/50 transition-colors"
                      >
                        <Globe className="h-3 w-3" />
                        Portfolio
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
