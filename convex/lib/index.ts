/**
 * Security and LGPD Compliance Library
 *
 * Central exports for all security, encryption, validation,
 * and LGPD compliance utilities.
 *
 * NOTE: Some modules are commented out due to TypeScript compatibility
 * issues with Convex's runtime context (e.g., ctx.headers is not available).
 * These modules need refactoring before they can be enabled.
 */

// Authentication and Authorization
export * from './auth'

// Encryption and Data Protection
export * from './encryption'

// Input Validation (core Zod schemas)
// Note: convexValidationSchemas uses simplified v.* API
export * from './validation'

// === MODULES WITH CONVEX API COMPATIBILITY ISSUES ===
// These modules use ctx.headers which is not available in Convex.
// Uncomment when refactored to use Convex-compatible patterns.

// Audit Logging - uses ctx.headers for IP/UserAgent
// export * from './audit-logging'

// LGPD Compliance - depends on audit-logging
// export * from './lgpd-compliance'
// export * from './lgpd-data-rights'

// Security Middleware - uses ctx.headers
// export * from './security-middleware'

// Security Health Monitoring - depends on audit-logging
// export * from './security-health'

// Re-export commonly used types
export type {
	ClerkIdentity,
} from './auth'

// Commented out - depends on security-middleware
// export type {
// 	SecurityContext,
// } from './security-middleware'

// Commented out - depends on security-health
// export type {
// 	HealthCheckResult,
// 	HealthIssue,
// } from './security-health'
