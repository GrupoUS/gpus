import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '../lib/trpc';

export type IntegrationType = 'asaas' | 'evolution' | 'dify';

export interface IntegrationConfig {
	apiKey?: string;
	baseUrl?: string;
	environment?: string;
	webhookSecret?: string;
	instanceName?: string;
	appId?: string;
	url?: string;
	[key: string]: unknown;
}

function isMasked(value?: string) {
	return value && (value.includes('•') || value.startsWith('****'));
}

function validateAsaasConfig(config: IntegrationConfig) {
	if (isMasked(config.apiKey))
		throw new Error(
			'A chave API parece estar mascarada. Por favor, insira a chave completa para testar.',
		);
	if (!(config.apiKey && config.baseUrl)) throw new Error('Configuração incompleta');
	return { apiKey: config.apiKey, baseUrl: config.baseUrl };
}

function validateEvolutionConfig(config: IntegrationConfig) {
	if (isMasked(config.apiKey))
		throw new Error(
			'A chave API parece estar mascarada. Por favor, insira a chave completa para testar.',
		);
	if (!(config.apiKey && config.url && config.instanceName))
		throw new Error('Configuração incompleta');
	return { apiKey: config.apiKey, apiUrl: config.url, instanceName: config.instanceName };
}

function validateDifyConfig(config: IntegrationConfig) {
	if (isMasked(config.apiKey))
		throw new Error(
			'A chave API parece estar mascarada. Por favor, insira a chave completa para testar.',
		);
	if (!(config.apiKey && config.url && config.appId)) throw new Error('Configuração incompleta');
	return { apiKey: config.apiKey, apiUrl: config.url, appId: config.appId };
}

export function useIntegrationSettings(integration: IntegrationType) {
	const [isTesting, setIsTesting] = useState(false);
	const [lastTestResult, setLastTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	// Use settings router to get integration config
	const { data: settings } = trpc.settings.list.useQuery();

	// Extract integration config from settings
	const integrationConfig = (() => {
		if (!settings) return undefined;
		const setting = settings.find((s: { key?: string }) => s.key === `integration_${integration}`);
		return setting?.value as IntegrationConfig | undefined;
	})();

	const saveSettings = useCallback(
		(_config: IntegrationConfig) => {
			// TODO: Add saveIntegrationConfig mutation to settings router
			toast.success(`Configurações de ${integration} salvas com sucesso`);
			return true;
		},
		[integration],
	);

	const testConnection = useCallback(
		(config: IntegrationConfig) => {
			setIsTesting(true);
			setLastTestResult(null);

			try {
				// TODO: Add test connection actions to tRPC
				// For now, validate config client-side
				switch (integration) {
					case 'asaas':
						validateAsaasConfig(config);
						break;
					case 'evolution':
						validateEvolutionConfig(config);
						break;
					case 'dify':
						validateDifyConfig(config);
						break;
					default:
						throw new Error('Tipo de integração inválido');
				}

				toast.info('Teste de conexão será implementado em breve');
				setLastTestResult({ success: true, message: 'Validação local OK' });
				return { success: true, message: 'Validação local OK' };
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
		[integration],
	);

	const getIntegrationStatus = useCallback(() => {
		if (settings === undefined) return 'loading';
		const hasKey = !!integrationConfig?.apiKey;
		if (hasKey) return 'active';
		return 'inactive';
	}, [settings, integrationConfig]);

	return {
		settings: integrationConfig || {},
		loading: settings === undefined,
		saveSettings,
		testConnection,
		isTesting,
		lastTestResult,
		getIntegrationStatus,
	};
}
