/**
 * Organization-Scoped Asaas API Keys
 *
 * Multi-tenant API key management for Asaas integration.
 * Each organization can have their own Asaas API configuration.
 */

import { v } from 'convex/values';

import { action, internalQuery, mutation, query } from '../_generated/server';
import { getOrganizationId, requirePermission } from '../lib/auth';
import { decrypt, encrypt } from '../lib/encryption';
import { PERMISSIONS } from '../lib/permissions';
import { createAsaasClient } from './client';

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get the organization's Asaas API key configuration
 * Returns masked API key for security
 */
export const getOrganizationApiKey = query({
	args: {},
	returns: v.union(
		v.object({
			// biome-ignore lint/style/useNamingConvention: Convex system field
			_id: v.id('organizationAsaasApiKeys'),
			organizationId: v.string(),
			apiKeyMasked: v.string(),
			baseUrl: v.string(),
			environment: v.union(v.literal('production'), v.literal('sandbox')),
			hasWebhookSecret: v.boolean(),
			isActive: v.boolean(),
			lastTestedAt: v.optional(v.number()),
			lastTestResult: v.optional(v.boolean()),
			lastTestMessage: v.optional(v.string()),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		// Settings are admin-only
		await requirePermission(ctx, PERMISSIONS.ALL);
		const orgId = await getOrganizationId(ctx);

		const config = await ctx.db
			.query('organizationAsaasApiKeys')
			.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
			.first();

		if (!config) return null;

		// Mask the API key for display
		let apiKeyMasked = '••••••••';
		try {
			const decryptedKey = await decrypt(config.encryptedApiKey);
			if (decryptedKey && decryptedKey.length > 8) {
				apiKeyMasked = `${decryptedKey.substring(0, 4)}••••${decryptedKey.substring(decryptedKey.length - 4)}`;
			}
		} catch {
			// Keep default mask if decryption fails
		}

		return {
			_id: config._id,
			organizationId: config.organizationId,
			apiKeyMasked,
			baseUrl: config.baseUrl,
			environment: config.environment,
			hasWebhookSecret: Boolean(config.encryptedWebhookSecret),
			isActive: config.isActive,
			lastTestedAt: config.lastTestedAt,
			lastTestResult: config.lastTestResult,
			lastTestMessage: config.lastTestMessage,
			createdAt: config.createdAt,
			updatedAt: config.updatedAt,
		};
	},
});

/**
 * Internal query to get decrypted API key for server-side use
 * Used by actions that need the actual API key
 */
export const internalGetOrganizationApiKey = internalQuery({
	args: { organizationId: v.string() },
	returns: v.union(
		v.object({
			apiKey: v.string(),
			baseUrl: v.string(),
			environment: v.union(v.literal('production'), v.literal('sandbox')),
			webhookSecret: v.optional(v.string()),
			isActive: v.boolean(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const config = await ctx.db
			.query('organizationAsaasApiKeys')
			.withIndex('by_organization_active', (q) =>
				q.eq('organizationId', args.organizationId).eq('isActive', true),
			)
			.first();

		if (!config) return null;

		// Decrypt API key
		let apiKey: string;
		try {
			apiKey = await decrypt(config.encryptedApiKey);
		} catch (_error) {
			return null;
		}

		// Decrypt webhook secret if present
		let webhookSecret: string | undefined;
		if (config.encryptedWebhookSecret) {
			try {
				webhookSecret = await decrypt(config.encryptedWebhookSecret);
			} catch {
				// Non-critical, continue without webhook secret
			}
		}

		return {
			apiKey,
			baseUrl: config.baseUrl,
			environment: config.environment,
			webhookSecret,
			isActive: config.isActive,
		};
	},
});

// ═══════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════

/**
 * Save or update organization's Asaas API key configuration
 */
export const saveOrganizationApiKey = mutation({
	args: {
		apiKey: v.string(),
		baseUrl: v.string(),
		environment: v.union(v.literal('production'), v.literal('sandbox')),
		webhookSecret: v.optional(v.string()),
		isActive: v.boolean(),
	},
	returns: v.id('organizationAsaasApiKeys'),
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE);
		const orgId = await getOrganizationId(ctx);
		const now = Date.now();

		// Encrypt sensitive data
		const encryptedApiKey = await encrypt(args.apiKey);
		const encryptedWebhookSecret = args.webhookSecret
			? await encrypt(args.webhookSecret)
			: undefined;

		// Check if config already exists
		const existing = await ctx.db
			.query('organizationAsaasApiKeys')
			.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
			.first();

		if (existing) {
			// Update existing
			await ctx.db.patch(existing._id, {
				encryptedApiKey,
				baseUrl: args.baseUrl,
				environment: args.environment,
				encryptedWebhookSecret,
				isActive: args.isActive,
				updatedBy: identity.subject,
				updatedAt: now,
				// Reset test status on config change
				lastTestedAt: undefined,
				lastTestResult: undefined,
				lastTestMessage: undefined,
			});
			return existing._id;
		}

		// Create new
		return await ctx.db.insert('organizationAsaasApiKeys', {
			organizationId: orgId,
			encryptedApiKey,
			baseUrl: args.baseUrl,
			environment: args.environment,
			encryptedWebhookSecret,
			isActive: args.isActive,
			createdBy: identity.subject,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Delete organization's Asaas API key configuration
 */
export const deleteOrganizationApiKey = mutation({
	args: {},
	returns: v.boolean(),
	handler: async (ctx) => {
		await requirePermission(ctx, PERMISSIONS.SETTINGS_WRITE);
		const orgId = await getOrganizationId(ctx);

		const existing = await ctx.db
			.query('organizationAsaasApiKeys')
			.withIndex('by_organization', (q) => q.eq('organizationId', orgId))
			.first();

		if (!existing) {
			return false;
		}

		await ctx.db.delete(existing._id);
		return true;
	},
});

/**
 * Internal mutation to update test result
 */
export const updateTestResult = mutation({
	args: {
		configId: v.id('organizationAsaasApiKeys'),
		success: v.boolean(),
		message: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.configId, {
			lastTestedAt: Date.now(),
			lastTestResult: args.success,
			lastTestMessage: args.message,
			updatedAt: Date.now(),
		});
		return null;
	},
});

// ═══════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Test the organization's Asaas API key connection
 */
export const testOrganizationApiKey = action({
	args: {
		apiKey: v.string(),
		baseUrl: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		message: v.string(),
		details: v.optional(v.any()),
	}),
	handler: async (_ctx, args) => {
		try {
			// Create client with provided credentials
			const client = createAsaasClient({
				apiKey: args.apiKey,
				baseUrl: args.baseUrl,
			});

			// Test by fetching account info or listing customers
			const response = await client.listAllCustomers({ limit: 1 });

			return {
				success: true,
				message: 'Conexão com Asaas estabelecida com sucesso!',
				details: {
					totalCustomers: response.totalCount ?? 0,
				},
			};
		} catch (error: unknown) {
			const err = error as {
				response?: {
					status?: number;
					data?: {
						errors?: Array<{ description?: string }>;
					};
				};
				message?: string;
			};
			const errorMessage =
				err.response?.data?.errors?.[0]?.description ||
				err.message ||
				'Erro desconhecido ao conectar com Asaas';

			return {
				success: false,
				message: `Falha na conexão: ${errorMessage}`,
				details: {
					statusCode: err.response?.status,
					error: errorMessage,
				},
			};
		}
	},
});
