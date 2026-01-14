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
   - No campo `URL to call`, insira a URL do seu endpoint Convex HTTP com o segredo como parâmetro:
     ```
     https://<YOUR_CONVEX_SITE_URL>/brevo/webhook?secret=<YOUR_WEBHOOK_SECRET>
     ```
     - Substitua `<YOUR_CONVEX_SITE_URL>` pela URL do seu deployment Convex (ex: `https://happy-otter-123.convex.site`).
     - Substitua `<YOUR_WEBHOOK_SECRET>` pelo valor da variável `BREVO_WEBHOOK_SECRET` que você definiu no `.env.local`.

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

5. **Configurar Autenticação**
   - A autenticação é feita via query parameter `?secret=...` na URL, pois o Brevo não suporta cabeçalhos personalizados facilmente.
   - Certifique-se de que a variável de ambiente `BREVO_WEBHOOK_SECRET` está definida no seu projeto Convex (Dashboard > Settings > Environment Variables).

6. **Salvar e Testar**
   - Clique em `Save` (ou `Add`).
   - Você pode enviar um email de teste para verificar se os eventos estão chegando em `Convex Dashboard` > `Logs` ou na tabela `emailEvents` do banco de dados.

## Solução de Problemas

- **Eventos não aparecem:** Verifique se a URL está correta e acessível publicamente.
- **Erro 401/403:** Verifique se o webhook tem as permissões adequadas.
- **Logs:** Monitore os logs da função `brevoWebhook` no painel do Convex para ver o payload recebido.
