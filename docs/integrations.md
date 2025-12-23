# Documentação de Integrações

Este documento descreve como configurar as integrações externas disponíveis no portal.

## Visão Geral

O sistema suporta as seguintes integrações nativas:

1.  **Asaas**: Gateway de pagamentos (PIX, Boleto, Cartão).
2.  **Evolution API**: Integração com WhatsApp Business.
3.  **Dify AI**: Assistente de IA e automação.

As configurações são gerenciadas em `Configurações > Integrações` e exigem permissões de administrador.

---

## 1. Asaas (Pagamentos)

O Asaas é utilizado para processar matrículas e assinaturas.

### Pré-requisitos
- Uma conta ativa no [Asaas](https://www.asaas.com/).
- Chave de API gerada no painel do Asaas.

### Configuração
1.  Acesse o painel do Asaas:
    - **Produção**: `Minha Conta > Integração`
    - **Sandbox**: [sandbox.asaas.com](https://sandbox.asaas.com/) > `Minha Conta > Integração`
2.  Gere uma nova **API Key**.
3.  No portal, vá para `Configurações > Integrações > Asaas`.
4.  Selecione o ambiente (**Produção** ou **Sandbox**).
5.  Insira a **API Key** e a **URL Base** (o padrão geralmente é correto).
6.  (Opcional) Configure o Webhook Secret se desejar validar notificações de pagamento.

### Webhooks
O sistema cria automaticamente os webhooks necessários na primeira conexão bem-sucedida, ou você pode configurá-los manualmente para apontar para `https://seu-dominio.com/api/webhooks/asaas`.

---

## 2. Evolution API (WhatsApp)

Utilizada para enviar mensagens automáticas e permitir atendimento via WhatsApp diretamente pelo CRM.

### Pré-requisitos
- Uma instância funcional da [Evolution API](https://doc.evolution-api.com/).
- API Key Global ou da Instância.

### Configuração
1.  Obtenha a URL da sua API (ex: `https://api.seudominio.com`).
2.  Crie ou identifique uma instância (ex: `vendas-principal`).
3.  No portal, insira:
    - **Evolution API URL**: Endereço completo da API.
    - **API Key**: Chave de autenticação.
    - **Nome da Instância**: Nome exato da instância criada.
4.  Clique em "Testar Conexão" para validar.

---

## 3. Dify AI (Inteligência Artificial)

Integração com agentes de IA para suporte e automação de vendas.

### Pré-requisitos
- Uma conta no [Dify.ai](https://dify.ai) ou instância self-hosted.
- Um App criado (Chatbot ou Agente).

### Configuração
1.  No Dify, acesse seu App e vá em **API Access**.
2.  Gere uma nova **API Key**.
3.  Copie o **App ID** (geralmente encontrado na URL ou configurações).
4.  No portal, insira:
    - **URL**: `https://api.dify.ai/v1` (ou sua URL self-hosted).
    - **API Key**: Chave gerada.
    - **App ID**: ID do aplicativo.

---

## Segurança

- Todas as chaves de API são criptografadas antes de serem salvas no banco de dados.
- O frontend nunca recebe as chaves completas após serem salvas (apenas os últimos 4 dígitos são exibidos).
- Apenas usuários com cargo `admin` podem visualizar ou editar essas configurações.
