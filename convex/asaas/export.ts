// @ts-nocheck
/**
 * Asaas Export Actions
 *
 * Public actions for exporting students, payments, and subscriptions to Asaas.
 * Uses batch processing for efficient concurrent execution.
 */

import { v } from 'convex/values';

import { internal } from '../_generated/api';
import type { Doc } from '../_generated/dataModel';
import { action } from '../_generated/server';
import { getOrganizationId } from '../lib/auth';
import { getAsaasClientFromSettings } from './config';

// ═══════════════════════════════════════════════════════
// EXPORT ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Export a single student to Asaas
 */
export const exportStudentToAsaas = action({
	args: {
		studentId: v.id('students'),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean;
		data: { studentId: string; asaasCustomerId: string };
	}> => {
		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) {
			throw new Error('Organization ID not found.');
		}

		// Get student
		const student = await ctx.runQuery(internal.asaas.queries.getStudentById, {
			studentId: args.studentId,
		});

		if (!student) {
			throw new Error('Student not found');
		}

		// Get Asaas client
		const asaasClient = await getAsaasClientFromSettings(ctx);

		// Import batch processor and workers dynamically
		const { processBatch } = await import('./batch_processor');
		const { exportStudentWorker } = await import('./export_workers');

		// Create worker function
		const worker = (studentData: Doc<'students'>) =>
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			exportStudentWorker(ctx as any, studentData, asaasClient);

		// Process single student
		// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
		const result = await (processBatch as any)(
			[student],
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			worker as any,
			{
				batchSize: 1,
				concurrency: 1,
				delayBetweenBatches: 0,
				maxRetries: 3,
				checkpointInterval: 1,
				adaptiveBatching: false,
			},
		);

		if (result.failed.length > 0) {
			throw new Error(`Failed to export student: ${result.failed[0].error}`);
		}

		return {
			success: true,
			data: result.successful[0],
		};
	},
});

/**
 * Export a single payment to Asaas
 */
export const exportPaymentToAsaas = action({
	args: {
		paymentId: v.id('asaasPayments'),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean;
		data: { paymentId: string; asaasPaymentId: string };
	}> => {
		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) {
			throw new Error('Organization ID not found.');
		}

		// Get payment using internal query (action context doesn't have db.get)
		const payment = await ctx.runQuery(internal.asaas.queries.getPaymentById, {
			paymentId: args.paymentId,
		});

		if (!payment) {
			throw new Error('Payment not found');
		}

		// Verify organization access
		if (payment.organizationId !== organizationId) {
			throw new Error('Payment not found in your organization');
		}

		// Get Asaas client
		const asaasClient = await getAsaasClientFromSettings(ctx);

		// Import batch processor and workers dynamically
		const { processBatch } = await import('./batch_processor');
		const { exportPaymentWorker } = await import('./export_workers');

		// Create worker function
		const worker = (paymentData: Doc<'asaasPayments'>) =>
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			exportPaymentWorker(ctx as any, paymentData, asaasClient);

		// Process single payment
		// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
		const result = await (processBatch as any)(
			[payment],
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			worker as any,
			{
				batchSize: 1,
				concurrency: 1,
				delayBetweenBatches: 0,
				maxRetries: 3,
				checkpointInterval: 1,
				adaptiveBatching: false,
			},
		);

		if (result.failed.length > 0) {
			throw new Error(`Failed to export payment: ${result.failed[0].error}`);
		}

		return {
			success: true,
			data: result.successful[0],
		};
	},
});

/**
 * Bulk export students to Asaas
 */
// @ts-expect-error: break deep type instantiation
export const bulkExportStudents = action({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (
		// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
		ctx: any,
		args,
	): Promise<{
		success: boolean;
		message?: string;
		exported: number;
		skipped: number;
		failed: number;
		errors?: string[];
	}> => {
		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) {
			throw new Error('Organization ID not found.');
		}

		// Get all students without Asaas customer ID
		const students = await ctx.runQuery(internal.asaas.queries.listAllStudents, {
			organizationId,
		});

		// Filter for students that need export (no asaasCustomerId)
		const studentsToExport = students.filter((s) => !s.asaasCustomerId).slice(0, args.limit || 100);

		if (studentsToExport.length === 0) {
			return {
				success: true,
				message: 'No students to export',
				exported: 0,
				skipped: 0,
				failed: 0,
			};
		}

		// Get Asaas client
		const asaasClient = await getAsaasClientFromSettings(ctx);

		// Import batch processor and workers dynamically
		const { processBatch } = await import('./batch_processor');
		const { exportStudentWorker } = await import('./export_workers');

		// Create worker function
		const worker = (student: Doc<'students'>) =>
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			exportStudentWorker(ctx as any, student, asaasClient);

		// Progress callback
		const onProgress = async (_stats: unknown) => {
			// Intentional empty callback
		};

		// Process students in batch
		// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
		const result = await (processBatch as any)(
			studentsToExport,
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			worker as any,
			{
				batchSize: 10,
				concurrency: 5,
				delayBetweenBatches: 100,
				maxRetries: 3,
				checkpointInterval: 20,
				adaptiveBatching: true,
			},
			onProgress,
		);

		return {
			success: result.failed.length < studentsToExport.length,
			exported: result.successful.length,
			skipped: result.skipped.length,
			failed: result.failed.length,
			errors: result.failed.slice(0, 10).map((f) => f.error),
		};
	},
});

/**
 * Bulk export payments to Asaas
 */
export const bulkExportPayments = action({
	args: {
		limit: v.optional(v.number()),
		startDate: v.optional(v.number()), // Timestamp
		endDate: v.optional(v.number()), // Timestamp
	},
	handler: async (
		// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
		ctx: any,
		args,
	): Promise<{
		success: boolean;
		message?: string;
		exported: number;
		skipped: number;
		failed: number;
		errors?: string[];
	}> => {
		const organizationId = await getOrganizationId(ctx);
		if (!organizationId) {
			throw new Error('Organization ID not found.');
		}

		// Get payments that need export (no asaasPaymentId)
		const payments = await ctx.runQuery(internal.asaas.queries.getPendingExportPayments, {
			organizationId,
			startDate: args.startDate,
			endDate: args.endDate,
		});

		// Filter for payments that need export
		const paymentsToExport = payments.filter((p) => !p.asaasPaymentId).slice(0, args.limit || 100);

		if (paymentsToExport.length === 0) {
			return {
				success: true,
				message: 'No payments to export',
				exported: 0,
				skipped: 0,
				failed: 0,
			};
		}

		// Get Asaas client
		const asaasClient = await getAsaasClientFromSettings(ctx);

		// Import batch processor and workers dynamically
		const { processBatch } = await import('./batch_processor');
		const { exportPaymentWorker } = await import('./export_workers');

		// Create worker function
		const worker = (payment: Doc<'asaasPayments'>) =>
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			exportPaymentWorker(ctx as any, payment, asaasClient);

		// Progress callback
		const onProgress = async (_stats: unknown) => {
			// Intentional empty callback
		};

		// Process payments in batch
		// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
		const result = await (processBatch as any)(
			paymentsToExport,
			// biome-ignore lint/suspicious/noExplicitAny: Context type mismatch resolution
			worker as any,
			{
				batchSize: 10,
				concurrency: 5,
				delayBetweenBatches: 100,
				maxRetries: 3,
				checkpointInterval: 20,
				adaptiveBatching: true,
			},
			onProgress,
		);

		return {
			success: result.failed.length < paymentsToExport.length,
			exported: result.successful.length,
			skipped: result.skipped.length,
			failed: result.failed.length,
			errors: result.failed.slice(0, 10).map((f) => f.error),
		};
	},
});

// Note: getAsaasClientFromSettings is now imported from ./config.ts
