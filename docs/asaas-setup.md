# Configuração da Integração Asaas

Este guia explica como configurar as variáveis de ambiente necessárias para a integração com a API Asaas.

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no **Convex Dashboard** (não no código):

### 1. ASAAS_API_KEY

**Valor:** Sua chave API de produção do Asaas

**⚠️ IMPORTANTE:**
- Esta é uma chave sensível. **NUNCA** commite no código ou compartilhe publicamente.
- Configure **APENAS** no Convex Dashboard (Settings > Environment Variables)
- A chave deve ser adicionada exatamente como está, sem espaços ou quebras de linha


### 2. ASAAS_BASE_URL

**Valor:** `https://api.asaas.com/v3`

**Nota:** Esta é a URL padrão para produção. O código já usa este valor como padrão se a variável não estiver definida.

### 3. ASAAS_WEBHOOK_TOKEN

**Valor:** Token único para validar webhooks (gere um token seguro)

**Como gerar:**
Você pode usar qualquer gerador de token seguro. Exemplo usando Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use um gerador online de tokens seguros.

## Como Configurar no Convex Dashboard

1. Acesse o [Convex Dashboard](https://dashboard.convex.dev)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione cada variável:
   - Clique em **Add Variable**
   - Digite o nome da variável (ex: `ASAAS_API_KEY`)
   - Cole o valor (para `ASAAS_API_KEY`, use a chave fornecida acima)
   - Clique em **Save**

**Variáveis a configurar:**
- `ASAAS_API_KEY` = (sua chave API de produção)
- `ASAAS_BASE_URL` = `https://api.asaas.com/v3`
- `ASAAS_WEBHOOK_TOKEN` = (gere um token seguro - veja instruções abaixo)

## Configuração do Webhook no Painel Asaas

Após configurar as variáveis de ambiente:

1. Acesse o [painel Asaas](https://www.asaas.com)
2. Vá em "Integrações" > "Webhooks"
3. Clique em "Novo Webhook"
4. Configure:
   - **URL:** `https://[seu-deployment].convex.site/asaas/webhook`
     - Para encontrar sua URL: `bunx convex dashboard` > Settings > Deployment URL
   - **Token:** O mesmo valor configurado em `ASAAS_WEBHOOK_TOKEN`
   - **Eventos:** Selecione todos os eventos relacionados a pagamentos:
     - `PAYMENT_RECEIVED`
     - `PAYMENT_CONFIRMED`
     - `PAYMENT_OVERDUE`
     - `PAYMENT_DELETED`
     - `PAYMENT_UPDATED`
   - **Tipo de Envio:** SEQUENCIAL (recomendado para confiabilidade)

## Verificação

Após configurar tudo:

1. Crie um aluno no sistema
2. Verifique se ele foi sincronizado como cliente no Asaas (campo `asaasCustomerId` preenchido)
3. Crie uma matrícula e gere cobranças
4. Verifique se as cobranças aparecem no painel Asaas
5. Simule um pagamento no Asaas e verifique se o webhook atualiza o status

## 🔧 Troubleshooting Avançado

### Problema: "ASAAS_API_KEY não configurada"

**Diagnóstico:**
1. Acesse: Admin > Integrações > Asaas > Status da Configuração
2. Verifique qual fonte está sendo usada (database vs environment)
3. Execute o teste de conexão

**Soluções:**

#### Opção 1: Configurar via Convex Dashboard (Recomendado para Produção)
1. Acesse [Convex Dashboard](https://dashboard.convex.dev)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - Nome: `ASAAS_API_KEY`
   - Valor: Sua chave API do Asaas (começa com `$aact_`)
5. Clique em **Save**
6. Aguarde 30 segundos para propagação
7. Teste a conexão novamente

#### Opção 2: Configurar via UI Admin (Recomendado para Desenvolvimento)
1. Acesse: Admin > Configurações > Integrações > Asaas
2. Cole a API key no campo "API Key"
3. Clique em "Salvar"
4. A key será criptografada automaticamente no database
5. Teste a conexão

**Verificação:**
```bash
# No Convex Dashboard, vá em Logs e procure por:
[AsaasConfig] API Key source: database
[AsaasConfig] API Key validation: PASSED
```

---

### Problema: "API Key inválida ou expirada"

**Diagnóstico:**
1. Verifique se a key foi copiada completamente (sem espaços ou quebras)
2. Confirme que a key começa com `$aact_` (produção) ou `$aact_YTU5YTE0M2` (sandbox)
3. Verifique no painel Asaas se a key ainda está ativa

**Soluções:**
1. Gere nova API key no painel Asaas:
   - Acesse: https://www.asaas.com
   - Vá em: Integrações > API > Gerar nova chave
2. Atualize a configuração (via Dashboard ou UI Admin)
3. Teste a conexão

---

### Problema: Sincronização falha silenciosamente

**Diagnóstico:**
1. Verifique logs de sync via query `getSyncLogs`
2. Verifique circuit breaker via query `getCircuitBreakerState`
3. Verifique API usage stats via query `getApiUsageStats`

**Soluções:**
- Se circuit breaker está `open`: Aguarde 60 segundos ou reset manual
- Se error rate > 10%: Verifique API key e rate limits
- Se timeout: Aumente timeout em `convex/asaas/client.ts`

---

### Problema: Webhook não está recebendo eventos

- Verifique se a URL do webhook está correta no painel Asaas
- Verifique se o token configurado no Asaas corresponde ao `ASAAS_WEBHOOK_TOKEN`
- Verifique os logs do Convex para erros de autenticação

### Problema: Aluno não sincroniza como cliente

- Verifique se o aluno tem CPF cadastrado (necessário para criar cliente no Asaas)
- Verifique os logs do Convex para erros na API Asaas
- Tente sincronizar manualmente usando a mutation `syncStudentAsCustomer`

---

### Logs de Debug Esperados

Logs esperados em uma sincronização bem-sucedida:
```
[AsaasConfig] Checking database settings...
[AsaasConfig] Database config keys: api_key, base_url
[AsaasConfig] API Key source: database
[AsaasConfig] API Key validation: PASSED
[AsaasClient] Making request to /customers?limit=100&offset=0
[AsaasClient] Response: 200 OK (234ms)
[SyncLog] Processed 50 customers (0 errors)
```

---

## Segurança

- ✅ **NUNCA** commite chaves API no código
- ✅ **NUNCA** compartilhe chaves API em mensagens ou emails
- ✅ Use variáveis de ambiente sempre
- ✅ Rotacione as chaves periodicamente
- ✅ Use tokens diferentes para desenvolvimento e produção

## Segurança Avançada

### Rotação de Chaves
Recomendamos rotacionar a `ASAAS_API_KEY` a cada 90 dias:
1. Gere nova chave no painel Asaas.
2. Adicione como `ASAAS_API_KEY_NEW` no Convex Dashboard.
3. Teste a conexão.
4. Substitua `ASAAS_API_KEY` pela nova.
5. Revogue a chave antiga no painel Asaas.

### Monitoramento
Utilize a query `getApiUsageStats` para monitorar o uso da API. Alerte se:
- Taxa de erro > 10%
- Tempo médio de resposta > 5s

### Auditoria
Todas as chamadas à API são logadas na tabela `asaasApiAudit`. Revise periodicamente para detectar uso anômalo.

## Tabela de Verificação de Status

| Verificação | Query/Action | Resultado Esperado |
|-------------|--------------|-------------------|
| **Config Status** | `api.asaas.queries.getConfigStatus` | `{ isConfigured: true, isValid: true }` |
| **Test Connection** | `api.asaas.actions.testAsaasConnection` | `{ success: true, status: 200 }` |
| **Sync Logs** | `api.asaas.sync.getSyncLogs` | Logs com `status: 'completed'` |
| **Circuit Breaker** | `api.asaas.sync.getCircuitBreakerStatus` | `{ state: 'closed', isHealthy: true }` |
| **API Usage** | `api.asaas.queries.getApiUsageStats` | `{ errorRate: < 10% }` |

---

## 🔧 Troubleshooting: Circuit Breaker

### O que é o Circuit Breaker?

O circuit breaker protege o sistema contra falhas em cascata quando a API do Asaas está instável. Ele possui 3 estados:

- **CLOSED** (Saudável): Todas as requisições são processadas normalmente
- **OPEN** (Bloqueado): Requisições são bloqueadas após 3 falhas consecutivas
- **HALF-OPEN** (Testando): Permite 3 requisições de teste para verificar recuperação

### Como Monitorar

**Via Convex Dashboard:**
```typescript
// Query: api.asaas.sync.getCircuitBreakerStatus
{
  "state": "closed",
  "failureCount": 0,
  "isHealthy": true,
  "isBlocking": false,
  "recommendation": "Circuit breaker está SAUDÁVEL..."
}
```

**Via Logs:**
```bash
bunx convex logs --filter "CircuitBreaker"
```

### Sintomas de Circuit Breaker Aberto

- ❌ Erro: `Circuit breaker is OPEN. API requests are blocked.`
- ⏱️ Mensagem: `Retry in Xs`
- 📊 Dashboard mostra `state: "open"`, `isBlocking: true`

### Como Resolver

#### 1. Aguardar Reset Automático (Recomendado)
O circuit breaker se recupera automaticamente após 60 segundos:
- Aguarde o tempo indicado em `timeUntilRetryFormatted`
- O sistema tentará 3 requisições de teste
- Se bem-sucedidas, o circuit fecha automaticamente

#### 2. Reset Manual (Emergência)
Se você corrigiu o problema na API do Asaas:
```typescript
// Mutation: api.asaas.sync.resetCircuitBreakerManual
// Requer permissão SETTINGS_WRITE
```

⚠️ **Atenção**: Reset manual só deve ser usado se você tem certeza que o problema foi resolvido externamente.

### Causas Comuns

1. **API Key Inválida**: Verifique em Configurações > Integrações
2. **Rate Limiting**: Asaas bloqueou temporariamente (aguarde 60s)
3. **Timeout de Rede**: Problemas de conectividade
4. **Manutenção do Asaas**: Verifique status em https://status.asaas.com

### Logs de Transição

```
[2024-01-15T10:30:00.000Z] [CircuitBreaker] State transition: CLOSED → OPEN
| Reason: Failure threshold reached (3/3)
| Next retry in: 60s

[2024-01-15T10:31:00.000Z] [CircuitBreaker] State transition: OPEN → HALF-OPEN
| Reason: Reset timeout elapsed (60s)
| Test calls allowed: 3

[2024-01-15T10:31:05.000Z] [CircuitBreaker] State transition: HALF-OPEN → CLOSED
| Reason: All test calls succeeded (3/3)
| Circuit is now healthy
```

### Debugging Falhas de Sync

Para investigar falhas de sincronização:
```typescript
// Query detalhada de syncs com erro:
api.asaas.sync.getFailedSyncDetails({ limit: 5 })

// Retorna stack trace completo em lastError:
{
  "message": "Invalid API key",
  "stack": "Error: Invalid API key\n    at AsaasClient.fetch...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "code": "UNAUTHORIZED"
}
```
