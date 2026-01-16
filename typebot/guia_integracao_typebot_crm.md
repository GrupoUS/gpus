# 🚀 Guia Completo: Integração Typebot → CRM Grupo US

**Autor**: Maurício (CTO Grupo US)
**Data**: 16 de Janeiro de 2026
**Typebot ID**: `clre581p70023ug1x6arhrszx`
**Objetivo**: Capturar leads automaticamente do Typebot e adicionar no CRM Convex

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Arquitetura da Solução](#arquitetura-da-solução)
4. [Configuração Passo a Passo](#configuração-passo-a-passo)
5. [Mapeamento de Campos](#mapeamento-de-campos)
6. [Testes e Validação](#testes-e-validação)
7. [Troubleshooting](#troubleshooting)
8. [Monitoramento](#monitoramento)

---

## 🎯 Visão Geral

Esta integração permite que todos os leads que completarem o formulário no Typebot sejam automaticamente adicionados ao CRM do Grupo US (construído em Convex), sem necessidade de ferramentas intermediárias como Zapier ou Make.com.

### Benefícios

- ✅ **Zero custo adicional**: Integração direta sem middleware
- ✅ **Latência mínima**: Resposta em menos de 2 segundos
- ✅ **Deduplicação automática**: Evita leads duplicados por telefone
- ✅ **Rate limiting nativo**: Proteção contra spam (5 submissões/IP/hora)
- ✅ **LGPD compliant**: Campos de consentimento incluídos
- ✅ **Rastreamento completo**: UTM parameters e origem do lead

### Fluxo de Dados

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Usuário    │──────▶│   Typebot    │──────▶│  Convex CRM  │
│  (Formulário)│       │ (HTTP POST)  │       │   (Mutation) │
└──────────────┘       └──────────────┘       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   Resposta   │
                       │ (Success/Err)│
                       └──────────────┘
```

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter:

1. **Acesso ao Typebot**: Permissão de edição no bot ID `clre581p70023ug1x6arhrszx`
2. **URL do Convex**: Disponível no dashboard Convex em Settings → API URL
3. **Conhecimento básico**: Familiaridade com JSON e variáveis do Typebot
4. **Acesso ao CRM**: Permissão para visualizar leads no Convex Dashboard

---

## 🏗️ Arquitetura da Solução

### Tecnologias Utilizadas

| Componente | Tecnologia | Função |
|------------|-----------|--------|
| **Frontend** | Typebot (Cloud) | Coleta de dados via formulário conversacional |
| **Backend** | Convex (Serverless) | Armazenamento e gestão de leads |
| **API** | Convex HTTP API | Endpoint público para criar leads |
| **Mutation** | `createPublicLead` | Função que valida e insere o lead no banco |

### Estrutura de Dados (Convex Schema)

A tabela `leads` no Convex possui a seguinte estrutura:

#### Campos Obrigatórios
- **name** (string): Nome completo
- **phone** (string): Telefone/WhatsApp
- **source** (enum): Origem do lead
- **stage** (enum): Estágio no pipeline (padrão: "novo")
- **temperature** (enum): Temperatura do lead (padrão: "frio")
- **organizationId** (string): ID da organização
- **createdAt** (timestamp): Data de criação
- **updatedAt** (timestamp): Data de atualização

#### Campos Opcionais (Qualificação)
- **email** (string)
- **message** (string)
- **profession** (enum): enfermeiro, dentista, biomedico, etc.
- **hasClinic** (boolean)
- **clinicName** (string)
- **clinicCity** (string)
- **yearsInAesthetics** (number)
- **currentRevenue** (string)
- **interestedProduct** (enum): trintae3, otb, black_neon, etc.
- **mainPain** (enum): tecnica, vendas, gestao, etc.
- **mainDesire** (string)

#### Campos de Tracking
- **utmSource** (string)
- **utmCampaign** (string)
- **utmMedium** (string)
- **utmContent** (string)
- **utmTerm** (string)
- **sourceDetail** (string): Para identificar o Typebot específico

#### Campos LGPD
- **lgpdConsent** (boolean)
- **whatsappConsent** (boolean)
- **consentGrantedAt** (timestamp)
- **consentVersion** (string)

---

## ⚙️ Configuração Passo a Passo

### Passo 1: Obter a URL do Convex

1. Acesse o [Convex Dashboard](https://dashboard.convex.dev)
2. Selecione o projeto **gpus**
3. Navegue até **Settings** → **API URL**
4. Copie a URL (formato: `https://acoustic-panther-728.convex.cloud`)

**Nota**: Se você não tem acesso ao dashboard, solicite a URL ao time de desenvolvimento.

---

### Passo 2: Configurar o Bloco HTTP Request no Typebot

1. Abra o editor do Typebot
2. Acesse o bot com ID: `clre581p70023ug1x6arhrszx`
3. Navegue até o **final do fluxo** (após todas as perguntas)
4. Adicione um novo bloco **HTTP Request** da seção **Integrations**

#### Configurações do Bloco

**URL**:
```
https://clean-lion-623.convex.cloud/api/mutation
```

**Method**:
```
POST
```

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "path": "leads:createPublicLead",
  "args": {
    "name": "{{Nome}}",
    "phone": "{{Telefone}}",
    "email": "{{Email}}",
    "source": "landing_page",
    "sourceDetail": "typebot_clre581p70023ug1x6arhrszx",
    "message": "{{Mensagem}}",
    "interestedProduct": "{{Produto}}",
    "profession": "{{Profissao}}",
    "hasClinic": {{TemClinica}},
    "clinicName": "{{NomeClinica}}",
    "clinicCity": "{{CidadeClinica}}",
    "yearsInAesthetics": {{AnosExperiencia}},
    "currentRevenue": "{{FaturamentoAtual}}",
    "mainPain": "{{DorPrincipal}}",
    "mainDesire": "{{DesejoMaior}}",
    "lgpdConsent": true,
    "whatsappConsent": true,
    "utmSource": "{{utm_source}}",
    "utmCampaign": "{{utm_campaign}}",
    "utmMedium": "{{utm_medium}}",
    "utmContent": "{{utm_content}}",
    "utmTerm": "{{utm_term}}"
  },
  "format": "json"
}
```

**⚠️ Importante**:
- Substitua `{{Nome}}`, `{{Telefone}}`, etc. pelos **nomes exatos** das variáveis no seu Typebot
- Se alguma variável não existir no seu formulário, remova a linha correspondente
- Campos booleanos (`hasClinic`) e numéricos (`yearsInAesthetics`) devem estar **sem aspas**

---

### Passo 3: Configurar Valores de Teste

No Typebot, na seção **Test the request**, adicione valores de exemplo:

```yaml
Nome: "Maria Santos"
Telefone: "+5511988887777"
Email: "maria@teste.com"
Produto: "trintae3"
Profissao: "enfermeiro"
TemClinica: true
NomeClinica: "Clínica Estética Bella"
CidadeClinica: "São Paulo"
AnosExperiencia: 5
FaturamentoAtual: "10k-30k"
DorPrincipal: "vendas"
DesejoMaior: "Aumentar faturamento em 50%"
utm_source: "google"
utm_campaign: "curso_estetica_2026"
utm_medium: "cpc"
```

---

### Passo 4: Testar a Requisição

1. Clique no botão **Test the request** no Typebot
2. Aguarde a resposta (deve levar menos de 2 segundos)
3. Verifique se a resposta é:

**Sucesso**:
```json
{
  "status": "success",
  "value": "k17abc123xyz",
  "logLines": ["Lead created successfully"]
}
```

**Erro**:
```json
{
  "status": "error",
  "errorMessage": "Rate limit exceeded",
  "errorData": {},
  "logLines": []
}
```

---

### Passo 5: Verificar no CRM

1. Acesse o [Convex Dashboard](https://dashboard.convex.dev)
2. Navegue até **Data** → **leads**
3. Verifique se o lead de teste foi criado
4. Confirme os campos:
   - **name**: "Maria Santos"
   - **phone**: "+5511988887777"
   - **source**: "landing_page"
   - **sourceDetail**: "typebot_clre581p70023ug1x6arhrszx"

---

### Passo 6: Adicionar Feedback ao Usuário

Após o bloco HTTP Request, adicione um **Condition** block:

#### Condição de Sucesso
- **If**: `{{response.status}}` equals `"success"`
- **Then**: Adicione um **Text** bubble:

```
✅ Pronto, {{Nome}}!

Seus dados foram enviados com sucesso.

Nossa equipe entrará em contato em breve pelo WhatsApp {{Telefone}}.

Fique de olho no seu celular! 📱
```

#### Condição de Erro
- **Else**: Adicione um **Text** bubble:

```
❌ Ops! Algo deu errado.

Por favor, tente novamente ou entre em contato conosco diretamente:

📞 WhatsApp: (11) 99999-9999
📧 Email: contato@grupous.com.br
```

---

### Passo 7: Publicar e Monitorar

1. Clique em **Publish** no Typebot
2. Teste o formulário ao vivo com dados reais
3. Monitore os leads no CRM
4. Configure alertas para novas submissões

---

## 🗺️ Mapeamento de Campos

### Tabela de Referência Completa

| Variável Typebot | Campo Convex | Tipo | Obrigatório | Valores Aceitos | Exemplo |
|-----------------|--------------|------|-------------|-----------------|---------|
| `{{Nome}}` | `name` | string | ✅ | Qualquer texto | "João Silva" |
| `{{Telefone}}` | `phone` | string | ✅ | Formato internacional | "+5511999999999" |
| `{{Email}}` | `email` | string | ❌ | Email válido | "joao@email.com" |
| - | `source` | enum | ✅ | Ver lista abaixo | "landing_page" |
| - | `sourceDetail` | string | ❌ | Qualquer texto | "typebot_clre..." |
| `{{Mensagem}}` | `message` | string | ❌ | Qualquer texto | "Quero saber mais" |
| `{{Produto}}` | `interestedProduct` | enum | ❌ | Ver lista abaixo | "trintae3" |
| `{{Profissao}}` | `profession` | enum | ❌ | Ver lista abaixo | "dentista" |
| `{{TemClinica}}` | `hasClinic` | boolean | ❌ | `true` ou `false` | `true` |
| `{{NomeClinica}}` | `clinicName` | string | ❌ | Qualquer texto | "Clínica Bella" |
| `{{CidadeClinica}}` | `clinicCity` | string | ❌ | Qualquer texto | "São Paulo" |
| `{{AnosExperiencia}}` | `yearsInAesthetics` | number | ❌ | Número inteiro | `5` |
| `{{FaturamentoAtual}}` | `currentRevenue` | string | ❌ | Faixa de valores | "10k-30k" |
| `{{DorPrincipal}}` | `mainPain` | enum | ❌ | Ver lista abaixo | "vendas" |
| `{{DesejoMaior}}` | `mainDesire` | string | ❌ | Qualquer texto | "Aumentar faturamento" |
| - | `lgpdConsent` | boolean | ❌ | `true` ou `false` | `true` |
| - | `whatsappConsent` | boolean | ❌ | `true` ou `false` | `true` |
| `{{utm_source}}` | `utmSource` | string | ❌ | Qualquer texto | "google" |
| `{{utm_campaign}}` | `utmCampaign` | string | ❌ | Qualquer texto | "curso_2026" |
| `{{utm_medium}}` | `utmMedium` | string | ❌ | Qualquer texto | "cpc" |
| `{{utm_content}}` | `utmContent` | string | ❌ | Qualquer texto | "banner_azul" |
| `{{utm_term}}` | `utmTerm` | string | ❌ | Qualquer texto | "curso+estetica" |

### Valores de Enum Aceitos

#### `source` (origem do lead)
- `whatsapp`
- `instagram`
- **`landing_page`** ← Use este para Typebot
- `indicacao`
- `evento`
- `organico`
- `trafego_pago`
- `outro`

#### `interestedProduct` (produto de interesse)
- `trintae3` - Curso Trinta e Três
- `otb` - On The Business
- `black_neon` - Black Neon
- `comunidade` - Comunidade Grupo US
- `auriculo` - Curso de Auriculoterapia
- `na_mesa_certa` - Na Mesa Certa
- `indefinido` - Ainda não definiu

#### `profession` (profissão)
- `enfermeiro`
- `dentista`
- `biomedico`
- `farmaceutico`
- `medico`
- `esteticista`
- `outro`

#### `mainPain` (dor principal)
- `tecnica` - Falta de técnica/conhecimento
- `vendas` - Dificuldade em vender
- `gestao` - Problemas de gestão
- `posicionamento` - Posicionamento no mercado
- `escala` - Dificuldade em escalar
- `certificacao` - Falta de certificação
- `outro`

---

## ✅ Testes e Validação

### Checklist de Validação

- [ ] **Teste 1**: Submissão com todos os campos preenchidos
- [ ] **Teste 2**: Submissão com apenas campos obrigatórios (nome + telefone)
- [ ] **Teste 3**: Submissão com caracteres especiais no nome (ex: "José D'Angelo")
- [ ] **Teste 4**: Submissão com telefone em formato diferente (ex: "(11) 99999-9999")
- [ ] **Teste 5**: Submissão duplicada (mesmo telefone) - deve retornar ID existente
- [ ] **Teste 6**: Verificar se UTM parameters estão sendo capturados corretamente
- [ ] **Teste 7**: Verificar se `sourceDetail` contém o ID do Typebot
- [ ] **Teste 8**: Verificar se mensagem de sucesso é exibida ao usuário
- [ ] **Teste 9**: Simular erro (URL incorreta) e verificar mensagem de erro
- [ ] **Teste 10**: Verificar se lead aparece no CRM em menos de 2 segundos

### Critérios de Aceitação

| Critério | Status | Observações |
|----------|--------|-------------|
| Lead criado no CRM | ⬜ | Verificar na tabela `leads` |
| Campos mapeados corretamente | ⬜ | Comparar dados enviados vs recebidos |
| `source` = "landing_page" | ⬜ | Fixo no payload |
| `sourceDetail` contém Typebot ID | ⬜ | "typebot_clre581p70023ug1x6arhrszx" |
| UTM parameters capturados | ⬜ | Verificar campos utm* |
| Consentimentos LGPD = true | ⬜ | lgpdConsent e whatsappConsent |
| Resposta em < 2 segundos | ⬜ | Medir tempo de resposta |
| Mensagem de sucesso exibida | ⬜ | Feedback ao usuário |
| Deduplicação funciona | ⬜ | Testar com mesmo telefone |
| Rate limit ativo | ⬜ | Testar 6 submissões seguidas |

---

## 🐛 Troubleshooting

### Problemas Comuns e Soluções

#### 1. Erro: "Rate limit exceeded"

**Causa**: Mais de 5 submissões do mesmo IP em 1 hora.

**Solução**:
- Aguardar 1 hora para o limite resetar
- Testar de um IP diferente (ex: usar 4G do celular)
- Verificar se há bots ou scripts fazendo submissões em massa

---

#### 2. Erro: "Invalid phone format"

**Causa**: Telefone não está no formato internacional.

**Solução**:
- Garantir formato: `+5511999999999` (código do país + DDD + número)
- Adicionar validação no Typebot para formatar automaticamente
- Remover caracteres especiais: `(`, `)`, `-`, espaços

**Exemplo de validação no Typebot**:
```javascript
// Remover caracteres não numéricos
phone = phone.replace(/\D/g, '');

// Adicionar +55 se não tiver
if (!phone.startsWith('55')) {
  phone = '55' + phone;
}

// Adicionar + no início
phone = '+' + phone;
```

---

#### 3. Erro: "Invalid enum value for field 'profession'"

**Causa**: O valor enviado não corresponde aos valores aceitos no enum.

**Solução**:
- Verificar a lista de valores aceitos na seção [Mapeamento de Campos](#mapeamento-de-campos)
- Garantir que o Typebot use **exatamente** os mesmos valores (case-sensitive)
- Exemplo: "Dentista" ❌ → "dentista" ✅

**Configuração recomendada no Typebot**:
- Use **Buttons** ou **Select** ao invés de **Text Input** para campos enum
- Configure os valores dos botões com os valores exatos do enum

---

#### 4. Lead não aparece no CRM

**Causa**: `organizationId` incorreto ou ausente.

**Solução**:
- Verificar se o campo `organizationId` está sendo enviado (opcional)
- Se não souber o ID da organização, **remova o campo** do payload
- O sistema usará a organização padrão automaticamente

---

#### 5. HTTP Request retorna timeout

**Causa**: URL do Convex incorreta ou rede bloqueada.

**Solução**:
- Verificar se a URL está correta (copiar novamente do dashboard)
- Testar a URL em um navegador (deve retornar erro 404, mas não timeout)
- Verificar se o firewall/proxy não está bloqueando requisições

---

#### 6. Resposta vazia ou null

**Causa**: Erro no parsing do JSON ou campo obrigatório faltando.

**Solução**:
- Validar o JSON no [JSONLint](https://jsonlint.com/)
- Garantir que `name` e `phone` estão presentes
- Verificar se as variáveis do Typebot estão sendo preenchidas corretamente

---

#### 7. Lead duplicado retorna ID existente

**Comportamento**: Isso é **esperado** e **correto**.

**Explicação**:
- A mutation `createPublicLead` é **idempotente**
- Se um lead com o mesmo telefone já existe, retorna o ID existente
- Isso evita leads duplicados no CRM

**Ação**: Nenhuma ação necessária. Este é o comportamento desejado.

---

#### 8. Campos opcionais não aparecem no CRM

**Causa**: Variável do Typebot está vazia ou não foi definida.

**Solução**:
- Verificar se a variável foi criada no Typebot
- Garantir que a pergunta foi respondida pelo usuário
- Adicionar valores padrão para campos opcionais, se necessário

---

#### 9. UTM parameters não são capturados

**Causa**: UTMs não estão na URL ou não foram passados para o Typebot.

**Solução**:
- Garantir que a URL de acesso ao Typebot contém os UTMs:
  ```
  https://typebot.io/clre581p70023ug1x6arhrszx?utm_source=google&utm_campaign=curso_2026
  ```
- Configurar o Typebot para capturar UTMs automaticamente:
  - Criar variáveis: `{{utm_source}}`, `{{utm_campaign}}`, etc.
  - Usar a função "Set variable" com valor: `{{query.utm_source}}`

---

#### 10. Mensagem de erro não é exibida ao usuário

**Causa**: Condição no Typebot não está configurada corretamente.

**Solução**:
- Verificar se a variável `{{response}}` está sendo salva após o HTTP Request
- Conferir se a condição verifica `{{response.status}}` equals `"success"`
- Testar forçando um erro (URL incorreta) para validar o fluxo de erro

---

## 📊 Monitoramento

### Métricas Recomendadas

| Métrica | Ferramenta | Objetivo |
|---------|-----------|----------|
| **Taxa de conversão** | Typebot Analytics | % de usuários que completam o formulário |
| **Leads capturados/dia** | Convex Dashboard | Quantos leads estão sendo adicionados |
| **Tempo de resposta** | Convex Logs | Latência da integração |
| **Taxa de erro** | Convex Logs | % de requisições que falharam |
| **Leads duplicados** | Query Convex | Quantos leads tentaram se cadastrar novamente |
| **Origem dos leads** | Convex Dashboard | Distribuição por `sourceDetail` |
| **Produtos de interesse** | Convex Dashboard | Quais produtos mais atraem leads |

### Dashboard Sugerido

Crie um dashboard no Convex ou em uma ferramenta de BI com:

1. **Gráfico de linha**: Leads capturados por dia
2. **Gráfico de pizza**: Distribuição por produto de interesse
3. **Gráfico de barras**: Distribuição por profissão
4. **Tabela**: Últimos 10 leads capturados
5. **Contador**: Total de leads do Typebot (filtro: `sourceDetail` contém "typebot")
6. **Alerta**: Notificação quando taxa de erro > 5%

### Alertas Recomendados

Configure alertas para:

- ✉️ **Email**: Quando um lead de alta temperatura é capturado
- 📱 **WhatsApp**: Quando um lead de produto premium é capturado
- 🚨 **Slack**: Quando a taxa de erro ultrapassa 10%
- 📊 **Dashboard**: Atualização em tempo real de novos leads

---

## 🔒 Segurança e Compliance

### LGPD

Esta integração está em conformidade com a LGPD (Lei Geral de Proteção de Dados):

- ✅ **Consentimento explícito**: Campos `lgpdConsent` e `whatsappConsent` são obrigatórios
- ✅ **Finalidade específica**: Dados coletados apenas para contato comercial
- ✅ **Transparência**: Usuário é informado sobre o uso dos dados
- ✅ **Segurança**: Dados transmitidos via HTTPS
- ✅ **Direito ao esquecimento**: Possível deletar leads do CRM

**Recomendação**: Adicione no Typebot um texto explicativo antes da submissão:

```
Ao enviar este formulário, você autoriza o Grupo US a entrar em contato
via WhatsApp e email para apresentar nossos cursos e produtos.

Seus dados serão tratados conforme nossa Política de Privacidade e você
pode solicitar a exclusão a qualquer momento.

[ ] Li e concordo com os termos acima
```

### Rate Limiting

A mutation `createPublicLead` possui rate limiting nativo:

- **Limite**: 5 submissões por IP por hora
- **Janela**: 60 minutos (rolling window)
- **Proteção**: Contra spam e ataques de força bruta

**Nota**: Se você precisar de um limite maior (ex: eventos ao vivo), entre em contato com o time de desenvolvimento.

### Validação de Dados

A mutation valida automaticamente:

- ✅ Formato de email (se fornecido)
- ✅ Formato de telefone (internacional)
- ✅ Valores de enum (profession, source, etc.)
- ✅ Tipos de dados (boolean, number, string)

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Typebot - HTTP Request Block](https://docs.typebot.io/editor/blocks/integrations/http-request)
- [Convex - HTTP API](https://docs.convex.dev/http-api/)
- [Convex - Mutations](https://docs.convex.dev/functions/mutation-functions)
- [LGPD - Guia Oficial](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

### Suporte

Para dúvidas ou problemas:

- **Email**: dev@grupous.com.br
- **Slack**: Canal #tech-support
- **GitHub**: [GrupoUS/gpus](https://github.com/GrupoUS/gpus)

---

## 🎉 Conclusão

Parabéns! Você configurou com sucesso a integração entre o Typebot e o CRM do Grupo US.

Agora, todos os leads que completarem o formulário serão automaticamente adicionados ao CRM, permitindo que a equipe de vendas entre em contato rapidamente e aumente a taxa de conversão.

**Próximos passos sugeridos**:

1. ✅ Configurar alertas para novos leads
2. ✅ Criar dashboard de acompanhamento
3. ✅ Treinar equipe de vendas no novo fluxo
4. ✅ Otimizar perguntas do Typebot baseado em dados
5. ✅ Implementar automações de follow-up

---

**Desenvolvido com ❤️ pelo time Grupo US**
**Última atualização**: 16 de Janeiro de 2026
