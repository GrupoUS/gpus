# Plano de Migração: GPUS para Neondash Tech Stack

**Objetivo:** Migrar o backend do projeto `gpus` de Convex para a arquitetura do `neondash`, utilizando Hono, tRPC, Drizzle e NeonDB.

**Complexidade:** L9 (Migration, Multi-service)

---

## Estratégia de Migração em Fases

A migração será dividida em fases para garantir uma transição controlada, com validação a cada passo. A estratégia prioriza a construção da nova fundação do backend, seguida pela migração de dados e lógica de negócio, e por fim a integração com o frontend.

### Fase 1: Fundação do Backend e Setup Inicial

**Objetivo:** Construir a estrutura base do novo servidor, instalar dependências e configurar as integrações essenciais (tRPC, Drizzle, Clerk).

| ID | Tarefa Atômica | Validação | Rollback |
|---|---|---|---|
| **AT-001** | Atualizar `package.json`: Adicionar `hono`, `trpc`, `drizzle`, `@neondatabase/serverless`, `@clerk/express`, `pino`. Remover `convex`. | `bun install` executa sem erros. `bun.lockb` é atualizado. | Reverter `package.json` e `bun.lockb` a partir do git. |
| **AT-002** | Criar a estrutura de diretórios `server/`, `drizzle/` e `shared/` espelhando o `neondash`. | `tree server/` e `tree drizzle/` mostram a estrutura correta. | `rm -rf server/ drizzle/ shared/`. |
| **AT-003** | Implementar o entrypoint do servidor em `server/_core/index.ts` usando Hono. | `bun run dev` inicia o servidor Hono na porta 3000 sem erros. | Deletar `server/_core/index.ts`. |
| **AT-004** | Configurar Drizzle ORM: Criar `drizzle.config.ts` e `server/db.ts` para conectar ao NeonDB. | `bun run db:generate` conecta ao banco de dados (mesmo sem schema). | Deletar `drizzle.config.ts` e `server/db.ts`. |
| **AT-005** | Configurar tRPC: Criar `server/_core/trpc.ts` com a hierarquia de procedures (public, protected, admin). | O arquivo `trpc.ts` compila sem erros de tipo. | Deletar `server/_core/trpc.ts`. |
| **AT-006** | Implementar Contexto tRPC: Criar `server/_core/context.ts` integrando a autenticação do Clerk via `@clerk/express`. | O contexto é criado e o `userId` é extraído corretamente em uma rota de teste. | Deletar `server/_core/context.ts`. |
| **AT-007** | Integrar tRPC com Hono: Montar o `appRouter` no Hono usando o adapter. | Uma rota tRPC de teste (`health-check`) é acessível via cliente tRPC. | Remover o middleware do tRPC do `server/_core/index.ts`. |

### Fase 2: Migração de Schema e Dados

**Objetivo:** Traduzir o schema do Convex para o Drizzle, gerar as tabelas no NeonDB e migrar os dados existentes.

| ID | Tarefa Atômica | Validação | Rollback |
|---|---|---|---|
| **AT-101** | Mapear e traduzir `convex/schema.ts` para `drizzle/schema.ts` usando a sintaxe do Drizzle. | O schema do Drizzle é tipado corretamente e representa todas as entidades do Convex. | Deletar o conteúdo de `drizzle/schema.ts`. |
| **AT-102** | Gerar e aplicar a migração inicial do Drizzle. | `bun run db:push --force` cria as tabelas no NeonDB com sucesso. | Executar um script SQL para dropar todas as tabelas. |
| **AT-103** | Criar script de exportação de dados do Convex (`scripts/export-convex.ts`). | O script gera arquivos JSON para cada tabela do Convex com todos os registros. | Deletar o script e os arquivos JSON gerados. |
| **AT-104** | Criar script de importação de dados para o NeonDB (`scripts/import-neon.ts`). | O script popula o banco NeonDB com os dados dos arquivos JSON, respeitando as novas chaves estrangeiras. | Truncar todas as tabelas no NeonDB. |
| **AT-105** | Executar um ciclo completo de exportação/importação em ambiente de teste. | Os dados no NeonDB correspondem aos dados no Convex. As relações estão intactas. | Truncar tabelas e re-executar o script de importação. |

### Fase 3: Reimplementação da Lógica de Backend (API Layer)

**Objetivo:** Portar todas as queries, mutations e actions do Convex para tRPC routers e services, seguindo os padrões do `neondash`.

| ID | Tarefa Atômica | Validação | Rollback |
|---|---|---|---|
| **AT-201** | Criar o `appRouter` principal em `server/routers.ts` que agregará todos os outros routers. | O `appRouter` é criado e importado no `server/_core/index.ts` sem erros. | Deletar `server/routers.ts`. |
| **AT-202** | Migrar `convex/users.ts` para `server/routers/users.ts`. | As procedures tRPC para `users` (get, create, update) funcionam e retornam dados do NeonDB. | Deletar `server/routers/users.ts` e remover do `appRouter`. |
| **AT-203** | Migrar `convex/students.ts` para `server/routers/students.ts`. | As procedures tRPC para `students` funcionam conforme o esperado. | Deletar `server/routers/students.ts` e remover do `appRouter`. |
| **AT-204** | Migrar `convex/asaas/*.ts` para `server/services/asaasService.ts` e `server/routers/asaas.ts`. | A lógica de negócio do ASAAS é portada e as procedures tRPC correspondentes funcionam. | Deletar os arquivos `asaas` e remover do `appRouter`. |
| **AT-205** | Continuar a migração para todos os arquivos restantes em `convex/` (e.g., `leads`, `enrollments`, `messages`). | Cada funcionalidade migrada é testada individualmente via cliente tRPC. | Reverter o commit da migração do arquivo específico. |

### Fase 4: Integração com o Frontend

**Objetivo:** Substituir as chamadas da API do Convex no frontend pelas novas chamadas tRPC, garantindo que a UI continue funcionando como esperado.

| ID | Tarefa Atômica | Validação | Rollback |
|---|---|---|---|
| **AT-301** | Configurar o cliente tRPC no frontend (`src/lib/trpc.ts`) com o provider do React Query. | O cliente tRPC é inicializado e o provider envolve a aplicação. | Remover o provider e o arquivo de configuração do cliente. |
| **AT-302** | Substituir os hooks `useQuery` e `useMutation` do Convex pelos hooks do tRPC em `src/hooks/use-students-view-model.ts`. | A view de estudantes (`/students`) carrega e exibe os dados do novo backend. | Reverter as alterações no hook para usar o Convex novamente. |
| **AT-303** | Migrar os componentes da view de estudantes para usar os novos hooks e tipos do tRPC. | A funcionalidade completa da página de estudantes (listar, criar, editar) funciona com o backend tRPC. | Reverter as alterações nos componentes. |
| **AT-304** | Continuar a substituição dos hooks do Convex pelos do tRPC em todo o frontend, componente por componente. | Todas as páginas da aplicação funcionam corretamente com o novo backend. | Reverter as alterações nos arquivos específicos do frontend. |

### Fase 5: Migração de Webhooks, Crons e Serviços Externos

**Objetivo:** Portar funcionalidades assíncronas e de integração que rodam no Convex.

| ID | Tarefa Atômica | Validação | Rollback |
|---|---|---|---|
| **AT-401** | Reimplementar os webhooks do Clerk em `server/webhooks/clerk.ts` usando Hono. | O webhook de sincronização de usuários do Clerk é recebido e processado corretamente. | Desativar o novo endpoint de webhook e reativar o do Convex. |
| **AT-402** | Migrar os crons do Convex (`convex/crons.ts`) para um scheduler do Bun em `server/_core/scheduler.ts`. | As tarefas agendadas rodam nos intervalos corretos e executam a lógica esperada. | Comentar ou remover as tarefas do scheduler do Bun. |
| **AT-403** | Migrar a lógica de upload de arquivos do Convex Storage para S3 com URLs pré-assinadas. | O upload de arquivos na aplicação gera uma URL pré-assinada, envia para o S3 e salva a referência no NeonDB. | Reverter a lógica de upload para usar o Convex Storage. |

### Fase 6: Validação Final e Limpeza

**Objetivo:** Garantir que toda a aplicação está estável, remover o código legado e preparar para o deploy.

| ID | Tarefa Atômica | Validação | Rollback |
|---|---|---|---|
| **AT-501** | Executar todos os testes de unidade e integração (`bun run test`). | Todos os testes passam com sucesso. | Corrigir os testes ou reverter o código que causou a falha. |
| **AT-502** | Realizar testes E2E manuais em todas as funcionalidades críticas da aplicação. | A aplicação se comporta como esperado em um ambiente de staging. | Identificar e corrigir os bugs encontrados. |
| **AT-503** | Remover completamente o diretório `convex/` e todas as suas dependências. | O projeto compila e roda sem nenhuma referência ao Convex. | Restaurar o diretório `convex/` a partir do git. |
| **AT-504** | Limpar variáveis de ambiente e configurações de deploy relacionadas ao Convex. | O deploy em produção é realizado com sucesso usando a nova arquitetura. | Reverter o deploy e restaurar a configuração antiga. |

---
