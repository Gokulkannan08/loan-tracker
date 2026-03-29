# CLAUDE.md

## Commands

```bash
npm run dev       # Vite dev server (hot reload)
npm run build     # Production build
npm run preview   # Preview production build
npx tsc --noEmit  # Type-check only
```

No test suite configured.

## Architecture

Client-side React SPA. `App.tsx` holds all state; `useMemo` drives derived data from `loan-engine.ts` pure functions.

- `src/lib/loan-engine.ts` — All financial logic (`pmt`, `buildSchedule`, `computeFYData`, `computeRegCosts`, `computeTotals`)
- `src/lib/utils.ts` — `cn()` utility
- `src/App.tsx` — Single component: sidebar (268px) + topbar + tabs (Dashboard | Amortization | Tax & Costs)
- `src/components/ui/` — shadcn preset `b5dfpLoQC`; regenerate via `npx shadcn@latest add <component>`

See [`docs/architecture.md`](docs/architecture.md) for layout diagram and domain context.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. Config in `src/index.css` `@theme {}` block. No `tailwind.config.js`.
Dark mode: `dark` class on `<html>`. OKLCH colors. Fonts: IBM Plex Sans Variable + JetBrains Mono.

See [`docs/styling.md`](docs/styling.md) for details.

## Tech Stack & Versioning

React 19.2.4 · Vite 8.0.3 · TypeScript 6.0.2 · Tailwind 4.2.2 · recharts 3.8.1 · react-day-picker 9.14.0

**Use exact version pins** (no `^` or `~`). See [`docs/tech-stack.md`](docs/tech-stack.md).
