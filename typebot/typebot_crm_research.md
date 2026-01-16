# Pesquisa: Integração Typebot → CRM Grupo US

## 1. HTTP Request Block (Typebot)

### Funcionalidade Principal
O bloco HTTP Request permite enviar requisições HTTP para serviços de terceiros, útil para:
- Enviar informações do bot para outro serviço
- Buscar informações de outro serviço e usar no bot

### Custom Body com Variáveis
Exemplo de configuração de body personalizado:
```json
{
  "name": "{{Name}}",
  "email": "{{Email}}"
}
```

### Características Técnicas
- **Timeout padrão**: 10 segundos (customizável)
- **Métodos HTTP**: GET, POST, PUT, DELETE, PATCH
- **Teste de requisição**: Botão "Test the request" com valores de teste
- **Salvamento de resposta**: Possível mapear resposta JSON em variáveis do Typebot
- **Logs**: Sistema de logs para troubleshooting

### Fluxo de Integração
1. Coletar dados via inputs do Typebot
2. Armazenar em variáveis (ex: {{Name}}, {{Email}}, {{Phone}})
3. Configurar HTTP Request block com:
   - URL do endpoint do CRM
   - Método POST
   - Headers (Content-Type, Authorization)
   - Body customizado com variáveis
4. Testar requisição
5. Salvar resposta (opcional)

### Webhook URL Alternative
- Serviços como Make.com, Zapier fornecem Webhook URL
- Basta colar a URL no bloco
- Permite customização da requisição enviada

---

## 2. Typebot API

### Endpoint Base
`https://typebot.io/api/v1/typebots/<TYPEBOT_ID>`

### Autenticação
Todas as requisições precisam de API token

### Documentação Relevante
- API Overview: https://docs.typebot.io/deploy/api/overview
- Permite iniciar chat via POST request
- Possibilidade de integração bidirecional

---

## 3. Integrações Nativas
- Google Sheets
- Zapier
- Make.com
- Pabbly Connect
- Chatwoot
- NocoDB

---

## 4. Próximos Passos para Implementação

### Informações Necessárias sobre o CRM Grupo US:
1. **Endpoint da API**: URL para criar/adicionar leads
2. **Método de Autenticação**: API Key, Bearer Token, OAuth
3. **Estrutura de dados**: Campos obrigatórios e opcionais
4. **Formato da requisição**: JSON, Form-data, XML
5. **Resposta esperada**: Estrutura de sucesso/erro

### Campos Típicos a Capturar:
- Nome completo
- Email
- Telefone/WhatsApp
- Interesse/Produto
- Origem/UTM
- Data/hora de captura
- ID do Typebot
- Respostas customizadas do formulário


---

## 5. Estrutura Padrão de API CRM

### Endpoints Comuns para Leads/Contatos

#### Criar Novo Lead (POST)
```
POST https://api.crm.com/v1/leads
POST https://api.crm.com/v1/contacts
```

#### Estrutura JSON Típica
```json
{
  "properties": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "+5511999999999",
    "company": "Empresa XYZ",
    "source": "Typebot",
    "status": "new",
    "custom_field_1": "valor",
    "custom_field_2": "valor"
  }
}
```

### Headers de Autenticação Comuns

#### API Key
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

#### Basic Auth
```
Authorization: Basic BASE64_ENCODED_CREDENTIALS
Content-Type: application/json
```

### Resposta de Sucesso Típica
```json
{
  "id": "lead_12345",
  "status": "created",
  "message": "Lead created successfully",
  "data": {
    "id": "lead_12345",
    "name": "João Silva",
    "created_at": "2026-01-16T10:30:00Z"
  }
}
```

### Resposta de Erro Típica
```json
{
  "error": true,
  "message": "Invalid email format",
  "code": 400
}
```

---

## 6. Best Practices para Webhook Integration

### Segurança
1. **Autenticação**: Sempre usar API keys ou tokens
2. **HTTPS**: Apenas endpoints seguros
3. **Validação**: Validar dados antes de enviar
4. **Rate Limiting**: Respeitar limites de requisições

### Confiabilidade
1. **Retry Logic**: Implementar tentativas automáticas
2. **Timeout**: Configurar timeouts adequados (10-30s)
3. **Logging**: Registrar todas as requisições
4. **Error Handling**: Tratar erros gracefully

### Dados
1. **Normalização**: Padronizar formato de telefone, email
2. **Validação**: Verificar campos obrigatórios
3. **Enriquecimento**: Adicionar metadata (timestamp, source, typebot_id)
4. **Deduplicação**: Evitar leads duplicados

---

## 7. Mapeamento de Campos Typebot → CRM

### Campos Básicos
| Typebot Variable | CRM Field | Tipo | Obrigatório |
|-----------------|-----------|------|-------------|
| {{Nome}} | name | string | Sim |
| {{Email}} | email | string | Sim |
| {{Telefone}} | phone | string | Sim |
| {{Empresa}} | company | string | Não |
| {{Cargo}} | job_title | string | Não |

### Campos de Tracking
| Typebot Variable | CRM Field | Tipo | Obrigatório |
|-----------------|-----------|------|-------------|
| {{utm_source}} | source | string | Não |
| {{utm_campaign}} | campaign | string | Não |
| {{utm_medium}} | medium | string | Não |
| {{typebot_id}} | typebot_id | string | Sim |
| {{submission_date}} | created_at | datetime | Sim |

### Campos Customizados (Grupo US)
| Typebot Variable | CRM Field | Tipo | Obrigatório |
|-----------------|-----------|------|-------------|
| {{Interesse}} | interest_area | string | Sim |
| {{Faturamento}} | monthly_revenue | string | Não |
| {{Tempo_Mercado}} | years_in_business | string | Não |
| {{Cidade}} | city | string | Não |
| {{Estado}} | state | string | Não |


---

## 8. ANÁLISE DO CRM GRUPO US (Convex Backend)

### Arquitetura
- **Backend**: Convex (Backend-as-a-Service com banco de dados)
- **Frontend**: React + TanStack Router
- **Autenticação**: Clerk (multi-tenant com organizações)
- **Database**: Convex (NoSQL com índices otimizados)

### Estrutura de Dados - Tabela `leads`

#### Campos Obrigatórios
```typescript
{
  name: string,              // Nome completo
  phone: string,             // Telefone/WhatsApp (obrigatório)
  source: enum,              // Origem do lead
  stage: enum,               // Estágio no pipeline
  temperature: enum,         // Temperatura (frio/morno/quente)
  organizationId: string,    // ID da organização (multi-tenant)
  createdAt: number,         // Timestamp de criação
  updatedAt: number          // Timestamp de atualização
}
```

#### Campos Opcionais Importantes
```typescript
{
  email?: string,
  message?: string,          // Mensagem do formulário
  
  // UTM Tracking
  utmSource?: string,
  utmCampaign?: string,
  utmMedium?: string,
  utmContent?: string,
  utmTerm?: string,
  
  sourceDetail?: string,     // Detalhes da campanha
  
  // Qualificação
  profession?: enum,         // Profissão (enfermeiro, dentista, etc)
  hasClinic?: boolean,
  clinicName?: string,
  clinicCity?: string,
  yearsInAesthetics?: number,
  currentRevenue?: string,
  
  // Interesse
  interestedProduct?: enum,  // Produto de interesse
  mainPain?: enum,           // Dor principal
  mainDesire?: string,
  
  // Atribuição
  assignedTo?: Id<'users'>,
  
  // Scoring
  score?: number,            // 0-100
  
  // LGPD
  lgpdConsent?: boolean,
  whatsappConsent?: boolean,
  consentGrantedAt?: number,
  consentVersion?: string,
  
  // Follow-up
  lastContactAt?: number,
  nextFollowUpAt?: number
}
```

#### Enums Importantes

**source** (origem):
- `whatsapp`
- `instagram`
- `landing_page`
- `indicacao`
- `evento`
- `organico`
- `trafego_pago`
- `outro`

**stage** (estágio):
- `novo` (padrão)
- `primeiro_contato`
- `qualificado`
- `proposta`
- `negociacao`
- `fechado_ganho`
- `fechado_perdido`

**temperature** (temperatura):
- `frio` (padrão)
- `morno`
- `quente`

**profession** (profissão):
- `enfermeiro`
- `dentista`
- `biomedico`
- `farmaceutico`
- `medico`
- `esteticista`
- `outro`

**interestedProduct** (produto):
- `trintae3`
- `otb`
- `black_neon`
- `comunidade`
- `auriculo`
- `na_mesa_certa`
- `indefinido`

**mainPain** (dor principal):
- `tecnica`
- `vendas`
- `gestao`
- `posicionamento`
- `escala`
- `certificacao`
- `outro`

---

### Mutation Disponível: `createPublicLead`

#### Endpoint
```typescript
api.leads.createPublicLead
```

#### Características
- **Público**: Não requer autenticação
- **Rate Limit**: 5 requisições por IP por hora
- **Idempotente**: Retorna ID existente se telefone duplicado
- **Auto-sync**: Sincroniza automaticamente com email marketing se email fornecido
- **Activity Log**: Registra atividade automaticamente

#### Argumentos Aceitos
```typescript
{
  // Obrigatórios
  name: string,
  phone: string,
  
  // Opcionais
  email?: string,
  source?: enum,
  message?: string,
  
  // UTM
  utmSource?: string,
  utmCampaign?: string,
  utmMedium?: string,
  utmContent?: string,
  utmTerm?: string,
  
  sourceDetail?: string,
  
  // Qualificação
  profession?: enum,
  hasClinic?: boolean,
  clinicName?: string,
  clinicCity?: string,
  yearsInAesthetics?: number,
  currentRevenue?: string,
  
  // Interesse
  interestedProduct?: enum,
  mainPain?: enum,
  mainDesire?: string,
  
  temperature?: enum,
  stage?: enum,
  score?: number,
  
  // LGPD
  lgpdConsent?: boolean,
  whatsappConsent?: boolean,
  
  // Tracking
  organizationId?: string,
  userIp?: string,
  
  nextFollowUpAt?: number
}
```

#### Resposta
```typescript
// Sucesso: retorna ID do lead
leadId: Id<'leads'>

// Erro: throw Error com mensagem
"Rate limit exceeded"
```

---

## 9. ESTRATÉGIA DE INTEGRAÇÃO TYPEBOT → CONVEX CRM

### Opção 1: HTTP Request Direto (RECOMENDADO)

#### Configuração no Typebot
1. Adicionar bloco **HTTP Request** após coleta de dados
2. Configurar:
   - **URL**: `https://[seu-deployment].convex.cloud/api/mutation`
   - **Method**: POST
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body**:
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
         "lgpdConsent": true,
         "whatsappConsent": true,
         "utmSource": "{{utm_source}}",
         "utmCampaign": "{{utm_campaign}}",
         "utmMedium": "{{utm_medium}}"
       },
       "format": "json"
     }
     ```

#### Vantagens
- ✅ Sem intermediários
- ✅ Latência mínima
- ✅ Controle total dos dados
- ✅ Rate limit nativo
- ✅ Deduplicação automática

#### Desvantagens
- ⚠️ Expõe URL do Convex (mitigado por rate limit)
- ⚠️ Sem autenticação adicional (mutation já é pública)

---

### Opção 2: Webhook via Make.com/Zapier (INTERMEDIÁRIO)

#### Fluxo
1. Typebot → Webhook URL (Make.com)
2. Make.com → Transformação de dados
3. Make.com → Convex API

#### Vantagens
- ✅ Interface visual
- ✅ Fácil debug
- ✅ Transformações complexas
- ✅ Múltiplas ações (ex: enviar email + CRM)

#### Desvantagens
- ❌ Custo adicional
- ❌ Latência maior
- ❌ Dependência de terceiros

---

### Opção 3: API Gateway Customizada (AVANÇADO)

#### Arquitetura
```
Typebot → API Gateway (Vercel/AWS) → Validação → Convex
```

#### Vantagens
- ✅ Validação customizada
- ✅ Autenticação adicional
- ✅ Transformações complexas
- ✅ Logging avançado

#### Desvantagens
- ❌ Requer desenvolvimento
- ❌ Manutenção adicional
- ❌ Infraestrutura extra

---

## 10. RECOMENDAÇÃO FINAL

**Usar Opção 1: HTTP Request Direto para Convex**

### Justificativa
1. **Simplicidade**: Configuração em minutos
2. **Performance**: Latência mínima
3. **Custo**: Zero custos adicionais
4. **Segurança**: Rate limit + deduplicação nativos
5. **Manutenção**: Zero overhead
6. **Confiabilidade**: Convex tem 99.9% uptime

### Próximos Passos
1. Obter URL do deployment Convex
2. Configurar HTTP Request no Typebot
3. Mapear variáveis do formulário
4. Testar integração
5. Monitorar logs no Convex Dashboard


---

## 11. CONVEX HTTP API - DOCUMENTAÇÃO COMPLETA

### Endpoint para Mutations
```
POST https://<CONVEX_URL>/api/mutation
```

### Estrutura da Requisição

#### Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>  // Opcional, para autenticação de usuário
```

#### Body (JSON)
```json
{
  "path": "module:functionName",
  "args": {
    "param1": "value1",
    "param2": "value2"
  },
  "format": "json"
}
```

### Exemplo Prático para createPublicLead

#### Request
```bash
curl https://acoustic-panther-728.convex.cloud/api/mutation \
  -d '{
    "path": "leads:createPublicLead",
    "args": {
      "name": "João Silva",
      "phone": "+5511999999999",
      "email": "joao@email.com",
      "source": "landing_page",
      "sourceDetail": "typebot_clre581p70023ug1x6arhrszx",
      "message": "Quero saber mais sobre os cursos",
      "interestedProduct": "trintae3",
      "profession": "dentista",
      "lgpdConsent": true,
      "whatsappConsent": true,
      "utmSource": "google",
      "utmCampaign": "curso_estetica",
      "utmMedium": "cpc"
    },
    "format": "json"
  }' \
  -H "Content-Type: application/json"
```

#### Response - Sucesso (200)
```json
{
  "status": "success",
  "value": "k17abc123xyz",
  "logLines": [
    "Lead created successfully"
  ]
}
```

#### Response - Erro (200 com status error)
```json
{
  "status": "error",
  "errorMessage": "Rate limit exceeded",
  "errorData": {},
  "logLines": []
}
```

### Formato Alternativo: /api/run/{functionIdentifier}

#### Endpoint
```
POST https://<CONVEX_URL>/api/run/leads/createPublicLead
```

#### Body
```json
{
  "args": {
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "format": "json"
}
```

### Observações Importantes

1. **Formato JSON**: Não suporta todos os tipos Convex (ex: Bytes, Int64)
2. **Autenticação Opcional**: Mutations públicas não requerem token
3. **Rate Limiting**: Implementado na própria mutation
4. **Idempotência**: Duplicate check por telefone
5. **Logs**: Sempre retornados para debug

---

## 12. CONFIGURAÇÃO FINAL NO TYPEBOT

### Passo 1: Identificar URL do Convex

Verificar no arquivo `convex.json` ou dashboard Convex:
```json
{
  "deployment": "https://acoustic-panther-728.convex.cloud"
}
```

### Passo 2: Configurar HTTP Request Block

#### URL
```
https://[SEU-DEPLOYMENT].convex.cloud/api/mutation
```

#### Method
```
POST
```

#### Headers
```
Content-Type: application/json
```

#### Body
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

### Passo 3: Configurar Variáveis de Teste

No Typebot, adicionar valores de teste:
```
Nome: "Maria Santos"
Telefone: "+5511988887777"
Email: "maria@teste.com"
Produto: "trintae3"
Profissao: "enfermeiro"
```

### Passo 4: Testar Requisição

Clicar em "Test the request" no Typebot e verificar:
- ✅ Status 200
- ✅ Response: `{"status": "success", "value": "k1..."}`
- ✅ Lead aparece no CRM

### Passo 5: Salvar Resposta (Opcional)

Mapear resposta para variáveis do Typebot:
```
{{leadId}} = response.value
{{status}} = response.status
```

### Passo 6: Adicionar Mensagem de Confirmação

Após HTTP Request, adicionar bubble:
```
✅ Pronto! Seus dados foram enviados com sucesso.
Em breve nossa equipe entrará em contato.
```

---

## 13. MAPEAMENTO COMPLETO DE CAMPOS

### Campos Obrigatórios Mínimos
```json
{
  "name": "{{Nome}}",
  "phone": "{{Telefone}}"
}
```

### Campos Recomendados
```json
{
  "name": "{{Nome}}",
  "phone": "{{Telefone}}",
  "email": "{{Email}}",
  "source": "landing_page",
  "sourceDetail": "typebot_clre581p70023ug1x6arhrszx",
  "lgpdConsent": true,
  "whatsappConsent": true
}
```

### Campos Completos (Qualificação Máxima)
```json
{
  "name": "{{Nome}}",
  "phone": "{{Telefone}}",
  "email": "{{Email}}",
  "source": "landing_page",
  "sourceDetail": "typebot_clre581p70023ug1x6arhrszx",
  "message": "{{Mensagem}}",
  
  "profession": "{{Profissao}}",
  "hasClinic": {{TemClinica}},
  "clinicName": "{{NomeClinica}}",
  "clinicCity": "{{CidadeClinica}}",
  "yearsInAesthetics": {{AnosExperiencia}},
  "currentRevenue": "{{FaturamentoAtual}}",
  
  "interestedProduct": "{{Produto}}",
  "mainPain": "{{DorPrincipal}}",
  "mainDesire": "{{DesejoMaior}}",
  
  "temperature": "{{Temperatura}}",
  "score": {{Score}},
  
  "lgpdConsent": true,
  "whatsappConsent": true,
  
  "utmSource": "{{utm_source}}",
  "utmCampaign": "{{utm_campaign}}",
  "utmMedium": "{{utm_medium}}",
  "utmContent": "{{utm_content}}",
  "utmTerm": "{{utm_term}}"
}
```

---

## 14. TROUBLESHOOTING

### Erro: "Rate limit exceeded"
**Causa**: Mais de 5 submissões do mesmo IP em 1 hora  
**Solução**: Aguardar 1 hora ou usar IP diferente

### Erro: "Invalid phone format"
**Causa**: Telefone sem formato correto  
**Solução**: Validar formato no Typebot (ex: +5511999999999)

### Erro: "Invalid enum value"
**Causa**: Valor não corresponde aos enums do schema  
**Solução**: Verificar valores aceitos (ex: profession, source, etc)

### Lead duplicado retorna ID existente
**Comportamento**: Normal, é idempotente  
**Ação**: Lead existente será retornado, não é erro

### Resposta vazia ou timeout
**Causa**: URL incorreta ou deployment offline  
**Solução**: Verificar URL no dashboard Convex

### Lead não aparece no CRM
**Causa**: organizationId incorreto ou ausente  
**Solução**: Verificar organizationId no Convex ou deixar vazio (usa default)
