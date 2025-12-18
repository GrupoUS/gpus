import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useId } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export const Route = createFileRoute('/_authenticated/settings/notifications')({
	component: NotificationsSettingsPage,
});

function NotificationsSettingsPage() {
	const userData = useQuery(api.users.current);
	const updateProfile = useMutation(api.users.updateProfile);

	const emailLeadsId = useId();
	const emailConversionsId = useId();
	const weeklyDigestId = useId();
	const chatAlertsId = useId();
	const churnAlertsId = useId();

	// Default values
	const defaultPrefs = {
		email_leads: true,
		email_conversions: true,
		chat_alerts: true,
		churn_alerts: true,
		weekly_digest: false,
	};

	const prefs = { ...defaultPrefs, ...userData?.preferences };

	const handleToggle = async (key: string, value: boolean) => {
		if (!userData) return;

		try {
			await updateProfile({
				preferences: {
					...prefs,
					[key]: value,
				},
			});
			// toast.success('Preferências salvas');
		} catch (_error) {
			toast.error('Erro ao salvar preferência');
		}
	};

	return (
		<div className="space-y-6 p-6 max-w-4xl">
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<Bell className="h-6 w-6 text-purple-500" />
					Notificações
				</h1>
				<p className="text-muted-foreground">Escolha como você quer ser notificado</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5 text-purple-500" />
						Notificações por Email
					</CardTitle>
					<CardDescription>
						Receba atualizações importantes diretamente na sua caixa de entrada.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label htmlFor={emailLeadsId} className="text-base font-medium">
								Novos Leads
							</Label>
							<p className="text-sm text-muted-foreground">
								Seja notificado quando um novo lead for atribuído a você.
							</p>
						</div>
						<Switch
							id={emailLeadsId}
							checked={prefs.email_leads}
							onCheckedChange={(c) => handleToggle('email_leads', c)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label htmlFor={emailConversionsId} className="text-base font-medium">
								Conversões (Vendas)
							</Label>
							<p className="text-sm text-muted-foreground">
								Alerta instantâneo quando uma venda for confirmada.
							</p>
						</div>
						<Switch
							id={emailConversionsId}
							checked={prefs.email_conversions}
							onCheckedChange={(c) => handleToggle('email_conversions', c)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label htmlFor={weeklyDigestId} className="text-base font-medium">
								Resumo Semanal
							</Label>
							<p className="text-sm text-muted-foreground">
								Receba um relatório de desempenho toda segunda-feira.
							</p>
						</div>
						<Switch
							id={weeklyDigestId}
							checked={prefs.weekly_digest}
							onCheckedChange={(c) => handleToggle('weekly_digest', c)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5 text-purple-500" />
						Alertas em Tempo Real
					</CardTitle>
					<CardDescription>Notificações dentro da plataforma.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label htmlFor={chatAlertsId} className="text-base font-medium">
								Mensagens de Chat
							</Label>
							<p className="text-sm text-muted-foreground">
								Som e popup quando chegar uma nova mensagem de cliente.
							</p>
						</div>
						<Switch
							id={chatAlertsId}
							checked={prefs.chat_alerts}
							onCheckedChange={(c) => handleToggle('chat_alerts', c)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label htmlFor={churnAlertsId} className="text-base font-medium">
								Risco de Churn
							</Label>
							<p className="text-sm text-muted-foreground">
								Alertar quando um aluno apresentar alto risco de cancelamento.
							</p>
						</div>
						<Switch
							id={churnAlertsId}
							checked={prefs.churn_alerts}
							onCheckedChange={(c) => handleToggle('churn_alerts', c)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
