---
feature: "Fix PR #1 TypeScript Errors"
spec: |
  Fix compilation errors preventing PR merge. Address API path mismatches, schema field errors, router context issues, and test file corruption.
---

## Task List

### Feature 1: TypeScript Fixes
Description: Resolve 32 TypeScript errors and 2 failing tests identified in PR #1
- [ ] 1.01 Fix API path in src/components/admin-metrics-dashboard.tsx (getApiUsageStats -> monitoring.getApiUsageStats)
- [ ] 1.02 Fix schema usage in src/components/admin/asaas/sync-history/admin-sync-history.tsx (errors array, remove metadata)
- [ ] 1.03 Fix RouterContext type in src/routes/__root.tsx (add convex client)
- [ ] 1.04 Fix duplication in convex/lgpd_migration.test.ts
- [ ] 1.05 Fix useMutation vs useAction in src/components/admin/asaas/sync-controls/admin-sync-controls.tsx
- [ ] 1.06 Run validation (build, lint, test)
