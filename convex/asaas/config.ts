// @ts-nocheck
/**
 * Asaas Configuration Utilities
 * Centralized configuration management for Asaas integration
 *
 * This module consolidates API key configuration logic previously duplicated
 * in actions.ts and export.ts, adding enhanced logging and validation.
 */

import { internal } from '../_generated/api';
import type { ActionCtx, QueryCtx } from '../_generated/server';
import { type AsaasClient, createAsaasClient } from './client';
import { AsaasConfigurationError } from './errors';

const API_KEY_VALIDATION_REGEX = /^[$a-zA-Z0-9_]+$/;

// ═══════════════════════════════════════════════════════
// API KEY VALIDATION
// ═══════════════════════════════════════════════════════

/**
 * Validates the format of an Asaas API key
 * @param key - The API key to validate
 * @returns Object with validation result and optional error message
 */
export function validateAsaasApiKey(key: string): {
	valid: boolean;
	error?: string;
} {
	// Check if key is empty or only whitespace
	if (!key || key.trim().length === 0) {
		return { valid: false, error: 'API Key não pode estar vazia' };
	}

	// Clean the key
	const cleanKey = key.trim();

	// Check minimum length (Asaas keys are typically 40+ characters)
	if (cleanKey.length < 32) {
		return {
			valid: false,
			error: `API Key muito curta (${cleanKey.length} caracteres, mínimo 32)`,
		};
	}

	// Check if starts with expected prefix ($aact_)
	if (!cleanKey.startsWith('$aact_')) {
		return {
			valid: false,
			error: 'API Key deve começar com $aact_',
		};
	}

	// Check for invalid characters (should be alphanumeric, underscores, and dollar sign)
	if (!API_KEY_VALIDATION_REGEX.test(cleanKey)) {
		return {
			valid: false,
			error: 'API Key contém caracteres inválidos',
		};
	}

	return { valid: true };
}

// ═══════════════════════════════════════════════════════
// CLIENT CONFIGURATION
// ═══════════════════════════════════════════════════════

/**
 * Helper to get Asaas client from database settings
 * Falls back to environment variables if database settings not found
 * Uses enhanced client with circuit breaker and retry logic
 *
 * @param ctx - Convex action context
 * @returns Configured AsaasClient instance
 * @throws AsaasConfigurationError if API key is not configured or invalid
 */
export async function getAsaasClientFromSettings(ctx: ActionCtx | QueryCtx): Promise<AsaasClient> {
	// Try to get settings from database first
	const config = await ctx.runQuery(internal.settings.internalGetIntegrationConfig, {
		integrationName: 'asaas',
	});

	// Log what keys are available in config
	// Config loaded from database (if available)

	// Determine API key source
	const dbApiKey = config?.api_key || config?.apiKey;
	const envApiKey = process.env.ASAAS_API_KEY;
	const apiKey = dbApiKey || envApiKey;

	// Determine base URL
	const baseUrl =
		config?.base_url || config?.baseUrl || process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3';

	// API key will be sourced from database (priority) or environment variable

	// Check if API key exists
	if (!apiKey) {
		throw new AsaasConfigurationError(
			'ASAAS_API_KEY não configurada.\n' +
				'Configure via:\n' +
				'1. Convex Dashboard > Environment Variables > ASAAS_API_KEY, OU\n' +
				'2. UI Admin > Configurações > Integrações > Asaas > Salvar API Key\n' +
				'Verifique o status em: Admin > Integrações > Asaas > Status da Configuração',
		);
	}

	// Validate API key format
	const validation = validateAsaasApiKey(apiKey);
	if (!validation.valid) {
		throw new AsaasConfigurationError(
			`API Key inválida: ${validation.error}\n` +
				'Verifique se a key foi copiada corretamente do painel Asaas.\n' +
				'Gere uma nova key em: https://www.asaas.com > Integrações > API',
		);
	}

	// Use enhanced client with circuit breaker and retry logic
	return createAsaasClient({ apiKey, baseUrl });
}

// ═══════════════════════════════════════════════════════
// CONFIGURATION STATUS
// ═══════════════════════════════════════════════════════

/**
 * Get detailed configuration status for diagnostics
 * @param ctx - Convex query context
 * @returns Configuration status object
 */
export async function getConfigurationStatus(ctx: ActionCtx | QueryCtx): Promise<{
	isConfigured: boolean;
	isValid: boolean;
	activeSource: 'database' | 'environment' | 'none';
	sources: {
		environment: {
			exists: boolean;
			valid: boolean;
			masked: string | null;
		};
		database: {
			exists: boolean;
			valid: boolean;
			masked: string | null;
		};
	};
	baseUrl: string;
	recommendations: string[];
}> {
	// Check environment variable

	const envKeyExists = !!process.env.ASAAS_API_KEY;
	const envKeyValid =
		envKeyExists && process.env.ASAAS_API_KEY
			? validateAsaasApiKey(process.env.ASAAS_API_KEY).valid
			: false;

	// Check database settings
	const config = await ctx.runQuery(internal.settings.internalGetIntegrationConfig, {
		integrationName: 'asaas',
	});

	const dbKey = config?.api_key || config?.apiKey;
	const dbKeyExists = !!dbKey;
	const dbKeyValid = dbKeyExists ? validateAsaasApiKey(dbKey).valid : false;

	// Determine which source is being used
	let activeSource: 'database' | 'environment' | 'none' = 'none';
	if (dbKeyExists) {
		activeSource = 'database';
	} else if (envKeyExists) {
		activeSource = 'environment';
	}

	const isConfigured = dbKeyExists || envKeyExists;
	const isValid = (dbKeyExists && dbKeyValid) || (envKeyExists && envKeyValid);

	// Get base URL
	const baseUrl =
		config?.base_url || config?.baseUrl || process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3';

	// Generate recommendations
	const recommendations = generateRecommendations(
		isConfigured,
		isValid,
		activeSource,
		dbKeyValid,
		envKeyValid,
	);

	return {
		isConfigured,
		isValid,
		activeSource,
		sources: {
			environment: {
				exists: envKeyExists,
				valid: envKeyValid,
				masked: envKeyExists ? `${process.env.ASAAS_API_KEY?.substring(0, 8)}...` : null,
			},
			database: {
				exists: dbKeyExists,
				valid: dbKeyValid,
				masked: dbKeyExists ? `${dbKey.substring(0, 8)}...` : null,
			},
		},
		baseUrl,
		recommendations,
	};
}

/**
 * Generate recommendations based on configuration status
 */
function generateRecommendations(
	isConfigured: boolean,
	isValid: boolean,
	source: string,
	dbKeyValid: boolean,
	envKeyValid: boolean,
): string[] {
	const recommendations: string[] = [];

	if (!isConfigured) {
		recommendations.push('Configure a API key via Convex Dashboard ou UI Admin');
		recommendations.push('Acesse: Admin > Configurações > Integrações > Asaas');
		recommendations.push('Ou adicione ASAAS_API_KEY nas Environment Variables do Convex Dashboard');
	} else if (isValid) {
		recommendations.push('✅ Configuração válida');
		recommendations.push(`📍 Usando API key de: ${source}`);
	} else {
		if (source === 'database' && !dbKeyValid) {
			recommendations.push('API key no database está inválida');
		} else if (source === 'environment' && !envKeyValid) {
			recommendations.push('API key em environment variable está inválida');
		}
		recommendations.push('Verifique se a key foi copiada corretamente do painel Asaas');
		recommendations.push('Gere uma nova key em: https://www.asaas.com > Integrações > API');
	}

	return recommendations;
}
