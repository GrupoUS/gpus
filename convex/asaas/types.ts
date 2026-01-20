/**
 * Asaas Type Utilities
 *
 * Type helpers and utilities to resolve Convex deep type instantiation issues
 * and reduce the need for @ts-expect-error throughout the codebase.
 */

import type { Id, TableNames } from '../_generated/dataModel';

// ═════════════════════════════════════════════════════════════════
// WRAPPER TYPES FOR INTERNAL FUNCTIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Wrapped internal mutation return type
 * Helps with deep type instantiation in Convex
 */
export type WrappedMutation<T> = Promise<T>;

/**
 * Wrapped internal query return type
 */
export type WrappedQuery<T> = Promise<T>;

/**
 * Wrapped internal action return type
 */
export type WrappedAction<T> = Promise<T>;

// ═════════════════════════════════════════════════════════════════
// ASAAS API TYPES (re-exported from client.ts)
// ═════════════════════════════════════════════════════════════════════

export type {
	AsaasCustomerPayload,
	AsaasCustomerResponse,
	AsaasFinancialSummaryResponse,
	AsaasPaymentPayload,
	AsaasPaymentResponse,
	AsaasSubscriptionPayload,
	AsaasSubscriptionResponse,
} from './client';

// ═══════════════════════════════════════════════════════════════════════
// ASAAS WEBHOOK EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Complete set of Asaas webhook event types
 *
 * Payment Events:
 * - PAYMENT_CREATED: New charge generated
 * - PAYMENT_CONFIRMED: Payment confirmed (balance not yet available)
 * - PAYMENT_RECEIVED: Payment received (balance available)
 * - PAYMENT_OVERDUE: Payment past due date
 * - PAYMENT_REFUNDED: Payment refunded
 * - PAYMENT_DELETED: Payment deleted
 * - PAYMENT_UPDATED: Due date or amount changed
 *
 * Subscription Events:
 * - SUBSCRIPTION_CREATED: New subscription created
 * - SUBSCRIPTION_UPDATED: Subscription details updated
 * - SUBSCRIPTION_INACTIVATED: Subscription inactivated
 * - SUBSCRIPTION_DELETED: Subscription deleted
 */
export type AsaasEventType =
	| 'PAYMENT_CREATED'
	| 'PAYMENT_CONFIRMED'
	| 'PAYMENT_RECEIVED'
	| 'PAYMENT_OVERDUE'
	| 'PAYMENT_REFUNDED'
	| 'PAYMENT_DELETED'
	| 'PAYMENT_UPDATED'
	| 'SUBSCRIPTION_CREATED'
	| 'SUBSCRIPTION_UPDATED'
	| 'SUBSCRIPTION_INACTIVATED'
	| 'SUBSCRIPTION_DELETED';

/**
 * Complete Asaas webhook payload structure
 *
 * Matches Asaas API v3 webhook format
 */
export interface AsaasWebhookPayload {
	id: string;
	event: AsaasEventType;
	payment?: AsaasPaymentData;
	subscription?: AsaasSubscriptionData;
	[key: string]: unknown; // Additional fields
}

/**
 * Asaas payment data from webhook payload
 */
export interface AsaasPaymentData {
	id: string; // pay_080225913252
	customer: string; // cus_000000008773
	subscription?: string; // sub_m5gdy1upm25fbwgx
	value: number;
	netValue: number;
	status: string;
	billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';
	dueDate: string;
	paymentDate?: string;
	invoiceUrl?: string;
	bankSlipUrl?: string;
	externalReference?: string;
	description?: string;
	// ... more fields
}

/**
 * Asaas subscription data from webhook payload
 */
export interface AsaasSubscriptionData {
	id: string; // sub_...
	customer: string;
	value: number;
	cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
	status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
	nextDueDate?: string;
	description?: string;
	// ... more fields
}

// ═══════════════════════════════════════════════════════
// DATABASE DOCUMENT TYPES
// ═══════════════════════════════════════════════════════

/**
 * Student document with Asaas sync fields
 */
export interface StudentWithAsaas {
	// biome-ignore lint/style/useNamingConvention: Convex uses _id for document IDs
	_id: Id<'students'>;
	name: string;
	email?: string;
	phone: string;
	cpf?: string;
	asaasCustomerId?: string;
	asaasCustomerSyncedAt?: number;
	asaasCustomerSyncError?: string;
	asaasCustomerSyncAttempts?: number;
	organizationId?: string;
}

/**
 * Payment document
 */
export interface PaymentDoc {
	// biome-ignore lint/style/useNamingConvention: Convex uses _id for document IDs
	_id: Id<'asaasPayments'>;
	studentId: Id<'students'>;
	asaasPaymentId: string;
	asaasCustomerId: string;
	organizationId?: string;
	value: number;
	netValue?: number;
	status: string;
	dueDate: number;
	billingType: string;
	description?: string;
	boletoUrl?: string;
	pixQrCode?: string;
	confirmedDate?: number;
	installmentNumber?: number;
	totalInstallments?: number;
	createdAt: number;
	updatedAt: number;
}

/**
 * Subscription document
 */
export interface SubscriptionDoc {
	// biome-ignore lint/style/useNamingConvention: Convex uses _id for document IDs
	_id: Id<'asaasSubscriptions'>;
	studentId: Id<'students'>;
	asaasSubscriptionId: string;
	asaasCustomerId: string;
	organizationId?: string;
	value: number;
	cycle: string;
	status: string;
	nextDueDate: number;
	description?: string;
	createdAt: number;
	updatedAt: number;
}

// ═══════════════════════════════════════════════════════
// INTERNAL MUTATION/QUERY ARGUMENT TYPES
// ═══════════════════════════════════════════════════════

/**
 * Arguments for getStudentByAsaasId
 */
export interface GetStudentByAsaasIdArgs {
	asaasCustomerId: string;
}

/**
 * Arguments for getStudentByEmailOrCpf
 */
export interface GetStudentByEmailOrCpfArgs {
	email?: string;
	cpf?: string;
}

/**
 * Arguments for getPaymentByAsaasId
 */
export interface GetPaymentByAsaasIdArgs {
	asaasPaymentId: string;
}

/**
 * Arguments for getSubscriptionByAsaasId
 */
export interface GetSubscriptionByAsaasIdArgs {
	asaasSubscriptionId: string;
}

/**
 * Arguments for createStudentFromAsaas
 */
export interface CreateStudentFromAsaasArgs {
	name: string;
	email?: string;
	phone: string;
	cpf?: string;
	asaasCustomerId: string;
	organizationId?: string;
}

/**
 * Arguments for updateStudentFromAsaas
 */
export interface UpdateStudentFromAsaasArgs {
	studentId: Id<'students'>;
	name?: string;
	email?: string;
	phone?: string;
	cpf?: string;
}

/**
 * Arguments for createPaymentFromAsaas
 */
export interface CreatePaymentFromAsaasArgs {
	studentId: Id<'students'>;
	asaasPaymentId: string;
	asaasCustomerId: string;
	value: number;
	netValue?: number;
	status: string;
	dueDate: number;
	billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UNDEFINED';
	description?: string;
	boletoUrl?: string;
	confirmedDate?: number;
	organizationId?: string;
}

/**
 * Arguments for updatePaymentFromAsaas
 */
export interface UpdatePaymentFromAsaasArgs {
	paymentId: Id<'asaasPayments'>;
	status?: string;
	netValue?: number;
	confirmedDate?: number;
}

/**
 * Arguments for createSubscriptionFromAsaas
 */
export interface CreateSubscriptionFromAsaasArgs {
	studentId: Id<'students'>;
	asaasSubscriptionId: string;
	asaasCustomerId: string;
	value: number;
	cycle: string;
	status: string;
	nextDueDate: number;
	description?: string;
	organizationId?: string;
}

/**
 * Arguments for updateSubscriptionFromAsaas
 */
export interface UpdateSubscriptionFromAsaasArgs {
	subscriptionId: Id<'asaasSubscriptions'>;
	status?: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
	value?: number;
	nextDueDate?: number;
}

/**
 * Arguments for updateStudentAsaasId
 */
export interface UpdateStudentAsaasIdArgs {
	studentId: Id<'students'>;
	asaasCustomerId: string;
}

/**
 * Arguments for createSyncLog
 */
export interface CreateSyncLogArgs {
	syncType: 'customers' | 'payments' | 'subscriptions' | 'financial';
	initiatedBy: string;
	filters?: {
		startDate?: string;
		endDate?: string;
		status?: string;
	};
}

/**
 * Arguments for updateSyncLog
 */
export interface UpdateSyncLogArgs {
	logId: Id<'asaasSyncLogs'>;
	status?: 'pending' | 'running' | 'completed' | 'failed';
	recordsProcessed?: number;
	recordsCreated?: number;
	recordsUpdated?: number;
	recordsFailed?: number;
	errors?: string[];
	completedAt?: number;
}

/**
 * Arguments for updateSyncLogProgress
 */
export interface UpdateSyncLogProgressArgs {
	logId: Id<'asaasSyncLogs'>;
	recordsProcessed: number;
	recordsCreated?: number;
	recordsUpdated?: number;
	recordsFailed?: number;
}

/**
 * Arguments for listAllStudents
 */
export interface ListAllStudentsArgs {
	organizationId?: string;
}

// ═══════════════════════════════════════════════════════
// HELPER TYPES FOR ASYNC OPERATIONS
// ═══════════════════════════════════════════════════════

/**
 * Result of an import operation
 */
export interface ImportResult {
	success: boolean;
	recordsProcessed: number;
	recordsCreated: number;
	recordsUpdated: number;
	recordsFailed: number;
	errors?: string[];
}

/**
 * Sync log summary
 */
export interface SyncLogSummary {
	logId: Id<'asaasSyncLogs'>;
	syncType: string;
	status: string;
	startedAt: number;
	completedAt?: number;
	recordsProcessed: number;
	recordsCreated: number;
	recordsUpdated: number;
	recordsFailed: number;
}

// ═══════════════════════════════════════════════════════
// RUNTIME VALIDATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Type guard for Id
 */
export function isId(value: unknown): value is Id<TableNames> {
	return (
		typeof value === 'string' && value.length === 28 // Convex IDs are 28 characters
	);
}

/**
 * Safely extract ID from a document
 */
// biome-ignore lint/style/useNamingConvention: Convex document IDs use _id
export function getIdFromDoc<T extends { _id: Id<TableNames> }>(doc: T): Id<TableNames> {
	return doc._id;
}

// ═══════════════════════════════════════════════════════
// ORGANIZATION HELPERS
// ═══════════════════════════════════════════════════════

// getOrganizationId is imported from lib/auth

// ═══════════════════════════════════════════════════════
// API RESPONSE WRAPPERS
// ═══════════════════════════════════════════════════════

/**
 * Asaas API configuration
 */
export interface AsaasConfig {
	apiKey: string;
	baseUrl?: string;
}

/**
 * Integration config from settings
 */
export interface IntegrationConfig {
	api_key?: string;
	apiKey?: string;
	base_url?: string;
	baseUrl?: string;
	webhook_secret?: string;
	webhookSecret?: string;
}
