# Development Workflow

## Feature Implementation Workflow

1. **Research & Reuse**
   - Search the codebase for existing utilities before writing new code
   - Check `src/lib/loan-engine.ts` for existing financial logic
   - Check `src/components/ui/` for existing UI components before adding new ones
   - Check npm for battle-tested libraries before writing utility code

2. **Plan First**
   - Use **planner** agent for complex features or refactoring
   - Identify whether new state belongs in `App.tsx` or can be derived with `useMemo`

3. **Code Review**
   - Use **code-reviewer** agent after writing code
   - Address all CRITICAL and HIGH issues before considering the task done

4. **Build & Type Check**
   - Run `npm run build` — must exit 0
   - Run `npx tsc --noEmit` — must exit 0
   - If either fails, use **build-error-resolver** agent

## No Git Workflow

This project is not a git repository. Skip all commit/PR steps.
