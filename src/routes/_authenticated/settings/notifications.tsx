import { createFileRoute } from '@tanstack/react-router';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useId } from 'react';
import { toast } from 'sonner';

import { trpc } from '../../../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export const Route = createFileRoute('/_authenticated/settings/notifications')({
	component: NotificationsSettingsPage,
});

function NotificationsSettingsPage() {
	const { data: userData } = trpc.users.me.useQuery();
	const updateProfile = trpc.users.updateProfile.useMutation();

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
			// @ts-expect-error - Migration: error TS2349
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
		<div className="max-w-4xl space-y-6 p-6">
			<div>
				<h1 className="flex items-center gap-2 font-bold text-2xl">
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
							<Label className="font-medium text-base" htmlFor={emailLeadsId}>
								Novos Leads
							</Label>
							<p className="text-muted-foreground text-sm">
								Seja notificado quando um novo lead for atribuído a você.
							</p>
						</div>
						<Switch
							checked={prefs.email_leads}
							id={emailLeadsId}
							onCheckedChange={(c) => handleToggle('email_leads', c)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label className="font-medium text-base" htmlFor={emailConversionsId}>
								Conversões (Vendas)
							</Label>
							<p className="text-muted-foreground text-sm">
								Alerta instantâneo quando uma venda for confirmada.
							</p>
						</div>
						<Switch
							checked={prefs.email_conversions}
							id={emailConversionsId}
							onCheckedChange={(c) => handleToggle('email_conversions', c)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label className="font-medium text-base" htmlFor={weeklyDigestId}>
								Resumo Semanal
							</Label>
							<p className="text-muted-foreground text-sm">
								Receba um relatório de desempenho toda segunda-feira.
							</p>
						</div>
						<Switch
							checked={prefs.weekly_digest}
							id={weeklyDigestId}
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
							<Label className="font-medium text-base" htmlFor={chatAlertsId}>
								Mensagens de Chat
							</Label>
							<p className="text-muted-foreground text-sm">
								Som e popup quando chegar uma nova mensagem de cliente.
							</p>
						</div>
						<Switch
							checked={prefs.chat_alerts}
							id={chatAlertsId}
							onCheckedChange={(c) => handleToggle('chat_alerts', c)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-y-0">
						<div className="space-y-1">
							<Label className="font-medium text-base" htmlFor={churnAlertsId}>
								Risco de Churn
							</Label>
							<p className="text-muted-foreground text-sm">
								Alertar quando um aluno apresentar alto risco de cancelamento.
							</p>
						</div>
						<Switch
							checked={prefs.churn_alerts}
							id={churnAlertsId}
							onCheckedChange={(c) => handleToggle('churn_alerts', c)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
