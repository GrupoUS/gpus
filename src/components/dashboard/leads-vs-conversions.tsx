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

const chartData = [
	{ name: 'Jan', leads: 40, conversoes: 24 },
	{ name: 'Fev', leads: 30, conversoes: 13 },
	{ name: 'Mar', leads: 45, conversoes: 28 },
	{ name: 'Abr', leads: 50, conversoes: 35 },
	{ name: 'Mai', leads: 49, conversoes: 30 },
	{ name: 'Jun', leads: 60, conversoes: 42 },
];

export function LeadsVsConversions() {
	const gradientLeadsId = useId();
	const gradientConversoesId = useId();

	return (
		<Card className="glass-card">
			<CardHeader>
				<CardTitle className="font-display text-2xl font-semibold">Leads vs Conversões</CardTitle>
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
				</div>
			</CardContent>
		</Card>
	);
}
