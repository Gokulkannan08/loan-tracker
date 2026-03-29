# Agent Orchestration

## Available Agents

| Agent | File | Purpose | When to Use |
|-------|------|---------|-------------|
| planner | `planner.md` | Implementation planning | Complex features, refactoring |
| architect | `architect.md` | React SPA architecture | Component/state design decisions |
| code-reviewer | `code-reviewer.md` | Code quality review | After writing or modifying code |
| typescript-reviewer | `typescript-reviewer.md` | TS type safety review | TypeScript changes |
| security-reviewer | `security-reviewer.md` | Security analysis | Code handling user input |
| build-error-resolver | `build-error-resolver.md` | Fix build/type errors | When `npm run build` or `tsc` fails |
| refactor-cleaner | `refactor-cleaner.md` | Dead code cleanup | Code maintenance |
| docs-lookup | `docs-lookup.md` | Library/API documentation | How-to questions about packages |

## When to Use Automatically

- Complex feature request → **planner**
- Code just written/modified → **code-reviewer**
- Architectural decision → **architect**
- Build fails → **build-error-resolver**

## Parallel Execution

Launch independent agents in a single message for parallel execution. Example: security-reviewer + typescript-reviewer can run simultaneously on the same diff.
