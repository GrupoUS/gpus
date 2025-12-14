import { createFileRoute, Link } from '@tanstack/react-router';
import {
	Bell,
	ChevronRight,
	FileText,
	Key,
	Palette,
	Settings as SettingsIcon,
	Shield,
	User,
	Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/settings')({
	component: SettingsPage,
});

interface SettingItemProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	href?: string;
	onClick?: () => void;
}

function SettingItem({ icon, title, description, href, onClick }: SettingItemProps) {
	const content = (
		<div
			className={cn(
				'flex items-center gap-4 p-4 rounded-lg border transition-colors',
				'hover:bg-muted/50 hover:border-primary/30 cursor-pointer',
			)}
			onClick={onClick}
		>
			<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center">
				{icon}
			</div>
			<div className="flex-1">
				<h3 className="font-medium text-sm">{title}</h3>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
			<ChevronRight className="h-4 w-4 text-muted-foreground" />
		</div>
	);

	if (href) {
		return <Link to={href}>{content}</Link>;
	}

	return content;
}

function SettingsPage() {
	return (
		<div className="space-y-6 p-6 max-w-4xl mx-auto">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<SettingsIcon className="h-6 w-6 text-purple-500" />
					Configurações
				</h1>
				<p className="text-muted-foreground">Gerencie as configurações do sistema</p>
			</div>

			{/* Account Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Conta</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<SettingItem
						icon={<User className="h-5 w-5 text-purple-500" />}
						title="Perfil"
						description="Gerencie suas informações pessoais"
					/>
					<SettingItem
						icon={<Key className="h-5 w-5 text-purple-500" />}
						title="Segurança"
						description="Autenticação e controle de acesso"
					/>
					<SettingItem
						icon={<Bell className="h-5 w-5 text-purple-500" />}
						title="Notificações"
						description="Configure alertas e preferências"
					/>
				</CardContent>
			</Card>

			{/* Team Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Equipe</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<SettingItem
						icon={<Users className="h-5 w-5 text-indigo-500" />}
						title="Membros"
						description="Gerencie usuários e permissões"
					/>
					<SettingItem
						icon={<Shield className="h-5 w-5 text-indigo-500" />}
						title="Funções e Permissões"
						description="Configure níveis de acesso"
					/>
				</CardContent>
			</Card>

			{/* System Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Sistema</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<SettingItem
						icon={<FileText className="h-5 w-5 text-green-500" />}
						title="Templates de Mensagem"
						description="Gerencie templates para chat"
					/>
					<SettingItem
						icon={<Palette className="h-5 w-5 text-green-500" />}
						title="Aparência"
						description="Personalize a interface"
					/>
				</CardContent>
			</Card>

			{/* Integrations */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Integrações</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
						<p className="text-sm">Integrações com WhatsApp, Instagram e outros</p>
						<p className="text-xs">Em desenvolvimento</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
