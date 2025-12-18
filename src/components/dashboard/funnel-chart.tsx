import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const funnelStages = [
	{ id: 'novo', label: 'Novos', color: 'hsl(var(--chart-1))' },
	{ id: 'primeiro_contato', label: 'Primeiro Contato', color: 'hsl(var(--chart-2))' },
	{ id: 'qualificado', label: 'Qualificados', color: 'hsl(var(--chart-3))' },
	{ id: 'proposta', label: 'Proposta', color: 'hsl(var(--chart-4))' },
	{ id: 'negociacao', label: 'Negociação', color: 'hsl(var(--chart-5))' },
	{ id: 'fechado_ganho', label: 'Fechados', color: 'hsl(var(--chart-2))' },
];

interface FunnelChartProps {
	data?: {
		novo: number;
		primeiro_contato: number;
		qualificado: number;
		proposta: number;
		negociacao: number;
		fechado_ganho: number;
	};
}

export function FunnelChart({ data }: FunnelChartProps) {
	// Transform funnel data into Recharts-compatible format
	const chartData = data
		? funnelStages.map((stage) => ({
				name: stage.label,
				value: data[stage.id as keyof typeof data] || 0,
				color: stage.color,
			}))
		: [];

	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Funil de Conversão</CardTitle>
			</CardHeader>
			<CardContent>
				{!data ? (
					<div className="space-y-3">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-11/12" />
						<Skeleton className="h-8 w-10/12" />
						<Skeleton className="h-8 w-9/12" />
						<Skeleton className="h-8 w-8/12" />
						<Skeleton className="h-8 w-7/12" />
					</div>
				) : (
					<div className="h-[280px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
								<XAxis type="number" hide />
								<YAxis
									type="category"
									dataKey="name"
									axisLine={false}
									tickLine={false}
									tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
									width={75}
								/>
								<Tooltip
									contentStyle={{
										background: 'hsl(var(--card) / 0.9)',
										backdropFilter: 'blur(12px)',
										border: '1px solid hsl(var(--border) / 0.5)',
										borderRadius: '0.5rem',
									}}
									// biome-ignore lint/suspicious/noExplicitAny: Recharts type compatibility
									formatter={(value: any) => [value, 'Leads']}
								/>
								<Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000}>
									{chartData.map((entry, index) => (
										<Cell key={`cell-${funnelStages[index]?.id}`} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
