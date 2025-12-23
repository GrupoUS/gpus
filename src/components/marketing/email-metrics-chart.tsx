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
					<ResponsiveContainer width="100%" height="100%" minWidth={0}>
						<LineChart
							data={data}
							margin={{
								top: 5,
								right: 10,
								left: 10,
								bottom: 0,
							}}
						>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
							<XAxis
								dataKey="name"
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `${value}`}
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
								type="monotone"
								dataKey="enviados"
								stroke="#3b82f6"
								strokeWidth={2}
								activeDot={{ r: 4 }}
								name="Enviados"
							/>
							<Line
								type="monotone"
								dataKey="abertos"
								stroke="#22c55e"
								strokeWidth={2}
								activeDot={{ r: 4 }}
								name="Abertos"
							/>
							<Line
								type="monotone"
								dataKey="cliques"
								stroke="#eab308"
								strokeWidth={2}
								activeDot={{ r: 4 }}
								name="Cliques"
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
