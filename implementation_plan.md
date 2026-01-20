# Implementation Plan - QA Fixes

## Problem Description
The QA pipeline failed at Phase 1 (Lint Check).
1. **Biome Configuration**: Biome is checking the `.kilocode` directory, which contains thousands of parsing errors (JSON with comments in non-JSONC files).
2. **Project Lint Errors**: There are 419 linting errors in `src` and `convex` directories, including:
    - Excessive cognitive complexity in `batch_processor.ts`.
    - Filenaming convention violations (snake_case instead of camelCase).
    - Naming convention violations (`_id`).
    - Suspicious `any` usage.
    - Missing `await` in async functions.
    - Formatting issues.

## Proposed Solution

### 1. Biome Configuration Fix
- Update `biome.json` to explicitly ignore `.kilocode`, `.gemini`, `.vscode`, and other non-project directories in the `files.ignore` section.
- Ensure `useIgnoreFile` is correctly configured.

### 2. Project Lint Fixes
- **Automated Fixes**: Run `bun run lint` (`biome check --write`) to fix formatting and simple lint errors automatically.
- **Manual Fixes**:
    - Refactor `processBatch` in `convex/asaas/batch_processor.ts` to reduce complexity.
    - Rename files in `convex/asaas/` to follow camelCase convention.
    - Fix `_id` naming convention issues (likely by adding overrides or fixing the schema usage).
    - Replace `any` with proper types where possible.
    - Add `await` or remove `async` where appropriate.

## Atomic Tasks
- [ ] Update `biome.json` ignore list.
- [ ] Run `bun run lint` for automated fixes.
- [ ] Rename `convex/asaas/batch_processor.ts` to `convex/asaas/batchProcessor.ts`.
- [ ] Rename `convex/asaas/conflict_resolution.ts` to `convex/asaas/conflictResolution.ts`.
- [ ] Rename `convex/asaas/export_workers.ts` to `convex/asaas/exportWorkers.ts`.
- [ ] Rename `convex/asaas/import_workers.ts` to `convex/asaas/importWorkers.ts`.
- [ ] Rename `convex/asaas/organization_keys.ts` to `convex/asaas/organizationKeys.ts`.
- [ ] Refactor `processBatch` in `convex/asaas/batchProcessor.ts`.
- [ ] Fix `async` handler in `convex/asaas/queries/health.ts`.
- [ ] Fix `public` modifiers in `convex/asaas/errors.ts`.
- [ ] Fix `any` usage in `convex/asaas/errors.ts` and `convex/asaas/exportWorkers.ts`.

## Verification Plan
- Run `bun run lint:check` and ensure it passes with 0 errors.
- Run `bun run build` to ensure no regressions.
- Run `bun run test:coverage` to ensure tests still pass.
