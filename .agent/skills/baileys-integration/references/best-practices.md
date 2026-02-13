# Baileys Best Practices

> Official patterns from `@whiskeysockets/baileys` documentation + project-specific patterns.

---

## Official Baileys Patterns

### 1. Auth State Management

**Official**: Use `useMultiFileAuthState()` for file-based storage.
**Project**: Uses custom `usePostgresAuthState()` in `baileysAuthState.ts` — stores all auth data in PostgreSQL `baileys_sessions` table. This is the correct approach for multi-instance deployments.

```typescript
// ✅ Project pattern (PostgreSQL)
const { state, saveCreds } = await usePostgresAuthState(mentoradoId);
const sock = makeWASocket({ auth: state });
sock.ev.on('creds.update', saveCreds);
```

### 2. Cacheable Signal Key Store

**Status**: ❌ Not yet implemented in the project.

Wraps the signal key store with an in-memory cache, reducing database reads during message decryption:

```typescript
import { makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';

const sock = makeWASocket({
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  }
});
```

**Impact**: Significant reduction in DB queries during high-volume message decryption. Priority improvement.

### 3. Browser Identity

Set consistent browser identity to avoid session conflicts and improve stability:

```typescript
import { Browsers } from '@whiskeysockets/baileys';

const sock = makeWASocket({
  browser: Browsers.macOS('Desktop'),
  markOnlineOnConnect: false,
  syncFullHistory: false, // true only if you need historical messages
});
```

### 4. Batch Event Processing

**Status**: ❌ Not yet implemented in the project.

Instead of individual `sock.ev.on()` calls, use `ev.process()`:

```typescript
sock.ev.process(async (events) => {
  if (events['connection.update']) { /* ... */ }
  if (events['creds.update']) { await saveCreds(); }
  if (events['messages.upsert']) { /* ... */ }
  if (events['contacts.update']) { /* ... */ }
  if (events['messaging-history.set']) { /* bulk import */ }
});
```

**Benefits**: Atomic batch processing, fewer race conditions, cleaner code.

### 5. `getMessage()` Callback

Required for poll vote decryption and resending missing messages:

```typescript
const sock = makeWASocket({
  getMessage: async (key) => {
    // Retrieve from your database
    return { conversation: 'fallback content' };
  }
});
```

### 6. Reconnection Pattern

Official recommended pattern with `DisconnectReason`:

```typescript
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
    if (shouldReconnect) {
      // Reconnect with exponential backoff
    }
  }
});
```

### 7. Pairing Code Authentication

Alternative to QR code — user enters a code in WhatsApp:

```typescript
if (qr && !sock.authState.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber);
  // Display code to user
}
```

---

## Project-Specific Patterns

### Singleton Service Pattern

`baileysService` is a singleton exported from `baileysService.ts`:

```typescript
// ✅ Always import the singleton
import { baileysService } from './services/baileysService';

// ❌ Never instantiate a new BaileysService
```

### Session Manager Layer

Always use `BaileysSessionManager` (not `BaileysService` directly) from router/webhook code:

```typescript
// ✅ Correct
import { baileysSessionManager } from './services/baileysSessionManager';
await baileysSessionManager.connect(mentoradoId);

// ❌ Incorrect — bypasses session tracking
import { baileysService } from './services/baileysService';
await baileysService.connect(mentoradoId);
```

### Phone Number Normalization

Always use `baileysService.normalizePhone()` for comparison and `baileysService.normalizeJid()` for sending:

```typescript
// For DB storage and comparison
const phone = baileysService.normalizePhone(rawPhoneOrJid);

// For sending messages via WhatsApp
const jid = baileysService.normalizeJid(phone);
```

### Event-Driven Architecture

Baileys events flow through:
1. `BaileysService` (emits typed events via `EventEmitter`)
2. `BaileysSessionManager` (proxies events with type-safe generics)
3. `baileysWebhook.ts` (listens and persists to DB)

Never bypass this chain by registering listeners directly on the WASocket.

### Message Content Extraction

Use `BaileysService.extractTextContent()` to safely extract text from any message type:

```typescript
const content = baileysService.extractTextContent(message.message);
// Handles: conversation, extendedTextMessage, imageMessage.caption,
// videoMessage.caption, documentMessage.caption, buttonsResponseMessage,
// listResponseMessage, templateButtonReplyMessage
```

---

## Improvement Roadmap

| Priority | Improvement | File |
|----------|-------------|------|
| P1 | Add `makeCacheableSignalKeyStore` | `baileysService.ts` |
| P2 | Add `getMessage()` callback | `baileysService.ts` |
| P2 | Add `Browsers.macOS()` config | `baileysService.ts` |
| P3 | Migrate to `ev.process()` batch events | `baileysService.ts` |
| P3 | Add pairing code auth option | `baileysRouter.ts` + `BaileysConnectionCard.tsx` |
| P4 | Extract duplicated helpers to shared service | See consolidation roadmap |
