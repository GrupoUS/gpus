---
description: Detecta e remove código morto com Knip e Biome
agent: code-reviewer
subtask: true
---

Analise e limpe código morto no codebase: $ARGUMENTS

## Fase 1: Análise

1. Execute análise de código morto com Knip:
!`bunx knip --reporter compact`

2. Verifique imports não usados com Biome:
!`bun run lint:check`

## Fase 2: Identificação

Categorize os resultados por risco:

| Risco | Tipo | Ação |
|-------|------|------|
| **Baixo** | Unused imports | Auto-fix com `bun run lint` |
| **Médio** | Componentes/hooks órfãos | Verificar antes de remover |
| **Alto** | Funções Convex não usadas | Requer aprovação explícita |

## Proteções (NUNCA remover)

- `src/components/ui/**` - shadcn/ui base components
- `convex/_generated/**` - Convex generated files
- `src/routeTree.gen.ts` - TanStack Router generated
- `src/main.tsx` - Entry point
- `convex/schema.ts` - Database schema
- Arquivos `*.config.*` - Configurações

## Fase 3: Execução Segura

1. Crie branch de backup antes de modificações
2. Remova em batches pequenos (1-5 arquivos)
3. Execute verificação após cada batch:
!`bun run lint:check && bun run build && bun run test`

4. Rollback automático se qualquer verificação falhar

## Fase 4: Validação Final

!`bun run lint:check`
!`bun run build`
!`bun run test`

## Relatório

Gere resumo com:
- Arquivos removidos com justificativa
- Exports limpos
- Dependências removidas
- Status de verificação (lint/build/test)
