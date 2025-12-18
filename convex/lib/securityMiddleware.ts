/**
 * Security Middleware for Convex Functions
 *
 * Provides OWASP-compliant security checks, rate limiting,
 * and input validation for all Convex operations.
 */

import type { MutationCtx, QueryCtx } from '../_generated/server'
import { getClerkId as _getClerkId } from './auth'
// validateInput, rateLimiters, validateFileUpload used; validationSchemas available for schema definitions
import { validateInput, rateLimiters, validateFileUpload, validationSchemas as _validationSchemas } from './validation'
import { logSecurityEvent } from './auditLogging'
// hashSensitiveData available for security hashing if needed
import { hashSensitiveData as _hashSensitiveData } from './encryption'

/**
 * Security configuration
 */
const SECURITY_CONFIG = {
	maxRequestSize: 10 * 1024 * 1024, // 10MB
	maxQueryResults: 1000,
	sessionTimeout: 60 * 60 * 1000, // 1 hour
	allowedOrigins: [
		'http://localhost:5173',
		'https://portalgrupo.us',
		'https://*.railway.app'
	],
	criticalEndpoints: [
		'createStudent',
		'deleteStudent',
		'updateStudent',
		'exportStudentData'
	],
} as const

/**
 * Request context interface
 */
export interface SecurityContext {
	actorId: string
	actorRole: string
	ipAddress: string
	userAgent: string
	timestamp: number
	isAuthenticated: boolean
}

/**
 * Gets security context from request
 */
async function getSecurityContext(ctx: MutationCtx | QueryCtx): Promise<SecurityContext> {
	try {
		const identity = await ctx.auth.getUserIdentity()
		const clerkId = identity?.subject ?? 'unknown'

		let role = 'unknown'
		if (identity) {
			const user = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
				.first()

			const dbRole = typeof (user as { role?: unknown } | null)?.role === 'string'
				? ((user as { role: string }).role)
				: undefined
			const orgRole = typeof identity.org_role === 'string' ? identity.org_role : undefined
			role = dbRole ?? orgRole ?? 'unknown'
		}

		return {
			actorId: clerkId,
			actorRole: role,
			ipAddress: 'unknown',
			userAgent: 'unknown',
			timestamp: Date.now(),
			isAuthenticated: Boolean(identity),
		}
	} catch {
		return {
			actorId: 'anonymous',
			actorRole: 'anonymous',
			ipAddress: 'unknown',
			userAgent: 'unknown',
			timestamp: Date.now(),
			isAuthenticated: false,
		}
	}
}

/**
 * NOTE: Convex mutation/query contexts don't have access to HTTP headers.
 * These functions are placeholders - for real IP/origin validation,
 * use Convex HTTP actions.
 */
function getClientIP(): string {
	return 'unknown'
}

/**
 * Validates request origin - always returns true in mutation/query context
 * since HTTP headers are not available.
 */
function validateOrigin(): boolean {
	// Convex handles authentication via JWT, origin validation is not applicable
	return true
}

/**
 * Checks if request size is within limits
 */
function validateRequestSize(data: any): boolean {
	const size = JSON.stringify(data).length
	return size <= SECURITY_CONFIG.maxRequestSize
}

/**
 * Validates and sanitizes query parameters
 */
function validateQueryParams(params: any): { valid: boolean; sanitized: any; errors: string[] } {
	const errors: string[] = []
	const sanitized: any = {}

	// Limit query result size
	if (params.limit && (params.limit > SECURITY_CONFIG.maxQueryResults || params.limit < 1)) {
		errors.push(`Limit must be between 1 and ${SECURITY_CONFIG.maxQueryResults}`)
	} else if (params.limit) {
		sanitized.limit = Math.min(params.limit, SECURITY_CONFIG.maxQueryResults)
	}

	// Validate cursor
	if (params.cursor && typeof params.cursor !== 'string') {
		errors.push('Cursor must be a string')
	} else if (params.cursor) {
		// Sanitize cursor (base64 or hex)
		sanitized.cursor = params.cursor.replace(/[^a-zA-Z0-9+/=]/g, '')
	}

	// Validate date ranges
	if (params.startDate && params.endDate) {
		const start = new Date(params.startDate)
		const end = new Date(params.endDate)

		if (isNaN(start.getTime())) {
			errors.push('Invalid startDate format')
		}

		if (isNaN(end.getTime())) {
			errors.push('Invalid endDate format')
		}

		if (start > end) {
			errors.push('startDate must be before endDate')
		}

		// Limit date range to 1 year
		const maxRange = 365 * 24 * 60 * 60 * 1000
		if (end.getTime() - start.getTime() > maxRange) {
			errors.push('Date range cannot exceed 1 year')
		}

		const isValidDateRange = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end
		if (isValidDateRange) {
			sanitized.startDate = start.getTime()
			sanitized.endDate = end.getTime()
		}
	}

	return {
		valid: errors.length === 0,
		sanitized,
		errors
	}
}

/**
 * Checks rate limits for different operation types
 */
async function checkRateLimit(
	_ctx: MutationCtx, // Prefixed with _ to indicate intentionally unused
	operationType: 'login' | 'contact' | 'dataExport' | 'passwordReset',
	userId?: string
): Promise<{ allowed: boolean; remaining?: number; resetTime?: number }> {
	const rateLimiter = rateLimiters[operationType]
	const key = userId || getClientIP()

	const allowed = rateLimiter.isAllowed(key)

	return {
		allowed,
		remaining: rateLimiter.getRemainingAttempts(key),
		resetTime: rateLimiter.getResetTime(key),
	}
}

/**
 * Validates file uploads for security
 */
function validateFileUploads(files: any[]): { valid: boolean; errors: string[] } {
	if (!files || !Array.isArray(files)) {
		return { valid: true, errors: [] }
	}

	const errors: string[] = []

	for (const file of files) {
		const validation = validateFileUpload(file)
		if (!validation.valid) {
			errors.push(`File ${file.name}: ${validation.error}`)
		}
	}

	return { valid: errors.length === 0, errors }
}

/**
 * Detects SQL injection patterns
 */
function detectSQLInjection(input: string): boolean {
	const patterns = [
		/--/,
		/\/\*/,
		/\*\//,
		/;/i,
		/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
		/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
		/(\b(OR|AND)\s+\'\w+\'\s*=\s*\'\w+\')/i,
		/(1=1|1 = 1)/i,
		/(true|TRUE)/i,
	]

	return patterns.some(pattern => pattern.test(input))
}

/**
 * Detects XSS patterns
 */
function detectXSS(input: string): boolean {
	const patterns = [
		/<script/i,
		/<iframe/i,
		/<object/i,
		/<embed/i,
		/<form/i,
		/on\w+\s*=/i,
		/javascript:/i,
		/vbscript:/i,
		/data:/i,
		/<\s*\/?\s*\w+\s+[^>]*on\w+\s*=/i,
	]

	return patterns.some(pattern => pattern.test(input))
}

/**
 * Detects command injection patterns
 */
function detectCommandInjection(input: string): boolean {
	const patterns = [
		/;\s*(rm|del|format|mkdir|rmdir)/i,
		/\|\s*(cat|type|dir|ls)/i,
		/&&\s*(rm|del|format)/i,
		/\$\(/,
		/`[^`]*`/,
		/\${[^}]*}/,
		/[;&|`$()]/,
		/(wget|curl|nc|netcat)/i,
	]

	return patterns.some(pattern => pattern.test(input))
}

/**
 * Comprehensive input security validation
 */
function validateInputSecurity(input: any): { valid: boolean; threats: string[] } {
	const threats: string[] = []

	const checkThreats = (value: any, path: string = '') => {
		if (typeof value === 'string') {
			if (detectSQLInjection(value)) {
				threats.push(`SQL injection detected in ${path}`)
			}
			if (detectXSS(value)) {
				threats.push(`XSS detected in ${path}`)
			}
			if (detectCommandInjection(value)) {
				threats.push(`Command injection detected in ${path}`)
			}
		} else if (typeof value === 'object' && value !== null) {
			for (const [key, val] of Object.entries(value)) {
				checkThreats(val, path ? `${path}.${key}` : key)
			}
		}
	}

	checkThreats(input)

	return { valid: threats.length === 0, threats }
}

/**
 * Security middleware wrapper for Convex functions
 */
export function withSecurity<T, R>(
	handler: (ctx: MutationCtx, data: T, security: SecurityContext) => Promise<R>,
	options: {
		requireAuth?: boolean
		allowedRoles?: string[]
		operationType?: 'login' | 'contact' | 'dataExport' | 'passwordReset'
		validationSchema?: any
		maxRequestSize?: number
		enableRateLimit?: boolean
		criticalOperation?: boolean
	} = {}
) {
	return async (ctx: MutationCtx, data: T): Promise<R> => {
		const {
			requireAuth = true,
			allowedRoles,
			operationType,
			validationSchema,
			maxRequestSize = SECURITY_CONFIG.maxRequestSize,
			enableRateLimit = true,
			criticalOperation = false,
		} = options

		// Get security context
		const securityContext = await getSecurityContext(ctx)

		// Origin validation
		if (!validateOrigin()) {
			await logSecurityEvent(ctx, 'unauthorized_access', 'Invalid request origin', 'medium', [securityContext.actorId])
			throw new Error('CORS policy violation')
		}

		// Authentication check
		if (requireAuth && !securityContext.isAuthenticated) {
			await logSecurityEvent(ctx, 'unauthorized_access', 'Authentication required', 'medium', [securityContext.actorId])
			throw new Error('Authentication required')
		}

		// Role validation
		if (allowedRoles && allowedRoles.length > 0) {
			if (!allowedRoles.includes(securityContext.actorRole)) {
				await logSecurityEvent(ctx, 'unauthorized_access', `Role ${securityContext.actorRole} not allowed`, 'medium', [securityContext.actorId])
				throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
			}
		}

		// Rate limiting
		if (enableRateLimit && operationType) {
			const rateLimitResult = await checkRateLimit(ctx, operationType, securityContext.actorId)

			if (!rateLimitResult.allowed) {
				await logSecurityEvent(ctx, 'suspicious_activity', 'Rate limit exceeded', 'high', [securityContext.actorId])
				throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime || 0) / 1000)} seconds`)
			}
		}

		// Request size validation
		if (!validateRequestSize(data)) {
			await logSecurityEvent(ctx, 'suspicious_activity', 'Request size exceeds limit', 'medium', [securityContext.actorId])
			throw new Error(`Request size exceeds maximum of ${maxRequestSize} bytes`)
		}

		// Input security validation
		const securityCheck = validateInputSecurity(data)
		if (!securityCheck.valid) {
			await logSecurityEvent(ctx, 'suspicious_activity', `Security threats detected: ${securityCheck.threats.join(', ')}`, 'high', [securityContext.actorId])
			throw new Error('Invalid input detected')
		}

		// Schema validation
		if (validationSchema) {
			const validation = validateInput(validationSchema, data)
			if (!validation.success) {
				await logSecurityEvent(ctx, 'suspicious_activity', `Validation failed: ${validation.error}`, 'low', [securityContext.actorId])
				throw new Error(`Validation failed: ${validation.error}`)
			}
		}

		// File upload validation
		const dataWithFiles = data as { files?: unknown[] }
		if (dataWithFiles.files && Array.isArray(dataWithFiles.files)) {
			const fileValidation = validateFileUploads(dataWithFiles.files as { name: string; size: number; type: string }[])
			if (!fileValidation.valid) {
				await logSecurityEvent(ctx, 'suspicious_activity', `File validation failed: ${fileValidation.errors.join(', ')}`, 'medium', [securityContext.actorId])
				throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`)
			}
		}

		// Log critical operations
		if (criticalOperation) {
			await logSecurityEvent(ctx, 'suspicious_activity', `Critical operation initiated: ${handler.name}`, 'low', [securityContext.actorId])
		}

		// Execute the handler with security context
		try {
			return await handler(ctx, data, securityContext)
		} catch (error) {
			// Log errors for security monitoring
			await logSecurityEvent(ctx, 'suspicious_activity', `Handler error: ${error instanceof Error ? error.message : 'Unknown'}`, 'medium', [securityContext.actorId])
			throw error
		}
	}
}

/**
 * Security middleware for query functions
 */
export function withQuerySecurity<T, R>(
	handler: (ctx: QueryCtx, data: T, security: SecurityContext) => Promise<R>,
	options: {
		requireAuth?: boolean
		allowedRoles?: string[]
		validationSchema?: any
		maxResults?: number
	} = {}
) {
	return async (ctx: QueryCtx, data: T): Promise<R> => {
		const {
			requireAuth = true,
			allowedRoles,
			validationSchema,
			maxResults = SECURITY_CONFIG.maxQueryResults,
		} = options

		// Get security context
		const securityContext = await getSecurityContext(ctx)

		// Authentication check
		// Authentication check
		if (requireAuth && !securityContext.isAuthenticated) {
			throw new Error('Authentication required')
		}

		// Role validation
		if (allowedRoles && allowedRoles.length > 0) {
			if (!allowedRoles.includes(securityContext.actorRole)) {
				throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
			}
		}

		// Query parameter validation
		const queryValidation = validateQueryParams(data)
		if (!queryValidation.valid) {
			throw new Error(`Query validation failed: ${queryValidation.errors.join(', ')}`)
		}

		// Schema validation
		if (validationSchema) {
			const validation = validateInput(validationSchema, { ...data, ...queryValidation.sanitized })
			if (!validation.success) {
				throw new Error(`Validation failed: ${validation.error}`)
			}
		}

		// Execute with limited data
		const result = await handler(ctx, { ...data, ...queryValidation.sanitized }, securityContext)

		// Limit result size
		if (Array.isArray(result) && result.length > maxResults) {
			return result.slice(0, maxResults) as R
		}

		return result
	}
}

/**
 * Security headers configuration
 */
export function getSecurityHeaders(): Record<string, string> {
	return {
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
		'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.clerk.dev https://*.convex.cloud; frame-ancestors 'none';",
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
	}
}

/**
 * Security health check
 */
export async function securityHealthCheck(ctx: QueryCtx): Promise<{
	status: 'healthy' | 'warning' | 'critical'
	issues: string[]
	metadata: any
}> {
	const issues: string[] = []
	const metadata: any = {}

	// Check encryption configuration
	const { validateEncryptionConfig } = await import('./encryption')
	const encryptionValidation = await validateEncryptionConfig()
	if (!encryptionValidation.valid) {
		issues.push(`Encryption: ${encryptionValidation.message}`)
	}
	metadata.encryptionConfigured = encryptionValidation.valid

	// Check schema integrity
	try {
		await ctx.db.query('users').take(1)
		metadata.schemaIntegrity = true
	} catch (error) {
		issues.push('Schema integrity check failed')
		metadata.schemaIntegrity = false
	}

	// Check recent security events
	try {
		const recentEvents = await ctx.db
			.query('lgpdAudit')
			.withIndex('by_action_type', q => q.eq('actionType', 'security_event'))
			.take(100)
		// Filter in memory since Convex doesn't support chained filters on different fields
		const last24Hours = Date.now() - 24 * 60 * 60 * 1000
		const recentSecurityEvents = recentEvents.filter(e => e.createdAt >= last24Hours)

		metadata.recentSecurityEvents = recentSecurityEvents.length

		if (recentEvents.length > 10) {
			issues.push('High number of recent security events')
		}
	} catch (error) {
		issues.push('Security event monitoring failed')
		metadata.securityMonitoring = false
	}

	// Determine overall status
	const status = issues.length === 0 ? 'healthy' :
					issues.some(issue => issue.includes('critical')) ? 'critical' : 'warning'

	return {
		status,
		issues,
		metadata
	}
}
