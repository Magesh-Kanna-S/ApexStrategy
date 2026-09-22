# ApexStrategy Enterprise

A modern, production-ready, multi-department **corporate business simulation** platform — featuring reactive live proformas, multi-currency support (INR default, USD, plus live exchange rates), AI competitors, integrated MBA functional departments (Strategy, R&D, Marketing, Operations, HR, Finance), and a sleek financial-terminal UI. **Zero-setup** — runs entirely in the browser.

---

## ✨ Features

- **Weighted Demand Engine** — Pricing (35%) + Age/Positioning (25%) + R&D/MTBF (20%) + Marketing (20%).
- **Live Proforma Calculator** — R&D, Marketing, Production, and Finance inputs update projected P&L, cash, and stock price **instantly** as you type.
- **Full Financial Statements** — Auto-computed Income Statement, Balance Sheet, and Cash Flow every round.
- **Emergency Loan Engine** — Cash below zero triggers a punitive 22.5% APR Big Al's loan automatically, with critical alert.
- **AI Competitors** — 3 AI-driven companies (easy / medium / hard difficulty) make their own decisions each round.
- **5 Market Segments** — Traditional, Low End, High End, Performance, Size — each with its own ideal price, MTBF, position, and growth rate.
- **Perceptual Map** — Visualize your products vs. the segment ideal; R&D investment shifts products toward target.
- **Auto-Save to LocalStorage** — Reload the browser, your game persists. Save multiple games in parallel.
- **Charts & Leaderboards** — Stock price, revenue, net profit, ROE, market share trends across all rounds.
- **Modern Financial-Terminal Aesthetic** — Dark-mode-first, refined gradients, glassmorphism cards, animated transitions.

---

## 🛠 Tech Stack

| Layer            | Choice                                       |
| ---------------- | -------------------------------------------- |
| Framework        | Next.js 14+ (App Router)                     |
| Language         | TypeScript 5                                  |
| Styling          | Tailwind CSS 4 + shadcn/ui                   |
| Animation        | Framer Motion                                |
| Icons            | Lucide React                                 |
| Charts           | Recharts                                     |
| State            | React Context + LocalStorage persistence     |
| Simulation Math  | Custom engine (`src/engine/simulationEngine.ts`) |

---

## 📁 File Structure

```
apex-strategy-sim/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout, fonts, metadata
│   │   ├── page.tsx                       # GameProvider + view router
│   │   └── globals.css                    # Financial-terminal theme
│   ├── context/
│   │   └── GameContext.tsx                # Central state store + localStorage sync
│   ├── engine/
│   │   └── simulationEngine.ts            # Demand, finance, scoring math
│   ├── components/
│   │   ├── Navigation.tsx                 # Top header + tab nav + team switcher
│   │   ├── charts/
│   │   │   ├── FinancialChart.tsx         # Multi-line trend chart
│   │   │   └── MarketShareChart.tsx       # Pie + stacked-bar variants
│   │   └── views/
│   │       ├── LandingView.tsx            # New / Load Game setup
│   │       ├── DashboardView.tsx          # KPI scorecards, alerts, leaderboard
│   │       ├── RndView.tsx                # Specs, price, tech, live proforma
│   │       ├── MarketingView.tsx          # Promo & sales force allocation
│   │       ├── ProductionView.tsx         # Capacity, automation, scheduling
│   │       ├── FinanceView.tsx            # Proforma P&L, BS, CF, debt/equity
│   │       └── ResultsView.tsx            # Debrief, market share, charts
│   ├── lib/
│   │   ├── format.ts                      # Money / pct / number formatters
│   │   └── utils.ts                       # cn() helper
│   └── types/
│       └── game.ts                        # All TypeScript interfaces
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open http://localhost:3000
```

The app boots directly into a **zero-hurdle demo mode** — pre-populated with 4 teams
("Apex Corp" as the player, "Vanguard Industries", "Helios Systems", "Novus Dynamics" as AI)
and 5 products per team across all segments. Click "Launch Simulation" → start making
decisions in R&D, Marketing, Production, Finance → "Process Next Round" to advance.

---

## 🎮 How to Play

### Per-round flow

1. **R&D tab** — Set price, MTBF, and target position on the perceptual map. Allocate
   R&D investment to push your products toward the segment ideal. Tune automation and
   capacity investments.
2. **Marketing tab** — Split promo budget (drives brand awareness) vs. sales force budget
   (drives customer accessibility) per product.
3. **Production tab** — Schedule production per product. Watch capacity utilization and
   stock-out risk warnings.
4. **Finance tab** — Issue short-term / long-term debt, raise equity, pay dividends.
   Monitor projected cash and emergency loan risk in real time.
5. **Process Next Round** (top-right CTA) — Engine computes demand across all teams,
   builds financial statements, advances product ages, decays awareness, and updates
   stock prices.
6. **Results tab** — Review the round debrief: market share pie, per-segment stacked bar,
   stock price trend, leaderboard. Iterate.

### Win condition

The team with the **highest stock price** at the end of round 8 (default) wins.
Stock price is a function of EPS × P/E × risk-discount, where:
- EPS = Net Profit / Shares Outstanding (2M shares)
- P/E ratio = 12 + 8 × growth (clamped)
- Risk discount = 1 − bankruptcyRisk / 200

---

## 🧮 Simulation Math (Highlights)

### Demand Model

For each segment, every competing product gets an **attractiveness score (0–1)**:

```
score = priceFactor * 0.35
      + agePositionFactor * 0.25
      + qualityMtbfFactor * 0.20
      + marketingFactor * 0.20
```

Demand is then distributed proportionally to scores. Units sold = min(demand, available).

### Emergency Loan

If a team's ending cash < 0, an emergency loan is auto-issued at **22.5% APR**
to bring cash back to zero. The interest is deducted from net profit and a critical
alert is raised.

### Stock Price

```
PE = 12 + 8 * clamp(growth, -0.5, 2)
stockPrice = max(5, EPS * PE * (1 - bankruptcyRisk/200) + prevStock * 0.3)
```

Full code in `src/engine/simulationEngine.ts`.

---

## 🔧 Configuration

- **Number of rounds**: Choose 4 / 6 / 8 / 12 in the New Game modal.
- **AI difficulty**: Edit `src/engine/simulationEngine.ts → createDefaultTeams()`
  to set `aiDifficulty: "easy" | "medium" | "hard"` per AI team.
- **Tax rate, interest rates, depreciation**: Top of `simulationEngine.ts`.
- **Theme**: Edit CSS variables in `src/app/globals.css`. Dark mode is default.

---

## 📦 Deploy to Vercel / GitHub

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: ApexStrategy Enterprise"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/apex-strategy-sim.git
git branch -M main
git push -u origin main
```

Then visit [vercel.com/new](https://vercel.com/new), import the repo, and click Deploy.
**No environment variables required.**

---

## 🧪 Extending the App

- Add more teams: Edit `createDefaultTeams()` in `simulationEngine.ts`.
- Add a 6th segment: Extend `SegmentId` and `SEGMENT_DEFAULTS`.
- Add multiplayer: Replace `generateAIDecisions()` with WebSocket-based peer decisions.
- Add a database: Replace the localStorage persistence layer in `GameContext.tsx`
  with Prisma + PostgreSQL.

---

## 📜 License

MIT — use it, fork it, teach with it, sell it.

Built by **ApexStrategy Labs**.
