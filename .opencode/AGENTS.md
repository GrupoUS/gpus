# Mandatory AI Orchestration Rules

## 1. Agent Matrix & Delegation
| Agent | Role | Primary Tools | Mandatory Use Case |
|-------|------|---------------|-------------------|
| **apex-researcher** | Plan Mode | `tavily`, `context7`, `todowrite` | All new features or complex fixes. |
| **apex-dev** | Act Mode | `write`, `edit`, `bash` | Implementation of approved plans (UTP). |
| **code-reviewer** | Security/QA | `context7`, `serena` | LGPD compliance & security audits. |
| **database-specialist** | Backend | `serena`, `convex` | Schema changes & query optimization. |
| **apex-ui-ux-designer** | Frontend | `zai-mcp`, `serena` | Accessibility (WCAG) & UI consistency. |

## 2. MCP Tool Selection Logic
- **LSP (serena)**: Mandatory for symbol discovery, reference tracking, and structural analysis.
- **Semantic (mgrep)**: Mandatory for conceptual searches and pattern matching.
- **Documentation (context7)**: Mandatory for official library/API documentation lookup.
- **Multimodal (zai-mcp)**: Mandatory for UI generation from screenshots or visual audits.
- **Web Search (tavily)**: Mandatory for deep research (Crawl/Map/Extract) and verifying external API changes.
- **GitHub Intelligence (zread)**: Mandatory for searching real-world implementation examples and issues in official repos.
- **Reasoning Engine (sequentialthinking)**: Mandatory for complex problem solving and course correction.

## 3. Sequential Thinking Protocol (STP)
- **Regra 1: At Task Start**: É OBRIGATÓRIO iniciar cada task ou subtask (AT-XXX) com uma sessão de `sequentialthinking` para mapear a lógica atômica e prever riscos.
- **Regra 2: The 5-Step Checkpoint**: A cada 5 passos de execução (seja chamada de ferramenta ou ação lógica), o agente DEVE invocar o `sequentialthinking` para validar se o caminho percorrido está de acordo com o plano inicial (TodoWrite) e corrigir a rota se necessário.

## 4. Workflow Lifecycle
1. **Plan Mode (`/research`)**:
   - Research -> YAML Contract -> TodoWrite -> Approval.
   - *Constraint*: Never implement in this phase.
2. **Act Mode (`/implement`)**:
   - Phase-based execution (1-5) -> Validation Gates.
   - *Constraint*: Follow Ultra-Think Protocol (UTP) and STP.
3. **Verify Mode (`/qa`)**:
   - Local Checks -> Arch Check -> Deploy Validation -> Auto-Fix.
   - *Constraint*: 100% pass rate required for PR.

## 5. Compliance Gates
- **LGPD**: Any task involving PII (Student/User data) MUST be reviewed by `@code-reviewer`.
- **WCAG 2.1 AA**: Any frontend change MUST be validated by `@apex-ui-ux-designer`.

## 6. Operational Directives
- **Zero Fluff**: Concise, objective communication.
- **Research First**: Never implement without a validated plan.
- **Atomic Tasks**: Break work into verifiable steps (AT-XXX).
- **Thinking Loops**: Prioritize accuracy over speed via STP.
