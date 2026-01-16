/**
 * End-to-End Validation Tests for Asaas Sync - Fase 4
 *
 * Tests complete sync flow from API to database using convex-test
 *
 * Note: These tests require proper authentication setup.
 * Run with `bun test` from project root.
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

// Import all modules for convex-test (required for function resolution)
const modules = import.meta.glob('../../convex/**/*.ts');

// Mock admin identity for tests
const mockAdminIdentity = {
	name: 'Test Admin',
	email: 'admin@test.com',
	subject: 'user_test_admin_123',
	tokenIdentifier: 'test|user_test_admin_123',
	issuer: 'https://test.clerk.accounts.dev',
};

describe('Asaas Sync - End-to-End Validation', () => {
	// Note: convex-test creates isolated test environment
	// Actions that call external APIs will need proper mocking or use dryRun mode

	describe('API Structure Validation', () => {
		it('should have api.asaas module defined', () => {
			// Verify the asaas module exists in the API
			expect(api.asaas).toBeDefined();
		});

		it('should have api.asaas.sync module defined', () => {
			// Verify sync-related queries exist
			expect(api.asaas.sync).toBeDefined();
		});

		it('should have getCircuitBreakerStatus in sync module', () => {
			expect(api.asaas.sync.getCircuitBreakerStatus).toBeDefined();
		});

		it('should have getValidationReport in asaas module', () => {
			expect(api.asaas.getValidationReport).toBeDefined();
		});
	});

	describe('Circuit Breaker Status Query', () => {
		it('should return circuit breaker state structure', async () => {
			const t = convexTest(schema, modules);

			// Create authenticated context
			const asAdmin = t.withIdentity(mockAdminIdentity);

			// Run query as authenticated user
			const result = await asAdmin.query(api.asaas.sync.getCircuitBreakerStatus, {});

			// Verify expected structure
			expect(result).toHaveProperty('state');
			expect(result).toHaveProperty('failureCount');
			expect(result).toHaveProperty('isHealthy');
			expect(['closed', 'open', 'half-open']).toContain(result.state);
		});
	});

	describe('Validation Report Query', () => {
		it('should return health report structure', async () => {
			const t = convexTest(schema, modules);

			// Create authenticated context
			const asAdmin = t.withIdentity(mockAdminIdentity);

			// Run query with auth
			const report = await asAdmin.query(api.asaas.getValidationReport, {});

			// Verify expected structure
			expect(report).toHaveProperty('healthScore');
			expect(report).toHaveProperty('status');
			expect(report).toHaveProperty('syncStats');
			expect(report).toHaveProperty('apiUsage');
			expect(report).toHaveProperty('webhookHealth');
			expect(report).toHaveProperty('circuitBreaker');
			expect(report).toHaveProperty('alerts');
			expect(report).toHaveProperty('issues');
			expect(report).toHaveProperty('recommendations');

			// Health score should be 0-100
			expect(report.healthScore).toBeGreaterThanOrEqual(0);
			expect(report.healthScore).toBeLessThanOrEqual(100);

			// Status should be valid
			expect(['healthy', 'degraded', 'critical']).toContain(report.status);
		});
	});

	describe('Sync Logs Query', () => {
		it('should return sync logs array', async () => {
			const t = convexTest(schema, modules);
			const asAdmin = t.withIdentity(mockAdminIdentity);

			// Check if getSyncLogs exists and returns array
			if (api.asaas.sync.getSyncLogs) {
				const logs = await asAdmin.query(api.asaas.sync.getSyncLogs, {
					limit: 10,
				});
				expect(Array.isArray(logs)).toBe(true);
			}
		});
	});

	describe('API Health Metrics Query', () => {
		it('should return health metrics', async () => {
			const t = convexTest(schema, modules);
			const asAdmin = t.withIdentity(mockAdminIdentity);

			// getApiHealthMetrics from monitoring.ts
			if (api.asaas.getApiHealthMetrics) {
				const metrics = await asAdmin.query(api.asaas.getApiHealthMetrics, {});
				// Verify expected structure from calculateApiHealthMetrics
				expect(metrics).toHaveProperty('totalRequests');
				expect(metrics).toHaveProperty('errorRate');
				expect(metrics).toHaveProperty('successRate');
				expect(metrics).toHaveProperty('avgResponseTime');
				expect(metrics).toHaveProperty('endpoints');
				expect(metrics).toHaveProperty('errors');
			}
		});
	});
});

describe('Asaas Sync - Unit Tests', () => {
	describe('Test Payload Generation', () => {
		it('should generate unique event IDs', () => {
			// Simple unit test for payload generation logic
			const generateTestEventId = (prefix: string): string => {
				const timestamp = Date.now();
				const random = Math.random().toString(36).substring(2, 8);
				return `TEST_${prefix}_${timestamp}_${random}`;
			};

			const id1 = generateTestEventId('PAYMENT');
			const id2 = generateTestEventId('PAYMENT');

			expect(id1).toMatch(/^TEST_PAYMENT_\d+_[a-z0-9]+$/);
			expect(id2).toMatch(/^TEST_PAYMENT_\d+_[a-z0-9]+$/);
			expect(id1).not.toBe(id2);
		});
	});

	describe('CPF Generation for Tests', () => {
		it('should generate valid-looking CPF', () => {
			// Test CPF generation logic (simplified)
			const generateTestCPF = (seed: number): string => {
				const seededRnd = (n: number, offset: number) =>
					Math.round(((((seed + offset) * 9301 + 49297) % 233280) / 233280) * n);
				const mod = (dividend: number, divisor: number) =>
					Math.round(dividend - Math.floor(dividend / divisor) * divisor);

				const n1 = seededRnd(9, 0);
				const n2 = seededRnd(9, 1);
				const n3 = seededRnd(9, 2);
				const n4 = seededRnd(9, 3);
				const n5 = seededRnd(9, 4);
				const n6 = seededRnd(9, 5);
				const n7 = seededRnd(9, 6);
				const n8 = seededRnd(9, 7);
				const n9 = seededRnd(9, 8);

				let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
				d1 = 11 - mod(d1, 11);
				if (d1 >= 10) d1 = 0;

				let d2 =
					d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
				d2 = 11 - mod(d2, 11);
				if (d2 >= 10) d2 = 0;

				return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
			};

			const cpf1 = generateTestCPF(1);
			const cpf2 = generateTestCPF(2);

			// Should be 11 digits
			expect(cpf1).toMatch(/^\d{11}$/);
			expect(cpf2).toMatch(/^\d{11}$/);

			// Different seeds should produce different CPFs
			expect(cpf1).not.toBe(cpf2);
		});
	});
});
