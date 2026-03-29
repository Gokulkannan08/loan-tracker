# Architecture

Fully client-side React SPA — no backend, no API calls, no routing.

## Data Flow

```
User Input (useState) → useMemo → loan-engine.ts pure functions → Rendered UI
```

`App.tsx` holds all state. No global state manager.

## Key Files

- **`src/lib/loan-engine.ts`** — All financial logic. Pure functions:
  - `pmt()` — EMI via reducing-balance formula
  - `buildSchedule()` — Amortization with prepayments → `ScheduleRow[]`
  - `computeFYData()` — Tax deductions §24(b)/§80C by FY → `FYRow[]`
  - `computeRegCosts()` — Processing fee, CERSAI, RBI 2026 preclosure rules → `RegCosts`
  - `computeTotals()` — Standard vs accelerated repayment comparison → `Totals`
  - Exported types: `LoanType`, `PropertyType`, `ScheduleRow`, `Totals`, `RegCosts`, `FYRow`

- **`src/lib/utils.ts`** — `cn()` (clsx + tailwind-merge)

- **`src/App.tsx`** — Single component. Fixed sidebar (268px) + topbar (h-12) + tabbed content.
  - Tabs: Dashboard | Amortization | Tax & Costs
  - Chart palette in `C` object at top of file

- **`src/components/ui/`** — shadcn/ui (preset `b5dfpLoQC`). Regenerate via `npx shadcn@latest add <component>`.

## Layout

```
<div flex h-screen>
  <aside w-268px>        ← Sidebar: Loan / Tax Profile / Prepayment / Fees inputs
  <div flex-col flex-1>
    <header h-12>        ← Topbar: EMI, interest, payout, tenure, savings
    <div overflow-y-auto>
      <Tabs>             ← Dashboard | Amortization | Tax & Costs
```

## Domain Context

Indian home loan calculations:
- INR formatted in Lakhs/Crores via `fmt()` / `fmtFull()`
- Tax brackets follow Indian income tax rules
- Preclosure penalty: RBI 2026 (zero for floating rate, % for fixed)
- "Joint borrower" doubles §24(b) and §80C caps
- Financial Year = April–March (`getFY()` in loan-engine.ts)
