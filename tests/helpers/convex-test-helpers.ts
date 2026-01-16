/**
 * Convex Test Helpers
 *
 * Utility functions for creating test data and mocking Convex context
 */

import { vi } from 'vitest';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Create a test student object
 * @param overrides - Partial student data to override defaults
 * @returns Test student object
 */
export function createTestStudent(overrides: Partial<any> = {}) {
	return {
		_id: 'test_student_id' as Id<'students'>,
		name: 'Test Student',
		email: 'test@example.com',
		phone: '11999999999',
		profession: 'enfermeiro',
		hasClinic: false,
		status: 'ativo',
		churnRisk: 'baixo',
		lgpdConsent: false,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

/**
 * Create a test Asaas customer object
 * @param overrides - Partial customer data to override defaults
 * @returns Test Asaas customer object
 */
export function mockAsaasCustomer(overrides: Partial<any> = {}) {
	return {
		id: 'cus_test123',
		name: 'Test Customer',
		email: 'test@example.com',
		phone: '11999999999',
		cpfCnpj: '52998224725',
		notificationDisabled: false,
		...overrides,
	};
}

/**
 * Create a test payment object
 * @param overrides - Partial payment data to override defaults
 * @returns Test payment object
 */
export function createTestPayment(overrides: Partial<any> = {}) {
	return {
		_id: 'test_payment_id' as Id<'asaasPayments'>,
		studentId: 'test_student_id' as Id<'students'>,
		asaasPaymentId: 'pay_test123',
		asaasCustomerId: 'cus_test123',
		value: 100,
		status: 'PENDING',
		dueDate: Date.now(),
		billingType: 'BOLETO',
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

/**
 * Create a test enrollment object
 * @param overrides - Partial enrollment data to override defaults
 * @returns Test enrollment object
 */
export function createTestEnrollment(overrides: Partial<any> = {}) {
	return {
		_id: 'test_enrollment_id' as Id<'enrollments'>,
		studentId: 'test_student_id' as Id<'students'>,
		product: 'trintae3' as const,
		status: 'ativo',
		totalValue: 10000,
		installments: 12,
		installmentValue: 833.33,
		paymentStatus: 'em_dia',
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

/**
 * Create a test lead object
 * @param overrides - Partial lead data to override defaults
 * @returns Test lead object
 */
export function createTestLead(overrides: Partial<any> = {}) {
	return {
		_id: 'test_lead_id' as Id<'leads'>,
		name: 'Test Lead',
		email: 'lead@example.com',
		phone: '11999999999',
		source: 'organico' as const,
		stage: 'novo' as const,
		temperature: 'frio' as const,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

/**
 * Create a test sync log object
 * @param overrides - Partial sync log data to override defaults
 * @returns Test sync log object
 */
export function createTestSyncLog(overrides: Partial<any> = {}) {
	return {
		_id: 'test_sync_log_id' as Id<'asaasSyncLogs'>,
		syncType: 'customers' as const,
		status: 'completed' as const,
		startedAt: Date.now() - 10000,
		completedAt: Date.now(),
		recordsProcessed: 100,
		recordsCreated: 50,
		recordsUpdated: 30,
		recordsFailed: 20,
		initiatedBy: 'test_user_id',
		createdAt: Date.now(),
		...overrides,
	};
}

/**
 * Create a mock Convex database context
 * @returns Mock database context
 */
export function createMockDb() {
	const db = new Map();

	return {
		get: vi.fn((id: string) => db.get(id)),
		insert: vi.fn((_table: string, doc: any) => {
			const id = `table_${Date.now()}`;
			db.set(id, { _id: id, ...doc });
			return id;
		}),
		patch: vi.fn((id: string, _updates: any) => {
			const existing = db.get(id);
			if (existing) {
				db.set(id, { ...existing, ..._updates });
			}
		}),
		delete: vi.fn((id: string) => {
			db.delete(id);
		}),
		query: vi.fn((_table: string) => ({
			withIndex: vi.fn((_index: string, _fn: any) => ({
				first: vi.fn(() => null),
				collect: vi.fn(() => []),
			})),
		})),
	};
}

/**
 * Create a mock Convex auth context
 * @param overrides - Partial auth data to override defaults
 * @returns Mock auth context
 */
export function createMockAuth(overrides: Partial<any> = {}) {
	return {
		getUserIdentity: vi.fn().mockResolvedValue({
			subject: 'test_user_123',
			email: 'test@example.com',
			name: 'Test User',
			...overrides,
		}),
	};
}

/**
 * Create a mock Convex scheduler
 * @returns Mock scheduler
 */
export function createMockScheduler() {
	return {
		runAfter: vi.fn(),
	};
}

/**
 * Create a complete mock Convex context
 * @param overrides - Partial context data to override defaults
 * @returns Complete mock context
 */
export function createMockContext(overrides: Partial<any> = {}) {
	return {
		db: createMockDb(),
		auth: createMockAuth(),
		scheduler: createMockScheduler(),
		runQuery: vi.fn(),
		runMutation: vi.fn(),
		...overrides,
	};
}

/**
 * Wait for a specified amount of time (useful for testing async operations)
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a test webhook payload
 * @param overrides - Partial payload data to override defaults
 * @returns Test webhook payload
 */
export function createTestWebhookPayload(overrides: Partial<any> = {}) {
	return {
		event: 'PAYMENT_CONFIRMED',
		paymentId: 'pay_test123',
		payload: {
			payment: {
				id: 'pay_test123',
				status: 'CONFIRMED',
				value: 100,
				netValue: 97.5,
				billingType: 'BOLETO',
				dueDate: '2025-01-15',
				paymentDate: '2025-01-15',
				...overrides,
			},
		},
		...overrides,
	};
}

/**
 * Common test data constants
 */
export const TEST_DATA = {
	VALID_CPF: '52998224725',
	INVALID_CPF_REPEATED: '111.111.111-11',
	INVALID_CPF_CHECK_DIGIT: '123.456.789-00',
	VALID_EMAIL: 'test@example.com',
	INVALID_EMAIL: 'invalid-email',
	VALID_PHONE: '11999999999',
	INVALID_PHONE: '123',
	ASAAS_CUSTOMER_ID: 'cus_test123',
	ASAAS_PAYMENT_ID: 'pay_test123',
	ORGANIZATION_ID: 'org_test123',
	CLERK_ID: 'user_test123',
};

/**
 * Helper to generate a random CPF for testing
 * Note: This generates valid CPF numbers for testing purposes only
 * @returns A valid CPF number
 */
export function generateTestCPF(): string {
	// This is a simple implementation that generates one of the known valid test CPFs
	const testCPFs = ['52998224725', '12345678909', '98765432100', '11144477735', '22233344400'];
	return testCPFs[Math.floor(Math.random() * testCPFs.length)];
}

/**
 * Helper to generate a random email for testing
 * @returns A random email address
 */
export function generateTestEmail(): string {
	return `test_${Date.now()}@example.com`;
}
