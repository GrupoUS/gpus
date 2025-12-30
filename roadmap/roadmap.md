Project Roadmap Overview
========================
Feature: TypeScript Fixes
Spec:
Fix all TypeScript errors, linting issues, and test failures to ensure a clean build for PR #1.

Features: 2
Total Actions: 11
Progress: 6 completed, 4 in progress, 1 pending

Feature 1: TypeScript Fixes (6/6 complete)
  Description: Resolve 32 TypeScript errors and 2 failing tests identified in PR #1
  1.01 ✓ Fix API path in src/components/admin-metrics-dashboard.tsx (getApiUsageStats -> monitoring.getApiUsageStats) [completed]
  1.02 ✓ Fix schema usage in src/components/admin/asaas/sync-history/admin-sync-history.tsx (errors array, remove metadata) [completed]
  1.03 ✓ Fix RouterContext type in src/routes/__root.tsx (add convex client) [completed]
  1.04 ✓ Fix duplication in convex/lgpd_migration.test.ts [completed]
  1.05 ✓ Fix useMutation vs useAction in src/components/admin/asaas/sync-controls/admin-sync-controls.tsx [completed]
  1.06 ✓ Run validation (build, lint, test) [completed]

Feature 2: Dead Code Cleanup (4/5 complete)
  Description: Remove unused files, exports, and dependencies identified by Knip.
  2.01 ✓ Analyze codebase with Knip to identify unused files and exports [completed]
  2.02 ✓ Remove 10 unused files identified by Knip [completed]
  2.03 ✓ Remove unused exports and types identified by Knip [completed]
  2.04 ✓ Prune unused dependencies from package.json [completed]
  2.05 ⏳ Final validation (build, lint, test) [in_progress]
