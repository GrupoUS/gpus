/**
 * Security Health Check System
 * 
 * Provides comprehensive security monitoring and health checks
 * for LGPD compliance and overall system security.
 */

import type { QueryCtx, MutationCtx } from '../_generated/server'
import { validateEncryptionConfig } from './encryption'
import { securityHealthCheck } from './security-middleware'
import { getAuditLogs } from './audit-logging'

/**
 * Health check result interface
 */
export interface HealthCheckResult {
	status: 'healthy' | 'warning' | 'critical'
	score: number // 0-100
	issues: HealthIssue[]
	recommendations: string[]
	metadata: any
	timestamp: number
}

export interface HealthIssue {
	level: 'low' | 'medium' | 'high' | 'critical'
	category: 'encryption' | 'authentication' | 'authorization' | 'data_protection' | 'monitoring'
	description: string
	remediation: string
	resolved: boolean
}

/**
 * Performs comprehensive security health check
 */
export async function performSecurityHealthCheck(ctx: QueryCtx): Promise<HealthCheckResult> {
	const timestamp = Date.now()
	const issues: HealthIssue[] = []
	const recommendations: string[] = []
	let totalScore = 100

	// 1. Encryption Configuration Check
	const encryptionResult = await checkEncryptionSecurity(ctx)
	issues.push(...encryptionResult.issues)
	recommendations.push(...encryptionResult.recommendations)
	totalScore -= encryptionResult.scoreDeduction

	// 2. Authentication and Authorization Check
	const authResult = await checkAuthSecurity(ctx)
	issues.push(...authResult.issues)
	recommendations.push(...authResult.recommendations)
	totalScore -= authResult.scoreDeduction

	// 3. Data Protection Check
	const dataResult = await checkDataProtection(ctx)
	issues.push(...dataResult.issues)
	recommendations.push(...dataResult.recommendations)
	totalScore -= dataResult.scoreDeduction

	// 4. Monitoring and Logging Check
	const monitoringResult = await checkMonitoringSecurity(ctx)
	issues.push(...monitoringResult.issues)
	recommendations.push(...monitoringResult.recommendations)
	totalScore -= monitoringResult.scoreDeduction

	// 5. LGPD Compliance Check
	const lgpdResult = await checkLgpdCompliance(ctx)
	issues.push(...lgpdResult.issues)
	recommendations.push(...lgpdResult.recommendations)
	totalScore -= lgpdResult.scoreDeduction

	// Calculate overall status
	const status = calculateOverallStatus(issues, totalScore)
	
	return {
		status,
		score: Math.max(0, Math.min(100, totalScore)),
		issues: issues.filter(issue => !issue.resolved),
		recommendations: [...new Set(recommendations)], // Remove duplicates
		metadata: {
			encryptionHealth: encryptionResult.healthy,
			authHealth: authResult.healthy,
			dataHealth: dataResult.healthy,
			monitoringHealth: monitoringResult.healthy,
			lgpdHealth: lgpdResult.healthy,
		},
		timestamp,
	}
}

/**
 * Checks encryption security
 */
async function checkEncryptionSecurity(ctx: QueryCtx): Promise<{
	issues: HealthIssue[]
	recommendations: string[]
	scoreDeduction: number
	healthy: boolean
}> {
	const issues: HealthIssue[] = []
	const recommendations: string[] = []
	let scoreDeduction = 0

	// Validate encryption configuration
	const encryptionValidation = validateEncryptionConfig()
	if (!encryptionValidation.valid) {
		issues.push({
			level: 'critical',
			category: 'encryption',
			description: `Encryption configuration failed: ${encryptionValidation.message}`,
			remediation: 'Set ENCRYPTION_KEY environment variable with at least 32 characters',
			resolved: false,
		})
		recommendations.push('Configure ENCRYPTION_KEY environment variable for LGPD compliance')
		scoreDeduction += 40
	}

	// Check if students have encrypted CPFs
	const studentsWithCpf = await ctx.db
		.query('students')
		.filter(q => q.and(
			q.neq(q.field('cpf'), undefined),
			q.eq(q.field('encryptedCPF'), undefined)
		))
		.take(10)

	if (studentsWithCpf.length > 0) {
		issues.push({
			level: 'high',
			category: 'data_protection',
			description: `${studentsWithCpf.length} students have unencrypted CPFs`,
			remediation: 'Encrypt all PII fields in student records',
			resolved: false,
		})
		recommendations.push('Run PII encryption migration for existing student records')
		scoreDeduction += 25
	}

	// Check if encryption key is rotated periodically (basic check)
	const keyAge = getEncryptionKeyAge()
	if (keyAge > 365) { // Older than 1 year
		issues.push({
			level: 'medium',
			category: 'encryption',
			description: `Encryption key is ${keyAge} days old (recommended: <365 days)`,
			remediation: 'Rotate encryption keys annually and implement key rotation procedure',
			resolved: false,
		})
		recommendations.push('Implement annual encryption key rotation policy')
		scoreDeduction += 10
	}

	return {
		issues,
		recommendations,
		scoreDeduction,
		healthy: issues.length === 0,
	}
}

/**
 * Checks authentication and authorization security
 */
async function checkAuthSecurity(ctx: QueryCtx): Promise<{
	issues: HealthIssue[]
	recommendations: string[]
	scoreDeduction: number
	healthy: boolean
}> {
	const issues: HealthIssue[] = []
	const recommendations: string[] = []
	let scoreDeduction = 0

	// Check for users without proper roles
	const usersWithoutRoles = await ctx.db
		.query('users')
		.filter(q => q.or(
			q.eq(q.field('role'), undefined),
			q.eq(q.field('role'), '')
		))
		.take(10)

	if (usersWithoutRoles.length > 0) {
		issues.push({
			level: 'medium',
			category: 'authorization',
			description: `${usersWithoutRoles.length} users without proper role assignments`,
			remediation: 'Assign appropriate roles to all system users',
			resolved: false,
		})
		recommendations.push('Review and assign proper roles to all system users')
		scoreDeduction += 15
	}

	// Check for inactive users that still have access
	const inactiveUsers = await ctx.db
		.query('users')
		.filter(q => q.and(
			q.eq(q.field('isActive'), false),
			q.neq(q.field('clerkId'), undefined)
		))
		.take(10)

	if (inactiveUsers.length > 0) {
		issues.push({
			level: 'low',
			category: 'authentication',
			description: `${inactiveUsers.length} inactive users in system`,
			remediation: 'Consider removing or suspending inactive user accounts',
			resolved: false,
		})
		recommendations.push('Implement periodic review of inactive user accounts')
		scoreDeduction += 5
	}

	// Check for users without organization assignments (if multi-tenant)
	const usersWithoutOrg = await ctx.db
		.query('users')
		.filter(q => q.and(
			q.eq(q.field('organizationId'), undefined),
			q.neq(q.field('role'), 'admin') // Admins might be org-independent
		))
		.take(10)

	if (usersWithoutOrg.length > 0) {
		issues.push({
			level: 'medium',
			category: 'authorization',
			description: `${usersWithoutOrg.length} users without organization assignment`,
			remediation: 'Assign organizations to all non-admin users',
			resolved: false,
		})
		recommendations.push('Ensure all users are assigned to appropriate organizations')
		scoreDeduction += 10
	}

	return {
		issues,
		recommendations,
		scoreDeduction,
		healthy: issues.length === 0,
	}
}

/**
 * Checks data protection measures
 */
async function checkDataProtection(ctx: QueryCtx): Promise<{
	issues: HealthIssue[]
	recommendations: string[]
	scoreDeduction: number
	healthy: boolean
}> {
	const issues: HealthIssue[] = []
	const recommendations: string[] = []
	let scoreDeduction = 0

	// Check for students without retention policies
	const studentsWithoutRetention = await ctx.db
		.query('students')
		.filter(q => q.eq(q.field('dataRetentionUntil'), undefined))
		.take(10)

	if (studentsWithoutRetention.length > 0) {
		issues.push({
			level: 'high',
			category: 'data_protection',
			description: `${studentsWithoutRetention.length} students without data retention policies`,
			remediation: 'Set data retention periods for all student records',
			resolved: false,
		})
		recommendations.push('Implement data retention policies for all student records')
		scoreDeduction += 20
	}

	// Check for expired data that should be deleted
	const expiredData = await ctx.db
		.query('students')
		.filter(q => q.and(
			q.neq(q.field('dataRetentionUntil'), undefined),
			q.lt(q.field('dataRetentionUntil'), Date.now())
		))
		.take(10)

	if (expiredData.length > 0) {
		issues.push({
			level: 'medium',
			category: 'data_protection',
			description: `${expiredData.length} students with expired retention periods`,
			remediation: 'Implement automated data deletion for expired records',
			resolved: false,
		})
		recommendations.push('Implement automated data deletion for expired retention periods')
		scoreDeduction += 15
	}

	// Check for students without consent records
	const studentsWithoutConsent = await ctx.db
		.query('lgpdConsent')
		.collect()
	
	const uniqueStudentsWithConsent = new Set(studentsWithoutConsent.map(c => c.studentId.toString()))
	const totalStudents = await ctx.db.query('students').take(1000)
	
	const studentsWithoutConsentCount = totalStudents.length - uniqueStudentsWithConsent.size
	if (studentsWithoutConsentCount > 5) {
		issues.push({
			level: 'high',
			category: 'data_protection',
			description: `Approximately ${studentsWithoutConsentCount} students without consent records`,
			remediation: 'Ensure all students have proper LGPD consent records',
			resolved: false,
		})
		recommendations.push('Create consent records for all existing students')
		scoreDeduction += 25
	}

	return {
		issues,
		recommendations,
		scoreDeduction,
		healthy: issues.length === 0,
	}
}

/**
 * Checks monitoring and logging security
 */
async function checkMonitoringSecurity(ctx: QueryCtx): Promise<{
	issues: HealthIssue[]
	recommendations: string[]
	scoreDeduction: number
	healthy: boolean
}> {
	const issues: HealthIssue[] = []
	const recommendations: string[] = []
	let scoreDeduction = 0

	// Check for recent security events
	const recentSecurityEvents = await getAuditLogs(ctx, {
		actionType: 'security_event',
		startDate: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
	})

	if (recentSecurityEvents.length > 5) {
		issues.push({
			level: 'high',
			category: 'monitoring',
			description: `${recentSecurityEvents.length} security events in last 24 hours`,
			remediation: 'Investigate and address recent security events',
			resolved: false,
		})
		recommendations.push('Review recent security events and implement preventive measures')
		scoreDeduction += 20
	}

	// Check audit log coverage
	const totalStudents = await ctx.db.query('students').take(1000)
	const recentAuditLogs = await getAuditLogs(ctx, {
		startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
	})

	if (recentAuditLogs.length < totalStudents.length * 0.1) { // Less than 10% coverage
		issues.push({
			level: 'medium',
			category: 'monitoring',
			description: 'Low audit log coverage for data operations',
			remediation: 'Ensure comprehensive audit logging for all data operations',
			resolved: false,
		})
		recommendations.push('Implement comprehensive audit logging for all data operations')
		scoreDeduction += 15
	}

	// Check for missing audit log types
	const auditLogTypes = new Set(recentAuditLogs.map(log => log.actionType))
	const requiredTypes = ['data_creation', 'data_modification', 'data_access', 'data_deletion']
	
	const missingTypes = requiredTypes.filter(type => !auditLogTypes.has(type))
	if (missingTypes.length > 0) {
		issues.push({
			level: 'medium',
			category: 'monitoring',
			description: `Missing audit log types: ${missingTypes.join(', ')}`,
			remediation: 'Implement audit logging for all required data operation types',
			resolved: false,
		})
		recommendations.push(`Add audit logging for: ${missingTypes.join(', ')}`)
		scoreDeduction += 10
	}

	return {
		issues,
		recommendations,
		scoreDeduction,
		healthy: issues.length === 0,
	}
}

/**
 * Checks LGPD compliance
 */
async function checkLgpdCompliance(ctx: QueryCtx): Promise<{
	issues: HealthIssue[]
	recommendations: string[]
	scoreDeduction: number
	healthy: boolean
}> {
	const issues: HealthIssue[] = []
	const recommendations: string[] = []
	let scoreDeduction = 0

	// Check for LGPD retention policies
	const retentionPolicies = await ctx.db.query('lgpdRetention').collect()
	if (retentionPolicies.length === 0) {
		issues.push({
			level: 'critical',
			category: 'data_protection',
			description: 'No LGPD retention policies configured',
			remediation: 'Configure retention policies for all data categories',
			resolved: false,
		})
		recommendations.push('Create LGPD retention policies for all data categories')
		scoreDeduction += 35
	}

	// Check for pending LGPD requests
	const pendingLgpdRequests = await ctx.db
		.query('lgpdRequests')
		.filter(q => q.eq('status', 'pending'))
		.take(10)

	if (pendingLgpdRequests.length > 0) {
		issues.push({
			level: 'high',
			category: 'data_protection',
			description: `${pendingLgpdRequests.length} pending LGPD data subject requests`,
			remediation: 'Process all pending LGPD requests within legal deadlines',
			resolved: false,
		})
		recommendations.push('Process pending LGPD data subject requests immediately')
		scoreDeduction += 25
	}

	// Check for data breach records
	const recentBreachRecords = await ctx.db
		.query('lgpdDataBreach')
		.filter(q => q.gte(q.field('detectedAt'), Date.now() - 30 * 24 * 60 * 60 * 1000))
		.collect()

	if (recentBreachRecords.length > 0) {
		issues.push({
			level: 'critical',
			category: 'data_protection',
			description: `${recentBreachRecords.length} data breach events in last 30 days`,
			remediation: 'Address all data breach incidents and implement preventive measures',
			resolved: false,
		})
		recommendations.push('Address data breach incidents and improve security measures')
		scoreDeduction += 30
	}

	return {
		issues,
		recommendations,
		scoreDeduction,
		healthy: issues.length === 0,
	}
}

/**
 * Calculates overall health status
 */
function calculateOverallStatus(issues: HealthIssue[], score: number): 'healthy' | 'warning' | 'critical' {
	const criticalIssues = issues.filter(issue => issue.level === 'critical' && !issue.resolved)
	const highIssues = issues.filter(issue => issue.level === 'high' && !issue.resolved)
	
	if (criticalIssues.length > 0 || score < 50) {
		return 'critical'
	}
	
	if (highIssues.length > 0 || score < 75) {
		return 'warning'
	}
	
	return 'healthy'
}

/**
 * Gets encryption key age in days
 */
function getEncryptionKeyAge(): number {
	const key = process.env.ENCRYPTION_KEY
	if (!key) {
		return 0
	}
	
	// This is a simplified check - in production, track key creation dates
	return 180 // Assume 6 months old for demo
}

/**
 * Creates security health check alert
 */
export async function createSecurityAlert(
	ctx: MutationCtx,
	healthResult: HealthCheckResult
): Promise<string> {
	if (healthResult.status === 'healthy') {
		// Don't create alerts for healthy systems
		return ''
	}
	
	const alertMessage = `Security Health Check: ${healthResult.status.toUpperCase()} - Score: ${healthResult.score}/100`
	
	// Create audit log entry for security alert
	const auditId = await ctx.db.insert('lgpdAudit', {
		actionType: 'security_event',
		actorId: 'system',
		dataCategory: 'security_monitoring',
		description: alertMessage,
		metadata: {
			healthResult,
			issuesCount: healthResult.issues.length,
			criticalIssues: healthResult.issues.filter(i => i.level === 'critical').length,
		},
		processingPurpose: 'security monitoring',
		legalBasis: 'obrigação legal de segurança',
		createdAt: Date.now(),
	})
	
	return auditId
}

/**
 * Generates security compliance report
 */
export function generateSecurityReport(healthResult: HealthCheckResult): string {
	const { status, score, issues, recommendations, metadata } = healthResult
	
	return `
# SECURITY HEALTH REPORT

**Overall Status**: ${status.toUpperCase()}
**Security Score**: ${score}/100
**Generated**: ${new Date(healthResult.timestamp).toLocaleString('pt-BR')}

## Issues Summary

${issues.length === 0 ? '✅ No critical security issues found' : ''}

${issues.map(issue => `
### ${issue.level.toUpperCase()}: ${issue.category}
**Description**: ${issue.description}
**Remediation**: ${issue.remediation}
**Status**: ${issue.resolved ? '✅ Resolved' : '⚠️ Open'}
`).join('')}

## Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## Component Health

- **Encryption**: ${metadata.encryptionHealth ? '✅ Healthy' : '❌ Issues Found'}
- **Authentication**: ${metadata.authHealth ? '✅ Healthy' : '❌ Issues Found'}
- **Data Protection**: ${metadata.dataHealth ? '✅ Healthy' : '❌ Issues Found'}
- **Monitoring**: ${metadata.monitoringHealth ? '✅ Healthy' : '❌ Issues Found'}
- **LGPD Compliance**: ${metadata.lgpdHealth ? '✅ Healthy' : '❌ Issues Found'}

## Next Steps

1. Address all critical and high-priority issues immediately
2. Implement recommended security improvements
3. Schedule regular security health checks
4. Monitor security alerts and incidents

---

*Report generated by LGPD-Compliant Security Monitoring System*
	`.trim()
}
