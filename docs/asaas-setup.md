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

**Sua chave API (configure no Convex Dashboard):**
```
$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjYzMzllZThiLWM4ZDUtNDc3Yi04YTBmLWQ5MTdjMWYzZTE5Mzo6JGFhY2hfY2VkNDdiZDctMjUzYi00Y2EzLWJiNzYtZGYwN2Q4MmY4Y2Yy
```

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
- `ASAAS_API_KEY` = `$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjYzMzllZThiLWM4ZDUtNDc3Yi04YTBmLWQ5MTdjMWYzZTE5Mzo6JGFhY2hfY2VkNDdiZDctMjUzYi00Y2EzLWJiNzYtZGYwN2Q4MmY4Y2Yy`
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

## Troubleshooting

### Erro: "ASAAS_API_KEY environment variable is not set"
- Verifique se a variável foi configurada no Convex Dashboard
- Certifique-se de que o nome está exatamente como `ASAAS_API_KEY` (case-sensitive)
- Faça o deploy novamente após adicionar a variável

### Webhook não está recebendo eventos
- Verifique se a URL do webhook está correta no painel Asaas
- Verifique se o token configurado no Asaas corresponde ao `ASAAS_WEBHOOK_TOKEN`
- Verifique os logs do Convex para erros de autenticação

### Aluno não sincroniza como cliente
- Verifique se o aluno tem CPF cadastrado (necessário para criar cliente no Asaas)
- Verifique os logs do Convex para erros na API Asaas
- Tente sincronizar manualmente usando a mutation `syncStudentAsCustomer`

## Segurança

- ✅ **NUNCA** commite chaves API no código
- ✅ **NUNCA** compartilhe chaves API em mensagens ou emails
- ✅ Use variáveis de ambiente sempre
- ✅ Rotacione as chaves periodicamente
- ✅ Use tokens diferentes para desenvolvimento e produção

