/**
 * Security Middleware for Convex Functions
 *
 * Provides OWASP-compliant security checks, rate limiting,
 * and input validation for all Convex operations.
 */

import type { MutationCtx, QueryCtx } from '../_generated/server';
import { logSecurityEvent } from './auditLogging';
import { hasAnyPermission } from './auth';
// validateInput, rateLimiters, validateFileUpload used; validationSchemas available for schema definitions
import { rateLimiters, validateFileUpload, validateInput } from './validation';

/**
 * Security configuration
 */
const SECURITY_CONFIG = {
	maxRequestSize: 10 * 1024 * 1024, // 10MB
	maxQueryResults: 1000,
	sessionTimeout: 60 * 60 * 1000, // 1 hour
	allowedOrigins: ['http://localhost:5173', 'https://portalgrupo.us', 'https://*.railway.app'],
	criticalEndpoints: ['createStudent', 'deleteStudent', 'updateStudent', 'exportStudentData'],
} as const;

interface SanitizedQueryParams {
	limit?: number;
	cursor?: string;
	startDate?: number;
	endDate?: number;
}

const CURSOR_SANITIZE_REGEX = /[^a-zA-Z0-9+/=]/g;
const SQL_INJECTION_PATTERNS = [
	/--/,
	/\/\*/,
	/\*\//,
	/;/i,
	/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
	/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
	/(\b(OR|AND)\s+'\w+'\s*=\s*'\w+')/i,
	/(1=1|1 = 1)/i,
	/(true|TRUE)/i,
];
const XSS_PATTERNS = [
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
];
const COMMAND_INJECTION_PATTERNS = [
	/;\s*(rm|del|format|mkdir|rmdir)/i,
	/\|\s*(cat|type|dir|ls)/i,
	/&&\s*(rm|del|format)/i,
	/\$\(/,
	/`[^`]*`/,
	/\${[^}]*}/,
	/[;&|`$()]/,
	/(wget|curl|nc|netcat)/i,
];
const STRING_THREAT_DETECTORS = [
	{ label: 'SQL injection', detect: detectSQLInjection },
	{ label: 'XSS', detect: detectXSS },
	{ label: 'Command injection', detect: detectCommandInjection },
];

const parseDateValue = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string') {
		const parsed = new Date(value);
		const time = parsed.getTime();
		return Number.isNaN(time) ? null : time;
	}
	return null;
};

const getLimitParam = (limit: unknown, errors: string[]): number | undefined => {
	if (limit === undefined || limit === null) return undefined;
	if (typeof limit !== 'number') {
		errors.push('Limit must be a number');
		return undefined;
	}
	if (limit > SECURITY_CONFIG.maxQueryResults || limit < 1) {
		errors.push(`Limit must be between 1 and ${SECURITY_CONFIG.maxQueryResults}`);
		return undefined;
	}
	return Math.min(limit, SECURITY_CONFIG.maxQueryResults);
};

const getCursorParam = (cursor: unknown, errors: string[]): string | undefined => {
	if (cursor === undefined || cursor === null) return undefined;
	if (typeof cursor !== 'string') {
		errors.push('Cursor must be a string');
		return undefined;
	}
	return cursor.replace(CURSOR_SANITIZE_REGEX, '');
};

const getDateRangeParams = (
	startDate: unknown,
	endDate: unknown,
	errors: string[],
): { startDate?: number; endDate?: number } => {
	if (!(startDate && endDate)) return {};
	const start = parseDateValue(startDate);
	const end = parseDateValue(endDate);

	if (start === null) {
		errors.push('Invalid startDate format');
	}
	if (end === null) {
		errors.push('Invalid endDate format');
	}
	if (start !== null && end !== null) {
		if (start > end) {
			errors.push('startDate must be before endDate');
		}
		const maxRange = 365 * 24 * 60 * 60 * 1000;
		if (end - start > maxRange) {
			errors.push('Date range cannot exceed 1 year');
		}
		if (start <= end) {
			return { startDate: start, endDate: end };
		}
	}

	return {};
};

/**
 * Request context interface
 */
export interface SecurityContext {
	actorId: string;
	actorRole: string;
	ipAddress: string;
	userAgent: string;
	timestamp: number;
	isAuthenticated: boolean;
}

/**
 * Gets security context from request
 */
async function getSecurityContext(ctx: MutationCtx | QueryCtx): Promise<SecurityContext> {
	try {
		const identity = await ctx.auth.getUserIdentity();
		const clerkId = identity?.subject ?? 'unknown';

		let role = 'unknown';
		if (identity) {
			const user = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
				.first();

			const dbRole = user?.role as string | undefined;
			const orgRole = typeof identity.org_role === 'string' ? identity.org_role : undefined;
			role = dbRole ?? orgRole ?? 'unknown';
		}

		return {
			actorId: clerkId,
			actorRole: role,
			ipAddress: 'unknown',
			userAgent: 'unknown',
			timestamp: Date.now(),
			isAuthenticated: Boolean(identity),
		};
	} catch {
		return {
			actorId: 'anonymous',
			actorRole: 'anonymous',
			ipAddress: 'unknown',
			userAgent: 'unknown',
			timestamp: Date.now(),
			isAuthenticated: false,
		};
	}
}

/**
 * NOTE: Convex mutation/query contexts don't have access to HTTP headers.
 * These functions are placeholders - for real IP/origin validation,
 * use Convex HTTP actions.
 */
function getClientIP(): string {
	return 'unknown';
}

/**
 * Validates request origin - always returns true in mutation/query context
 * since HTTP headers are not available.
 */
function validateOrigin(): boolean {
	// Convex handles authentication via JWT, origin validation is not applicable
	return true;
}

/**
 * Checks if request size is within limits
 */
function validateRequestSize(data: unknown): boolean {
	const size = JSON.stringify(data).length;
	return size <= SECURITY_CONFIG.maxRequestSize;
}

/**
 * Validates and sanitizes query parameters
 */
function validateQueryParams(params: Record<string, unknown>): {
	valid: boolean;
	sanitized: SanitizedQueryParams;
	errors: string[];
} {
	const errors: string[] = [];
	const sanitized: SanitizedQueryParams = {};

	const limitValue = getLimitParam(params.limit, errors);
	if (limitValue !== undefined) {
		sanitized.limit = limitValue;
	}

	const cursorValue = getCursorParam(params.cursor, errors);
	if (cursorValue) {
		sanitized.cursor = cursorValue;
	}

	const dateRange = getDateRangeParams(params.startDate, params.endDate, errors);
	if (dateRange.startDate !== undefined) {
		sanitized.startDate = dateRange.startDate;
	}
	if (dateRange.endDate !== undefined) {
		sanitized.endDate = dateRange.endDate;
	}

	return {
		valid: errors.length === 0,
		sanitized,
		errors,
	};
}

/**
 * Checks rate limits for different operation types
 */
function checkRateLimit(
	_ctx: MutationCtx, // Prefixed with _ to indicate intentionally unused
	operationType: 'login' | 'contact' | 'dataExport' | 'passwordReset',
	userId?: string,
): { allowed: boolean; remaining?: number; resetTime?: number } {
	const rateLimiter = rateLimiters[operationType];
	const key = userId || getClientIP();

	const allowed = rateLimiter.isAllowed(key);

	return {
		allowed,
		remaining: rateLimiter.getRemainingAttempts(key),
		resetTime: rateLimiter.getResetTime(key),
	};
}

/**
 * Validates file uploads for security
 */
function validateFileUploads(files: unknown[]): { valid: boolean; errors: string[] } {
	if (!(files && Array.isArray(files))) {
		return { valid: true, errors: [] };
	}

	const errors: string[] = [];

	for (const file of files) {
		if (!file || typeof file !== 'object') {
			errors.push('Invalid file');
			continue;
		}
		const fileData = file as { name: string; size: number; type: string };
		const validation = validateFileUpload(fileData);
		if (!validation.valid) {
			errors.push(`File ${fileData.name}: ${validation.error}`);
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Detects SQL injection patterns
 */
function detectSQLInjection(input: string): boolean {
	return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Detects XSS patterns
 */
function detectXSS(input: string): boolean {
	return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Detects command injection patterns
 */
function detectCommandInjection(input: string): boolean {
	return COMMAND_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

function addStringThreats(value: string, path: string, threats: string[]): void {
	for (const detector of STRING_THREAT_DETECTORS) {
		if (detector.detect(value)) {
			threats.push(`${detector.label} detected in ${path}`);
		}
	}
}

/**
 * Comprehensive input security validation
 */
function validateInputSecurity(input: unknown): { valid: boolean; threats: string[] } {
	const threats: string[] = [];

	const checkThreats = (value: unknown, path = '') => {
		if (typeof value === 'string') {
			addStringThreats(value, path, threats);
			return;
		}
		if (typeof value === 'object' && value !== null) {
			for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
				checkThreats(val, path ? `${path}.${key}` : key);
			}
		}
	};

	checkThreats(input);

	return { valid: threats.length === 0, threats };
}

async function enforceOrigin(ctx: MutationCtx, security: SecurityContext): Promise<void> {
	if (validateOrigin()) return;
	await logSecurityEvent(ctx, 'unauthorized_access', 'Invalid request origin', 'medium', [
		security.actorId,
	]);
	throw new Error('CORS policy violation');
}

async function enforceAuthentication(
	ctx: MutationCtx,
	security: SecurityContext,
	requireAuth: boolean,
): Promise<void> {
	if (!requireAuth || security.isAuthenticated) return;
	await logSecurityEvent(ctx, 'unauthorized_access', 'Authentication required', 'medium', [
		security.actorId,
	]);
	throw new Error('Authentication required');
}

async function enforceRoles(
	ctx: MutationCtx,
	security: SecurityContext,
	allowedRoles?: string[],
): Promise<void> {
	if (!(allowedRoles && allowedRoles.length > 0)) return;
	if (allowedRoles.includes(security.actorRole)) return;
	await logSecurityEvent(
		ctx,
		'unauthorized_access',
		`Role ${security.actorRole} not allowed`,
		'medium',
		[security.actorId],
	);
	throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
}

async function enforcePermissions(
	ctx: MutationCtx,
	security: SecurityContext,
	requiredPermissions?: string[],
): Promise<void> {
	if (!(requiredPermissions && requiredPermissions.length > 0)) return;
	const hasPerm = await hasAnyPermission(ctx, requiredPermissions);
	if (hasPerm) return;
	await logSecurityEvent(
		ctx,
		'unauthorized_access',
		`Missing required permissions: ${requiredPermissions.join(', ')}`,
		'medium',
		[security.actorId],
	);
	throw new Error(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
}

async function enforceRateLimit(
	ctx: MutationCtx,
	security: SecurityContext,
	enableRateLimit: boolean,
	operationType?: 'login' | 'contact' | 'dataExport' | 'passwordReset',
): Promise<void> {
	if (!(enableRateLimit && operationType)) return;
	const rateLimitResult = await checkRateLimit(ctx, operationType, security.actorId);
	if (rateLimitResult.allowed) return;
	await logSecurityEvent(ctx, 'suspicious_activity', 'Rate limit exceeded', 'high', [
		security.actorId,
	]);
	throw new Error(
		`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime || 0) / 1000)} seconds`,
	);
}

async function enforceRequestSize(
	ctx: MutationCtx,
	security: SecurityContext,
	data: unknown,
	maxRequestSize: number,
): Promise<void> {
	if (validateRequestSize(data)) return;
	await logSecurityEvent(ctx, 'suspicious_activity', 'Request size exceeds limit', 'medium', [
		security.actorId,
	]);
	throw new Error(`Request size exceeds maximum of ${maxRequestSize} bytes`);
}

async function enforceInputSecurity(
	ctx: MutationCtx,
	security: SecurityContext,
	data: unknown,
): Promise<void> {
	const securityCheck = validateInputSecurity(data);
	if (securityCheck.valid) return;
	await logSecurityEvent(
		ctx,
		'suspicious_activity',
		`Security threats detected: ${securityCheck.threats.join(', ')}`,
		'high',
		[security.actorId],
	);
	throw new Error('Invalid input detected');
}

async function enforceSchemaValidation(
	ctx: MutationCtx,
	security: SecurityContext,
	data: unknown,
	validationSchema?: Parameters<typeof validateInput>[0],
): Promise<void> {
	if (!validationSchema) return;
	const validation = validateInput(validationSchema, data as Record<string, unknown>);
	if (validation.success) return;
	await logSecurityEvent(
		ctx,
		'suspicious_activity',
		`Validation failed: ${validation.error}`,
		'low',
		[security.actorId],
	);
	throw new Error(`Validation failed: ${validation.error}`);
}

function getFilesFromData(data: unknown): unknown[] | null {
	if (!data || typeof data !== 'object') return null;
	const files = (data as { files?: unknown }).files;
	return Array.isArray(files) ? files : null;
}

async function enforceFileUploads(
	ctx: MutationCtx,
	security: SecurityContext,
	data: unknown,
): Promise<void> {
	const files = getFilesFromData(data);
	if (!files) return;
	const fileValidation = validateFileUploads(files);
	if (fileValidation.valid) return;
	await logSecurityEvent(
		ctx,
		'suspicious_activity',
		`File validation failed: ${fileValidation.errors.join(', ')}`,
		'medium',
		[security.actorId],
	);
	throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
}

async function logCriticalOperation(
	ctx: MutationCtx,
	security: SecurityContext,
	handlerName: string,
): Promise<void> {
	await logSecurityEvent(
		ctx,
		'suspicious_activity',
		`Critical operation initiated: ${handlerName}`,
		'low',
		[security.actorId],
	);
}

async function logHandlerError(
	ctx: MutationCtx,
	security: SecurityContext,
	error: unknown,
): Promise<void> {
	const message = error instanceof Error ? error.message : 'Unknown';
	await logSecurityEvent(ctx, 'suspicious_activity', `Handler error: ${message}`, 'medium', [
		security.actorId,
	]);
}

function enforceQueryAuthentication(security: SecurityContext, requireAuth: boolean): void {
	if (!requireAuth || security.isAuthenticated) return;
	throw new Error('Authentication required');
}

function enforceQueryRoles(security: SecurityContext, allowedRoles?: string[]): void {
	if (!(allowedRoles && allowedRoles.length > 0)) return;
	if (allowedRoles.includes(security.actorRole)) return;
	throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
}

async function enforceQueryPermissions(
	ctx: QueryCtx,
	requiredPermissions?: string[],
): Promise<void> {
	if (!(requiredPermissions && requiredPermissions.length > 0)) return;
	const hasPerm = await hasAnyPermission(ctx, requiredPermissions);
	if (hasPerm) return;
	throw new Error(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
}

function enforceQueryValidation(data: Record<string, unknown>): SanitizedQueryParams {
	const queryValidation = validateQueryParams(data);
	if (!queryValidation.valid) {
		throw new Error(`Query validation failed: ${queryValidation.errors.join(', ')}`);
	}
	return queryValidation.sanitized;
}

function enforceQuerySchema(
	validationSchema: Parameters<typeof validateInput>[0] | undefined,
	data: Record<string, unknown>,
	sanitized: SanitizedQueryParams,
): void {
	if (!validationSchema) return;
	const validation = validateInput(validationSchema, { ...data, ...sanitized });
	if (!validation.success) {
		throw new Error(`Validation failed: ${validation.error}`);
	}
}

/**
 * Security middleware wrapper for Convex functions
 */
export function withSecurity<T, R>(
	handler: (ctx: MutationCtx, data: T, security: SecurityContext) => Promise<R>,
	options: {
		requireAuth?: boolean;
		allowedRoles?: string[];
		requiredPermissions?: string[];
		operationType?: 'login' | 'contact' | 'dataExport' | 'passwordReset';
		validationSchema?: Parameters<typeof validateInput>[0];
		maxRequestSize?: number;
		enableRateLimit?: boolean;
		criticalOperation?: boolean;
	} = {},
) {
	return async (ctx: MutationCtx, data: T): Promise<R> => {
		const {
			requireAuth = true,
			allowedRoles,
			requiredPermissions,
			operationType,
			validationSchema,
			maxRequestSize = SECURITY_CONFIG.maxRequestSize,
			enableRateLimit = true,
			criticalOperation = false,
		} = options;

		// Get security context
		const securityContext = await getSecurityContext(ctx);

		await enforceOrigin(ctx, securityContext);
		await enforceAuthentication(ctx, securityContext, requireAuth);
		await enforceRoles(ctx, securityContext, allowedRoles);
		await enforcePermissions(ctx, securityContext, requiredPermissions);
		await enforceRateLimit(ctx, securityContext, enableRateLimit, operationType);
		await enforceRequestSize(ctx, securityContext, data, maxRequestSize);
		await enforceInputSecurity(ctx, securityContext, data);
		await enforceSchemaValidation(ctx, securityContext, data, validationSchema);
		await enforceFileUploads(ctx, securityContext, data);
		if (criticalOperation) {
			await logCriticalOperation(ctx, securityContext, handler.name);
		}

		// Execute the handler with security context
		try {
			return await handler(ctx, data, securityContext);
		} catch (error) {
			await logHandlerError(ctx, securityContext, error);
			throw error;
		}
	};
}

/**
 * Security middleware for query functions
 */
export function withQuerySecurity<T, R>(
	handler: (ctx: QueryCtx, data: T, security: SecurityContext) => Promise<R>,
	options: {
		requireAuth?: boolean;
		allowedRoles?: string[];
		requiredPermissions?: string[];
		validationSchema?: Parameters<typeof validateInput>[0];
		maxResults?: number;
	} = {},
) {
	return async (ctx: QueryCtx, data: T): Promise<R> => {
		const {
			requireAuth = true,
			allowedRoles,
			requiredPermissions,
			validationSchema,
			maxResults = SECURITY_CONFIG.maxQueryResults,
		} = options;

		// Get security context
		const securityContext = await getSecurityContext(ctx);

		enforceQueryAuthentication(securityContext, requireAuth);
		enforceQueryRoles(securityContext, allowedRoles);
		await enforceQueryPermissions(ctx, requiredPermissions);
		const sanitized = enforceQueryValidation(data as Record<string, unknown>);
		enforceQuerySchema(validationSchema, data as Record<string, unknown>, sanitized);

		// Execute with limited data
		const result = await handler(ctx, { ...data, ...sanitized }, securityContext);

		// Limit result size
		if (Array.isArray(result) && result.length > maxResults) {
			return result.slice(0, maxResults) as R;
		}

		return result;
	};
}

/**
 * Security headers configuration
 */
export function getSecurityHeaders(): Record<string, string> {
	return {
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
		'Content-Security-Policy':
			"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.clerk.dev https://*.convex.cloud; frame-ancestors 'none';",
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
	};
}

/**
 * Security health check
 */
export async function securityHealthCheck(ctx: QueryCtx): Promise<{
	status: 'healthy' | 'warning' | 'critical';
	issues: string[];
	metadata: Record<string, unknown>;
}> {
	const issues: string[] = [];
	const metadata: Record<string, unknown> = {};

	// Check encryption configuration
	const { validateEncryptionConfig } = await import('./encryption');
	const encryptionValidation = await validateEncryptionConfig();
	if (!encryptionValidation.valid) {
		issues.push(`Encryption: ${encryptionValidation.message}`);
	}
	metadata.encryptionConfigured = encryptionValidation.valid;

	// Check schema integrity
	try {
		await ctx.db.query('users').take(1);
		metadata.schemaIntegrity = true;
	} catch (_error) {
		issues.push('Schema integrity check failed');
		metadata.schemaIntegrity = false;
	}

	// Check recent security events
	try {
		const recentEvents = await ctx.db
			.query('lgpdAudit')
			.withIndex('by_action_type', (q) => q.eq('actionType', 'security_event'))
			.take(100);
		// Filter in memory since Convex doesn't support chained filters on different fields
		const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
		const recentSecurityEvents = recentEvents.filter((e) => e.createdAt >= last24Hours);

		metadata.recentSecurityEvents = recentSecurityEvents.length;

		if (recentEvents.length > 10) {
			issues.push('High number of recent security events');
		}
	} catch (_error) {
		issues.push('Security event monitoring failed');
		metadata.securityMonitoring = false;
	}

	// Determine overall status
	let status: 'healthy' | 'warning' | 'critical' = 'warning';
	if (issues.length === 0) {
		status = 'healthy';
	} else if (issues.some((issue) => issue.includes('critical'))) {
		status = 'critical';
	}

	return {
		status,
		issues,
		metadata,
	};
}
