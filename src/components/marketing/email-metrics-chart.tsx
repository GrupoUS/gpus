'use client';

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmailMetricsChartProps {
	data: Array<{
		name: string;
		enviados: number;
		abertos: number;
		cliques: number;
	}>;
}

export function EmailMetricsChart({ data }: EmailMetricsChartProps) {
	// Simple theme detection (assuming useTheme hook exists or defaulting to dark/light)
	// Since we don't have access to the actual theme context implementation details from the plan,
	// we'll use CSS variables or default colors.

	return (
		<Card className="col-span-4">
			<CardHeader>
				<CardTitle>Performance de Envios (Últimos 6 Meses)</CardTitle>
			</CardHeader>
			<CardContent className="pl-2">
				<div className="h-[300px] w-full">
					<ResponsiveContainer height="100%" minWidth={0} width="100%">
						<LineChart
							data={data}
							margin={{
								top: 5,
								right: 10,
								left: 10,
								bottom: 0,
							}}
						>
							<CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
							<XAxis
								axisLine={false}
								dataKey="name"
								fontSize={12}
								stroke="#888888"
								tickLine={false}
							/>
							<YAxis
								axisLine={false}
								fontSize={12}
								stroke="#888888"
								tickFormatter={(value) => `${value}`}
								tickLine={false}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: 'hsl(var(--background))',
									borderColor: 'hsl(var(--border))',
									borderRadius: 'var(--radius)',
								}}
								labelStyle={{ color: 'hsl(var(--foreground))' }}
							/>
							<Legend />
							<Line
								activeDot={{ r: 4 }}
								dataKey="enviados"
								name="Enviados"
								stroke="#3b82f6"
								strokeWidth={2}
								type="monotone"
							/>
							<Line
								activeDot={{ r: 4 }}
								dataKey="abertos"
								name="Abertos"
								stroke="#22c55e"
								strokeWidth={2}
								type="monotone"
							/>
							<Line
								activeDot={{ r: 4 }}
								dataKey="cliques"
								name="Cliques"
								stroke="#eab308"
								strokeWidth={2}
								type="monotone"
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
