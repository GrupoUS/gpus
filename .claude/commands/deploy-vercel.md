# Deploy to Vercel

This command helps you deploy AegisWallet to Vercel platform using the Hono + Vite stack.

> 🛑 **MANDATORY DEPLOYMENT POLICY**
>
> **ALL TypeScript errors MUST be fixed before deployment.**
>
> - ✅ DO: Fix all type-check errors, then build, then deploy
> - ❌ DO NOT: Skip error fixing or use `--no-type-check`
> - ❌ DO NOT: Deploy with known errors "to fix later"
>
> **No exceptions.** This ensures production stability and prevents runtime failures.

## Prerequisites

Before deploying, ensure you have:
- Vercel Account
- Vercel CLI installed globally: `bun add -g vercel`
- Bun runtime installed
- Linked your project to Vercel account

## Initial Setup (First Time Only)

If this is your first time deploying:

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Link Project:**
   ```bash
   vercel link
   ```

3. **Setup Environment Variables:**
   ```bash
   bun deploy:vercel:setup
   ```

   Required environment variables:
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase public anonymous key
   - `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
   - `GOOGLE_REDIRECT_URI` - OAuth callback URI
   - `TOKENS_ENCRYPTION_KEY` - Key for encrypting sensitive tokens

   > ⚠️ **Important**: For Google OAuth login to work, credentials must also be configured in the Supabase Dashboard (Authentication > Providers > Google).

### Deployment Strategy

**Option C – Fix critical errors first, then perform incremental deployments**

The deployment process will always prioritize fixing the most critical TypeScript errors before attempting a preview or production deploy. After each fix, a quick incremental deploy will be performed to verify that the issue is resolved before moving on to the next set of errors.

> ⚠️ This policy supersedes any other deployment option in this command.


### Option 2: Production Deployment
Deploy directly to the production URL:
```bash
bun deploy:vercel:prod
```

### Option 3: Manual Deployment
If you prefer manual control:
```bash
vercel deploy --prebuilt          # Preview
vercel deploy --prod --prebuilt   # Production
```

## Deployment with Continuous Error Verification

This workflow performs iterative testing and fixing until the deployment succeeds without errors.

### Step-by-Step Process

#### 1. Initial Build Verification
Before deploying, verify the local build works:
```bash
# Run type checking
bun run type-check

# Run linting
bun run lint

# Build locally
bun run build
```

If any of these fail, fix the errors before proceeding.

#### 2. Deploy to Preview with Verification
```bash
# Deploy to preview
bun deploy:vercel:preview

# Or manually:
vercel deploy --prebuilt
```

**Capture the deployment URL** from the output (e.g., `https://aegiswallet.vercel.app`)

#### 3. Check Deployment Logs for Errors
```bash
# View real-time logs
vercel logs <deployment-url> --follow

# Or check specific deployment logs
vercel logs <deployment-url>
```

**Look for**:
- Build errors
- Runtime errors
- Function timeouts
- Missing environment variables
- Import/module resolution errors

#### 4. Test Deployed Application
Run comprehensive tests against the deployed URL:

```bash
# Health check
curl https://<deployment-url>/health

# Test API endpoints
curl https://<deployment-url>/api/v1/health

# Test frontend loads
curl -I https://<deployment-url>
```

**Manual browser testing**:
1. Open `https://<deployment-url>` in browser
2. Check console for errors (F12 → Console)
3. Test critical user flows:
   - Login functionality
   - Navigation between pages
   - API calls working correctly
4. Check Network tab for failed requests

#### 5. Identify and Fix Errors

Common error types and fixes:

**Build Errors:**
- **Missing dependencies**: Add to `package.json` and run `bun install`
- **TypeScript errors**: Fix type issues in the code
- **Import errors**: Check import paths and file names

**Runtime Errors:**
- **Environment variables missing**: Run `bun deploy:vercel:setup` or add via Vercel Dashboard
- **API endpoint failures**: Check Hono RPC routes at `/api/v1/*`
- **Database connection issues**: Verify Supabase credentials and RLS policies

**Performance Issues:**
- **Function timeouts**: Optimize slow operations or increase timeout limits
- **Memory issues**: Reduce bundle size or optimize memory usage

#### 6. Re-deploy After Fixes
After making fixes:

```bash
# Commit your changes
git add .
git commit -m "fix: resolve deployment errors"

# Re-deploy
bun deploy:vercel:preview
```

#### 7. Iterate Until Clean Deployment
**Repeat steps 3-6 until:**
- ✅ No errors in deployment logs
- ✅ All health checks pass
- ✅ No console errors in browser
- ✅ All critical user flows work
- ✅ All API endpoints respond correctly

#### 8. Final Production Deployment
Once preview deployment is verified clean:

```bash
# Deploy to production
bun deploy:vercel:prod

# Verify production deployment
vercel logs <production-url> --follow

# Run production health checks
curl https://<production-url>/health
```

### Automated Error Detection Script

Create a verification script to automate checks:

```bash
#!/usr/bin/env bash
# scripts/verify-deployment.sh

DEPLOYMENT_URL=$1

echo "🔍 Verifying deployment: $DEPLOYMENT_URL"

# Health check
echo "1️⃣ Testing health endpoint..."
HEALTH=$(curl -s "$DEPLOYMENT_URL/health")
if [ -z "$HEALTH" ]; then
  echo "❌ Health check failed"
  exit 1
fi
echo "✅ Health check passed"

# Test API
echo "2️⃣ Testing API endpoint..."
API_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/v1/health")
if [ -z "$API_RESPONSE" ]; then
  echo "❌ API check failed"
  exit 1
fi
echo "✅ API check passed"

# Check for errors in logs
echo "3️⃣ Checking for errors in logs..."
ERRORS=$(vercel logs "$DEPLOYMENT_URL" | grep -i "error" | head -n 5)
if [ ! -z "$ERRORS" ]; then
  echo "⚠️ Errors found in logs:"
  echo "$ERRORS"
  exit 1
fi
echo "✅ No errors in logs"

echo "🎉 All checks passed!"
```

Usage:
```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh https://aegiswallet.vercel.app
```

### Checklist for Successful Deployment

- [ ] Local build passes (`bun run build`)
- [ ] Type checking passes (`bun run type-check`)
- [ ] Linting passes (`bun run lint`)
- [ ] Deployment completes without build errors
- [ ] Health endpoint returns 200 OK
- [ ] No errors in Vercel logs
- [ ] Frontend loads without console errors
- [ ] Google OAuth login works
- [ ] API endpoints respond correctly
- [ ] Database queries work (check RLS policies)
- [ ] All environment variables configured

## Post-Deployment Verification

### 1. View Deployment Logs
```bash
vercel logs [deployment-url]
```

### 2. Health Check
Verify the backend is running correctly:
```bash
curl https://[your-deployment-url]/health
```

## Troubleshooting

### Rollback to Previous Version
If something goes wrong, revert to a previous deployment:
```bash
vercel rollback
```

### Common Issues
1. **Environment Variables Missing**: Run `bun deploy:vercel:setup` again
2. **Google OAuth Not Working**: Check Supabase Dashboard → Authentication → Providers → Google
3. **Build Failures**: Check logs with `vercel logs [deployment-url]`

## CI/CD Integration

Automated deployments are configured via GitHub Actions:
- **Push to `main`**: Triggers Production deployment
- **Pull Requests**: Triggers Preview deployment with URL in PR comments

## Performance Notes

- **Edge Runtime**: Hono server runs on Vercel Edge Functions for low latency
- **Caching**: Static assets served with aggressive caching headers
- **Rewrites**: API requests efficiently routed via `vercel.json` configuration
