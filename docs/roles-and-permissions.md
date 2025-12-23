# Funções e Permissões do Sistema

Este documento descreve o sistema de controle de acesso (RBAC) do AegisWallet CRM, incluindo roles, permissões e como verificar acesso no código.

## Tabela de Roles e Permissões

| Permissão | Admin (`org:admin`) | SDR (`org:sdr`) | CS (`org:cs`) | Support (`org:support`) |
|-----------|:---:|:---:|:---:|:---:|
| `all` | ✅ | | | |
| `leads_read` | ✅ | ✅ | | |
| `leads_write` | ✅ | ✅ | | |
| `conversations_read` | ✅ | ✅ | ✅ | ✅ |
| `conversations_write` | ✅ | ✅ | ✅ | ✅ |
| `students_read` | ✅ | ✅ | ✅ | ✅ |
| `students_write` | ✅ | | ✅ | |
| `tickets_read` | ✅ | | | ✅ |
| `tickets_write` | ✅ | | | ✅ |
| `reports_read` | ✅ | | ✅ | |

## Como Criar no Clerk (Atenção aos Nomes)

Ao criar a feature/permissão no Clerk Dashboard:
1. **Name**: Use um nome legível (ex: `Leads Read`, `Leads Write`). **Não use dois pontos (:).**
2. **Key**: Use exatamente as strings acima (ex: `leads_read`).

## Como Atribuir Roles (Clerk Dashboard)

1. Acesse o **Clerk Dashboard** > **Organizations**.
2. Selecione a organização.
3. Vá em **Members**.
4. Clique no menu de três pontos ao lado do usuário > **Change Role**.
5. Selecione a role apropriada (`Admin`, `SDR`, `Customer Success`, `Support`).

## Como Verificar Permissões no Código

Utilize as funções auxiliares em `convex/lib/auth.ts`:

### 1. `hasPermission`
Verifica se o usuário tem uma permissão específica. Retorna `true` ou `false`.

```typescript
import { hasPermission } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'

// Em uma Query ou Mutation
if (await hasPermission(ctx, PERMISSIONS.LEADS_WRITE)) {
  // Executar ação crítica
}
```

### 2. `requirePermission`
Lança um erro se o usuário não tiver a permissão.

```typescript
import { requirePermission } from './lib/auth'
import { PERMISSIONS } from './lib/permissions'

export const createLead = mutation({
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.LEADS_WRITE)
    // ... código ...
  }
})
```

### 3. Middleware de Segurança
Adicione `requiredPermissions` ao `withSecurity`.

```typescript
export const sensitiveAction = mutation(withSecurity(
  async (ctx, args) => {
    // ...
  },
  { requiredPermissions: [PERMISSIONS.REPORTS_READ] }
))
```

## Debug de Sincronização

Para verificar se as roles do Clerk estão sincronizadas com o banco de dados, execute a query de diagnóstico:

`convex/users.ts:checkRoleSync`

Isso listará todos os usuários e, para o admin executando a query, mostrará as permissões presentes no token JWT atual.
