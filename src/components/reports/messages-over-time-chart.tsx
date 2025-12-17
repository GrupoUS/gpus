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
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={data}>
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
							contentStyle={{
								backgroundColor: 'hsl(var(--card))',
								border: '1px solid hsl(var(--border))',
								borderRadius: '8px',
							}}
						/>
						<Legend />
						<Line
							type="monotone"
							dataKey="messagesReceived"
							stroke="hsl(217, 91%, 60%)"
							strokeWidth={2}
							name="Recebidas"
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="messagesSent"
							stroke="hsl(142, 76%, 36%)"
							strokeWidth={2}
							name="Enviadas"
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
