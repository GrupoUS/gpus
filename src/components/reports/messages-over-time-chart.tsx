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

interface DailyMetric {
	date: string;
	newLeads?: number;
	messagesReceived: number;
	messagesSent: number;
}

interface MessagesOverTimeChartProps {
	data: DailyMetric[];
}

export default function MessagesOverTimeChart({ data }: MessagesOverTimeChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Mensagens ao Longo do Tempo</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer height={300} minWidth={0} width="100%">
					<LineChart data={data}>
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
							labelFormatter={(value: string) => {
								const [year, month, day] = value.split('-');
								return `${day}/${month}/${year}`;
							}}
						/>
						<Legend />
						<Line
							dataKey="messagesReceived"
							dot={false}
							name="Recebidas"
							stroke="hsl(217, 91%, 60%)"
							strokeWidth={2}
							type="monotone"
						/>
						<Line
							dataKey="messagesSent"
							dot={false}
							name="Enviadas"
							stroke="hsl(142, 76%, 36%)"
							strokeWidth={2}
							type="monotone"
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
