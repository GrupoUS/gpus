import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getIdentity, hasOrgRole, requireAuth } from './lib/auth';
import { decrypt, encrypt, isEncrypted } from './lib/encryption';

// Helper to mask keys
function maskKey(key: string) {
	if (!key || key.length < 8) return '********';
	return `••••••••${key.slice(-4)}`;
}

const integrationArgs = v.union(v.literal('asaas'), v.literal('evolution'), v.literal('dify'));

export const getIntegrationConfig = query({
	args: { integration: integrationArgs },
	handler: async (ctx, args) => {
		try {
			// Use getIdentity to avoid throwing - return empty if not authenticated
			const identity = await getIdentity(ctx);
			if (!identity) {
				// User not authenticated - return empty config instead of throwing
				return {};
			}

			// Validate integration argument
			const validIntegrations = ['asaas', 'evolution', 'dify'] as const;
			if (!validIntegrations.includes(args.integration as any)) {
				return {};
			}

			const fields = {
				asaas: ['api_key', 'base_url', 'environment', 'webhook_secret'],
				evolution: ['api_key', 'base_url', 'instance'],
				dify: ['api_key', 'base_url', 'app_id'],
			};

			const config: any = {};
			const relevantFields = fields[args.integration as keyof typeof fields];

			// Validate that relevantFields exists
			if (!(relevantFields && Array.isArray(relevantFields))) {
				return {};
			}

			for (const field of relevantFields) {
				try {
					// Map fields to settings keys:
					// evolution base_url -> integration_evolution_base_url
					// evolution instance -> integration_evolution_instance
					const key = `integration_${args.integration}_${field}`;
					const setting = await ctx.db
						.query('settings')
						.withIndex('by_key', (q) => q.eq('key', key))
						.unique();

					if (setting && setting.value !== null && setting.value !== undefined) {
						let value = setting.value;

						// Decrypt if encrypted - with proper error handling
						if (typeof value === 'string' && value.length > 0 && isEncrypted(value)) {
							try {
								value = await decrypt(value);
							} catch (_decryptError) {
								// If decryption fails, use the encrypted value but mask it
								// This prevents the query from failing completely
								value = typeof value === 'string' ? value : String(value);
							}
						}

						// Ensure value is a string for masking
						const stringValue = typeof value === 'string' ? value : String(value);

						// Mask sensitive fields for frontend display
						// We do NOT return the full API key to the frontend ever for security reasons
						if (field.includes('api_key') || field.includes('secret') || field.includes('token')) {
							config[field] = maskKey(stringValue);
						} else {
							config[field] = stringValue;
						}
					}
				} catch (_fieldError) {
					// Continue to next field instead of breaking the entire query
				}
			}

			// Map snake_case back to camelCase for frontend
			const mappedConfig: any = {};
			if (config.api_key) mappedConfig.apiKey = config.api_key;
			if (config.base_url) {
				mappedConfig.baseUrl = config.base_url;
				mappedConfig.url = config.base_url; // Alias
			}
			if (config.webhook_secret) mappedConfig.webhookSecret = config.webhook_secret;
			if (config.environment) mappedConfig.environment = config.environment;

			// Specifics
			if (args.integration === 'evolution') {
				if (config.instance) mappedConfig.instanceName = config.instance;
				if (config.base_url) mappedConfig.url = config.base_url; // Evolution schema uses `url`
			}
			if (args.integration === 'dify') {
				if (config.app_id) mappedConfig.appId = config.app_id;
				if (config.base_url) mappedConfig.url = config.base_url; // Dify schema uses `url`
			}

			return mappedConfig;
		} catch (_error) {
			return {};
		}
	},
});

export const saveIntegrationConfig = mutation({
	args: {
		integration: v.string(),
		config: v.any(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		if (!(await hasOrgRole(ctx, ['admin']))) {
			throw new Error('Unauthorized: Admin role required');
		}

		const { integration, config } = args;

		// Map camelCase (frontend) to snake_case (settings)
		const mapKey = (k: string) => {
			if (k === 'apiKey') return 'api_key';
			if (k === 'baseUrl') return 'base_url';
			if (k === 'url') return 'base_url';
			if (k === 'webhookSecret') return 'webhook_secret';
			if (k === 'instanceName') return 'instance';
			if (k === 'appId') return 'app_id';
			return k;
		};

		const keysToUpdate = [];

		for (const [key, value] of Object.entries(config)) {
			if (value === undefined || value === null || value === '') continue;

			const suffix = mapKey(key);
			// Validate suffix is valid for safety?
			// We will just store it.
			const settingsKey = `integration_${integration}_${suffix}`;

			let valueToStore = value;

			// Check if sensitive
			if (suffix.includes('api_key') || suffix.includes('secret') || suffix.includes('token')) {
				if (typeof value === 'string' && !value.includes('••••')) {
					valueToStore = await encrypt(value);
				} else if (typeof value === 'string' && value.includes('••••')) {
					continue; // Don't update if masked
				}
			}

			// Upsert
			const existing = await ctx.db
				.query('settings')
				.withIndex('by_key', (q) => q.eq('key', settingsKey))
				.unique();
			if (existing) {
				await ctx.db.patch(existing._id, { value: valueToStore, updatedAt: Date.now() });
			} else {
				await ctx.db.insert('settings', {
					key: settingsKey,
					value: valueToStore,
					updatedAt: Date.now(),
				});
			}
			keysToUpdate.push(suffix);
		}

		// Audit log
		const identity = await ctx.auth.getUserIdentity();
		if (identity) {
			const user = await ctx.db
				.query('users')
				.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
				.unique();
			if (user?.organizationId) {
				await ctx.db.insert('activities', {
					type: 'integracao_configurada',
					description: `Configuração de ${integration} atualizada`,
					metadata: { fields: keysToUpdate },
					performedBy: identity.subject,
					organizationId: user.organizationId,
					createdAt: Date.now(),
				});
			}
		}

		return { success: true };
	},
});

export const listIntegrations = query({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);
		const integrations = [
			{ id: 'asaas', name: 'Asaas', required: ['api_key', 'base_url'] },
			{ id: 'evolution', name: 'Evolution API', required: ['api_key', 'base_url', 'instance'] },
			{ id: 'dify', name: 'Dify AI', required: ['api_key', 'base_url', 'app_id'] },
		];

		const result = [];
		for (const integ of integrations) {
			let isConfigured = true;
			for (const req of integ.required) {
				const key = `integration_${integ.id}_${req}`;
				const setting = await ctx.db
					.query('settings')
					.withIndex('by_key', (q) => q.eq('key', key))
					.unique();
				if (!setting?.value) {
					isConfigured = false;
					break;
				}
			}
			result.push({ ...integ, status: isConfigured ? 'active' : 'inactive' });
		}
		return result;
	},
});
