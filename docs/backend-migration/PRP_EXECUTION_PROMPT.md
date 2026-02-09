# 🚀 PRP: Migração GPUS → Neondash Tech Stack

**Complexidade:** L9 (Migration + Multi-service)  
**Tempo Estimado:** 20-30 horas  
**Parallel-Safe:** ❌ (Migração sequencial com dependências)

---

## 🎯 OBJETIVO

Migrar o backend do projeto **GPUS** de **Convex** para a arquitetura do **Neondash**, utilizando:

- **Backend:** Hono + tRPC 11 + Drizzle ORM + Neon PostgreSQL
- **Runtime:** Bun (package manager + runtime)
- **Frontend:** React 19 + Vite 7 + TanStack Router + TanStack Query (já existentes)
- **Auth:** Clerk (migrar de Convex para Express/Hono)

**Critérios de Sucesso:**
1. ✅ Toda lógica de backend portada de `convex/` para `server/`
2. ✅ Todos os dados migrados do Convex DB para Neon PostgreSQL
3. ✅ Frontend integrado com tRPC, todas as features funcionando
4. ✅ Testes passando, aplicação estável
5. ✅ Dependência `convex` completamente removida

---

## 📚 CONTEXTO & CONHECIMENTO BASE

### Arquivos de Referência

| Caminho | Descrição |
|---------|-----------|
| `/home/ubuntu/neondash/` | **Projeto de referência** com arquitetura alvo |
| `/home/ubuntu/neondash/.agent/skills/backend-design/` | **Skill de backend design** com padrões e best practices |
| `/home/ubuntu/gpus/` | **Projeto a ser migrado** |
| `/home/ubuntu/migration-research-findings.md` | Análise comparativa das arquiteturas |
| `/home/ubuntu/MIGRATION_PLAN.md` | Plano de migração em alto nível |

### Padrões Arquiteturais (Neondash)

#### 1. Hierarquia de Procedures tRPC

```typescript
publicProcedure           // Sem auth
  → protectedProcedure    // Requer auth
      → mentoradoProcedure  // Requer perfil específico
      → adminProcedure      // Requer role admin
```

#### 2. Request Lifecycle Canônico

```
Parse → Rate Limit → Auth (Clerk) → Context → Authorization → Service → DB (Drizzle) → Response
```

#### 3. Estrutura de Diretórios Alvo

```
server/
├── _core/              # Infraestrutura
│   ├── index.ts       # Entrypoint Hono
│   ├── trpc.ts        # Setup tRPC
│   ├── context.ts     # Context composition
│   ├── clerk.ts       # Auth middleware
│   └── ...
├── routers/            # tRPC routers por domínio
│   ├── users.ts
│   ├── students.ts
│   └── ...
├── services/           # Lógica de negócio
│   ├── asaasService.ts
│   └── ...
├── webhooks/           # Webhook handlers
│   └── clerk.ts
└── db.ts               # Drizzle instance

drizzle/
├── schema.ts           # Schema PostgreSQL
└── migrations/         # SQL migrations
```

---

## 🔨 PLANO DE IMPLEMENTAÇÃO (ATOMIC TASKS)

### FASE 1: FUNDAÇÃO DO BACKEND

#### AT-001: Atualizar package.json e instalar dependências

**Ação:**
1. Editar `/home/ubuntu/gpus/package.json`
2. Adicionar em `dependencies`:
   ```json
   "hono": "^4.5.2",
   "@trpc/server": "^11.6.0",
   "@trpc/client": "^11.6.0",
   "@trpc/react-query": "^11.6.0",
   "drizzle-orm": "^0.44.5",
   "@neondatabase/serverless": "^0.10.3",
   "@clerk/express": "^1.4.0",
   "pino": "^10.3.0",
   "express": "^4.21.2",
   "superjson": "^1.13.3",
   "zod": "^4.3.5"
   ```
3. Adicionar em `devDependencies`:
   ```json
   "drizzle-kit": "^0.31.4",
   "@types/express": "^4.17.21"
   ```
4. **Remover** `"convex": "^1.31.5"` de `dependencies`
5. Executar `bun install`

**Validação:**
```bash
bun install  # Deve completar sem erros
ls node_modules/@trpc  # Deve existir
ls node_modules/hono   # Deve existir
```

**Rollback:**
```bash
git checkout -- package.json bun.lockb
bun install
```

---

#### AT-002: Criar estrutura de diretórios

**Ação:**
```bash
cd /home/ubuntu/gpus
mkdir -p server/_core server/routers server/services server/webhooks
mkdir -p drizzle/migrations
mkdir -p shared
```

**Validação:**
```bash
tree -L 2 server/  # Deve mostrar a estrutura
tree -L 1 drizzle/ # Deve mostrar schema.ts e migrations/
```

**Rollback:**
```bash
rm -rf server/ drizzle/ shared/
```

---

#### AT-003: Implementar entrypoint Hono

**Ação:**
Criar `/home/ubuntu/gpus/server/_core/index.ts`:

```typescript
import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'GPUS Backend (Hono + tRPC)' 
  });
});

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
```

Atualizar `package.json` scripts:
```json
"dev": "bun run --watch server/_core/index.ts",
"build": "vite build && bun build server/_core/index.ts --outdir=dist --target=node --format=esm"
```

**Validação:**
```bash
bun run dev  # Deve iniciar servidor
curl http://localhost:3001  # Deve retornar JSON
```

**Rollback:**
```bash
rm server/_core/index.ts
git checkout -- package.json
```

---

#### AT-004: Configurar Drizzle + NeonDB

**Ação:**

1. Criar `/home/ubuntu/gpus/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
```

2. Criar `/home/ubuntu/gpus/server/db.ts`:
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

export function getDb() {
  return db;
}
```

3. Adicionar ao `.env`:
```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/gpus?sslmode=require
```

**Validação:**
```bash
# Criar schema dummy para testar
echo "import { pgTable, text } from 'drizzle-orm/pg-core';" > drizzle/schema.ts
echo "export const test = pgTable('test', { id: text('id') });" >> drizzle/schema.ts

bun run db:generate  # Deve conectar ao banco
```

**Rollback:**
```bash
rm drizzle.config.ts server/db.ts
```

---

#### AT-005: Configurar tRPC base

**Ação:**

Criar `/home/ubuntu/gpus/server/_core/trpc.ts`:

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: Require authenticated user
const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  
  if (!ctx.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED', 
      message: 'Autenticação necessária' 
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Middleware: Require admin role
const requireAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Acesso negado: apenas administradores' 
    });
  }
  
  return next({ ctx });
});

export const adminProcedure = t.procedure.use(requireUser).use(requireAdmin);
```

**Validação:**
```bash
bun run check  # Deve compilar sem erros de tipo
```

**Rollback:**
```bash
rm server/_core/trpc.ts
```

---

#### AT-006: Implementar Context com Clerk

**Ação:**

Criar `/home/ubuntu/gpus/server/_core/context.ts`:

```typescript
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getAuth } from '@clerk/express';
import { db } from '../db';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const auth = getAuth(opts.req as any);
  
  let user = null;
  if (auth.userId) {
    // Buscar usuário do banco
    const { users } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, auth.userId))
      .limit(1);
    
    user = dbUser || null;
  }
  
  return {
    req: opts.req,
    res: opts.res,
    auth,
    user,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**Validação:**
```bash
bun run check  # Deve compilar
```

**Rollback:**
```bash
rm server/_core/context.ts
```

---

#### AT-007: Integrar tRPC com Hono

**Ação:**

Atualizar `/home/ubuntu/gpus/server/_core/index.ts`:

```typescript
import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { clerkMiddleware } from '@clerk/express';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../routers';
import { createContext } from './context';

const app = new Hono();

app.use('*', logger());

// Clerk middleware
app.use('*', async (c, next) => {
  await clerkMiddleware()(c.req.raw as any, c.res as any, next);
});

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'GPUS Backend' });
});

// tRPC handler
app.all('/api/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: (opts) => createContext(opts),
  });
});

const port = Number(process.env.PORT) || 3001;
console.log(`🚀 Server running on http://localhost:${port}`);

export default { port, fetch: app.fetch };
```

Criar `/home/ubuntu/gpus/server/routers.ts`:

```typescript
import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});

export type AppRouter = typeof appRouter;
```

**Validação:**
```bash
bun run dev
# Em outro terminal:
curl http://localhost:3001/api/trpc/healthCheck
# Deve retornar JSON com status ok
```

**Rollback:**
```bash
git checkout -- server/_core/index.ts
rm server/routers.ts
```

---

### FASE 2: MIGRAÇÃO DE SCHEMA E DADOS

#### AT-101: Traduzir schema Convex → Drizzle

**Ação:**

1. Ler `/home/ubuntu/gpus/convex/schema.ts`
2. Para cada `defineTable`, criar `pgTable` em `/home/ubuntu/gpus/drizzle/schema.ts`

**Exemplo de mapeamento:**

```typescript
// Convex
defineTable({
  name: v.string(),
  email: v.string(),
  role: v.string(),
  createdAt: v.number(),
})

// Drizzle
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  clerkId: text('clerk_id').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

**Tipos Convex → PostgreSQL:**
- `v.string()` → `text()`
- `v.number()` → `integer()` ou `real()`
- `v.boolean()` → `boolean()`
- `v.id('table')` → `text().references(() => table.id)`
- `v.array()` → `jsonb()` ou tabela relacionada
- `v.object()` → `jsonb()`

**Validação:**
```bash
bun run check  # Schema deve compilar
bun run db:generate  # Deve gerar migrations
```

**Rollback:**
```bash
rm drizzle/schema.ts
```

---

#### AT-102: Aplicar migrations no NeonDB

**Ação:**
```bash
cd /home/ubuntu/gpus
bun run db:push --force
```

**Validação:**
- Acessar Neon Dashboard
- Verificar que todas as tabelas foram criadas
- Executar `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`

**Rollback:**
```sql
-- Conectar ao banco e executar:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

---

#### AT-103: Criar script de exportação Convex

**Ação:**

Criar `/home/ubuntu/gpus/scripts/export-convex.ts`:

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { writeFileSync, mkdirSync } from 'fs';

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

async function exportData() {
  mkdirSync('data-export', { recursive: true });
  
  // Exportar users
  const users = await client.query(api.users.list);
  writeFileSync('data-export/users.json', JSON.stringify(users, null, 2));
  
  // Exportar students
  const students = await client.query(api.students.list);
  writeFileSync('data-export/students.json', JSON.stringify(students, null, 2));
  
  // ... exportar todas as outras tabelas
  
  console.log('✅ Dados exportados para data-export/');
}

exportData().catch(console.error);
```

**Validação:**
```bash
bun run scripts/export-convex.ts
ls data-export/  # Deve conter arquivos JSON
wc -l data-export/*.json  # Deve mostrar número de registros
```

**Rollback:**
```bash
rm -rf data-export/
rm scripts/export-convex.ts
```

---

#### AT-104: Criar script de importação NeonDB

**Ação:**

Criar `/home/ubuntu/gpus/scripts/import-neon.ts`:

```typescript
import { db } from '../server/db';
import { users, students } from '../drizzle/schema';
import { readFileSync } from 'fs';

async function importData() {
  // Importar users
  const usersData = JSON.parse(readFileSync('data-export/users.json', 'utf-8'));
  await db.insert(users).values(usersData);
  console.log(`✅ Imported ${usersData.length} users`);
  
  // Importar students
  const studentsData = JSON.parse(readFileSync('data-export/students.json', 'utf-8'));
  await db.insert(students).values(studentsData);
  console.log(`✅ Imported ${studentsData.length} students`);
  
  // ... importar todas as outras tabelas
}

importData().catch(console.error);
```

**Validação:**
```bash
bun run scripts/import-neon.ts
# Verificar no banco:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM students;"
```

**Rollback:**
```bash
psql $DATABASE_URL -c "TRUNCATE TABLE users, students RESTART IDENTITY CASCADE;"
```

---

### FASE 3: MIGRAÇÃO DA API LAYER

#### AT-201: Criar appRouter principal

**Ação:**

Atualizar `/home/ubuntu/gpus/server/routers.ts`:

```typescript
import { router } from './_core/trpc';
import { usersRouter } from './routers/users';
import { studentsRouter } from './routers/students';
// ... outros routers

export const appRouter = router({
  users: usersRouter,
  students: studentsRouter,
  // ... outros routers
});

export type AppRouter = typeof appRouter;
```

**Validação:**
```bash
bun run check
```

**Rollback:**
```bash
git checkout -- server/routers.ts
```

---

#### AT-202: Migrar convex/users.ts → server/routers/users.ts

**Ação:**

1. Ler `/home/ubuntu/gpus/convex/users.ts`
2. Criar `/home/ubuntu/gpus/server/routers/users.ts`
3. Converter cada query/mutation para tRPC procedure

**Exemplo:**

```typescript
// Convex
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

// tRPC
import { router, publicProcedure } from '../_core/trpc';
import { users } from '../../drizzle/schema';

export const usersRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(users);
  }),
});
```

**Validação:**
```bash
# Testar via curl ou cliente tRPC
curl http://localhost:3001/api/trpc/users.list
```

**Rollback:**
```bash
rm server/routers/users.ts
```

---

#### AT-203-210: Migrar todos os routers restantes

**Ação:** Repetir o processo do AT-202 para:
- `students.ts`
- `leads.ts`
- `enrollments.ts`
- `messages.ts`
- `asaas/*.ts` (consolidar em `asaasService.ts` + router)
- ... todos os outros arquivos em `convex/`

**Validação:** Cada router deve ter testes manuais ou automatizados.

---

### FASE 4: INTEGRAÇÃO COM FRONTEND

#### AT-301: Configurar cliente tRPC no frontend

**Ação:**

Criar `/home/ubuntu/gpus/src/lib/trpc.ts`:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/routers';

export const trpc = createTRPCReact<AppRouter>();
```

Criar `/home/ubuntu/gpus/src/lib/trpc-client.ts`:

```typescript
import { httpBatchLink } from '@trpc/client';
import { trpc } from './trpc';
import superjson from 'superjson';

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/api/trpc',
      transformer: superjson,
    }),
  ],
});
```

Atualizar `/home/ubuntu/gpus/src/main.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './lib/trpc';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
```

**Validação:**
```bash
bun run dev  # Frontend deve iniciar sem erros
```

**Rollback:**
```bash
rm src/lib/trpc.ts src/lib/trpc-client.ts
git checkout -- src/main.tsx
```

---

#### AT-302-310: Substituir hooks Convex por tRPC

**Ação:** Para cada hook em `src/hooks/`, substituir:

```typescript
// Antes (Convex)
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const students = useQuery(api.students.list);

// Depois (tRPC)
import { trpc } from '../lib/trpc';

const { data: students } = trpc.students.list.useQuery();
```

**Validação:** Cada página deve funcionar corretamente após a migração.

---

### FASE 5: WEBHOOKS, CRONS E SERVIÇOS

#### AT-401: Migrar webhook do Clerk

**Ação:**

Criar `/home/ubuntu/gpus/server/webhooks/clerk.ts`:

```typescript
import { Webhook } from 'svix';
import type { Context } from 'hono';

export async function handleClerkWebhook(c: Context) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
  const svix = new Webhook(webhookSecret);
  
  const payload = await c.req.text();
  const headers = c.req.header();
  
  const evt = svix.verify(payload, headers);
  
  if (evt.type === 'user.created') {
    // Criar usuário no banco
  }
  
  return c.json({ received: true });
}
```

Adicionar rota no `server/_core/index.ts`:

```typescript
app.post('/api/webhooks/clerk', async (c) => {
  return await handleClerkWebhook(c);
});
```

**Validação:** Testar com Clerk Dashboard webhook test.

---

#### AT-402: Migrar crons para Bun scheduler

**Ação:**

Criar `/home/ubuntu/gpus/server/_core/scheduler.ts`:

```typescript
export function initSchedulers() {
  // Exemplo: rodar a cada 1 hora
  setInterval(async () => {
    console.log('Running scheduled task...');
    // Lógica do cron
  }, 60 * 60 * 1000);
}
```

Chamar no `index.ts`:

```typescript
import { initSchedulers } from './scheduler';

initSchedulers();
```

**Validação:** Verificar logs para confirmar execução.

---

### FASE 6: VALIDAÇÃO E LIMPEZA

#### AT-501: Executar todos os testes

**Ação:**
```bash
bun run test
bun run test:coverage
```

**Validação:** Todos os testes devem passar.

---

#### AT-502: Testes E2E manuais

**Ação:** Testar manualmente todas as funcionalidades críticas:
- Login/Logout
- CRUD de estudantes
- CRUD de leads
- Integrações ASAAS
- Webhooks

**Validação:** Aplicação funciona como esperado.

---

#### AT-503: Remover Convex

**Ação:**
```bash
rm -rf convex/
git rm -r convex/
```

Remover scripts do `package.json`:
```json
"dev:convex": "...",
"deploy:convex": "..."
```

**Validação:**
```bash
bun run build  # Deve compilar sem erros
bun run dev    # Deve rodar sem referências ao Convex
```

---

#### AT-504: Deploy em produção

**Ação:**
1. Configurar variáveis de ambiente no servidor
2. Executar `bun run build`
3. Fazer deploy do servidor Hono
4. Fazer deploy do frontend

**Validação:** Aplicação em produção funciona corretamente.

---

## ✅ CRITÉRIOS DE VALIDAÇÃO FINAL

- [ ] Servidor Hono rodando na porta 3001
- [ ] tRPC respondendo em `/api/trpc/*`
- [ ] Todas as tabelas no NeonDB
- [ ] Todos os dados migrados
- [ ] Frontend integrado com tRPC
- [ ] Todas as funcionalidades testadas
- [ ] Testes automatizados passando
- [ ] Convex completamente removido
- [ ] Deploy em produção bem-sucedido

---

## 🔄 ROLLBACK GERAL

Em caso de falha crítica:

```bash
# Reverter para Convex
git checkout main
bun install
bun run dev
```

---

**Autor:** Manus AI  
**Data:** 2026-02-09
