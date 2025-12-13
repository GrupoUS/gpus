# 🎯 MASTER PROMPT: Full Codebase Quality Audit & Fix
## Orquestração Completa de Droids para AegisWallet

---

## 📋 CONTEXTO & MOTIVAÇÃO

**Projeto**: AegisWallet - Voice-first financial assistant for Brazilian market
**Stack**: Bun + Hono + React 19 + TypeScript + Supabase + TanStack Router/Query
**Objetivo**: Auditoria completa e correção de qualidade de código

**Por que isso importa**: AegisWallet lida com dados financeiros de brasileiros. Bugs, code smells e código morto representam riscos de segurança, violações de LGPD e experiência degradada para usuários que confiam no sistema para gerenciar suas finanças.

---

## 🎯 MISSÃO

Executar auditoria completa do codebase para:
1. **Detectar** todos os erros de lint, TypeScript, rotas, hooks e imports
2. **Pesquisar** soluções baseadas em documentação oficial e best practices
3. **Corrigir** todos os problemas identificados seguindo padrões do projeto
4. **Limpar** código morto, imports não utilizados e arquivos órfãos
5. **Validar** que todas as correções passam nos quality gates

---

## 🤖 ORQUESTRAÇÃO DE DROIDS

### Sequência de Execução

```yaml
PHASE_0_DISCOVERY:
  agent: apex-researcher
  priority: HIGHEST
  parallel: false
  purpose: "Mapear estado atual do codebase e padrões existentes"

PHASE_1_DETECTION:
  agents: [code-reviewer, database-specialist]
  parallel: true
  purpose: "Identificar todos os problemas de qualidade"

PHASE_2_RESEARCH:
  agent: apex-researcher
  parallel: false
  purpose: "Pesquisar soluções oficiais para cada categoria de erro"

PHASE_3_PLANNING:
  agents: [apex-researcher, code-reviewer]
  parallel: false
  purpose: "Criar plano de correção com tarefas atômicas"

PHASE_4_IMPLEMENTATION:
  agents: [apex-dev, database-specialist]
  parallel: true (quando independentes)
  purpose: "Implementar correções seguindo TDD"

PHASE_5_VALIDATION:
  agent: code-reviewer
  parallel: false
  purpose: "Validar todas as correções contra quality gates"
```

---

## 📍 PHASE 0: DISCOVERY & CONTEXT GATHERING

### 🔬 Agent: apex-researcher

```markdown
## Goal
Mapear o estado atual do codebase AegisWallet para entender padrões, convenções e áreas problemáticas antes de iniciar a auditoria.

## Scope
- Arquitetura do projeto (pastas, convenções)
- Padrões de código existentes (hooks, components, services)
- Configurações de linting (biome.json, tsconfig.json)
- Estado atual dos testes
- Rotas e estrutura de navegação

## Complexity
L5 - Multi-source analysis com validação de padrões

## Research Tasks
1. **Ler configurações**: biome.json, tsconfig.json, vitest.config.ts, package.json
2. **Mapear estrutura**: src/, apps/, packages/ - identificar convenções
3. **Identificar padrões**: hooks customizados, componentes base, services
4. **Verificar rotas**: TanStack Router routes, lazy loading patterns
5. **Catalogar testes**: cobertura atual, padrões de teste existentes

## Deliverable
Research Intelligence Report com:
- Mapa de arquitetura do projeto
- Convenções de código identificadas
- Configurações de lint ativas
- Baseline de qualidade atual
- Áreas de risco identificadas
```

---

## 📍 PHASE 1: ERROR DETECTION & ANALYSIS

### 🔍 Agent: code-reviewer (Paralelo Track 1)

```markdown
## Goal
Executar análise completa de qualidade de código e catalogar todos os erros por categoria e severidade.

## Review Type
full (security + architecture + compliance + quality)

## Detection Commands
```bash
# Execute em paralelo para máxima eficiência
bun check .                    # Biome lint + format errors
bun type-check                 # TypeScript strict errors
bun test --run                 # Test failures
bunx oxlint .                  # Security scan adicional
```

## Error Categories to Catalog

### 1. TypeScript Errors
- [ ] Type mismatches e any types
- [ ] Missing type definitions
- [ ] Unsafe type assertions
- [ ] Generic type issues

### 2. Lint Errors (Biome)
- [ ] Import organization violations
- [ ] Unused variables/imports
- [ ] Hook dependency issues (useExhaustiveDependencies)
- [ ] Formatting inconsistencies
- [ ] noExplicitAny violations

### 3. Route Errors (TanStack Router)
- [ ] Invalid route definitions
- [ ] Missing route files
- [ ] Broken lazy imports
- [ ] Route type mismatches

### 4. Hook Errors
- [ ] Missing dependencies in useEffect/useMemo/useCallback
- [ ] Rules of Hooks violations
- [ ] Conditional hook calls
- [ ] Stale closure issues

### 5. Import Errors
- [ ] Circular dependencies
- [ ] Missing modules
- [ ] Incorrect paths
- [ ] Unused imports

### 6. Dead Code
- [ ] Unused exports
- [ ] Orphan files (not imported anywhere)
- [ ] Commented-out code blocks
- [ ] Deprecated functions still in codebase

## Output Format
```yaml
ERROR_CATALOG:
  typescript_errors:
    critical: []  # Blocking compilation
    high: []      # Type safety risks
    medium: []    # Best practice violations

  lint_errors:
    critical: []  # Security/correctness
    high: []      # Hook dependencies
    medium: []    # Style/organization

  route_errors:
    broken_routes: []
    type_mismatches: []

  hook_errors:
    dependency_issues: []
    rules_violations: []

  import_errors:
    circular: []
    missing: []
    unused: []

  dead_code:
    unused_exports: []
    orphan_files: []
    deprecated: []
```
```

### 🗄️ Agent: database-specialist (Paralelo Track 2)

```markdown
## Goal
Analisar schema do banco, migrations e RLS policies para identificar problemas de consistência e segurança.

## Operation Type
audit (schema + rls + queries)

## Detection Tasks
1. **Schema validation**: Verificar tipos TypeScript vs schema real
2. **RLS policies**: Identificar gaps de segurança
3. **Query patterns**: Detectar queries ineficientes ou inseguras
4. **Migration health**: Verificar estado das migrations

## Analysis Commands
```bash
# Verificar tipos gerados vs schema
bun run supabase:types      # Regenerar tipos
diff src/types/database.ts  # Comparar com existente

# Verificar migrations
ls -la supabase/migrations/
```

## Checklist
- [ ] Tipos TypeScript sincronizados com schema
- [ ] RLS policies cobrindo todas as tabelas user-facing
- [ ] Indexes apropriados para queries frequentes
- [ ] Sem queries N+1 patterns
- [ ] Audit trails implementados para dados sensíveis

## Output Format
```yaml
DATABASE_AUDIT:
  type_sync:
    status: [synced|out_of_sync]
    mismatches: []

  rls_coverage:
    tables_covered: []
    tables_missing_rls: []
    policy_gaps: []

  query_issues:
    n_plus_one: []
    missing_indexes: []
    inefficient_queries: []

  compliance:
    lgpd_issues: []
    encryption_gaps: []
```
```

---

## 📍 PHASE 2: RESEARCH-DRIVEN SOLUTIONS

### 🔬 Agent: apex-researcher

```markdown
## Goal
Pesquisar soluções oficiais e best practices para cada categoria de erro identificada na Phase 1.

## Scope
Research solutions for: TypeScript, Biome, TanStack Router, React Hooks, Import patterns

## Complexity
L7 - Multi-source validation com cross-reference de documentação oficial

## Research Priorities

### 1. TypeScript Errors
- Context7: TypeScript strict mode patterns
- Context7: Generic type best practices
- Tavily: TypeScript 5.x new features applicable

### 2. Biome/Lint Errors
- Context7: Biome configuration and rules
- Context7: React hooks exhaustive-deps patterns
- Tavily: Biome migration guides

### 3. TanStack Router Errors
- Context7: TanStack Router v5 file-based routing
- Context7: Type-safe routing patterns
- Context7: Lazy loading best practices

### 4. React Hooks Patterns
- Context7: React 19 hooks documentation
- Context7: useEffect dependency best practices
- Tavily: Common hooks anti-patterns and fixes

### 5. Import Organization
- Context7: ESM import patterns
- Context7: Barrel exports (index.ts) best practices
- Serena: Analyze existing import patterns in codebase

### 6. Dead Code Detection
- Context7: Tree-shaking patterns
- Tavily: Tools for dead code detection in TypeScript
- Serena: Find unused exports in codebase

## Deliverable
Research Intelligence Report com:
- Solução oficial para cada categoria de erro
- Code snippets de referência
- Configurações recomendadas
- Anti-patterns a evitar
- Confidence level por solução (≥95%)
```

---

## 📍 PHASE 3: ATOMIC TASK DECOMPOSITION

### 🔬 Agent: apex-researcher + 🔍 code-reviewer

```markdown
## Goal
Criar plano de correção com tarefas atômicas (~20 min cada), ordenadas por dependência e impacto.

## Planning Principles
1. **Type definitions first**: Corrigir tipos antes de implementações
2. **Core before features**: Shared utils → Components → Pages
3. **Tests alongside fixes**: Cada fix deve incluir validação
4. **Rollback capability**: Cada task deve ser reversível

## Task Template
```yaml
ATOMIC_TASK:
  id: "QC-XXX"
  name: "[Specific actionable name]"
  category: "[typescript|lint|route|hook|import|deadcode]"
  severity: "[critical|high|medium|low]"
  files: ["path/to/file.ts"]
  action: |
    Exact steps to fix this issue
  validation: |
    bun check path/to/file.ts
    bun type-check
    bun test path/to/file.test.ts
  rollback: |
    git checkout -- path/to/file.ts
  estimated_time: "15-25min"
  dependencies: ["QC-YYY"]  # Tasks that must complete first
  assigned_to: "apex-dev|database-specialist"
```

## Task Categories & Ordering

### Priority 1: Type Safety (Critical)
```yaml
- QC-001: Fix database type mismatches
- QC-002: Remove unsafe any types in core utils
- QC-003: Add missing interface definitions
```

### Priority 2: Lint Critical (Blocking)
```yaml
- QC-010: Fix hook dependency arrays
- QC-011: Remove unused imports
- QC-012: Fix import organization
```

### Priority 3: Routes & Navigation
```yaml
- QC-020: Fix route type definitions
- QC-021: Repair broken lazy imports
- QC-022: Update route configurations
```

### Priority 4: Dead Code Removal
```yaml
- QC-030: Remove orphan files
- QC-031: Delete unused exports
- QC-032: Clean commented code blocks
```

### Priority 5: Optimization & Polish
```yaml
- QC-040: Optimize re-renders
- QC-041: Improve error boundaries
- QC-042: Update deprecated APIs
```

## Deliverable
Implementation Plan com:
- Lista completa de atomic tasks
- Dependency graph
- Estimated total time
- Risk assessment por task
- Rollback procedures
```

---

## 📍 PHASE 4: SYSTEMATIC IMPLEMENTATION

### ⚡ Agent: apex-dev (Primary Implementation)

```markdown
## Goal
Implementar correções seguindo TDD methodology, uma atomic task por vez, validando após cada mudança.

## Complexity
≥7 (Mission-critical quality fixes)

## Implementation Protocol

### Pre-Implementation Checklist
- [ ] Ler task definition completa
- [ ] Verificar dependências concluídas
- [ ] Criar branch se necessário: `fix/qc-xxx-description`
- [ ] Entender código existente antes de modificar

### TDD Workflow per Task
```yaml
1_RED:
  action: "Verificar que o erro existe"
  command: "bun check [file] # Deve mostrar erro"

2_GREEN:
  action: "Implementar fix mínimo"
  process:
    - sequential-thinking: "Analisar root cause"
    - context7: "Verificar solução oficial"
    - serena: "Checar padrões existentes"
    - Implementar fix

3_REFACTOR:
  action: "Melhorar se necessário mantendo tests passing"

4_VALIDATE:
  command: |
    bun check [file]
    bun type-check
    bun test [related-tests]
```

### Fix Patterns por Categoria

#### TypeScript Errors
```typescript
// ❌ BEFORE: any type
const processData = (data: any) => { ... }

// ✅ AFTER: Proper typing
interface DataPayload {
  id: string;
  value: number;
}
const processData = (data: DataPayload) => { ... }
```

#### Hook Dependency Errors
```typescript
// ❌ BEFORE: Missing dependency
useEffect(() => {
  fetchUser(userId);
}, []); // userId missing

// ✅ AFTER: Complete dependencies
useEffect(() => {
  fetchUser(userId);
}, [userId, fetchUser]);
```

#### Unused Imports
```typescript
// ❌ BEFORE: Unused import
import { useState, useEffect, useMemo } from 'react';
// useMemo never used

// ✅ AFTER: Clean imports
import { useState, useEffect } from 'react';
```

#### Dead Code
```typescript
// ❌ BEFORE: Unused export
export const deprecatedHelper = () => { ... }; // Never imported

// ✅ AFTER: Removed entirely
// File deleted or export removed
```

### Validation Commands After Each Task
```bash
# Quick validation
bun check [modified-files]
bun type-check

# Full validation before committing
bun quality:parallel
```

## Communication
- Report progress via TodoWrite após cada task
- Flag blockers imediatamente
- Document any deviations from plan
```

### 🗄️ Agent: database-specialist (Database-Related Fixes)

```markdown
## Goal
Corrigir issues relacionados a database: type sync, RLS policies, migration fixes.

## Operation Types
- type_sync: Regenerar e corrigir tipos database.ts
- rls_fix: Implementar/corrigir RLS policies
- migration_fix: Corrigir migrations problemáticas

## Database Fix Protocol

### Type Sync Fix
```bash
# 1. Regenerar tipos oficiais
bun run supabase:types

# 2. Verificar diferenças
diff src/types/database.ts src/types/database.generated.ts

# 3. Merge manual se necessário (custom types)
# 4. Update imports across codebase
```

### RLS Policy Fix
```sql
-- Template para RLS policy
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[policy_name]" ON [table_name]
FOR [SELECT|INSERT|UPDATE|DELETE]
TO authenticated
USING (auth.uid() = user_id);
```

### Migration Fix
```bash
# 1. Criar migration de correção
bun run supabase:migration:new fix_[issue]

# 2. Implementar fix com rollback
# 3. Testar localmente
bun run supabase:db:reset

# 4. Validar
bun run supabase:types
```

## Validation
```bash
# Database health check
bun run supabase:types  # Types generated without errors
bun type-check          # No type mismatches
bun test:db            # Database tests pass
```
```

---

## 📍 PHASE 5: FINAL VALIDATION & QUALITY GATES

### 🔍 Agent: code-reviewer

```markdown
## Goal
Validar que TODAS as correções passam nos quality gates e não introduziram regressões.

## Review Type
full (post-implementation validation)

## Quality Gates Checklist

### Gate 1: Zero Lint Errors
```bash
bun check .
# Expected: No errors, no warnings (or only approved warnings)
```

### Gate 2: Zero Type Errors
```bash
bun type-check
# Expected: No TypeScript errors
```

### Gate 3: All Tests Pass
```bash
bun test --run
# Expected: 100% pass rate
```

### Gate 4: Coverage Maintained
```bash
bun test:coverage
# Expected: ≥90% global, ≥95% security/compliance modules
```

### Gate 5: No Dead Code
```bash
# Verify no unused exports remain
bunx knip
# Expected: No unused files, exports, or dependencies
```

### Gate 6: Security Scan Clean
```bash
bunx oxlint .
# Expected: No high/critical security issues
```

### Gate 7: E2E Tests Pass
```bash
bun test:e2e
# Expected: All E2E tests pass
```

## Final Report Template
```yaml
QUALITY_AUDIT_REPORT:
  date: "[ISO date]"

  summary:
    total_issues_found: [X]
    total_issues_fixed: [Y]
    remaining_issues: [Z]

  gates_status:
    lint: [PASS|FAIL]
    types: [PASS|FAIL]
    tests: [PASS|FAIL]
    coverage: [PASS|FAIL]
    security: [PASS|FAIL]
    e2e: [PASS|FAIL]

  metrics_before:
    lint_errors: [X]
    type_errors: [X]
    test_failures: [X]
    dead_code_files: [X]

  metrics_after:
    lint_errors: [Y]
    type_errors: [Y]
    test_failures: [Y]
    dead_code_files: [Y]

  improvements:
    - "[Improvement 1]"
    - "[Improvement 2]"

  known_issues:
    - "[Accepted technical debt with rationale]"

  recommendations:
    - "[Future improvement 1]"
    - "[Future improvement 2]"
```

## Approval Criteria
- [ ] All 7 quality gates PASS
- [ ] No regression in test coverage
- [ ] No new security vulnerabilities
- [ ] Brazilian compliance maintained (LGPD, accessibility)
- [ ] Documentation updated if patterns changed
```

---

## 🚀 EXECUTION COMMAND

Para iniciar a auditoria completa, use este prompt:

```markdown
Execute Full Quality Audit do AegisWallet seguindo o MASTER-PROMPT-QUALITY-FIX.md

## Comportamento Esperado
- AÇÃO (não apenas sugestões): Implemente todas as correções
- Parallel execution: Maximize eficiência com execução paralela onde possível
- Research-first: Pesquise soluções oficiais antes de implementar
- Atomic tasks: Valide após cada correção
- Zero tolerance: Não aceite workarounds, apenas soluções corretas

## Quality Threshold
- ≥95% confidence antes de cada implementação
- Zero erros de lint/type ao final
- Cobertura de testes mantida ou melhorada
- Compliance brasileiro preservado

## Deliverables Esperados
1. Error Catalog completo (Phase 1)
2. Research Intelligence Report (Phase 2)
3. Implementation Plan com atomic tasks (Phase 3)
4. All fixes implemented (Phase 4)
5. Final Quality Audit Report (Phase 5)

## Restrições
- NÃO criar arquivos desnecessários
- NÃO modificar funcionalidade, apenas qualidade
- NÃO ignorar erros, todos devem ser resolvidos ou documentados
- NÃO fazer hard-code ou workarounds

Comece pela Phase 0: Discovery com apex-researcher.
```

---

## 📊 TRACKING & PROGRESS

### TodoWrite Updates
Cada agent deve atualizar progresso via TodoWrite:

```yaml
TODO_PROGRESS:
  phase: "Phase X: [Name]"
  agent: "[agent-name]"
  status: "[in_progress|blocked|complete]"
  tasks_total: X
  tasks_complete: Y
  current_task: "QC-XXX"
  blockers: []
  next_steps: []
```

### Handoff Protocol
Ao completar uma phase:

```yaml
HANDOFF:
  from_agent: "[agent-name]"
  to_agent: "[next-agent-name]"
  deliverables:
    - "[Artifact 1]"
    - "[Artifact 2]"
  context:
    key_findings: []
    decisions_made: []
    risks_identified: []
  next_phase_ready: true
```

---

## ⚠️ FAILURE RECOVERY

### Se um agent ficar bloqueado:
1. Documentar blocker com detalhes
2. Escalar para apex-researcher para pesquisa adicional
3. Se ainda bloqueado, criar issue para revisão humana
4. Continuar com próximas tasks independentes

### Se quality gate falhar:
1. Identificar tasks que causaram falha
2. Reverter tasks problemáticas (rollback)
3. Re-pesquisar solução correta
4. Re-implementar com fix correto
5. Re-validar

---

*Master Prompt v1.0 - AegisWallet Quality Audit Orchestration*
*Baseado em: AGENTS.md, quality-control.md, research.md, apex-dev.md, apex-researcher.md, code-reviewer.md, database-specialist.md*