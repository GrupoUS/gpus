---
feature: "Fix PR #1 TypeScript Errors"
spec: |
  Fix compilation errors preventing PR merge. Address API path mismatches, schema field errors, router context issues, and test file corruption.
---

## Task List

### Feature 1: TypeScript Fixes
Description: Resolve 32 TypeScript errors and 2 failing tests identified in PR #1
- [x] 1.01 Fix API path in src/components/admin-metrics-dashboard.tsx (getApiUsageStats -> monitoring.getApiUsageStats) (note: Starting fix for API path mismatch) (note: Completed backend auth and dashboard fixes as per summary)
- [x] 1.02 Fix schema usage in src/components/admin/asaas/sync-history/admin-sync-history.tsx (errors array, remove metadata) (note: Starting fix for schema mismatch) (note: Completed schema usage fixes as per summary)
- [x] 1.03 Fix RouterContext type in src/routes/__root.tsx (add convex client) (note: Starting fix for RouterContext type) (note: Completed RouterContext fix as per summary)
- [x] 1.04 Fix duplication in convex/lgpd_migration.test.ts (note: Fixing duplicate code in test file) (note: Starting fix for duplication in test file) (note: Fixed duplication and environment variable mocking in test file. Verified with bun test.)
- [x] 1.05 Fix useMutation vs useAction in src/components/admin/asaas/sync-controls/admin-sync-controls.tsx (note: Starting validation of useMutation vs useAction and type fixes) (note: Verified useAction usage is correct for backend actions. Removed 'as any' casting. Build passed.)
- [x] 1.06 Run validation (build, lint, test) (note: Validation successful. Build passed, Lint passed, All 242 tests passed.)
