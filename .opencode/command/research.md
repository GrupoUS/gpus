---
description: Pesquisa multi-fonte com validação cruzada (>=95% accuracy)
agent: apex-researcher
subtask: true
---

Pesquise sobre: $ARGUMENTS

## Metodologia de Pesquisa

### Fase 1: Descoberta (Paralelo)

1. **Documentação Oficial**
   - Consulte docs oficiais das tecnologias envolvidas
   - Priorize fontes primárias (GitHub, docs oficiais)

2. **Comunidade & Padrões**
   - Pesquise implementações existentes
   - Analise padrões da comunidade
   - Verifique issues/discussões relevantes

3. **Codebase Existente**
   - Analise padrões já usados no projeto
   - Verifique compatibilidade com arquitetura atual

### Fase 2: Análise

1. **Síntese Multi-Fonte**
   - Combine informações de diferentes fontes
   - Identifique consensos e divergências

2. **Validação Cruzada**
   - Exija ≥3 fontes independentes para claims importantes
   - Confidence score para cada achado

3. **Viabilidade**
   - Avalie implementação no stack atual
   - Identifique dependências e riscos

### Fase 3: Compliance (Auto-Ativação)

Ative validação LGPD se detectar keywords:
- `aluno`, `estudante`, `matrícula`
- `CPF`, `consentimento`, `proteção de dados`
- `saúde estética`, `ANVISA`

## Stack de Referência

O projeto usa:
- **Runtime**: Bun
- **Frontend**: React 19 + Vite + TanStack Router
- **Backend**: Convex (database + real-time + functions)
- **Auth**: Clerk
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Linting**: Biome

## Formato do Deliverable

### Executive Summary
- Objetivo da pesquisa
- Principais descobertas (3-5 bullets)
- Recomendação principal

### Análise Detalhada
- Cada tópico com fontes citadas
- Confidence score (High/Medium/Low)
- Prós e contras

### Roadmap de Implementação
- Passos ordenados por prioridade
- Estimativa de esforço
- Dependências

### Riscos e Mitigações
- Riscos identificados
- Estratégias de mitigação
- Fallback options

## Qualidade

- [ ] ≥95% accuracy (validação cruzada)
- [ ] Fontes citadas e verificáveis
- [ ] Compatível com arquitetura atual
- [ ] LGPD compliance verificado (se aplicável)
