# Portal Grupo US - AGENTS.md

> **AI Agent Guide for Portal Grupo US (GPUS)**

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Portal Grupo US |
| **Type** | CRM + Student Management Portal |
| **Domain** | Health aesthetics education business |
| **Package Manager** | `bun` (ALWAYS - never npm/yarn/pnpm) |

---

## 📦 Tech Stack

| Layer     | Technology                      |
| --------- | ------------------------------- |
| Runtime   | Bun                             |
| Frontend  | React 19 + Vite 7               |
| Styling   | Tailwind CSS 4 + shadcn/ui      |
| Routing   | TanStack Router (file-based)    |
| State     | TanStack Query + Convex         |
| Backend   | Convex (query/mutation/action)  |
| Database  | Convex (integrated)             |
| Auth      | Clerk                           |
| Linter    | Biome                           |
| Tests     | Vitest + Playwright             |

---

## 📁 Directory Structure

```
gpus/
├── src/                      # React 19 frontend
│   ├── components/           # shadcn/ui + custom → AGENTS.md
│   ├── routes/               # TanStack Router pages → AGENTS.md
│   ├── hooks/                # Custom React hooks → AGENTS.md
│   └── lib/                  # Utilities → AGENTS.md
├── convex/                   # Convex backend → AGENTS.md
│   ├── schema.ts             # Database schema
│   ├── _generated/           # Auto-generated types
│   └── *.ts                  # Handlers
├── tests/                    # Test suites → AGENTS.md
├── docs/                     # Documentation
└── .agent/                   # AI configuration
    ├── skills/               # 7 skills
    ├── workflows/            # 4 workflows
    └── rules/GEMINI.md       # Master rules
```

---

## 🚀 Quick Commands

```bash
# Development
bun dev                 # Vite + Convex concurrent
bun run build           # Build + TypeScript check

# Quality
bun run lint            # Biome fix
bun run lint:check      # Biome check
bun run test            # Vitest

# Convex
bunx convex dev         # Dev mode
bunx convex deploy      # Production deploy
bunx convex dashboard   # Open dashboard

# Components
bunx shadcn@latest add [component]
```

---

## 🔧 Code Patterns

### Convex Query
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return ctx.db
      .query("items")
      .filter(q => args.status ? q.eq(q.field("status"), args.status) : true)
      .collect();
  },
});
```

### Convex Mutation
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return ctx.db.insert("items", {
      name: args.name,
      userId: identity.subject,
      createdAt: Date.now(),
    });
  },
});
```

### React Component with Convex
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ItemList() {
  const items = useQuery(api.items.list);
  const createItem = useMutation(api.items.create);
  
  if (!items) return <Skeleton />;
  
  return (
    <ul>
      {items.map(item => (
        <li key={item._id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### TanStack Router Route
```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return <div>Dashboard Content</div>;
}
```

---

## 🔐 Auth Patterns

### Frontend (Clerk)
```tsx
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";

export function Header() {
  const { isSignedIn } = useAuth();
  
  return (
    <header>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <a href="/sign-in">Sign In</a>
      </SignedOut>
    </header>
  );
}
```

### Backend (Convex)
```typescript
export const protectedQuery = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // identity.subject = Clerk userId
    return ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();
  },
});
```

---

## ✅ Definition of Done

- [ ] `bun run build` passes
- [ ] `bun run lint:check` passes
- [ ] `bun run test` passes
- [ ] No console errors
- [ ] Responsive tested (mobile + desktop)

---

## 🧠 Core Principles

| Principle | Description |
|-----------|-------------|
| **LEVER** | Leverage → Extend → Verify → Eliminate → Reduce |
| **KISS** | Simple solutions over complex ones |
| **YAGNI** | Build only what's required |
| **Extend First** | 0 new tables, extend existing |

---

## 🔗 Related AGENTS.md Files

- [src/AGENTS.md](src/AGENTS.md) - Frontend patterns
- [src/components/AGENTS.md](src/components/AGENTS.md) - Component library
- [src/routes/AGENTS.md](src/routes/AGENTS.md) - Routing patterns
- [convex/AGENTS.md](convex/AGENTS.md) - Backend patterns
- [tests/AGENTS.md](tests/AGENTS.md) - Testing patterns

---

## 📚 Skills Available

| Skill | Purpose |
|-------|---------|
| `backend-design` | Convex, TypeScript, data patterns |
| `debug` | Testing, debugging, fixing |
| `frontend-design` | UI/UX, Tailwind, components |
| `notion-cms` | Notion CMS integration |
| `planning` | Project planning, PRPs |
| `gpus-theme` | Navy/Gold design system |
| `ui-ux-pro-max` | Design intelligence |

## 🔄 Workflows Available

| Command | Purpose |
|---------|---------|
| `/plan` | Create implementation plan |
| `/implement` | Execute approved plan |
| `/debug` | Systematic debugging |
| `/design` | Frontend design orchestration |
