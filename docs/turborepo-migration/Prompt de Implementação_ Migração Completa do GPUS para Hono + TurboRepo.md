# Prompt de Implementação: Migração Completa do GPUS para Hono + TurboRepo

**Para:** Agente de Implementação de Código (Manus)
**De:** Arquiteto de Soluções (Manus)
**Data:** 12 de Fevereiro de 2026
**Assunto:** Execução da refatoração completa do projeto GPUS para uma arquitetura de monorepo com Hono, tRPC, Drizzle e TurboRepo, espelhando a stack do Neondash.

---

## 1. Objetivo Principal

**Sua tarefa é refatorar completamente o projeto GPUS, migrando-o de uma arquitetura SPA + Convex (BaaS) para uma estrutura de monorepo (TurboRepo) com um backend auto-hospedado (Hono + tRPC + Drizzle/Postgres).**

Esta é uma migração complexa que envolve a reescrita completa do backend. Execute as tarefas atômicas em sequência, validando cada passo rigorosamente. Se qualquer validação falhar, pare e reporte o erro.

## 2. Contexto do Projeto

- **Repositório:** `/home/ubuntu/gpus`
- **Estrutura Atual:** SPA (Vite + React) com backend Convex (BaaS).
- **Estrutura Alvo:** Monorepo com `apps/web` (frontend), `apps/api` (backend Hono), e `packages/` para código compartilhado.

## 3. Plano de Execução Atômico

### Tarefa 1: Scaffolding do Monorepo (AT-G-001 a AT-G-006)

**Ação:** Execute os seguintes comandos na raiz do projeto (`/home/ubuntu/gpus`):

```bash
# 0. Limpar a estrutura antiga (CUIDADO: remove arquivos não versionados)
# git clean -fdx

# 1. Instalar TurboRepo no root
bun add -w turbo

# 2. Criar a estrutura de diretórios padrão
mkdir -p apps packages

# 3. Mover o código do frontend existente
mv src apps/web

# 4. Criar os pacotes e a nova app de API
mkdir -p apps/api packages/shared/src packages/config

# 5. Criar arquivos de configuração e package.json
touch turbo.json bun.workspaces apps/web/package.json apps/api/package.json packages/shared/package.json packages/config/package.json
```

**Ação:** Preencha o conteúdo dos arquivos de configuração e `package.json`.

**Arquivo:** `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Arquivo:** `bun.workspaces`
```
["apps/*", "packages/*"]
```

**Arquivo:** `package.json` (Root)
```json
{
  "name": "gpus-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "turbo": "^2.0.0"
  },
  "packageManager": "bun@1.1.8"
}
```

**Arquivo:** `apps/web/package.json`
```json
{
  "name": "@repo/web",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "lint": "biome check ."
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "@repo/shared": "workspace:*"
    // Adicionar aqui as outras dependências do frontend original
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "vite": "^7.3.1"
    // Adicionar aqui as outras devDependencies do frontend
  }
}
```

**Arquivo:** `apps/api/package.json`
```json
{
  "name": "@repo/api",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "bun --watch run src/index.ts",
    "build": "bun build src/index.ts --outdir=dist",
    "lint": "biome check ."
  },
  "dependencies": {
    "hono": "^4.4.6",
    "@hono/node-server": "^1.11.1",
    "@hono/trpc-server": "^0.2.1",
    "@neondatabase/serverless": "^0.9.3",
    "drizzle-orm": "^0.30.10",
    "@repo/shared": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "drizzle-kit": "^0.21.4"
  }
}
```

**Arquivo:** `packages/shared/package.json`
```json
{
  "name": "@repo/shared",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./router": "./src/router.ts",
    "./schemas": "./src/schemas.ts",
    "./db/schema": "./src/db/schema.ts"
  },
  "scripts": {
    "lint": "biome check ."
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "zod": "^4.3.5",
    "drizzle-orm": "^0.30.10"
  }
}
```

**Arquivo:** `packages/config/package.json`
```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "files": [
    "biome.json",
    "tsconfig.base.json"
  ]
}
```

**Validação:**
1. Execute `bun install`. O comando deve completar sem erros, criando `node_modules` em todos os workspaces.

---

### Tarefa 2: Criação do Backend (AT-G-007 a AT-G-013)

**Ação:**

1.  **Setup do Servidor Hono:** Crie o arquivo `apps/api/src/index.ts` com a estrutura básica do servidor Hono, incluindo os middlewares de logger, cors, secureHeaders e clerk.
2.  **Setup do Drizzle:** Crie o arquivo `packages/shared/src/db/schema.ts`. Comece a definir as tabelas do banco de dados, traduzindo a estrutura implícita do Convex para um schema SQL explícito com Drizzle.
3.  **Setup do tRPC:** Crie o arquivo `packages/shared/src/router.ts` para definir o `appRouter` do tRPC. Conecte-o ao servidor Hono em `apps/api/src/index.ts`.
4.  **Tradução Iterativa:**
    - Para cada arquivo em `/home/ubuntu/gpus/convex/*.ts`:
        - Crie um arquivo de router correspondente em `apps/api/src/routers/`.
        - Para cada `query` do Convex, crie um `publicProcedure.query` ou `protectedProcedure.query` no tRPC.
        - Para cada `mutation` do Convex, crie um `protectedProcedure.mutation`.
        - Para cada `action` do Convex, analise a lógica e crie um `mutation` ou `query` que a execute.
        - **Importante:** A lógica de acesso ao banco de dados deve ser reescrita usando Drizzle em vez de `ctx.db` do Convex.

**Validação:**
1. `turbo run build --filter=api` deve compilar o backend sem erros de tipo.

---

### Tarefa 3: Migração de Dados (AT-G-014 a AT-G-016)

**Ação:**

1.  **Script de Exportação:** Crie `scripts/export-convex.ts`. Use a API do Convex (se disponível) ou escreva uma `action` no Convex para buscar todos os dados de todas as tabelas e salvá-los em arquivos JSON locais.
2.  **Script de Importação:** Crie `scripts/import-postgres.ts`. Este script deve ler os arquivos JSON e usar o Drizzle para fazer o `insert` dos dados no banco de dados Neon Postgres.

**Validação:**
1. Compare a contagem de registros por tabela entre o Convex e o Postgres para garantir que a migração foi completa.

---

### Tarefa 4: Refatoração do Frontend (AT-G-017 a AT-G-020)

**Ação:**

1.  **Setup do tRPC Client:** Em `apps/web`, configure o provedor e o cliente tRPC.
2.  **Refatoração Iterativa:**
    - Globalmente, substitua `import { useQuery } from "convex/react";` por `import { api } from "~/utils/trpc";` (ou o caminho correto).
    - Substitua cada `useQuery(api.router.procedure, ...)` do Convex pelo hook `api.router.procedure.useQuery(...)` do tRPC.
    - Substitua cada `useMutation(api.router.procedure)` do Convex pelo hook `api.router.procedure.useMutation()` do tRPC.
3.  **Refatorar Imports:** Substitua todos os imports relativos que cruzam limites de pacotes por imports de workspace (ex: `import { schemas } from "@repo/shared/schemas"`).

**Validação:**
1. `turbo run typecheck --filter=web` deve passar sem erros.
2. A aplicação web, rodando em modo de desenvolvimento, deve buscar e exibir dados do novo backend Hono/tRPC.

---

### Tarefa 5: CI/CD e Deploy (AT-G-021 a AT-G-024)

**Ação:**

1.  **Atualize o Dockerfile:** Substitua o `Dockerfile` existente por um novo na raiz do projeto, que utilize a estratégia de `turbo prune` para criar imagens otimizadas para `api` e `web`.

**Arquivo:** `Dockerfile` (Exemplo multi-stage)
```dockerfile
# --- Base --- 
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# --- Builder --- 
FROM base AS builder
COPY . .
RUN turbo run build --filter=api --filter=web

# --- Runner API ---
FROM base as api_runner
WORKDIR /app
COPY --from=builder /usr/src/app/apps/api/dist ./dist
# Copiar node_modules podados
# ... (lógica de prune)
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]

# --- Runner Web ---
FROM caddy:alpine as web_runner
WORKDIR /app
COPY --from=builder /usr/src/app/apps/web/dist ./dist
COPY Caddyfile ./
CMD ["caddy", "run", "--config", "Caddyfile"]
```

**Validação:**
1. `docker build . --target=api_runner` e `docker build . --target=web_runner` devem criar as imagens com sucesso.

---

## 4. Critério de Sucesso Final

A migração será um sucesso quando a aplicação GPUS estiver rodando em produção com a nova arquitetura, utilizando o backend Hono/tRPC, o banco de dados Postgres, e sendo deployada a partir da estrutura de monorepo com TurboRepo.

## 5. Plano de Rollback

- **Reverta o código:** `git checkout <commit_anterior_a_migracao>`
- **Reinstale as dependências:** `bun install`
- **Aponte o DNS de volta para o deploy antigo (estático + Convex).**

**Execute este prompt com extrema cautela. A complexidade é muito alta e cada passo deve ser validado minuciosamente.**
