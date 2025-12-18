import { useAction, useMutation, useQuery } from 'convex/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { api } from '../../convex/_generated/api';

export type IntegrationType = 'asaas' | 'evolution' | 'dify';

export interface IntegrationConfig {
	apiKey?: string;
	baseUrl?: string; // or url
	environment?: string; // for asaas
	webhookSecret?: string; // for asaas
	instanceName?: string; // for evolution
	appId?: string; // for dify
	url?: string; // alias
	[key: string]: unknown;
}

function validateAsaasConfig(config: IntegrationConfig) {
	if (!(config.apiKey && config.baseUrl)) throw new Error('Configuração incompleta');
	return { apiKey: config.apiKey, baseUrl: config.baseUrl };
}

function validateEvolutionConfig(config: IntegrationConfig) {
	if (!(config.apiKey && config.url && config.instanceName))
		throw new Error('Configuração incompleta');
	return { apiKey: config.apiKey, apiUrl: config.url, instanceName: config.instanceName };
}

function validateDifyConfig(config: IntegrationConfig) {
	if (!(config.apiKey && config.url && config.appId)) throw new Error('Configuração incompleta');
	return { apiKey: config.apiKey, apiUrl: config.url, appId: config.appId };
}

export function useIntegrationSettings(integration: IntegrationType) {
	const [isTesting, setIsTesting] = useState(false);
	const [lastTestResult, setLastTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	// Load settings
	const settings = useQuery(api.integrations.getIntegrationConfig, { integration });

	// Mutations and Actions
	const saveConfigMutation = useMutation(api.integrations.saveIntegrationConfig);

	// Actions
	const testAsaas = useAction(api.integrations.actions.testAsaasConnection);
	const testEvolution = useAction(api.integrations.actions.testEvolutionConnection);
	const testDify = useAction(api.integrations.actions.testDifyConnection);

	const saveSettings = useCallback(
		async (config: IntegrationConfig) => {
			try {
				await saveConfigMutation({ integration, config });
				toast.success(`Configurações de ${integration} salvas com sucesso`);
				return true;
			} catch (_error) {
				toast.error(`Erro ao salvar configurações de ${integration}`);
				return false;
			}
		},
		[integration, saveConfigMutation],
	);

	const testConnection = useCallback(
		async (config: IntegrationConfig) => {
			setIsTesting(true);
			setLastTestResult(null);

			try {
				let result: { success: boolean; message: string; details?: unknown } | undefined;

				// Validate and execute based on type
				switch (integration) {
					case 'asaas': {
						const args = validateAsaasConfig(config);
						result = await testAsaas(args);
						break;
					}
					case 'evolution': {
						const args = validateEvolutionConfig(config);
						result = await testEvolution(args);
						break;
					}
					case 'dify': {
						const args = validateDifyConfig(config);
						result = await testDify(args);
						break;
					}
				}

				if (result?.success) {
					toast.success(result.message || 'Conexão estabelecida com sucesso');
					setLastTestResult({ success: true, message: result.message });
				} else {
					const failureMsg = result?.message || 'Falha na conexão';
					toast.error(failureMsg);
					setLastTestResult({ success: false, message: failureMsg });
				}
				return result;
			} catch (error: unknown) {
				const err = error as Error;
				const msg = err.message || 'Erro ao testar conexão';
				toast.error(msg);
				setLastTestResult({ success: false, message: msg });
				return { success: false, message: msg };
			} finally {
				setIsTesting(false);
			}
		},
		[integration, testAsaas, testEvolution, testDify],
	);

	const getIntegrationStatus = useCallback(() => {
		if (settings === undefined) return 'loading';
		// Check if essential fields are present
		// settings will be an empty object {} if query fails, which is safe
		const hasKey = !!settings?.apiKey;
		if (hasKey) return 'active';
		return 'inactive';
	}, [settings]);

	return {
		settings: settings || {},
		loading: settings === undefined,
		saveSettings,
		testConnection,
		isTesting,
		lastTestResult,
		getIntegrationStatus,
	};
}
