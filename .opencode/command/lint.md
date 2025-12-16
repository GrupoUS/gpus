---
description: Fix rápido de lint e formatação com Biome
agent: apex-dev
subtask: true
---

Execute fix de lint para: $ARGUMENTS

## Análise Inicial

Verifique status atual:
!`bun run lint:check`
!`bun run format:check`

## Auto-Fix

### Lint + Format (recomendado)
!`bun run lint`

### Apenas formatação
!`bun run format`

## Verificação Pós-Fix

!`bun run lint:check`
!`bun run format:check`

## Erros Que Requerem Fix Manual

Alguns erros não podem ser auto-fixados:

| Erro | Descrição | Fix Manual |
|------|-----------|------------|
| `noExplicitAny` | Uso de `any` type | Definir tipo correto |
| `noUnusedVariables` | Variável declarada mas não usada | Remover ou usar |
| `useExhaustiveDependencies` | Deps faltando em useEffect | Adicionar deps corretas |
| `noArrayIndexKey` | Usando index como key | Usar ID único |

## Regras Importantes do Projeto

### TypeScript
- Zero `any` types (usar `unknown` se necessário)
- Strict mode habilitado
- Imports organizados automaticamente

### React
- Functional components apenas
- Hooks rules enforced
- Accessibility rules (a11y) ativos

### Testes
- `noFocusedTests`: Proibido `.only` em commits
- `noSkippedTests`: Warning para `.skip`

## Se Erros Persistirem

1. Analise a mensagem de erro específica
2. Verifique a regra do Biome em `biome.json`
3. Corrija manualmente o código
4. Re-execute `bun run lint:check`

## Build Validation

Após fix de lint, valide o build:
!`bun run build`

## Resumo

Reporte:
- Erros antes: X
- Erros depois: Y
- Auto-fixed: Z
- Manual fixes necessários: lista
