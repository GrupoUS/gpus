# VPS SSH & Hostinger Management

## SSH Key Connection

### Key Location

| Item | Path |
|---|---|
| Local private key | `/tmp/neondash_deploy` |
| Local public key | `/tmp/neondash_deploy.pub` |
| VPS authorized keys | `/root/.ssh/authorized_keys` |
| GitHub Secret | `VPS_SSH_KEY` (private key) |

### Connecting to VPS

```bash
# Direct SSH connection
ssh -i /tmp/neondash_deploy root@31.97.170.4

# Run a single command
ssh -i /tmp/neondash_deploy -o StrictHostKeyChecking=no root@31.97.170.4 "docker ps"

# Copy files to VPS
scp -i /tmp/neondash_deploy localfile.yml root@31.97.170.4:/opt/neondash/
```

### Regenerating Deploy Keys

If the key is lost or compromised:

```bash
# 1. Generate new ED25519 key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /tmp/neondash_deploy -N ""

# 2. Add public key to VPS (via existing SSH session or Hostinger panel)
cat /tmp/neondash_deploy.pub
# On VPS: echo '<public-key>' >> /root/.ssh/authorized_keys

# 3. Update GitHub Secret
gh secret set VPS_SSH_KEY --repo GrupoUS/neondash < /tmp/neondash_deploy

# 4. Verify connection
ssh -i /tmp/neondash_deploy root@31.97.170.4 "echo OK"
```

### authorized_keys Pitfalls

> **CRITICAL**: Each key MUST be on its own line. SSH silently fails if two keys are concatenated on the same line.

```bash
# ❌ WRONG — keys on same line
ssh-rsa AAAAB3...== #hostinger-managed-keyssh-ed25519 AAAAC3...== deploy

# ✅ CORRECT — separate lines
ssh-rsa AAAAB3...== #hostinger-managed-key
ssh-ed25519 AAAAC3...== deploy
```

Verify on VPS:
```bash
wc -l /root/.ssh/authorized_keys
# Should show one line per key (typically 2+)
```

---

## Hostinger VPS Panel

### Accessing VPS Panel

1. Login at [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Navigate to **VPS** → Select your server
3. Key tabs: **Overview**, **SSH Access**, **Manage**

### VPS Management Methods

Hostinger **does NOT have an official CLI** like Railway or Vercel. All VPS management is done via:

#### 1. SSH (Primary — what we use)

```bash
# Interactive session
ssh -i /tmp/neondash_deploy root@31.97.170.4

# One-liner command
ssh -i /tmp/neondash_deploy -o StrictHostKeyChecking=no root@31.97.170.4 "docker ps"
```

#### 2. Hostinger Web Panel

1. Login at [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Navigate to **VPS** → Select your server
3. Key tabs:
   - **Overview** — resource usage, IP, OS info
   - **SSH Access** — manage SSH keys via UI
   - **Settings** → **Operating System** — reinstall/reset VPS
   - **Manage** — firewall, backups, snapshots

#### 3. Hostinger API (REST)

For automation without SSH, Hostinger offers a REST API:

```bash
# Get API token from hpanel.hostinger.com → Account → API
# Base URL: https://api.hostinger.com/v1

# List VPS instances
curl -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  https://api.hostinger.com/v1/vps

# Restart VPS
curl -X POST -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  https://api.hostinger.com/v1/vps/{vps_id}/restart
```

> **Recommendation**: Use SSH for all operational tasks (deploy, logs, config). Use the web panel for DNS, firewall, and backups. Use the API only for CI/CD automation if SSH is not viable.

### VPS Info

| Field | Value |
|---|---|
| IP | `31.97.170.4` |
| Username | `root` |
| VPS Provider | Hostinger |
| OS | Ubuntu (with Docker + EasyPanel) |
| Deploy Dir | `/opt/neondash` |
| Domain | `neondash.com.br` |
| Panel | EasyPanel (port 3000) |

---

## Manual Deploy Operations

### Deploy Latest Image

```bash
ssh -i /tmp/neondash_deploy root@31.97.170.4 << 'EOF'
  cd /opt/neondash
  export DOCKER_IMAGE=ghcr.io/grupous/neondash:latest
  docker compose -f docker-compose.deploy.yml pull
  docker compose -f docker-compose.deploy.yml up -d
  docker image prune -f
EOF
```

### Rollback to Specific Commit

```bash
ssh -i /tmp/neondash_deploy root@31.97.170.4 << 'EOF'
  cd /opt/neondash
  export DOCKER_IMAGE=ghcr.io/grupous/neondash:<commit-sha>
  docker compose -f docker-compose.deploy.yml pull
  docker compose -f docker-compose.deploy.yml up -d
EOF
```

### Check Container Health

```bash
# Container status
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker ps -f name=neondash --format 'table {{.Names}}\t{{.Status}}'"

# Health endpoints (from inside container — EasyPanel owns localhost:3000)
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker exec neondash-app-1 wget -qO- http://127.0.0.1:3000/health/live"
ssh -i /tmp/neondash_deploy root@31.97.170.4 "docker exec neondash-app-1 wget -qO- http://127.0.0.1:3000/health/ready"

# App logs (last 30 lines)
ssh -i /tmp/neondash_deploy root@31.97.170.4 "export DOCKER_IMAGE=ghcr.io/grupous/neondash:latest && docker compose -f /opt/neondash/docker-compose.deploy.yml logs app --tail 30"
```

### View & Edit VPS Environment

```bash
# View .env on VPS
ssh -i /tmp/neondash_deploy root@31.97.170.4 "cat /opt/neondash/.env"

# Update compose file on VPS
scp -i /tmp/neondash_deploy docker-compose.deploy.yml root@31.97.170.4:/opt/neondash/

# Add env variable
ssh -i /tmp/neondash_deploy root@31.97.170.4 "echo 'NEW_VAR=value' >> /opt/neondash/.env"
```

---

## EasyPanel Considerations

EasyPanel runs on the VPS and binds to `0.0.0.0:3000`:

- **DO NOT** use `curl localhost:3000` to test app health — it hits EasyPanel, not the app
- **DO** use `docker exec` to test from inside the container
- The app container exposes port 3000 internally, routed via Traefik on the `easypanel` network
- Access the app via the domain: `https://neondash.com.br`

---

## DNS Configuration

### Required Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `31.97.170.4` | 3600 |
| **A** | `www` | `31.97.170.4` | 3600 |

### Traefik TLS

Traefik auto-generates Let's Encrypt certificates. Set `APP_HOST` in VPS `.env`:

```bash
# On VPS
echo 'APP_HOST=neondash.com.br' >> /opt/neondash/.env
```

### Verify DNS

```bash
dig neondash.com.br +short
# Should return: 31.97.170.4
```
