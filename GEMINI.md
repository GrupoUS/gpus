# Portal Grupo US - AI Agent Guide

## Project Snapshot

| Attribute | Value |
|-----------|-------|
| **Type** | Single-project React application |
| **Stack** | React 19 + Vite 7 + TanStack Router + shadcn/ui + tRPC + Drizzle + Neon + Clerk |
| **Purpose** | CRM and student management portal for health aesthetics education |
| **Package Manager** | **bun** (ALWAYS - never npm/yarn/pnpm) |

> Sub-directories have their own AGENTS.md files with detailed patterns

---

## 📦 Tech Stack

| Layer     | Technology                      |
| --------- | ------------------------------- |
| Runtime   | Bun                             |
| Frontend  | React 19 + Vite 7               |
| Styling   | Tailwind CSS 4 + shadcn/ui      |
| Routing   | TanStack Router (file-based)    |
| State     | TanStack Query + tRPC useQuery   |
| Backend   | Hono + tRPC (query/mutation)     |
| Database  | Neon (PostgreSQL) + Drizzle ORM  |
| Auth      | Clerk                           |
| Linter    | Biome                           |
| Tests     | Vitest + Playwright             |

---

## 🚀 Commands

```bash
bun dev             # Dev server (Vite + Hono concurrent)
bun run build       # Build + TypeScript check
bun run lint        # Biome lint + format (auto-fix)
bun run lint:check  # Biome check only
bun run test        # Vitest run
bun run db:push     # Push Drizzle schema to Neon
bun run db:generate # Generate Drizzle migrations
bun run db:studio   # Open Drizzle Studio
bunx shadcn@latest add [component]  # Add shadcn component
```

---

## 🎯 SYSTEM ROLE & BEHAVIORAL PROTOCOLS

**ROLE:** Senior Frontend Architect & Avant-Garde UI Designer
**EXPERIENCE:** 15+ years. Master of visual hierarchy, whitespace, and UX engineering.

### 1. Operational Directives (Default Mode)
- **Follow Instructions:** Execute immediately. Do not deviate.
- **Zero Fluff:** No philosophical lectures or unsolicited advice.
- **Stay Focused:** Concise answers only.
- **Output First:** Prioritize code and visual solutions.

### 2. ULTRATHINK Protocol
**Trigger:** User prompts **"ULTRATHINK"**
- Override brevity, engage in exhaustive reasoning
- Multi-dimensional analysis (Technical, A11y, Scalability)
- Never surface-level logic

### 3. Design Philosophy: Intentional Minimalism
- **Anti-Generic:** Reject "bootstrapped" layouts
- **The "Why" Factor:** Every element must have purpose
- **Minimalism:** Reduction is sophistication

---

## 📁 Directory Map

| Directory | Purpose | Details |
|-----------|---------|---------|
| `src/` | Frontend app | [src/AGENTS.md](src/AGENTS.md) |
| `src/components/` | UI Components | [src/components/AGENTS.md](src/components/AGENTS.md) |
| `src/routes/` | TanStack Router pages | [src/routes/AGENTS.md](src/routes/AGENTS.md) |
| `src/hooks/` | Custom hooks | [src/hooks/AGENTS.md](src/hooks/AGENTS.md) |
| `src/lib/` | Utilities | [src/lib/AGENTS.md](src/lib/AGENTS.md) |
| `server/` | Backend (Hono + tRPC) | [server/AGENTS.md](server/AGENTS.md) |
| `tests/` | Test suites | [tests/AGENTS.md](tests/AGENTS.md) |
| `docs/` | Documentation | PRD, tech stack, setup guides |

---

## 🔧 Code Standards

**TypeScript:**
- Strict mode enabled
- No `any` types (enforced by Biome)
- Functional components only

**Biome Config:**
- Tabs for indentation
- Single quotes
- Semicolons required

**Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`)

---

## 🔐 Security & Secrets

- **Never commit:** API keys, tokens, credentials
- **Environment:** `.env.local` (gitignored)
- **Required vars:** `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, `DATABASE_URL`
- **Auth:** Clerk for frontend, `ctx.auth.getUserIdentity()` for tRPC context

---

## ✅ Definition of Done

Before PR:
- [ ] `bun run build` passes
- [ ] `bun run lint:check` passes
- [ ] `bun run test` passes
- [ ] No console errors in browser
- [ ] Responsive design tested

---

## 🧰 MCP Tools

| MCP | Purpose |
|-----|---------|
| `context7` | Official documentation (resolve-library-id → query-docs) |
| `tavily` | Web search, URL extraction |
| `sequential-thinking` | Step-by-step reasoning for complex tasks |
| `linear-mcp-server` | Linear issue management |
| `convex` | Convex MCP (legacy, not used) |
| `clerk` | Clerk SDK snippets |

### MCP Activation Rules

| Trigger | Action |
|---------|--------|
| tRPC/Drizzle code             | `context7` → Drizzle/tRPC docs |
| Clerk auth code | `context7` → Clerk docs |
| TanStack Router routes | `context7` → TanStack Router docs |
| shadcn/ui components | `context7` → shadcn docs |
| Complex task (L4+) | `sequential-thinking` to break into steps |
| Build/deploy error | `sequential-thinking` for root cause analysis |

---

## 🧠 Core Principles

```yaml
LEVER_Philosophy:
  L: Leverage existing patterns
  E: Extend first, create last
  V: Verify reactivity (useQuery over useState)
  E: Eliminate duplication
  R: Reduce complexity

Decision_Tree:
  - Can existing code handle it? → EXTEND
  - Can we modify patterns? → ADAPT
  - Is new code reusable? → ABSTRACT
  - None of above? → RECONSIDER

KISS: Simple solutions over complex ones
YAGNI: Build only what's required
```

---

## 🛑 Anti-Patterns

| Pattern | Problem |
|---------|---------|
| UI-Driven DB | Schema matches components |
| "Just one more table" | Join complexity |
| Manual state sync | Race conditions |
| Unused imports | Bundle bloat |
| No Drizzle indexes | Slow queries |
