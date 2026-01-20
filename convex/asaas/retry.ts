/**
 * Asaas Retry and Circuit Breaker Utilities
 *
 * Provides resilient execution patterns for API calls, including:
 * - Exponential backoff retries
 * - Circuit breaker to prevent cascading failures
 * - Timeout protection
 */

import { AsaasNetworkError, AsaasRateLimitError } from './errors';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface RetryConfig {
	maxRetries: number;
	initialDelayMs: number;
	maxDelayMs: number;
	factor: number;
	retryableStatuses: number[];
}

export interface CircuitBreakerConfig {
	failureThreshold: number;
	resetTimeoutMs: number;
	halfOpenMaxCalls: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// ═══════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════

/**
 * Circuit Breaker implementation to protect against failing downstream services
 */
export class CircuitBreaker {
	private state: CircuitState = 'CLOSED';
	private failures = 0;
	private lastFailureTime = 0;
	private halfOpenCalls = 0;
	private readonly config: CircuitBreakerConfig;

	constructor(
		config: CircuitBreakerConfig = {
			failureThreshold: 3, // Reduced from 5 for faster detection
			resetTimeoutMs: 60_000, // 1 minute
			halfOpenMaxCalls: 3,
		},
	) {
		this.config = config;
	}

	/**
	 * Execute a function with circuit breaker protection
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		this.checkState();

		if (this.state === 'OPEN') {
			throw new Error('Circuit breaker is OPEN. Request blocked.');
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	private checkState(): void {
		if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
			this.state = 'HALF_OPEN';
			this.halfOpenCalls = 0;
		}
	}

	private onSuccess(): void {
		if (this.state === 'HALF_OPEN') {
			this.halfOpenCalls++;
			if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
				this.reset();
			}
		} else {
			this.failures = 0;
		}
	}

	private onFailure(): void {
		this.failures++;
		this.lastFailureTime = Date.now();

		if (this.state === 'HALF_OPEN' || this.failures >= this.config.failureThreshold) {
			this.state = 'OPEN';
		}
	}

	private reset(): void {
		this.state = 'CLOSED';
		this.failures = 0;
		this.halfOpenCalls = 0;
	}

	getState(): CircuitState {
		return this.state;
	}
}

// Global circuit breaker for Asaas API
export const asaasCircuitBreaker = new CircuitBreaker();

// ═══════════════════════════════════════════════════════
// RETRY UTILITIES
// ═══════════════════════════════════════════════════════

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	initialDelayMs: 1000,
	maxDelayMs: 10_000,
	factor: 2,
	retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Execute function with exponential backoff retries
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	config: Partial<RetryConfig> = {},
): Promise<T> {
	const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
	let lastError: unknown;

	for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (!isRetryable(error, fullConfig, attempt)) {
				throw error;
			}

			const delay = calculateDelay(attempt, fullConfig);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Determine if an error is retryable
 */
function isRetryable(error: unknown, config: RetryConfig, attempt: number): boolean {
	if (attempt >= config.maxRetries) return false;

	// Network errors are always retryable
	if (error instanceof AsaasNetworkError) return true;

	// Rate limit errors are retryable
	if (error instanceof AsaasRateLimitError) return true;

	// Check status code if available
	const statusCode = (error as { statusCode?: number })?.statusCode;
	if (statusCode && config.retryableStatuses.includes(statusCode)) {
		return true;
	}

	return false;
}

/**
 * Calculate delay with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
	const baseDelay = config.initialDelayMs * config.factor ** attempt;
	const delay = Math.min(baseDelay, config.maxDelayMs);
	// Add 10% jitter
	const jitter = delay * 0.1 * Math.random();
	return delay + jitter;
}

// ═══════════════════════════════════════════════════════
// TIMEOUT UTILITIES
// ═══════════════════════════════════════════════════════

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
	});

	return await Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute function with timeout and retry
 */
export async function withTimeoutAndRetry<T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	retryConfig?: Partial<RetryConfig>,
): Promise<T> {
	return await withRetry(() => withTimeout(fn, timeoutMs), retryConfig);
}
