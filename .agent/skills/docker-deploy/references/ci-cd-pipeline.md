# CI/CD Pipeline

## Pipeline Architecture

```
git push main
  ↓
GitHub Actions (deploy.yml)
  ├── 1. Checkout
  ├── 2. Setup Bun 1.3.9
  ├── 3. bun install --frozen-lockfile
  ├── 4. bun run check (TypeScript)
  ├── 5. bun run build
  ├── 6. bun run test
  ├── 7. Docker login to GHCR
  ├── 8. Docker buildx setup
  ├── 9. Build & push image → ghcr.io/grupous/neondash:latest + :sha
  └── 10. SSH deploy to VPS (docker pull + restart)
  ↓
Hostinger VPS pulls new image and restarts
```

## Current Workflow (`.github/workflows/deploy.yml`)

The existing workflow already handles steps 1-10, including SSH auto-deploy to VPS.

## Auto-Deploy to Hostinger VPS (Implemented)

### Option A: SSH Deploy Step (Recommended)

Reference deploy step (already implemented in workflow):

```yaml
      - name: Deploy to VPS
        if: success()
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/neondash
            export DOCKER_IMAGE=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            docker compose -f docker-compose.deploy.yml pull
            docker compose -f docker-compose.deploy.yml up -d
            docker image prune -f
            APP_CID=$(docker compose -f docker-compose.deploy.yml ps -q app)
            [ -n "$APP_CID" ] || { echo "app container not found"; docker compose -f docker-compose.deploy.yml ps; exit 1; }
            for i in $(seq 1 9); do
              status=$(docker inspect "$APP_CID" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}')
              echo "health=$status"
              [ "$status" = "healthy" ] && break
              sleep 10
            done
            [ "$status" = "healthy" ] || { docker compose -f docker-compose.deploy.yml logs app --tail 100; exit 1; }
            docker exec "$APP_CID" wget -qO- http://127.0.0.1:3000/health/live
            docker exec "$APP_CID" wget -qO- http://127.0.0.1:3000/health/ready
```

### Option B: Webhook-Triggered Deploy

Set up a webhook on VPS that GitHub calls after push:

1. Install a lightweight webhook server on VPS (e.g., `adnanh/webhook`)
2. Configure GitHub webhook to POST to `https://vps-ip:9000/hooks/deploy`
3. Hook script pulls latest image and restarts

**Option A is simpler and recommended.**

## Required GitHub Secrets

| Secret | Value | Purpose |
|---|---|---|
| `VPS_HOST` | `31.97.170.4` | Hostinger VPS IP |
| `VPS_USERNAME` | `root` | SSH user |
| `VPS_SSH_KEY` | (private key) | SSH authentication |
| `VITE_CLERK_PUBLISHABLE_KEY` | (value) | Vite build arg |
| `VITE_META_APP_ID` | (value) | Vite build arg |
| `VITE_META_CONFIG_ID` | (value) | Vite build arg |

## VPS Prerequisites (Must Complete Before First Deploy)

> **CRITICAL**: The deploy SSH key public half must be in VPS `~/.ssh/authorized_keys` **before** the CI/CD pipeline reaches the deploy step. Generate the key locally, set the private key as `VPS_SSH_KEY` in GitHub Secrets, and add the public key to the VPS manually via your existing SSH session.

```bash
# 1. Generate deploy key locally
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /tmp/neondash_deploy -N ""

# 2. Set private key as GitHub secret
gh secret set VPS_SSH_KEY --repo GrupoUS/neondash < /tmp/neondash_deploy

# 3. Copy public key to VPS (via existing SSH session)
cat /tmp/neondash_deploy.pub
# Then on VPS: echo '<public-key>' >> /root/.ssh/authorized_keys

# 4. Ensure /opt/neondash exists on VPS with docker-compose.deploy.yml
ssh root@vps.gpus.me "mkdir -p /opt/neondash"
# Copy docker-compose.deploy.yml and .env to /opt/neondash
```

## VPS Setup Prerequisites

```bash
# On the VPS (one-time setup)

# 1. Create app directory
mkdir -p /opt/neondash

# 2. Copy docker-compose.deploy.yml
scp docker-compose.deploy.yml root@VPS_IP:/opt/neondash/

# 3. Create .env file with secrets (or use Docker Manager)
# All env vars listed in docker-compose.deploy.yml must be set

# 4. Login to GHCR (if private image)
docker login ghcr.io -u USERNAME -p GITHUB_PAT

# 5. Verify easypanel network exists (Traefik ingress)
# NOTE: Do NOT create 'ingress' — it's a non-attachable swarm overlay.
# EasyPanel creates the 'easypanel' network that Traefik uses.
docker network ls | grep easypanel

# 6. Pull and start
cd /opt/neondash
docker compose -f docker-compose.deploy.yml up -d
```

> For SSH key setup and VPS operations, see [vps-ssh-management.md](vps-ssh-management.md).

## Staging Pipeline

Same flow as production, different branch, image, and VPS directory:

| Setting | Production | Staging |
|---|---|---|
| Branch | `main` | `dev-test` |
| Image | `grupous/neondash` | `grupous/neondash-staging` |
| Workflow | `deploy.yml` | `deploy-staging.yml` |
| VPS deploy dir | `/opt/neondash` | `/opt/neondash-staging` |
| Domain | `neondash.com.br` | `staging.neondash.com.br` |
| Traefik router | `neondash` | `neondash-staging` |

Both pipelines share the same VPS SSH secrets and `easypanel` Traefik network but have fully isolated compose projects, volumes, and router names.

## Complete Deploy Workflow with SSH Step

```yaml
name: CI/CD — Production

on:
  push:
    branches: ["main"]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: grupous/neondash
  NODE_OPTIONS: --max-old-space-size=4096

jobs:
  build-test-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.9

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Type Check
        run: bun run check

      - name: Build
        run: bun run build

      - name: Test
        run: bun run test

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          build-args: |
            VITE_CLERK_PUBLISHABLE_KEY=${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
            VITE_META_APP_ID=${{ secrets.VITE_META_APP_ID }}
            VITE_META_CONFIG_ID=${{ secrets.VITE_META_CONFIG_ID }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Make GHCR package public
        continue-on-error: true
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh api --method PUT \
            /orgs/GrupoUS/packages/container/neondash/visibility \
            --field visibility=public 2>/dev/null || true

      - name: Deploy to VPS
        if: success()
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/neondash
            export DOCKER_IMAGE=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            docker compose -f docker-compose.deploy.yml pull
            docker compose -f docker-compose.deploy.yml up -d
            docker image prune -f
            APP_CID=$(docker compose -f docker-compose.deploy.yml ps -q app)
            [ -n "$APP_CID" ] || { echo "app container not found"; docker compose -f docker-compose.deploy.yml ps; exit 1; }
            for i in $(seq 1 9); do
              status=$(docker inspect "$APP_CID" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}')
              echo "health=$status"
              [ "$status" = "healthy" ] && break
              sleep 10
            done
            [ "$status" = "healthy" ] || { docker compose -f docker-compose.deploy.yml logs app --tail 100; exit 1; }
            docker exec "$APP_CID" wget -qO- http://127.0.0.1:3000/health/live
            docker exec "$APP_CID" wget -qO- http://127.0.0.1:3000/health/ready
```

## Post-Deploy Checklist (SSH)

```bash
cd /opt/neondash
docker compose -f docker-compose.deploy.yml ps
APP_CID=$(docker compose -f docker-compose.deploy.yml ps -q app)
docker inspect "$APP_CID" --format '{{.State.Health.Status}}'
docker exec "$APP_CID" wget -qO- http://127.0.0.1:3000/health/live
docker exec "$APP_CID" wget -qO- http://127.0.0.1:3000/health/ready
```

## Rollback

```bash
# Deploy specific commit
docker compose -f docker-compose.deploy.yml pull app
DOCKER_IMAGE=ghcr.io/grupous/neondash:<commit-sha> \
  docker compose -f docker-compose.deploy.yml up -d app

# Or revert git commit and re-push
git revert <commit>
git push origin main
```
