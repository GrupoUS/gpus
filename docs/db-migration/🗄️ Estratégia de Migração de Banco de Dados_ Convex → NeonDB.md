# 🗄️ Estratégia de Migração de Banco de Dados: Convex → NeonDB

**Objetivo:** Migrar todos os dados do Convex para o Neon PostgreSQL com 100% de integridade, zero perda de dados e validação completa.

**Complexidade:** L9 (Data Migration + Schema Transformation)  
**Tempo Estimado:** 8-12 horas  
**Risco:** Alto (dados de produção)

---

## 📋 VISÃO GERAL

A migração de dados envolve três etapas principais:

1. **Schema Mapping**: Traduzir o schema do Convex para PostgreSQL usando Drizzle ORM
2. **Data Export**: Extrair todos os dados do Convex em formato JSON
3. **Data Import**: Transformar e importar os dados no NeonDB
4. **Validation**: Verificar a integridade e completude dos dados migrados

---

## 🗂️ INVENTÁRIO DE TABELAS

O schema do Convex contém **41 tabelas** que precisam ser migradas:

| # | Tabela | Registros Estimados | Prioridade | Dependências |
|---|--------|---------------------|------------|--------------|
| 1 | `users` | ~50 | 🔴 Crítica | Nenhuma |
| 2 | `leads` | ~5000 | 🔴 Crítica | `users` |
| 3 | `students` | ~1000 | 🔴 Crítica | `leads`, `users` |
| 4 | `enrollments` | ~1500 | 🔴 Crítica | `students` |
| 5 | `conversations` | ~3000 | 🟡 Alta | `leads`, `students`, `users` |
| 6 | `messages` | ~50000 | 🟡 Alta | `conversations`, `users` |
| 7 | `activities` | ~20000 | 🟡 Alta | `leads`, `students`, `users` |
| 8 | `tasks` | ~500 | 🟢 Média | `leads`, `students`, `users` |
| 9 | `asaasPayments` | ~2000 | 🔴 Crítica | `students` |
| 10 | `asaasSubscriptions` | ~500 | 🔴 Crítica | `students` |
| ... | (outras 31 tabelas) | ... | ... | ... |

---

## 🔄 FASE 1: PREPARAÇÃO DO SCHEMA

### Passo 1.1: Criar Enums no PostgreSQL

**Arquivo:** `/home/ubuntu/gpus/drizzle/enums.ts`

✅ **Status:** Criado

Contém todos os enums necessários para mapear os `v.union(v.literal(...))` do Convex.

**Validação:**
```bash
# Verificar que o arquivo existe e compila
cat /home/ubuntu/gpus/drizzle/enums.ts
```

---

### Passo 1.2: Criar Schema Drizzle

**Arquivo:** `/home/ubuntu/gpus/drizzle/schema.ts`

✅ **Status:** Criado (parcial - apenas 4 tabelas principais)

**Próxima Ação:** Completar o schema com todas as 41 tabelas.

**Mapeamento de Tipos:**

| Tipo Convex | Tipo PostgreSQL (Drizzle) | Exemplo |
|-------------|---------------------------|---------|
| `v.string()` | `text('field_name')` | `name: text('name').notNull()` |
| `v.number()` (int) | `integer('field_name')` | `count: integer('count').default(0)` |
| `v.number()` (float) | `real('field_name')` | `score: real('score')` |
| `v.boolean()` | `boolean('field_name')` | `isActive: boolean('is_active')` |
| `v.id('table')` | `text('field_id').references(() => table.id)` | `leadId: text('lead_id').references(() => leads.id)` |
| `v.object({...})` | `jsonb('field_name')` | `preferences: jsonb('preferences')` |
| `v.array(v.string())` | `jsonb('field_name')` | `products: jsonb('products')` |
| `v.union(v.literal(...))` | `enumName('field_name')` | `status: studentStatusEnum('status')` |
| `v.optional(...)` | (sem `.notNull()`) | `email: text('email')` |

**Validação:**
```bash
# Verificar sintaxe TypeScript
cd /home/ubuntu/gpus
npx tsc --noEmit drizzle/schema.ts
```

---

### Passo 1.3: Gerar Migrations SQL

**Comando:**
```bash
cd /home/ubuntu/gpus
npx drizzle-kit generate --config=drizzle.config.ts
```

**Saída Esperada:**
- Arquivo SQL gerado em `drizzle/migrations/0000_initial.sql`
- Contém todos os `CREATE TABLE`, `CREATE TYPE`, `CREATE INDEX`

**Validação:**
```bash
# Inspecionar o SQL gerado
cat drizzle/migrations/0000_initial.sql | head -50
```

---

### Passo 1.4: Aplicar Migrations no NeonDB

**Comando:**
```bash
cd /home/ubuntu/gpus
npx drizzle-kit push --config=drizzle.config.ts
```

**Validação:**
```sql
-- Conectar ao NeonDB e verificar tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

**Rollback (se necessário):**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

---

## 📤 FASE 2: EXPORTAÇÃO DE DADOS DO CONVEX

### Passo 2.1: Configurar Variáveis de Ambiente

**Arquivo:** `.env`

```bash
CONVEX_URL=https://your-project.convex.cloud
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/gpus?sslmode=require
```

---

### Passo 2.2: Executar Script de Exportação

**Script:** `/home/ubuntu/gpus/scripts/export-convex.ts`

✅ **Status:** Criado

**Execução:**
```bash
cd /home/ubuntu/gpus
bun run scripts/export-convex.ts
```

**Saída Esperada:**
- Diretório `data-export/` criado
- 41 arquivos JSON (um por tabela)
- Logs de sucesso para cada tabela

**Exemplo de Log:**
```
✅ Successfully exported 50 records from 'users' to data-export/users.json
✅ Successfully exported 5000 records from 'leads' to data-export/leads.json
...
```

**Validação:**
```bash
# Verificar que todos os arquivos foram criados
ls -lh data-export/

# Contar registros em um arquivo
cat data-export/users.json | jq length
```

**Rollback:**
```bash
rm -rf data-export/
```

---

## 📥 FASE 3: IMPORTAÇÃO DE DADOS NO NEONDB

### Passo 3.1: Transformação de Dados

**Desafios:**

1. **IDs do Convex**: Convex usa `_id` como string. PostgreSQL usará `id` como `text`.
2. **Timestamps**: Convex usa `_creationTime` (número). PostgreSQL usa `created_at` (timestamp).
3. **Snake Case**: Convex usa `camelCase`. PostgreSQL usa `snake_case`.
4. **Relações**: Convex usa `v.id('table')`. PostgreSQL usa chaves estrangeiras.

**Estratégia de Transformação:**

```typescript
// Exemplo de transformação
const transformedRow = {
    id: convexRow._id,                        // _id → id
    created_at: new Date(convexRow._creationTime), // _creationTime → created_at
    assigned_to_id: convexRow.assignedTo,     // assignedTo → assigned_to_id
    // ... outros campos
};
```

---

### Passo 3.2: Executar Script de Importação

**Script:** `/home/ubuntu/gpus/scripts/import-neon.ts`

✅ **Status:** Criado

**Ordem de Importação (respeitando dependências):**

1. `users` (sem dependências)
2. `tags` (sem dependências)
3. `leads` (depende de `users`)
4. `students` (depende de `leads`, `users`)
5. `enrollments` (depende de `students`)
6. `conversations` (depende de `leads`, `students`, `users`)
7. `messages` (depende de `conversations`)
8. `activities` (depende de `leads`, `students`, `users`)
9. ... (continuar para todas as tabelas)

**Execução:**
```bash
cd /home/ubuntu/gpus
bun run scripts/import-neon.ts
```

**Saída Esperada:**
```
✅ Successfully imported 50 records into 'users'
✅ Successfully imported 5000 records into 'leads'
...
```

**Validação:**
```sql
-- Verificar contagem de registros
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'students', COUNT(*) FROM students;
```

**Rollback:**
```sql
-- Truncar todas as tabelas (preservando o schema)
TRUNCATE TABLE users, leads, students, enrollments RESTART IDENTITY CASCADE;
```

---

## ✅ FASE 4: VALIDAÇÃO DE INTEGRIDADE

### Passo 4.1: Validação de Contagem

**Script:** `/home/ubuntu/gpus/scripts/validate-data.ts`

✅ **Status:** Criado

**Execução:**
```bash
cd /home/ubuntu/gpus
bun run scripts/validate-data.ts
```

**Saída Esperada:**
```
Users count - Convex: 50, NeonDB: 50 ✅
Leads count - Convex: 5000, NeonDB: 5000 ✅
Students count - Convex: 1000, NeonDB: 1000 ✅
...
```

---

### Passo 4.2: Validação de Integridade Referencial

**Queries SQL:**

```sql
-- Verificar leads órfãos (sem assignee válido)
SELECT COUNT(*) FROM leads WHERE assigned_to_id IS NOT NULL AND assigned_to_id NOT IN (SELECT id FROM users);

-- Verificar students órfãos (sem lead válido)
SELECT COUNT(*) FROM students WHERE lead_id IS NOT NULL AND lead_id NOT IN (SELECT id FROM leads);

-- Verificar enrollments órfãos (sem student válido)
SELECT COUNT(*) FROM enrollments WHERE student_id NOT IN (SELECT id FROM students);
```

**Resultado Esperado:** Todas as queries devem retornar `0`.

---

### Passo 4.3: Validação de Dados Críticos

**Campos Criptografados (LGPD):**

```sql
-- Verificar que CPFs criptografados foram migrados
SELECT COUNT(*) FROM students WHERE encrypted_cpf IS NOT NULL;

-- Comparar com Convex
```

**Dados Financeiros:**

```sql
-- Verificar que pagamentos ASAAS foram migrados
SELECT COUNT(*) FROM asaas_payments;

-- Verificar soma total de valores
SELECT SUM(total_value) FROM enrollments;
```

---

## 🚨 PLANO DE ROLLBACK COMPLETO

### Cenário 1: Falha na Geração de Migrations

**Sintoma:** `drizzle-kit generate` falha.

**Rollback:**
```bash
rm -rf drizzle/migrations/
git checkout -- drizzle/schema.ts drizzle/enums.ts
```

---

### Cenário 2: Falha na Aplicação de Migrations

**Sintoma:** `drizzle-kit push` falha ou cria schema incorreto.

**Rollback:**
```sql
-- Conectar ao NeonDB
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

---

### Cenário 3: Falha na Importação de Dados

**Sintoma:** Script de importação falha ou dados estão incorretos.

**Rollback:**
```sql
-- Truncar todas as tabelas
TRUNCATE TABLE users, leads, students, enrollments, conversations, messages, activities, tasks RESTART IDENTITY CASCADE;
```

**Re-execução:**
```bash
# Corrigir o script de importação
bun run scripts/import-neon.ts
```

---

### Cenário 4: Dados Corrompidos ou Incompletos

**Sintoma:** Validação falha, dados faltando.

**Rollback Completo:**
```bash
# 1. Dropar o banco de dados
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Deletar arquivos de exportação
rm -rf data-export/

# 3. Deletar migrations
rm -rf drizzle/migrations/

# 4. Reverter código
git checkout main
```

---

## 📊 CHECKLIST DE MIGRAÇÃO

### Pré-Migração
- [ ] Backup completo do Convex (via dashboard)
- [ ] Criar banco de dados de teste no Neon
- [ ] Testar migração em ambiente de staging
- [ ] Documentar todas as transformações de dados
- [ ] Revisar e validar o schema Drizzle

### Durante a Migração
- [ ] Pausar operações de escrita no Convex (modo read-only)
- [ ] Executar exportação de dados
- [ ] Validar arquivos JSON exportados
- [ ] Aplicar migrations no NeonDB
- [ ] Executar importação de dados
- [ ] Validar contagem de registros

### Pós-Migração
- [ ] Executar validação completa de integridade
- [ ] Testar queries críticas no NeonDB
- [ ] Comparar performance (Convex vs NeonDB)
- [ ] Atualizar documentação
- [ ] Arquivar dados do Convex (não deletar imediatamente)

---

## 🛠️ SCRIPTS CRIADOS

| Script | Caminho | Descrição | Status |
|--------|---------|-----------|--------|
| **Enums** | `drizzle/enums.ts` | Definição de todos os enums PostgreSQL | ✅ Criado |
| **Schema** | `drizzle/schema.ts` | Schema Drizzle completo | 🟡 Parcial (4/41 tabelas) |
| **Config** | `drizzle.config.ts` | Configuração do Drizzle Kit | ✅ Criado |
| **Export** | `scripts/export-convex.ts` | Exportação de dados do Convex | ✅ Criado |
| **Import** | `scripts/import-neon.ts` | Importação de dados no NeonDB | ✅ Criado |
| **Validate** | `scripts/validate-data.ts` | Validação de integridade | ✅ Criado |

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Completar o Schema Drizzle**: Adicionar as 37 tabelas restantes em `drizzle/schema.ts`
2. **Gerar Migrations**: Executar `npx drizzle-kit generate`
3. **Testar em Staging**: Criar um banco de dados de teste e executar a migração completa
4. **Validar Dados**: Executar o script de validação e corrigir discrepâncias
5. **Planejar Downtime**: Definir janela de manutenção para migração em produção

---

**Autor:** Manus AI  
**Data:** 2026-02-09  
**Versão:** 1.0
