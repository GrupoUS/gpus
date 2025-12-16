---
description: Pipeline completo de QA + Deploy com monitoramento e fix automático
agent: code-reviewer
---

Execute pipeline completo de QA e deploy para: $ARGUMENTS

## Fase 1: Verificações Locais (GATE)

> ⚠️ **PARE IMEDIATAMENTE** se qualquer verificação falhar

### Linting
!`bun run lint:check`

### Build
!`bun run build`

### Testes
!`bun run test`

---

## Fase 2: Deploy Backend (Convex)

### 2.1 Deploy das funções e schema
!`bunx convex deploy`

### 2.2 Verificar status
!`bunx convex deployments list`

### 2.3 Monitorar logs por erros
!`bunx convex logs --prod --limit 100`

### 2.4 Testar funções críticas
```bash
bunx convex run --prod api.leads.list --args '{}'
bunx convex run --prod api.users.list --args '{}'
```

### Erros Comuns Convex

| Erro | Causa | Fix |
|------|-------|-----|
| Schema validation failed | Schema incompatível | Revisar `convex/schema.ts` |
| Function not found | Export faltando | Verificar exports em `convex/*.ts` |
| Type mismatch | Tipos incompatíveis | Corrigir validators |

---

## Fase 3: Deploy Frontend (Railway)

### 3.1 Push para trigger deploy
```bash
git add .
git commit -m "chore: deploy"
git push origin main
```

### 3.2 Monitorar deployment
!`railway status`

### 3.3 Verificar logs
!`railway logs --lines 100`

### 3.4 Filtrar erros
!`railway logs --lines 200 | grep -iE "error|failed|exception|warning"`

### 3.5 Verificar variáveis de ambiente
!`railway variables list`

### Erros Comuns Railway

| Erro | Causa | Fix |
|------|-------|-----|
| Build failed | Erro de build Vite/TS | Verificar `bun run build` local |
| Missing env var | Variável não configurada | `railway variables set KEY=value` |
| OOMKilled | Memória insuficiente | Otimizar bundle ou aumentar recursos |
| VITE_* undefined | Env var não disponível no build | Verificar ARG no Dockerfile |

---

## Fase 4: Health Checks Pós-Deploy

### Frontend
```bash
# Obter URL pública
PUBLIC_URL=$(railway status | grep -o 'https://[^[:space:]]*\.railway\.app')

# Testar resposta
curl -f "$PUBLIC_URL" && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"
```

### Backend
```bash
# Verificar deployment ativo
bunx convex deployments list | grep -i "active"

# Testar função
bunx convex run --prod api.leads.list --args '{}' && echo "✅ Backend OK"
```

---

## Fase 5: Consistência de Ambiente

### Variáveis Críticas

| Variável | Local (.env.local) | Railway |
|----------|-------------------|---------|
| `VITE_CONVEX_URL` | Deve corresponder ao deployment Convex ativo |
| `VITE_CLERK_PUBLISHABLE_KEY` | Mesmo valor em ambos |
| `CONVEX_DEPLOYMENT` | ID do deployment ativo |

### Sincronização Automática
```bash
# Obter URL do Convex atual
CONVEX_URL=$(bunx convex deployment info | grep -o 'https://[^[:space:]]*\.convex\.cloud')

# Atualizar Railway se necessário
railway variables set VITE_CONVEX_URL=$CONVEX_URL
```

---

## Fase 6: Validação E2E

Testar manualmente ou via Playwright:
- [ ] Autenticação (Clerk) funciona
- [ ] Dados carregam corretamente (Convex)
- [ ] Navegação entre rotas (TanStack Router)
- [ ] Console do browser sem erros

---

## Quality Gates

| Gate | Critério | Status |
|------|----------|--------|
| Lint | Zero erros | ⬜ |
| Types | Zero erros TypeScript | ⬜ |
| Tests | 100% passando | ⬜ |
| Build | Sucesso | ⬜ |
| Convex Deploy | Active | ⬜ |
| Convex Logs | Sem erros | ⬜ |
| Railway Deploy | Healthy | ⬜ |
| Railway Logs | Sem erros | ⬜ |
| Frontend HTTP | 200 OK | ⬜ |
| Backend Functions | Operacionais | ⬜ |
| Env Vars | Sincronizadas | ⬜ |
| Performance | <3s load inicial | ⬜ |

---

## Troubleshooting & Rollback

### Workflow de Fix de Erros

1. **Detectar**: Analisar logs com patterns de erro
2. **Diagnosticar**: Identificar causa raiz
3. **Pesquisar**: Buscar solução na documentação
4. **Corrigir**: Aplicar fix
5. **Validar**: Re-executar deploy e verificar logs
6. **Confirmar**: Health check passando

### Rollback Convex
```bash
# Listar deployments anteriores
bunx convex deployments list

# Reverter para deployment anterior (se disponível)
bunx convex deployment rollback
```

### Rollback Railway
```bash
# Ver histórico de deployments
railway deployments

# Rollback via git
git revert HEAD
git push origin main
```

---

## Checklist Final

- [ ] Lint passando (zero erros)
- [ ] Build passando (zero erros)
- [ ] Testes passando (100%)
- [ ] Convex deployment ativo
- [ ] Convex logs sem erros
- [ ] Railway deployment healthy
- [ ] Railway logs sem erros
- [ ] Frontend respondendo (HTTP 200)
- [ ] Backend funções operacionais
- [ ] Variáveis de ambiente sincronizadas
- [ ] E2E validação completa
