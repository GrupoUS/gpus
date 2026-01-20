import { v } from 'convex/values';

import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import { getIdentity, hasOrgRole, requireAuth } from './lib/auth';
import { decrypt, encrypt, isEncrypted } from './lib/encryption';

// Helper to mask keys
function maskKey(key: string) {
	if (!key || key.length < 8) return '********';
	return `••••••••${key.slice(-4)}`;
}

const integrationArgs = v.union(v.literal('asaas'), v.literal('evolution'), v.literal('dify'));

type IntegrationKey = 'asaas' | 'evolution' | 'dify';
type IntegrationConfig = Record<string, string>;

const integrationFields: Record<IntegrationKey, string[]> = {
	asaas: ['api_key', 'base_url', 'environment', 'webhook_secret'],
	evolution: ['api_key', 'base_url', 'instance'],
	dify: ['api_key', 'base_url', 'app_id'],
};

const readMaskedSetting = async (
	ctx: QueryCtx,
	integration: IntegrationKey,
	field: string,
): Promise<string | null> => {
	const key = `integration_${integration}_${field}`;
	const setting = await ctx.db
		.query('settings')
		.withIndex('by_key', (q) => q.eq('key', key))
		.unique();

	if (!setting || setting.value === null || setting.value === undefined) {
		return null;
	}

	let value = setting.value;
	if (typeof value === 'string' && value.length > 0 && isEncrypted(value)) {
		try {
			value = await decrypt(value);
		} catch (_decryptError) {
			value = typeof value === 'string' ? value : String(value);
		}
	}

	const stringValue = typeof value === 'string' ? value : String(value);
	if (field.includes('api_key') || field.includes('secret') || field.includes('token')) {
		return maskKey(stringValue);
	}

	return stringValue;
};

const mapConfigForIntegration = (
	integration: IntegrationKey,
	config: IntegrationConfig,
): Record<string, string> => {
	const mapped: Record<string, string> = {};

	if (config.api_key) mapped.apiKey = config.api_key;
	if (config.base_url) {
		mapped.baseUrl = config.base_url;
		mapped.url = config.base_url;
	}
	if (config.webhook_secret) mapped.webhookSecret = config.webhook_secret;
	if (config.environment) mapped.environment = config.environment;

	if (integration === 'evolution') {
		if (config.instance) mapped.instanceName = config.instance;
		if (config.base_url) mapped.url = config.base_url;
	}
	if (integration === 'dify') {
		if (config.app_id) mapped.appId = config.app_id;
		if (config.base_url) mapped.url = config.base_url;
	}

	return mapped;
};

const mapIntegrationKey = (key: string) => {
	if (key === 'apiKey') return 'api_key';
	if (key === 'baseUrl') return 'base_url';
	if (key === 'url') return 'base_url';
	if (key === 'webhookSecret') return 'webhook_secret';
	if (key === 'instanceName') return 'instance';
	if (key === 'appId') return 'app_id';
	return key;
};

const updateIntegrationSettings = async (
	ctx: MutationCtx,
	integration: string,
	config: Record<string, unknown>,
): Promise<string[]> => {
	const keysToUpdate: string[] = [];

	for (const [key, value] of Object.entries(config)) {
		if (value === undefined || value === null || value === '') continue;

		const suffix = mapIntegrationKey(key);
		const settingsKey = `integration_${integration}_${suffix}`;

		let valueToStore = value;
		if (suffix.includes('api_key') || suffix.includes('secret') || suffix.includes('token')) {
			if (typeof value === 'string' && !value.includes('••••')) {
				valueToStore = await encrypt(value);
			} else if (typeof value === 'string' && value.includes('••••')) {
				continue;
			}
		}

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

	return keysToUpdate;
};

const logIntegrationUpdate = async (
	ctx: MutationCtx,
	integration: string,
	keysToUpdate: string[],
) => {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return;

	const user = await ctx.db
		.query('users')
		.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
		.unique();
	if (!user?.organizationId) return;

	await ctx.db.insert('activities', {
		type: 'integracao_configurada',
		description: `Configuração de ${integration} atualizada`,
		metadata: { fields: keysToUpdate },
		performedBy: identity.subject,
		organizationId: user.organizationId,
		createdAt: Date.now(),
	});
};

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

			const integration: IntegrationKey = args.integration;
			const config: IntegrationConfig = {};

			for (const field of integrationFields[integration]) {
				const value = await readMaskedSetting(ctx, integration, field);
				if (value !== null) {
					config[field] = value;
				}
			}

			return mapConfigForIntegration(integration, config);
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
		const keysToUpdate = await updateIntegrationSettings(
			ctx,
			integration,
			config as Record<string, unknown>,
		);
		await logIntegrationUpdate(ctx, integration, keysToUpdate);

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

		const result: Array<{
			id: string;
			name: string;
			required: string[];
			status: 'active' | 'inactive';
		}> = [];
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
