---
name: docker-deploy
description: Use when deploying to Hostinger VPS via Docker, optimizing Dockerfile for production, adding health probes or metrics endpoints, configuring graceful shutdown, setting up auto-deploy from GitHub to VPS, troubleshooting Docker builds, or configuring docker-compose with Redis and resource limits. Use ESPECIALLY when push-to-deploy fails, containers crash on startup, health checks timeout, or Redis connectivity issues appear in production.
---

# Docker Deploy Skill

Production deployment reference for Neondash on Hostinger VPS with Docker, Traefik, and GitHub Actions CI/CD.

> Operational model: Hostinger has no official CLI for Docker operations in this project workflow. Use SSH with deploy key as the primary management channel.

## Overview

Deploy pipeline: `git push main` → GitHub Actions (lint/test/build → Docker image → GHCR) → Hostinger VPS pulls image → docker-compose up with Traefik TLS routing.

## When to Use

- Deploying to Hostinger VPS
- Optimizing Dockerfile (Alpine, non-root, multi-stage)
- Adding health probes (`/health/live`, `/health/ready`) or `/metrics`
- Configuring graceful shutdown with grace period
- Setting up Redis service in docker-compose
- Adding resource limits and security headers
- Troubleshooting deploy failures or container crashes
- Auto-deploy workflow (GitHub → GHCR → VPS)
- SSH key management and VPS access
- VPS panel management
- DNS configuration and domain setup

## When NOT to Use

- Local development setup → use `docker-compose.yml`
- Railway/Vercel deployment → different infrastructure
- Database migrations → use `clerk-neon-auth` skill

## Architecture

```
GitHub Push (main)
  ↓
GitHub Actions CI/CD
  ├── bun install → check → build → test
  └── Docker build → Push to GHCR
  ↓
Hostinger VPS
  ├── docker-compose.deploy.yml
  ├── app container (Bun + Express + tRPC)
  │   ├── /health/live  (liveness probe)
  │   ├── /health/ready (readiness probe)
  │   └── /metrics      (Prometheus)
  ├── redis-session (Redis 7 Alpine)
  └── Traefik (TLS, routing, health LB)
```

## Quick Reference

| Topic | File | Details |
|---|---|---|
| Dockerfile optimization | [dockerfile-guide.md](references/dockerfile-guide.md) | Alpine, non-root, 3-stage build |
| Health probes & metrics | [health-probes.md](references/health-probes.md) | Liveness, readiness, Prometheus metrics |
| Graceful shutdown | [graceful-shutdown.md](references/graceful-shutdown.md) | Signal handlers, grace period, cleanup order |
| Docker Compose production | [docker-compose-guide.md](references/docker-compose-guide.md) | Redis service, resource limits, security headers |
| GitHub Actions CI/CD | [ci-cd-pipeline.md](references/ci-cd-pipeline.md) | Build → push GHCR → auto-deploy to VPS |
| VPS SSH operations | [vps-ssh-management.md](references/vps-ssh-management.md) | SSH keys, manual deploy, DNS, panel usage |
| Troubleshooting | [troubleshooting.md](references/troubleshooting.md) | Common failures, diagnostics, rollback |

For all day-2 operations on Hostinger VPS, `references/vps-ssh-management.md` is the primary operational source.

## Key Files

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage production build |
| `docker-compose.deploy.yml` | Hostinger VPS deployment |
| `docker-compose.yml` | Local development |
| `.github/workflows/deploy.yml` | Production CI/CD (main branch) |
| `.github/workflows/deploy-staging.yml` | Staging CI/CD (dev-test branch) |
| `.dockerignore` | Build context optimization |
| `server/_core/index.ts` | Health probes, graceful shutdown |
| `server/_core/sessionCache.ts` | Redis client export for health checks |

## Implementation Phases

### Phase 1: Dockerfile Optimization

Optimize with Alpine base, 3-stage build (deps → builder → runtime), non-root user, and Docker HEALTHCHECK.

→ Full guide: [references/dockerfile-guide.md](references/dockerfile-guide.md)

### Phase 2: Health Probes & Metrics

Add `/health/live`, `/health/ready`, `/metrics` endpoints to `server/_core/index.ts`. Export Redis client from `sessionCache.ts` for health checks.

→ Full guide: [references/health-probes.md](references/health-probes.md)

### Phase 3: Graceful Shutdown

Replace basic shutdown with grace-period-aware shutdown: mark `isShuttingDown`, close HTTP, wait for in-flight, close Redis, stop schedulers.

→ Full guide: [references/graceful-shutdown.md](references/graceful-shutdown.md)

### Phase 4: Docker Compose with Redis

Add dedicated `redis-session` service with AOF persistence, `noeviction` policy, resource limits, security headers via Traefik, and network isolation.

→ Full guide: [references/docker-compose-guide.md](references/docker-compose-guide.md)

### Phase 5: Auto-Deploy Pipeline

GitHub Actions → GHCR push → SSH deploy to Hostinger VPS (or webhook-triggered pull).

→ Full guide: [references/ci-cd-pipeline.md](references/ci-cd-pipeline.md)

### Phase 6: VPS Access & Management (SSH-first)

SSH key setup, manual deploy operations, DNS/domain configuration, EasyPanel considerations.

→ Full guide: [references/vps-ssh-management.md](references/vps-ssh-management.md)

## VPS Resource Recommendations

| Resource | Minimum | Recommended |
|---|---|---|
| vCPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 40 GB SSD | 80 GB NVMe |

Memory breakdown: OS (2GB) + App (2GB) + Redis (4GB) + Baileys (2GB) + Cache (2GB) + Docker (1GB) + Headroom (3GB) = 16GB.

## Validation Commands

```bash
# Build and verify image
docker build -t neondash-test .
docker images neondash-test                  # Should be ~80-100MB
docker run --rm neondash-test whoami         # Should return bunuser

# Test health probes (dev mode)
curl http://localhost:3000/health/live       # → OK
curl http://localhost:3000/health/ready      # → Ready
curl http://localhost:3000/metrics           # → Prometheus format

# Deploy to VPS
docker-compose -f docker-compose.deploy.yml up -d
docker ps                                    # Both containers healthy
docker stats                                 # Verify resource limits
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Using `--smol` flag in production | Remove it — trades CPU for memory, net negative on VPS with sufficient RAM |
| No non-root user in Docker | Add `bunuser` (UID 1001) in final stage |
| Health check hits `/api/test/*` endpoint | Use dedicated `/health/live` — faster, no auth dependency |
| Redis not in docker-compose | Add `redis-session` service with health check dependency |
| No security headers | Add via Traefik labels (HSTS, X-Frame-Options, CSP) |
| No grace period on shutdown | Add 10s wait for in-flight requests to complete |
