/**
 * ApexStrategy Enterprise — Shared UI helpers
 * Money is in $000s throughout the engine. These helpers
 * format numbers for display.
 */

export function fmtMoney(v: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}B`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}M`;
  }
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}K`;
}

export function fmtMoneyRaw(v: number): string {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`;
}

export function fmtNum(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPrice(v: number): string {
  return `$${v.toFixed(2)}`;
}

export function fmtSigned(v: number, suffix = "K"): string {
  const s = v >= 0 ? "+" : "";
  return `${s}$${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}${suffix}`;
}
