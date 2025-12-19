# Configuração de Webhook Brevo

Este guia descreve como configurar o webhook no painel do Brevo para sincronizar eventos de email (envios, aberturas, cliques, bounces, etc.) com a nossa aplicação.

## Pré-requisitos

- Conta no Brevo (Sendinblue)
- Acesso ao painel de administração da aplicação para obter o segredo do webhook

## Passo a Passo

1. **Acesse as Configurações de Marketing no Brevo**
   - Faça login na sua conta Brevo.
   - Navegue até `Transactional` > `Settings` > `Webhooks`.

2. **Adicionar Novo Webhook**
   - Clique no botão `Add a new webhook`.

3. **Configurar URL**
   - No campo `URL to call`, insira a URL do seu endpoint Convex HTTP:
     ```
     https://<YOUR_CONVEX_SITE_URL>/brevo-webhook
     ```
     *Substitua `<YOUR_CONVEX_SITE_URL>` pela URL do seu deployment Convex.*

4. **Selecionar Eventos**
   - Marque os eventos que deseja rastrear. Recomendamos selecionar todos os eventos de mensagem:
     - [x] Delivered
     - [x] Opened
     - [x] Clicked
     - [x] Soft Bounce
     - [x] Hard Bounce
     - [x] Spam Complaint
     - [x] Unsubscribed
     - [x] Blocked

5. **Configurar Autenticação (Opcional/Recomendado)**
   - Embora o Brevo não suporte assinatura HMAC padrão em todos os planos, nossa implementação verifica a presença de `BREVO_WEBHOOK_SECRET` se configurado.
   - No `.env`, certifique-se de que `BREVO_WEBHOOK_SECRET` está definido (embora a validação atual dependa principalmente da origem e payload).

6. **Salvar e Testar**
   - Clique em `Save` (ou `Add`).
   - Você pode enviar um email de teste para verificar se os eventos estão chegando em `Convex Dashboard` > `Logs` ou na tabela `emailEvents` do banco de dados.

## Solução de Problemas

- **Eventos não aparecem:** Verifique se a URL está correta e acessível publicamente.
- **Erro 401/403:** Verifique se o webhook tem as permissões adequadas.
- **Logs:** Monitore os logs da função `brevoWebhook` no painel do Convex para ver o payload recebido.
