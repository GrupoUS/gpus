/**
 * Improved Asaas API Client
 *
 * Enhanced API client with retry logic, circuit breaker, error handling,
 * and security measures for Asaas API v3 integration.
 */

import {
	checkCircuitBreaker,
	getCircuitBreakerState,
	recordFailure,
	recordSuccess,
	resetCircuitBreaker,
} from '../lib/asaas';
import { AsaasConfigurationError, classifyError } from './errors';
import { withTimeoutAndRetry } from './retry';

// ═══════════════════════════════════════════════════════
// TYPES - Asaas API Request/Response Payloads
// ═══════════════════════════════════════════════════════

export interface AsaasCustomerPayload {
	name: string;
	cpfCnpj?: string;
	email?: string;
	phone?: string;
	mobilePhone?: string;
	postalCode?: string;
	address?: string;
	addressNumber?: string;
	complement?: string;
	province?: string;
	city?: string;
	state?: string;
	country?: string;
	externalReference?: string;
	notificationDisabled?: boolean;
	additionalEmails?: string;
}

export interface AsaasCustomerResponse {
	id: string;
	dateCreated: string;
	name: string;
	email?: string;
	phone?: string;
	mobilePhone?: string;
	cpfCnpj?: string;
	postalCode?: string;
	address?: string;
	addressNumber?: string;
	complement?: string;
	province?: string;
	city?: string;
	state?: string;
	country?: string;
	externalReference?: string;
	notificationDisabled: boolean;
	additionalEmails?: string;
	personType: 'FISICA' | 'JURIDICA';
}

export interface AsaasPaymentPayload {
	customer: string;
	billingType: 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'UNDEFINED';
	value: number;
	dueDate: string;
	description?: string;
	externalReference?: string;
	installmentCount?: number;
	installmentValue?: number;
	totalValue?: number;
	discount?: {
		value: number;
		dueDateLimitDays: number;
		type: 'FIXED' | 'PERCENTAGE';
	};
	fine?: {
		value: number;
		type: 'FIXED' | 'PERCENTAGE';
	};
	interest?: {
		value: number;
		type: 'PERCENTAGE';
	};
	postalService?: boolean;
}

export interface AsaasPaymentResponse {
	id: string;
	dateCreated: string;
	customer: string;
	subscription?: string;
	installment?: string;
	paymentLink?: string;
	value: number;
	netValue: number;
	originalValue?: number;
	interestValue?: number;
	description?: string;
	billingType: 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'UNDEFINED';
	status:
		| 'PENDING'
		| 'CONFIRMED'
		| 'RECEIVED'
		| 'RECEIVED_IN_CASH'
		| 'OVERDUE'
		| 'REFUNDED'
		| 'RECEIVED_IN_CASH_UNDONE'
		| 'CHARGEBACK_REQUESTED'
		| 'CHARGEBACK_DISPUTE'
		| 'AWAITING_CHARGEBACK_REVERSAL'
		| 'DUNNING_REQUESTED'
		| 'DUNNING_RECEIVED'
		| 'AWAITING_RISK_ANALYSIS'
		| 'APPROVED_BY_RISK_ANALYSIS'
		| 'REJECTED_BY_RISK_ANALYSIS'
		| 'DELETED'
		| 'CANCELLED';
	dueDate: string;
	originalDueDate: string;
	paymentDate?: string;
	clientPaymentDate?: string;
	installmentNumber?: number;
	transactionReceiptUrl?: string;
	nossoNumero?: string;
	invoiceUrl?: string;
	bankSlipUrl?: string;
	identificationField?: string;
	externalReference?: string;
	deleted?: boolean;
	postalService?: boolean;
	creditDate?: string;
	estimatedCreditDate?: string;
	pixTransactionId?: string;
	pixQrCodeId?: string;
	pixQrCode?: string;
	creditCard?: {
		creditCardNumber?: string;
		creditCardBrand?: string;
		creditCardToken?: string;
	};
}

export interface AsaasSubscriptionPayload {
	customer: string;
	billingType: 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'UNDEFINED';
	value: number;
	nextDueDate: string;
	cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
	description?: string;
	externalReference?: string;
	updatePendingPayments?: boolean;
	discount?: {
		value: number;
		dueDateLimitDays: number;
		type: 'FIXED' | 'PERCENTAGE';
	};
	fine?: {
		value: number;
		type: 'FIXED' | 'PERCENTAGE';
	};
	interest?: {
		value: number;
		type: 'PERCENTAGE';
	};
}

export interface AsaasSubscriptionResponse {
	id: string;
	dateCreated: string;
	customer: string;
	billingType: 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'UNDEFINED';
	value: number;
	nextDueDate: string;
	cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
	description?: string;
	status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED';
	externalReference?: string;
}

export interface AsaasPaymentListResponse {
	object: 'list';
	hasMore: boolean;
	totalCount: number;
	limit: number;
	offset: number;
	data: AsaasPaymentResponse[];
}

export interface AsaasCustomerListResponse {
	object: 'list';
	hasMore: boolean;
	totalCount: number;
	limit: number;
	offset: number;
	data: AsaasCustomerResponse[];
}

export interface AsaasSubscriptionListResponse {
	object: 'list';
	hasMore: boolean;
	totalCount: number;
	limit: number;
	offset: number;
	data: AsaasSubscriptionResponse[];
}

export interface AsaasApiError {
	errors?: Array<{
		code: string;
		description: string;
	}>;
	message?: string;
}

export interface AsaasFinancialSummaryResponse {
	totalReceived: number;
	totalPending: number;
	totalOverdue: number;
	totalValue: number;
	paymentsCount: number;
	periodStart?: string;
	periodEnd?: string;
}

// ═══════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds for normal operations
const SYNC_TIMEOUT_MS = 60_000; // 60 seconds for sync operations (larger data sets)
const DEFAULT_MAX_RETRIES = 3;

// ═══════════════════════════════════════════════════════
// ASAAS API CLIENT
// ═══════════════════════════════════════════════════════

export class AsaasClient {
	private readonly config: { apiKey: string; baseUrl: string };

	constructor(config: { apiKey: string; baseUrl?: string }) {
		if (!config.apiKey || config.apiKey.trim() === '') {
			throw new AsaasConfigurationError('ASAAS_API_KEY não pode estar vazia');
		}

		this.config = {
			apiKey: config.apiKey.trim(),
			baseUrl: config.baseUrl || process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3',
		};
	}

	/**
	 * Generic fetch wrapper with retry logic, circuit breaker, and error handling
	 */
	private async fetch<T>(
		endpoint: string,
		options: {
			method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
			body?: unknown;
			timeoutMs?: number;
		} = {},
	): Promise<T> {
		const url = `${this.config.baseUrl}${endpoint}`;
		const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

		// Sanitize body to remove sensitive data
		const sanitizedBody = this.sanitizeBody(options.body);

		// Execute with retry logic and shared circuit breaker
		return withTimeoutAndRetry(
			async () => {
				// Check shared circuit breaker before request
				if (!checkCircuitBreaker()) {
					throw new Error('Circuit breaker is OPEN. Requests blocked.');
				}

				const response = await fetch(url, {
					method: options.method || 'GET',
					headers: {
						access_token: this.config.apiKey,
						'Content-Type': 'application/json',
						'User-Agent': 'gpus-saas/2.0',
					},
					body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
				});

				// Handle no content responses
				if (response.status === 204) {
					recordSuccess(); // Record success on 204
					return undefined as T;
				}

				const data = await response.json();

				if (!response.ok) {
					// Record failure on 5xx or 429
					if (response.status >= 500 || response.status === 429) {
						recordFailure();
					}

					const error = {
						response: {
							status: response.status,
							data: data as AsaasApiError,
						},
					};
					throw error;
				}

				recordSuccess(); // Record success on 200
				return data as T;
			},
			timeoutMs,
			{
				maxRetries: DEFAULT_MAX_RETRIES,
				// No local circuit breaker check in retry wrapper, we handled it above and in hook
			},
		);
	}

	/**
	 * Sanitize request body to remove sensitive data
	 * Only redacts values where the key name indicates a secret
	 */
	private sanitizeBody(body: unknown): unknown {
		if (!body || typeof body !== 'object') {
			return body;
		}

		const sanitized = { ...(body as Record<string, unknown>) };

		// Pattern to match sensitive key names
		const sensitiveKeyPattern =
			/^(api[_-]?key|access[_-]?token|secret|password|credential|auth[_-]?token|bearer|private[_-]?key)$/i;

		// Only redact values where key name indicates a secret
		Object.keys(sanitized).forEach((key) => {
			const value = sanitized[key];
			if (typeof value === 'string' && sensitiveKeyPattern.test(key)) {
				sanitized[key] = '[REDACTED]';
			}
		});

		return sanitized;
	}

	/**
	 * Test connection to Asaas API
	 */
	public async testConnection(): Promise<{ status: number; success: boolean }> {
		try {
			await this.fetch<{ object: string; totalCount: number }>('/customers?limit=1');
			return { status: 200, success: true };
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Create a new customer
	 */
	public async createCustomer(payload: AsaasCustomerPayload): Promise<AsaasCustomerResponse> {
		try {
			return await this.fetch<AsaasCustomerResponse>('/customers', {
				method: 'POST',
				body: payload,
			});
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Update an existing customer
	 */
	public async updateCustomer(
		customerId: string,
		payload: Partial<AsaasCustomerPayload>,
	): Promise<AsaasCustomerResponse> {
		try {
			return await this.fetch<AsaasCustomerResponse>(`/customers/${customerId}`, {
				method: 'POST',
				body: payload,
			});
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Get customer by ID
	 */
	public async getCustomer(customerId: string): Promise<AsaasCustomerResponse> {
		try {
			return await this.fetch<AsaasCustomerResponse>(`/customers/${customerId}`);
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * List all customers with pagination
	 */
	public async listAllCustomers(params?: {
		name?: string;
		email?: string;
		cpfCnpj?: string;
		offset?: number;
		limit?: number;
		timeoutMs?: number; // Optional timeout override for sync operations
	}): Promise<AsaasCustomerListResponse> {
		try {
			const queryParams = new URLSearchParams();
			if (params?.name) queryParams.append('name', params.name);
			if (params?.email) queryParams.append('email', params.email);
			if (params?.cpfCnpj) queryParams.append('cpfCnpj', params.cpfCnpj);
			if (params?.offset !== undefined) queryParams.append('offset', String(params.offset));
			if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

			const query = queryParams.toString();
			return await this.fetch<AsaasCustomerListResponse>(`/customers${query ? `?${query}` : ''}`, {
				timeoutMs: params?.timeoutMs ?? SYNC_TIMEOUT_MS,
			});
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Create a new payment
	 */
	public async createPayment(payload: AsaasPaymentPayload): Promise<AsaasPaymentResponse> {
		try {
			return await this.fetch<AsaasPaymentResponse>('/payments', {
				method: 'POST',
				body: payload,
			});
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Get PIX QR Code for a payment
	 */
	public async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string }> {
		try {
			return await this.fetch<{ encodedImage: string; payload: string }>(
				`/payments/${paymentId}/pixQrCode`,
				{ method: 'GET' },
			);
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Create a new subscription
	 */
	public async createSubscription(
		payload: AsaasSubscriptionPayload,
	): Promise<AsaasSubscriptionResponse> {
		try {
			return await this.fetch<AsaasSubscriptionResponse>('/subscriptions', {
				method: 'POST',
				body: payload,
			});
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * List all payments with filters
	 */
	public async listAllPayments(params?: {
		customer?: string;
		status?: string;
		billingType?: string;
		dateCreatedGe?: string;
		dateCreatedLe?: string;
		paymentDateGe?: string;
		paymentDateLe?: string;
		offset?: number;
		limit?: number;
		timeoutMs?: number; // Optional timeout override for sync operations
	}): Promise<AsaasPaymentListResponse> {
		try {
			const queryParams = new URLSearchParams();
			if (params?.customer) queryParams.append('customer', params.customer);
			if (params?.status) queryParams.append('status', params.status);
			if (params?.billingType) queryParams.append('billingType', params.billingType);
			if (params?.dateCreatedGe) queryParams.append('dateCreated[ge]', params.dateCreatedGe);
			if (params?.dateCreatedLe) queryParams.append('dateCreated[le]', params.dateCreatedLe);
			if (params?.paymentDateGe) queryParams.append('paymentDate[ge]', params.paymentDateGe);
			if (params?.paymentDateLe) queryParams.append('paymentDate[le]', params.paymentDateLe);
			if (params?.offset !== undefined) queryParams.append('offset', String(params.offset));
			if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

			const query = queryParams.toString();
			return await this.fetch<AsaasPaymentListResponse>(`/payments${query ? `?${query}` : ''}`, {
				timeoutMs: params?.timeoutMs ?? SYNC_TIMEOUT_MS,
			});
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * List all subscriptions with filters
	 */
	public async listAllSubscriptions(params?: {
		customer?: string;
		status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
		offset?: number;
		limit?: number;
		timeoutMs?: number; // Optional timeout override for sync operations
	}): Promise<AsaasSubscriptionListResponse> {
		try {
			const queryParams = new URLSearchParams();
			if (params?.customer) queryParams.append('customer', params.customer);
			if (params?.status) queryParams.append('status', params.status);
			if (params?.offset !== undefined) queryParams.append('offset', String(params.offset));
			if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

			const query = queryParams.toString();
			return await this.fetch<AsaasSubscriptionListResponse>(
				`/subscriptions${query ? `?${query}` : ''}`,
				{ timeoutMs: params?.timeoutMs ?? SYNC_TIMEOUT_MS },
			);
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Get financial summary for a period
	 */
	public async getFinancialSummary(params?: {
		startDate?: string;
		endDate?: string;
	}): Promise<AsaasFinancialSummaryResponse> {
		try {
			let offset = 0;
			const limit = 100;
			let hasMore = true;
			let totalReceived = 0;
			let totalPending = 0;
			let totalOverdue = 0;
			let totalValue = 0;
			let paymentsCount = 0;

			while (hasMore) {
				const response = await this.listAllPayments({
					dateCreatedGe: params?.startDate,
					dateCreatedLe: params?.endDate,
					offset,
					limit,
				});

				for (const payment of response.data) {
					paymentsCount++;
					totalValue += payment.value;

					if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
						totalReceived += payment.netValue || payment.value;
					} else if (payment.status === 'PENDING') {
						totalPending += payment.value;
					} else if (payment.status === 'OVERDUE') {
						totalOverdue += payment.value;
					}
				}

				hasMore = response.hasMore;
				offset += limit;
			}

			return {
				totalReceived,
				totalPending,
				totalOverdue,
				totalValue,
				paymentsCount,
				periodStart: params?.startDate,
				periodEnd: params?.endDate,
			};
		} catch (error) {
			const classified = classifyError(error);
			throw classified;
		}
	}

	/**
	 * Get circuit breaker state (for monitoring)
	 */
	public getCircuitBreakerState(): string {
		return getCircuitBreakerState().state;
	}

	/**
	 * Reset circuit breaker (for recovery)
	 */
	public resetCircuitBreaker(): void {
		resetCircuitBreaker();
	}
}

/**
 * Create Asaas client instance
 */
export function createAsaasClient(config: { apiKey: string; baseUrl?: string }): AsaasClient {
	return new AsaasClient(config);
}

/**
 * Convert date string (YYYY-MM-DD) to timestamp (start of day in UTC)
 */
export function dateStringToTimestamp(dateStr: string): number {
	const date = new Date(`${dateStr}T00:00:00.000Z`);
	return date.getTime();
}

/**
 * Convert timestamp to date string (YYYY-MM-DD)
 */
export function timestampToDateString(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
