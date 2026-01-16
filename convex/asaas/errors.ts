/**
 * Asaas Error Handling
 *
 * Custom error classes and error handling utilities for Asaas API integration.
 */

// ═══════════════════════════════════════════════════════
// ERROR CLASSES
// ═══════════════════════════════════════════════════════

/**
 * Base error class for all Asaas-related errors
 */
export class AsaasError extends Error {
	public readonly code: string;
	public readonly isTransient: boolean;
	public readonly isRetryable: boolean;
	public readonly statusCode?: number;
	public readonly originalError?: unknown;

	constructor(
		message: string,
		code: string,
		isTransient: boolean = false,
		isRetryable: boolean = false,
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
		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			isTransient: this.isTransient,
			isRetryable: this.isRetryable,
			statusCode: this.statusCode,
		};
	}
}

/**
 * Configuration error (missing API key, invalid config, etc.)
 */
export class AsaasConfigurationError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'CONFIGURATION_ERROR', false, false, undefined, originalError);
		this.name = 'AsaasConfigurationError';
	}
}

/**
 * Validation error (invalid payload, malformed data, etc.)
 */
export class AsaasValidationError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'VALIDATION_ERROR', false, false, 400, originalError);
		this.name = 'AsaasValidationError';
	}
}

/**
 * Authentication error (invalid API key, expired token, etc.)
 */
export class AsaasAuthenticationError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'AUTHENTICATION_ERROR', false, false, 401, originalError);
		this.name = 'AsaasAuthenticationError';
	}
}

/**
 * Not found error (resource doesn't exist)
 */
export class AsaasNotFoundError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'NOT_FOUND_ERROR', false, false, 404, originalError);
		this.name = 'AsaasNotFoundError';
	}
}

/**
 * Rate limit error (too many requests)
 */
export class AsaasRateLimitError extends AsaasError {
	constructor(message: string, retryAfter?: number, originalError?: unknown) {
		super(message, 'RATE_LIMIT_ERROR', true, true, 429, originalError);
		this.name = 'AsaasRateLimitError';
		this.retryAfter = retryAfter;
	}

	public retryAfter?: number;
}

/**
 * Server error (5xx errors, service unavailable, etc.)
 */
export class AsaasServerError extends AsaasError {
	constructor(message: string, statusCode: number, originalError?: unknown) {
		super(message, 'SERVER_ERROR', true, true, statusCode, originalError);
		this.name = 'AsaasServerError';
	}
}

/**
 * Network error (connection issues, timeouts, etc.)
 */
export class AsaasNetworkError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'NETWORK_ERROR', true, true, undefined, originalError);
		this.name = 'AsaasNetworkError';
	}
}

/**
 * Idempotency error (duplicate operation)
 */
export class AsaasIdempotencyError extends AsaasError {
	constructor(message: string, originalError?: unknown) {
		super(message, 'IDEMPOTENCY_ERROR', false, false, 409, originalError);
		this.name = 'AsaasIdempotencyError';
	}
}

// ═══════════════════════════════════════════════════════
// ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════

/**
 * Classify an error based on HTTP status code and error details
 */
export function classifyError(error: unknown): AsaasError {
	// Already classified error
	if (error instanceof AsaasError) {
		return error;
	}

	// Network errors (no response)
	if (error instanceof Error && !('response' in error)) {
		return new AsaasNetworkError(`Erro de rede: ${error.message}`, error);
	}

	// API errors with response
	const apiError = error as any;
	const statusCode = apiError.response?.status;
	const responseData = apiError.response?.data;

	// Configuration errors (no API key)
	if (apiError.message?.includes('ASAAS_API_KEY') || apiError.message?.includes('api_key')) {
		return new AsaasConfigurationError(apiError.message, error);
	}

	// Authentication errors (401)
	if (statusCode === 401) {
		const message = responseData?.errors?.[0]?.description || 'Autenticação falhou';
		return new AsaasAuthenticationError(message, error);
	}

	// Not found errors (404)
	if (statusCode === 404) {
		const message = responseData?.errors?.[0]?.description || 'Recurso não encontrado';
		return new AsaasNotFoundError(message, error);
	}

	// Rate limit errors (429)
	if (statusCode === 429) {
		const message = responseData?.errors?.[0]?.description || 'Limite de requisições excedido';
		const retryAfter = apiError.response?.headers?.['retry-after'];
		return new AsaasRateLimitError(message, retryAfter ? parseInt(retryAfter) : undefined, error);
	}

	// Client errors (4xx, excluding 401, 404, 429)
	if (statusCode >= 400 && statusCode < 500) {
		const message =
			responseData?.errors?.[0]?.description || apiError.message || 'Erro na requisição';
		return new AsaasValidationError(message, error);
	}

	// Server errors (5xx)
	if (statusCode >= 500) {
		const message = responseData?.errors?.[0]?.description || 'Erro no servidor Asaas';
		return new AsaasServerError(message, statusCode, error);
	}

	// Unknown error
	const message = apiError.message || 'Erro desconhecido';
	return new AsaasError(message, 'UNKNOWN_ERROR', false, false, statusCode, error);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
	const classified = classifyError(error);
	return classified.isRetryable;
}

/**
 * Check if error is transient (temporary)
 */
export function isTransientError(error: unknown): boolean {
	const classified = classifyError(error);
	return classified.isTransient;
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
	const classified = classifyError(error);

	switch (classified.code) {
		case 'CONFIGURATION_ERROR':
			return 'Configuração da API Asaas está incompleta. Entre em contato com o suporte.';
		case 'AUTHENTICATION_ERROR':
			return 'Credenciais da API Asaas inválidas. Entre em contato com o suporte.';
		case 'RATE_LIMIT_ERROR':
			return 'Muitas requisições. Aguarde alguns minutos e tente novamente.';
		case 'SERVER_ERROR':
			return 'Serviço Asaas temporariamente indisponível. Tente novamente em instantes.';
		case 'NETWORK_ERROR':
			return 'Erro de conexão com Asaas. Verifique sua internet e tente novamente.';
		case 'VALIDATION_ERROR':
			return `Dados inválidos: ${classified.message}`;
		case 'NOT_FOUND_ERROR':
			return 'Recurso não encontrado no Asaas.';
		case 'IDEMPOTENCY_ERROR':
			return 'Operação já realizada anteriormente.';
		default:
			return 'Erro ao processar requisição. Tente novamente ou entre em contato com o suporte.';
	}
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: unknown): string {
	const classified = classifyError(error);
	const json = classified.toJSON();

	// Remove any potential API keys or tokens
	return JSON.stringify(json, (_key, value) => {
		if (typeof value === 'string' && value.length > 32 && /^[a-zA-Z0-9]+$/.test(value)) {
			return '[REDACTED]';
		}
		return value;
	});
}
