# Guia de Segurança e Auditoria Asaas

Este documento descreve as práticas de segurança, rotação de chaves e auditoria para a integração com a API do Asaas.

## 🔐 Gerenciamento de Credenciais

### Armazenamento
- A `ASAAS_API_KEY` é armazenada exclusivamente nas variáveis de ambiente do Convex (`Convex Dashboard > Settings > Environment Variables`).
- **NUNCA** commite a chave no código fonte.
- Em ambiente de desenvolvimento, utilize a chave de Sandbox.
- Em produção, utilize a chave de Produção.

### Rotação de Chaves (Política de 90 dias)
Recomenda-se rotacionar a chave de API a cada 90 dias para minimizar riscos em caso de vazamento.

**Procedimento de Rotação:**
1. **Gerar Nova Chave:**
   - Acesse o painel do Asaas (Configurações > Integrações).
   - Gere uma nova chave de API.
   
2. **Configurar no Convex (Sem Downtime):**
   - Adicione a nova chave como `ASAAS_API_KEY_NEW` nas variáveis de ambiente do Convex.
   - (Opcional) Implemente uma lógica temporária para tentar a chave nova se a antiga falhar, ou apenas prepare para a troca rápida.
   
3. **Substituir a Chave:**
   - Atualize a variável `ASAAS_API_KEY` com o valor da nova chave.
   - Remova `ASAAS_API_KEY_NEW`.
   
4. **Revogar Chave Antiga:**
   - No painel do Asaas, revogue/exclua a chave antiga.

## 🛡️ Princípio do Menor Privilégio

- Verifique as permissões da chave de API no painel do Asaas.
- Se possível, restrinja a chave apenas aos escopos necessários (Clientes, Cobranças, Assinaturas).
- Desabilite funcionalidades críticas não utilizadas (ex: Transferências, Antecipações) se a integração não as utilizar.

## 📊 Auditoria e Monitoramento

### Logs de Auditoria (`asaasApiAudit`)
Todas as chamadas à API do Asaas são registradas na tabela `asaasApiAudit` do banco de dados Convex.

**Campos Registrados:**
- `endpoint`: Endpoint acessado (ex: `/customers`)
- `method`: Método HTTP (GET, POST, etc.)
- `statusCode`: Código de resposta HTTP
- `responseTime`: Tempo de resposta em ms
- `userId`: ID do usuário que iniciou a ação (se aplicável)
- `errorMessage`: Mensagem de erro (em caso de falha)
- `timestamp`: Data/hora da requisição

### Monitoramento de Anomalias
Utilize a query `getApiUsageStats` para monitorar a saúde da integração.

**Métricas para Alerta:**
- **Taxa de Erro > 10%:** Pode indicar problemas na API do Asaas, credenciais inválidas ou bugs na integração.
- **Tempo de Resposta > 5s:** Pode indicar lentidão na rede ou na API do Asaas.
- **Picos de Requisições:** Podem indicar loops de retry infinitos ou ataques.

### Consultando Estatísticas
Você pode consultar as estatísticas via Convex Dashboard ou chamando a função:

```typescript
// Exemplo: Estatísticas das últimas 24 horas
await convex.query(api.asaas.mutations.getApiUsageStats, { hours: 24 });
```

## 🚨 Resposta a Incidentes

**Em caso de suspeita de vazamento da API Key:**
1. Imediatamente revogue a chave no painel do Asaas.
2. Gere uma nova chave.
3. Atualize a variável de ambiente no Convex.
4. Analise os logs em `asaasApiAudit` para identificar acessos não autorizados ou suspeitos.
