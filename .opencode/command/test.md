---
description: Executa testes completos (Vitest, Playwright, Biome)
agent: code-reviewer
subtask: true
---

Execute validação completa de frontend para: $ARGUMENTS

## Testes Unitários (Vitest)

!`bun run test:coverage`

Thresholds de cobertura:
- **Global**: 80% (lines, branches, functions)
- **Caminhos críticos** (auth, LGPD): 95%
- **Componentes UI**: 85%

## Qualidade de Código (Biome)

!`bun run lint:check`
!`bun run format:check`

Regras importantes:
- Zero `any` types
- Zero imports não usados
- Zero testes com `.only` ou `.skip`

## Testes E2E (Playwright)

!`bunx playwright test`

Se falhar por browsers não instalados:
!`bunx playwright install`

## Acessibilidade

Padrões obrigatórios:
- **WCAG 2.1 AA** - Todos os critérios Level A e AA
- **NBR 17225** - Padrão brasileiro de acessibilidade
- **Contraste**: 4.5:1 texto normal, 3:1 texto grande
- **Touch targets**: 44px mínimo
- **Navegação por teclado**: Tab order completo

## Checklist de Validação

- [ ] Zero erros de lint
- [ ] Zero erros de tipo (TypeScript)
- [ ] Testes unitários passando
- [ ] Cobertura dentro dos thresholds
- [ ] Testes E2E passando
- [ ] Acessibilidade WCAG AA validada

## Relatório

Gere resumo com:
- Testes: X passando, Y falhando
- Cobertura: X% lines, Y% branches, Z% functions
- Issues encontrados com severidade
- Recomendações de melhoria
