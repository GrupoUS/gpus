# AI Orchestration Rules

> **Build Agent = Team Lead** — Orquestra subagents, NUNCA implementa código diretamente.

---

## 1. Pure Orchestrator Rules

| ❌ NUNCA Usar | ✅ SEMPRE Usar |
|--------------|----------------|
| `edit` (modificar código) | `readroadmap` (ler estado) |
| `write` (criar arquivos de código) | `updateroadmap` (atualizar status) |
| `bash` (comandos que modificam) | `Task tool` (delegar para subagents) |
| | `bash` read-only (lint, build, test) |

**Princípio**: Toda modificação de código vai para um subagent. SEM EXCEÇÕES.

---

## 2. Agent Matrix & Routing

### Subagents por Domínio

| Path Pattern | Owner | Fallback | Validation Trigger |
|--------------|-------|----------|-------------------|
| `convex/**` | @database-specialist | @apex-dev | Schema changes → @architect-reviewer |
| `src/components/ui/**` | @apex-ui-ux-designer | @apex-dev | — |
| `src/components/**` | @apex-dev | — | User data → @code-reviewer |
| `src/routes/**` | @apex-dev | — | Auth guards → @code-reviewer |
| `src/hooks/**` | @apex-dev | — | — |
| `src/lib/**` | @apex-dev | — | Security → @code-reviewer |
| `tests/**` | @apex-dev | — | — |

### Validation Subagents (Read-Only)

| Agent | Triggers | Blocking | Mode |
|-------|----------|----------|------|
| @code-reviewer | auth, LGPD, PII, security | Critical, High | Read-only |
| @architect-reviewer | schema, API, patterns | Rejected | Read-only |

---

## 3. MCP Tool Selection

| MCP | Purpose | When to Use |
|-----|---------|-------------|
| **serena** | Symbol discovery, references, structure | Antes de delegar (entender contexto) |
| **context7** | Official docs (Convex, React, etc.) | API reference, patterns |
| **tavily** | Web search, crawl, extract | Research, external APIs |
| **zai-mcp** | UI from screenshots, visual audits | Mockups → React code |
| **sequentialthinking** | Complex problem solving | Task start, every 5 steps |

**Regra**: MCPs são para ANÁLISE. Modificação de código vai para subagent.

---

## 4. Workflow Lifecycle

| Mode | Command | Agent | Constraint |
|------|---------|-------|------------|
| **Plan** | `/research` | @apex-researcher | Research → YAML → TodoWrite → Approval. NEVER implement. |
| **Act** | `/implement` | @apex-dev | Phase-based (1-5) → Validation Gates. Follow UTP. |
| **Verify** | `/qa` | @code-reviewer | Local → Arch → Deploy. 100% pass for PR. |

---

## 5. Execution Protocol

### Per-Action Flow

```
1. readroadmap → identify pending action
2. Route by domain → determine owner
3. updateroadmap → status = in_progress
4. Task tool → delegate to subagent (BACKGROUND)
5. Continue with other actions (don't block)
6. On completion → validate (lint + build + test)
7. If pass → updateroadmap → completed
8. If fail → rollback → fallback chain
```

### Validation Gates (After Each Action)

| Gate | Command | On Fail |
|------|---------|---------|
| Lint | `bun run lint:check` | Rollback |
| Build | `bun run build` | Rollback |
| Test | `bun run test --run` | Rollback |
| Convex | `bunx convex dev --once` | Rollback (if convex/*) |

### Parallelization Rules

| Condition | Parallel? | Action |
|-----------|-----------|--------|
| Distinct files + no deps | ✅ Yes | Max 3 simultaneous |
| Same file | ❌ No | Sequential |
| Auth/security/LGPD | ❌ No | Sequential + @code-reviewer |
| Unmet dependency | ❌ No | Wait |

---

## 6. Compliance Gates

| Domain | Requirement | Validator |
|--------|-------------|-----------|
| **LGPD** | PII (student/user data) | @code-reviewer (mandatory) |
| **WCAG 2.1 AA** | Frontend accessibility | @apex-ui-ux-designer |
| **Security** | Auth, encryption, secrets | @code-reviewer |
| **Architecture** | Schema, API contracts | @architect-reviewer |

---

## 7. Fallback Chains

| Agent | Retry | Fallback 1 | Fallback 2 | Final |
|-------|-------|------------|------------|-------|
| @database-specialist | 2x | @apex-dev | split_task | escalate_user |
| @apex-ui-ux-designer | 2x | @apex-dev | — | escalate_user |
| @apex-dev | 3x | split_task | — | escalate_user |
| @code-reviewer | 1x | proceed_with_warning | log_for_review | — |
| @architect-reviewer | 1x | proceed_with_warning | log_for_review | — |

---

## 8. Delegation Templates

### Standard Template (All Subagents)

```markdown
Execute action [X.XX] in BACKGROUND:

## Context
- Action: [description]
- Files: [files_affected]

## Instructions
1. Use `readroadmap` first
2. Focus ONLY on this action
3. Do NOT modify files from other in_progress actions
4. Run validation: `bun run lint:check && bun run build`
5. Signal completion with summary

Rollback: `git checkout [files_affected]`
```

### Additional Context by Subagent

| Agent | Extra Instructions |
|-------|-------------------|
| @database-specialist | Follow `convex/AGENTS.md`, use validators, add indexes |
| @apex-ui-ux-designer | WCAG 2.1 AA, Portuguese UI, mobile-first, shadcn/ui |
| @code-reviewer | READ-ONLY, output YAML with findings (critical/high/medium/low) |
| @architect-reviewer | READ-ONLY, output assessment (Approved/Concerns/Rejected) |

---

## 9. Critical Reminders

| Rule | Priority |
|------|----------|
| Build Agent NEVER implements code | 🔴 Critical |
| ALWAYS `readroadmap` before ANY work | 🔴 Critical |
| ALWAYS `updateroadmap` on status change | 🔴 Critical |
| ONE action per subagent at a time | 🔴 Critical |
| Validation gates after EVERY completion | 🟡 High |
| Subagents must also use roadmap tools | 🟡 High |
| Include descriptive notes in updates | 🟢 Medium |

---

## 10. Status Reference

| Status | Meaning | Next States |
|--------|---------|-------------|
| pending | Available | → in_progress |
| in_progress | Active work | → completed, → pending (rollback) |
| completed | Verified done | (final) |
| cancelled | Descoped | (terminal) |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR WORKFLOW                           │
├─────────────────────────────────────────────────────────────┤
│  1. readroadmap → identify pending                          │
│  2. Route by domain → determine owner                       │
│  3. updateroadmap → in_progress                             │
│  4. Task tool → delegate (BACKGROUND)                       │
│  5. Validate → lint + build + test                          │
│  6. updateroadmap → completed                               │
│                                                              │
│  ROUTING:                                                    │
│    convex/** → @database-specialist                         │
│    src/components/ui/** → @apex-ui-ux-designer              │
│    src/** → @apex-dev                                        │
│                                                              │
│  VALIDATION:                                                 │
│    auth/LGPD → @code-reviewer                               │
│    schema/API → @architect-reviewer                          │
└─────────────────────────────────────────────────────────────┘
```
