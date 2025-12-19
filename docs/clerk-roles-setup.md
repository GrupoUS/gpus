# Configuração de Roles e Permissões no Clerk

## Status da Configuração

✅ **Concluído:**
- Permissões customizadas criadas no Clerk (9 permissões)
- Roles customizadas criadas e atualizadas (org:sdr, org:cs, org:support)
- Permissões associadas corretamente às roles
- Código de autenticação atualizado para converter formato de permissões

## Permissões Configuradas

Todas as permissões seguem o formato `org:resource_action:resource_action` conforme exigido pelo Clerk:

- `org:leads_read:leads_read` - Visualizar leads
- `org:leads_write:leads_write` - Criar/editar leads
- `org:conversations_read:conversations_read` - Visualizar conversas
- `org:conversations_write:conversations_write` - Enviar mensagens
- `org:students_read:students_read` - Visualizar alunos
- `org:students_write:students_write` - Editar alunos
- `org:tickets_read:tickets_read` - Visualizar tickets
- `org:tickets_write:tickets_write` - Gerenciar tickets
- `org:reports_read:reports_read` - Visualizar relatórios

## Roles Configuradas

### org:sdr (SDR - Vendas)
**Permissões:**
- leads_read
- leads_write
- conversations_read
- conversations_write
- students_read

### org:cs (Customer Success)
**Permissões:**
- students_read
- students_write
- conversations_read
- conversations_write
- reports_read

### org:support (Suporte)
**Permissões:**
- conversations_read
- conversations_write
- tickets_read
- tickets_write
- students_read

## Próximo Passo: Configurar JWT Template

⚠️ **AÇÃO NECESSÁRIA:** Configure o JWT Template no Clerk Dashboard para incluir `org_permissions` nos tokens.

### Instruções:

1. Acesse o [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecione seu aplicativo
3. Vá em **JWT Templates** → **convex** (ou crie um novo template chamado "convex")
4. Adicione os seguintes claims customizados:

```json
{
  "org_id": "{{org.id}}",
  "org_role": "{{org.role}}",
  "org_slug": "{{org.slug}}",
  "org_permissions": "{{org.permissions}}"
}
```

5. Salve o template

### Verificação

Após configurar o JWT template, teste com um usuário:

```javascript
// No console do navegador após login
const session = await window.Clerk.session;
const token = await session.getToken({ template: 'convex' });
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('org_permissions:', decoded.org_permissions);
// Deve mostrar array com as permissões da role do usuário
```

## Mapeamento de Formato

O código em `convex/lib/auth.ts` converte automaticamente entre os formatos:

- **Código usa:** `leads:read`, `conversations:write`, etc.
- **Clerk retorna:** `org:leads_read:leads_read`, `org:conversations_write:conversations_write`, etc.

A função `toClerkPermissionFormat()` faz essa conversão automaticamente.

## Script de Setup

O script `scripts/setup-clerk-roles.ts` pode ser executado novamente para atualizar as configurações:

```bash
bun run scripts/setup-clerk-roles.ts
```

Ele detecta automaticamente permissões e roles existentes e apenas atualiza as permissões das roles se necessário.

## Organização

- **Organization ID:** `org_3744yWknE4NtI6EtvJqYT8h0MLN`
- **Instance:** `apparent-oryx-57.clerk.accounts.dev`

