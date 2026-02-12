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
					<CardTitle className="font-medium text-sm">Total de Contatos</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.total}</div>
					<p className="text-muted-foreground text-xs">Base completa de contatos</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Inscritos Ativos</CardTitle>
					<UserCheck className="h-4 w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.subscribed}</div>
					<p className="text-muted-foreground text-xs">Recebem comunicações</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Não Inscritos</CardTitle>
					<UserX className="h-4 w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.unsubscribed}</div>
					<p className="text-muted-foreground text-xs">
						Taxa de cancelamento: {stats.unsubscribeRate}%
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Pendentes</CardTitle>
					<Activity className="h-4 w-4 text-yellow-500" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{stats.pending}</div>
					<p className="text-muted-foreground text-xs">Aguardando confirmação</p>
				</CardContent>
			</Card>
		</div>
	);
}
