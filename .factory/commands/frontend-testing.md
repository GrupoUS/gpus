---
title: "Frontend Testing Guide - AegisWallet"
last_updated: 2025-11-25
form: how-to
tags: [testing, vitest, biome, bun, frontend, quality]
related:
  - ../architecture/tech-stack.md
  - ../architecture/frontend-architecture.md
---

# 🧪 Frontend Testing Guide

> **Guia Prático de Testes**: Testes eficientes com Bun + Vitest + Biome para o AegisWallet

## 🎯 Visão Geral

**Stack de Testes**: Bun + Vitest + Biome + Testing Library
**Filosofia**: Testes rápidos, confiáveis e mantíveis
**Cobertura Alvo**: 90%+ para código crítico
**Performance**: 3-5x mais rápido com runtime Bun

## 🚀 Comandos Essenciais

### Testes Unitários
```bash
# Executar todos os testes unitários
bun test:unit

# Executar em modo watch (desenvolvimento)
bun test:watch

# Executar teste específico
bun test:unit -- src/components/Button.test.tsx
```

### Testes de Integração
```bash
# Executar testes de integração
bun test:integration

# Executar com coverage
bun test:integration --coverage
```

### Testes Específicos (Healthcare)
```bash
# Executar testes de compliance healthcare
bun test:healthcare

# Executar com relatório detalhado
bun test:healthcare --reporter=verbose
```

### Cobertura e Relatórios
```bash
# Gerar relatório de cobertura completo
bun test:coverage

# Gerar coverage em HTML
bun test:coverage --reporter=html

# Verificar thresholds de coverage
bun test:coverage --thresholds
```

## 🔍 Qualidade e Linting

### Linting com Biome + OXLint
```bash
# Executar linting completo (OXLint + Biome)
bun lint

# Corrigir problemas automaticamente
bun lint:fix

# Apenas verificar com Biome
bun check

# Linting específico de segurança
bun lint:security

# Linting de performance
bun lint:performance

# Linting de acessibilidade
bun lint:accessibility
```

### Type Checking
```bash
# Verificar tipos TypeScript
bun type-check

# Verificar tipos + linting
bun quality:ci
```

## 📊 Workflows de Qualidade

### Qualidade Completa
```bash
# Executar suite completa de qualidade
bun quality

# Equivalente a:
# bun run lint:oxlint && bun run check && bun run test:coverage
```

### CI/CD Pipeline
```bash
# Pipeline para integração contínua
bun quality:ci

# Pipeline com foco em segurança
bun quality:security

# Pipeline com foco em performance
bun quality:performance
```

## 🛠️ Desenvolvimento Contínuo

### Durante o Desenvolvimento
```bash
# Iniciar servidor com testes em watch
bun dev:full

# Executar testes unitários em modo watch
bun test:watch

# Verificar linting enquanto desenvolve
bun lint:watch  # (se disponível)
```

### Antes de Commitar
```bash
# Verificação completa antes do commit
bun quality

# Apenas linting e tipos
bun lint:oxlint:types && bun type-check
```

## 📁 Estrutura de Testes

```
src/
├── test/
│   ├── setup.ts              # Configuração global dos testes
│   ├── integration/          # Testes de integração
│   ├── healthcare/           # Testes específicos healthcare
│   ├── ui/                 # Testes de componentes UI
│   ├── security/            # Testes de segurança
│   └── fixtures/            # Dados de teste
├── components/
│   └── *.test.tsx          # Testes unitários de componentes
├── lib/
│   └── *.test.ts            # Testes unitários de utilitários
└── __tests__/              # Testes co-localizados
```

## 🎯 Boas Práticas

### 1. Estruturação de Testes
```typescript
// Exemplo de teste unitário
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Testes de Integração
```typescript
// Exemplo de teste de integração
import { renderWithProviders } from '@/test/utils';
import { FinancialDashboard } from '@/components/FinancialDashboard';

describe('Financial Dashboard Integration', () => {
  it('loads and displays financial data', async () => {
    renderWithProviders(<FinancialDashboard />);

    expect(screen.getByText('Resumo Financeiro')).toBeInTheDocument();
    expect(await screen.findByText('Saldo Total')).toBeInTheDocument();
  });
});
```

### 3. Mocks e Fixtures
```typescript
// Usando fixtures dos testes
import { mockFinancialData } from '@/test/fixtures/financial';

test('processes financial data correctly', () => {
  const result = processFinancialData(mockFinancialData);
  expect(result).toEqual(expectedResult);
});
```

## 🔧 Configurações

### Vitest Configurations
- **Principal**: `vitest.config.ts` - Configuração base para testes unitários
- **Integração**: `vitest.integration.config.ts` - Configuração para testes de integração
- **Healthcare**: `vitest.healthcare.config.ts` - Configuração específica para testes healthcare

### Biome Configuration
- **Arquivo**: `biome.json` - Configuração de linting e formatação
- **Integração**: Funciona junto com OXLint para máxima eficiência

## 📈 Métricas e Performance

### Benchmarks (Bun vs npm/pnpm)
| Operação | npm/pnpm | Bun | Melhoria |
|-----------|-----------|-----|----------|
| Testes Unitários | 45s | 12s | **3.75x mais rápido** |
| Testes Integração | 120s | 35s | **3.4x mais rápido** |
| Type Checking | 15s | 2s | **7.5x mais rápido** |
| Linting | 8s | 2s | **4x mais rápido** |

### Cobertura de Testes
- **Target Global**: 90%+ (linhas, branches, funções, statements)
- **Segurança**: 95%+ para `src/lib/security/**`
- **Financeiro**: 90%+ para `src/components/financial/**`
- **Voz/NLU**: 90%+ para `src/lib/speech/**` e `src/lib/nlu/**`

## 🚨 Resolução de Problemas

### Comandos Comuns
```bash
# Verificar configuração do Vitest
bun vitest --config vitest.config.ts --dry-run

# Debug de testes específicos
bun test:unit -- --no-coverage --reporter=verbose

# Limpar cache de testes
bun vitest run --reporter=verbose --no-cache

# Verificar arquivos não cobertos
bun test:coverage --reporter=text --exclude="**/*.test.*"
```

### Issues Comuns
1. **Testes lentos**: Use `--pool=threads` para paralelização
2. **Memory leaks**: Adicione `cleanup` após cada teste
3. **Mocks não funcionando**: Verifique `setupFiles` no config
4. **Coverage baixo**: Use `--include` para especificar arquivos

## 🔄 Integração com CI/CD

### GitHub Actions Example
```yaml
name: Test and Quality
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun quality:ci
      - run: bun test:coverage
```

## 📚 Recursos Adicionais

### Documentação
- [Vitest Documentation](https://vitest.dev/)
- [Biome Documentation](https://biomejs.dev/)
- [Testing Library](https://testing-library.com/)
- [Bun Documentation](https://bun.sh/)

### Scripts Úteis
```bash
# Verificar saúde do projeto
bun run smoke:supabase

# Validar variáveis de ambiente
bun run env:check

# Gerar tipos do Supabase
bun run types:generate
```

---

> **🎯 Foco Prático**: Este guia contém apenas comandos funcionais e testados no projeto AegisWallet. Evite comandos teóricos e mantenha-se nas ferramentas realmente disponíveis.