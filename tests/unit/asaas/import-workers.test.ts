/**
 * Asaas Import Workers Unit Tests
 *
 * Tests for customer, payment, and subscription processing workers
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Id } from '../../../convex/_generated/dataModel';
import {
	createCustomerBatchProcessor,
	createPaymentBatchProcessor,
	createSubscriptionBatchProcessor,
	processCustomerWorker,
	processPaymentWorker,
	processSubscriptionWorker,
} from '../../../convex/asaas/import_workers';

// Mock data
const mockCustomer = {
	id: 'cus_test123',
	name: 'Test Customer',
	email: 'test@example.com',
	phone: '11999999999',
	cpfCnpj: '52998224725',
	notificationDisabled: false,
	dateCreated: '2025-01-15',
	personType: 'FISICA' as const,
};

const mockPayment = {
	id: 'pay_test123',
	customer: 'cus_test123',
	value: 100,
	netValue: 97.5,
	status: 'CONFIRMED' as const,
	billingType: 'BOLETO' as const,
	dueDate: '2025-01-15',
	paymentDate: '2025-01-15',
	description: 'Test payment',
	bankSlipUrl: 'https://asaas.com/boleto/123',
	installmentNumber: 1,
	dateCreated: '2025-01-15',
	originalDueDate: '2025-01-15',
};

const mockSubscription = {
	id: 'sub_test123',
	customer: 'cus_test123',
	value: 100,
	cycle: 'MONTHLY' as const,
	status: 'ACTIVE' as const,
	nextDueDate: '2025-02-15',
	description: 'Test subscription',
	dateCreated: '2025-01-15',
	billingType: 'BOLETO' as const,
};

const mockStudent: Id<'students'> = 'student_id' as Id<'students'>;
const mockPaymentId: Id<'asaasPayments'> = 'payment_id' as Id<'asaasPayments'>;
const mockSubscriptionId: Id<'asaasSubscriptions'> = 'subscription_id' as Id<'asaasSubscriptions'>;

// Mock context
function createMockContext() {
	return {
		runQuery: vi.fn(),
		runMutation: vi.fn(),
	};
}

describe('Import Workers - Validation Helpers', () => {
	// Note: These tests verify validation behavior through the worker's responses
	// The actual validation functions are internal to import_workers.ts

	describe('processCustomerWorker - CPF Validation', () => {
		it('should skip customer with invalid CPF (repeated digits)', async () => {
			const ctx = createMockContext();
			const invalidCustomer = { ...mockCustomer, cpfCnpj: '111.111.111-11' };

			const result = await processCustomerWorker(ctx, invalidCustomer);

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.reason).toBe('Invalid CPF format');
		});

		it('should skip customer with invalid CPF (wrong check digits)', async () => {
			const ctx = createMockContext();
			const invalidCustomer = { ...mockCustomer, cpfCnpj: '123.456.789-00' };

			const result = await processCustomerWorker(ctx, invalidCustomer);

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.reason).toBe('Invalid CPF format');
		});

		it('should accept customer with valid CPF', async () => {
			const ctx = createMockContext();
			ctx.runQuery.mockResolvedValue(null); // No existing student
			ctx.runMutation.mockResolvedValue(mockStudent);

			const result = await processCustomerWorker(ctx, mockCustomer);

			expect(result.success).toBe(true);
			// skipped may be undefined or false
			if (result.skipped !== undefined) {
				expect(result.skipped).toBe(false);
			}
		});
	});

	describe('processCustomerWorker - Email Validation', () => {
		it('should skip customer with invalid email', async () => {
			const ctx = createMockContext();
			const invalidCustomer = { ...mockCustomer, email: 'invalid-email' };

			const result = await processCustomerWorker(ctx, invalidCustomer);

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.reason).toBe('Invalid email format');
		});

		it('should accept customer without email (optional)', async () => {
			const ctx = createMockContext();
			const noEmailCustomer = { ...mockCustomer, email: undefined };
			ctx.runQuery.mockResolvedValue(null);
			ctx.runMutation.mockResolvedValue(mockStudent);

			const result = await processCustomerWorker(ctx, noEmailCustomer);

			expect(result.success).toBe(true);
		});
	});

	describe('processCustomerWorker - Phone Validation', () => {
		it('should skip customer with invalid phone (too short)', async () => {
			const ctx = createMockContext();
			const invalidCustomer = { ...mockCustomer, phone: '123' };

			const result = await processCustomerWorker(ctx, invalidCustomer);

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.reason).toBe('Invalid phone format');
		});

		it('should skip customer with invalid phone (too long)', async () => {
			const ctx = createMockContext();
			const invalidCustomer = { ...mockCustomer, phone: '123456789012' };

			const result = await processCustomerWorker(ctx, invalidCustomer);

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.reason).toBe('Invalid phone format');
		});

		it('should accept customer with 10-digit phone (landline)', async () => {
			const ctx = createMockContext();
			const validCustomer = { ...mockCustomer, phone: '1123456789' };
			ctx.runQuery.mockResolvedValue(null);
			ctx.runMutation.mockResolvedValue(mockStudent);

			const result = await processCustomerWorker(ctx, validCustomer);

			expect(result.success).toBe(true);
		});

		it('should accept customer with 11-digit phone (mobile)', async () => {
			const ctx = createMockContext();
			const validCustomer = { ...mockCustomer, phone: '11999999999' };
			ctx.runQuery.mockResolvedValue(null);
			ctx.runMutation.mockResolvedValue(mockStudent);

			const result = await processCustomerWorker(ctx, validCustomer);

			expect(result.success).toBe(true);
		});

		it('should use mobilePhone when phone is not provided', async () => {
			const ctx = createMockContext();
			const validCustomer = { ...mockCustomer, phone: undefined, mobilePhone: '11999999999' };
			ctx.runQuery.mockResolvedValue(null);
			ctx.runMutation.mockResolvedValue(mockStudent);

			const result = await processCustomerWorker(ctx, validCustomer);

			expect(result.success).toBe(true);
		});
	});
});

describe('Import Workers - Customer Processing', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create new student when customer does not exist', async () => {
		const ctx = createMockContext();
		ctx.runQuery.mockResolvedValue(null); // No existing student
		ctx.runMutation.mockResolvedValue(mockStudent);

		const result = await processCustomerWorker(ctx, mockCustomer, 'org123');

		expect(result.success).toBe(true);
		// Check created flag is present and true
		expect(result.created).toBe(true);
		// updated is not set when created
		expect(result.data).toBeDefined();
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				name: mockCustomer.name,
				email: mockCustomer.email,
				asaasCustomerId: mockCustomer.id,
				organizationId: 'org123',
			}),
		);
	});

	it('should update existing student when found by asaasCustomerId', async () => {
		const ctx = createMockContext();
		const existingStudent = {
			_id: mockStudent,
			name: 'Old Name',
			asaasCustomerId: mockCustomer.id,
		};
		ctx.runQuery.mockResolvedValue(existingStudent);

		const result = await processCustomerWorker(ctx, mockCustomer);

		expect(result.success).toBe(true);
		// created is not set when updated
		expect(result.updated).toBe(true);
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				studentId: mockStudent,
				name: mockCustomer.name,
			}),
		);
	});

	it('should link existing student found by email/CPF', async () => {
		const ctx = createMockContext();
		// First query: not found by asaasCustomerId
		ctx.runQuery
			.mockResolvedValueOnce(null)
			// Second query: found by email/CPF
			.mockResolvedValueOnce({ _id: mockStudent, name: 'Existing Student' });
		ctx.runMutation.mockResolvedValue(undefined);

		const result = await processCustomerWorker(ctx, mockCustomer);

		expect(result.success).toBe(true);
		// updated is set when linking existing student
		expect(result.updated).toBe(true);
		// Should call updateStudentAsaasId to link
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				studentId: mockStudent,
				asaasCustomerId: mockCustomer.id,
			}),
		);
	});

	it('should handle errors gracefully', async () => {
		const ctx = createMockContext();
		ctx.runQuery.mockRejectedValue(new Error('Database error'));

		const result = await processCustomerWorker(ctx, mockCustomer);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});
});

describe('Import Workers - Payment Processing', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create new payment when payment does not exist', async () => {
		const ctx = createMockContext();
		// Payment not found
		ctx.runQuery.mockResolvedValueOnce(null);
		// Student found
		ctx.runQuery.mockResolvedValueOnce({ _id: mockStudent });
		ctx.runMutation.mockResolvedValue(mockPaymentId);

		const result = await processPaymentWorker(ctx, mockPayment, 'org123');

		expect(result.success).toBe(true);
		// Check created flag is present and true
		expect(result.created).toBe(true);
		// updated is not set when created
		expect(result.data).toBeDefined();
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				studentId: mockStudent,
				asaasPaymentId: mockPayment.id,
				value: mockPayment.value,
				organizationId: 'org123',
			}),
		);
	});

	it('should update existing payment when found', async () => {
		const ctx = createMockContext();
		const existingPayment = { _id: mockPaymentId, asaasPaymentId: mockPayment.id };
		ctx.runQuery.mockResolvedValue(existingPayment);

		const result = await processPaymentWorker(ctx, mockPayment);

		expect(result.success).toBe(true);
		// created is not set when updated
		expect(result.updated).toBe(true);
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				paymentId: mockPaymentId,
				status: mockPayment.status,
			}),
		);
	});

	it('should skip payment when student not found', async () => {
		const ctx = createMockContext();
		// Payment not found
		ctx.runQuery.mockResolvedValueOnce(null);
		// Student not found
		ctx.runQuery.mockResolvedValueOnce(null);

		const result = await processPaymentWorker(ctx, mockPayment);

		expect(result.success).toBe(false);
		expect(result.skipped).toBe(true);
		expect(result.reason).toContain('Student not found');
	});

	it('should handle payment errors gracefully', async () => {
		const ctx = createMockContext();
		ctx.runQuery.mockRejectedValue(new Error('Payment error'));

		const result = await processPaymentWorker(ctx, mockPayment);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});
});

describe('Import Workers - Subscription Processing', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create new subscription when subscription does not exist', async () => {
		const ctx = createMockContext();
		// Subscription not found
		ctx.runQuery.mockResolvedValueOnce(null);
		// Student found
		ctx.runQuery.mockResolvedValueOnce({ _id: mockStudent });
		ctx.runMutation.mockResolvedValue(mockSubscriptionId);

		const result = await processSubscriptionWorker(ctx, mockSubscription, 'org123');

		expect(result.success).toBe(true);
		// Check created flag is present and true
		expect(result.created).toBe(true);
		// updated is not set when created
		expect(result.data).toBeDefined();
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				studentId: mockStudent,
				asaasSubscriptionId: mockSubscription.id,
				value: mockSubscription.value,
				organizationId: 'org123',
			}),
		);
	});

	it('should update existing subscription when found', async () => {
		const ctx = createMockContext();
		const existingSubscription = {
			_id: mockSubscriptionId,
			asaasSubscriptionId: mockSubscription.id,
		};
		ctx.runQuery.mockResolvedValue(existingSubscription);

		const result = await processSubscriptionWorker(ctx, mockSubscription);

		expect(result.success).toBe(true);
		// created is not set when updated
		expect(result.updated).toBe(true);
		expect(ctx.runMutation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				subscriptionId: mockSubscriptionId,
				status: mockSubscription.status,
			}),
		);
	});

	it('should skip subscription when student not found', async () => {
		const ctx = createMockContext();
		// Subscription not found
		ctx.runQuery.mockResolvedValueOnce(null);
		// Student not found
		ctx.runQuery.mockResolvedValueOnce(null);

		const result = await processSubscriptionWorker(ctx, mockSubscription);

		expect(result.success).toBe(false);
		expect(result.skipped).toBe(true);
		expect(result.reason).toContain('Student not found');
	});

	it('should handle subscription errors gracefully', async () => {
		const ctx = createMockContext();
		ctx.runQuery.mockRejectedValue(new Error('Subscription error'));

		const result = await processSubscriptionWorker(ctx, mockSubscription);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});
});

describe('Import Workers - Batch Processor Creators', () => {
	it('should create customer batch processor', async () => {
		const ctx = createMockContext();
		ctx.runQuery.mockResolvedValue(null);
		ctx.runMutation.mockResolvedValue(mockStudent);

		const processor = createCustomerBatchProcessor(ctx, 'org123');
		const result = await processor(mockCustomer);

		expect(result.success).toBe(true);
	});

	it('should create payment batch processor', async () => {
		const ctx = createMockContext();
		ctx.runQuery
			.mockResolvedValueOnce(null) // Payment not found
			.mockResolvedValueOnce({ _id: mockStudent }); // Student found
		ctx.runMutation.mockResolvedValue(mockPaymentId);

		const processor = createPaymentBatchProcessor(ctx, 'org123');
		const result = await processor(mockPayment);

		expect(result.success).toBe(true);
	});

	it('should create subscription batch processor', async () => {
		const ctx = createMockContext();
		ctx.runQuery
			.mockResolvedValueOnce(null) // Subscription not found
			.mockResolvedValueOnce({ _id: mockStudent }); // Student found
		ctx.runMutation.mockResolvedValue(mockSubscriptionId);

		const processor = createSubscriptionBatchProcessor(ctx, 'org123');
		const result = await processor(mockSubscription);

		expect(result.success).toBe(true);
	});
});

describe('Import Workers - LGPD Compliance', () => {
	it('should not log sensitive CPF data in errors', async () => {
		const ctx = createMockContext();
		ctx.runQuery.mockRejectedValue(new Error('Database error'));

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await processCustomerWorker(ctx, mockCustomer);

		expect(consoleSpy).toHaveBeenCalled();
		const logMessage = consoleSpy.mock.calls[0][0] as string;
		// Should mask CPF in logs
		expect(logMessage).toContain('***');
		expect(logMessage).not.toContain(mockCustomer.cpfCnpj);

		consoleSpy.mockRestore();
	});
});
