# Baileys Architecture — File Inventory & Data Flow

> **Source of truth for the Baileys integration layer in NeoDash.**

---

## File Inventory

### Backend Services (`server/services/`)

| File | Lines | Responsibility |
|------|-------|----------------|
| `baileysService.ts` | 634 | **Core singleton.** Socket lifecycle management, `makeWASocket()` wrapper, reconnection with exponential backoff, QR/connection/message/contact event emission via `EventEmitter`. Manages `Map<number, SessionRuntime>` for active sessions. |
| `baileysAuthState.ts` | 147 | **PostgreSQL auth state.** Custom `usePostgresAuthState()` replacing Baileys' built-in `useMultiFileAuthState()`. Handles creds + signal keys via upsert pattern to `baileys_sessions` table. |
| `baileysSessionManager.ts` | 122 | **Session manager singleton.** Wraps `baileysService` with managed session tracking (`Map<number, ManagedSession>`). Auto-restores persisted sessions on startup by querying `mentorados.baileysConnected = 'sim'`. |

### Router (`server/`)

| File | Lines | Responsibility |
|------|-------|----------------|
| `baileysRouter.ts` | 305 | **tRPC router.** Exposes: `connect`, `disconnect`, `logout`, `getStatus`, `sendMessage`, `getAllConversations`, `getMessagesByPhone`, `linkOrphanMessages`, `clearAllData`. Uses `protectedProcedure` with mentorado resolution. |

### Webhook (`server/webhooks/`)

| File | Lines | Responsibility |
|------|-------|----------------|
| `baileysWebhook.ts` | 227 | **Event listeners.** Registers once on `baileysSessionManager` events. On `connection.update`: persists `baileysConnected`/`baileysPhone` to `mentorados`, broadcasts SSE. On `message`: creates `whatsapp_messages` row + auto-creates CRM lead. On `contacts`: upserts `whatsapp_contacts`. |

### Schema (`drizzle/`)

| File | Lines | Responsibility |
|------|-------|----------------|
| `schema_baileys.ts` | 26 | **`baileys_sessions` table.** Columns: `id`, `mentoradoId` (FK), `key` (varchar 255), `value` (text/JSON), `createdAt`, `updatedAt`. Unique index on `(mentoradoId, key)`. |

### Frontend (`client/src/`)

| File | Lines | Responsibility |
|------|-------|----------------|
| `components/whatsapp/BaileysConnectionCard.tsx` | 347 | QR code rendering with `qrcode` library, connect/disconnect buttons, status badges, logout confirmation dialog. |
| `hooks/useWhatsAppProvider.ts` | 175 | Multi-provider detection hook. Priority: Meta > Baileys > Z-API. Also provides `useWhatsAppConversations`, `useWhatsAppMessages`, `useWhatsAppSendMessage` — all provider-agnostic. |

---

## Data Flow Diagrams

### Connection Flow

```
BaileysConnectionCard (UI)
  │ onClick="connect"
  ▼
tRPC baileys.connect
  │
  ▼
BaileysSessionManager.connect(mentoradoId)
  │ touch() → tracks managed session
  ▼
BaileysService.connect(mentoradoId)
  │ usePostgresAuthState(mentoradoId)
  │ makeWASocket({ auth: state })
  │ Register event handlers:
  │   - connection.update → emitConnectionEvent / emitQrEvent
  │   - creds.update → saveCreds (PostgreSQL)
  │   - messages.upsert → emitMessageEvent
  │   - contacts.update → emitContactEvent
  ▼
baileysWebhook (event listeners)
  │ On "qr" → SSE broadcast → BaileysConnectionCard renders QR
  │ On "connection.update" → Update mentorados table + SSE broadcast
  │ On "message" → Insert whatsapp_messages + find/create lead + SSE broadcast
  │ On "contacts" → Upsert whatsapp_contacts
  ▼
Frontend receives SSE → UI updates in real-time
```

### Reconnection Flow

```
connection.update { connection: 'close' }
  │
  ▼
Check DisconnectReason
  ├── 401 (loggedOut) → clearAuthState() → emit disconnected → STOP
  ├── 515 (restartRequired) → immediate reconnect
  └── Other → scheduleReconnect(mentoradoId, session)
                │
                ▼
              Exponential backoff: min(3000ms * 2^attempts, 30000ms)
              Max attempts: 10
              On max reached → emit disconnected → STOP
```

### Message Send Flow

```
tRPC baileys.sendMessage({ phone, message })
  │
  ▼
BaileysService.sendMessage(mentoradoId, phone, text)
  │ Get WASocket from sessions Map
  │ normalizeJid(phone) → "5511999999999@s.whatsapp.net"
  │ sock.sendMessage(jid, { text })
  ▼
Insert whatsapp_messages (direction: "outbound", status: "sent")
  │
  ▼
Return message to caller
```

---

## Related Files (Other Providers)

These files handle Z-API and Meta Cloud API — separate providers that share the same `whatsapp_messages` and `whatsapp_contacts` tables:

| File | Provider | Lines |
|------|----------|-------|
| `zapiRouter.ts` | Z-API | 1140 |
| `zapiService.ts` | Z-API | 529 |
| `contactSyncService.ts` | Z-API | 218 |
| `whatsappCampaignService.ts` | Z-API | 511 |
| `whatsappRouter.ts` | Z-API (legacy duplicate) | 311 |
| `metaApiRouter.ts` | Meta Cloud API | ~800 |
| `metaApiService.ts` | Meta Cloud API | ~400 |
| `WhatsAppConnectionCard.tsx` | Z-API | 589 |
| `WhatsAppSyncDashboard.tsx` | Z-API | ~200 |
