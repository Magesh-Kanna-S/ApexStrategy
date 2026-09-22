/**
 * ApexStrategy Enterprise — Shared UI helpers
 *
 * Money is in INR thousands throughout the engine. These helpers
 * are fallback formatters; the live app uses useCurrency().fmtMoney
 * for proper multi-currency display.
 */

import type { CurrencyCode } from "@/context/CurrencyContext";
import { formatMoneyStatic } from "@/context/CurrencyContext";

export function fmtMoney(v: number, opts: { compact?: boolean } = {}): string {
  // Fallback static format in INR — views should prefer useCurrency().fmtMoney
  void opts;
  return formatMoneyStatic(v, "INR");
}

export function fmtMoneyRaw(v: number): string {
  return formatMoneyStatic(v, "INR");
}

export function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`;
}

export function fmtNum(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPrice(v: number): string {
  // Per-unit price (in INR thousands)
  return formatMoneyStatic(v, "INR");
}

export function fmtSigned(v: number, suffix = "K"): string {
  const s = v >= 0 ? "+" : "";
  return `${s}$${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}${suffix}`;
}

// Currency code type re-export
export type { CurrencyCode };
