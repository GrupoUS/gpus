'use client';

import { Activity, UserCheck, Users, UserX } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactStatsProps {
	stats: {
		total: number;
		subscribed: number;
		pending: number;
		unsubscribed: number;
		unsubscribeRate: string;
	} | null;
}

export function ContactStats({ stats }: ContactStatsProps) {
	if (!stats) return null;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.total}</div>
					<p className="text-xs text-muted-foreground">Base completa de contatos</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Inscritos Ativos</CardTitle>
					<UserCheck className="h-4 w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.subscribed}</div>
					<p className="text-xs text-muted-foreground">Recebem comunicações</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Não Inscritos</CardTitle>
					<UserX className="h-4 w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.unsubscribed}</div>
					<p className="text-xs text-muted-foreground">
						Taxa de cancelamento: {stats.unsubscribeRate}%
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Pendentes</CardTitle>
					<Activity className="h-4 w-4 text-yellow-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.pending}</div>
					<p className="text-xs text-muted-foreground">Aguardando confirmação</p>
				</CardContent>
			</Card>
		</div>
	);
}
