# Docker Compose Production Guide

## Architecture

```
┌─────────────────────────────┐
│  Traefik (external)         │
│  TLS termination + routing  │
└──────────┬──────────────────┘
           │ :3000
┌──────────▼──────────────────┐     ┌───────────────────────┐
│  app (Neondash)             │────▶│  redis-session        │
│  Bun + Express + tRPC       │     │  Redis 7 Alpine       │
│  /health/live, /health/ready│     │  AOF persistence      │
└─────────────────────────────┘     └───────────────────────┘
     easypanel + backend net            backend net only
```

## docker-compose.deploy.yml

### App Service

```yaml
services:
  app:
    image: ${DOCKER_IMAGE}
    restart: unless-stopped

    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: "3000"
      HOST: 0.0.0.0
      SHUTDOWN_GRACE_PERIOD: "10000"
      REDIS_URL: redis://redis-session:6379
      BAILEYS_SESSION_DIR: /app/.baileys-sessions
      # ... all secrets from Docker Manager ...

    expose:
      - "3000"

    volumes:
      - baileys-sessions:/app/.baileys-sessions

    networks:
      - easypanel
      - backend

    depends_on:
      redis-session:
        condition: service_healthy

    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '2.0'
          memory: 2G
```

### Redis Service

```yaml
  redis-session:
    image: redis:7-alpine
    restart: unless-stopped

    command: >
      redis-server
      --maxmemory 4gb
      --maxmemory-policy noeviction
      --appendonly yes
      --appendfsync everysec

    volumes:
      - redis-session-data:/data

    networks:
      - backend

    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 2G

    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Networks

```yaml
networks:
  easypanel:
    external: true   # Shared Traefik network (attachable=true on this VPS)
  backend:
    driver: bridge   # Private app ↔ Redis
```

### Volumes

```yaml
volumes:
  baileys-sessions:
    driver: local
  redis-session-data:
    driver: local
```

## Traefik Labels

### Routing + TLS

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=easypanel"
  - "traefik.http.routers.${TRAEFIK_ROUTER:-neondash}.rule=Host(`${APP_HOST:-localhost}`)"
  - "traefik.http.routers.${TRAEFIK_ROUTER:-neondash}.entrypoints=websecure"
  - "traefik.http.routers.${TRAEFIK_ROUTER:-neondash}.tls=true"
  - "traefik.http.routers.${TRAEFIK_ROUTER:-neondash}.tls.certresolver=letsencrypt"
```

> Note: On this VPS, swarm `ingress` is `attachable=false`. Use `easypanel` for Traefik-attached application services.

### Security Headers

```yaml
  - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Frame-Options=SAMEORIGIN"
  - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Content-Type-Options=nosniff"
  - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.Strict-Transport-Security=max-age=31536000; includeSubDomains"
  - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.Referrer-Policy=strict-origin-when-cross-origin"
  - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.Permissions-Policy=geolocation=(), microphone=(), camera=()"
  - "traefik.http.routers.${TRAEFIK_ROUTER:-neondash}.middlewares=security-headers"
```

### Health Check Load Balancer

```yaml
  - "traefik.http.services.${TRAEFIK_ROUTER:-neondash}.loadbalancer.server.port=3000"
  - "traefik.http.services.${TRAEFIK_ROUTER:-neondash}.loadbalancer.healthcheck.path=/health/live"
  - "traefik.http.services.${TRAEFIK_ROUTER:-neondash}.loadbalancer.healthcheck.interval=30s"
```

## Redis Configuration Rationale

| Setting | Value | Why |
|---|---|---|
| `maxmemory` | 4gb | Generous limit for session data |
| `maxmemory-policy` | noeviction | Never silently discard sessions |
| `appendonly` | yes | Persist data across restarts |
| `appendfsync` | everysec | Balance durability vs. performance |

## Resource Limits

| Service | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|---|---|---|---|---|
| app | 4.0 | 4G | 2.0 | 2G |
| redis-session | 1.0 | 4G | 0.5 | 2G |

## Environment Variables (Docker Manager)

Required additions beyond existing secrets:

```bash
SHUTDOWN_GRACE_PERIOD=10000
REDIS_URL=redis://redis-session:6379
```

## Backup Redis

```bash
# Trigger background save
docker exec <redis_container> redis-cli BGSAVE

# Copy dump file
docker cp <redis_container>:/data/dump.rdb ./backup-$(date +%Y%m%d).rdb
```
