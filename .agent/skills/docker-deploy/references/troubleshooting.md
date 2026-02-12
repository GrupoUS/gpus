# Troubleshooting

## Build Failures

### `bun install` fails in Docker

**Symptom:** `bun install --frozen-lockfile` errors during Docker build.

**Diagnosis:**
```bash
# Reproduce locally
docker build --no-cache -t test .
```

**Fixes:**
- Ensure `bun.lock` is committed and up-to-date
- Run `bun install` locally first, commit `bun.lock`
- Check `.dockerignore` isn't excluding `bun.lock`

### `bun run build` fails in Docker

**Symptom:** Build step fails with OOM or TypeScript errors.

**Diagnosis:**
```bash
# Check if build works locally
bun run build

# Check Docker memory limit
docker info | grep Memory
```

**Fixes:**
- Add `NODE_OPTIONS: --max-old-space-size=4096` to build stage
- Ensure all Vite build args are passed: `--build-arg VITE_CLERK_PUBLISHABLE_KEY=...`
- Run `bun run check` locally before pushing

### Image too large

**Symptom:** Image exceeds 150MB.

**Diagnosis:**
```bash
docker images neondash --format "{{.Size}}"
docker history neondash --no-trunc
```

**Fixes:**
- Use Alpine base (`oven/bun:1.2-alpine`)
- Ensure `.dockerignore` excludes unnecessary files
- Verify 3-stage build separates dev deps from production

---

## Container Crashes

### `Cannot find package 'vite'` in production

**Symptom:** App crashes immediately with `Cannot find package 'vite' from '/app/dist/index.js'`.

**Root cause:** Bun's bundler resolves `import("./vite")` eagerly at parse time, even behind a `NODE_ENV === "development"` conditional. The `./vite.ts` file is a local file (not npm), so it gets bundled. Inside it, `import("vite")` (npm package) fails because `vite` is a devDependency not installed in production.

**Fix:** Wrap the conditional import in a try-catch:
```typescript
if (nodeEnv === "development") {
  try {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } catch {
    console.warn("[server] Vite not available, falling back to static serving");
    serveStatic(app);
  }
}
```

### EasyPanel port 3000 conflict

**Symptom:** `curl localhost:3000/health/live` returns EasyPanel HTML, not app JSON. Health checks return wrong content.

**Root cause:** EasyPanel binds to `0.0.0.0:3000` on the host. The app container exposes port 3000 internally but through Traefik (no host port mapping).

**Fix:** Access health endpoints from inside the container or via Traefik domain:
```bash
# From inside container
docker exec neondash-app-1 wget -qO- http://127.0.0.1:3000/health/live

# Via Traefik domain
curl -sf https://neondash.gpus.com.br/health/live
```

### Container exits immediately

**Symptom:** `docker ps` shows container restarting in loop.

**Diagnosis:**
```bash
docker logs <container_id> --tail 50
docker inspect <container_id> | grep -A5 State
```

**Common causes:**
- Missing `DATABASE_URL` or other required env vars
- Redis connection failure when `REDIS_URL` is set but Redis isn't running
- Port conflict (another process on 3000)

**Fixes:**
- Verify all env vars are set in Docker Manager
- Check `depends_on: redis-session: condition: service_healthy`
- Use `docker compose logs -f` to see startup errors

### Health check failing

**Symptom:** Container marked unhealthy, Traefik stops routing.

**Diagnosis:**
```bash
docker inspect <container_id> | grep -A20 Health
docker exec <container_id> wget --spider http://localhost:3000/health/live
```

**Common causes:**
- App not fully started (increase `start_period`)
- Port mismatch (app not listening on 3000)
- `isShuttingDown` stuck as true (logic bug)

**Fixes:**
- Check logs for startup errors
- Increase HEALTHCHECK `start_period` (default 10s may be too short for cold starts)
- Verify app listens on `0.0.0.0:3000` (not `127.0.0.1`)

### Health check failing due to IPv6 localhost (`::1`)

**Symptom:** Container remains `unhealthy` even though app endpoints work from inside container with IPv4.

**Diagnosis:**
```bash
docker inspect <app_cid> | jq -r '.[0].State.Health.Log[-5:]'
docker exec <app_cid> wget --spider http://localhost:3000/health/live
docker exec <app_cid> wget --spider http://127.0.0.1:3000/health/live
```

**Root cause:** Alpine/BusyBox `wget` may resolve `localhost` to `::1` first. If the app is listening only on IPv4, probes fail.

**Fix:** Use `127.0.0.1` in Dockerfile HEALTHCHECK:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1
```

---

## Redis Issues

### Redis connection refused

**Symptom:** App logs `Redis health check failed: connect ECONNREFUSED`.

**Diagnosis:**
```bash
docker exec <app_container> sh -c "wget -qO- http://redis-session:6379" 2>&1
docker compose logs redis-session
```

**Fixes:**
- Ensure `redis-session` service is in the same `backend` network
- Check `REDIS_URL=redis://redis-session:6379` (not `localhost`)
- Verify Redis starts before app (`depends_on: condition: service_healthy`)

### Redis OOM

**Symptom:** Redis logs `OOM command not allowed when used memory > maxmemory`.

**Diagnosis:**
```bash
docker exec <redis_container> redis-cli INFO memory
```

**Fixes:**
- Increase `maxmemory` in Redis command
- With `noeviction` policy, this means data exceeds limit
- Check for memory leaks (sessions not expiring)

---

## Deploy Failures

### GitHub Actions: Docker push fails

**Symptom:** `docker/build-push-action` fails with 403 or auth error.

**Fixes:**
- Verify `permissions.packages: write` in workflow
- Check `GITHUB_TOKEN` has `write:packages` scope
- For org repos, verify org settings allow package creation

### GitHub Actions: SSH deploy fails

**Symptom:** `appleboy/ssh-action` timeout or auth error.

**Fixes:**
- Verify `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY` secrets
- Test SSH locally: `ssh -i key root@VPS_IP "echo ok"`
- Check VPS firewall allows SSH from GitHub Actions IPs
- Ensure SSH key format is correct (include `-----BEGIN OPENSSH PRIVATE KEY-----`)
- **Ensure each key in `authorized_keys` is on its own line** (no concatenation). Use `echo '' >> authorized_keys` before appending a new key to guarantee a newline separator
- Enable `PubkeyAuthentication yes` in `/etc/ssh/sshd_config` and restart sshd

### VPS: Image pull fails

**Symptom:** `docker pull ghcr.io/grupous/neondash:latest` returns unauthorized.

**Fixes:**
- Login to GHCR on VPS: `docker login ghcr.io`
- Make package public (GitHub → Packages → Settings → Visibility)
- Use PAT with `read:packages` scope

### VPS: `docker compose up` fails with network error

**Symptom:** Compose fails to attach app service to external Traefik network.

**Diagnosis:**
```bash
docker network inspect easypanel --format '{{.Name}} attachable={{.Attachable}}'
```

**Expected output:**
- `easypanel attachable=true`

**Fixes:**
- Ensure compose uses `easypanel` as the external Traefik network
- Ensure `traefik.docker.network=easypanel` in app labels

### VPS: DOCKER_IMAGE variable empty

**Symptom:** `pull access denied` or empty image name error.

**Fix:** Either set `DOCKER_IMAGE` in `/opt/neondash/.env`:
```env
DOCKER_IMAGE=ghcr.io/grupous/neondash:latest
```
Or export it in the deploy script before `docker compose` commands.

---

## Rollback Procedures

### Quick Rollback (specific commit)

```bash
ssh root@VPS_IP
cd /opt/neondash
DOCKER_IMAGE=ghcr.io/grupous/neondash:<previous-sha> \
  docker compose -f docker-compose.deploy.yml up -d app
```

### Full Rollback (git revert)

```bash
# Local
git revert <bad-commit>
git push origin main
# GitHub Actions will rebuild and redeploy
```

### Redis Data Recovery

```bash
# If Redis data is corrupted, restore from backup
docker compose -f docker-compose.deploy.yml stop redis-session
docker cp backup.rdb <redis_container>:/data/dump.rdb
docker compose -f docker-compose.deploy.yml start redis-session
```

---

## Monitoring Commands

```bash
# Container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Resource usage
docker stats --no-stream

# App logs (live)
docker compose -f docker-compose.deploy.yml logs -f app

# Redis logs
docker compose -f docker-compose.deploy.yml logs -f redis-session

# Health check
curl -s https://neondash.gpus.com.br/health/live
curl -s https://neondash.gpus.com.br/health/ready

# Redis info
docker exec <redis_container> redis-cli INFO memory
docker exec <redis_container> redis-cli INFO clients
```
