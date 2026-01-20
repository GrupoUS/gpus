/**
 * Asaas Integration Errors
 *
 * Standardized error classes and utilities for handling Asaas API errors,
 * network issues, and validation failures.
 */

/**
 * Base error class for all Asaas-related errors
 */
export class AsaasError extends Error {
	readonly code: string;
	readonly isTransient: boolean;
	readonly isRetryable: boolean;
	readonly statusCode?: number;
	readonly originalError?: unknown;

	constructor(
		message: string,
		code: string,
		isTransient = false,
		isRetryable = false,
		statusCode?: number,
		originalError?: unknown,
	) {
		super(message);
		this.name = 'AsaasError';
		this.code = code;
		this.isTransient = isTransient;
		this.isRetryable = isRetryable;
		this.statusCode = statusCode;
		this.originalError = originalError;

		// Ensure stack trace is captured correctly
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AsaasError);
		}
	}
}

/**
 * Error thrown when Asaas API returns an error response
 */
export class AsaasApiError extends AsaasError {
	readonly errors: Array<{ code: string; description: string }>;

	constructor(
		message: string,
		errors: Array<{ code: string; description: string }> = [],
		statusCode?: number,
		originalError?: unknown,
	) {
		// API errors are generally not transient but might be retryable depending on the code
		const isRetryable = statusCode === 429 || statusCode === 500 || statusCode === 503;
		super(message, 'API_ERROR', false, isRetryable, statusCode, originalError);
		this.name = 'AsaasApiError';
		this.errors = errors;
	}
}

/**
 * Error thrown when authentication with Asaas fails
 */
export class AsaasAuthError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'AUTH_ERROR', false, false, 401, originalError);
		this.name = 'AsaasAuthError';
	}
}

/**
 * Error thrown when a network or timeout error occurs
 */
export class AsaasNetworkError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		// Network errors are transient and retryable
		super(message, 'NETWORK_ERROR', true, true, undefined, originalError);
		this.name = 'AsaasNetworkError';
	}
}

/**
 * Error thrown when validation fails before calling the API
 */
export class AsaasValidationError extends AsaasError {
	constructor(message: string) {
		super(message, 'VALIDATION_ERROR', false, false);
		this.name = 'AsaasValidationError';
	}
}

/**
 * Error thrown when rate limit is exceeded
 */
export class AsaasRateLimitError extends AsaasError {
	retryAfter?: number;

	constructor(message: string, retryAfter?: number, originalError?: unknown) {
		super(message, 'RATE_LIMIT_ERROR', true, true, 429, originalError);
		this.name = 'AsaasRateLimitError';
		this.retryAfter = retryAfter;
	}
}

/**
 * Maps unknown errors to AsaasError instances
 */
export function mapToAsaasError(error: unknown): AsaasError {
	if (error instanceof AsaasError) {
		return error;
	}

	// Handle Axios-like errors
	const apiError = error as {
		response?: {
			status?: number;
			data?: {
				errors?: Array<{ code: string; description: string }>;
			};
		};
		request?: unknown;
		message?: string;
	};

	if (apiError.response) {
		const statusCode = apiError.response.status;
		const responseData = apiError.response.data;

		if (statusCode === 401) {
			return new AsaasAuthError('Falha na autenticação com Asaas', error);
		}

		if (statusCode === 429) {
			return new AsaasRateLimitError('Limite de requisições excedido', undefined, error);
		}

		const errors = responseData?.errors || [];
		const message =
			errors.length > 0 ? errors[0].description : apiError.message || 'Erro na API do Asaas';

		return new AsaasApiError(message, errors, statusCode, error);
	}

	if (apiError.request) {
		return new AsaasNetworkError('Erro de rede ao conectar com Asaas', error);
	}

	return new AsaasError(
		apiError.message || 'Erro desconhecido na integração com Asaas',
		'UNKNOWN_ERROR',
		false,
		false,
		undefined,
		error,
	);
}

// Regex for redaction
const REDACTION_REGEX = /^[a-zA-Z0-9]+$/;

/**
 * Sanitizes sensitive data for logging
 */
export function sanitizeForLog(json: unknown): string {
	// Remove any potential API keys or tokens
	return JSON.stringify(json, (_key, value) => {
		if (typeof value === 'string' && value.length > 32 && REDACTION_REGEX.test(value)) {
			return '[REDACTED]';
		}
		return value;
	});
}
