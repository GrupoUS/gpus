# Implementação Solicitada: API Keys por Organização + Configuração de Importação Asaas

## Requisitos

1. **API Keys por organização (multi-tenant)**
   - Cada organização pode ter múltiplas chaves do Asaas
   - Suportar ambientes production/sandbox
   - Criptografia LGPD para apiKey e webhookSecret
   - Apenas uma chave ativa por vez
   - Labels para identificar as chaves (ex: "Produção", "Sandbox")

2. **Seção de configuração de importação Asaas**
   - Adicionar controles de configuração na página de configurações
   - Gerenciar sync automático de clientes e pagamentos
   - Configurar intervalos e filtros

## Estrutura de Implementação

### Backend (Convex)

#### 1. Schema: Tabela `organizationAsaasApiKeys`
```typescript
organizationAsaasApiKeys: defineTable({
  organizationId: v.string(),
  apiKey: v.string(), // Criptografada (LGPD)
  baseUrl: v.optional(v.string()),
  environment: v.union(v.literal('production'), v.literal('sandbox')),
  webhookSecret: v.optional(v.string()), // Criptografado (LGPD)
  isActive: v.boolean(),
  label: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_organization', ['organizationId'])
  .index('by_organization_active', ['organizationId', 'isActive'])
  .index('by_active', ['isActive'])
```

#### 2. Queries (convex/asaas/organization-keys.ts)
- `getActiveOrganizationAsaasKey` - Busca chave ativa da organização
- `listOrganizationAsaasKeys` - Lista todas as chaves (admin)
- `getAsaasSyncConfig` - Busca configuração de sync

#### 3. Mutations (convex/asaas/organization-keys.ts)
- `createOrganizationAsaasKey` - Criar nova chave (admin)
- `updateOrganizationAsaasKey` - Atualizar chave existente
- `deleteOrganizationAsaasKey` - Deletar chave
- `updateAsaasSyncConfig` - Atualizar config de sync

### Frontend

#### 1. Hook Personalizado (src/hooks/useOrganizationAsaasKeys.ts)
```typescript
interface UseOrganizationAsaasKeys {
  getActiveKey: () => Promise<{ apiKey, baseUrl, environment, webhookSecret, label } | null>
  listKeys: () => Promise<KeyWithMask[]>
  createKey: (data: CreateKeyData) => Promise<void>
  updateKey: (keyId, data) => Promise<void>
  deleteKey: (keyId) => Promise<void>
  testConnection: (baseUrl, apiKey) => Promise<TestResult>
}
```

#### 2. Componentes UI

**src/components/asaas/organization-keys-manager.tsx**
- Lista de chaves existentes
- Formulário para adicionar/editar chaves
- Botões de ativar/desativar
- Teste de conexão
- Indicador de chave ativa

**src/components/asaas/asaas-import-config.tsx**
- Toggle para sync automático
- Configuração de intervalo (1-24h)
- Opções de filtros (data, status)
- Botão para sync manual

#### 3. Atualizar Página de Configurações
**src/routes/_authenticated/settings/integrations.tsx**
- Adicionar seção "Configurações do Asaas por Organização"
- Inserir o `OrganizationAsaasKeysManager`
- Inserir o `AsaasImportConfig`

### Actions Integration

#### Atualizar `convex/asaas/actions.ts` (getAsaasClientFromSettings)
```typescript
export const getAsaasClientFromSettings = action({
  args: {},
  handler: async (ctx) => {
    // Get organization ID
    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.runQuery(api.users.getByClerkId, { clerkId: identity.subject });

    if (!user?.organizationId) {
      // Fallback to env variable or settings table
      const apiKey = process.env.ASAAS_API_KEY;
      const baseUrl = process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3';

      if (!apiKey) {
        throw new Error('ASAAS_API_KEY not configured');
      }

      return createAsaasClient(apiKey, baseUrl);
    }

    // Get active key from organizationAsaasApiKeys
    const activeKeyData = await ctx.runQuery(
      internal.asaas.organizationKeys.getActiveOrganizationAsaasKey,
      {}
    );

    if (!activeKeyData?.apiKey) {
      throw new Error('Nenhuma chave Asaas ativa para esta organização');
    }

    return createAsaasClient(
      activeKeyData.apiKey,
      activeKeyData.baseUrl || 'https://api.asaas.com/v3'
    );
  },
});
```

## Fluxo de Uso

### Para Administradores
1. Acessar configurações → integrações
2. Ver seção "Configurações do Asaas por Organização"
3. Clicar em "Adicionar Nova Chave"
4. Preencher:
   - Label (ex: "Produção - Organização A")
   - URL Base
   - API Key
   - Ambiente (Production/Sandbox)
   - Webhook Secret (opcional)
5. Salvar - chave é criptografada e salva
6. Marcar como "Ativa" para começar a usar

### Para Sync Automático
1. Configurar sync automático na seção "Importação do Asaas"
2. Definir intervalo (ex: 1h, 6h, 24h)
3. Ativar/desativar sync
4. Ver histórico de sync em logs existentes

## Notas Técnicas

### LGPD Compliance
- `apiKey` e `webhookSecret` são criptografados com AES-256-GCM
- Usar `encrypt()` e `decrypt()` de `convex/lib/encryption.ts`
- Logs de acesso em `asaasApiAudit` para rastreabilidade

### Permissões
- Apenas admins podem criar/atualizar/deletar chaves
- Check `PERMISSIONS.ALL` para admins
- Usuários com `PERMISSIONS.STUDENTS_WRITE` podem usar chaves ativas

### Criptografia de Valores
```typescript
// Criptografar antes de salvar
const encryptedApiKey = await encrypt(args.apiKey);
const encryptedWebhookSecret = args.webhookSecret ? await encrypt(args.webhookSecret) : null;

// Decriptografar ao usar
const apiKey = await decrypt(activeKey.apiKey);
const webhookSecret = activeKey.webhookSecret ? await decrypt(activeKey.webhookSecret) : null;
```

## Arquivos a Criar/Modificar

### Backend (Convex)
1. ✏️ `convex/schema.ts` - Adicionar tabela `organizationAsaasApiKeys`
2. 📄 `convex/asaas/organization-keys.ts` - NOVO (queries + mutations)
3. 🔧 `convex/asaas/actions.ts` - MODIFICAR (getAsaasClientFromSettings)
4. 📋 `convex/asaas/sync.ts` - Verificar se já tem getAsaasSyncConfig

### Frontend
1. 🎣 `src/hooks/useOrganizationAsaasKeys.ts` - NOVO
2. 🧩 `src/components/asaas/organization-keys-manager.tsx` - NOVO
3. ⚙️ `src/components/asaas/asaas-import-config.tsx` - NOVO
4. 📝 `src/routes/_authenticated/settings/integrations.tsx` - MODIFICAR

## Prioridade de Implementação

### Alta Prioridade (MVP)
1. ✅ Schema `organizationAsaasApiKeys`
2. ✅ Queries básicas (getActive, list)
3. ✅ Mutations básicas (create, update, delete)
4. ✅ Atualizar `getAsaasClientFromSettings` para usar chave por organização
5. ✅ Hook `useOrganizationAsaasKeys`
6. ✅ UI `OrganizationAsaasKeysManager`
7. ✅ Seção de configuração na página settings

### Média Prioridade
1. Webhook configuration por organização
2. Histórico de uso de API keys (logs)
3. Rotação automática por ambiente (production → prod, sandbox → sandbox)

### Baixa Prioridade
1. Dashboard de métricas por organização
2. Alertas de expiração de API keys
3. Integração com múltiplos gateways de pagamento

## Próximos Passos Sugeridos

1. **Testes**
   - Unit tests para mutations/queries
   - E2E tests para fluxo completo
   - Testar criptografia/decriptografia

2. **Deploy**
   - Deploy do schema com nova tabela
   - Deploy das novas mutations/queries
   - Deploy das mudanças no frontend

3. **Validação**
   - Testar com múltiplas organizações
   - Verificar isolamento de dados entre organizações
   - Validar permissões corretas

## Erros Conhecidos e Soluções

### Erro: Schema edit repetidamente falhou
**Causa:** Tenta modificar schema.ts complexo com múltiplas tabelas
**Solução:** Fazer edição única e precisa após entender a estrutura completa

### Erro: TypeScript errors em organization-keys.ts
**Causa:** Tipos não gerados corretamente
**Solução:** Verificar _generated/dataModel.ts após deploy do schema

---

## Resumo para Continuação

Este documento serve como guia para implementação. Para continuar:

1. Primeiro, adicionar tabela `organizationAsaasApiKeys` ao schema
2. Segundo, criar arquivo `convex/asaas/organization-keys.ts` com queries/mutations
3. Terceiro, atualizar `convex/asaas/actions.ts` (getAsaasClientFromSettings)
4. Quarto, criar `src/hooks/useOrganizationAsaasKeys.ts`
5. Quinto, criar componentes UI
6. Sexto, atualizar página de configurações

Ou, se preferir, posso continuar a implementação passo a passo. Qual abordagem você prefere?
