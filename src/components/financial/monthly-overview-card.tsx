import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);

export function MonthlyOverviewCard() {
	const now = new Date();
	const [month, setMonth] = useState(now.getMonth());
	const [year, setYear] = useState(now.getFullYear());

	const { data: summary } = trpc.financial.metrics.useQuery({ month, year });

	if (summary === undefined) {
		return (
			<div className="grid gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const cards = [
		{
			title: 'Pendente',
			value: formatCurrency(summary.pendingThisMonth),
			count: summary.pendingCount,
			icon: Clock,
			color: 'text-yellow-500',
		},
		{
			title: 'Recebido',
			value: formatCurrency(summary.paidThisMonth),
			count: summary.paidCount,
			icon: CheckCircle,
			color: 'text-green-500',
		},
		{
			title: 'Vencido',
			value: formatCurrency(summary.overdueTotal),
			count: summary.overdueCount,
			icon: AlertTriangle,
			color: 'text-red-500',
		},
		{
			title: 'Projeção (3 meses)',
			value: formatCurrency(
				summary.futureProjection.reduce((sum: number, m: { amount: number }) => sum + m.amount, 0),
			),
			count: summary.futureProjection.reduce(
				(sum: number, m: { count: number }) => sum + m.count,
				0,
			),
			icon: TrendingUp,
			color: 'text-blue-500',
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Resumo Mensal</h2>
				<div className="flex gap-2">
					<Select onValueChange={(v) => setMonth(Number(v))} value={String(month)}>
						<SelectTrigger className="w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Array.from({ length: 12 }, (_, i) => (
								<SelectItem key={i} value={String(i)}>
									{new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select onValueChange={(v) => setYear(Number(v))} value={String(year)}>
						<SelectTrigger className="w-[100px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[2024, 2025, 2026].map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				{cards.map((card) => (
					<Card key={card.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">{card.title}</CardTitle>
							<card.icon className={`h-4 w-4 ${card.color}`} />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{card.value}</div>
							<p className="text-muted-foreground text-xs">{card.count} cobranças</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
