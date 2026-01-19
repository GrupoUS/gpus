/**
 * Security and LGPD Compliance Library
 *
 * Central exports for all security, encryption, validation,
 * and LGPD compliance utilities.
 */

// Audit Logging
export * from './auditLogging';
// Re-export commonly used types
export type { ClerkIdentity } from './auth';
// Authentication and Authorization
export * from './auth';
// Configuration
export * from './config';
// Encryption and Data Protection
export * from './encryption';
// LGPD Compliance
export * from './lgpdCompliance';
export * from './lgpdDataRights';
export type {
	HealthCheckResult,
	HealthIssue,
} from './securityHealth';
// Security Health Monitoring
export * from './securityHealth';
export type { SecurityContext } from './securityMiddleware';
// Security Middleware
export * from './securityMiddleware';
// Input Validation (core Zod schemas)
// Note: convexValidationSchemas uses simplified v.* API
export * from './validation';
