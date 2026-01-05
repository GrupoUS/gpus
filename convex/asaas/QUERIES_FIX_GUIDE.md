# Convex Queries - Fix Guide

## Problema Identificado

Os arquivos de queries Asaas estão usando índices que **NÃO existem** no schema:

```typescript
// ÍNDICES QUE NÃO EXISTEM:
"by_asaas_customer_id"  → Erro principal
```

## Solução

### Padrões Corretos de Queries Convex

#### 1. Buscar por campos existentes com índice

**CORRETO:**
```typescript
const students = await ctx.db
  .query("students")
  .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
  .filter((s) => s.asaasCustomerId === asaasId)
  .take(1);
```

**ERRADO (usar índice inexistente):**
```typescript
// ❌ NÃO FAZER ISSO:
const student = await ctx.db
  .query("students")
  .withIndex("by_asaas_customer_id", (q) => q.eq("asaasCustomerId", asaasId))
  .first();
```

#### 2. Contar registros com filter

**CORRETO:**
```typescript
const count = await ctx.db
  .query("students")
  .filter((s) => s.asaasCustomerId !== undefined)
  .collect()
  .length;
```

#### 3. Buscar por email ou CPF

**CORRETO:**
```typescript
// Buscar por email primeiro
let student = await ctx.db
  .query("students")
  .withIndex("by_email", (q) => q.eq("email", email))
  .first();

// Se não encontrar, buscar por CPF
if (!student && cpfHash) {
  student = await ctx.db
    .query("students")
    .withIndex("by_cpf_hash", (q) => q.eq("cpfHash", cpfHash))
    .first();
}
```

#### 4. Retornos de Queries

**CORRETO:**
```typescript
// Para queries que não precisam retornar dados ao cliente
// Use internalQuery com v.null()

export const someInternalQuery = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Processamento interno
    return null;
  },
});
```

## Índices Disponíveis no Schema

### Tabela `students`:
- `by_organization` - Para filtrar por organização
- `by_email` - Para buscar por email
- `by_phone` - Para buscar por telefone
- `by_cpf_hash` - Para buscar por CPF hash
- `by_status` - Para filtrar por status
- `by_cs` - Para filtrar por CS atribuído
- `by_churn_risk` - Para filtrar por risco de churn

### Tabela `asaasWebhooks`:
- `by_event_id` - Para buscar por eventId
- `by_status` - Para filtrar por status (pending/processing/done/failed)
- `by_payment_id` - Para filtrar por paymentId
- `by_subscription_id` - Para filtrar por subscriptionId
- `by_created` - Para ordenar por data de criação
- `by_retention_until` - Para cleanup por data de retenção

## Ação Imediata

**Remover arquivos problemáticos e recriar com padrões corretos:**

1. Remover `convex/asaas/queries/customers.ts`
2. Remover `convex/asaas/queries/dashboard.ts`
3. Remover `convex/asaas/queries/health.ts`
4. Remover `convex/asaas/queries/metrics.ts`
5. Remover `convex/asaas/queries/examples.ts`

Recriar queries essenciais usando padrões acima.
