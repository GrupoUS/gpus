import { v } from 'convex/values';

import { internalQuery, mutation, query } from './_generated/server';
import { getOrganizationId, hasPermission, requireAuth } from './lib/auth';
import { decrypt, encrypt, isEncrypted } from './lib/encryption';
import { PERMISSIONS } from './lib/permissions';

// Keys that should always be encrypted
const SENSITIVE_KEYS = [
	'integration_asaas_api_key',
	'integration_asaas_webhook_secret',
	'integration_evolution_api_key',
	'integration_dify_key',
];

export interface CashbackSettings {
	cashbackAmount: number;
	cashbackType: 'fixed' | 'percentage';
}

export interface OrganizationSettings {
	cashbackAmount?: number;
	cashbackType?: 'fixed' | 'percentage';
	[key: string]: any;
}

function isSensitiveKey(key: string): boolean {
	// Strip organization prefix if present (org_{orgId}_)
	// We handle variable length orgIds, assuming they don't contain underscores usually,
	// but strictly the pattern is 'org_' + part + '_' + rest
	// A regex replacement is safer: org_[^_]+_(.*)
	const cleanKey = key.startsWith('org_') ? key.replace(/^org_[^_]+_/, '') : key;

	return (
		SENSITIVE_KEYS.includes(cleanKey) ||
		cleanKey.endsWith('_key') ||
		cleanKey.endsWith('_secret') ||
		cleanKey.endsWith('_token')
	);
}

function isOrganizationSettingKey(key: string): boolean {
	return key.startsWith('org_');
}

function validateCashbackSettings(settings: {
	cashbackAmount?: number;
	cashbackType?: 'fixed' | 'percentage';
}): {
	valid: boolean;
	error?: string;
} {
	const { cashbackAmount, cashbackType } = settings;

	// Check consistency - if one is present, both must be provided
	const hasAmount = cashbackAmount !== undefined;
	const hasType = cashbackType !== undefined;

	if (hasAmount !== hasType) {
		return {
			valid: false,
			error: 'Configurações de cashback devem ser fornecidas juntas (valor e tipo).',
		};
	}

	// Validate values if present
	if (hasAmount && hasType) {
		if (cashbackType === 'percentage') {
			if (cashbackAmount < 0 || cashbackAmount > 100) {
				return {
					valid: false,
					error: 'Porcentagem de cashback deve estar entre 0 e 100.',
				};
			}
		} else if (cashbackType === 'fixed') {
			if (cashbackAmount < 0 || cashbackAmount > 10_000) {
				return {
					valid: false,
					error: 'Valor fixo de cashback deve estar entre 0 e 10000.',
				};
			}
		} else {
			return { valid: false, error: 'Tipo de cashback inválido.' };
		}
	}

	return { valid: true };
}

// Inline validator to avoid circular dependencies with convex/asaas/config.ts
function validateAsaasApiKey(key: string): {
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
	const validPattern = /^[$a-zA-Z0-9_]+$/;
	if (!validPattern.test(cleanKey)) {
		return {
			valid: false,
			error: 'API Key contém caracteres inválidos',
		};
	}

	return { valid: true };
}

// List all settings (Admin only)
export const list = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);

		// Only admins can see all settings
		if (!(await hasPermission(ctx, PERMISSIONS.ALL))) {
			throw new Error('Unauthorized');
		}

		return await ctx.db.query('settings').collect();
	},
});

// Get a specific setting by key
export const get = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		const isAdmin = await hasPermission(ctx, PERMISSIONS.ALL);

		const setting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', args.key))
			.unique();

		if (!setting) return null;

		// If sensitive, decrypt only if admin
		if (isSensitiveKey(args.key)) {
			if (!isAdmin) return null; // Mask for non-admins
			if (typeof setting.value === 'string' && isEncrypted(setting.value)) {
				return await decrypt(setting.value);
			}
		}

		return setting.value;
	},
});

// Set a setting (Admin only)
export const set = mutation({
	args: {
		key: v.string(),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		if (!(await hasPermission(ctx, PERMISSIONS.ALL))) {
			throw new Error('Unauthorized');
		}

		let valueToStore = args.value;

		// Validate Asaas API Key
		if (args.key === 'integration_asaas_api_key') {
			const validation = validateAsaasApiKey(args.value);
			if (!validation.valid) {
				throw new Error(validation.error);
			}
		}

		// Encrypt sensitive keys
		if (isSensitiveKey(args.key) && typeof args.value === 'string') {
			valueToStore = await encrypt(args.value);
		}

		const existing = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', args.key))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				value: valueToStore,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.insert('settings', {
				key: args.key,
				value: valueToStore,
				updatedAt: Date.now(),
			});
		}
	},
});

// Helper to get integration config (internal use via runQuery or protected query)
export const getIntegrationConfig = query({
	args: { integrationName: v.string() }, // e.g., "asaas", "evolution", "dify"
	handler: async (ctx, args) => {
		// Protected query, restricted to admin
		await requireAuth(ctx);
		if (!(await hasPermission(ctx, PERMISSIONS.ALL))) {
			return {
				baseUrl: null,
				apiKey: null,
				webhookSecret: null,
			};
		}

		const baseUrlSetting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', `integration_${args.integrationName}_base_url`))
			.unique();

		const apiKeySetting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', `integration_${args.integrationName}_api_key`))
			.unique();

		const webhookSecretSetting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', `integration_${args.integrationName}_webhook_secret`))
			.unique();

		// Decrypt sensitive values
		let decryptedApiKey: string | null = null;
		let decryptedWebhookSecret: string | null = null;

		if (apiKeySetting?.value && typeof apiKeySetting.value === 'string') {
			try {
				decryptedApiKey = await decrypt(apiKeySetting.value);
			} catch {
				// If decryption fails, might be plain text (migration)
				decryptedApiKey = apiKeySetting.value;
			}
		}

		if (webhookSecretSetting?.value && typeof webhookSecretSetting.value === 'string') {
			try {
				decryptedWebhookSecret = await decrypt(webhookSecretSetting.value);
			} catch {
				decryptedWebhookSecret = webhookSecretSetting.value;
			}
		}

		return {
			baseUrl: baseUrlSetting?.value ?? null,
			apiKey: decryptedApiKey,
			webhookSecret: decryptedWebhookSecret,
		};
	},
});

// Internal helper for system actions (bypassing admin check)
export const internalGetIntegrationConfig = internalQuery({
	args: { integrationName: v.string() },
	handler: async (ctx, args) => {
		const prefix = `integration_${args.integrationName}_`;
		const settings = await ctx.db.query('settings').collect();

		const config: Record<string, any> = {};

		for (const setting of settings) {
			if (setting.key.startsWith(prefix)) {
				const key = setting.key.replace(prefix, '');
				let value = setting.value;

				if (isSensitiveKey(setting.key) && typeof value === 'string' && isEncrypted(value)) {
					value = await decrypt(value);
				}

				config[key] = value;
			}
		}

		return config;
	},
});

// Get user-specific setting (e.g., notifications, appearance)
export const getUserSetting = query({
	args: { settingType: v.string() },
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		if (!user) return null;

		const key = `user_${args.settingType}_${user._id}`;
		const setting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', key))
			.unique();

		return setting?.value ?? null;
	},
});

// Get all organization settings (Admin only)
export const getOrganizationSettings = query({
	args: { organizationId: v.string() },
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		// Only admins can see all settings
		if (!(await hasPermission(ctx, PERMISSIONS.ALL))) {
			throw new Error('Unauthorized');
		}

		const prefix = `org_${args.organizationId}_`;
		// Use range query to find organization settings
		const orgSettingsList = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.gte('key', prefix).lt('key', `${prefix}\uffff`))
			.collect();

		const orgSettings: OrganizationSettings = {};

		for (const setting of orgSettingsList) {
			if (setting.key.startsWith(prefix)) {
				const key = setting.key.replace(prefix, '');
				let value = setting.value;

				// Decrypt sensitive values
				if (isSensitiveKey(setting.key) && typeof value === 'string' && isEncrypted(value)) {
					value = await decrypt(value);
				}

				orgSettings[key] = value;
			}
		}

		return Object.keys(orgSettings).length > 0 ? orgSettings : null;
	},
});

// Get cashback settings for the organization
export const getCashbackSettings = query({
	args: { organizationId: v.string() },
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const userOrgId = await getOrganizationId(ctx);

		// Security check: ensure user belongs to the requested organization
		// Or allow if user is admin (hasPermission check)
		if (userOrgId !== args.organizationId && !(await hasPermission(ctx, PERMISSIONS.ALL))) {
			throw new Error('Unauthorized');
		}

		const amountKey = `org_${args.organizationId}_cashbackAmount`;
		const typeKey = `org_${args.organizationId}_cashbackType`;

		const amountSetting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', amountKey))
			.unique();

		const typeSetting = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', typeKey))
			.unique();

		if (amountSetting && typeSetting) {
			return {
				cashbackAmount: amountSetting.value,
				cashbackType: typeSetting.value,
			};
		}

		return null;
	},
});

// Set user-specific setting
export const setUserSetting = mutation({
	args: {
		settingType: v.string(),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique();

		if (!user) throw new Error('User not found');

		const key = `user_${args.settingType}_${user._id}`;

		const existing = await ctx.db
			.query('settings')
			.withIndex('by_key', (q) => q.eq('key', key))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				value: args.value,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.insert('settings', {
				key,
				value: args.value,
				updatedAt: Date.now(),
			});
		}
	},
});

// Update organization settings (Admin only)
export const updateOrganizationSettings = mutation({
	args: {
		organizationId: v.string(),
		settings: v.any(),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);

		// Only admins can update organization settings
		if (!(await hasPermission(ctx, PERMISSIONS.ALL))) {
			throw new Error('Unauthorized: Admin access required');
		}

		// Verify user belongs to the requested organization
		const userOrgId = await getOrganizationId(ctx);
		if (userOrgId !== args.organizationId) {
			throw new Error('Unauthorized: Organization mismatch');
		}

		const settings = args.settings as OrganizationSettings;

		// Validate cashback settings
		const validation = validateCashbackSettings(settings);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const keys = Object.keys(settings);
		for (const key of keys) {
			const value = settings[key];
			if (value === undefined) continue;

			const prefixedKey = `org_${args.organizationId}_${key}`;
			let valueToStore = value;

			// Encrypt sensitive keys
			if (isSensitiveKey(prefixedKey) && typeof value === 'string') {
				valueToStore = await encrypt(value);
			}

			const existing = await ctx.db
				.query('settings')
				.withIndex('by_key', (q) => q.eq('key', prefixedKey))
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					value: valueToStore,
					updatedAt: Date.now(),
				});
			} else {
				await ctx.db.insert('settings', {
					key: prefixedKey,
					value: valueToStore,
					updatedAt: Date.now(),
				});
			}
		}

		// Log activity
		await ctx.db.insert('activities', {
			type: 'integracao_configurada',
			description: 'Configurações da organização atualizadas',
			metadata: {
				organizationId: args.organizationId,
				changedSettings: keys,
			},
			organizationId: args.organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});
	},
});

// NOTE: Use original export names: get, set, list, getIntegrationConfig
