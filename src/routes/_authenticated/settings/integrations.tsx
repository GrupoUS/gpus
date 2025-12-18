import { api } from '@convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import {
	AlertCircle,
	Bot,
	CheckCircle2,
	CreditCard,
	ExternalLink,
	HelpCircle,
	Loader2,
	MessageSquare,
	Settings,
} from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useIntegrationSettings } from '@/hooks/useIntegrationSettings';

export const Route = createFileRoute('/_authenticated/settings/integrations')({
	component: IntegrationsSettingsPage,
});

const evolutionSchema = z.object({
	url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
	apiKey: z.string().min(1, 'API Key é obrigatória'),
	instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
});

const difySchema = z.object({
	url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
	apiKey: z.string().min(1, 'API Key é obrigatória'),
	appId: z.string().min(1, 'App ID é obrigatório'),
});

const asaasSchema = z.object({
	baseUrl: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
	apiKey: z.string().min(1, 'API Key é obrigatória'),
	environment: z.enum(['production', 'sandbox']),
	webhookSecret: z.string().optional(),
});

type EvolutionFormData = z.infer<typeof evolutionSchema>;
type DifyFormData = z.infer<typeof difySchema>;
type AsaasFormData = z.infer<typeof asaasSchema>;

type IntegrationTestResult = { success: boolean; message: string; details?: unknown } | null;

function IntegrationsSettingsPage() {
	const currentUser = useQuery(api.users.current);
	const isAdmin = currentUser?.role === 'admin';

	// Evolution API
	const evolution = useIntegrationSettings('evolution');
	const evolutionForm = useForm<EvolutionFormData>({
		resolver: zodResolver(evolutionSchema),
		defaultValues: {
			url: '',
			apiKey: '',
			instanceName: '',
		},
	});

	useEffect(() => {
		if (evolution.settings && !evolution.loading) {
			evolutionForm.reset({
				url: evolution.settings.url || '',
				apiKey: evolution.settings.apiKey || '', // This will be masked version
				instanceName: evolution.settings.instanceName || '',
			});
		}
	}, [evolution.settings, evolution.loading, evolutionForm]);

	// Dify AI
	const dify = useIntegrationSettings('dify');
	const difyForm = useForm<DifyFormData>({
		resolver: zodResolver(difySchema),
		defaultValues: {
			url: '',
			apiKey: '',
			appId: '',
		},
	});

	useEffect(() => {
		if (dify.settings && !dify.loading) {
			difyForm.reset({
				url: dify.settings.url || '',
				apiKey: dify.settings.apiKey || '',
				appId: dify.settings.appId || '',
			});
		}
	}, [dify.settings, dify.loading, difyForm]);

	// Asaas
	const asaas = useIntegrationSettings('asaas');
	const asaasForm = useForm<AsaasFormData>({
		resolver: zodResolver(asaasSchema),
		defaultValues: {
			baseUrl: 'https://api.asaas.com/v3',
			apiKey: '',
			environment: 'production',
			webhookSecret: '',
		},
	});

	useEffect(() => {
		if (asaas.settings && !asaas.loading) {
			asaasForm.reset({
				baseUrl: asaas.settings.baseUrl || 'https://api.asaas.com/v3',
				apiKey: asaas.settings.apiKey || '',
				environment: (asaas.settings.environment as 'production' | 'sandbox') || 'production',
				webhookSecret: asaas.settings.webhookSecret || '',
			});
		}
	}, [asaas.settings, asaas.loading, asaasForm]);

	const handleSaveEvolution = async (values: EvolutionFormData) => {
		if (!isAdmin) return toast.error('Permissão negada');
		await evolution.saveSettings(values);
	};

	const handleTestEvolution = async () => {
		const values = evolutionForm.getValues();
		// Manually validate required fields simply or rely on form state?
		// useIntegrationSettings hook handles validation inside testConnection too but better to pass valid data
		await evolution.testConnection(values);
	};

	const handleSaveDify = async (values: DifyFormData) => {
		if (!isAdmin) return toast.error('Permissão negada');
		await dify.saveSettings(values);
	};

	const handleTestDify = async () => {
		const values = difyForm.getValues();
		await dify.testConnection(values);
	};

	const handleSaveAsaas = async (values: AsaasFormData) => {
		if (!isAdmin) return toast.error('Permissão negada');
		await asaas.saveSettings(values);
	};

	const handleTestAsaas = async () => {
		const values = asaasForm.getValues();
		await asaas.testConnection(values);
	};

	const getStatusBadge = (status: string, lastResult: IntegrationTestResult) => {
		if (lastResult?.success) {
			return (
				<Badge
					variant="outline"
					className="text-green-600 border-green-600 flex gap-1 items-center"
				>
					<CheckCircle2 className="h-3 w-3" />
					Ativo
				</Badge>
			);
		}
		if (lastResult && !lastResult.success) {
			return (
				<Badge variant="outline" className="text-red-600 border-red-600 flex gap-1 items-center">
					<AlertCircle className="h-3 w-3" />
					Erro
				</Badge>
			);
		}

		switch (status) {
			case 'active':
				return (
					<Badge variant="outline" className="text-green-600 border-green-600">
						Configurado
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="text-yellow-600 border-yellow-600">
						Em Configuração
					</Badge>
				);
		}
	};

	// Helper for visual dot
	const StatusDot = ({
		status,
		lastResult,
	}: {
		status: string;
		lastResult: IntegrationTestResult;
	}) => {
		let color = 'bg-gray-300';
		if (lastResult?.success) color = 'bg-green-500';
		else if (lastResult && !lastResult.success) color = 'bg-red-500';
		else if (status === 'active') color = 'bg-yellow-500'; // Configured but not recently tested in this session? Or green?
		// If status is active (has keys) but no test run yet, assume yellow or green?
		// Plan says: "Amarelo: Configurado mas não testado"

		return <div className={`h-2.5 w-2.5 rounded-full ${color}`} />;
	};

	if (!isAdmin) {
		return (
			<div className="space-y-6 p-6 max-w-4xl mx-auto">
				<Card className="border-yellow-500/50 bg-yellow-500/10">
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">
							Você precisa ser administrador para configurar integrações.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 max-w-4xl">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<Settings className="h-6 w-6 text-purple-500" />
					Integrações
				</h1>
				<p className="text-muted-foreground">Configure conexões com serviços externos</p>
			</div>

			{/* WhatsApp Integration */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
								<MessageSquare className="h-6 w-6 text-green-500" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<CardTitle>WhatsApp Business</CardTitle>
									<StatusDot
										status={evolution.getIntegrationStatus()}
										lastResult={evolution.lastTestResult}
									/>
								</div>
								<CardDescription>Conecte via Evolution API</CardDescription>
							</div>
						</div>
						{getStatusBadge(evolution.getIntegrationStatus(), evolution.lastTestResult)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...evolutionForm}>
						<form
							onSubmit={evolutionForm.handleSubmit((d) => handleSaveEvolution(d))}
							className="space-y-4"
						>
							<FormField
								control={evolutionForm.control}
								name="url"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Evolution API URL</FormLabel>
										<FormControl>
											<Input placeholder="https://api.evolution.com.br" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={evolutionForm.control}
								name="apiKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>API Key</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••••••••••" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={evolutionForm.control}
								name="instanceName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome da Instância</FormLabel>
										<FormControl>
											<Input placeholder="grupo-us-prod" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex items-center justify-between pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={handleTestEvolution}
									disabled={evolution.isTesting}
								>
									{evolution.isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
									Testar Conexão
								</Button>
								<Button type="submit" disabled={evolutionForm.formState.isSubmitting}>
									{evolutionForm.formState.isSubmitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Salvar
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Dify AI Integration */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
								<Bot className="h-6 w-6 text-purple-500" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<CardTitle>Dify AI</CardTitle>
									<StatusDot
										status={dify.getIntegrationStatus()}
										lastResult={dify.lastTestResult}
									/>
								</div>
								<CardDescription>Assistente de IA para atendimento</CardDescription>
							</div>
						</div>
						{getStatusBadge(dify.getIntegrationStatus(), dify.lastTestResult)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...difyForm}>
						<form onSubmit={difyForm.handleSubmit((d) => handleSaveDify(d))} className="space-y-4">
							<FormField
								control={difyForm.control}
								name="url"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dify API URL</FormLabel>
										<FormControl>
											<Input placeholder="https://api.dify.ai/v1" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={difyForm.control}
								name="apiKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>API Key</FormLabel>
										<FormControl>
											<Input type="password" placeholder="app-••••••••••••••••" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={difyForm.control}
								name="appId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>App ID</FormLabel>
										<FormControl>
											<Input placeholder="app-id-here" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex items-center justify-between pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={handleTestDify}
									disabled={dify.isTesting}
								>
									{dify.isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
									Testar Conexão
								</Button>
								<Button type="submit" disabled={difyForm.formState.isSubmitting}>
									{difyForm.formState.isSubmitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Salvar
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Asaas Integration */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
								<CreditCard className="h-6 w-6 text-blue-500" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<CardTitle>Asaas Pagamentos</CardTitle>
									<StatusDot
										status={asaas.getIntegrationStatus()}
										lastResult={asaas.lastTestResult}
									/>
								</div>
								<CardDescription>Gateway de pagamento brasileiro</CardDescription>
							</div>
						</div>
						{getStatusBadge(asaas.getIntegrationStatus(), asaas.lastTestResult)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...asaasForm}>
						<form
							onSubmit={asaasForm.handleSubmit((d) => handleSaveAsaas(d))}
							className="space-y-4"
						>
							<FormField
								control={asaasForm.control}
								name="environment"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ambiente</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione o ambiente" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="production">Produção</SelectItem>
												<SelectItem value="sandbox">Sandbox</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>Use Sandbox para testes sem transações reais.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={asaasForm.control}
								name="baseUrl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>URL Base</FormLabel>
										<FormControl>
											<Input placeholder="https://api.asaas.com/v3" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={asaasForm.control}
								name="apiKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>API Key</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••••••••••" {...field} />
										</FormControl>
										<FormDescription>
											Sua chave de API do Asaas (começa com "$aact...").
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							{/* Optional Webhook Secret */}
							<FormField
								control={asaasForm.control}
								name="webhookSecret"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Webhook Secret (Opcional)</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••••••••••" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex items-center justify-between pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={handleTestAsaas}
									disabled={asaas.isTesting}
								>
									{asaas.isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
									Testar Conexão
								</Button>
								<Button type="submit" disabled={asaasForm.formState.isSubmitting}>
									{asaasForm.formState.isSubmitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Salvar
								</Button>
							</div>
						</form>
					</Form>
					<div className="rounded-lg bg-muted/50 p-4 mt-4">
						<div className="flex items-start gap-2">
							<HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
							<div className="text-sm text-muted-foreground">
								<p className="font-medium text-foreground mb-1">Funcionalidades Suportadas:</p>
								<ul className="list-disc pl-4 space-y-1">
									<li>Pagamentos via PIX, Boleto e Cartão de Crédito</li>
									<li>Gestão de Assinaturas Recorrentes</li>
									<li>Webhooks automáticos para atualização de status</li>
								</ul>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Documentation Links */}
			<Card>
				<CardHeader>
					<CardTitle>Documentação</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<Button variant="ghost" className="w-full justify-start" asChild>
						<a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer">
							<ExternalLink className="h-4 w-4 mr-2" />
							Evolution API Docs
						</a>
					</Button>
					<Button variant="ghost" className="w-full justify-start" asChild>
						<a href="https://docs.dify.ai" target="_blank" rel="noopener noreferrer">
							<ExternalLink className="h-4 w-4 mr-2" />
							Dify AI Docs
						</a>
					</Button>
					<Button variant="ghost" className="w-full justify-start" asChild>
						<a href="https://docs.asaas.com" target="_blank" rel="noopener noreferrer">
							<ExternalLink className="h-4 w-4 mr-2" />
							Asaas API Docs
						</a>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
