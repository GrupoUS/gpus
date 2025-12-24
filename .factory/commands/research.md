---
description: Pesquisa multi-fonte executada diretamente pelo Plan Agent.
subtask: true
---

# /research: $ARGUMENTS

Este comando é executado nativamente pelo **Plan Agent** (Plan Mode).
A lógica completa está definida em: `.opencode/prompts/plan.txt`.

## Fluxo

```
1. Usuário digita /research [tópico]
2. Plan Agent analisa o pedido
3. Plan Agent executa tools (serena/context7) diretamente
4. Plan Agent gera YAML Report
5. Plan Agent executa todowrite()
6. Plan Agent gera Spec
7. Usuário aprova -> /implement
```

## Instruções

Não há mais subagente `@apex-researcher`. O próprio Plan Agent assume a persona de Pesquisador durante este comando.
