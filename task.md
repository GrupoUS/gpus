# Task: QA Fixes

## Status: In Progress

## Tasks
- [ ] Update `biome.json` ignore list
- [ ] Run automated lint fixes (`bun run lint`)
- [ ] Rename files in `convex/asaas/` to camelCase
- [ ] Refactor `processBatch` to reduce complexity
- [ ] Fix specific lint errors (async, public, any)
- [ ] Verify all checks pass

## Implementation Notes
- Biome was checking `.kilocode` which caused thousands of false positives.
- `batch_processor.ts` has a complexity of 34, needs to be < 20.
- Filenames in `convex/asaas/` use snake_case, but Biome expects camelCase.
