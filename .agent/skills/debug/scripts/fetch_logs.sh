#!/bin/bash
# Debug Skill - Error Log Fetcher
# Aggregates logs from GitHub Actions, VPS containers, and Neon for error analysis

set -e

REPO="GrupoUS/neondash"
VPS_IP="31.97.170.4"

echo "📋 Fetching error logs..."
echo ""

# ──────────────────────────────────────────────
# GitHub Actions — Recent failed runs
# ──────────────────────────────────────────────
if command -v gh &> /dev/null; then
    echo "🔄 GitHub Actions — Recent Runs:"
    echo "─────────────────────────────────"
    gh run list --repo "$REPO" -L 5 --json status,conclusion,name,headBranch,createdAt \
        --template '{{range .}}{{.name}} | {{.headBranch}} | {{.conclusion}} | {{.createdAt}}{{"\n"}}{{end}}' 2>/dev/null || echo "No runs available"
    echo ""

    # Show failed runs details
    FAILED_RUN=$(gh run list --repo "$REPO" -L 1 --status failure --json databaseId --template '{{range .}}{{.databaseId}}{{end}}' 2>/dev/null)
    if [ -n "$FAILED_RUN" ]; then
        echo "❌ Last Failed Run (ID: $FAILED_RUN):"
        echo "─────────────────────────────────"
        gh run view "$FAILED_RUN" --repo "$REPO" --log-failed 2>/dev/null | tail -50
        echo ""
    else
        echo "✅ No recent failed runs"
        echo ""
    fi
else
    echo "⚠️  GitHub CLI not installed"
    echo "   Install: brew install gh"
    echo ""
fi

# ──────────────────────────────────────────────
# VPS Container Logs (requires SSH access)
# ──────────────────────────────────────────────
echo "🖥️  VPS Container Status:"
echo "─────────────────────────"
if ssh -o ConnectTimeout=5 -o BatchMode=yes root@"$VPS_IP" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null; then
    echo ""
else
    echo "⚠️  Cannot connect to VPS (SSH key or network issue)"
    echo "   Try: ssh root@$VPS_IP"
    echo ""
fi

# ──────────────────────────────────────────────
# Neon Database Info
# ──────────────────────────────────────────────
if command -v neonctl &> /dev/null; then
    echo "🐘 Neon Database Status:"
    echo "────────────────────────"
    neonctl projects list 2>/dev/null || echo "No Neon projects available"
    echo ""
    echo "💡 For slow queries, use MCP tool: mcp_mcp-server-neon_list_slow_queries"
else
    echo "⚠️  Neon CLI not installed"
    echo "   Install: npm install -g neonctl"
    echo ""
fi

echo "✅ Log fetch complete!"
