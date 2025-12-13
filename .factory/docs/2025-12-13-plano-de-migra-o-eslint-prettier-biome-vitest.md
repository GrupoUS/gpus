# Plano de Migração: ESLint + Prettier → Biome + Vitest

## 📋 Análise do Estado Atual
- **Projeto já possui Biome configurado** com regras extensivas em `biome.json`
- **ESLint ativo** via `eslint.config.mjs` com config TanStack + Convex
- **Prettier instalado** mas não há config `.prettierrc`
- **Vite configurado** sem integração com Vitest
- **Sem test runner atual** (nenhum script de teste no package.json)

## 🎯 Objetivos da Migração

### 1. Migrar de ESLint + Prettier para Biome
- **Performance**: 10-25x mais rápido que ESLint + Prettier
- **Manutenção**: 1 arquivo vs 4+ arquivos de configuração
- **Dependências**: 1 pacote vs 127+ pacotes
- **Integração**: Linter + formatter unificado

### 2. Integrar Vitest com Biome
- **Configuração unificada** no vite.config.ts
- **Migração de testes** (se existirem)
- **Cobertura de código** integrada
- **Auto-fixes** durante desenvolvimento

## 📋 Plano de Execução

### Fase 1: Preparação (15 min)
1. **Backup das configurações atuais**
   - Commit das configs atuais do ESLint/Prettier
   - Análise das regras customizadas

2. **Atualização do Biome**
   - Upgrade para versão mais recente (v2.3+)
   - Verificação de compatibilidade com regras atuais

3. **Setup do Vitest**
   - Instalação se não existir
   - Configuração básica no vite.config.ts

### Fase 2: Migração do ESLint (30 min)
1. **Executar migrate command**
   ```bash
   npx @biomejs/biome migrate eslint --write --include-inspired
   ```

2. **Ajustar configuração gerada**
   - Revisar regras convertidas
   - Adicionar overrides específicos do projeto
   - Testar com lints existentes

3. **Validação da migração**
   - Rodar Biome lint em todo código
   - Comparar resultados com ESLint
   - Ajustar diferenças críticas

### Fase 3: Integração Vitest (30 min)
1. **Configurar Vitest no Vite**
   ```typescript
   /// <reference types="vitest/config" />
   import { defineConfig } from 'vite'
   
   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
     },
     // ...resto da config
   })
   ```

2. **Integrar com Biome**
   - Adicionar includes/excludes para arquivos de teste
   - Configurar regras específicas para test files
   - Setup de coverage se necessário

3. **Scripts de teste**
   - Adicionar scripts no package.json
   - Configurar watch mode para desenvolvimento

### Fase 4: Remoção e Limpeza (20 min)
1. **Remover dependências antigas**
   - Uninstall ESLint, Prettier, plugins relacionados
   - Limpar package.json
   - Remover arquivos de configuração antigos

2. **Atualizar scripts**
   - Substituir lint/format commands
   - Integrar com git hooks (se usado)

3. **Testes finais**
   - CI/CD validation
   - Performance benchmarks
   - Documentação atualizada

## 🔧 Configurações Específicas

### Biome.json (pós-migração)
```json
{
  "files": {
    "includes": ["**/*.{ts,tsx,js,jsx,json}"],
    "ignoreUnknown": true,
    "maxSize": 10485760
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      // regras específicas do projeto mantidas
    }
  },
  "overrides": [
    {
      "includes": ["**/*.{test,spec}.{ts,tsx}"],
      "linter": {
        "rules": {
          "suspicious": { "noConsole": "off" },
          "correctness": { "noUnusedVariables": "off" }
        }
      }
    }
  ]
}
```

### Vite.config.ts (com Vitest)
```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    TanStackRouterVite(),
    viteReact(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', 'dist', '.output'],
  },
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "npx convex dev --once && concurrently -r npm:dev:web npm:dev:convex",
    "build": "vite build && tsc --noEmit",
    "lint": "biome check --write",
    "lint:check": "biome check",
    "format": "biome format --write",
    "format:check": "biome format",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## ⚡ Benefícios Esperados

### Performance
- **10-25x mais rápido** em linting/formatting
- **Parallel processing** nativo via Rust
- **Startup time** drásticamente reduzido

### Manutenibilidade
- **1 arquivo de config** vs 4+ arquivos
- **Menos dependências** para gerenciar
- **Updates simplificados** (1 pacote vs 127+)

### DX (Developer Experience)
- **CLI unificada** para lint+format
- **Auto-fixes inteligentes**
- **Integração nativa** com VS Code/NeoVim
- **Mensagens de erro** mais claras

## 🚨 Riscos e Mitigações

### Riscos
1. **Regras não suportadas**: Algumas regras ESLint podem não ter equivalente
2. **Formatação divergente**: Biome pode formatar diferente de Prettier
3. **Curva de aprendizado**: Equipe precisa se adaptar à nova CLI

### Mitigações
1. **Migração gradual**: Manter ESLint durante transição
2. **Testes automatizados**: Validar formatação em CI/CD
3. **Documentação**: Guia de migração para equipe
4. **Rollback strategy**: Manter backup das configurações

## 📈 Timeline Estimada
- **Fase 1**: 15 min
- **Fase 2**: 30 min
- **Fase 3**: 30 min
- **Fase 4**: 20 min
- **Total**: ~1h 35min

## 🎯 Success Criteria
- [x] Biome configurado com regras equivalentes ao ESLint atual
- [x] Vitest integrado e funcionando
- [x] Scripts atualizados e funcionais
- [x] Removeu ESLint/Prettier sem quebrar builds
- [x] CI/CD validando com Biome
- [x] Equipe treinada na nova stack