# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (hot reload)
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

This is a **fully client-side React SPA** — no backend, no API calls, no routing. All computation runs in the browser.

### Data Flow

```
User Input (useState) → useMemo → loan-engine.js pure functions → Rendered UI
```

`App.jsx` holds all state (~60 inputs) and calls `useMemo` to recompute derived data on every relevant state change. There is no global state manager.

### Key Files

- **`src/lib/loan-engine.js`** — All financial logic. Pure functions only:
  - `pmt()` — EMI via reducing-balance formula
  - `buildSchedule()` — Month-by-month amortization with prepayments and lump sums
  - `computeFYData()` — Tax deductions (Section 24(b) interest, Section 80C principal) by Indian Financial Year (April–March)
  - `computeRegCosts()` — Processing fee + GST, CERSAI charges, RBI 2026 preclosure penalty rules
  - `computeTotals()` — Aggregates standard vs accelerated repayment comparison

- **`src/App.jsx`** — Single large component. Contains the three-tab UI (Dashboard | Amortization | Tax & Costs), all `useState` declarations, and `useMemo` blocks that drive the charts and tables.

- **`src/components/ui/`** — shadcn/ui primitives (Button, Card, Input, Select, Tabs, DatePicker, etc.). These are Radix UI wrappers styled with Tailwind + CVA variants. Treat them as stable library code.

### Styling

- Tailwind CSS v3 with dark mode enabled by class (dark class is set on `<html>` in `index.html`)
- Custom HSL CSS variables defined in `src/index.css` — colors are referenced as `bg-background`, `text-foreground`, etc.
- Primary accent: Amber (`#f59e0b`)
- Font: JetBrains Mono (loaded from Google Fonts)

### Domain Context

The app implements Indian home loan calculations:
- INR amounts formatted in Lakhs/Crores via `fmt()` / `fmtFull()`
- Tax brackets and deduction caps follow Indian income tax rules
- Preclosure penalty logic follows RBI 2026 guidelines (zero penalty for floating rate; percentage-based for fixed)
- "Joint borrower" mode doubles the deduction caps
