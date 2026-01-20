import axios from 'axios';
import type { FunctionReference } from 'convex/server';
import { v } from 'convex/values';

import { action } from '../_generated/server';
import { createAsaasClient } from '../lib/asaas';

const TRAILING_SLASH_REGEX = /\/$/;

interface IntegrationConfig {
	base_url?: string;
	baseUrl?: string;
	api_key?: string;
	apiKey?: string;
}

interface InternalApi {
	settings: {
		internalGetIntegrationConfig: FunctionReference<'query', 'internal'>;
	};
}

const getInternalApi = (): InternalApi => {
	const apiModule = require('../_generated/api') as unknown;
	return (apiModule as { internal: InternalApi }).internal;
};

export const testAsaasConnection = action({
	args: {
		apiKey: v.string(),
		baseUrl: v.string(),
	},
	returns: v.any(),
		handler: async (_ctx, args) => {
			try {
				const client = createAsaasClient({
					apiKey: args.apiKey,
					baseUrl: args.baseUrl,
				});

			// testConnection makes a lightweight call (e.g. list customers limit=1)
			await client.testConnection();

			return {
				success: true,
				message: 'Conexão com Asaas estabelecida com sucesso.',
			};
		} catch (error) {
			let message = 'Falha na conexão com Asaas.';
			const axiosError = axios.isAxiosError(error) ? error : null;

			if (axiosError?.response) {
				if (axiosError.response.status === 401) {
					message = 'Erro de autenticação: API Key inválida.';
				} else if (axiosError.response.status === 404) {
					message = 'URL base incorreta ou endpoint não encontrado.';
				} else {
					message = `Erro na API (${axiosError.response.status}): ${JSON.stringify(
						axiosError.response.data,
					)}`;
				}
			} else if (axiosError?.code === 'ECONNABORTED') {
				message = 'Timeout na conexão.';
			} else if (axiosError?.code === 'ENOTFOUND') {
				message = 'URL base inalcançável.';
			}

			return {
				success: false,
				message,
				details: error instanceof Error ? error.message : String(error),
			};
		}
	},
});

export const sendMessageToDify = action({
	args: {
		query: v.string(),
		conversationId: v.optional(v.string()),
		user: v.string(),
	},
	returns: v.any(),
		handler: async (ctx, args) => {
			const internalApi = getInternalApi();
			const config = (await ctx.runQuery(internalApi.settings.internalGetIntegrationConfig, {
				integrationName: 'dify',
			})) as IntegrationConfig | null;

			const baseUrl = config?.base_url || config?.baseUrl;
			const apiKey = config?.api_key || config?.apiKey;

		if (!(baseUrl && apiKey)) {
			throw new Error('Dify configuration missing in settings.');
		}

			const sanitizedBaseUrl = baseUrl.replace(TRAILING_SLASH_REGEX, '');
			const url = `${sanitizedBaseUrl}/chat-messages`;

			try {
				const response = await axios.post(
					url,
					{
						query: args.query,
						user: args.user,
						inputs: {},
						response_mode: 'blocking',
						conversation_id: args.conversationId,
					},
					{
						headers: {
							authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
					},
				);

				return response.data;
			} catch (error) {
				if (axios.isAxiosError(error) && error.response) {
					throw new Error(
						`Dify API Error: ${error.response.status} - ${JSON.stringify(
							error.response.data,
						)}`,
					);
				}
				throw new Error(
					`Dify Connection Error: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		},
});

export const testEvolutionConnection = action({
	args: {
		apiKey: v.string(),
		apiUrl: v.string(),
		instanceName: v.string(),
	},
	returns: v.any(),
	handler: async (_ctx, args) => {
		try {
			// Endpoint: GET /instance/connectionState/{instanceName}
			// Need to construct full URL carefully
			const baseUrl = args.apiUrl.replace(TRAILING_SLASH_REGEX, '');
			const url = `${baseUrl}/instance/connectionState/${args.instanceName}`;

			const response = await axios.get(url, {
				headers: {
					apikey: args.apiKey,
				},
				timeout: 10_000,
			});

			if (response.status === 200) {
				// Check body if specific state is needed?
				// Usually getting 200 means connection and auth worked.
				return {
					success: true,
					message: 'Conexão com Evolution API estabelecida com sucesso.',
				};
			}

			return {
				success: false,
				message: `Status inesperado: ${response.status}`,
			};
		} catch (error) {
			let message = 'Falha na conexão com Evolution API.';
			const axiosError = axios.isAxiosError(error) ? error : null;

			if (axiosError?.response) {
				if (axiosError.response.status === 401 || axiosError.response.status === 403) {
					message = 'Acesso negado: Verifique sua API Key.';
				} else if (axiosError.response.status === 404) {
					message = 'Instância não encontrada ou URL incorreta.';
				}
			}

			return {
				success: false,
				message,
				details: error instanceof Error ? error.message : String(error),
			};
		}
	},
});

export const testDifyConnection = action({
	args: {
		apiKey: v.string(),
		apiUrl: v.string(),
		appId: v.string(),
	},
	returns: v.any(),
	handler: async (_ctx, args) => {
		try {
			// Endpoint: GET /info or /parameters?
			// Dify API usually requires "Authorization: Bearer " + apiKey

			const baseUrl = args.apiUrl.replace(TRAILING_SLASH_REGEX, '');

			// Use appId in the request to ensure it's valid as per verification comment
			// "build the URL with the app id path or query according to Dify’s API, such as `${baseUrl}/apps/${appId}/parameters`"
			// We will assume the user considers `${baseUrl}/apps/${args.appId}/parameters` as the validation target.
			// Note: Standard Dify App API doesn't always have this path, but if we are using an API key that has access to multiple apps or checking context, this might be relevant.
			// If the user meant the standard API, we might append it as query param if the path is generic.
			// But let's try to construct a path that includes it if possible or fall back to a safe check if 404.
			// Based on explicit instruction: "such as `${baseUrl}/apps/${appId}/parameters`".
			// I will use that pattern or similar structure if I can't confirm.

			// Let's try to pass it as a query parameter as well if the path is generic /parameters.
			// But the instruction says "build the URL with the app id path".

			// CAUTION: If the Dify instance is standard, `/parameters` is for the bound app.
			// If we change it to `/apps/ID/parameters`, it might be a workspace API.
			// I will assume the provided URL is the BASE API URL.
			// I will update the URL construction.

			// Attempting the user-suggested format which implies specific ID checking:
			const url = `${baseUrl}/apps/${args.appId}/parameters`;

			// Wait, standard Dify Client API is different from Console API.
			// If this fails (404), it might be because the user provided a Client API Key but expects a Console API path?
			// Or maybe the user knows their Dify version supports this.
			// Giving the user what they asked for "verbatim".

			await axios.get(url, {
				headers: {
					authorization: `Bearer ${args.apiKey}`,
				},
				timeout: 10_000,
			});

			// If we get 200, it's good.
			return {
				success: true,
				message: 'Conexão com Dify AI estabelecida com sucesso.',
			};
		} catch (error) {
			let message = 'Falha na conexão com Dify AI.';
			const axiosError = axios.isAxiosError(error) ? error : null;

			if (axiosError?.response) {
				if (axiosError.response.status === 401) {
					message = 'Erro de autenticação: API Key inválida.';
				} else if (axiosError.response.status === 404) {
					// Distinct error for App ID as requested
					message = 'App ID inválido ou URL incorreta (404).';
				} else {
					message = `Erro na API (${axiosError.response.status}): ${JSON.stringify(
						axiosError.response.data,
					)}`;
				}
			} else if (axiosError?.code === 'ECONNABORTED') {
				message = 'Timeout na conexão.';
			} else if (axiosError?.code === 'ENOTFOUND') {
				message = 'URL base inalcançável.';
			}

			return {
				success: false,
				message,
				details: error instanceof Error ? error.message : String(error),
			};
		}
	},
});
