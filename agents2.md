# AegisWallet Development Rules

> Voice-first financial assistant for Brazilian market. NOT crypto wallet.

## Project Snapshot

**Type**: Single full-stack project (React 19 + Hono + Neon PostgreSQL)
**Stack**: Bun + Vite + TanStack Router/Query + Drizzle ORM + Clerk Auth
**Market**: Brazilian fintech (PIX, LGPD, Portuguese-first, WCAG 2.1 AA+)
**Note**: Sub-packages have their own AGENTS.md files (see JIT Index below)

## Root Setup Commands

```bash
# Install dependencies
bun install

# Development (client + server)
bun dev:full                   # Verify DB + start both servers
bun dev:client                 # Frontend only (port 8080)
bun dev:server                 # Backend only (port 3000)

# Build all
bun build                      # Build client + API for production

# Typecheck all
bun type-check                 # TypeScript validation

# Test all
bun test                       # Unit tests (Vitest)
bun test:e2e                   # E2E tests (Playwright)
bun quality:parallel           # Parallel quality gates
```

## Universal Conventions

**Code Style**:
- TypeScript strict mode (no `any`, explicit types)
- Biome for linting/formatting (50-100x faster than ESLint)
- Semantic color tokens (NEVER hardcode colors)
- Portuguese-first interfaces (Brazilian market)

**Commit Format**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
**Branch Strategy**: `main` (production), `dev` (staging), feature branches
**PR Requirements**: ✅ Tests pass | ✅ Type-check | ✅ Lint | ✅ Security scan | ✅ Lighthouse ≥90

## Security & Secrets

- **NEVER** commit tokens, API keys, or credentials
- **Secrets**: Use `.env` (see `env.example` for required variables)
- **PII Handling**: LGPD compliance required (see `src/db/schema/lgpd.ts`)
- **Database**: Row-Level Security (RLS) policies enforced via Drizzle

## JIT Index - Directory Map

### Package Structure
- **Frontend Components**: `src/components/` → [see src/components/AGENTS.md](src/components/AGENTS.md)
- **Feature Modules**: `src/features/` → [see src/features/AGENTS.md](src/features/AGENTS.md)
- **Custom Hooks**: `src/hooks/` → [see src/hooks/AGENTS.md](src/hooks/AGENTS.md)
- **Utility Libraries**: `src/lib/` → [see src/lib/AGENTS.md](src/lib/AGENTS.md)
- **Business Services**: `src/services/` → [see src/services/AGENTS.md](src/services/AGENTS.md)
- **Router Pages**: `src/routes/` → [see src/routes/AGENTS.md](src/routes/AGENTS.md)
- **Backend API**: `src/server/` → [see src/server/AGENTS.md](src/server/AGENTS.md)
- **Database Layer**: `src/db/` → [see src/db/AGENTS.md](src/db/AGENTS.md)
- **Testing**: `tests/` → [see tests/AGENTS.md](tests/AGENTS.md)
- **Factory System**: `.factory/` → [see .factory/AGENTS.md](.factory/AGENTS.md)

### Quick Find Commands

```bash
# Search for a function
rg -n "functionName" src/ tests/

# Find a React component
rg -n "export (function|const) .*Component" src/components/

# Find Hono API routes (in src/server/routes/v1/)
rg -n "\.(get|post|put|delete)\(" src/server/routes/

# Find database schema
rg -n "export const.*=.*pgTable" src/db/schema/

# Find E2E tests
find tests/e2e -name "*.spec.ts"

# Find hooks
rg -n "export (function|const) use[A-Z]" src/hooks/

# Find feature modules
rg -n "export (class|function)" src/features/*/

# Find services
rg -n "export (class|function)" src/services/

# Find NLU patterns
rg -n "BRAZILIAN|PT-BR|intent" src/lib/nlu/

# Find security utilities
rg -n "sanitize|audit|encrypt" src/lib/security/
```

## Definition of Done

Before creating a PR, ensure:
- ✅ All tests pass (`bun test` + `bun test:e2e`)
- ✅ Type-check passes (`bun type-check`)
- ✅ Linting passes (`bun lint`)
- ✅ No hardcoded colors (`bun validate:colors`)
- ✅ Security scan passes (`bun lint:security`)
- ✅ LGPD compliance validated (if touching user data)
- ✅ Accessibility validated (if touching UI)

**Single Command**: `bun quality:parallel` (runs all checks in parallel)

## Brazilian Compliance (MANDATORY)

- **LGPD**: Data protection, user consent, audit logs
- **PIX**: BCB specifications, QR codes, instant payments
- **Portuguese**: Primary language for all user-facing text
- **Accessibility**: WCAG 2.1 AA+ (voice-first interface)

## MCP Optimization (MANDATORY)

**ALWAYS use `serena` MCP for codebase search** - Never speculate about unread code.

**MCP Stack** (via Docker Gateway):
- `serena` - Codebase intelligence (MANDATORY for code search)
- `context7` - Library documentation
- `tavily` - Web search & Brazilian regulations
- `sequential-thinking` - Complex problem solving (complexity ≥7)
- `neon` - Database operations (via CLI)
- `playwright` - E2E testing (via CLI)

**When to Use**:
- Code search → `serena` (ALWAYS)
- Library docs → `context7`
- Compliance research → `tavily` + `context7`
- Complex problems → `sequential-thinking` → `think` tool
- Database ops → `neon` CLI + `serena` validation
- E2E testing → `playwright` CLI + `serena` code review

## Available Specialized Droids

See `.factory/AGENTS.md` for complete orchestration details.

| Droid | When to Use |
|-------|-------------|
| **apex-dev** | Complexity ≥7, performance-critical, security-sensitive |
| **database-specialist** | ANY database operation, schema changes, migrations |
| **code-reviewer** | Post-implementation, security validation, compliance |
| **apex-ui-ux-designer** | ANY new UI component, accessibility validation |
| **apex-researcher** | Compliance questions, Brazilian regulations (≥95% accuracy) |
| **product-architect** | Product strategy, large-scale documentation |

---

> **For detailed patterns and examples**: Navigate to sub-folder AGENTS.md files listed in JIT Index above.
