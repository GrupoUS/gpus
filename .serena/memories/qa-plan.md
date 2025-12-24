# QA Execution Plan

## Phase 1: Local Checks
- **Linting**: `bun run lint:check` (Biome)
- **Build**: `bun run build` (Vite + TSC)
- **Tests**: `bun run test:coverage` (Vitest)

## Phase 2: Deployment Validation
- **Railway**: `railway status`
- **Convex**: `bunx convex deploy --prod` (Check status)
- **Logs**:
  - `railway logs --latest -n 100`
  - `bunx convex logs --prod --failure`

## Phase 3: Error Handling
- If any step fails, aggregate errors into `.factory/qa-report.md`.
- Trigger `/research "Fix QA errors: ..."` automatically.
