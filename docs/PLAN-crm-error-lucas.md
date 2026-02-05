# PLAN-crm-error-lucas: Erro na Página do CRM para Usuário Lucas

> **Goal:** Diagnosticar e resolver o erro "Algo deu errado!" que aparece para o usuário Lucas ao acessar a página do CRM.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | A página CRM (`/crm`) chama `listLeads` que requer `PERMISSIONS.LEADS_READ` | 5/5 | [leads.ts](file:///home/mauricio/gpus/convex/leads.ts#L117) | Alto - query falha se usuário não tem permissão |
| 2 | Apenas roles `admin`, `owner`, e `sdr` possuem `leads:read` | 5/5 | [permissions.ts](file:///home/mauricio/gpus/convex/lib/permissions.ts#L42-L78) | Alto - outras roles não podem acessar CRM |
| 3 | Roles `manager`, `member`, `cs`, `support` NÃO têm permissão de leads | 5/5 | [permissions.ts](file:///home/mauricio/gpus/convex/lib/permissions.ts#L45-L77) | Alto - causa do erro |
| 4 | Erro "Algo deu errado!" vem do TanStack Router (error boundary padrão) | 4/5 | Análise de código | Médio - UX ruim, não mostra mensagem detalhada |
| 5 | `requirePermission` lança erro específico com mensagem detalhada | 5/5 | [auth.ts](file:///home/mauricio/gpus/convex/lib/auth.ts#L204-L222) | Médio - mensagem existe mas não é exibida |
| 6 | Usuário pode não estar sincronizado no banco Convex | 3/5 | [auth.ts](file:///home/mauricio/gpus/convex/lib/auth.ts#L213-L214) | Alto - causa possível do erro |

### Knowledge Gaps & Assumptions
- **Gap:** Não sabemos qual é a role atual do usuário Lucas no Clerk/Convex
- **Gap:** Não sabemos se Lucas existe no banco `users` do Convex
- **Assumption:** Lucas está logado corretamente no Clerk (screenshot mostra página autenticada)
- **Assumption:** O erro vem da query `listLeads` e não do sync do usuário

---

## 1. User Review Required (Se Aplicável)

> [!IMPORTANT]
> **Precisamos verificar o estado do usuário Lucas:**
> 1. Qual é o email/clerkId do usuário Lucas?
> 2. Qual role ele deveria ter? (admin, sdr, manager, etc.)
> 3. Lucas faz parte de alguma organização no Clerk?

---

## 2. Diagnóstico (Passos Imediatos)

### Verificar Estado do Usuário no Convex

Para diagnosticar, execute no Convex Dashboard (`bunx convex dashboard`):

```javascript
// Query no Convex Dashboard > Data > users
// Procurar por usuário com nome "Lucas" ou email contendo "lucas"
```

**OU** use a query `checkRoleSync` se você for admin:
```typescript
// No frontend como admin, chamar:
api.users.checkRoleSync
```

---

## 3. Possíveis Soluções

### Solução A: Atribuir Role Correta ao Lucas (Mais Provável)

Se Lucas deveria ter acesso ao CRM, ele precisa ter role `sdr` ou `admin`:

**Opção 1 - Via Convex Dashboard:**
1. Acesse `bunx convex dashboard`
2. Navegue para tabela `users`
3. Encontre Lucas pelo email
4. Edite o campo `role` para `sdr` ou `admin`

**Opção 2 - Via Código (Mutation):**
```typescript
// Como admin, executar:
await updateUser({
  userId: "id_do_lucas",
  patch: { role: "sdr" }
});
```

### Solução B: Adicionar `leads:read` à Role do Lucas

Se Lucas tem uma role específica (ex: `manager`) e deveria manter essa role mas ter acesso a leads:

**Arquivo:** [permissions.ts](file:///home/mauricio/gpus/convex/lib/permissions.ts)

```diff
 manager: [
   PERMISSIONS.STUDENTS_READ,
   PERMISSIONS.CONVERSATIONS_READ,
   PERMISSIONS.REPORTS_READ,
   PERMISSIONS.TEAM_READ,
+  PERMISSIONS.LEADS_READ, // Adicionar se managers devem ver leads
   'manage:content',
 ],
```

### Solução C: Usuário Não Sincronizado

Se Lucas não existe na tabela `users` do Convex:

1. Pedir para Lucas fazer logout e login novamente
2. O hook `useUserSync` irá criar o registro automaticamente
3. Após sync, ajustar a role conforme necessário

---

## 4. Melhoria de UX (Opcional)

O erro atual mostra apenas "Algo deu errado!" sem contexto. Podemos melhorar:

### [MODIFY] [crm.tsx](file:///home/mauricio/gpus/src/routes/_authenticated/crm.tsx)

Adicionar tratamento de erro amigável para o caso de falta de permissão:

```typescript
// Adicionar errorComponent ao Route
export const Route = createFileRoute('/_authenticated/crm')({
  validateSearch: z.object({...}),
  component: CRMPage,
  errorComponent: ({ error }) => (
    <div className="flex h-screen items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Você não tem permissão para acessar o CRM.</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message}
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
```

---

## 5. Verification Plan

### Manual Verification
1. **Identificar Lucas:** Verificar no Convex Dashboard qual é o registro do usuário Lucas
2. **Verificar Role:** Confirmar qual role ele tem atualmente
3. **Aplicar Fix:** Ajustar role ou permissões conforme decisão
4. **Testar:** Pedir para Lucas acessar `/crm` novamente

### Comandos de Verificação
```bash
# Abrir dashboard do Convex
bunx convex dashboard

# Verificar se há erros no build
bun run check
```

---

## 6. Rollback Plan

- Se a solução for mudar a role do Lucas, basta reverter para a role anterior no Convex Dashboard
- Se a solução for modificar `permissions.ts`, reverter o commit com `git checkout`

---

## Próximos Passos

1. **Confirmar** qual é o email/clerkId do usuário Lucas
2. **Verificar** no Convex Dashboard se ele existe e qual role tem
3. **Decidir** se Lucas deve ter role `sdr`/`admin` ou se a role dele precisa de novas permissões
4. **Aplicar** a solução escolhida
5. **Testar** acesso ao CRM
