import { createFileRoute } from '@tanstack/react-router';
import { Bot, ExternalLink, MessageSquare, Settings } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/_authenticated/settings/integrations')({
	component: IntegrationsSettingsPage,
});

function IntegrationsSettingsPage() {
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
								<CardTitle>WhatsApp Business</CardTitle>
								<CardDescription>Conecte via Evolution API</CardDescription>
							</div>
						</div>
						<Badge variant="outline" className="text-yellow-600 border-yellow-600">
							Em Configuração
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="evolution-url">Evolution API URL</Label>
						<Input id="evolution-url" placeholder="https://api.evolution.com.br" defaultValue="" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="evolution-key">API Key</Label>
						<Input
							id="evolution-key"
							type="password"
							placeholder="••••••••••••••••"
							defaultValue=""
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="instance-name">Nome da Instância</Label>
						<Input id="instance-name" placeholder="grupo-us-prod" defaultValue="" />
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Status da Conexão</p>
							<p className="text-xs text-muted-foreground">Configure as credenciais acima</p>
						</div>
						<Button>Testar Conexão</Button>
					</div>
					<div className="rounded-lg bg-muted/50 p-4">
						<p className="text-sm text-muted-foreground">
							<strong>Nota:</strong> A Evolution API permite integração completa com WhatsApp
							Business, incluindo envio/recebimento de mensagens, webhooks e gerenciamento de
							conversas.
						</p>
					</div>
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
								<CardTitle>Dify AI</CardTitle>
								<CardDescription>Assistente de IA para atendimento</CardDescription>
							</div>
						</div>
						<Badge variant="outline" className="text-yellow-600 border-yellow-600">
							Em Configuração
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="dify-url">Dify API URL</Label>
						<Input id="dify-url" placeholder="https://api.dify.ai/v1" defaultValue="" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="dify-key">API Key</Label>
						<Input
							id="dify-key"
							type="password"
							placeholder="app-••••••••••••••••"
							defaultValue=""
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="dify-app-id">App ID</Label>
						<Input id="dify-app-id" placeholder="app-id-here" defaultValue="" />
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Status da Conexão</p>
							<p className="text-xs text-muted-foreground">Configure as credenciais acima</p>
						</div>
						<Button>Testar Conexão</Button>
					</div>
					<div className="rounded-lg bg-muted/50 p-4">
						<p className="text-sm text-muted-foreground">
							<strong>Nota:</strong> O Dify AI fornece assistência inteligente para agentes,
							incluindo geração de respostas, resumos de conversas e análise de sentimento.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Available Integrations */}
			<Card>
				<CardHeader>
					<CardTitle>Integrações Disponíveis</CardTitle>
					<CardDescription>Conecte mais ferramentas ao seu portal</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[
							{ name: 'Instagram Direct', icon: '📸', status: 'Em breve' },
							{ name: 'Telegram', icon: '✈️', status: 'Em breve' },
							{ name: 'Email (SMTP)', icon: '📧', status: 'Em breve' },
							{ name: 'Zapier', icon: '⚡', status: 'Em breve' },
						].map((integration) => (
							<div
								key={integration.name}
								className="flex items-center justify-between p-3 rounded-lg border"
							>
								<div className="flex items-center gap-3">
									<span className="text-2xl">{integration.icon}</span>
									<div>
										<p className="font-medium text-sm">{integration.name}</p>
										<p className="text-xs text-muted-foreground">{integration.status}</p>
									</div>
								</div>
								<Button variant="outline" size="sm" disabled>
									Conectar
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Documentation */}
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
				</CardContent>
			</Card>
		</div>
	);
}
