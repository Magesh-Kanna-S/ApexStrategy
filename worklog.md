---
Task ID: P1
Agent: main (super-z)
Task: ApexStrategy Enterprise v2 enhancement — multi-currency, remove competitor refs, fix chart visibility, add MBA departments (Strategy, HR, Operations), Indian companies, demo video.

Work Log:
- Phase 1: Removed all competitor references (Capsim, BSG, Outperform SG, Marketplace) from layout.tsx, simulationEngine.ts, LandingView.tsx, README.md.
- Phase 2: Built multi-currency support — created src/context/CurrencyContext.tsx with INR default, USD/EUR/GBP/JPY/AED/SGD support, live exchange rates from open.er-api.com (free, no key) with 1-hour cache and offline fallback to static rates. Indian numbering convention (lakhs/crores) for INR. All engine math stays in INR; display layer converts in real time. Updated all views (Dashboard, R&D, Marketing, Operations, HR, Finance, Results) to use useCurrency().fmtMoney and fmtPrice instead of static formatters.
- Phase 3: Fixed chart tooltip visibility — Recharts Tooltip contentStyle now uses hardcoded dark background (rgb(17 24 39)) with high-contrast light text (rgb(243 244 246)) and explicit labelStyle/itemStyle. Same fix applied to both FinancialChart.tsx and MarketShareChart.tsx. Pie chart label also gets textShadow for readability.
- Phase 4: Updated company names to Indian — Bharat Apex Industries (player), Vanguard Maharaj Pvt Ltd, Helios Bharat Systems, Novus Dynamics India. Product prefix logic updated to use first letters of first three name words.
- Phase 5: Added StrategyView.tsx — focus segments (+8% attractiveness boost each, max 3), ESG investment (long-term boost), R&D pipeline investment, strategic alliance tier (basic/advanced), brand-building investment (lifts all products' awareness).
- Phase 6: Renamed ProductionView → OperationsView.tsx. Added two new Operations levers per product: lean manufacturing (waste reduction up to -12% material cost) and supplier reliability investment (reduces stockouts).
- Phase 7: Added HrView.tsx — compensation index slider (0.80–1.30, market rate = 1.0), training investment (up to -15% unit cost via productivity), benefits & wellness (reduces turnover risk), hiring investment, performance bonus pool (short-term boost). Shows live unit-cost impact card comparing with/without HR.
- Phase 8: Extended simulation engine — computeUnitCost now takes optional HR (compensation, training, bonus) and Operations (lean) params. computeAttractiveness takes optional Strategy decision (focusSegments, brandInvestment, esgInvestment, allianceTier) and applies boosts. computeDemandForSegment passes strategy through. processRound uses new fields. AI decision generator now produces Strategy + HR + Operations decisions calibrated by difficulty.
- Phase 9: Updated Navigation.tsx — 8 tabs (Dashboard, Strategy, R&D, Marketing, Operations, HR, Finance, Results) + currency switcher dropdown showing live/fallback indicator + team switcher. Updated page.tsx view router for new view IDs. Updated ViewId type. Updated GameContext with updateStrategyDecision and updateHrDecision helpers + extended buildDefaultDraftDecisions.
- Phase 10: Verified end-to-end in Agent Browser — created new game, all 8 tabs render, INR default works, USD switch works (₹25,000 → $300.42), processed round 1 successfully ($2.3M revenue, $1M profit), no console errors. Lint passes clean.
- Phase 11: Built demo HTML at /home/z/my-project/download/apex-strategy-tour.html — self-contained guided tour player matching the reference style. Features: (a) browser speechSynthesis voice-over (prefers Google/Natural English voices), (b) typed captions with blinking caret, (c) synthetic cursor + highlight ring injected into the live app iframe, (d) chapter navigation menu, (e) play/pause/speed controls, (f) intro + outro overlays with brand splash, (g) tour picker (Quick Tour ~2 min / Full Walkthrough ~5 min), (h) keyboard shortcuts (arrows, space, M, C, S). The tour loads the live Next.js app from localhost:3000 (or configurable via ?app= URL param), auto-creates a new game, walks through all 6 departments, demos the live proforma, switches currencies, and processes a round. Verified end-to-end: tour runs from intro through outro without errors.

Stage Summary:
- All 11 phases complete.
- ApexStrategy Enterprise v2 is live at http://localhost:3000 with:
  * 6 integrated MBA departments (Strategy, R&D, Marketing, Operations, HR, Finance)
  * Multi-currency support (INR default + 6 others, live rates)
  * Indian company names
  * High-contrast chart tooltips
  * No competitor references
- Demo video player at /home/z/my-project/download/apex-strategy-tour.html — open in Chrome/Edge, choose Quick or Full tour.
- Lint: clean. No runtime errors.
