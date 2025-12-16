---
description: Detecta e remove codigo morto com Knip e Biome
agent: code-reviewer
subtask: true
---

Analise e limpe codigo morto no codebase: $ARGUMENTS

## Fase 1: Analise

1. Execute analise de codigo morto com Knip:
!`bunx knip --reporter compact`

2. Verifique imports nao usados com Biome:
!`bun run lint:check`

## Fase 2: Identificacao

Categorize os resultados por risco:

| Risco | Tipo | Acao |
|-------|------|------|
| **Baixo** | Unused imports | Auto-fix com `bun run lint` |
| **Medio** | Componentes/hooks orfaos | Verificar antes de remover |
| **Alto** | Funcoes Convex nao usadas | Requer aprovacao explicita |

## Protecoes (NUNCA remover)

- `src/components/ui/**` - shadcn/ui base components
- `convex/_generated/**` - Convex generated files
- `src/routeTree.gen.ts` - TanStack Router generated
- `src/main.tsx` - Entry point
- `convex/schema.ts` - Database schema
- Arquivos `*.config.*` - Configuracoes

## Fase 3: Execucao Segura

1. Crie branch de backup antes de modificacoes
2. Remova em batches pequenos (1-5 arquivos)
3. Execute verificacao apos cada batch:
!`bun run lint:check && bun run build && bun run test`

4. Rollback automatico se qualquer verificacao falhar

## Fase 4: Validacao Final

!`bun run lint:check`
!`bun run build`
!`bun run test`

## Relatorio

Gere resumo com:
- Arquivos removidos com justificativa
- Exports limpos
- Dependencias removidas
- Status de verificacao (lint/build/test)
