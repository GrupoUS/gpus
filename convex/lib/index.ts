/**
 * Security and LGPD Compliance Library
 *
 * Central exports for all security, encryption, validation,
 * and LGPD compliance utilities.
 */

// Authentication and Authorization
export * from './auth'

// Encryption and Data Protection
export * from './encryption'

// Input Validation (core Zod schemas)
// Note: convexValidationSchemas uses simplified v.* API
export * from './validation'

// Audit Logging
export * from './auditLogging'

// LGPD Compliance
export * from './lgpdCompliance'
export * from './lgpdDataRights'

// Security Middleware
export * from './securityMiddleware'

// Security Health Monitoring
export * from './securityHealth'

// Re-export commonly used types
export type {
	ClerkIdentity,
} from './auth'

export type {
	SecurityContext,
} from './securityMiddleware'

export type {
	HealthCheckResult,
	HealthIssue,
} from './securityHealth'

