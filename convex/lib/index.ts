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

// Input Validation
export * from './validation'

// Audit Logging
export * from './audit-logging'

// LGPD Compliance
export * from './lgpd-compliance'
export * from './lgpd-data-rights'

// Security Middleware
export * from './security-middleware'

// Security Health Monitoring
export * from './security-health'

// Re-export commonly used types
export type {
	ClerkIdentity,
} from './auth'

export type {
	SecurityContext,
} from './security-middleware'

export type {
	HealthCheckResult,
	HealthIssue,
} from './security-health'
