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
				<ResponsiveContainer height={300} minWidth={0} width="100%">
					<AreaChart data={data}>
						<CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
						<XAxis
							className="text-xs"
							dataKey="date"
							tickFormatter={(value: string) => {
								const [, month, day] = value.split('-');
								return `${day}/${month}`;
							}}
						/>
						<YAxis className="text-xs" />
						<Tooltip
							contentStyle={{
								backgroundColor: 'hsl(var(--card))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '8px',
							}}
							formatter={(value) => [value as number, 'Novos Leads']}
							labelFormatter={(value: string) => {
								const [year, month, day] = value.split('-');
								return `${day}/${month}/${year}`;
							}}
						/>
						<Area
							dataKey="newLeads"
							fill="hsl(262, 83%, 58%)"
							fillOpacity={0.2}
							stroke="hsl(262, 83%, 58%)"
							strokeWidth={2}
							type="monotone"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
