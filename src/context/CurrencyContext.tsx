"use client";

/**
 * ApexStrategy Enterprise — Currency Context
 * =====================================================
 * Multi-currency support for the simulation.
 *
 *   - Base currency: INR (Indian Rupee) — default
 *   - Supported display currencies: INR, USD, EUR, GBP, JPY, AED, SGD
 *   - All engine math stays in raw numbers (representing INR thousands)
 *   - Display layer converts to the user's selected currency
 *   - Live exchange rates fetched from open.er-api.com (free, no key)
 *     with fallback to static rates if offline
 *
 * Numbering convention:
 *   - INR: Indian numbering (lakhs / crores) — ₹1,23,45,678 or ₹1.23 Cr
 *   - USD/EUR/GBP: Western (millions) — $1.23M
 *   - JPY: No decimals
 *   - All engine values are in thousands of INR (₹000s)
 *
 * Author: ApexStrategy Labs
 */

import * as React from "react";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AED" | "SGD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Number of decimals to display */
  decimals: number;
  /** Use Indian numbering (lakhs/crores) */
  indianNumbering: boolean;
  /** Approximate fallback rate vs INR (1 currency = X INR) */
  fallbackRateFromINR: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    decimals: 0,
    indianNumbering: true,
    fallbackRateFromINR: 1,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    indianNumbering: false,
    fallbackRateFromINR: 1 / 83.5, // 1 USD ≈ 83.5 INR
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    indianNumbering: false,
    fallbackRateFromINR: 1 / 90.2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimals: 2,
    indianNumbering: false,
    fallbackRateFromINR: 1 / 105.8,
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    decimals: 0,
    indianNumbering: false,
    fallbackRateFromINR: 1 / 0.55,
  },
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    decimals: 2,
    indianNumbering: false,
    fallbackRateFromINR: 1 / 22.75,
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    decimals: 2,
    indianNumbering: false,
    fallbackRateFromINR: 1 / 62.1,
  },
};

interface CurrencyContextValue {
  /** Currently selected display currency */
  currency: CurrencyCode;
  /** Set display currency */
  setCurrency: (c: CurrencyCode) => void;
  /** Live exchange rates (1 INR = X target currency) */
  rates: Partial<Record<CurrencyCode, number>>;
  /** True if rates were fetched from live API */
  ratesLive: boolean;
  /** Last update timestamp */
  ratesUpdatedAt: number | null;
  /** Force refresh rates from API */
  refreshRates: () => Promise<void>;
  /** Format a money amount (given in INR thousands) for display */
  fmtMoney: (inrThousands: number, opts?: { compact?: boolean; raw?: boolean }) => string;
  /** Format a price per unit (in INR thousands, displayed as actual currency units) */
  fmtPrice: (inrThousands: number) => string;
  /** Get the currency symbol */
  symbol: string;
}

const CurrencyContext = React.createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = "apexstrategy:currency:v1";
const RATES_CACHE_KEY = "apexstrategy:rates:v1";
const RATES_CACHE_TTL = 1000 * 60 * 60; // 1 hour

// =====================================================
// Indian numbering helper
// =====================================================

function formatIndianNumber(n: number, decimals = 0): string {
  const isNegative = n < 0;
  const abs = Math.abs(n);
  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");

  // Indian numbering: last 3 digits, then groups of 2
  let lastThree = intPart.slice(-3);
  let otherNumbers = intPart.slice(0, -3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  const result = decPart ? `${formatted}.${decPart}` : formatted;
  return isNegative ? `-${result}` : result;
}

function formatWesternNumber(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// =====================================================
// Provider
// =====================================================

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<CurrencyCode>("INR");
  const [rates, setRates] = React.useState<Partial<Record<CurrencyCode, number>>>({});
  const [ratesLive, setRatesLive] = React.useState(false);
  const [ratesUpdatedAt, setRatesUpdatedAt] = React.useState<number | null>(null);

  const refreshRates = React.useCallback(async () => {
    try {
      // open.er-api.com is free, no API key required, returns rates vs USD
      const res = await fetch("https://open.er-api.com/v6/latest/INR", {
        method: "GET",
        // 6 second timeout via AbortController
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.rates) throw new Error("No rates in response");

      // data.rates is { TARGET: rate_from_INR_to_TARGET }
      const newRates: Partial<Record<CurrencyCode, number>> = {};
      (Object.keys(CURRENCIES) as CurrencyCode[]).forEach((code) => {
        if (data.rates[code] != null) {
          newRates[code] = data.rates[code];
        }
      });
      // Always include INR = 1
      newRates.INR = 1;

      setRates(newRates);
      setRatesLive(true);
      setRatesUpdatedAt(Date.now());

      try {
        window.localStorage.setItem(
          RATES_CACHE_KEY,
          JSON.stringify({
            rates: newRates,
            live: true,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // localStorage might be full or blocked
      }
    } catch (e) {
      console.warn("Live rates fetch failed, using fallback:", e);
      // Use fallback rates
      const fallback: Partial<Record<CurrencyCode, number>> = {};
      (Object.keys(CURRENCIES) as CurrencyCode[]).forEach((code) => {
        fallback[code] = CURRENCIES[code].fallbackRateFromINR;
      });
      fallback.INR = 1;
      setRates(fallback);
      setRatesLive(false);
      setRatesUpdatedAt(Date.now());
    }
  }, []);

  // Load saved currency + cached rates from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved && CURRENCIES[saved]) {
        setCurrencyState(saved);
      }

      // Try cached rates first
      const cachedRaw = window.localStorage.getItem(RATES_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached && typeof cached === "object" && cached.timestamp) {
            const age = Date.now() - cached.timestamp;
            if (age < RATES_CACHE_TTL && cached.rates) {
              setRates(cached.rates);
              setRatesLive(cached.live ?? false);
              setRatesUpdatedAt(cached.timestamp);
              // If cache is older than 30 min, refresh in background
              if (age > 30 * 60 * 1000) {
                refreshRates();
              }
              return;
            }
          }
        } catch (e) {
          // Invalid cache, fall through to live fetch
        }
      }
      // No cache — fetch live
      refreshRates();
    } catch (e) {
      console.warn("Currency init failed:", e);
    }
  }, [refreshRates]);

  const setCurrency = React.useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch (e) {
      // ignore
    }
  }, []);

  // Format money: takes INR thousands, returns formatted string in selected currency
  const fmtMoney = React.useCallback(
    (inrThousands: number, opts: { compact?: boolean; raw?: boolean } = {}) => {
      const info = CURRENCIES[currency];
      // Convert from INR thousands to actual INR, then to target currency
      const inrActual = inrThousands * 1000; // e.g., 225889 (thousands) → 225,889,000 INR
      const rate = rates[currency] ?? info.fallbackRateFromINR;
      const targetAmount = inrActual * rate;

      if (opts.raw) {
        // Full precision, no compact
        const numStr = info.indianNumbering
          ? formatIndianNumber(targetAmount, info.decimals)
          : formatWesternNumber(targetAmount, info.decimals);
        return `${info.symbol}${numStr}`;
      }

      if (opts.compact) {
        if (info.indianNumbering) {
          // Indian compact: Lakhs (L) and Crores (Cr)
          if (Math.abs(targetAmount) >= 1_00_00_000) {
            return `${info.symbol}${(targetAmount / 1_00_00_000).toFixed(2)} Cr`;
          }
          if (Math.abs(targetAmount) >= 1_00_000) {
            return `${info.symbol}${(targetAmount / 1_00_000).toFixed(2)} L`;
          }
          if (Math.abs(targetAmount) >= 1_000) {
            return `${info.symbol}${(targetAmount / 1_000).toFixed(1)}K`;
          }
          return `${info.symbol}${targetAmount.toFixed(0)}`;
        } else {
          // Western compact: K, M, B
          if (Math.abs(targetAmount) >= 1_000_000_000) {
            return `${info.symbol}${(targetAmount / 1_000_000_000).toFixed(2)}B`;
          }
          if (Math.abs(targetAmount) >= 1_000_000) {
            return `${info.symbol}${(targetAmount / 1_000_000).toFixed(2)}M`;
          }
          if (Math.abs(targetAmount) >= 1_000) {
            return `${info.symbol}${(targetAmount / 1_000).toFixed(1)}K`;
          }
          return `${info.symbol}${targetAmount.toFixed(info.decimals)}`;
        }
      }

      // Default: full number
      const numStr = info.indianNumbering
        ? formatIndianNumber(targetAmount, info.decimals)
        : formatWesternNumber(targetAmount, info.decimals);
      return `${info.symbol}${numStr}`;
    },
    [currency, rates]
  );

  // Format price per unit (inrThousands → display currency, but small numbers)
  const fmtPrice = React.useCallback(
    (inrThousands: number) => {
      const info = CURRENCIES[currency];
      // Per-unit prices are already small (e.g., ₹28K = ₹28,000), so we treat
      // inrThousands as the actual amount in INR for per-unit display
      const inrActual = inrThousands * 1000;
      const rate = rates[currency] ?? info.fallbackRateFromINR;
      const targetAmount = inrActual * rate;
      const numStr = info.indianNumbering
        ? formatIndianNumber(targetAmount, info.decimals)
        : formatWesternNumber(targetAmount, info.decimals);
      return `${info.symbol}${numStr}`;
    },
    [currency, rates]
  );

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    rates,
    ratesLive,
    ratesUpdatedAt,
    refreshRates,
    fmtMoney,
    fmtPrice,
    symbol: CURRENCIES[currency].symbol,
  };

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

// =====================================================
// Hook
// =====================================================

export function useCurrency(): CurrencyContextValue {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}

// =====================================================
// Static formatter (for non-React contexts, falls back to INR)
// =====================================================

export function formatMoneyStatic(inrThousands: number, currency: CurrencyCode = "INR"): string {
  const info = CURRENCIES[currency];
  const inrActual = inrThousands * 1000;
  const targetAmount = inrActual * info.fallbackRateFromINR;
  if (info.indianNumbering) {
    if (Math.abs(targetAmount) >= 1_00_00_000) {
      return `${info.symbol}${(targetAmount / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (Math.abs(targetAmount) >= 1_00_000) {
      return `${info.symbol}${(targetAmount / 1_00_000).toFixed(2)} L`;
    }
  }
  const numStr = info.indianNumbering
    ? formatIndianNumber(targetAmount, info.decimals)
    : formatWesternNumber(targetAmount, info.decimals);
  return `${info.symbol}${numStr}`;
}
