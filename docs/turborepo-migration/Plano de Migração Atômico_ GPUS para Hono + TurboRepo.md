# Plano de Migração Atômico: GPUS para Hono + TurboRepo

**Autor:** Manus AI
**Data:** 12 de Fevereiro de 2026
**Status:** Proposta de Implementação
**Objetivo:** Unificar a stack do GPUS com a do Neondash.

---

## 1. Objetivo Principal

Refatorar completamente o projeto **GPUS**, migrando-o de uma arquitetura SPA + Convex (BaaS) para uma estrutura de **monorepo (TurboRepo)** com um **backend auto-hospedado (Hono + tRPC + Postgres)**, espelhando a arquitetura do Neondash para unificar a manutenção e o desenvolvimento.

## 2. Análise de Complexidade

- **Backend Convex:** ~35.000 linhas de código em 98 arquivos.
- **Escopo:** Reescrita completa do backend, migração de banco de dados, e refatoração do frontend.
- **Esforço Estimado:** 170 horas (6 semanas).

## 3. Plano de Execução Atômico

### Epic 1: Scaffolding do Monorepo (1 semana)

| ID | Tarefa | Detalhes de Implementação | Validação |
|---|---|---|---|
| **AT-G-001** | Instalar Turbo | `bun add -w turbo` | `turbo --version` funciona. |
| **AT-G-002** | Criar Estrutura de Diretórios | `mkdir -p apps packages` | Diretórios `apps/` e `packages/` existem. |
| **AT-G-003** | Configurar Workspaces | Criar `bun.workspaces` com `["apps/*", "packages/*"]`. | `bun pm ls -w` lista os workspaces. |
| **AT-G-004** | Mover Frontend para `apps/web` | Mover o conteúdo de `src/` para `apps/web/src`. | O código do frontend está em `apps/web`. |
| **AT-G-005** | Criar Pacotes Iniciais | Criar `apps/api`, `packages/shared`, `packages/config` com seus respectivos `package.json`. | `bun install` no root funciona. |
| **AT-G-006** | Configurar `turbo.json` | Criar `turbo.json` com pipeline básico para `build`, `dev`, `lint`. | `turbo run build --dry-run` mostra o grafo. |

### Epic 2: Criação do Backend (Hono + tRPC + Drizzle) (2 semanas)

| ID | Tarefa | Detalhes de Implementação | Validação |
|---|---|---|---|
| **AT-G-007** | Setup do Servidor Hono | Em `apps/api`, criar servidor Hono com middlewares (logger, cors, secureHeaders, clerk). | Servidor Hono inicia. Health checks respondem. |
| **AT-G-008** | Setup do Neon Postgres & Drizzle | Provisionar um banco de dados no Neon. Configurar Drizzle ORM em `apps/api`. | Conexão com o DB é bem-sucedida. |
| **AT-G-009** | Definir Schema Drizzle | Em `packages/shared`, criar o schema do banco de dados com Drizzle, espelhando a estrutura de dados do Convex. | Schema é gerado sem erros. |
| **AT-G-010** | Criar Root Router tRPC | Em `packages/shared`, criar o `appRouter` do tRPC. | O router é criado e conectado ao servidor Hono. |
| **AT-G-011** | **(Iterativo)** Traduzir `convex/queries` para tRPC `routers` | Para cada arquivo em `convex/` (ex: `activities.ts`), criar um `router` tRPC equivalente em `apps/api/server/routers/`. | Cada router traduzido passa no typecheck. |
| **AT-G-012** | **(Iterativo)** Traduzir `convex/mutations` para tRPC `procedures` | Para cada `mutation` no Convex, criar um `protectedProcedure.mutation` equivalente. | Cada procedure traduzido passa no typecheck. |
| **AT-G-013** | **(Iterativo)** Traduzir `convex/actions` para tRPC `procedures` | Para cada `action` no Convex, criar um `protectedProcedure.mutation` ou `query` que encapsula a lógica. | Cada procedure traduzido passa no typecheck. |

### Epic 3: Migração de Dados (1 semana)

| ID | Tarefa | Detalhes de Implementação | Validação |
|---|---|---|---|
| **AT-G-014** | Criar Script de Exportação | Criar um script em `scripts/` que usa a API do Convex para exportar todos os dados para arquivos JSON. | Os arquivos JSON são gerados com os dados corretos. |
| **AT-G-015** | Criar Script de Importação | Criar um script que lê os arquivos JSON e usa o Drizzle para inserir os dados no Neon Postgres. | Os dados são populados no Postgres. |
| **AT-G-016** | Executar Migração em Staging | Fazer um backup do Convex. Executar os scripts para migrar os dados para um banco de staging. | Dados em staging correspondem aos dados do Convex. |

### Epic 4: Refatoração do Frontend (1 semana)

| ID | Tarefa | Detalhes de Implementação | Validação |
|---|---|---|---|
| **AT-G-017** | Configurar tRPC Client | Em `apps/web`, configurar o cliente tRPC para se comunicar com `apps/api`. | O cliente tRPC é inicializado. |
| **AT-G-018** | **(Iterativo)** Substituir `useQuery` do Convex | Para cada `useQuery` do Convex, substituir pelo hook `api.<router>.<procedure>.useQuery` do tRPC. | A UI renderiza os dados do novo backend. |
| **AT-G-019** | **(Iterativo)** Substituir `useMutation` do Convex | Para cada `useMutation` do Convex, substituir pelo hook `api.<router>.<procedure>.useMutation` do tRPC. | Ações na UI (criar, atualizar, deletar) funcionam. |
| **AT-G-020** | Refatorar Imports | Substituir todos os imports relativos por imports de workspace (`@repo/shared`, `@repo/config`). | `turbo run typecheck --filter=web` passa. |

### Epic 5: CI/CD e Deploy (1 semana)

| ID | Tarefa | Detalhes de Implementação | Validação |
|---|---|---|---|
| **AT-G-021** | Teste E2E Completo | Rodar testes de fumaça e E2E em um ambiente de staging para validar as funcionalidades críticas. | Todos os testes passam. |
| **AT-G-022** | Atualizar `Dockerfile` | Criar um `Dockerfile` na raiz que usa `turbo prune` para construir imagens separadas para `api` e `web`. | `docker build . --target=api` e `docker build . --target=web` funcionam. |
| **AT-G-023** | Atualizar Workflow de CI/CD | Modificar `.github/workflows/deploy.yml` para usar `turbo run build` e `turbo-ignore`. | A pipeline de CI/CD passa e faz o deploy. |
| **AT-G-024** | Deploy em Produção | Executar o deploy final em produção com monitoramento intensivo. | A aplicação está no ar e funcionando. |

---

## 4. Cronograma Estimado

- **Esforço Total:** 170 horas (6 semanas)
- **Complexidade:** Muito Alta. Envolve reescrita completa do backend e migração de dados.
- **Recomendação:** Alocar um time dedicado ou tratar como o único projeto prioritário durante a execução.
