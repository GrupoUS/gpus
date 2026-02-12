// ── Re-export: AppRouter type for client consumption ──
// The actual appRouter instance lives in apps/api/src/routers.ts
// This file only re-exports the TYPE for use by @repo/web

export type { AppRouter } from '../../apps/api/src/routers';
