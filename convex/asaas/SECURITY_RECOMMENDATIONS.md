# Asaas Integration - Security Recommendations

**Date**: 2025-12-25
**Purpose**: Secure handling of API credentials and sensitive data

---

## 1. API Key Management

### 1.1 Environment Variables (MANDATORY)

**Current Issue**: `ASAAS_API_KEY` is not configured in Railway production environment.

**Solution**:
```bash
# Add to Railway environment variables
ASAAS_API_KEY=your_production_api_key_here
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_SECRET=your_webhook_secret_here
```

**Best Practices**:
- ✅ Store API keys in environment variables only
- ✅ Never commit API keys to version control
- ✅ Use different keys for development, staging, and production
- ✅ Rotate keys regularly (recommended: every 90 days)
- ✅ Revoke compromised keys immediately

### 1.2 Key Rotation Strategy

**Rotation Process**:
1. Generate new API key in Asaas dashboard
2. Add new key to environment variables
3. Deploy to production
4. Monitor for 24-48 hours
5. Revoke old key in Asaas dashboard
6. Remove old key from environment variables

**Automation**:
- Set calendar reminders for key rotation
- Document rotation dates in security log
- Use secrets management tools (e.g., HashiCorp Vault, AWS Secrets Manager)

### 1.3 Key Validation

**Implementation**:
```typescript
// Validate API key format before use
function validateApiKey(apiKey: string): boolean {
	// Asaas API keys are typically 32+ alphanumeric characters
	return /^[a-zA-Z0-9]{32,}$/.test(apiKey)
}

// Check at startup
if (!process.env.ASAAS_API_KEY || !validateApiKey(process.env.ASAAS_API_KEY)) {
	throw new Error('ASAAS_API_KEY inválida ou não configurada')
}
```

---

## 2. Data Protection (LGPD Compliance)

### 2.1 Sensitive Data Handling

**Protected Information**:
- CPF/CNPJ (Brazilian tax IDs)
- Email addresses
- Phone numbers
- Full names
- Payment information
- Addresses

**Protection Measures**:
- ✅ Encrypt sensitive data at rest (use Convex built-in encryption)
- ✅ Use HTTPS for all API communications
- ✅ Sanitize logs to remove PII
- ✅ Implement data retention policies
- ✅ Provide data deletion endpoints

### 2.2 Log Sanitization

**Current Issue**: Error messages may contain sensitive data.

**Solution**:
```typescript
// Sanitize error messages before logging
function sanitizeForLogging(message: string): string {
	return message
		// Remove CPF/CNPJ (11 or 14 digits)
		.replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '[CPF_REDACTED]')
		.replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, '[CNPJ_REDACTED]')
		// Remove emails
		.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
		// Remove phones
		.replace(/\(\d{2}\)\s*\d{4,5}-?\d{4}/g, '[PHONE_REDACTED]')
		// Remove API keys
		.replace(/[a-zA-Z0-9]{32,}/g, '[API_KEY_REDACTED]')
}
```

### 2.3 Data Minimization

**Principles**:
- Collect only necessary data
- Use masked display for sensitive fields
- Implement field-level access control
- Regular data audits

**Example**:
```typescript
// Display masked CPF
function maskCpf(cpf: string): string {
	if (cpf.length === 11) {
		return `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}`
	}
	return cpf
}

// Display: 123.***.***-90
```

---

## 3. API Security

### 3.1 Rate Limiting

**Implementation**:
- Use circuit breaker pattern (already implemented)
- Implement request queuing
- Monitor rate limit headers
- Respect 429 responses

**Configuration**:
```typescript
const RATE_LIMIT_CONFIG = {
	maxRequestsPerMinute: 100,
	maxRequestsPerHour: 1000,
	backoffMultiplier: 2,
	initialBackoffMs: 1000,
}
```

### 3.2 Request Validation

**Input Validation**:
- Validate all payloads before sending to API
- Use Zod schemas (already implemented)
- Sanitize user inputs
- Check for injection attempts

**Example**:
```typescript
// Validate customer payload
const validated = AsaasCustomerPayloadSchema.parse(rawPayload)
```

### 3.3 Idempotency

**Purpose**: Prevent duplicate operations and data corruption.

**Implementation**:
```typescript
// Use externalReference for idempotency
const uniqueId = `${studentId}_${timestamp}_${operationType}`

await createAsaasCustomer({
	...payload,
	externalReference: uniqueId,
})
```

**Benefits**:
- Prevents duplicate charges
- Enables safe retries
- Improves data consistency

---

## 4. Webhook Security

### 4.1 Webhook Signature Verification

**Implementation**:
```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	const hmac = crypto
		.createHmac('sha256', secret)
		.update(payload)
		.digest('hex')

	return crypto.timingSafeEqual(
		Buffer.from(hmac),
		Buffer.from(signature),
	)
}

// Usage
const isValid = verifyWebhookSignature(
	JSON.stringify(payload),
	req.headers['asaas-signature'],
	process.env.ASAAS_WEBHOOK_SECRET,
)
```

### 4.2 Webhook Authentication

**Best Practices**:
- Verify signature before processing
- Reject invalid signatures with 401
- Log all webhook attempts
- Implement replay attack prevention

---

## 5. Access Control

### 5.1 Authentication

**Current Implementation**: Clerk authentication (already in place)

**Recommendations**:
- ✅ Require authentication for all API endpoints
- ✅ Implement role-based access control (RBAC)
- ✅ Log all authentication attempts
- ✅ Implement session timeout

### 5.2 Authorization

**Role-Based Access Control**:
```typescript
// Define roles
enum Role {
	ADMIN = 'admin',
	MANAGER = 'manager',
	VIEWER = 'viewer',
}

// Check permissions
function hasPermission(userRole: Role, requiredRole: Role): boolean {
	const roleHierarchy = {
		[Role.ADMIN]: 3,
		[Role.MANAGER]: 2,
		[Role.VIEWER]: 1,
	}

	return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Usage
if (!hasPermission(user.role, Role.ADMIN)) {
	throw new Error('Permissão negada')
}
```

### 5.3 Multi-Tenant Data Isolation

**Current Implementation**: Organization-based isolation (already in place)

**Recommendations**:
- ✅ Always filter by organizationId
- ✅ Validate ownership before operations
- ✅ Use database constraints
- ✅ Implement tenant-specific rate limits

---

## 6. Monitoring and Auditing

### 6.1 Security Logging

**Log Events**:
- Authentication failures
- Authorization failures
- API errors
- Data access attempts
- Configuration changes

**Implementation**:
```typescript
// Security event logging
async function logSecurityEvent(event: {
	type: string
	userId?: string
	organizationId?: string
	details: Record<string, unknown>
}) {
	await ctx.db.insert('securityLogs', {
		...event,
		timestamp: Date.now(),
		ipAddress: ctx.request.ip,
		userAgent: ctx.request.headers['user-agent'],
	})
}
```

### 6.2 Alerting

**Security Alerts**:
- Multiple failed authentication attempts
- Unauthorized API access
- Rate limit violations
- Suspicious data access patterns
- Configuration changes

**Implementation**:
```typescript
// Alert on suspicious activity
if (failedAuthAttempts > 5) {
	await sendSecurityAlert({
		type: 'BRUTE_FORCE_DETECTED',
		userId: user.id,
		ipAddress: request.ip,
	})
}
```

### 6.3 Audit Trails

**Audit Requirements** (LGPD):
- Record all data access
- Track data modifications
- Log data exports
- Maintain audit logs for 2 years

**Implementation**:
```typescript
// Audit log entry
await ctx.db.insert('auditLogs', {
	action: 'READ',
	resource: 'students',
	resourceId: student._id,
	userId: user.id,
	organizationId: user.organizationId,
	timestamp: Date.now(),
})
```

---

## 7. Infrastructure Security

### 7.1 Environment Variables

**Best Practices**:
- ✅ Use Railway environment variables
- ✅ Never hardcode credentials
- ✅ Use different variables per environment
- ✅ Rotate secrets regularly

**Railway Setup**:
```bash
# Via CLI
railway variables set ASAAS_API_KEY=your_key

# Via Dashboard
# Go to Project > Variables > New Variable
```

### 7.2 Network Security

**Recommendations**:
- ✅ Use HTTPS for all communications
- ✅ Implement CORS policies
- ✅ Use security headers
- ✅ Enable request rate limiting

**Security Headers**:
```typescript
// Add security headers
headers: {
	'Content-Security-Policy': "default-src 'self'",
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}
```

---

## 8. Compliance Checklist

### LGPD (Lei Geral de Proteção de Dados)

- [ ] Data minimization (collect only necessary data)
- [ ] Purpose limitation (use data only for stated purpose)
- [ ] Data accuracy (maintain accurate and up-to-date data)
- [ ] Storage limitation (retain data only as long as necessary)
- [ ] Security measures (implement appropriate security)
- [ ] Data subject rights (provide access, correction, deletion)
- [ ] Data breach notification (notify within 48 hours)
- [ ] Data protection officer (appoint DPO if required)
- [ ] Data processing agreement (have contracts with processors)

### PCI DSS (Payment Card Industry)

- [ ] Never store full card data
- [ ] Use tokenization for card payments
- [ ] Encrypt card data in transit
- [ ] Implement access controls
- [ ] Regular security testing
- [ ] Maintain security policy

---

## 9. Incident Response

### 9.1 Security Incident Types

**Examples**:
- API key compromise
- Data breach
- Unauthorized access
- Payment fraud
- Webhook tampering

### 9.2 Incident Response Plan

**Steps**:
1. **Detection**: Identify security incident
2. **Containment**: Limit damage (revoke keys, suspend access)
3. **Eradication**: Remove threat (patch vulnerabilities)
4. **Recovery**: Restore systems and data
5. **Lessons Learned**: Document and improve

### 9.3 Contact Information

**Emergency Contacts**:
- Asaas Support: support@asaas.com
- Railway Support: support@railway.app
- Security Team: security@yourcompany.com
- Data Protection Officer: dpo@yourcompany.com

---

## 10. Regular Security Reviews

### 10.1 Review Schedule

- **Weekly**: Review security logs
- **Monthly**: Review access controls
- **Quarterly**: Penetration testing
- **Annually**: Full security audit

### 10.2 Review Checklist

- [ ] Review failed authentication attempts
- [ ] Review API error rates
- [ ] Review data access patterns
- [ ] Review third-party dependencies
- [ ] Update security documentation
- [ ] Rotate API keys
- [ ] Review LGPD compliance
- [ ] Update security policies

---

## 11. Implementation Priority

### Immediate (Critical)
1. Configure ASAAS_API_KEY in Railway
2. Implement log sanitization
3. Add input validation to all endpoints
4. Enable webhook signature verification

### High Priority (1-2 weeks)
5. Implement idempotency checks
6. Add comprehensive security logging
7. Set up security alerting
8. Implement RBAC

### Medium Priority (1-2 months)
9. Set up secrets management
10. Implement automated key rotation
11. Conduct penetration testing
12. Full LGPD compliance audit

---

## 12. Conclusion

Security is an ongoing process, not a one-time setup. This document provides a comprehensive framework for securing the Asaas integration. Regular reviews, updates, and improvements are essential to maintaining a secure system.

**Key Takeaways**:
- ✅ Always use environment variables for credentials
- ✅ Sanitize all logs and error messages
- ✅ Implement comprehensive error handling
- ✅ Use idempotency to prevent duplicates
- ✅ Monitor and audit all security events
- ✅ Comply with LGPD and PCI DSS requirements

---

**Document Version**: 1.0
**Last Updated**: 2025-12-25
**Next Review**: 2026-03-25

