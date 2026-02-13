---
trigger: always_on
---

# Portal NEON DASHBOARD — Project Technical Specification

> **Single source of truth for project-level technical context.**
> Agent behavioral rules → [`AGENTS.md`](AGENTS.md)
> Gemini-specific rules → [`.agent/rules/GEMINI.md`](.agent/rules/GEMINI.md)

---

## Project Snapshot

| Field        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| **Type**     | Fullstack Mentorship Performance Dashboard                              |
| **Stack**    | React 19 + Vite 7 + tRPC 11 + Drizzle ORM + Neon PostgreSQL + Express  |
| **Runtime**  | **Bun** (package manager + runtime + server bundler)                    |
| **Routing**  | **TanStack Router** (file-based, type-safe)                             |
| **Auth**     | Clerk (`@clerk/clerk-react` + `@clerk/express`)                        |
| **Payments** | Stripe (subscriptions, webhooks)                                        |
| **AI**       | Google Gemini (`@google/genai` + Vercel AI SDK)                         |
| **Email**    | Resend                                                                  |
| **Linter**   | Biome (lint + format)                                                   |
| **Tests**    | Vitest                                                                  |
| **Purpose**  | Track mentorados performance metrics, faturamento, and mentor feedback  |

---

## Architecture Map

```text
neondash/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components (shadcn/ui + custom)
│   │   ├── pages/           # Route pages
│   │   ├── routes/          # TanStack Router route files
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/
│   │       └── trpc.ts      # tRPC client
│   └── index.html
├── server/                  # Express + tRPC backend
│   ├── _core/               # Server core (index, context, env, stripe)
│   └── *.ts                 # Feature routers (tRPC)
├── drizzle/                 # Database layer
│   ├── schema.ts            # Neon PostgreSQL tables (source of truth)
│   └── migrations/          # SQL migration files
├── .agent/                  # AI agent configuration
│   ├── skills/              # 13 skills
│   ├── workflows/           # 4 workflows
│   └── rules/               # Gemini-specific rules
└── docs/                    # Planning and operational notes
```

---

## Tech Stack Quick Reference

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Runtime  | Bun                                       |
| Frontend | React 19 + Vite 7                         |
| Styling  | Tailwind CSS 4 + shadcn/ui                |
| Routing  | TanStack Router                           |
| State    | TanStack Query + tRPC                     |
| Backend  | Express + tRPC 11                         |
| Database | Neon PostgreSQL + Drizzle ORM             |
| Auth     | Clerk                                     |
| Payments | Stripe                                    |
| AI       | Google Gemini + Vercel AI SDK             |
| Email    | Resend                                    |
| Linter   | Biome                                     |
| Tests    | Vitest                                    |

> [!CAUTION]
> Este projeto sempre usa **`bun`** como package manager, runtime e bundler.
> ✅ `bun install`, `bun run`, `bunx`, `bun test`
> ❌ Nunca use `npm`, `yarn`, `pnpm`

---

## Commands

| Task                  | Command              |
| --------------------- | -------------------- |
| Install dependencies  | `bun install`        |
| Start development     | `bun dev`            |
| Build                 | `bun run build`      |
| Type check            | `bun run check`      |
| Lint + format check   | `bun run lint:check` |
| Lint + format (fix)   | `bun run lint`       |
| Format only           | `bun run format`     |
| Run tests             | `bun test`           |
| Push DB schema        | `bun run db:push`    |

---

## Environment Variables

| Variable                      | Required | Purpose                         |
| ----------------------------- | -------- | ------------------------------- |
| `DATABASE_URL`                | ✅       | Neon PostgreSQL connection      |
| `CLERK_SECRET_KEY`            | ✅       | Clerk backend auth              |
| `VITE_CLERK_PUBLISHABLE_KEY`  | ✅       | Clerk frontend auth             |
| `STRIPE_SECRET_KEY`           | ✅       | Stripe payments API             |
| `STRIPE_WEBHOOK_SECRET`       | ✅       | Stripe webhook verification     |
| `GEMINI_API_KEY`              | ✅       | Google Gemini AI                |
| `RESEND_API_KEY`              | ○        | Email via Resend                |
| `RESEND_FROM_EMAIL`           | ○        | Sender address (default set)    |
| `GOOGLE_CLIENT_ID`            | ○        | Google Calendar OAuth           |
| `GOOGLE_CLIENT_SECRET`        | ○        | Google Calendar OAuth           |
| `GOOGLE_REDIRECT_URI`         | ○        | OAuth callback URL              |
| `INSTAGRAM_APP_ID`            | ○        | Instagram Business API          |
| `INSTAGRAM_APP_SECRET`        | ○        | Instagram Business API          |
| `INSTAGRAM_REDIRECT_URI`      | ○        | Instagram callback URL          |
| `META_APP_ID`                 | ○        | Meta/Facebook APIs              |
| `META_APP_SECRET`             | ○        | Meta/Facebook APIs              |
| `META_WEBHOOK_VERIFY_TOKEN`   | ○        | WhatsApp webhook verification   |
| `META_SYSTEM_USER_ACCESS_TOKEN` | ○      | WhatsApp Cloud API              |
| `BAILEYS_SESSION_DIR`         | ○        | Baileys session storage path    |
| `NODE_ENV`                    | ○        | Runtime environment             |

---

## Database Schema Overview

Source of truth: [`drizzle/schema.ts`](drizzle/schema.ts)

### Core Tables

| Table              | Purpose                    | Key Relations              |
| ------------------ | -------------------------- | -------------------------- |
| `users`            | Clerk-backed auth + billing | Stripe fields, role enum  |
| `mentorados`       | Extended mentee profiles   | → users, integrations      |
| `metricas_mensais` | Monthly performance data   | → mentorados               |
| `feedbacks`        | Mentor feedback per month  | → mentorados               |
| `badges`           | Achievement definitions    | categoria enum             |
| `mentorado_badges` | Earned badges tracking     | → mentorados, → badges     |
| `ranking_mensal`   | Monthly rankings           | → mentorados               |

### CRM Tables

| Table              | Purpose                    | Key Relations              |
| ------------------ | -------------------------- | -------------------------- |
| `leads`            | CRM lead management        | → mentorados, status enum  |
| `interacoes`       | Lead interactions log      | → leads, → mentorados      |
| `crm_column_config`| Custom Kanban columns      | → mentorados               |
| `tasks`            | Mentorado task checklists  | → mentorados               |

### Patient Management Tables

| Table                       | Purpose                  | Key Relations         |
| --------------------------- | ------------------------ | --------------------- |
| `pacientes`                 | Patient records          | → mentorados          |
| `pacientes_info_medica`     | Medical information      | → pacientes           |
| `pacientes_procedimentos`   | Treatment records        | → pacientes           |
| `pacientes_fotos`           | Photo gallery            | → pacientes           |
| `pacientes_documentos`      | Document management      | → pacientes           |
| `pacientes_chat_ia`         | AI chat per patient      | → pacientes           |
| `planos_tratamento`         | Treatment plans          | → pacientes           |
| `pacientes_consentimentos`  | Consent tracking         | → pacientes           |

### Financial Tables

| Table                    | Purpose               | Key Relations          |
| ------------------------ | ---------------------- | ---------------------- |
| `categorias_financeiras` | Expense/income cats    | → mentorados           |
| `formas_pagamento`       | Payment methods        | → mentorados           |
| `transacoes`             | Financial transactions | → mentorados           |
| `insumos`                | Supplies/materials     | → mentorados           |
| `procedimentos`          | Service catalog        | → mentorados           |

### Integration Tables

| Table                 | Purpose               | Key Relations          |
| --------------------- | --------------------- | ---------------------- |
| `whatsapp_messages`   | WhatsApp msg history  | → mentorados           |
| `whatsapp_contacts`   | WhatsApp contacts     | → mentorados           |
| `instagram_tokens`    | Instagram OAuth       | → mentorados           |
| `instagram_sync_log`  | Sync audit trail      | → mentorados           |
| `facebook_ads_*`      | Facebook Ads data     | → mentorados           |
| `google_tokens`       | Google Calendar OAuth | → users                |

---

## Backend Architecture Standards

> Canonical authority: [`.agent/skills/backend-design/SKILL.md`](.agent/skills/backend-design/SKILL.md)

### Procedure Hierarchy

```
publicProcedure          → health checks, public endpoints only
protectedProcedure       → Clerk auth required (base for most routes)
adminProcedure           → protectedProcedure + role === "admin"
mentoradoProcedure       → protectedProcedure + mentorado lookup
```

### Canonical Request Lifecycle

```
HTTP → Express → tRPC Router → Procedure (auth middleware)
  → Zod Input Validation → Service Logic → Drizzle Query → Response
```

### Service Layer Patterns

- **Service functions** live alongside routers, NOT in separate `/services/` dir
- Keep business logic in service functions, not in procedure handlers
- Single responsibility: one service = one domain concern
- Use `Promise.all` for batch writes
- Reuse queries via composable functions

### Database Principles

- **Extension-first**: Add columns to existing tables before creating new ones
- **Anti-sprawl**: Score > 5 → extend, Score ≤ 5 → consider new table
- **Index FKs**: Every foreign key MUST have an index
- **No `SELECT *`**: Always specify needed columns
- **Migrations**: Use `bun run db:push` for development

### Key References

| Document                | Path                                                       |
| ----------------------- | ---------------------------------------------------------- |
| API Patterns            | `.agent/skills/backend-design/references/api-patterns.md`  |
| Request Lifecycle       | `.agent/skills/backend-design/references/request-lifecycle.md` |
| Database Design         | `.agent/skills/backend-design/references/database-design.md` |
| Code Principles         | `.agent/skills/backend-design/references/code-principles.md` |
| Infrastructure          | `.agent/skills/backend-design/references/infrastructure.md` |
| Operational Guardrails  | `.agent/skills/backend-design/references/operational-guardrails.md` |
| Runbooks                | `.agent/skills/backend-design/references/runbooks.md`      |
| Debugging Matrix        | `.agent/skills/backend-design/references/debugging-matrix.md` |
| TypeScript Patterns     | `.agent/skills/backend-design/references/typescript-patterns.md` |

---

## Authority Precedence

When guidance overlaps between files:

1. **Backend canonical authority**: `.agent/skills/backend-design/SKILL.md`
2. **Agent behavioral rules**: `AGENTS.md`
3. **Gemini-specific rules**: `.agent/rules/GEMINI.md`
4. **This file**: `GEMINI.md` (project context)

---

## Scope Note

This file provides **project-level technical context only**. For agent behavior, code quality standards, and design philosophy, see [`AGENTS.md`](AGENTS.md). For Gemini-specific skill loading and workflow rules, see [`.agent/rules/GEMINI.md`](.agent/rules/GEMINI.md).
