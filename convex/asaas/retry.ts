/**
 * Asaas Retry Logic
 *
 * Exponential backoff with jitter and circuit breaker pattern for Asaas API calls.
 */

import { isRetryableError } from './errors'

// ═══════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_INITIAL_DELAY_MS = 1000 // 1 second
const DEFAULT_MAX_DELAY_MS = 30000 // 30 seconds
const DEFAULT_BACKOFF_MULTIPLIER = 2

// ═══════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
	failureThreshold: number
	resetTimeoutMs: number
	halfOpenMaxCalls: number
}

export class CircuitBreaker {
	private state: CircuitState = 'CLOSED'
	private failureCount = 0
	private lastFailureTime = 0
	private halfOpenCallCount = 0

	constructor(
		private config: CircuitBreakerConfig = {
			failureThreshold: 5,
			resetTimeoutMs: 60000, // 1 minute
			halfOpenMaxCalls: 3,
		},
	) {}

	/**
	 * Execute function with circuit breaker protection
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		if (this.state === 'OPEN') {
			if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
				this.state = 'HALF_OPEN'
				this.halfOpenCallCount = 0
			} else {
				throw new Error('Circuit breaker is OPEN. Service unavailable.')
			}
		}

		try {
			const result = await fn()
			this.onSuccess()
			return result
		} catch (error) {
			this.onFailure()
			throw error
		}
	}

	private onSuccess(): void {
		this.failureCount = 0
		if (this.state === 'HALF_OPEN') {
			this.halfOpenCallCount++
			if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
				this.state = 'CLOSED'
			}
		}
	}

	private onFailure(): void {
		this.failureCount++
		this.lastFailureTime = Date.now()

		if (this.state === 'HALF_OPEN') {
			this.state = 'OPEN'
		} else if (this.failureCount >= this.config.failureThreshold) {
			this.state = 'OPEN'
		}
	}

	getState(): CircuitState {
		return this.state
	}

	getFailureCount(): number {
		return this.failureCount
	}

	reset(): void {
		this.state = 'CLOSED'
		this.failureCount = 0
		this.lastFailureTime = 0
		this.halfOpenCallCount = 0
	}
}

// ═══════════════════════════════════════════════════════
// RETRY LOGIC
// ═══════════════════════════════════════════════════════

export interface RetryConfig {
	maxRetries: number
	initialDelayMs: number
	maxDelayMs: number
	backoffMultiplier: number
	jitterMs: number
	circuitBreaker?: CircuitBreaker
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delayMs: number, jitterMs: number): number {
	const jitter = Math.random() * jitterMs
	return delayMs + jitter
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
	attempt: number,
	config: RetryConfig,
): number {
	const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt)
	const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)
	return addJitter(cappedDelay, config.jitterMs)
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	config: Partial<RetryConfig> = {},
): Promise<T> {
	const fullConfig: RetryConfig = {
		maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
		initialDelayMs: config.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS,
		maxDelayMs: config.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
		backoffMultiplier: config.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER,
		jitterMs: config.jitterMs ?? 1000,
		circuitBreaker: config.circuitBreaker,
	}

	let lastError: unknown

	for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
		try {
			// If circuit breaker is provided, use it
			if (fullConfig.circuitBreaker) {
				return await fullConfig.circuitBreaker.execute(fn)
			}

			return await fn()
		} catch (error) {
			lastError = error

			// Check if error is retryable
			if (!isRetryableError(error)) {
				throw error
			}

			// Don't retry on last attempt
			if (attempt === fullConfig.maxRetries) {
				break
			}

			// Calculate delay and wait
			const delay = calculateDelay(attempt, fullConfig)
			console.warn(`[Retry] Attempt ${attempt + 1}/${fullConfig.maxRetries + 1} failed. Retrying in ${Math.round(delay)}ms...`)

			await sleep(delay)
		}
	}

	throw lastError
}

/**
 * Create a circuit breaker instance
 */
export function createCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
	return new CircuitBreaker({
		failureThreshold: config?.failureThreshold ?? 5,
		resetTimeoutMs: config?.resetTimeoutMs ?? 60000,
		halfOpenMaxCalls: config?.halfOpenMaxCalls ?? 3,
	})
}

// ═══════════════════════════════════════════════════════
// TIMEOUT HANDLING
// ═══════════════════════════════════════════════════════

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number,
): Promise<T> {
	return Promise.race([
		fn(),
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
		),
	])
}

/**
 * Execute function with timeout and retry
 */
export async function withTimeoutAndRetry<T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	retryConfig?: Partial<RetryConfig>,
): Promise<T> {
	return withRetry(
		() => withTimeout(fn, timeoutMs),
		retryConfig,
	)
}
