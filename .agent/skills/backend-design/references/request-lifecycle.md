# Request Lifecycle Maps — API to Auth to Context to Data to Response

Use these maps as canonical execution flow for backend changes and incident triage.

## Core API Lifecycle (Hono + tRPC)

```mermaid
flowchart TD
    A[HTTP request enters Hono] --> B[Global middleware logger cors]
    B --> C[Route-specific middleware auth rate-limit]
    C --> D[Context creation user mentorado logger]
    D --> E[tRPC procedure boundary public protected mentorado admin]
    E --> F[Service orchestration and domain validation]
    F --> G[Drizzle query and mutation path]
    G --> H[External adapter calls if required]
    H --> I[Response with c.json or c.redirect]
    I --> J[Structured logs and metrics emitted]
```

## Auth and Context Lifecycle

```mermaid
flowchart TD
    A[Request with auth token] --> B[Clerk auth identity]
    B --> C[Session cache lookup redis then memory]
    C -->|Hit| D[User resolved]
    C -->|Miss| E[Source sync and upsert]
    E --> F[Dual-write cache refresh]
    D --> G[Resolve role and mentorado linkage]
    F --> G
    G --> H[Procedure middleware authorization]
    H --> I[Proceed or fail with explicit code]
```

## Webhook Lifecycle

```mermaid
flowchart TD
    A[Provider sends webhook] --> B[Signature verification]
    B --> C[Dedup check with event id]
    C --> D[Persist ingress record for critical events]
    D --> E[Ack fast]
    E --> F[Async processing and side effects]
    F --> G[Retry classification retryable terminal]
    G --> H[Dead-letter or success mark]
```

## External API Lifecycle

```mermaid
flowchart TD
    A[Service requests provider operation] --> B[Adapter input validation]
    B --> C[Timeout budget applied]
    C --> D[Provider request]
    D -->|2xx| E[Normalize response]
    D -->|429 or 5xx| F[Retry policy with jitter]
    F --> G[Circuit state evaluation]
    G --> H[Degrade gracefully or recover]
    E --> I[Persist and return domain result]
    H --> I
```

## Validation Points by Stage

| Stage | Must Validate |
|---|---|
| Edge | request size, rate limit, route-level trust |
| Auth | token validity, actor identity stability |
| Context | role linkage, mentorado linkage, logger correlation |
| Service | domain invariants, idempotency key presence |
| DB | index-aware query, conflict-safe writes |
| External | timeout, retry class, rate-limit behavior |
| Response | stable error contract and correlation id |

## Hono Request Patterns

| Operation | Pattern |
|---|---|
| Parse JSON body | `await c.req.json()` |
| Query params | `c.req.query('key')` |
| URL params | `c.req.param('id')` |
| Headers | `c.req.header('x-token')` |
| JSON response | `c.json({ data })` |
| Status + JSON | `c.json({ error }, 404)` |
| Middleware | `async (c, next) => { ... await next() }` |
| Context vars | `c.set('key', value)` / `c.get('key')` |
| Error handler | `app.onError((err, c) => c.json(..., 500))` |
