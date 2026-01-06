# 🧪 Fase 4: Teste e Validação da Sincronização Asaas

## 📋 Observações da Base de Código

Sua implementação Asaas já possui uma arquitetura robusta com:

- **Circuit Breaker completo** em `file:convex/lib/asaas.ts` (linhas 333-433) com estados (closed/open/half-open), monitoramento via `getCircuitBreakerState()` e reset manual via `resetCircuitBreaker()`
- **Queries de monitoramento** em `file:convex/asaas/queries.ts`: `getSyncStatistics`, `getApiUsageStats`, `getWebhookHealth`, `getQueueDepth`, `getFailedWebhookEvents`
- **Webhook processing** em `file:convex/asaas/webhooks.ts` com idempotência SHA-256, criptografia LGPD, retry exponencial e cleanup automático
- **Testes existentes** em `file:tests/integration/asaas-sync.test.ts` e `file:tests/unit/asaas/webhooks.test.ts` cobrindo fluxos de importação, resolução de conflitos e processamento de webhooks
- **Batch processing** em `file:convex/asaas/actions.ts` com isolamento de erros individuais e logging detalhado

**Gaps identificados:**
1. Falta action de teste dedicada (`test_sync.ts`) para validação manual
2. Testes de carga (100+ customers) não implementados
3. Validação end-to-end de webhooks reais não automatizada
4. Monitoramento de circuit breaker não exposto via query pública

---

## 🎯 Abordagem de Implementação

Criaremos uma **suite de testes completa e validação end-to-end** focando em:

1. **Script de Teste Dedicado**: Action `testAsaasSyncFlow` em `convex/asaas/test_sync.ts` para validação manual de todos os cenários (happy path, erros, duplicatas, timeouts)
2. **Validação de Webhooks**: Payload de teste em `convex/asaas/test_payloads.ts` + payloads de exemplo para cada evento
3. **Monitoramento de Circuit Breaker**: Query pública `getCircuitBreakerStatus` para expor estado atual do circuit breaker
4. **Testes de Carga**: Action `loadTestSync` para simular sync de 100+ customers com métricas de performance
5. **Relatório de Validação**: Query `getValidationReport` que agrega todas as métricas (sync stats, API usage, webhook health, circuit breaker)

---

## 📐 Instruções de Implementação

### **Tarefa 1: Criar Action de Teste de Sincronização**
**Arquivo**: `convex/asaas/test_sync.ts`
**Objetivo**: Validar cenários de sync (happy path, invalid key, duplicate, timeout).

### **Tarefa 2: Criar Payloads de Teste para Webhooks**
**Arquivo**: `convex/asaas/test_payloads.ts`
**Objetivo**: Payloads de exemplo e action `sendTestWebhook`.

### **Tarefa 3: Expor Estado do Circuit Breaker via Query**
**Arquivo**: `convex/asaas/queries.ts`
**Objetivo**: Query `getCircuitBreakerStatus` e mutation `resetCircuitBreakerManual`.

### **Tarefa 4: Criar Action de Teste de Carga**
**Arquivo**: `convex/asaas/test_sync.ts`
**Objetivo**: Sync 100+ customers com performance metrics.

### **Tarefa 5: Criar Query de Relatório de Validação**
**Arquivo**: `convex/asaas/queries.ts`
**Objetivo**: Query `getValidationReport` com health score.

### **Tarefa 6: Criar Testes Automatizados End-to-End**
**Arquivo**: `tests/integration/asaas-validation.test.ts`
**Objetivo**: Suite Vitest cobrindo todos os cenários.

---

## ✅ Lista de Tarefas (TodoWrite)

1. [AT-001] Create Test Webhook Payloads | Phase: 2 | Files: convex/asaas/test_payloads.ts
2. [AT-002] Expose Circuit Breaker Status Queries | Phase: 3 | Files: convex/asaas/queries.ts
3. [AT-003] Implement Test Asaas Sync Flow Action | Phase: 3 | Files: convex/asaas/test_sync.ts
4. [AT-004] Implement Load Test Sync Action | Phase: 3 | Files: convex/asaas/test_sync.ts
5. [AT-005] Create Comprehensive Validation Report Query | Phase: 3 | Files: convex/asaas/queries.ts
6. [VT-001] Execute Automated End-to-End Validation Tests | Phase: 4 | Files: tests/integration/asaas-validation.test.ts
