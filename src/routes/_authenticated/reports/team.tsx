import { createFileRoute } from '@tanstack/react-router';
import { Award, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import { trpc } from '../../../lib/trpc';
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

interface User {
	id: number;
	name: string;
	role: string;
}

interface TeamPerformanceMember {
	id: number;
	name: string;
	role: string;
	metric: number;
	metricLabel: string;
	period: string;
}

function TeamReportPage() {
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');

	const { data: teamPerformanceData } = trpc.metrics.daily.useQuery({ period } as const);
	const teamPerformance = teamPerformanceData as TeamPerformanceMember[] | undefined;
	const { data: allUsersData } = trpc.users.list.useQuery();
	const allUsers = allUsersData as User[] | undefined;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<Users className="h-6 w-6 text-primary" />
						Performance da Equipe
					</h1>
					<p className="text-muted-foreground">Métricas individuais e rankings</p>
				</div>
				<Select onValueChange={(v: typeof period) => setPeriod(v)} value={period}>
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
					<Card className={index === 0 ? 'border-yellow-500/50' : ''} key={member.id}>
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
									<p className="text-muted-foreground text-xs">{roleLabels[member.role]}</p>
								</div>
							</div>
							<div className="mt-4">
								<p className="font-bold text-2xl text-primary">{member.metric}</p>
								<p className="text-muted-foreground text-xs">{member.metricLabel}</p>
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
								<TableRow key={member.id}>
									<TableCell className="font-medium">{index + 1}</TableCell>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarFallback className="bg-primary/10 text-primary text-xs">
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
						<CardTitle className="font-medium text-sm">Total de Membros</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{allUsers?.length ?? 0}</div>
						<p className="text-muted-foreground text-xs">Usuários ativos</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-sm">SDRs</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{allUsers?.filter((u: User) => u.role === 'sdr').length ?? 0}
						</div>
						<p className="text-muted-foreground text-xs">Vendas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-sm">CS</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{allUsers?.filter((u: User) => u.role === 'cs').length ?? 0}
						</div>
						<p className="text-muted-foreground text-xs">Customer Success</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
