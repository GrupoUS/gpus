# Guia de Integração: Webhooks WordPress para GPUS

Este guia descreve como configurar formulários no WordPress para enviar leads automaticamente para o sistema GPUS via Webhook.

## Endpoint e Autenticação

- **URL do Webhook:** `https://gpus-production.up.railway.app/webhook/leads`
- **Método:** `POST`
- **Header Obrigatório:** `X-Webhook-Secret: [SEU_SECRET_AQUI]`
- **Content-Type:** `application/json`

---

## Opção 1: Elementor Pro (Método Nativo)

O Elementor Pro possui uma ação "Webhook" nativa nos formulários.

1. Edite o formulário no Elementor.
2. Em **Actions After Submit**, adicione **Webhook**.
3. Abra a aba **Webhook** que apareceu.
4. Em **Webhook URL**, insira: `https://gpus-production.up.railway.app/webhook/leads`.
5. Em **Advanced Data**, ative se quiser enviar metadados (IP, User Agent).

**⚠️ Importante:** O Elementor nativo **NÃO** permite adicionar Headers personalizados facilmente. Para autenticar com `X-Webhook-Secret`, você precisará de um snippet PHP no `functions.php` do seu tema:

```php
add_action( 'elementor_pro/forms/webhook/request_args', function( $http_args, $record ) {
    $http_args['headers']['X-Webhook-Secret'] = 'SEU_SECRET_CORRETO_AQUI';

    // Opcional: Forçar landing page específica
    // $body = $http_args['body'];
    // $body['landingPage'] = 'nome-da-pagina';
    // $http_args['body'] = $body;

    return $http_args;
}, 10, 2 );
```

---

## Opção 2: Contact Form 7 (CF7)

O CF7 não tem webhook nativo, mas você pode usar o plugin **"CF7 to Webhook"** ou um código customizado.

### Com Código Customizado (Recomendado)

Adicione ao `functions.php`:

```php
add_action( 'wpcf7_mail_sent', 'gpus_send_lead_webhook' );

function gpus_send_lead_webhook( $contact_form ) {
    $submission = WPCF7_Submission::get_instance();
    if ( ! $submission ) return;

    $posted_data = $submission->get_posted_data();

    // Mapeamento dos campos (ajuste conforme seu formulário)
    $payload = [
        'name' => isset($posted_data['your-name']) ? $posted_data['your-name'] : '',
        'email' => isset($posted_data['your-email']) ? $posted_data['your-email'] : '',
        'phone' => isset($posted_data['your-phone']) ? $posted_data['your-phone'] : '',
        'message' => isset($posted_data['your-message']) ? $posted_data['your-message'] : '',
        'source' => 'wordpress_cf7',
        // Captura automática da URL atual
        'landingPageUrl' => $_SERVER['HTTP_REFERER'] ?? '',
        // Identificador da Landing Page (pode ser hardcoded ou dinâmico)
        'landingPage' => 'site-institucional',
    ];

    // Envio
    wp_remote_post( 'https://gpus-production.up.railway.app/webhook/leads', [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-Webhook-Secret' => 'SEU_SECRET_CORRETO_AQUI',
        ],
        'body' => json_encode( $payload ),
        'timeout' => 45,
    ]);
}
```

---

## Opção 3: WPForms (Versão Paga)

O WPForms (Pro) possui addon de Webhooks.

1. Vá em **Settings > Webhooks**.
2. Ative Webhooks.
3. No formulário, vá em **Settings > Webhooks > Add New**.
4. **URL:** `https://gpus-production.up.railway.app/webhook/leads`
5. **Method:** `POST`
6. **Request Format:** `JSON`
7. **Request Headers:**
   - Key: `X-Webhook-Secret`
   - Value: `[SEU_SECRET]`
8. **Request Body:** Use o mapeamento visual para ligar os campos do formulário ao JSON esperado (`name`, `email`, `landingPage`, etc).

---

## Testando a Configuração

Para verificar se o webhook está acessível e se suas credenciais estão corretas, você pode usar o endpoint de teste via navegador ou Postman:

`GET https://gpus-production.up.railway.app/webhook/leads/test`

Adicione o header `X-Webhook-Secret` na requisição. Se tudo estiver certo, retornará `status: ok`.
