# WhatsApp Consolidation Roadmap

> Plan to eliminate code duplication across WhatsApp provider routers.

---

## Problem Statement

Three WhatsApp providers (Z-API, Baileys, Meta Cloud API) each have their own router with **duplicated helper functions**. This leads to:

- Bug fixes applied to one router but not others
- Inconsistent behavior across providers
- Increased maintenance burden

---

## Duplicated Functions

### `linkOrphanMessages(mentoradoId: number)`

**Purpose**: Links existing `whatsapp_messages` that have `leadId = NULL` to CRM leads by matching phone numbers.

**Duplicated in**:
- `server/baileysRouter.ts` (line 28)
- `server/zapiRouter.ts` (line 68)
- `server/metaApiRouter.ts` (line 68)

**Proposed location**: `server/services/whatsappShared.ts`

---

### `getMentoradoWithZapi(userId: number)`

**Purpose**: Resolves mentorado from user ID with Z-API credential fields.

**Duplicated in**:
- `server/whatsappRouter.ts` (line 17)
- `server/zapiRouter.ts` (line 23)

**Proposed location**: `server/services/whatsappShared.ts`

---

### `buildCredentials(mentorado)`

**Purpose**: Builds Z-API credential object from mentorado data, handling decryption.

**Duplicated in**:
- `server/whatsappRouter.ts` (line 28)
- `server/zapiRouter.ts` (line 37)
- `server/metaApiRouter.ts` (line 46)

**Proposed location**: `server/services/whatsappShared.ts`

---

## Proposed Shared Service

```typescript
// server/services/whatsappShared.ts

export async function linkOrphanMessages(mentoradoId: number): Promise<number> { /* ... */ }
export async function getMentoradoWithZapi(userId: number) { /* ... */ }
export function buildCredentials(mentorado: { ... }): ZApiCredentials | null { /* ... */ }
```

### Migration Steps

1. Create `server/services/whatsappShared.ts` with the 3 functions
2. Update `baileysRouter.ts` — import from `whatsappShared`
3. Update `zapiRouter.ts` — import from `whatsappShared`
4. Update `metaApiRouter.ts` — import from `whatsappShared`
5. Update `whatsappRouter.ts` — import from `whatsappShared`
6. Delete inline duplicates from each router
7. Run `bun run check` + `bun run lint:check`

---

## Router Consolidation (Future)

### Current State (3 routers + 1 legacy)

| Router | Provider | Registered as |
|--------|----------|---------------|
| `zapiRouter.ts` | Z-API | `zapi` |
| `baileysRouter.ts` | Baileys | `baileys` |
| `metaApiRouter.ts` | Meta Cloud API | `metaApi` |
| `whatsappRouter.ts` | Z-API (legacy) | `whatsapp` |

### Observations

- `whatsappRouter.ts` is a **legacy duplicate** of `zapiRouter.ts` — it imports the same `zapiService` and `contactSyncService`
- Both are registered in `routers.ts` as separate routers (`zapi` and `whatsapp`)
- Frontend `useWhatsAppProvider.ts` only uses `zapi`, `baileys`, and `metaApi` routers

### Proposed Cleanup

1. **Phase 1**: Audit all `trpc.whatsapp.*` calls in frontend — confirm they can be migrated to `trpc.zapi.*`
2. **Phase 2**: Remove `whatsappRouter.ts` and update any remaining references
3. **Phase 3** (optional): Create unified `whatsappRouter` that delegates to the active provider

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking frontend API calls | Audit all tRPC usage before removing routers |
| Different implementations across providers | Compare function bodies before extracting |
| Credential handling differences | `buildCredentials` may have provider-specific logic — verify |

---

## Status

- [x] Create `whatsappShared.ts` with extracted functions
- [x] Update all 4 routers to import from shared
- [ ] Audit `whatsappRouter.ts` usage in frontend
- [ ] Remove `whatsappRouter.ts` if safe
- [x] Verify with `bun run check` + `bun run lint:check`
