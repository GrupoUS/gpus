# Sincronização de Usuários (Clerk <-> Convex)

Este documento descreve o fluxo de sincronização automática de usuários entre o Clerk (Autenticação) e o Convex (Banco de Dados), implementado para resolver problemas de permissão no dashboard.

## O Problema
Anteriormente, usuários autenticados no Clerk podiam acessar a aplicação, mas se não tivessem um registro correspondente na tabela `users` do Convex, as queries falhavam com "Server Error" ou "Permissão Negada".

## A Solução
Implementamos uma estratégia de "Lazy Sync" (Sincronização sob demanda) que garante que o usuário exista no banco de dados assim que acessa a aplicação.

### Fluxo
1. **Frontend (`useUserSync.ts`)**:
   - Ao carregar a aplicação (`AuthenticatedLayout`), o hook `useUserSync` é executado.
   - Verifica se o usuário já existe no Convex (`api.users.current`).
   - Se não existir, chama a mutation `api.users.ensureUser`.

2. **Backend (`convex/users.ts`)**:
   - A mutation `ensureUser` recebe o token JWT do Clerk.
   - Verifica se já existe um usuário com aquele `subject` (Clerk ID).
   - Se não existir, CRIA um novo registro na tabela `users` com dados básicos (nome, email, avatar).
   - Atribui o role padrão `sdr` (ou baseado em claims se configurado).

3. **Fallback & Erros**:
   - Se a sincronização falhar, o usuário vê uma tela de erro amigável com opção de Retry.
   - As queries críticas (ex: `leads:recent`) possuem tratamento de erro para não quebrar a página inteira caso o usuário não esteja sincronizado.

## Migração de Usuários Legados
Para usuários que já existem no Clerk mas não no Convex, existe um script de migração:

**Arquivo:** `convex/migrations/syncExistingClerkUsers.ts`

### Como Rodar
Execute a action via dashboard do Convex ou CLI (requer `CLERK_SECRET_KEY` configurado no ambiente do Convex):

```bash
# Modo dry-run (apenas lista o que seria feito)
bunx convex run migrations/syncExistingClerkUsers:sync --dryRun true

# Executar migração real
bunx convex run migrations/syncExistingClerkUsers:sync
```

Argumentos opcionais:
- `dryRun: true`: Lista o que seria feito sem alterar o banco.

## Troubleshooting

**Erro: "Permissão negada" mesmo após login**
- Verifique se o usuário foi criado no Convex (Table `users`).
- Verifique o campo `isActive` do usuário.
- Peça para o usuário fazer Logout e Login novamente (força refresh do token e re-sync).

**Dashbord em Loop de Loading**
- Verifique se o serviço do Clerk está respondendo.
- Verifique os logs do navegador para erros de rede na chamada `ensureUser`.

**Como promover um usuário a Admin?**
Edite direto no Dashboard do Convex:
1. Vá para a tabela `users`
2. Encontre o usuário pelo email
3. Mude o campo `role` para `admin`
