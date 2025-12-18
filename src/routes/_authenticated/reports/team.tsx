import { api } from '@convex/_generated/api';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { Award, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_authenticated/reports/team')({
	component: TeamReportPage,
});

const roleLabels: Record<string, string> = {
	admin: 'Admin',
	sdr: 'SDR',
	cs: 'CS',
	support: 'Suporte',
};

type TeamPerformanceMember = FunctionReturnType<typeof api.metrics.getTeamPerformance>[number];
type User = FunctionReturnType<typeof api.users.list>[number];

function TeamReportPage() {
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
	const teamPerformance = useQuery(api.metrics.getTeamPerformance, { period });
	const allUsers = useQuery(api.users.list);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Users className="h-6 w-6 text-primary" />
						Performance da Equipe
					</h1>
					<p className="text-muted-foreground">Métricas individuais e rankings</p>
				</div>
				<Select value={period} onValueChange={(v: typeof period) => setPeriod(v)}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Últimos 7 dias</SelectItem>
						<SelectItem value="30d">Últimos 30 dias</SelectItem>
						<SelectItem value="90d">Últimos 90 dias</SelectItem>
						<SelectItem value="year">Este ano</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Top Performers */}
			<div className="grid gap-4 md:grid-cols-3">
				{teamPerformance?.slice(0, 3).map((member: TeamPerformanceMember, index: number) => (
					<Card key={member._id} className={index === 0 ? 'border-yellow-500/50' : ''}>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<Badge variant={index === 0 ? 'default' : 'secondary'}>
									{index === 0 ? '🏆 Top 1' : `#${index + 1}`}
								</Badge>
								<Award
									className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}
								/>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-3">
								<Avatar className="h-12 w-12">
									<AvatarFallback className="bg-primary/10 text-primary">
										{member.name
											.split(' ')
											.map((n: string) => n[0])
											.join('')
											.slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-medium">{member.name}</p>
									<p className="text-xs text-muted-foreground">{roleLabels[member.role]}</p>
								</div>
							</div>
							<div className="mt-4">
								<p className="text-2xl font-bold text-primary">{member.metric}</p>
								<p className="text-xs text-muted-foreground">{member.metricLabel}</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Full Team Table */}
			<Card>
				<CardHeader>
					<CardTitle>Ranking Completo</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">#</TableHead>
								<TableHead>Membro</TableHead>
								<TableHead>Função</TableHead>
								<TableHead className="text-right">Conversões</TableHead>
								<TableHead className="text-right">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{teamPerformance?.map((member: TeamPerformanceMember, index: number) => (
								<TableRow key={member._id}>
									<TableCell className="font-medium">{index + 1}</TableCell>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs bg-primary/10 text-primary">
													{member.name
														.split(' ')
														.map((n: string) => n[0])
														.join('')
														.slice(0, 2)}
												</AvatarFallback>
											</Avatar>
											<span>{member.name}</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{roleLabels[member.role]}</Badge>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<TrendingUp className="h-3 w-3 text-green-500" />
											<span className="font-medium">{member.metric}</span>
										</div>
									</TableCell>
									<TableCell className="text-right">
										<Badge variant="default">Ativo</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Team Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{allUsers?.length ?? 0}</div>
						<p className="text-xs text-muted-foreground">Usuários ativos</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">SDRs</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{allUsers?.filter((u: User) => u.role === 'sdr').length ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">Vendas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">CS</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{allUsers?.filter((u: User) => u.role === 'cs').length ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">Customer Success</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
