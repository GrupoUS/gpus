import { createFileRoute } from '@tanstack/react-router';
import { DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useId } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export const Route = createFileRoute('/')({
	component: DashboardPage,
});

const chartData = [
	{ name: 'Jan', leads: 40, conversoes: 24 },
	{ name: 'Fev', leads: 30, conversoes: 13 },
	{ name: 'Mar', leads: 45, conversoes: 28 },
	{ name: 'Abr', leads: 50, conversoes: 35 },
	{ name: 'Mai', leads: 49, conversoes: 30 },
	{ name: 'Jun', leads: 60, conversoes: 42 },
];

function DashboardPage() {
	const gradientLeadsId = useId();
	const gradientConversoesId = useId();

	return (
		<div className="space-y-6">
			<div className="animate-fade-in-up">
				<h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Dashboard</h1>
				<p className="font-sans text-base text-muted-foreground">Visão geral do seu negócio</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatsCard
					title="Leads este mês"
					value="127"
					description="vs. mês anterior"
					icon={Users}
					trend={{ value: 12, isPositive: true }}
					className="animate-fade-in-up delay-100"
				/>
				<StatsCard
					title="Taxa de Conversão"
					value="24.5%"
					description="vs. mês anterior"
					icon={TrendingUp}
					trend={{ value: 4.5, isPositive: true }}
					className="animate-fade-in-up delay-200"
				/>
				<StatsCard
					title="Faturamento"
					value="R$ 245.000"
					description="vs. mês anterior"
					icon={DollarSign}
					trend={{ value: 18, isPositive: true }}
					className="animate-fade-in-up delay-300"
				/>
				<StatsCard
					title="Mensagens"
					value="1.234"
					description="últimas 24h"
					icon={MessageSquare}
					className="animate-fade-in-up delay-400"
				/>
			</div>

			<MotionWrapper className="grid gap-4 md:grid-cols-2" stagger={100}>
				<Card>
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">
							Leads vs Conversões
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-[300px] min-h-[250px] md:h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData}>
									<defs>
										<linearGradient id={gradientLeadsId} x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
											<stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
										</linearGradient>
										<linearGradient id={gradientConversoesId} x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
											<stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="hsl(var(--muted-foreground) / 0.2)"
									/>
									<XAxis
										dataKey="name"
										className="text-xs"
										stroke="hsl(var(--muted-foreground) / 0.5)"
									/>
									<YAxis className="text-xs" stroke="hsl(var(--muted-foreground) / 0.5)" />
									<Tooltip
										contentStyle={{
											background: 'hsl(var(--card) / 0.6)',
											backdropFilter: 'blur(24px) saturate(180%)',
											border: '1px solid hsl(var(--border) / 0.5)',
											borderRadius: '0.5rem',
											boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.1)',
										}}
									/>
									<Area
										type="monotone"
										dataKey="leads"
										stackId="1"
										stroke="hsl(var(--primary))"
										strokeWidth={2}
										fill={`url(#${gradientLeadsId})`}
										animationDuration={1000}
										animationEasing="ease-out"
									/>
									<Area
										type="monotone"
										dataKey="conversoes"
										stackId="2"
										stroke="hsl(142 76% 36%)"
										strokeWidth={2}
										fill={`url(#${gradientConversoesId})`}
										animationDuration={1000}
										animationEasing="ease-out"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-2xl font-semibold">Leads por Produto</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{ name: 'TRINTAE3', value: 45, color: 'bg-purple-500' },
								{ name: 'Black NEON', value: 28, color: 'bg-pink-500' },
								{ name: 'Comunidade US', value: 32, color: 'bg-blue-500' },
								{ name: 'OTB MBA', value: 12, color: 'bg-amber-500' },
								{ name: 'Aurículo', value: 10, color: 'bg-green-500' },
							].map((item) => (
								<div key={item.name} className="space-y-1">
									<div className="flex justify-between text-sm font-sans">
										<span>{item.name}</span>
										<span className="font-medium font-display tabular-nums">{item.value}</span>
									</div>
									<div className="h-2 rounded-full bg-muted overflow-hidden">
										<div
											className={`h-full rounded-full progress-bar ${item.color}`}
											style={{
												width: `${(item.value / 50) * 100}%`,
												background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--us-purple-light)))`,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</MotionWrapper>
		</div>
	);
}
