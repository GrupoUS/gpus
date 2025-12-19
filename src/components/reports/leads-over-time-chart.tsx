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

interface DailyMetric {
	date: string;
	newLeads: number;
	messagesReceived?: number;
	messagesSent?: number;
}

interface LeadsOverTimeChartProps {
	data: DailyMetric[];
}

export default function LeadsOverTimeChart({ data }: LeadsOverTimeChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Leads ao Longo do Tempo</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300} minWidth={0}>
					<AreaChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							dataKey="date"
							tickFormatter={(value: string) => {
								const [, month, day] = value.split('-');
								return `${day}/${month}`;
							}}
							className="text-xs"
						/>
						<YAxis className="text-xs" />
						<Tooltip
							labelFormatter={(value: string) => {
								const [year, month, day] = value.split('-');
								return `${day}/${month}/${year}`;
							}}
							formatter={(value) => [value as number, 'Novos Leads']}
							contentStyle={{
								backgroundColor: 'hsl(var(--card))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '8px',
							}}
						/>
						<Area
							type="monotone"
							dataKey="newLeads"
							stroke="hsl(262, 83%, 58%)"
							fill="hsl(262, 83%, 58%)"
							fillOpacity={0.2}
							strokeWidth={2}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
