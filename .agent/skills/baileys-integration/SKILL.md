---
name: baileys-integration
description: Operational guide for Baileys WhatsApp Web integration, including setup flow, QR authentication, troubleshooting, session persistence/recovery, and safety guardrails.
---

# Baileys Integration Skill

> **Purpose:** Operate the self-hosted Baileys provider with conservative defaults, stable QR onboarding, low-risk recovery procedures, and production-grade patterns from official Baileys documentation.

---

## When to Use This Skill

Use this skill when:

- Configuring or validating Baileys environment/runtime setup
- Running QR-based WhatsApp connection flow for mentorados
- Diagnosing disconnects, stale sessions, or missing QR updates
- Recovering from session corruption while preserving history
- Planning provider transitions between Z-API, Meta Cloud API, and Baileys
- Creating or modifying any file in the Baileys service layer
- Working with WhatsApp message handling, session management, or webhooks

**Always load:** `.agent/skills/baileys-integration/references/architecture.md` for the full file map.

---

## Architecture Overview

### File Inventory

| File | Purpose | Layer |
|------|---------|-------|
| `server/services/baileysService.ts` | Core singleton — socket lifecycle, connect/disconnect/reconnect, message extraction, event emission | Service |
| `server/services/baileysAuthState.ts` | PostgreSQL-backed auth state persistence (creds + signal keys) | Service |
| `server/services/baileysSessionManager.ts` | Singleton session manager — wraps `baileysService` with managed session tracking + auto-restore | Service |
| `server/baileysRouter.ts` | tRPC router — connect, disconnect, status, send message, conversations, messages | Router |
| `server/webhooks/baileysWebhook.ts` | Event listeners — persists messages/contacts to DB, broadcasts SSE, manages connection state in `mentorados` table | Webhook |
| `drizzle/schema_baileys.ts` | `baileys_sessions` table — stores auth credentials per mentorado | Schema |
| `client/src/components/whatsapp/BaileysConnectionCard.tsx` | QR code display, connect/disconnect UI | Frontend |
| `client/src/hooks/useWhatsAppProvider.ts` | Multi-provider hook (Meta > Baileys > Z-API priority) | Frontend |

### Data Flow

```
User clicks Connect → tRPC baileys.connect → BaileysSessionManager.connect()
→ BaileysService.connect() → makeWASocket() → connection.update event
→ QR emitted → SSE → BaileysConnectionCard renders QR
→ User scans → connection.update status="connected"
→ baileysWebhook persists state to mentorados table
→ Messages arrive via messages.upsert → saved to whatsapp_messages table
```

### Multi-Provider System

The project supports 3 WhatsApp providers with priority: **Meta > Baileys > Z-API**.

- `useWhatsAppProvider.ts` queries all 3 status endpoints and selects the first connected
- Each provider has its own router (`metaApiRouter`, `baileysRouter`, `zapiRouter`)
- Shared tables: `whatsapp_messages`, `whatsapp_contacts`, `leads`

---

## Setup Flow (Conservative)

1. Confirm `@whiskeysockets/baileys` dependency in `package.json`.
2. Verify database has `baileys_sessions` table (from `schema_baileys.ts`).
3. No filesystem session directory needed — sessions are stored in PostgreSQL.
4. Start backend with Bun (`bun dev`) and confirm no startup errors.
5. Open settings and initiate Baileys connection **one mentorado at a time** during first-time setup.

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `BAILEYS_ENABLE_LOGGING` | `false` | Enable pino logging (set `true` only for debugging) |

---

## QR Authentication Flow

1. Trigger connect from the Baileys settings card.
2. Wait for QR payload emission via `connection.update` event.
3. QR is sent through SSE to the frontend `BaileysConnectionCard`.
4. Scan QR from the correct WhatsApp account/device.
5. Confirm status transition sequence: `connecting` → QR → `connected`.
6. Credentials persist automatically via `usePostgresAuthState` on `creds.update`.
7. After connected state, verify message reception before any bulk usage.

### Pairing Code (Alternative to QR)

Baileys supports phone number pairing via `sock.requestPairingCode(phoneNumber)` as an alternative to QR scanning. This is **not yet implemented** in the project but documented for future use:

```typescript
// When QR is available but user prefers pairing code:
if (qr && !sock.authState.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber);
  // Display code to user → enter in WhatsApp > Linked Devices
}
```

---

## Session Persistence (PostgreSQL)

### How It Works

Auth state is stored in the `baileys_sessions` table via `baileysAuthState.ts`:

- **Creds**: Stored under key `"creds"` — contains device identity
- **Signal keys**: Stored under keys like `"pre-key-{id}"`, `"session-{id}"`, etc.
- **Upsert pattern**: Check existing → update or insert (per key per mentorado)
- **Unique constraint**: `(mentorado_id, key)` prevents duplicates

### Best Practice: `makeCacheableSignalKeyStore`

> ⚠️ **Not yet used in the project.** This is a recommended improvement.

Baileys provides `makeCacheableSignalKeyStore()` which wraps the signal key store with an in-memory cache layer, reducing database reads during message decryption:

```typescript
import { makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';

const sock = makeWASocket({
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  }
});
```

**Impact**: Reduces DB queries significantly during high-volume message decryption. Should be added to `baileysService.ts` when creating the socket.

---

## Reconnection Strategy

The project implements exponential backoff reconnection in `baileysService.ts`:

- **Default delay**: 3000ms
- **Max delay**: 30000ms
- **Max attempts**: 10
- **Logic**: On `connection === 'close'`, check `DisconnectReason`:
  - `loggedOut` (401) → **Do NOT reconnect** — clear auth state
  - Other codes → Schedule reconnect with backoff
  - `restartRequired` → Immediate reconnect (post-QR scan)

### Key Disconnect Reasons

| Code | Reason | Action |
|------|--------|--------|
| 401 | `loggedOut` | Clear session, require new QR |
| 408 | `timedOut` | Auto-reconnect |
| 440 | `connectionReplaced` | Another device took over — auto-reconnect |
| 515 | `restartRequired` | Immediate reconnect (normal after QR scan) |

---

## Recovery Procedure (History-Safe)

1. **Detect scope**: Single mentorado vs global service issue.
2. **Attempt soft reconnect** first (without deleting session artifacts).
3. If reconnect fails repeatedly, backup affected session data before any cleanup.
4. Re-authenticate via QR only for the affected mentorado.
5. **Preserve database message history** — NEVER delete existing `whatsapp_messages` rows.
6. Record recovery action and timestamp for auditability.

---

## Best Practices from Official Documentation

### 1. Browser Configuration

Set browser identity to avoid session conflicts:

```typescript
import { Browsers } from '@whiskeysockets/baileys';

const sock = makeWASocket({
  browser: Browsers.macOS('Desktop'), // Stable identity
  markOnlineOnConnect: false,         // Don't auto-mark online
});
```

### 2. Batch Event Processing with `ev.process()`

> ⚠️ **Not yet used in the project.** Recommended for production.

Instead of registering individual `sock.ev.on()` listeners, use `ev.process()` for efficient batch processing:

```typescript
sock.ev.process(async (events) => {
  if (events['connection.update']) { /* handle */ }
  if (events['creds.update']) { await saveCreds(); }
  if (events['messages.upsert']) { /* handle messages */ }
  if (events['contacts.update']) { /* handle contacts */ }
});
```

**Benefits**: Processes all pending events in a single batch, reducing race conditions.

### 3. `getMessage()` Callback

Required for poll vote decryption and resending missing messages:

```typescript
const sock = makeWASocket({
  getMessage: async (key) => {
    // Retrieve message from database using key.id
    const msg = await db.query.whatsappMessages.findFirst({
      where: eq(whatsappMessages.zapiMessageId, key.id)
    });
    return msg ? { conversation: msg.content } : undefined;
  }
});
```

### 4. History Sync

When `syncFullHistory: true` is enabled, Baileys receives `messaging-history.set` events with historical chats, messages, and contacts. Handle cautiously:

```typescript
if (events['messaging-history.set']) {
  const { chats, messages, contacts, isLatest } = events['messaging-history.set'];
  // Bulk upsert to database — use transactions for consistency
}
```

---

## Troubleshooting

### QR Not Appearing

1. Confirm connect mutation succeeds (check tRPC response).
2. Confirm SSE channel is active (check browser DevTools → EventSource).
3. Confirm no stale lock in session — try clearing the mentorado's session from `baileys_sessions` table.
4. Temporarily enable `BAILEYS_ENABLE_LOGGING=true` only for diagnosis.
5. Check if another device already has the session — WhatsApp allows limited linked devices.

### Frequent Disconnects / Status Flapping

1. Verify network stability and host clock/time sync.
2. Inspect close reasons in logs — look for specific `DisconnectReason` codes.
3. Avoid reconnect storms — respect exponential backoff.
4. Check if `connectionReplaced` (440) — another client may be competing.
5. Verify `browser` config is consistent across restarts.

### Session Corruption Symptoms

- Missing keys/creds files, JSON parse errors, permanent auth failure.
- **Fix**: Backup session data → delete from `baileys_sessions` table → re-authenticate via QR.
- **Always** keep message history untouched.

### Messages Not Being Saved

1. Verify `baileysWebhook.ts` listeners are registered (`listenersRegistered` flag).
2. Check if `content` is empty (media-only messages may not have extractable text).
3. Verify `whatsapp_messages` table has correct `mentoradoId`.
4. Check SSE broadcast for `new-message` events.

---

## Anti-Patterns (DO NOT)

| Anti-Pattern | Why |
|--------------|-----|
| Delete `baileys_sessions` rows without backup | Permanent loss of auth state |
| Loop aggressive reconnects without backoff | WhatsApp will ban the session |
| Send bulk messages without rate limiting | Account suspension risk |
| Use `SELECT *` on `baileys_sessions` | Can return MB of signal keys |
| Modify `baileysService.ts` singleton pattern | Breaks session isolation |
| Share session data between mentorados | Each mentorado = separate WhatsApp account |
| Use filesystem auth state (`useMultiFileAuthState`) | Project uses PostgreSQL — inconsistent data |
| Duplicate helper functions across routers | See consolidation roadmap |

---

## Anti-Spam and Safety Guardrails

- Require opt-in before any outbound campaign traffic.
- Apply rate limits and jitter for outbound sends.
- Avoid unsolicited bulk blasts and repetitive templates.
- Keep human support path for blocked/failed numbers.
- Prefer Meta Cloud API for compliance-sensitive or high-volume scenarios.

---

## Known Code Duplication (Consolidation Needed)

> See [consolidation-roadmap.md](references/consolidation-roadmap.md) for details.

| Function | Duplicated in |
|----------|---------------|
| `linkOrphanMessages()` | `baileysRouter.ts`, `zapiRouter.ts`, `metaApiRouter.ts` |
| `getMentoradoWithZapi()` | `whatsappRouter.ts`, `zapiRouter.ts` |
| `buildCredentials()` | `whatsappRouter.ts`, `zapiRouter.ts`, `metaApiRouter.ts` |

**Action**: Extract to shared `server/services/whatsappShared.ts` (future task).

---

## Limitations

- Baileys relies on unofficial WhatsApp Web protocol behavior.
- Long-lived sessions can be less stable than official Cloud API.
- Policy/compliance risk is higher than Meta Cloud API.
- Operational burden is higher (self-hosting, reconnection handling, observability).
- Maximum linked devices per WhatsApp account is limited (typically 4).

---

## Provider Transition Notes

- Prefer gradual migration by mentorado cohort.
- Keep current provider active until replacement passes smoke tests.
- Preserve history table and conversation linkage IDs.
- Use dry-run migration helpers first (`scripts/migrate-whatsapp-provider.ts`).
- Enable writes only with explicit operator approval.

---

## References

- [Architecture Map](references/architecture.md) — complete file inventory and data flow
- [Best Practices](references/best-practices.md) — official Baileys patterns + project patterns
- [Consolidation Roadmap](references/consolidation-roadmap.md) — plan to eliminate code duplication
