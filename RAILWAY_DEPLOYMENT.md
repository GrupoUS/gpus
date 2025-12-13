# Railway Deployment Guide

Este documento descreve como fazer deploy do frontend Vite + React no Railway com backend Convex separado.

## Package Manager

**⚠️ IMPORTANTE**: Este projeto usa **`bun`** como package manager. O Dockerfile está configurado para usar `bun` durante o build, não `npm` ou outros gerenciadores.

## Variáveis de Ambiente Necessárias

**IMPORTANTE**: Estas variáveis devem ser configuradas no Railway **ANTES** do primeiro deploy, pois são necessárias durante o build (build-time), não em runtime.

### Variáveis Obrigatórias

Configure as seguintes variáveis no dashboard do Railway:

1. **`VITE_CONVEX_URL`**
   - **Tipo**: Build-time (ARG)
   - **Descrição**: URL do deployment Convex
   - **Formato**: `https://xxx.convex.cloud`
   - **Como obter**: Execute `npx convex deploy` e copie a URL do deployment, ou encontre no dashboard do Convex
   - **Exemplo**: `https://happy-animal-123.convex.cloud`

2. **`VITE_CLERK_PUBLISHABLE_KEY`**
   - **Tipo**: Build-time (ARG)
   - **Descrição**: Chave pública do Clerk para autenticação
   - **Formato**: `pk_test_...` ou `pk_live_...`
   - **Como obter**: Dashboard do Clerk → API Keys → Publishable Key
   - **Exemplo**: `pk_test_abc123def456...`

### Como Configurar no Railway

1. Acesse o dashboard do Railway
2. Vá para o seu projeto
3. Clique em **Variables** (ou **Variáveis**)
4. Adicione cada variável:
   - **Name**: `VITE_CONVEX_URL`
   - **Value**: Sua URL do Convex
   - Repita para `VITE_CLERK_PUBLISHABLE_KEY`

**Nota**: Railway automaticamente disponibiliza essas variáveis como `ARG` durante o build do Dockerfile.

## Arquitetura de Deploy

```
┌─────────────────┐
│  Railway (Frontend) │
│  - Dockerfile    │
│  - Caddy Server  │
│  - dist/ files   │
└────────┬─────────┘
         │
         │ HTTP Requests
         │
┌────────▼─────────┐
│  Convex (Backend) │
│  - Deploy separado│
│  - npx convex deploy│
└───────────────────┘
```

## Processo de Deploy

### 1. Deploy do Backend Convex

```bash
# No diretório do projeto
npx convex deploy
```

Isso faz deploy do backend Convex e retorna a URL do deployment. Use essa URL como valor de `VITE_CONVEX_URL`.

### 2. Deploy do Frontend no Railway

O Railway detecta automaticamente o `Dockerfile` e faz o deploy:

1. **Build Stage**:
   - Instala dependências usando **bun** (package manager do projeto)
   - Recebe `VITE_CONVEX_URL` e `VITE_CLERK_PUBLISHABLE_KEY` como ARG
   - Executa `bun run build` → cria pasta `dist/`

2. **Serve Stage**:
   - Copia `dist/` e `Caddyfile` para container Caddy
   - Caddy inicia e serve arquivos na porta `$PORT` (fornecida pelo Railway)

### 3. Verificação

Após o deploy:
- Railway fornece uma URL pública (ex: `https://seu-app.up.railway.app`)
- Acesse a URL e verifique se o app carrega corretamente
- Verifique se a conexão com Convex está funcionando (check no console do navegador)

## Troubleshooting

### Erro: "Missing VITE_CLERK_PUBLISHABLE_KEY"

**Causa**: Variável não configurada no Railway ou não passada durante o build.

**Solução**:
1. Verifique se a variável está configurada no dashboard do Railway
2. Certifique-se de que o nome está exatamente como `VITE_CLERK_PUBLISHABLE_KEY`
3. Faça um novo deploy após adicionar a variável

### Erro: "Failed to connect to Convex"

**Causa**: `VITE_CONVEX_URL` incorreta ou backend não deployado.

**Solução**:
1. Verifique se o backend Convex foi deployado: `npx convex deploy`
2. Confirme que a URL em `VITE_CONVEX_URL` está correta
3. Verifique se o deployment Convex está ativo no dashboard do Convex

### Erro: "404 Not Found" em rotas do SPA

**Causa**: Caddyfile não configurado corretamente para SPA routing.

**Solução**:
- Verifique se o `Caddyfile` contém `try_files {path} /index.html`
- Isso garante que todas as rotas do TanStack Router funcionem corretamente

### Build falha no Railway

**Causa**: Variáveis de ambiente não disponíveis durante o build.

**Solução**:
1. Certifique-se de que as variáveis estão configuradas **antes** do deploy
2. Verifique os logs do build no Railway para ver erros específicos
3. Teste o build localmente: `docker build -t test . --build-arg VITE_CONVEX_URL=... --build-arg VITE_CLERK_PUBLISHABLE_KEY=...`

## Testando Localmente

Para testar o build localmente antes de fazer deploy:

```bash
# Build da imagem Docker (usa bun internamente)
docker build -t gpus-frontend \
  --build-arg VITE_CONVEX_URL=https://seu-deployment.convex.cloud \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... \
  .

# Executar container
docker run -p 3000:3000 -e PORT=3000 gpus-frontend

# Acessar em http://localhost:3000
```

**Nota**: O Dockerfile usa a imagem oficial `oven/bun:1-alpine` e executa `bun install` e `bun run build` durante o build. Isso garante consistência com o ambiente de desenvolvimento local.

## Referências

- [Railway React Guide](https://docs.railway.com/guides/react)
- [Vite Production Build](https://vite.dev/guide/build)
- [Convex Deployment URLs](https://docs.convex.dev/client/react/deployment-urls)
- [Caddy Documentation](https://caddyserver.com/docs/)

