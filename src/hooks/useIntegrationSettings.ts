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

export function useIntegrationSettings(integration: IntegrationType) {
	const [isTesting, setIsTesting] = useState(false);
	const [lastTestResult, setLastTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	// Load settings
	// @ts-expect-error - integrations not yet generated in API
	const settings = useQuery(api.integrations.getIntegrationConfig, { integration });

	// Mutations and Actions
	// @ts-expect-error - integrations not yet generated in API
	const saveConfigMutation = useMutation(api.integrations.saveIntegrationConfig);

	// Actions
	// Note: These actions will fail type check until convex/integrations/actions.ts is created
	// @ts-expect-error - actions not yet generated in API
	const testAsaas = useAction(api.integrations.actions.testAsaasConnection);
	// @ts-expect-error - actions not yet generated in API
	const testEvolution = useAction(api.integrations.actions.testEvolutionConnection);
	// @ts-expect-error - actions not yet generated in API
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
				if (integration === 'asaas') {
					if (!(config.apiKey && config.baseUrl)) throw new Error('Configuração incompleta');
					result = await testAsaas({ apiKey: config.apiKey, baseUrl: config.baseUrl });
				} else if (integration === 'evolution') {
					if (!(config.apiKey && config.url && config.instanceName))
						throw new Error('Configuração incompleta');
					result = await testEvolution({
						apiKey: config.apiKey,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						apiUrl: config.url!,
						instanceName: config.instanceName,
					});
				} else if (integration === 'dify') {
					if (!(config.apiKey && config.url && config.appId))
						throw new Error('Configuração incompleta');
					result = await testDify({
						apiKey: config.apiKey,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						apiUrl: config.url!,
						appId: config.appId,
					});
				}

				if (result?.success) {
					toast.success(result.message || 'Conexão estabelecida com sucesso');
					setLastTestResult({ success: true, message: result.message });
				} else {
					toast.error(result?.message || 'Falha na conexão');
					setLastTestResult({ success: false, message: result?.message || 'Falha desconhecida' });
				}
				return result;
			} catch (error: any) {
				const msg = error.message || 'Erro ao testar conexão';
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
		const hasKey = !!settings.apiKey;
		if (hasKey) return 'active';
		return 'inactive';
	}, [settings]);

	return {
		settings,
		loading: settings === undefined,
		saveSettings,
		testConnection,
		isTesting,
		lastTestResult,
		getIntegrationStatus,
	};
}
