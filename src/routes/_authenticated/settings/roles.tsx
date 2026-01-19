import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { Lock, Shield } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/settings/roles')({
	component: RolesSettingsPage,
});

const ROLES_DEFINITIONS = [
	{
		role: 'admin',
		label: 'Administrador',
		description: 'Acesso total a todas as funcionalidades e configurações.',
		permissions: ['all'],
	},
	{
		role: 'sdr',
		label: 'SDR (Vendas)',
		description: 'Focado em gestão de leads, CRM e conversas de vendas.',
		permissions: [
			'leads:read',
			'leads:write',
			'conversations:read',
			'conversations:write',
			'students:read',
		],
	},
	{
		role: 'cs',
		label: 'Customer Success',
		description: 'Gestão de alunos, monitoramento de progresso e suporte.',
		permissions: [
			'students:read',
			'students:write',
			'conversations:read',
			'conversations:write',
			'reports:read',
		],
	},
	{
		role: 'support',
		label: 'Suporte',
		description: 'Atendimento de tickets e resolução de problemas técnicos.',
		permissions: [
			'conversations:read',
			'conversations:write',
			'tickets:read',
			'tickets:write',
			'students:read',
		],
	},
];

function RolesSettingsPage() {
	const userData = useQuery(api.users.current);
	const isAdmin = userData?.role === 'admin';

	return (
		<div className="max-w-4xl space-y-6 p-6">
			<div>
				<h1 className="flex items-center gap-2 font-bold text-2xl">
					<Shield className="h-6 w-6 text-purple-500" />
					Funções e Permissões
				</h1>
				<p className="text-muted-foreground">Visualize os níveis de acesso do sistema</p>
			</div>

			{!isAdmin && (
				<div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-700 dark:text-yellow-400">
					<Lock className="h-4 w-4" />
					<p className="text-sm">
						Você está visualizando em modo leitura. Apenas administradores podem editar permissões.
					</p>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Níveis de Acesso</CardTitle>
					<CardDescription>Definição de cada papel dentro da organização.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Função</TableHead>
								<TableHead>Descrição</TableHead>
								<TableHead>Permissões Principais</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{ROLES_DEFINITIONS.map((role) => (
								<TableRow key={role.role}>
									<TableCell className="font-medium">
										<Badge variant={role.role === 'admin' ? 'default' : 'outline'}>
											{role.label}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">{role.description}</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{role.permissions.map((p) => (
												<Badge className="font-normal text-xs" key={p} variant="secondary">
													{p}
												</Badge>
											))}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
