# ₹ Indian Loan Amortization Tracker

A comprehensive, dynamic loan analysis tool built with **Vite + React + shadcn/ui + Recharts**, optimized for the Indian financial context.

## Features

- **Reducing Balance EMI** calculation with dynamic amortization schedule
- **Prepayment modeling** — monthly extras + lump sums with tenure/EMI reduction strategy
- **Indian regulatory compliance** — GST on processing fees, CERSAI tiered charges, RBI 2026 floating-rate zero-penalty directive
- **Tax shield engine** — Section 24(b) + 80C deductions, joint-loan multiplier, FY-wise aggregation (April–March)
- **KPI dashboard** with interest saved, months saved, net effective rate
- **Charts** — Recharts doughnut (principal vs interest) + stacked bar (annual breakdown)
- **shadcn/ui** — DatePicker (Popover + Calendar), Select, ToggleGroup, Tabs, Input, Label, Card, Button

## Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [Loan Amortization](https://loan-tracker-rust.vercel.app/)

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 18 + Vite 5 |
| UI | shadcn/ui (Radix primitives) |
| Styling | Tailwind CSS 3 (dark mode) |
| Charts | Recharts |
| Calendar | react-day-picker + date-fns |
| Icons | lucide-react |

## Project Structure

```
src/
├── components/ui/     # shadcn/ui components
│   ├── button.jsx
│   ├── calendar.jsx
│   ├── card.jsx
│   ├── date-picker.jsx
│   ├── input.jsx
│   ├── label.jsx
│   ├── popover.jsx
│   ├── select.jsx
│   ├── tabs.jsx
│   └── toggle-group.jsx
├── lib/
│   ├── utils.js       # cn() helper
│   └── loan-engine.js # All financial math
├── App.jsx            # Main application
├── main.jsx           # Entry point
└── index.css          # Tailwind + CSS variables
```
