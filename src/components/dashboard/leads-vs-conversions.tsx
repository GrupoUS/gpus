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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyMetric {
	date: string;
	newLeads: number;
	conversions: number;
	conversionValue: number;
	messagesReceived: number;
	messagesSent: number;
}

interface LeadsVsConversionsProps {
	data?: DailyMetric[];
}

export function LeadsVsConversions({ data }: LeadsVsConversionsProps) {
	const gradientLeadsId = useId();
	const gradientConversoesId = useId();

	// Format date for X axis display (e.g., "15/12" for December 15th)
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
	};

	// Transform daily metrics to chart format
	const chartData = data?.map((metric) => ({
		name: formatDate(metric.date),
		leads: metric.newLeads,
		conversoes: metric.conversions,
	}));

	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Leads vs Conversões</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-[300px] min-h-[250px] md:h-[300px]">
					{!data ? (
						<div className="flex flex-col gap-4 h-full justify-center">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-48 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					) : chartData && chartData.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
								<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
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
					) : (
						<div className="flex items-center justify-center h-full">
							<p className="text-sm text-muted-foreground">Sem dados para o período selecionado</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
