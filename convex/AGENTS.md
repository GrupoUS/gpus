# convex/ - Backend (Database + API)

## Package Identity

**Purpose:** Serverless backend with real-time database, queries, mutations, and actions.
**Tech:** Convex (TypeScript-based serverless platform)
**Docs:** [Convex Docs](https://docs.convex.dev/home)

---

## Setup & Run

```bash
# Development (from root) with live updates
bun run dev:convex

# Deploy to production (auto-triggers on push to main usually)
bun run deploy:convex

# Open Convex dashboard (Production/Dev controls)
bunx convex dashboard

# Data Management
bunx convex import --table tableName data.jsonl  # Import data
bunx convex export                             # Export all data

# Logs
bunx convex logs                               # Tail logs
```

---

## Patterns & Conventions

### File Organization

```
convex/
├── schema.ts           # Database schema definition (Tables + Indexes)
├── auth.config.ts      # Clerk/Auth provider config
├── http.ts             # HTTP API endpoints
├── crons.ts            # Cron job definitions
├── _generated/         # Auto-generated SD K (DO NOT EDIT)
├── [feature].ts        # Feature-specific queries/mutations
└── [folder]/           # Nested features supported
    └── index.ts        # Grouped logic
```

### Schema Definition

✅ **DO:** Define tables in `schema.ts` using `defineSchema` and `defineTable`.
✅ **DO:** explicit define indexes for every query filter/ordering.
✅ **DO:** Follow index naming convention `by_field1_and_field2`.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('archive')),
    ownerId: v.id('users'), // Reference to other table
  })
    .index('by_status', ['status'])
    .index('by_owner_status', ['ownerId', 'status']), // Composite index
})
```

### Validators & Types

| Type | Validator | TS Type | Note |
|------|-----------|---------|------|
| ID | `v.id("tableName")` | `Id<"tableName">` | Foreign keys |
| String | `v.string()` | `string` | UTF-8, max 1MB |
| Int64 | `v.int64()` | `bigint` | Use for large integers |
| Number | `v.number()` | `number` | Float64 |
| Boolean | `v.boolean()` | `boolean` | |
| Null | `v.null()` | `null` | No `undefined` |
| Object | `v.object({...})` | `object` | Plain JS objects |
| Array | `v.array(v.string())` | `string[]` | Max 8192 items |
| Union | `v.union(v.string(), v.number())` | `string \| number` | |

**TypeScript Tip:** Use `Id<'tableName'>` for strict ID typing.

### Functions (Query / Mutation / Action)

✅ **DO:** Use the object syntax with `args`, `returns`, and `handler`.
✅ **DO:** Use `internalQuery`/`internalMutation` for private logic calling only by other functions.

#### Query (Read-only)
```typescript
import { query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: { status: v.string() },
  returns: v.array(v.object({ _id: v.id('leads'), name: v.string() })),
  handler: async (ctx, args) => {
    // ❌ NO: .filter (slow)
    // ✅ YES: .withIndex (fast)
    return await ctx.db
      .query('leads')
      .withIndex('by_status', q => q.eq('status', args.status))
      .collect()
  },
})
```

#### Mutation (Write)
```typescript
import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: { name: v.string() },
  returns: v.id('leads'),
  handler: async (ctx, args) => {
    // ❌ NO: ctx.db.delete() on query result directly.
    // ✅ YES: ctx.db.insert, ctx.db.patch, ctx.db.replace, ctx.db.delete(id)
    return await ctx.db.insert('leads', {
        name: args.name,
        status: 'active'
    })
  }
})
```

#### Action (Third-party / Long-running)
**Note:** Actions cannot access `ctx.db` directly. Use `ctx.runQuery` or `ctx.runMutation`.

```typescript
import { action } from './_generated/server'
import { internal } from './_generated/api'

export const generateAI = action({
  args: { prompt: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    // 1. Call external API
    const result = await fetch('https://api.openai.com/...')
    // 2. Write back to DB via mutation
    await ctx.runMutation(internal.leads.updateAnalysis, { result })
    return "Done"
  }
})
```

### HTTP Endpoints
Defined in `convex/http.ts`.
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

### Pagination
```typescript
import { paginationOptsValidator } from "convex/server";

export const listConfig = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("leads").paginate(args.paginationOpts);
  },
});
```

---

## Client Integration

### React (Standard)
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);

  // Optimistic updates are handled automatically by Convex for simple cases,
  // or manually via mutation options.
}
```

### TanStack Query
If using `convex-helpers` or similar integration:
```tsx
import { useConvexQuery } from "@convex-dev/react-query";
// Follow specific setup guide for QueryClient provider
```

### TanStack Start
For SSR and Loaders in TanStack Start:
- Use `fetchQuery` or `preloadQuery` in loaders.
- Hydrate data on the client.
- Ensure `ConvexProvider` wraps the app.

---

## Technical Rules (The Factory Standard)

1.  **Function Registration**:
    *   `query`/`mutation`/`action` = **Public API** (Exposed to client).
    *   `internalQuery`/`internalMutation` = **Private** (Only callable by other functions/crons).
    *   Never use `api` object to call functions within the same file (circular dependency risk).

2.  **Database operations**:
    *   `.unique()`: Get single doc or throw.
    *   `ctx.db.patch(id, partial)`: Shallow merge.
    *   `ctx.db.replace(id, fullDoc)`: Full replacement.
    *   **NO** `.delete()` queries. Iterate and `ctx.db.delete(id)`.

3.  **Scheduling & Crons**:
    *   Use `ctx.scheduler.runAfter(0, ...)` for async background work.
    *   Define crons in `convex/crons.ts` using `crons.interval`.

4.  **File Storage**:
    *   Use `ctx.storage.getUrl(storageId)` to get signed URLs.
    *   Metadata is in `system` table `_storage`.

5.  **Authentication**:
    *   Always use `ctx.auth.getUserIdentity()` in mutations/queries to verify user.
    *   Throw explicit errors: `throw new Error("Unauthenticated")`.

---

## JIT Index Hints

```bash
# Find public queries
rg "export const .* = query" convex/

# Find internal mutations
rg "export const .* = internalMutation" convex/

# Find schema definitions
rg "defineTable" convex/schema.ts

# Find usages of a specific table
rg 'ctx.db.query\("leads"\)'
```

---

## Common Gotchas

*   **Filter vs Index**: `filter()` scans all docs (slow/expensive). `withIndex()` uses db index (fast). ALWAYS prefer `withIndex`.
*   **Undefined Returns**: Convex functions returning `undefined` become `null` on client. Explicitly return `null`.
*   **System Fields**: `_id` and `_creationTime` are auto-generated. Do not define them in schema.
*   **Circular logic**: Do not call a public query from another public query if avoidable; better to extract shared logic to a helper TS function.
*   **Env Vars**: Use `process.env.NAME`. Set in Dashboard or Project Settings.

---

## Pre-PR Checks

```bash
# 1. Type Check
bun run build

# 2. Schema Validation (Dry run)
bunx convex dev --once

# 3. Linting (if standard lint exists)
bun lint
```
