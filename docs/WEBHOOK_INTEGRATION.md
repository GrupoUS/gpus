# Integração Webhook WordPress (External Leads)

Este guia descreve como configurar o WordPress (Elementor, CF7, etc.) para enviar leads para o GPUS CRM via Webhook.

## Endpoint

**URL**: `https://<CONVEX_DEPLOYMENT_URL>/webhook/leads`
**Method**: `POST`
**Header Obrigatório**:
- `X-Webhook-Secret`: `<WEBHOOK_SECRET>` (Solicite ao admin)

## Payload JSON

O corpo da requisição deve ser um JSON. Campos marcados com `*` são obrigatórios.

```json
{
  "email": "user@example.com",     // * String (Email válido)
  "source": "landing_page_lp01",   // * String (Identificador da origem)
  "name": "João Silva",            // String
  "phone": "11999999999",         // String (Apenas números ou formatado)
  "interest": "Harmonização",      // String (Mapeado automaticamente)
  "message": "Tenho interesse...", // String
  "utm_source": "facebook",        // String (Opcional)
  "utm_medium": "cpc",
  "utm_campaign": "promo_verao",
  "custom_fields": {               // Objeto livre para dados extras
    "cor_favorita": "azul"
  }
}
```

## Configuração no WordPress

### 1. Elementor Forms

1.  Edite seu formulário no Elementor.
2.  Vá em **Actions After Submit** e adicione **Webhook**.
3.  Abra a aba **Webhook** que apareceu.
4.  Cole a URL do Endpoint.
5.  Em **Advanced Data**, certifique-se de que os campos do formulário tenham os IDs corretos (`email`, `name`, `phone`, etc.).
6.  **Importante**: O Elementor não permite adicionar Headers personalizados nativamente.
    *   *Solução*: Use um plugin como "Elementor Webhook Headers" ou adicione um snippet PHP no `functions.php`:
    ```php
    add_action( 'elementor_pro/forms/webhook/request_args', function( $args, $record ) {
        $args['headers']['X-Webhook-Secret'] = 'SEU_SECRET_AQUI';
        return $args;
    }, 10, 2 );
    ```

### 2. Contact Form 7 (com plugin CF7 to Webhook)

1.  Instale o plugin **CF7 to Webhook**.
2.  Nas configurações do formulário, vá em **Webhook**.
3.  Ative o envio.
4.  URL: Cole a URL do endpoint.
5.  Method: POST.
6.  Headers: Adicione `X-Webhook-Secret: SEU_SECRET_AQUI`.
7.  Mapeie os campos se necessário.

### 3. WPWebhooks (Plugin Genérico)

1.  Crie um gatilho "Sen Data on Contact Form 7 Submit".
2.  Configure a Action para enviar JSON via POST.
3.  Adicione o Header de autenticação.

## Testando

Você pode testar via cURL:

```bash
curl -X POST https://<SUA_URL_CONVEX>/webhook/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <SEU_SECRET>" \
  -d '{"email": "teste@gpus.com.br", "source": "teste_manual", "name": "Teste Webhook", "interest": "Outros"}'
```

Se sucesso, receberá:
```json
{
  "success": true,
  "id": "...",
  "action": "created"
}
```
