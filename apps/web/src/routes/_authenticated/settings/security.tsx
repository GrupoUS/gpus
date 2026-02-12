import { useClerk, useUser } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import { Clock, Key, Shield, Smartphone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/settings/security')({
	component: SecuritySettingsPage,
});

function SecuritySettingsPage() {
	const { user } = useUser();
	const { signOut } = useClerk();

	// Handle password change via Clerk portal or API
	// Simplest is to open Clerk User Profile modal
	const openUserProfile = () => {
		const userButton = document.querySelector('.clerk-user-button-trigger') as HTMLElement;
		if (userButton) userButton.click();
	};

	return (
		<div className="max-w-4xl space-y-6 p-6">
			<div>
				<h1 className="flex items-center gap-2 font-bold text-2xl">
					<Shield className="h-6 w-6 text-purple-500" />
					Segurança da Conta
				</h1>
				<p className="text-muted-foreground">Gerencie sua senha e métodos de autenticação</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Key className="h-5 w-5 text-purple-500" />
						Autenticação
					</CardTitle>
					<CardDescription>Informações sobre como você acessa sua conta.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-1">
							<p className="font-medium">Senha</p>
							<p className="text-muted-foreground text-sm">
								Sua senha é gerenciada de forma segura pelo nosso provedor de identidade.
							</p>
						</div>
						<Button onClick={openUserProfile} variant="outline">
							Mudar Senha
						</Button>
					</div>

					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-1">
							<p className="font-medium">Multi-Fator de Autenticação (MFA)</p>
							<p className="text-muted-foreground text-sm">
								Adicione uma camada extra de segurança.
							</p>
						</div>
						<Badge variant={user?.twoFactorEnabled ? 'default' : 'secondary'}>
							{user?.twoFactorEnabled ? 'Ativado' : 'Desativado'}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5 text-purple-500" />
						Sessões Ativas
					</CardTitle>
					<CardDescription>Dispositivos conectados à sua conta.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Note: Getting active sessions requires Clerk backend API or usage of useSessionList hook/component */}
					{/* For now, we show a static placeholder or generic info */}
					<div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
						<div className="flex items-center gap-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
								<div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
							</div>
							<div>
								<p className="font-medium">Sessão Atual</p>
								<p className="flex items-center gap-1 text-muted-foreground text-xs">
									<Clock className="h-3 w-3" /> Agora
								</p>
							</div>
						</div>
						<Button
							className="text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={() => signOut()}
							variant="ghost"
						>
							Sair
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
