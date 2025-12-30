---
feature: TypeScript Fixes
spec: |
  Fix all TypeScript errors, linting issues, and test failures to ensure a clean build for PR #1.
---

# Feature 1: TypeScript Fixes

Description: Resolve 32 TypeScript errors and 2 failing tests identified in PR #1

- [x] 1.01 Fix API path in src/components/admin-metrics-dashboard.tsx (getApiUsageStats -> monitoring.getApiUsageStats)
- [x] 1.02 Fix schema usage in src/components/admin/asaas/sync-history/admin-sync-history.tsx (errors array, remove metadata)
- [x] 1.03 Fix RouterContext type in src/routes/__root.tsx (add convex client)
- [x] 1.04 Fix duplication in convex/lgpd_migration.test.ts
- [x] 1.05 Fix useMutation vs useAction in src/components/admin/asaas/sync-controls/admin-sync-controls.tsx
- [x] 1.06 Run validation (build, lint, test)
