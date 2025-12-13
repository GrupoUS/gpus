# convex/ - Backend (Database + API)

## Package Identity

**Purpose:** Serverless backend with real-time database, queries, and mutations  
**Tech:** Convex (TypeScript-based serverless platform)

---

## Setup & Run

```bash
# Development (from root)
bun run dev:convex

# Deploy to production
bun run deploy:convex

# Open Convex dashboard
bunx convex dashboard
```

---

## Patterns & Conventions

### File Organization

```
convex/
├── schema.ts           # Database schema definition
├── leads.ts            # Lead queries/mutations
├── users.ts            # User queries/mutations
├── auth.config.ts      # Clerk integration config
└── _generated/         # Auto-generated (don't edit)
```

### Schema Definition

✅ **DO:** Define tables in `schema.ts`
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    stage: v.string(),
    createdAt: v.number(),
  })
    .index('by_phone', ['phone'])
    .index('by_stage', ['stage']),
})
```

✅ **DO:** Add indexes for frequently queried fields

### Queries

✅ **DO:** Export queries for reading data
```typescript
// convex/leads.ts
import { query } from './_generated/server'
import { v } from 'convex/values'

export const listLeads = query({
  args: {
    stage: v.optional(v.string()), // Filter by stage
    search: v.optional(v.string()), // Search via text
  },
  handler: async (ctx, args) => {
    let leads
    if (args.stage) {
      if (args.stage === 'all') {
        leads = await ctx.db.query('leads').order('desc').collect()
      } else {
        leads = await ctx.db
          .query('leads')
          .withIndex('by_stage', (q) => q.eq('stage', args.stage))
          .collect()
      }
    } else {
      leads = await ctx.db.query('leads').order('desc').collect()
    }
    
    if (args.search) {
      const search = args.search.toLowerCase()
      leads = leads.filter(l => 
        l.name.toLowerCase().includes(search) || 
        l.phone.includes(search) ||
        (l.email && l.email.toLowerCase().includes(search))
      )
    }
    
    return leads
  },
})
```

### Mutations

✅ **DO:** Export mutations for writing data
```typescript
// convex/leads.ts
import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const createLead = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: v.union(
      v.literal('whatsapp'),
      v.literal('instagram'),
      v.literal('landing_page'),
      v.literal('indicacao'),
      v.literal('evento'),
      v.literal('organico'),
      v.literal('trafego_pago'),
      v.literal('outro')
    ),
    profession: v.optional(v.union(
      v.literal('enfermeiro'),
      v.literal('dentista'),
      v.literal('biomedico'),
      v.literal('farmaceutico'),
      v.literal('medico'),
      v.literal('esteticista'),
      v.literal('outro')
    )),
    interestedProduct: v.optional(v.union(
      v.literal('trintae3'),
      v.literal('otb'),
      v.literal('black_neon'),
      v.literal('comunidade'),
      v.literal('auriculo'),
      v.literal('na_mesa_certa'),
      v.literal('indefinido')
    )),
    temperature: v.union(
      v.literal('frio'),
      v.literal('morno'),
      v.literal('quente')
    ),
    stage: v.union(
      v.literal('novo'),
      v.literal('primeiro_contato'),
      v.literal('qualificado'),
      v.literal('proposta'),
      v.literal('negociacao'),
      v.literal('fechado_ganho'),
      v.literal('fechado_perdido')
    ),
    assignedTo: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const leadId = await ctx.db.insert('leads', {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return leadId
  }
})

export const updateLeadStage = mutation({
  args: {
    leadId: v.id('leads'),
    newStage: v.union(
      v.literal('novo'),
      v.literal('primeiro_contato'),
      v.literal('qualificado'),
      v.literal('proposta'),
      v.literal('negociacao'),
      v.literal('fechado_ganho'),
      v.literal('fechado_perdido')
    )
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")
    
    await ctx.db.patch(args.leadId, {
      stage: args.newStage,
      updatedAt: Date.now()
    })
  }
})

export const updateLead = mutation({
  args: {
    leadId: v.id('leads'),
    patch: v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      stage: v.optional(v.union(
        v.literal('novo'),
        v.literal('primeiro_contato'),
        v.literal('qualificado'),
        v.literal('proposta'),
        v.literal('negociacao'),
        v.literal('fechado_ganho'),
        v.literal('fechado_perdido')
      )),
      interestedProduct: v.optional(v.union(
        v.literal('trintae3'),
        v.literal('otb'),
        v.literal('black_neon'),
        v.literal('comunidade'),
        v.literal('auriculo'),
        v.literal('na_mesa_certa'),
        v.literal('indefinido')
      )),
    })
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    await ctx.db.patch(args.leadId, {
      ...args.patch,
      updatedAt: Date.now()
    })
  }
})
```

**Note**: These are the actual functions implemented in `convex/leads.ts`. The examples above show the real patterns used in this codebase, including Brazilian Portuguese field names and validation rules.
    leadId: v.id('leads'),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, {
      stage: args.stage,
      updatedAt: Date.now(),
    })
  },
})
```

### Authentication

✅ **DO:** Use Clerk for auth (configured in `auth.config.ts`)
```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
}
```

✅ **DO:** Access authenticated user in functions
```typescript
export const getMyLeads = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
    
    return await ctx.db
      .query('leads')
      .withIndex('by_assigned', (q) => q.eq('assignedTo', user._id))
      .collect()
  },
})
```

---

## Touch Points / Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema (tables, indexes) |
| `convex/leads.ts` | Lead-related queries/mutations |
| `convex/users.ts` | User-related queries/mutations |
| `convex/auth.config.ts` | Clerk authentication config |
| `convex/_generated/api.ts` | Auto-generated API types |

---

## JIT Index Hints

```bash
# Find a query
rg -n "export const.*= query" convex/

# Find a mutation
rg -n "export const.*= mutation" convex/

# Find table usage
rg -n "ctx.db.query\('tableName'\)" convex/

# Find indexes
rg -n "withIndex" convex/
```

---

## Common Gotchas

- **Schema changes:** Run `bunx convex dev` to apply schema changes
- **Indexes:** Always add indexes for fields used in `withIndex()` queries
- **Timestamps:** Use `Date.now()` (milliseconds) for timestamps
- **IDs:** Use `v.id('tableName')` for foreign keys
- **Auth:** Clerk JWT issuer must match in `auth.config.ts`
- **Real-time:** Queries automatically re-run when data changes (no polling needed)

---

## Pre-PR Checks

```bash
# Ensure schema is valid
bunx convex dev --once

# Type check
bun run build
```
