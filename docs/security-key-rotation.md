# Política de Rotação de Chaves de Segurança

Este documento descreve a política de rotação de chaves e secrets para o Portal Grupo US, em conformidade com as melhores práticas de segurança e requisitos da LGPD.

---

## Inventário de Chaves

### Chaves Críticas (Rotação Obrigatória)

| Chave | Tipo | Localização | Criticidade |
|-------|------|-------------|-------------|
| `ENCRYPTION_KEY` | Criptografia LGPD | Railway + Convex | 🔴 Crítica |
| `CLERK_SECRET_KEY` | Autenticação Backend | Railway | 🔴 Crítica |
| `CONVEX_DEPLOYMENT` | Deploy Token | Railway + Local | 🟠 Alta |

### Chaves de Serviço (Rotação Recomendada)

| Chave | Tipo | Localização | Criticidade |
|-------|------|-------------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Autenticação Frontend | Railway + Local | 🟡 Média |
| `VITE_CONVEX_URL` | URL Backend | Railway + Local | 🟢 Baixa |
| `SENTRY_DSN` | Monitoramento | Railway | 🟢 Baixa |

---

## Cronograma de Rotação

### Rotação Regular

| Frequência | Chaves | Justificativa |
|------------|--------|---------------|
| **90 dias** | `ENCRYPTION_KEY` | Conformidade LGPD, proteção de dados pessoais |
| **90 dias** | `CLERK_SECRET_KEY` | Segurança de autenticação |
| **180 dias** | `CONVEX_DEPLOYMENT` | Segurança de infraestrutura |
| **Anual** | Chaves de monitoramento | Baixo risco |

### Rotação Imediata (Emergência)

Rodar imediatamente se:
- Suspeita de comprometimento
- Funcionário com acesso sai da empresa
- Chave exposta em logs/código
- Incidente de segurança detectado

---

## Procedimentos de Rotação

### 1. ENCRYPTION_KEY (Criptografia LGPD)

> ⚠️ **CRÍTICO**: Esta chave protege dados pessoais de alunos (CPF, email, telefone).

#### Pré-requisitos
- Backup do banco de dados Convex
- Janela de manutenção agendada (baixo tráfego)
- Acesso ao Railway Dashboard

#### Passos

```bash
# 1. Gerar nova chave (32+ caracteres)
openssl rand -hex 32

# 2. Atualizar no Railway
railway variables set ENCRYPTION_KEY=nova_chave_gerada

# 3. Executar migração de re-criptografia (se aplicável)
bunx convex run internal.lgpd.reEncryptAllData

# 4. Verificar integridade
bunx convex run api.leads.list  # Deve retornar dados decriptados
```

#### Rollback
```bash
# Em caso de falha, reverter para chave anterior
railway variables set ENCRYPTION_KEY=chave_anterior
```

---

### 2. CLERK_SECRET_KEY (Autenticação)

#### Passos

1. **Gerar nova chave no Clerk Dashboard**
   - Acesse: https://dashboard.clerk.com → API Keys
   - Clique em "Roll Secret Key"
   - Copie a nova `sk_live_...` ou `sk_test_...`

2. **Atualizar no Railway**
   ```bash
   railway variables set CLERK_SECRET_KEY=nova_chave_clerk
   ```

3. **Verificar autenticação**
   - Acesse a aplicação em produção
   - Faça login com um usuário de teste
   - Verifique logs do Convex para erros de auth

#### Impacto
- Sessões ativas continuam funcionando
- Novas autenticações usam nova chave
- Zero downtime esperado

---

### 3. CONVEX_DEPLOYMENT (Deploy Token)

#### Passos

1. **Obter novo token no Convex Dashboard**
   - Acesse: https://dashboard.convex.dev
   - Settings → Deploy Keys → Generate New

2. **Atualizar localmente**
   ```bash
   # .env.local
   CONVEX_DEPLOYMENT=dev:novo_deployment_id
   ```

3. **Atualizar no Railway**
   ```bash
   railway variables set CONVEX_DEPLOYMENT=prod:novo_deployment_id
   ```

4. **Testar deploy**
   ```bash
   bunx convex deploy
   ```

---

## Checklist de Rotação

Use este checklist ao rotacionar qualquer chave:

- [ ] Backup do estado atual (screenshot das variáveis)
- [ ] Nova chave gerada com entropia adequada
- [ ] Chave atualizada em todos os ambientes (local, staging, prod)
- [ ] Testes de integração executados
- [ ] Logs verificados para erros
- [ ] Documentação atualizada (se necessário)
- [ ] Incidente registrado (se rotação de emergência)

---

## Monitoramento Pós-Rotação

### Verificações Imediatas (0-1h)

```bash
# Verificar build
bun run build

# Verificar conexão Convex
bunx convex dev --once

# Verificar autenticação (manual)
# Acessar https://gpus-production.up.railway.app e fazer login
```

### Verificações de Acompanhamento (24-48h)

- [ ] Monitorar Sentry para novos erros
- [ ] Verificar logs do Railway para falhas de autenticação
- [ ] Confirmar que operações de CRUD funcionam
- [ ] Validar criptografia/decriptografia de dados LGPD

---

## Armazenamento Seguro

### Onde as Chaves Devem Estar

| Ambiente | Local | Acesso |
|----------|-------|--------|
| **Produção** | Railway Environment Variables | Admin apenas |
| **Desenvolvimento** | `.env.local` (gitignored) | Desenvolvedores |
| **Backup** | Password Manager (1Password/Bitwarden) | Admin apenas |
| **CI/CD** | GitHub Secrets | Repository Admin |

### Onde as Chaves NUNCA Devem Estar

- ❌ Código fonte (mesmo em branches privadas)
- ❌ Logs de aplicação
- ❌ Mensagens de commit
- ❌ Issues/PRs do GitHub
- ❌ Slack/Discord/Email
- ❌ Arquivos não-gitignored

---

## Conformidade LGPD

### Requisitos de Proteção

A `ENCRYPTION_KEY` é usada para criptografar:
- CPF de alunos
- Emails pessoais
- Números de telefone
- Endereços

### Auditoria

Manter registro de:
- Data da última rotação
- Motivo da rotação
- Responsável pela rotação
- Verificações realizadas

### Template de Registro

```markdown
## Rotação de Chave - [DATA]

- **Chave**: ENCRYPTION_KEY
- **Motivo**: Rotação regular (90 dias)
- **Responsável**: [Nome]
- **Verificações**:
  - [x] Dados decriptografam corretamente
  - [x] Novos registros criptografam corretamente
  - [x] Logs não contêm dados sensíveis
- **Próxima rotação**: [DATA + 90 dias]
```

---

## Contatos de Emergência

Em caso de comprometimento de chaves:

1. **Rotação imediata** de todas as chaves afetadas
2. **Notificar** responsável de segurança
3. **Revisar** logs de acesso das últimas 24-48h
4. **Documentar** incidente para compliance LGPD

---

## Histórico de Revisões

| Data | Versão | Alteração | Autor |
|------|--------|-----------|-------|
| 2024-12-17 | 1.0 | Documento inicial | Sistema |

---

*Este documento deve ser revisado trimestralmente ou após qualquer incidente de segurança.*
